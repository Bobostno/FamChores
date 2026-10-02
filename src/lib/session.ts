import { SignJWT, jwtVerify } from "jose";

// NOTE: this module must stay free of Node built-ins and database imports so it
// can also be loaded by `proxy.ts`, which runs in a restricted runtime.
export const SESSION_COOKIE = "fh_session";
const SESSION_DAYS = 30;

export type SessionPayload = {
  uid: number;
  fid: number;
};

function getSecret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (value) return new TextEncoder().encode(value);
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production");
  }
  return new TextEncoder().encode(
    "dev-only-insecure-family-hub-secret-0123456789abcdef",
  );
}

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({ fid: payload.fid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.uid))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const uid = Number(payload.sub);
    const fid = Number(payload.fid);
    if (!Number.isInteger(uid) || !Number.isInteger(fid)) return null;
    return { uid, fid };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_DAYS * 24 * 60 * 60,
  secure: process.env.NODE_ENV === "production",
} as const;
