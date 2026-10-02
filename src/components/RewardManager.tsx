"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Pause, Pencil, Play, Plus, Trash2, X } from "lucide-react";
import { deleteReward, saveReward, toggleRewardActive } from "@/lib/actions/rewards";
import { SubmitButton } from "./SubmitButton";
import { Field, FormError, inputClass } from "./Form";
import { EMOJI_CHOICES, cn } from "@/lib/utils";
import type { ActionState, Reward } from "@/lib/types";

const REWARD_EMOJI = ["🍦", "🎬", "🍕", "📕", "🎮", "⚽️", "🛝", "🎡", "🍿", "🚲", "🎨", "🐾"];

export function RewardManager({ rewards }: { rewards: Reward[] }) {
  const [editing, setEditing] = useState<Reward | null>(null);
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      await fn();
    });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Rewards
          </h1>
          <p className="mt-1 text-sm text-muted">
            Decide what the family points can be spent on.
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
          <Plus className="size-4" /> New reward
        </button>
      </header>

      <section className="glass rounded-card p-5 sm:p-6">
        {rewards.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line py-10 text-center text-sm text-muted">
            No rewards yet. Add the first thing your family can save for.
          </p>
        ) : (
          <ul className={cn("grid gap-3 sm:grid-cols-2", isPending && "opacity-60")}>
            {rewards.map((reward) => (
              <li
                key={reward.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3.5 transition-all",
                  reward.active
                    ? "border-line bg-white/[0.03]"
                    : "border-line opacity-55",
                )}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/5 text-xl">
                  {reward.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{reward.title}</p>
                  <p className="text-xs text-muted">
                    {reward.cost} pts ·{" "}
                    {reward.stock < 0 ? "unlimited" : `${reward.stock} left`}
                    {!reward.active && " · paused"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <RoundBtn
                    title={reward.active ? "Pause reward" : "Make available"}
                    onClick={() => run(() => toggleRewardActive(reward.id))}
                  >
                    {reward.active ? (
                      <Pause className="size-3.5" />
                    ) : (
                      <Play className="size-3.5" />
                    )}
                  </RoundBtn>
                  <RoundBtn
                    title="Edit reward"
                    onClick={() => {
                      setCreating(false);
                      setEditing(reward);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </RoundBtn>
                  <RoundBtn
                    title="Delete reward"
                    danger
                    onClick={() => {
                      if (confirm(`Delete "${reward.title}"?`)) {
                        run(() => deleteReward(reward.id));
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </RoundBtn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(creating || editing) && (
        <RewardEditor
          reward={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function RoundBtn({
  title,
  onClick,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        // 44px on phones for a comfortable thumb target, denser from sm up.
        "grid size-11 place-items-center rounded-full border border-line bg-white/5 text-muted transition-colors hover:bg-white/10 hover:text-fg sm:size-8",
        danger && "hover:bg-red-500/15 hover:text-red-300",
      )}
    >
      {children}
      <span className="sr-only">{title}</span>
    </button>
  );
}

function RewardEditor({
  reward,
  onClose,
}: {
  reward: Reward | null;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    saveReward,
    null,
  );
  const ranRef = useRef(false);
  const [emoji, setEmoji] = useState(reward?.emoji ?? REWARD_EMOJI[0]);
  const [cost, setCost] = useState(String(reward?.cost ?? 50));
  const [unlimited, setUnlimited] = useState((reward?.stock ?? -1) < 0);
  const [stock, setStock] = useState(String(Math.max(0, reward?.stock ?? 0)));

  useEffect(() => {
    if (isPending) {
      ranRef.current = true;
      return;
    }
    if (ranRef.current && !state?.error) {
      ranRef.current = false;
      onClose();
    }
  }, [isPending, state, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-line bg-ink-soft shadow-2xl">
        <header className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="text-lg font-semibold tracking-tight">
            {reward ? "Edit reward" : "New reward"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full border border-line bg-white/5 text-muted transition-colors hover:bg-white/10 hover:text-fg"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </button>
        </header>

        <form action={formAction} className="flex-1 space-y-5 px-6 py-6">
          {reward && <input type="hidden" name="id" value={reward.id} />}
          <input type="hidden" name="emoji" value={emoji} />
          <input type="hidden" name="stock" value={unlimited ? -1 : stock} />

          <FormError message={state?.error} />

          <Field label="Reward">
            <input
              name="title"
              className={inputClass}
              defaultValue={reward?.title}
              placeholder="Ice cream trip"
              required
            />
          </Field>

          <Field label="Icon">
            <div className="flex flex-wrap gap-1.5">
              {[...new Set([...REWARD_EMOJI, ...EMOJI_CHOICES.slice(0, 6)])].map(
                (e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={cn(
                      "grid size-10 place-items-center rounded-xl text-lg transition-all",
                      e === emoji
                        ? "scale-110 bg-accent/20 ring-1 ring-accent/50"
                        : "bg-white/5 hover:bg-white/10",
                    )}
                  >
                    {e}
                  </button>
                ),
              )}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Point cost">
              <input
                name="cost"
                type="number"
                min={1}
                className={inputClass}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
              />
            </Field>
            <Field label="How many">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  disabled={unlimited}
                />
                <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={unlimited}
                    onChange={(e) => setUnlimited(e.target.checked)}
                    className="accent-accent"
                  />
                  ∞
                </label>
              </div>
            </Field>
          </div>

          <div className="flex gap-2 pt-1">
            <SubmitButton className="flex-1" pendingLabel="Saving…">
              {reward ? "Save changes" : "Add reward"}
            </SubmitButton>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-line bg-white/5 px-5 py-2.5 text-sm text-muted transition-colors hover:bg-white/10 hover:text-fg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
