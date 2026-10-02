"use client";

import { useState, useTransition } from "react";
import { Check, Inbox, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  approveChore,
  deleteChore,
  rejectChore,
  toggleChoreActive,
} from "@/lib/actions/chores";
import { ChoreEditor } from "./ChoreEditor";
import { Avatar } from "./Avatar";
import { cn, describeSchedule } from "@/lib/utils";
import type { ChartCell, Chore, Member } from "@/lib/types";

export function ChoreManager({
  chores,
  members,
  approvals,
}: {
  chores: Chore[];
  members: Member[];
  approvals: ChartCell[];
}) {
  const [editing, setEditing] = useState<Chore | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<number | "all">("all");
  const [isPending, startTransition] = useTransition();

  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));
  const visible = chores.filter(
    (c) => filter === "all" || c.assigneeId === filter,
  );

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      await fn();
    });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Chore control
          </h1>
          <p className="mt-1 text-sm text-muted">
            Set the jobs, set the points, and sign off when they are done.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#1a0f05] shadow-lg shadow-accent/25 transition-all hover:brightness-110"
        >
          <Plus className="size-4" /> New chore
        </button>
      </header>

      <ApprovalQueue
        approvals={approvals}
        memberMap={memberMap}
        isPending={isPending}
        run={run}
      />

      <section className="glass rounded-card p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            All chores
            <span className="ml-2 text-sm font-normal text-muted">
              {chores.length}
            </span>
          </h2>

          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
              Everyone
            </FilterChip>
            {members.map((m) => (
              <FilterChip
                key={m.id}
                active={filter === m.id}
                onClick={() => setFilter(m.id)}
              >
                {m.emoji} {m.name}
              </FilterChip>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line py-10 text-center text-sm text-muted">
            No chores here yet. Add your first one above.
          </p>
        ) : (
          <ul className="space-y-2">
            {visible.map((chore) => {
              const member = chore.assigneeId
                ? memberMap[chore.assigneeId]
                : undefined;
              return (
                <li
                  key={chore.id}
                  className={cn(
                    "flex flex-wrap items-center gap-3 rounded-xl border p-3.5 transition-all",
                    chore.active
                      ? "border-line bg-white/[0.03]"
                      : "border-line opacity-55",
                  )}
                >
                  <span className="text-xl leading-none">{chore.emoji}</span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{chore.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                      <span className="rounded-full bg-white/8 px-1.5 py-0.5 font-semibold tabular-nums">
                        {chore.points} pts
                      </span>
                      <span>{describeSchedule(chore.daysMask)}</span>
                      <span>{member ? `${member.emoji} ${member.name}` : "Anyone"}</span>
                      {!chore.active && (
                        <span className="rounded-full bg-white/8 px-1.5 py-0.5">
                          paused
                        </span>
                      )}
                    </p>
                  </div>

                  {member && (
                    <Avatar emoji={member.emoji} color={member.color} size="sm" />
                  )}

                  <div className="flex items-center gap-1">
                    <IconAction
                      label={chore.active ? "Pause chore" : "Resume chore"}
                      onClick={() => run(() => toggleChoreActive(chore.id))}
                    >
                      {chore.active ? "⏸" : "▶"}
                    </IconAction>
                    <IconAction
                      label="Edit chore"
                      onClick={() => {
                        setCreating(false);
                        setEditing(chore);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </IconAction>
                    <IconAction
                      label="Delete chore"
                      danger
                      onClick={() => {
                        if (
                          confirm(`Delete "${chore.title}"? This cannot be undone.`)
                        ) {
                          run(() => deleteChore(chore.id));
                        }
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </IconAction>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {(creating || editing) && (
        <ChoreEditor
          chore={editing}
          members={members}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ApprovalQueue({
  approvals,
  memberMap,
  isPending,
  run,
}: {
  approvals: ChartCell[];
  memberMap: Record<number, Member>;
  isPending: boolean;
  run: (fn: () => Promise<void>) => void;
}) {
  if (approvals.length === 0) {
    return (
      <section className="glass flex items-center gap-4 rounded-card p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-mint/15">
          <Check className="size-5 text-mint" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">All caught up</h2>
          <p className="mt-0.5 text-sm text-muted">
            Nothing is waiting for your approval right now.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="glass rounded-card border-amber-400/25 bg-amber-400/[0.06] p-5 sm:p-6">
      <header className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-amber-400/20">
          <Inbox className="size-5 text-amber-300" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Waiting for your approval
          </h2>
          <p className="text-sm text-muted">
            Approving pays the points and adds them to the leaderboard.
          </p>
        </div>
      </header>

      <ul className={cn("grid gap-2.5 sm:grid-cols-2", isPending && "opacity-60")}>
        {approvals.map((item) => {
          const member = item.assigneeId ? memberMap[item.assigneeId] : undefined;
          return (
            <li
              key={`${item.id}-${item.dueDate}`}
              className="flex items-center gap-3 rounded-xl border border-line bg-ink/40 p-3"
            >
              <span className="text-xl leading-none">{item.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted">
                  {member ? `${member.emoji} ${member.name}` : "Someone"} ·{" "}
                  {item.points} pts
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => run(() => rejectChore(item.id, item.dueDate))}
                  className="grid size-11 place-items-center rounded-full border border-line bg-white/5 text-muted transition-colors hover:bg-red-500/15 hover:text-red-300 sm:size-8"
                >
                  <X className="size-3.5" />
                  <span className="sr-only">Reject {item.title}</span>
                </button>
                <button
                  type="button"
                  onClick={() => run(() => approveChore(item.id, item.dueDate))}
                  className="flex min-h-11 items-center gap-1.5 rounded-full bg-mint px-4 text-xs font-semibold text-[#04261a] transition-all hover:brightness-110 sm:min-h-0 sm:px-3.5 sm:py-1.5"
                >
                  <Check className="size-3.5" /> Approve
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-accent/50 bg-accent/15 text-fg"
          : "border-line bg-white/5 text-muted hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

function IconAction({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "grid size-8 place-items-center rounded-full border border-line bg-white/5 text-xs text-muted transition-colors",
        danger
          ? "hover:bg-red-500/15 hover:text-red-300"
          : "hover:bg-white/10 hover:text-fg",
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
