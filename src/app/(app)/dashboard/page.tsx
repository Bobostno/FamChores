import { requireUser } from "@/lib/auth";
import {
  getBalances,
  getChoresForDay,
  getDashboardStats,
  getLeaderboard,
  getRecentActivity,
  getMembers,
  getRewards,
} from "@/lib/data";
import { ChoreChart, type ChartDay } from "@/components/ChoreChart";
import { StatTiles } from "@/components/StatTiles";
import { Leaderboard } from "@/components/Leaderboard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { RewardShop } from "@/components/RewardShop";
import { formatDayLabel, fromDateKey, greeting, todayKey, weekKeys } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const familyId = user.familyId;

  const today = todayKey();
  const days: ChartDay[] = weekKeys(new Date()).map((key) => ({
    key,
    label: formatDayLabel(key),
    dateLabel: String(fromDateKey(key).getDate()),
    cells: getChoresForDay(familyId, key, user),
  }));

  const stats = getDashboardStats(familyId, user.id, days.map((d) => d.key));
  const leaderboard = getLeaderboard(familyId);
  const activity = getRecentActivity(familyId);
  const rewards = getRewards(familyId).filter((r) => r.active === 1);
  const balance = getBalances(familyId).get(user.id) ?? 0;
  const memberMap = Object.fromEntries(
    getMembers(familyId).map((m) => [m.id, m]),
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting()}, {user.name} {user.emoji}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {user.role === "parent"
              ? "Here's where the family stands this week."
              : `You have ${balance} points to spend.`}
          </p>
        </div>
      </header>

      <StatTiles stats={stats} />

      <ChoreChart
        days={days}
        members={memberMap}
        role={user.role}
        viewerId={user.id}
        today={today}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Leaderboard rows={leaderboard} />
        <RewardShop rewards={rewards} balance={balance} />
      </div>

      <ActivityFeed entries={activity} />
    </div>
  );
}
