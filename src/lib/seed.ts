import type { DatabaseSync } from "node:sqlite";
import {
  addDays,
  isDayScheduled,
  toDateKey,
  MASK_EVERY_DAY,
  MASK_WEEKDAYS,
} from "./utils";

// scrypt("demo1234") — all demo accounts share this password.
const DEMO_HASH =
  "79665af470f735349bd5fb9e1ccbbc04:6c70005e43a830f27b30d225a7799ddd56cc7af4fbdd55b0a6b1c83a2af4e22420661b0bb6deeb11d0017962ecae49ce74d945acd09556def51231a93cfb92d6";

/** Deterministic LCG so the demo history looks the same on every fresh install. */
function makeRng(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function seed(db: DatabaseSync) {
  const existing = db
    .prepare("SELECT COUNT(*) AS n FROM families")
    .get() as { n: number };
  if (existing.n > 0) return;

  db.exec("BEGIN");
  try {
    const familyId = Number(
      db
        .prepare("INSERT INTO families (name, invite_code) VALUES (?, ?)")
        .run("The Rivera Family", "RIVERA24").lastInsertRowid,
    );

    const insertUser = db.prepare(
      `INSERT INTO users (family_id, username, name, role, emoji, color, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    const parentId = Number(
      insertUser.run(familyId, "sam", "Sam", "parent", "🧑‍🦰", "#f97316", DEMO_HASH)
        .lastInsertRowid,
    );
    const alexId = Number(
      insertUser.run(familyId, "alex", "Alex", "kid", "🦊", "#3b82f6", DEMO_HASH)
        .lastInsertRowid,
    );
    const miaId = Number(
      insertUser.run(familyId, "mia", "Mia", "kid", "🐨", "#10b981", DEMO_HASH)
        .lastInsertRowid,
    );

    const insertChore = db.prepare(
      `INSERT INTO chores (family_id, title, emoji, points, days_mask, assignee_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const choreIds: Array<{
      id: number;
      assignee: number;
      points: number;
      title: string;
      rate: number;
      mask: number;
    }> = [];

    const definitions: Array<[string, string, number, number, number, number]> = [
      ["Make your bed", "🛏️", 5, MASK_EVERY_DAY, alexId, 92],
      ["Tidy your room", "📚", 15, MASK_EVERY_DAY, alexId, 74],
      ["Take out the recycling", "🗑️", 10, 0b0001000, alexId, 88],
      ["Feed the dog", "🐕", 5, MASK_EVERY_DAY, miaId, 95],
      ["Load the dishwasher", "🍽️", 10, MASK_EVERY_DAY, miaId, 80],
      ["Water the plants", "🌱", 5, MASK_WEEKDAYS, miaId, 85],
    ];

    for (const [title, emoji, points, mask, assignee, rate] of definitions) {
      const id = Number(
        insertChore.run(familyId, title, emoji, points, mask, assignee)
          .lastInsertRowid,
      );
      choreIds.push({ id, assignee, points, title, rate, mask });
    }

    const insertReward = db.prepare(
      `INSERT INTO rewards (family_id, title, emoji, cost, stock) VALUES (?, ?, ?, ?, ?)`,
    );
    const rewards: Array<[string, string, number, number]> = [
      ["Ice cream trip", "🍦", 50, -1],
      ["Pick the movie", "🎬", 80, -1],
      ["Choose Friday dinner", "🍕", 120, -1],
      ["New comic book", "📕", 200, 3],
    ];
    for (const [title, emoji, cost, stock] of rewards) {
      insertReward.run(familyId, title, emoji, cost, stock);
    }

    // Build ~5 weeks of history so charts and the feed are populated on first run.
    const rng = makeRng(20240613);
    const insertCompletion = db.prepare(
      `INSERT INTO completions (chore_id, user_id, due_date, status, done_at, approved_at, approved_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertLedger = db.prepare(
      `INSERT INTO points_ledger (user_id, amount, reason, kind, ref_id, actor_id, created_at)
       VALUES (?, ?, ?, 'chore', ?, ?, ?)`,
    );

    const today = new Date();
    for (let back = 34; back >= 0; back--) {
      const day = addDays(today, -back);
      const key = toDateKey(day);
      const weekday = day.getDay();

      for (const chore of choreIds) {
        if (!isDayScheduled(chore.mask, weekday)) continue;
        if (rng() * 100 > chore.rate) continue;

        const stamp = `${key} 18:00:00`;
        insertCompletion.run(
          chore.id, chore.assignee, key, "approved", stamp, stamp, parentId,
        );
        insertLedger.run(
          chore.assignee, chore.points, chore.title, chore.id, parentId, stamp,
        );
      }
    }

    const insertBonus = db.prepare(
      `INSERT INTO points_ledger (user_id, amount, reason, kind, ref_id, actor_id, created_at)
       VALUES (?, ?, ?, 'bonus', NULL, ?, ?)`,
    );

    // A couple of manual moments make the feed feel alive.
    const yesterday = toDateKey(addDays(today, -1));
    insertBonus.run(alexId, 10, "Helped without being asked", parentId, `${yesterday} 19:30:00`);
    insertBonus.run(miaId, 5, "Extra tidy-up", parentId, `${yesterday} 20:15:00`);

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
