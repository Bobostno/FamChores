/**
 * Dev utility: mint a session cookie so you can browse the authenticated pages
 * with curl. Mirrors the dev fallback secret in `src/lib/session.ts`.
 *
 *   node scripts/mint-dev-token.mjs <userId> <familyId>
 */
import { SignJWT } from "jose";
import path from "node:path";

// Pick up AUTH_SECRET from .env.local so tokens match the running server.
try {
  process.loadEnvFile(path.join(process.cwd(), ".env.local"));
} catch {
  // No .env.local — fall back to the development secret below.
}

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ??
    "dev-only-insecure-family-hub-secret-0123456789abcdef",
);

const uid = Number(process.argv[2] ?? 1);
const fid = Number(process.argv[3] ?? 1);

const token = await new SignJWT({ fid })
  .setProtectedHeader({ alg: "HS256" })
  .setSubject(String(uid))
  .setIssuedAt()
  .setExpirationTime("30d")
  .sign(secret);

console.log(token);
