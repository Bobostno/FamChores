"use client";

import { useTransition, useState } from "react";
import { Check, Loader2, Lock } from "lucide-react";
import { redeemReward } from "@/lib/actions/rewards";
import { CountUp } from "./CountUp";
import { cn } from "@/lib/utils";
import type { Reward } from "@/lib/types";

export function RewardShop({
  rewards,
  balance,
}: {
  rewards: Reward[];
  balance: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [redeemed, setRedeemed] = useState<number | null>(null);

  function redeem(reward: Reward) {
    setRedeemed(reward.id);
    startTransition(async () => {
      await redeemReward(reward.id);
    });
    setTimeout(() => setRedeemed(null), 2000);
  }

  if (rewards.length === 0) {
    return (
      <section className="glass rounded-card p-6">
        <h2 className="text-lg font-semibold tracking-tight">Reward shop</h2>
        <p className="mt-3 text-sm text-muted">
          No rewards set up yet. A parent can add some from the Rewards page.
        </p>
      </section>
    );
  }

  return (
    <section className="glass rounded-card p-5 sm:p-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Reward shop</h2>
          <p className="mt-0.5 text-sm text-muted">
            Spend the points you have earned
          </p>
        </div>
        <p className="text-sm text-muted">
          Balance:{" "}
          <span className="font-semibold text-fg tabular-nums">
            <CountUp value={balance} />
          </span>{" "}
          pts
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {rewards.map((reward) => {
          const affordable = balance >= reward.cost;
          const soldOut = reward.stock === 0;
          const justRedeemed = redeemed === reward.id;

          return (
            <li
              key={reward.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-300",
                affordable && !soldOut
                  ? "border-line bg-white/[0.03] hover:-translate-y-0.5 hover:bg-white/[0.08]"
                  : "border-line bg-white/[0.015] opacity-60",
                justRedeemed && "scale-[1.02] border-mint/50 bg-mint/10 opacity-100",
              )}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/5 text-xl">
                {reward.emoji}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{reward.title}</p>
                <p className="text-xs text-muted">
                  {reward.cost} pts
                  {reward.stock > 0 && ` · ${reward.stock} left`}
                  {reward.stock < 0 && " · unlimited"}
                </p>
              </div>

              {justRedeemed ? (
                <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-mint">
                  <Check className="size-3.5" /> Redeemed
                </span>
              ) : soldOut ? (
                <span className="shrink-0 text-xs text-muted">Sold out</span>
              ) : affordable ? (
                <button
                  type="button"
                  onClick={() => redeem(reward)}
                  disabled={isPending}
                  className="glass-strong shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors hover:bg-white/15 disabled:opacity-50"
                >
                  Redeem
                </button>
              ) : (
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
                  <Lock className="size-3" />
                  {reward.cost - balance} short
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {isPending && (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted">
          <Loader2 className="size-3 animate-spin" /> Updating your balance…
        </p>
      )}
    </section>
  );
}
