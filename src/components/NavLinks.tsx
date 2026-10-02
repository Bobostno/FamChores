"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, LayoutDashboard, ListChecks, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// Icons live here, not in the parent — a Server Component cannot pass a
// component function across the boundary.
const ICONS = {
  "/dashboard": LayoutDashboard,
  "/chores": ListChecks,
  "/members": Users,
  "/rewards": Gift,
} as const;

export type NavItem = {
  href: keyof typeof ICONS;
  label: string;
  badge?: number;
};

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = ICONS[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
              active
                ? "bg-white/12 text-fg shadow-sm"
                : "text-muted hover:bg-white/5 hover:text-fg",
            )}
          >
            <Icon className="size-4" />
            {item.label}
            {item.badge ? (
              <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-[#1a0f05]">
                {item.badge}
              </span>
            ) : null}
            {active && (
              <span className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-accent" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
