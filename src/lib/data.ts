import { getDb } from "./db";
import { fromDateKey, toDateKey, addDays, todayKey } from "./utils";
import type {
  ChartCell,
  LeaderboardRow,
  LedgerEntry,
  Member,
  Reward,
  Chore,
} from "./types";

export function getMembers(familyId: number): Member[] {
  const rows = getDb()
    .prepare(
      `SELECT id, username, name, role, emoji, color FROM users
        WHERE family_id = ? ORDER BY role ASC, name ASC`,
    )
    .all(familyId) as Array<{
    id: number;
    username: string;
    name: string;
    role: "parent" | "kid";
    emoji: string;
    color: string;
  }>;
  // `node:sqlite` returns null-prototype rows, which cannot be passed to Client
  // Components — always rebuild them as plain objects.
  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    name: r.name,
    role: r.role,
    emoji: r.emoji,
    color: r.color,
  }));
}

export function getChores(familyId: number): Chore[] {
  const rows = getDb()
    .prepare(
      `SELECT id, title, emoji, points, days_mask, assignee_id, active
         FROM chores WHERE family_id = ? ORDER BY active DESC, points DESC, id ASC`,
    )
    .all(familyId) as Array<{
    id: number;
    title: string;
    emoji: string;
    points: number;
    days_mask: number;
    assignee_id: number | null;
    active: number;
  }>;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    emoji: r.emoji,
    points: r.points,
    daysMask: r.days_mask,
    assigneeId: r.assignee_id,
    active: r.active,
  }));
}

export function getRewards(familyId: number): Reward[] {
  const rows = getDb()
    .prepare(
      `SELECT id, title, emoji, cost, stock, active FROM rewards
        WHERE family_id = ? ORDER BY cost ASC`,
    )
    .all(familyId) as Array<{
    id: number;
    title: string;
    emoji: string;
    cost: number;
    stock: number;
    active: number;
  }>;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    emoji: r.emoji,
    cost: r.cost,
    stock: r.stock,
    active: r.active,
  }));
}

/**
 * Chores scheduled on a given day, joined with any completion record.
 * Kids only ever see their own chores.
 */
export function getChoresForDay(
  familyId: number,
  dateKey: string,
  viewer: { id: number; role: "parent" | "kid" },
): ChartCell[] {
  const weekdayBit = 1 << fromDateKey(dateKey).getDay();
  const restrictToMember = viewer.role === "kid";
  const rows = getDb()
    .prepare(
      `SELECT c.id, c.title, c.emoji, c.points, c.days_mask, c.assignee_id, c.active,
              COALESCE(cp.status, 'open') AS status, cp.done_at, cp.approved_at
         FROM chores c
         LEFT JOIN completions cp
           ON cp.chore_id = c.id AND cp.due_date = ?
        WHERE c.family_id = ?
          AND c.active = 1
          AND (c.days_mask & ?) != 0
          AND (? = 0 OR c.assignee_id = ?)
        ORDER BY c.points DESC, c.id ASC`,
    )
    .all(
      dateKey,
      familyId,
      weekdayBit,
      restrictToMember ? 1 : 0,
      viewer.id,
    ) as Array<{
    id: number;
    title: string;
    emoji: string;
    points: number;
    days_mask: number;
    assignee_id: number | null;
    active: number;
    status: "open" | "done" | "approved";
    done_at: string | null;
    approved_at: string | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    emoji: r.emoji,
    points: r.points,
    daysMask: r.days_mask,
    assigneeId: r.assignee_id,
    active: r.active,
    status: r.status,
    dueDate: dateKey,
    doneAt: r.done_at,
    approvedAt: r.approved_at,
  }));
}

export function getBalances(familyId: number): Map<number, number> {
  const rows = getDb()
    .prepare(
      `SELECT l.user_id AS userId, SUM(l.amount) AS points
         FROM points_ledger l
         JOIN users u ON u.id = l.user_id
        WHERE u.family_id = ?
        GROUP BY l.user_id`,
    )
    .all(familyId) as Array<{ userId: number; points: number }>;
  return new Map(rows.map((r) => [r.userId, r.points ?? 0]));
}

export function getLeaderboard(familyId: number): LeaderboardRow[] {
  const members = getMembers(familyId);
  const balances = getBalances(familyId);
  return members
    .map((m) => ({ ...m, points: balances.get(m.id) ?? 0 }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
}

export function getFamilyTotalPoints(familyId: number): number {
  const row = getDb()
    .prepare(
      `SELECT COALESCE(SUM(l.amount), 0) AS total
         FROM points_ledger l
         JOIN users u ON u.id = l.user_id
        WHERE u.family_id = ?`,
    )
    .get(familyId) as { total: number };
  return row.total;
}

export function getRecentActivity(familyId: number, limit = 12): LedgerEntry[] {
  const rows = getDb()
    .prepare(
      `SELECT l.id, l.user_id, l.amount, l.reason, l.kind, l.created_at,
              u.name AS user_name, u.emoji AS user_emoji, u.color AS user_color
         FROM points_ledger l
         JOIN users u ON u.id = l.user_id
        WHERE u.family_id = ?
        ORDER BY l.created_at DESC, l.id DESC
        LIMIT ?`,
    )
    .all(familyId, limit) as Array<{
    id: number;
    user_id: number;
    amount: number;
    reason: string;
    kind: string;
    created_at: string;
    user_name: string;
    user_emoji: string;
    user_color: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    userEmoji: r.user_emoji,
    userColor: r.user_color,
    amount: r.amount,
    reason: r.reason,
    kind: r.kind as LedgerEntry["kind"],
    createdAt: r.created_at,
  }));
}

export function getApprovedDates(familyId: number): string[] {
  const rows = getDb()
    .prepare(
      `SELECT DISTINCT cp.due_date AS dueDate
         FROM completions cp
         JOIN chores c ON c.id = cp.chore_id
        WHERE c.family_id = ? AND cp.status = 'approved'
        ORDER BY cp.due_date DESC`,
    )
    .all(familyId) as Array<{ dueDate: string }>;
  return rows.map((r) => r.dueDate);
}

/** Consecutive days with at least one approved chore, counting back from today. */
export function getFamilyStreak(familyId: number): number {
  const dates = new Set(getApprovedDates(familyId));
  if (dates.size === 0) return 0;

  let streak = 0;
  let cursor = new Date();
  // A streak survives if nothing has been approved *yet* today.
  if (!dates.has(toDateKey(cursor))) cursor = addDays(cursor, -1);

  while (dates.has(toDateKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function getCompletedThisWeek(familyId: number, weekKeys: string[]): number {
  const placeholders = weekKeys.map(() => "?").join(",");
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS n FROM completions cp
         JOIN chores c ON c.id = cp.chore_id
        WHERE c.family_id = ? AND cp.status = 'approved'
          AND cp.due_date IN (${placeholders})`,
    )
    .get(familyId, ...weekKeys) as { n: number };
  return row.n;
}

export function getPendingApprovals(familyId: number): ChartCell[] {
  const rows = getDb()
    .prepare(
      `SELECT c.id, c.title, c.emoji, c.points, c.days_mask, c.assignee_id, c.active,
              cp.status, cp.due_date, cp.done_at, cp.approved_at
         FROM completions cp
         JOIN chores c ON c.id = cp.chore_id
        WHERE c.family_id = ? AND cp.status = 'done'
        ORDER BY cp.due_date DESC, cp.id DESC`,
    )
    .all(familyId) as Array<{
    id: number;
    title: string;
    emoji: string;
    points: number;
    days_mask: number;
    assignee_id: number | null;
    active: number;
    status: "open" | "done" | "approved";
    due_date: string;
    done_at: string | null;
    approved_at: string | null;
  }>;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    emoji: r.emoji,
    points: r.points,
    daysMask: r.days_mask,
    assigneeId: r.assignee_id,
    active: r.active,
    status: r.status,
    dueDate: r.due_date,
    doneAt: r.done_at,
    approvedAt: r.approved_at,
  }));
}

export type DashboardStats = {
  familyPoints: number;
  doneThisWeek: number;
  streak: number;
  nextReward: {
    title: string;
    emoji: string;
    cost: number;
    balance: number;
    needed: number;
  } | null;
};

export function getDashboardStats(
  familyId: number,
  viewerId: number,
  weekKeys: string[],
): DashboardStats {
  const doneThisWeek = getCompletedThisWeek(familyId, weekKeys);
  const streak = getFamilyStreak(familyId);
  const balance = getBalances(familyId).get(viewerId) ?? 0;

  const upcoming = getRewards(familyId).filter((r) => r.active === 1 && r.cost > balance);
  const nextReward = upcoming[0]
    ? {
        title: upcoming[0].title,
        emoji: upcoming[0].emoji,
        cost: upcoming[0].cost,
        balance,
        needed: upcoming[0].cost - balance,
      }
    : null;

  return { familyPoints: getFamilyTotalPoints(familyId), doneThisWeek, streak, nextReward };
}

export { todayKey };
