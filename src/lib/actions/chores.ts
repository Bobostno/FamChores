"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "../db";
import { requireParent, requireUser } from "../auth";
import { todayKey } from "../utils";
import type { ActionState } from "../types";

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/chores");
}

type ChoreRow = {
  id: number;
  family_id: number;
  assignee_id: number | null;
  points: number;
  title: string;
};

/** Every mutation is scoped to the caller's family — never trust an id alone. */
function choreForFamily(choreId: number, familyId: number): ChoreRow | null {
  const row = getDb()
    .prepare(
      `SELECT id, family_id, assignee_id, points, title FROM chores
        WHERE id = ? AND family_id = ?`,
    )
    .get(choreId, familyId) as ChoreRow | undefined;
  return row ?? null;
}

function nowStamp(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

export async function markChoreDone(choreId: number, dateKey: string) {
  const user = await requireUser();
  const chore = choreForFamily(choreId, user.familyId);
  if (!chore) return;

  // Kids only ever touch their own chores, and only for today.
  if (user.role === "kid" && chore.assignee_id !== user.id) return;
  if (user.role === "kid" && dateKey !== todayKey()) return;

  const userId = chore.assignee_id ?? user.id;
  getDb()
    .prepare(
      `INSERT INTO completions (chore_id, user_id, due_date, status, done_at)
       VALUES (?, ?, ?, 'done', ?)
       ON CONFLICT (chore_id, due_date) DO UPDATE
         SET status = 'done', done_at = excluded.done_at`,
    )
    .run(choreId, userId, dateKey, nowStamp());

  refresh();
}

export async function undoChoreDone(choreId: number, dateKey: string) {
  const user = await requireUser();
  const chore = choreForFamily(choreId, user.familyId);
  if (!chore) return;
  if (user.role === "kid" && chore.assignee_id !== user.id) return;

  getDb()
    .prepare("DELETE FROM completions WHERE chore_id = ? AND due_date = ? AND status = 'done'")
    .run(choreId, dateKey);

  refresh();
}

export async function approveChore(choreId: number, dateKey: string) {
  const user = await requireParent();
  const chore = choreForFamily(choreId, user.familyId);
  if (!chore) return;

  const db = getDb();
  const completion = db
    .prepare("SELECT id, user_id, status FROM completions WHERE chore_id = ? AND due_date = ?")
    .get(choreId, dateKey) as
    | { id: number; user_id: number; status: string }
    | undefined;
  if (!completion) return;

  // Approving twice must not pay out twice.
  if (completion.status === "approved") return;

  const stamp = nowStamp();
  db.exec("BEGIN");
  try {
    db.prepare(
      `UPDATE completions
          SET status = 'approved', approved_at = ?, approved_by = ?
        WHERE id = ?`,
    ).run(stamp, user.id, completion.id);

    db.prepare(
      `INSERT INTO points_ledger (user_id, amount, reason, kind, ref_id, actor_id)
       VALUES (?, ?, ?, 'chore', ?, ?)`,
    ).run(completion.user_id, chore.points, chore.title, choreId, user.id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  refresh();
}

export async function rejectChore(choreId: number, dateKey: string) {
  const user = await requireParent();
  if (!choreForFamily(choreId, user.familyId)) return;
  getDb()
    .prepare("DELETE FROM completions WHERE chore_id = ? AND due_date = ? AND status = 'done'")
    .run(choreId, dateKey);
  refresh();
}

const choreSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  title: z.string().trim().min(1, "Give the chore a name").max(60),
  emoji: z.string().min(1),
  points: z.coerce.number().int().min(1, "At least 1 point").max(100),
  daysMask: z.coerce.number().int().min(1, "Pick at least one day").max(127),
  assigneeId: z.coerce.number().int().positive().nullable(),
});

export async function saveChore(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireParent();
  const parsed = choreSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    emoji: formData.get("emoji"),
    points: formData.get("points"),
    daysMask: formData.get("daysMask"),
    assigneeId: formData.get("assigneeId") || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, title, emoji, points, daysMask, assigneeId } = parsed.data;
  const db = getDb();

  if (assigneeId) {
    const owner = db
      .prepare("SELECT 1 AS x FROM users WHERE id = ? AND family_id = ?")
      .get(assigneeId, user.familyId);
    if (!owner) return { error: "Pick someone from your family." };
  }

  if (id) {
    if (!choreForFamily(id, user.familyId)) return { error: "Chore not found." };
    db.prepare(
      `UPDATE chores SET title = ?, emoji = ?, points = ?, days_mask = ?, assignee_id = ?
        WHERE id = ? AND family_id = ?`,
    ).run(title, emoji, points, daysMask, assigneeId, id, user.familyId);
  } else {
    db.prepare(
      `INSERT INTO chores (family_id, title, emoji, points, days_mask, assignee_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(user.familyId, title, emoji, points, daysMask, assigneeId);
  }

  refresh();
  return null;
}

export async function toggleChoreActive(choreId: number) {
  const user = await requireParent();
  if (!choreForFamily(choreId, user.familyId)) return;
  getDb()
    .prepare("UPDATE chores SET active = 1 - active WHERE id = ? AND family_id = ?")
    .run(choreId, user.familyId);
  refresh();
}

export async function deleteChore(choreId: number) {
  const user = await requireParent();
  if (!choreForFamily(choreId, user.familyId)) return;
  getDb().prepare("DELETE FROM chores WHERE id = ? AND family_id = ?").run(choreId, user.familyId);
  refresh();
}
