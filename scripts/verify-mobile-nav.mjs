/**
 * Verifies the phone navigation: the bottom tab bar renders with the right tabs
 * for each role, the desktop pill nav is hidden on small screens (and vice
 * versa), and the active tab is announced to screen readers.
 *
 *   npm run build && node scripts/verify-mobile-nav.mjs
 *
 * Uses the local demo database, so run `npm run dev` once first to seed it.
 */
import { spawn } from "node:child_process";
import { SignJWT } from "jose";
import path from "node:path";

const ROOT = process.cwd();
const PORT = 4333;
const BASE = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Pick up AUTH_SECRET from .env.local so tokens match the running server.
try {
  process.loadEnvFile(path.join(ROOT, ".env.local"));
} catch {
  // no .env.local — fall back to the development secret
}
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ??
    "dev-only-insecure-family-hub-secret-0123456789abcdef",
);

async function token(uid, fid) {
  return new SignJWT({ fid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(uid))
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

const srv = spawn("npx", ["next", "start", "--port", String(PORT)], {
  cwd: ROOT,
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
srv.stdout.on("data", (d) => (log += d));
srv.stderr.on("data", (d) => (log += d));

let failures = 0;
const assert = (label, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

try {
  let up = false;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${BASE}/login`);
      if (r.status < 500) { up = true; break; }
    } catch { /* wait */ }
    await sleep(500);
  }
  assert("server booted", up);
  if (!up) { console.error(log.slice(-1200)); process.exit(1); }

  const get = async (p, uid, fid) =>
    (
      await fetch(`${BASE}${p}`, {
        headers: { cookie: `fh_session=${await token(uid, fid)}` },
      })
    ).text();

  // --- parent: all four tabs ---
  const parent = await get("/dashboard", 1, 1);
  assert("parent tab bar renders", parent.includes("fixed inset-x-0 bottom-0"));
  for (const label of ["Dashboard", "Chores", "Rewards", "Members"]) {
    assert(`parent sees "${label}" tab`, parent.includes(`>${label}<`));
  }

  // --- kid: three tabs, no Members ---
  const kid = await get("/dashboard", 2, 1);
  assert("kid tab bar renders", kid.includes("fixed inset-x-0 bottom-0"));
  assert("kid sees Dashboard", kid.includes(">Dashboard<"));
  assert("kid does NOT see Members tab", !kid.includes(">Members<"));

  // --- desktop pill nav is hidden on phones, shown from sm up ---
  assert(
    "desktop pill nav hidden below sm",
    /class="hidden items-center gap-1 overflow-x-auto sm:flex"/.test(parent),
  );

  // --- tab bar is hidden on desktop ---
  assert(
    "mobile tab bar hidden from sm up",
    parent.includes("bottom-0 z-40 border-t border-line/60 bg-ink/90 backdrop-blur-xl sm:hidden"),
  );

  // --- active tab is marked for screen readers ---
  assert('active tab has aria-current="page"', parent.includes('aria-current="page"'));

  // --- content clears the fixed bar ---
  assert("main has bottom padding for the tab bar", parent.includes("pb-24 sm:pb-7"));

  // --- badge on the Chores tab ---
  // The badge only renders when a parent has something awaiting approval, so
  // mark a chore done first and assert the tab picks the count up. This reuses
  // the existing demo database and is reverted afterwards.
  const { DatabaseSync } = await import("node:sqlite");
  const dbPath = path.join(ROOT, "data", "family.db");
  const db = new DatabaseSync(dbPath);
  const chore = db
    .prepare("SELECT id, assignee_id FROM chores WHERE family_id = 1 LIMIT 1")
    .get();
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  db.prepare(
    `INSERT INTO completions (chore_id, user_id, due_date, status, done_at)
     VALUES (?, ?, ?, 'done', ?)
     ON CONFLICT (chore_id, due_date)
     DO UPDATE SET status = 'done'`,
  ).run(chore.id, chore.assignee_id ?? 2, dateKey, `${dateKey} 09:00:00`);

  const withBadge = await get("/dashboard", 1, 1);
  assert(
    "approval badge appears on the Chores tab",
    /bg-accent px-1 text-\[10px\]/.test(withBadge),
  );

  // Kids must never see an approvals badge — it's parent-only information.
  const kidWithBadge = await get("/dashboard", 2, 1);
  assert(
    "kid never sees the approval badge",
    !/bg-accent px-1 text-\[10px\]/.test(kidWithBadge),
  );

  db.prepare(
    "DELETE FROM completions WHERE chore_id = ? AND due_date = ?",
  ).run(chore.id, dateKey);
  db.close();

  // --- 44px touch targets ---
  assert("sign-out button is 44px on mobile", parent.includes("size-11") && parent.includes("sm:size-9"));
} finally {
  srv.kill("SIGTERM");
  await sleep(400);
  srv.kill("SIGKILL");
}

console.log(failures === 0 ? "\nMobile nav verified." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);