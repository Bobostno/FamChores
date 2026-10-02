/**
 * Renders the PWA icon set from the SVG masters in public/.
 *
 * The PNGs are committed so a plain `npm run build` needs no image tooling, but
 * they're generated output — edit public/icon-source.svg (or
 * public/icon-maskable.svg) and re-run this rather than editing the PNGs.
 *
 *   npm run icons
 *
 * Requires rsvg-convert or ImageMagick's `convert` on PATH.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");

const JOBS = [
  { svg: "icon-source.svg", out: "icon-192.png", size: 192 },
  { svg: "icon-source.svg", out: "icon-512.png", size: 512 },
  { svg: "icon-source.svg", out: "apple-touch-icon.png", size: 180 },
  { svg: "icon-maskable.svg", out: "icon-maskable-512.png", size: 512 },
];

function render(svgPath, pngPath, size) {
  const args =
    which("rsvg-convert") !== null
      ? ["-w", String(size), "-h", String(size), svgPath, "-o", pngPath]
      : ["-background", "none", "-density", "600", svgPath, "-resize", `${size}x${size}`, pngPath];

  execFileSync(which("rsvg-convert") !== null ? "rsvg-convert" : "convert", args, {
    stdio: "inherit",
  });
}

function which(bin) {
  try {
    execFileSync("command", ["-v", bin], { stdio: "ignore", shell: "/bin/sh" });
    return bin;
  } catch {
    try {
      execFileSync("sh", ["-c", `command -v ${bin}`], { stdio: "ignore" });
      return bin;
    } catch {
      return null;
    }
  }
}

if (which("rsvg-convert") === null && which("convert") === null) {
  console.error("Neither rsvg-convert nor ImageMagick's convert was found on PATH.");
  console.error("Install librsvg (rsvg-convert) or ImageMagick, then re-run.");
  process.exit(1);
}

for (const { svg, out, size } of JOBS) {
  const svgPath = path.join(PUBLIC, svg);
  const pngPath = path.join(PUBLIC, out);
  if (!fs.existsSync(svgPath)) {
    console.error(`Missing source: public/${svg}`);
    process.exit(1);
  }
  render(svgPath, pngPath, size);
  console.log(`  ${out.padEnd(26)} ${size}x${size}`);
}

console.log(`\nWrote ${JOBS.length} icons to public/.`);