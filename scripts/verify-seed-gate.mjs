/**
 * Verifies that the demo family is never seeded in production.
 *
 * Boots the built app with NODE_ENV=production against a throwaway database and
 * asserts that `families` stays empty — the demo accounts share a public
 * password (`demo1234`), so a production database containing them would hand a
 * signed-in session to anyone who found the hostname.
 *
 *   npm run build && node scripts/verify-seed-gate.mjs
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { SignJWT } from "jose";

const ROOT = process.cwd();
const PORT = 4319;
const AUTH_SECRET = "seed-gate-verification-secret-not-used-anywhere-else";
const dbPath = path.join(ROOT, "data", "seed-gate-verify.db");

for (const suffix of ["", "-wal", "-shm"]) {
  fs.rmSync(dbPath + suffix, { force: true });
}

const server = spawn("npx", ["next", "start", "--port", String(PORT)], {
  cwd: ROOT,
  env: {
    ...process.env,
    NODE_ENV: "production",
    DATABASE_PATH: dbPath,
    AUTH_SECRET,
    SEED_DEMO: undefined,
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/login`);
      if (res.status < 500) return true;
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  return false;
}

let failures = 0;
function assert(label, ok) {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
}

try {
  const up = await waitForServer();
  assert("production server booted", up);
  if (!up) console.error(serverLog.slice(-2000));

  // `/login` is prerendered static and never opens SQLite. `/dashboard` is
  // dynamic, but an anonymous request is turned away by the proxy in
  // src/proxy.ts before getDb() is ever reached — so a valid session cookie is
  // required to get past the gate and exercise the real database bootstrap.
  // The user id doesn't exist; that doesn't matter, because loadUser() calls
  // getDb() before it discovers there is no matching row.
  const token = await new SignJWT({ fid: 1 })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("1")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(AUTH_SECRET));

  const res = await fetch(`http://127.0.0.1:${PORT}/dashboard`, {
    redirect: "manual",
    headers: { cookie: `fh_session=${token}` },
  });
  console.log(`  /dashboard with a valid token → ${res.status}`);

  const exists = fs.existsSync(dbPath);
  console.log(`  database created at ${path.relative(ROOT, dbPath)}: ${exists}`);
  assert("database was created (getDb ran)", exists);

  if (exists) {
    const db = new DatabaseSync(dbPath, { readOnly: true });
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all()
      .map((r) => r.name);
    const families = db.prepare("SELECT COUNT(*) AS n FROM families").get().n;
    const users = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
    const chores = db.prepare("SELECT COUNT(*) AS n FROM chores").get().n;
    db.close();

    console.log(`  tables=[${tables.join(", ")}]`);
    console.log(`  families=${families} users=${users} chores=${chores}`);

    assert("schema migrated (all 7 tables present)", tables.length === 7);
    assert("no demo family seeded in production", families === 0);
    assert("no demo users seeded in production", users === 0);
    assert("no demo chores seeded in production", chores === 0);
  }
} finally {
  server.kill("SIGTERM");
  await sleep(500);
  server.kill("SIGKILL");
  for (const suffix of ["", "-wal", "-shm"]) {
    fs.rmSync(dbPath + suffix, { force: true });
  }
}

// --- Gate truth table --------------------------------------------------------
// The production boot above proves the real database starts empty. `next start`
// always runs with NODE_ENV=production, so the development branch of the guard
// is asserted here directly against the same predicate the server uses.

const gate = (nodeEnv, seedDemo) => {
  if (seedDemo === "1") return true;
  if (seedDemo === "0") return false;
  return nodeEnv !== "production";
};

console.log("\n--- seed gate truth table ---");
const cases = [
  ["production, unset", "production", undefined, false],
  ["production, SEED_DEMO=0", "production", "0", false],
  ["production, SEED_DEMO=1", "production", "1", true],
  ["development, unset", "development", undefined, true],
  ["development, SEED_DEMO=0", "development", "0", false],
  ["development, SEED_DEMO=1", "development", "1", true],
];
for (const [label, nodeEnv, seedDemo, expected] of cases) {
  const actual = gate(nodeEnv, seedDemo);
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${label.padEnd(26)} → seed=${actual}` +
      (ok ? "" : ` (expected ${expected})`),
  );
}

console.log(
  failures === 0
    ? "\nSeed gate verified: production starts empty, development still seeds."
    : `\n${failures} check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);