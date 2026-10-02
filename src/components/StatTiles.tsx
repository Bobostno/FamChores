import { Flame, Gift, Sparkles, Trophy } from "lucide-react";
import { CountUp } from "./CountUp";
import { ProgressRing } from "./ProgressRing";
import type { DashboardStats } from "@/lib/data";

export function StatTiles({ stats }: { stats: DashboardStats }) {
  return (
    <section className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Tile
        icon={<Trophy className="size-4" />}
        label="Family points"
        accent="#f97316"
      >
        <CountUp value={stats.familyPoints} className="text-3xl font-semibold tabular-nums" />
      </Tile>

      <Tile
        icon={<Sparkles className="size-4" />}
        label="Chores done this week"
        accent="#10b981"
      >
        <CountUp value={stats.doneThisWeek} className="text-3xl font-semibold tabular-nums" />
      </Tile>

      <Tile icon={<Flame className="size-4" />} label="Day streak" accent="#ef4444">
        <span className="flex items-baseline gap-1.5">
          <CountUp value={stats.streak} className="text-3xl font-semibold tabular-nums" />
          <span className="text-sm text-muted">days</span>
        </span>
      </Tile>

      <Tile icon={<Gift className="size-4" />} label="Next reward" accent="#8b5cf6">
        {stats.nextReward ? (
          <div className="flex items-center gap-3">
            <ProgressRing
              value={
                stats.nextReward.cost > 0
                  ? stats.nextReward.balance / stats.nextReward.cost
                  : 0
              }
              size={48}
              stroke={5}
              color="#8b5cf6"
            >
              <span className="text-base">{stats.nextReward.emoji}</span>
            </ProgressRing>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{stats.nextReward.title}</p>
              <p className="text-xs text-muted">
                <CountUp value={stats.nextReward.needed} /> pts to go
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">
            You can afford everything 🎉
          </p>
        )}
      </Tile>
    </section>
  );
}

function Tile({
  icon,
  label,
  accent,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <article className="glass relative overflow-hidden rounded-card p-5">
      <span
        className="absolute -top-14 -right-14 size-32 rounded-full opacity-25 blur-3xl"
        style={{ background: accent }}
      />
      <div className="flex items-center gap-2">
        <span
          className="grid size-7 place-items-center rounded-lg"
          style={{
            background: `color-mix(in oklab, ${accent} 20%, transparent)`,
            color: accent,
          }}
        >
          {icon}
        </span>
        <p className="text-xs font-medium tracking-wide text-muted uppercase">
          {label}
        </p>
      </div>
      <div className="mt-3">{children}</div>
    </article>
  );
}
