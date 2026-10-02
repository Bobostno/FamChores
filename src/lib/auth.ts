import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import {
  SESSION_COOKIE,
  verifySessionToken,
  type SessionPayload,
} from "./session";
import type { CurrentUser } from "./types";

/** Resolves the signed-in user, or null. Always re-reads the DB for role. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  return loadUser(payload);
}

/** Same as `getCurrentUser` but for use inside proxy, which cannot hit the DB. */
export async function getSessionPayload(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

function loadUser(payload: SessionPayload): CurrentUser | null {
  const row = getDb()
    .prepare(
      `SELECT u.id, u.family_id, u.username, u.name, u.role, u.emoji, u.color,
              f.name AS family_name
         FROM users u
         JOIN families f ON f.id = u.family_id
        WHERE u.id = ? AND u.family_id = ?`,
    )
    .get(payload.uid, payload.fid) as
    | {
        id: number;
        family_id: number;
        username: string;
        name: string;
        role: "parent" | "kid";
        emoji: string;
        color: string;
        family_name: string;
      }
    | undefined;

  if (!row) return null;
  return {
    id: row.id,
    familyId: row.family_id,
    familyName: row.family_name,
    username: row.username,
    name: row.name,
    role: row.role,
    emoji: row.emoji,
    color: row.color,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireParent(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "parent") redirect("/dashboard");
  return user;
}
