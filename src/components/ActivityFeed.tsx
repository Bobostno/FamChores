import { cn, formatRelative } from "@/lib/utils";
import { Avatar } from "./Avatar";
import type { LedgerEntry } from "@/lib/types";

const KIND_STYLES: Record<LedgerEntry["kind"], string> = {
  chore: "bg-mint/15 text-mint",
  bonus: "bg-accent/15 text-orange-300",
  penalty: "bg-red-500/15 text-red-300",
  reward: "bg-violet/20 text-violet-200",
};

export function ActivityFeed({ entries }: { entries: LedgerEntry[] }) {
  if (entries.length === 0) {
    return (
      <section className="glass rounded-card p-6">
        <h2 className="text-lg font-semibold tracking-tight">Recent activity</h2>
        <p className="mt-3 text-sm text-muted">
          Nothing yet — approved chores and bonuses will show up here.
        </p>
      </section>
    );
  }

  return (
    <section className="glass rounded-card p-5 sm:p-6">
      <header className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Recent activity</h2>
        <p className="mt-0.5 text-sm text-muted">Every point, accounted for</p>
      </header>

      <ul className="space-y-1">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/5"
          >
            <Avatar emoji={entry.userEmoji} color={entry.userColor} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">
                <span className="font-medium">{entry.userName}</span>{" "}
                <span className="text-muted">{entry.reason.toLowerCase()}</span>
              </p>
              <p className="text-xs text-muted/70">
                {formatRelative(entry.createdAt)}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-1 text-xs font-bold tabular-nums",
                KIND_STYLES[entry.kind],
              )}
            >
              {entry.amount > 0 ? "+" : ""}
              {entry.amount}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
