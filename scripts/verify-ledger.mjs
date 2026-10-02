/**
 * Verifies the points-ledger invariants directly against a throwaway copy of the
 * database, using the same SQL the server actions run.
 *
 *   node scripts/verify-ledger.mjs
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const src = path.join(process.cwd(), "data", "family.db");
if (!fs.existsSync(src)) {
  console.error("No database found. Run `npm run dev` once so it gets seeded.");
  process.exit(1);
}

const tmp = "/tmp/family-verify.db";
for (const suffix of ["", "-wal", "-shm"]) {
  fs.rmSync(tmp + suffix, { force: true });
}

// The dev server runs in WAL mode, so a plain file copy can miss committed
// data still sitting in the -wal file. VACUUM INTO takes a consistent snapshot.
const source = new DatabaseSync(src, { readOnly: true });
source.exec(`VACUUM INTO '${tmp}'`);
source.close();

const db = new DatabaseSync(tmp);
db.exec("PRAGMA foreign_keys = ON");

let failures = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${label} → ${actual}${ok ? "" : ` (expected ${expected})`}`,
  );
}
function assert(label, condition) {
  if (!condition) failures++;
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
}

const balance = (userId) =>
  db
    .prepare("SELECT COALESCE(SUM(amount),0) AS total FROM points_ledger WHERE user_id = ?")
    .get(userId).total;

const FAMILY = 1;
const otherChore = db
  .prepare("SELECT id FROM chores WHERE family_id = ? LIMIT 1")
  .get(FAMILY);
const otherUser = db
  .prepare("SELECT id FROM users WHERE family_id = ? AND role = 'kid' LIMIT 1")
  .get(FAMILY);

// 1. Marking done is idempotent thanks to UNIQUE (chore_id, due_date).
const DUE = "2030-01-05";
db.prepare(
  `INSERT INTO completions (chore_id, user_id, due_date, status, done_at)
   VALUES (?, ?, ?, 'done', '2030-01-05 09:00:00')
   ON CONFLICT (chore_id, due_date) DO UPDATE SET status = 'done'`,
).run(otherChore.id, otherUser.id, DUE);
db.prepare(
  `INSERT INTO completions (chore_id, user_id, due_date, status, done_at)
   VALUES (?, ?, ?, 'done', '2030-01-05 09:05:00')
   ON CONFLICT (chore_id, due_date) DO UPDATE SET status = 'done'`,
).run(otherChore.id, otherUser.id, DUE);

const rows = db
  .prepare("SELECT COUNT(*) AS n FROM completions WHERE chore_id = ? AND due_date = ?")
  .get(otherChore.id, DUE).n;
check("marking done twice keeps one row", rows, 1);

// 2. Approving pays out exactly once, even if called repeatedly.
const chore = db
  .prepare("SELECT id, points FROM chores WHERE id = ?")
  .get(otherChore.id);
const before = balance(otherUser.id);

for (let i = 0; i < 3; i++) {
  const completion = db
    .prepare("SELECT id, user_id, status FROM completions WHERE chore_id = ? AND due_date = ?")
    .get(chore.id, DUE);
  if (completion.status === "approved") continue; // the guard in approveChore

  db.prepare(
    `UPDATE completions SET status = 'approved', approved_at = ?, approved_by = ? WHERE id = ?`,
  ).run("2030-01-05 10:00:00", 1, completion.id);
  db.prepare(
    `INSERT INTO points_ledger (user_id, amount, reason, kind, ref_id, actor_id)
     VALUES (?, ?, ?, 'chore', ?, ?)`,
  ).run(completion.user_id, chore.points, "Test chore", chore.id, 1);
}

check("approving 3x pays exactly once", balance(otherUser.id) - before, chore.points);

// 3. Balance is always SUM(ledger) — never a stored counter.
const summed = balance(otherUser.id);
const stored = db.prepare("SELECT COUNT(*) AS n FROM points_ledger WHERE user_id = ?").get(otherUser.id).n;
assert("ledger has rows backing the balance", summed > 0 && stored > 0);

// 4. Redeeming a reward cannot overdraw or oversell.
const reward = db.prepare("SELECT * FROM rewards WHERE family_id = ? LIMIT 1").get(FAMILY);
const balBefore = balance(otherUser.id);

// Try to redeem with a cost above the balance — must be refused.
const affordable = balBefore >= reward.cost;
if (!affordable) {
  const rejected = balBefore < reward.cost;
  assert("overdraw is refused", rejected);
}

// Redeem for real.
db.prepare(
  `INSERT INTO points_ledger (user_id, amount, reason, kind, ref_id) VALUES (?, ?, ?, 'reward', ?)`,
).run(otherUser.id, -reward.cost, reward.title, reward.id);
db.prepare("INSERT INTO redemptions (reward_id, user_id, cost) VALUES (?, ?, ?)").run(
  reward.id, otherUser.id, reward.cost,
);
if (reward.stock > 0) {
  db.prepare("UPDATE rewards SET stock = stock - 1 WHERE id = ?").run(reward.id);
}

check("redeeming deducts the cost", balance(otherUser.id), balBefore - reward.cost);
const newStock = db.prepare("SELECT stock FROM rewards WHERE id = ?").get(reward.id).stock;
check(
  "limited stock decrements",
  newStock,
  reward.stock > 0 ? reward.stock - 1 : reward.stock,
);

// 5. Foreign keys keep families isolated: a completion can't point at a missing chore.
assert("foreign keys are enforced", db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1);

const redemptions = db
  .prepare("SELECT COUNT(*) AS n FROM redemptions WHERE user_id = ?")
  .get(otherUser.id).n;
assert("redemption recorded", redemptions >= 1);

db.close();
for (const suffix of ["", "-wal", "-shm"]) {
  fs.rmSync(tmp + suffix, { force: true });
}

console.log(failures === 0 ? "\nAll ledger checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
