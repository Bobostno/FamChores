"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "../db";
import { hashPassword, verifyPassword } from "../password";
import { normalizeUsername, randomInviteCode } from "../ids";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "../session";
import { COLOR_CHOICES, EMOJI_AVATARS } from "../utils";
import type { ActionState } from "../types";

async function establishSession(uid: number, fid: number) {
  const token = await createSessionToken({ uid, fid });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
}

function usernameTaken(username: string): boolean {
  const row = getDb()
    .prepare("SELECT 1 AS x FROM users WHERE username = ?")
    .get(username);
  return Boolean(row);
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

const signInSchema = z.object({
  username: z.string().min(1, "Enter your username"),
  password: z.string().min(1, "Enter your password"),
});

export async function signIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const username = normalizeUsername(parsed.data.username);
  const user = getDb()
    .prepare("SELECT id, family_id, password_hash FROM users WHERE username = ?")
    .get(username) as
    | { id: number; family_id: number; password_hash: string }
    | undefined;

  if (!user) return { error: "No account found with that username." };
  if (!(await verifyPassword(parsed.data.password, user.password_hash))) {
    return { error: "That password doesn't look right." };
  }

  await establishSession(user.id, user.family_id);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

const accountFields = {
  name: z.string().trim().min(1, "Tell us your name").max(30),
  username: z
    .string()
    .trim()
    .min(3, "At least 3 characters")
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
  password: z.string().min(8, "Use at least 8 characters"),
};

const createFamilySchema = z.object({
  familyName: z.string().trim().min(2, "Give your family a name").max(40),
  ...accountFields,
});

export async function createFamily(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createFamilySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { familyName, name, password } = parsed.data;
  const username = normalizeUsername(parsed.data.username);
  if (usernameTaken(username)) return { error: "That username is taken." };

  const db = getDb();
  const hash = await hashPassword(password);
  let userId = 0;
  let familyId = 0;

  db.exec("BEGIN");
  try {
    familyId = Number(
      db
        .prepare("INSERT INTO families (name, invite_code) VALUES (?, ?)")
        .run(familyName, randomInviteCode()).lastInsertRowid,
    );
    userId = Number(
      db
        .prepare(
          `INSERT INTO users (family_id, username, name, role, emoji, color, password_hash)
           VALUES (?, ?, ?, 'parent', ?, ?, ?)`,
        )
        .run(familyId, username, name, EMOJI_AVATARS[0], COLOR_CHOICES[0], hash)
        .lastInsertRowid,
    );
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  await establishSession(userId, familyId);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

const joinSchema = z.object({
  inviteCode: z.string().trim().min(1, "Enter your family's invite code"),
  role: z.enum(["parent", "kid"]),
  emoji: z.string().default(EMOJI_AVATARS[0]),
  color: z.string().default(COLOR_CHOICES[0]),
  ...accountFields,
});

export async function joinFamily(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = joinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { inviteCode, role, name, password } = parsed.data;
  const username = normalizeUsername(parsed.data.username);

  const family = getDb()
    .prepare("SELECT id FROM families WHERE invite_code = ?")
    .get(inviteCode.trim().toUpperCase()) as { id: number } | undefined;
  if (!family) return { error: "We couldn't find a family with that code." };
  if (usernameTaken(username)) return { error: "That username is taken." };

  const hash = await hashPassword(password);
  const userId = Number(
    getDb()
      .prepare(
        `INSERT INTO users (family_id, username, name, role, emoji, color, password_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        family.id,
        username,
        name,
        role,
        EMOJI_AVATARS.includes(parsed.data.emoji) ? parsed.data.emoji : EMOJI_AVATARS[0],
        COLOR_CHOICES.includes(parsed.data.color) ? parsed.data.color : COLOR_CHOICES[0],
        hash,
      ).lastInsertRowid,
  );

  await establishSession(userId, family.id);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
