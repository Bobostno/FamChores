/**
 * Verifies the installable-web-app surface: the manifest is served with the
 * right shape, every icon it references actually resolves, and the <head> tags
 * that Android and iOS need for "Add to Home Screen" are present.
 *
 *   npm run build && node scripts/verify-manifest.mjs
 *
 * A silently broken manifest still produces a valid-looking app, so this is
 * worth checking after any change to manifest.ts or the icon pipeline.
 */
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const PORT = 4330;
const BASE = `http://127.0.0.1:${PORT}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn("npx", ["next", "start", "--port", String(PORT)], {
  cwd: ROOT,
  stdio: ["ignore", "pipe", "pipe"],
});

let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

let failures = 0;
function assert(label, ok, detail = "") {
  if (!ok) failures++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`,
  );
}

try {
  let up = false;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${BASE}/login`);
      if (r.status < 500) {
        up = true;
        break;
      }
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  assert("server booted", up);
  if (!up) {
    console.error(serverLog.slice(-1500));
    process.exit(1);
  }

  const manifestRes = await fetch(`${BASE}/manifest.webmanifest`);
  assert("manifest served", manifestRes.ok, `HTTP ${manifestRes.status}`);
  assert(
    "manifest content-type",
    (manifestRes.headers.get("content-type") || "").includes("json"),
    manifestRes.headers.get("content-type") || "(none)",
  );

  const manifest = await manifestRes.json();
  assert("display is standalone", manifest.display === "standalone", manifest.display);
  assert("start_url is /dashboard", manifest.start_url === "/dashboard", manifest.start_url);
  assert(
    "theme colour matches app chrome",
    manifest.theme_color === "#0a0912",
    manifest.theme_color,
  );
  assert("background colour set", !!manifest.background_color, manifest.background_color);
  assert("scope is /", manifest.scope === "/", manifest.scope);
  assert("has 3 icons", manifest.icons?.length === 3, `got ${manifest.icons?.length}`);
  assert(
    "includes a maskable icon",
    manifest.icons?.some((i) => i.purpose === "maskable"),
  );

  // Every icon the manifest advertises must actually resolve, or the installed
  // app gets a blank or generic launcher icon.
  for (const icon of manifest.icons ?? []) {
    const name = icon.src.replace(/^\//, "");
    const r = await fetch(`${BASE}/${name}`);
    assert(
      `icon ${name}`,
      r.ok && Number(r.headers.get("content-length") ?? "1") > 0,
      `HTTP ${r.status}`,
    );
  }
  const apple = await fetch(`${BASE}/apple-touch-icon.png`);
  assert("apple-touch-icon served", apple.ok, `HTTP ${apple.status}`);

  const html = await (await fetch(`${BASE}/login`)).text();
  assert("viewport-fit=cover present", html.includes("viewport-fit=cover"));
  assert("manifest link tag present", /rel="manifest"/.test(html));
  assert("apple-touch-icon link present", /rel="apple-touch-icon"/.test(html));
  // Next serialises appleWebApp.capable as `mobile-web-app-capable` (the modern
  // spelling) plus the title/status-bar variants — iOS honours either.
  assert(
    "web-app-capable meta present",
    /name="(apple-)?mobile-web-app-capable"/.test(html),
  );
  assert(
    "apple web-app title present",
    /name="apple-mobile-web-app-title"/.test(html),
  );
  assert("theme-color meta present", /name="theme-color"/.test(html));
} finally {
  server.kill("SIGTERM");
  await sleep(400);
  server.kill("SIGKILL");
}

console.log(
  failures === 0
    ? "\nManifest and icons verified."
    : `\n${failures} check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);