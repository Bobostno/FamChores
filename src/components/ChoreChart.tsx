"use client";

import { useState, useTransition } from "react";
import { Check, Clock, Loader2, Sparkles } from "lucide-react";
import { markChoreDone, undoChoreDone, approveChore } from "@/lib/actions/chores";
import { Confetti } from "./Confetti";
import { cn } from "@/lib/utils";
import type { ChartCell, Member } from "@/lib/types";

export type ChartDay = {
  key: string;
  label: string;
  dateLabel: string;
  cells: ChartCell[];
};

type Props = {
  days: ChartDay[];
  members: Record<number, Member>;
  role: "parent" | "kid";
  viewerId: number;
  today: string;
};

type Status = ChartCell["status"];

export function ChoreChart({ days, members, role, viewerId, today }: Props) {
  const [selected, setSelected] = useState(today);
  const [overrides, setOverrides] = useState<Record<string, Status>>({});
  const [burst, setBurst] = useState(0);
  const [isPending, startTransition] = useTransition();
  const isParent = role === "parent";

  const statusFor = (cell: ChartCell, dayKey: string): Status =>
    overrides[`${cell.id}:${dayKey}`] ?? cell.status;

  function toggle(cell: ChartCell, dayKey: string) {
    const key = `${cell.id}:${dayKey}`;
    const current = statusFor(cell, dayKey);
    const isTodayCell = dayKey === today;

    // Kids can only touch their own chores, and only for today.
    if (!isParent && (cell.assigneeId !== viewerId || !isTodayCell)) return;

    let next: Status = "done";
    if (current === "done") {
      if (isParent) {
        next = "approved";
        setBurst((n) => n + 1);
      } else {
        next = "open";
      }
    }

    setOverrides((prev) => ({ ...prev, [key]: next }));

    startTransition(async () => {
      if (next === "done") await markChoreDone(cell.id, dayKey);
      else if (next === "open") await undoChoreDone(cell.id, dayKey);
      else await approveChore(cell.id, dayKey);

      setOverrides((prev) => {
        if (!(key in prev)) return prev;
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    });
  }

  const total = days.reduce((sum, d) => sum + d.cells.length, 0);
  const approved = days.reduce(
    (sum, d) => sum + d.cells.filter((c) => statusFor(c, d.key) === "approved").length,
    0,
  );

  return (
    <section className="glass rounded-card p-5 sm:p-6">
      <Confetti burst={burst} />

      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">This week</h2>
          <p className="mt-0.5 text-sm text-muted">
            {isParent
              ? "Tap a chore to mark it done, then tap again to approve and pay out."
              : "Tap your chores to tick them off. A parent approves them for points."}
          </p>
        </div>
        <span className="glass-strong rounded-full px-3 py-1.5 text-sm font-medium tabular-nums">
          {approved}/{total} done
        </span>
      </header>

      {/* Day switcher — small screens only. */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto lg:hidden">
        {days.map((day) => (
          <button
            key={day.key}
            type="button"
            onClick={() => setSelected(day.key)}
            className={cn(
              "flex shrink-0 flex-col items-center rounded-xl border px-3.5 py-2 text-xs transition-all",
              selected === day.key
                ? "border-accent/50 bg-accent/15 text-fg"
                : "border-line bg-white/5 text-muted",
            )}
          >
            <span className="font-medium">{day.label}</span>
            <span className="text-sm font-semibold tabular-nums">{day.dateLabel}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {days.map((day) => {
          const done = day.cells.filter((c) => statusFor(c, day.key) !== "open").length;
          return (
            <div
              key={day.key}
              className={cn(
                "flex-col gap-2",
                selected === day.key ? "flex" : "hidden lg:flex",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-between rounded-xl border px-3 py-2",
                  day.key === today
                    ? "border-accent/40 bg-accent/10"
                    : "border-line bg-white/[0.03]",
                )}
              >
                <span className="text-xs font-semibold tracking-wide uppercase">
                  {day.label}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted tabular-nums">
                  {day.key === today && (
                    <span className="size-1.5 rounded-full bg-accent" />
                  )}
                  {day.cells.length > 0 ? `${done}/${day.cells.length}` : "—"}
                </span>
              </div>

              {day.cells.length === 0 ? (
                <p className="px-1 py-3 text-center text-xs text-muted/50">
                  Nothing due
                </p>
              ) : (
                day.cells.map((cell) => (
                  <ChoreCard
                    key={`${cell.id}-${day.key}`}
                    cell={cell}
                    status={statusFor(cell, day.key)}
                    member={cell.assigneeId ? members[cell.assigneeId] : undefined}
                    isParent={isParent}
                    viewerId={viewerId}
                    isTodayCell={day.key === today}
                    isPending={isPending}
                    onToggle={() => toggle(cell, day.key)}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ChoreCard({
  cell,
  status,
  member,
  isParent,
  viewerId,
  isTodayCell,
  isPending,
  onToggle,
}: {
  cell: ChartCell;
  status: Status;
  member?: Member;
  isParent: boolean;
  viewerId: number;
  isTodayCell: boolean;
  isPending: boolean;
  onToggle: () => void;
}) {
  const mine = cell.assigneeId === viewerId;
  const interactive = isParent || (mine && isTodayCell);

  const actionable = interactive && !(status === "approved" && !isParent);
  const waiting = status === "done";

  const accent = member?.color ?? "var(--color-accent)";

  const hint = !isParent && !mine
    ? "Not yours"
    : !isParent && !isTodayCell && status === "open"
      ? "Only today"
      : null;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!actionable}
      aria-pressed={status !== "open"}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border p-3 text-left transition-all duration-300",
        actionable && "hover:-translate-y-0.5 hover:bg-white/[0.09] active:scale-[0.98]",
        !actionable && "cursor-default opacity-60",
        isPending && "opacity-50",
        status === "open" && "border-line bg-white/[0.03]",
        status === "done" && "border-amber-400/35 bg-amber-400/10",
        status === "approved" && "border-transparent",
      )}
      style={
        status === "approved"
          ? {
              background: `color-mix(in oklab, ${accent} 16%, transparent)`,
              borderColor: `color-mix(in oklab, ${accent} 40%, transparent)`,
            }
          : undefined
      }
    >
      {status === "approved" && (
        <span
          className="absolute inset-x-0 top-0 h-0.5"
          style={{ background: accent }}
        />
      )}

      <div className="flex items-start gap-2.5">
        <span className="text-lg leading-none">{cell.emoji}</span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm leading-snug font-medium",
              status === "approved" && "line-through decoration-1 opacity-70",
            )}
          >
            {cell.title}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums",
                status === "approved"
                  ? "bg-black/25"
                  : status === "done"
                    ? "bg-amber-400/20 text-amber-200"
                    : "bg-white/10 text-muted",
              )}
            >
              {cell.points} pts
            </span>
            {isParent && member && (
              <span
                className="size-2 rounded-full"
                style={{ background: member.color }}
                title={member.name}
              />
            )}
          </div>
        </div>

        <span className="shrink-0">
          {status === "approved" ? (
            <Check className="size-4" style={{ color: accent }} />
          ) : waiting ? (
            <Clock className="size-4 text-amber-300" />
          ) : isPending ? (
            <Loader2 className="size-4 animate-spin text-muted" />
          ) : (
            <Sparkles className="size-3.5 text-muted/50 transition-colors group-hover:text-accent" />
          )}
        </span>
      </div>

      {(isParent || waiting) && (
        <p className="mt-2 text-[11px] text-muted">
          {status === "approved"
            ? "Approved — points paid"
            : waiting
              ? isParent
                ? "Tap to approve and pay out"
                : "Waiting for a parent"
              : hint ?? "Tap when it's done"}
        </p>
      )}
    </button>
  );
}
