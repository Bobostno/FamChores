/**
 * Smoke test: checks route protection and role-based access against a running
 * server. Start the dev server first, then:
 *
 *   node scripts/smoke.mjs [baseUrl]
 */
import { SignJWT } from "jose";
import path from "node:path";

// Pick up AUTH_SECRET from .env.local so tokens match the running server.
try {
  process.loadEnvFile(path.join(process.cwd(), ".env.local"));
} catch {
  // No .env.local — fall back to the development secret below.
}

const base = process.argv[2] ?? "http://localhost:3000";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ??
    "dev-only-insecure-family-hub-secret-0123456789abcdef",
);

async function token(uid, fid) {
  return new SignJWT({ fid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(uid))
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

async function status(path, cookie) {
  const res = await fetch(`${base}${path}`, {
    redirect: "manual",
    headers: cookie ? { cookie } : {},
  });
  return { status: res.status, location: res.headers.get("location") };
}

const parent = `fh_session=${await token(1, 1)}`;
const kidAlex = `fh_session=${await token(2, 1)}`;
const kidMia = `fh_session=${await token(3, 1)}`;

let failures = 0;

function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} → ${actual}${ok ? "" : ` (expected ${expected})`}`);
}

function assert(label, condition) {
  if (!condition) failures++;
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
}

// Anonymous users are bounced to /login.
for (const path of ["/dashboard", "/chores", "/members", "/rewards"]) {
  const r = await status(path);
  check(`anon ${path}`, r.status, 307);
  check(`anon ${path} redirect`, r.location, `/login?next=${encodeURIComponent(path)}`);
}
check("anon /login", (await status("/login")).status, 200);

// A parent reaches everything.
for (const path of ["/dashboard", "/chores", "/members", "/rewards"]) {
  check(`parent ${path}`, (await status(path, parent)).status, 200);
}

// A kid is bounced off the parent-only pages.
for (const path of ["/chores", "/members"]) {
  const r = await status(path, kidAlex);
  check(`kid ${path} blocked`, r.status, 307);
  check(`kid ${path} redirect`, r.location, "/dashboard");
}
check("kid /dashboard", (await status("/dashboard", kidAlex)).status, 200);
check("kid /rewards", (await status("/rewards", kidAlex)).status, 200);

// The public landing page is open.
check("anon /", (await status("/")).status, 200);
check("anon /join", (await status("/join")).status, 200);

// A signed-in user skips the auth pages.
check("parent /login", (await status("/login", parent)).status, 307);

// --- Content checks -------------------------------------------------------

async function body(path, cookie) {
  const res = await fetch(`${base}${path}`, { headers: { cookie } });
  return res.text();
}

const parentDash = await body("/dashboard", parent);
assertContains("parent dashboard shows the week chart", parentDash, "This week");
assertContains("parent dashboard shows the leaderboard", parentDash, "Leaderboard");
assertContains("parent dashboard shows seeded chores", parentDash, "Make your bed");
assertContains("parent dashboard names the family", parentDash, "Rivera Family");

const parentChores = await body("/chores", parent);
assertContains("parent chores page renders control centre", parentChores, "Chore control");
assertContains("parent chores page lists chores", parentChores, "Make your bed");

// Kids only ever see their own chores — the seed gives "Make your bed" to Alex.
const miaDash = await body("/dashboard", kidMia);
const miaSeesAlex = miaDash.includes("Make your bed");
check("kid Mia does not see Alex's chores", miaSeesAlex, false);
assertContains("kid Mia does see her own chores", miaDash, "Feed the dog");

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);

function assertContains(label, haystack, needle) {
  assert(label, haystack.includes(needle));
}
