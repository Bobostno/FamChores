"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ICONS, type NavItem } from "./nav";

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 overflow-x-auto sm:flex">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = NAV_ICONS[item.href];
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
