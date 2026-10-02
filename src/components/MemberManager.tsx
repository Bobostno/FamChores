"use client";

import { useState, useTransition } from "react";
import { Copy, Minus, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import {
  adjustPoints,
  regenerateInviteCode,
  removeMember,
  resetMemberPoints,
} from "@/lib/actions/members";
import { MemberEditor } from "./MemberEditor";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";
import type { Member } from "@/lib/types";

export function MemberManager({
  members,
  balances,
  inviteCode,
  viewerId,
}: {
  members: Member[];
  balances: Record<number, number>;
  inviteCode: string;
  viewerId: number;
}) {
  const [editing, setEditing] = useState<Member | null>(null);
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      await fn();
    });

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Members
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage who is in the family and how they sign in.
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
          <Plus className="size-4" /> Add person
        </button>
      </header>

      <section className="glass rounded-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Invite code</h2>
        <p className="mt-0.5 text-sm text-muted">
          Anyone with this code can join your family.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <code className="rounded-xl border border-line bg-ink/50 px-5 py-3 font-mono text-xl font-semibold tracking-[0.25em]">
            {inviteCode}
          </code>
          <button
            type="button"
            onClick={copyCode}
            className="glass-strong inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition-colors hover:bg-white/10"
          >
            {copied ? <X className="size-4 text-mint" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={() => run(() => regenerateInviteCode())}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-4 py-2.5 text-sm text-muted transition-colors hover:bg-white/10 hover:text-fg"
          >
            <RefreshCw className="size-4" /> New code
          </button>
        </div>
      </section>

      <MemberList
        members={members}
        balances={balances}
        viewerId={viewerId}
        isPending={isPending}
        run={run}
        onEdit={(member) => {
          setCreating(false);
          setEditing(member);
        }}
      />

      {(creating || editing) && (
        <MemberEditor
          member={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function MemberList({
  members,
  balances,
  viewerId,
  isPending,
  run,
  onEdit,
}: {
  members: Member[];
  balances: Record<number, number>;
  viewerId: number;
  isPending: boolean;
  run: (fn: () => Promise<void>) => void;
  onEdit: (member: Member) => void;
}) {
  return (
    <section className="glass rounded-card p-5 sm:p-6">
      <h2 className="mb-5 text-lg font-semibold tracking-tight">
        The family
        <span className="ml-2 text-sm font-normal text-muted">{members.length}</span>
      </h2>

      <ul className={cn("space-y-2.5", isPending && "opacity-60")}>
        {members.map((member) => {
          const points = balances[member.id] ?? 0;
          const isSelf = member.id === viewerId;
          return (
            <li
              key={member.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white/[0.03] p-3.5"
            >
              <Avatar emoji={member.emoji} color={member.color} size="md" glow />

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 truncate text-sm font-medium">
                  {member.name}
                  {isSelf && (
                    <span className="text-[10px] font-bold tracking-wide text-accent uppercase">
                      you
                    </span>
                  )}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                      member.role === "parent"
                        ? "bg-violet/20 text-violet-200"
                        : "bg-mint/20 text-mint",
                    )}
                  >
                    {member.role}
                  </span>
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  @{member.username} ·{" "}
                  <span className="font-semibold tabular-nums">{points}</span> pts
                </p>
              </div>

              <div className="flex items-center gap-1">
                <IconBtn
                  title={`Give ${member.name} 5 bonus points`}
                  onClick={() => run(() => adjustPoints(member.id, 5, "Bonus", "bonus"))}
                  tone="mint"
                >
                  <Plus className="size-3.5" />
                </IconBtn>
                <IconBtn
                  title={`Deduct 5 points from ${member.name}`}
                  onClick={() => run(() => adjustPoints(member.id, -5, "Deduction", "penalty"))}
                  tone="red"
                >
                  <Minus className="size-3.5" />
                </IconBtn>
                <IconBtn title="Edit" onClick={() => onEdit(member)}>
                  <Pencil className="size-3.5" />
                </IconBtn>
                <IconBtn
                  title={`Reset ${member.name}'s points`}
                  onClick={() => {
                    if (
                      confirm(
                        `Reset ${member.name}'s points and completions? This cannot be undone.`,
                      )
                    ) {
                      run(() => resetMemberPoints(member.id));
                    }
                  }}
                  tone="amber"
                >
                  <RefreshCw className="size-3.5" />
                </IconBtn>
                {!isSelf && (
                  <IconBtn
                    title={`Remove ${member.name} from the family`}
                    tone="red"
                    onClick={() => {
                      if (confirm(`Remove ${member.name} from the family?`)) {
                        run(() => removeMember(member.id));
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </IconBtn>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function IconBtn({
  title,
  onClick,
  tone,
  children,
}: {
  title: string;
  onClick: () => void;
  tone?: "mint" | "red" | "amber";
  children: React.ReactNode;
}) {
  const tones = {
    mint: "text-mint hover:bg-mint/15",
    red: "text-red-300 hover:bg-red-500/15",
    amber: "text-amber-300 hover:bg-amber-500/15",
  } as const;

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-full border border-line bg-white/5 text-muted transition-colors hover:bg-white/10 hover:text-fg",
        tone && tones[tone],
      )}
    >
      {children}
      <span className="sr-only">{title}</span>
    </button>
  );
}
