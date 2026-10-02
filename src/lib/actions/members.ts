"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "../db";
import { requireParent } from "../auth";
import { normalizeUsername, randomInviteCode } from "../ids";
import { hashPassword } from "../password";
import { COLOR_CHOICES, EMOJI_AVATARS } from "../utils";
import type { ActionState } from "../types";

function refresh() {
  revalidatePath("/members");
  revalidatePath("/dashboard");
}

const memberSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(1, "Give them a name").max(30),
  username: z
    .string()
    .trim()
    .min(3, "At least 3 characters")
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
  password: z.string().min(8, "Use at least 8 characters"),
  role: z.enum(["parent", "kid"]),
  emoji: z.string().default(EMOJI_AVATARS[0]),
  color: z.string().default(COLOR_CHOICES[0]),
});

export async function saveMember(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, name, password, role, emoji, color } = parsed.data;
  const username = normalizeUsername(parsed.data.username);
  const db = getDb();
  const safeEmoji = EMOJI_AVATARS.includes(emoji) ? emoji : EMOJI_AVATARS[0];
  const safeColor = COLOR_CHOICES.includes(color) ? color : COLOR_CHOICES[0];

  const taken = db
    .prepare("SELECT family_id FROM users WHERE username = ?")
    .get(username) as { family_id: number } | undefined;
  if (taken && taken.family_id !== parent.familyId) {
    return { error: "That username is taken." };
  }
  if (id) {
    const clash = db
      .prepare("SELECT id FROM users WHERE username = ? AND id != ?")
      .get(username, id);
    if (clash) return { error: "That username is taken." };
  } else if (taken) {
    return { error: "That username is taken." };
  }

  const hash = await hashPassword(password);
  if (id) {
    const target = db
      .prepare("SELECT id FROM users WHERE id = ? AND family_id = ?")
      .get(id, parent.familyId);
    if (!target) return { error: "Member not found." };
    db.prepare(
      `UPDATE users SET name = ?, username = ?, role = ?, emoji = ?, color = ?,
                       password_hash = ?
        WHERE id = ? AND family_id = ?`,
    ).run(name, username, role, safeEmoji, safeColor, hash, id, parent.familyId);
  } else {
    db.prepare(
      `INSERT INTO users (family_id, username, name, role, emoji, color, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(parent.familyId, username, name, role, safeEmoji, safeColor, hash);
  }

  refresh();
  return null;
}

export async function removeMember(memberId: number) {
  const parent = await requireParent();
  if (memberId === parent.id) return;

  const lastParent = getDb()
    .prepare(
      `SELECT COUNT(*) AS n FROM users WHERE family_id = ? AND role = 'parent'`,
    )
    .get(parent.familyId) as { n: number };
  const target = getDb()
    .prepare("SELECT role FROM users WHERE id = ? AND family_id = ?")
    .get(memberId, parent.familyId) as { role: string } | undefined;
  if (!target) return;
  if (target.role === "parent" && lastParent.n <= 1) {
    return;
  }

  getDb().prepare("DELETE FROM users WHERE id = ? AND family_id = ?").run(memberId, parent.familyId);
  refresh();
}

/** Clears a member's history entirely and unassigns their chores. */
export async function resetMemberPoints(memberId: number) {
  const parent = await requireParent();
  const db = getDb();
  const target = db
    .prepare("SELECT id FROM users WHERE id = ? AND family_id = ?")
    .get(memberId, parent.familyId);
  if (!target) return;

  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM points_ledger WHERE user_id = ?").run(memberId);
    db.prepare("DELETE FROM completions WHERE user_id = ?").run(memberId);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  refresh();
}

export async function adjustPoints(
  memberId: number,
  amount: number,
  reason: string,
  kind: "bonus" | "penalty",
) {
  const actor = await requireParent();
  if (!Number.isFinite(amount) || amount === 0) return;

  const db = getDb();
  const target = db
    .prepare("SELECT id FROM users WHERE id = ? AND family_id = ?")
    .get(memberId, actor.familyId);
  if (!target) return;

  db.prepare(
    `INSERT INTO points_ledger (user_id, amount, reason, kind, actor_id)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(memberId, amount, reason || (kind === "bonus" ? "Bonus" : "Deduction"), kind, actor.id);

  refresh();
}

export async function regenerateInviteCode() {
  const parent = await requireParent();
  getDb()
    .prepare("UPDATE families SET invite_code = ? WHERE id = ?")
    .run(randomInviteCode(), parent.familyId);
  refresh();
}
