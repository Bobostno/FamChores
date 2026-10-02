import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { getPendingApprovals } from "@/lib/data";
import { Avatar } from "./Avatar";
import { NavLinks, type NavItem } from "./NavLinks";
import type { CurrentUser } from "@/lib/types";

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const isParent = user.role === "parent";
  const approvals = isParent ? getPendingApprovals(user.familyId).length : 0;

  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/chores", label: "Chores", badge: approvals || undefined },
    { href: "/rewards", label: "Rewards" },
    ...(isParent ? [{ href: "/members" as const, label: "Members" }] : []),
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3.5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-lg shadow-lg shadow-accent/25">
              🏡
            </span>
            <span className="hidden font-semibold tracking-tight sm:block">
              {user.familyName}
            </span>
          </Link>

          <NavLinks items={items} />

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2.5 rounded-full border border-line bg-white/5 py-1 pr-3 pl-1">
              <Avatar emoji={user.emoji} color={user.color} size="sm" />
              <span className="hidden text-sm font-medium sm:block">{user.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                  isParent ? "bg-violet/25 text-violet-200" : "bg-mint/20 text-mint"
                }`}
              >
                {user.role}
              </span>
            </span>
            <form action={signOut}>
              <button
                type="submit"
                title="Sign out"
                className="grid size-9 place-items-center rounded-full border border-line bg-white/5 text-muted transition-colors hover:bg-white/10 hover:text-fg"
              >
                <LogOut className="size-4" />
                <span className="sr-only">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-7">{children}</main>
    </div>
  );
}
