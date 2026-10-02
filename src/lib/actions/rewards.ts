"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "../db";
import { requireParent, requireUser } from "../auth";
import type { ActionState } from "../types";

function refresh() {
  revalidatePath("/rewards");
  revalidatePath("/dashboard");
}

const rewardSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  title: z.string().trim().min(1, "Name the reward").max(60),
  emoji: z.string().min(1),
  cost: z.coerce.number().int().min(1, "At least 1 point").max(100000),
  stock: z.coerce.number().int().min(-1, "Use -1 for unlimited").max(9999),
});

export async function saveReward(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const parsed = rewardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, title, emoji, cost, stock } = parsed.data;
  const db = getDb();

  if (id) {
    const target = db
      .prepare("SELECT id FROM rewards WHERE id = ? AND family_id = ?")
      .get(id, parent.familyId);
    if (!target) return { error: "Reward not found." };
    db.prepare(
      "UPDATE rewards SET title = ?, emoji = ?, cost = ?, stock = ? WHERE id = ? AND family_id = ?",
    ).run(title, emoji, cost, stock, id, parent.familyId);
  } else {
    db.prepare(
      "INSERT INTO rewards (family_id, title, emoji, cost, stock) VALUES (?, ?, ?, ?, ?)",
    ).run(parent.familyId, title, emoji, cost, stock);
  }

  refresh();
  return null;
}

export async function toggleRewardActive(rewardId: number) {
  const parent = await requireParent();
  getDb()
    .prepare("UPDATE rewards SET active = 1 - active WHERE id = ? AND family_id = ?")
    .run(rewardId, parent.familyId);
  refresh();
}

export async function deleteReward(rewardId: number) {
  const parent = await requireParent();
  getDb()
    .prepare("DELETE FROM rewards WHERE id = ? AND family_id = ?")
    .run(rewardId, parent.familyId);
  refresh();
}

export async function redeemReward(rewardId: number) {
  const user = await requireUser();
  const db = getDb();
  const reward = db
    .prepare(
      "SELECT id, title, cost, stock, active FROM rewards WHERE id = ? AND family_id = ?",
    )
    .get(rewardId, user.familyId) as
    | { id: number; title: string; cost: number; stock: number; active: number }
    | undefined;

  if (!reward || reward.active !== 1) return;

  const balance = (
    db
      .prepare(
        "SELECT COALESCE(SUM(amount), 0) AS total FROM points_ledger WHERE user_id = ?",
      )
      .get(user.id) as { total: number }
  ).total;

  if (balance < reward.cost) return;
  if (reward.stock === 0) return;

  db.exec("BEGIN");
  try {
    db.prepare(
      "INSERT INTO points_ledger (user_id, amount, reason, kind, ref_id) VALUES (?, ?, ?, 'reward', ?)",
    ).run(user.id, -reward.cost, reward.title, reward.id);

    db.prepare(
      "INSERT INTO redemptions (reward_id, user_id, cost) VALUES (?, ?, ?)",
    ).run(reward.id, user.id, reward.cost);

    if (reward.stock > 0) {
      db.prepare("UPDATE rewards SET stock = stock - 1 WHERE id = ?").run(reward.id);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  refresh();
}
