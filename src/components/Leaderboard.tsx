"use client";

import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { Avatar } from "./Avatar";
import { CountUp } from "./CountUp";
import { cn } from "@/lib/utils";
import type { LeaderboardRow } from "@/lib/types";

const MEDALS = ["🥇", "🥈", "🥉"];

export function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.points)));
  const [widths, setWidths] = useState<number[]>(() => rows.map(() => 0));

  useEffect(() => {
    const id = requestAnimationFrame(() =>
      setWidths(rows.map((r) => (Math.abs(r.points) / max) * 100)),
    );
    return () => cancelAnimationFrame(id);
  }, [rows, max]);

  return (
    <section className="glass rounded-card p-5 sm:p-6">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Leaderboard</h2>
          <p className="mt-0.5 text-sm text-muted">Running point totals</p>
        </div>
        <Crown className="size-5 text-amber-300" />
      </header>

      <ol className="space-y-3">
        {rows.map((row, index) => (
          <li key={row.id} className="flex items-center gap-3">
            <span className="w-5 shrink-0 text-center text-sm">
              {MEDALS[index] ?? <span className="text-muted/60">{index + 1}</span>}
            </span>

            <Avatar emoji={row.emoji} color={row.color} size="sm" />

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium">
                  {row.name}
                  {row.role === "parent" && (
                    <span className="ml-1.5 text-[10px] font-bold tracking-wide text-violet uppercase">
                      parent
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  <CountUp value={row.points} />
                  <span className="ml-1 text-[11px] font-normal text-muted">pts</span>
                </span>
              </div>

              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/7">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-1000 ease-out",
                    row.points < 0 && "opacity-70",
                  )}
                  style={{
                    width: `${widths[index] ?? 0}%`,
                    background: row.color,
                    boxShadow: `0 0 12px ${row.color}66`,
                    transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
