"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ICONS, type NavItem } from "./nav";

/**
 * Bottom tab bar for phones.
 *
 * The desktop pill nav (NavLinks) hides below `sm` — a horizontally scrolling
 * row of pills is awkward with a thumb and wastes the most reachable part of
 * the screen. This is the standard phone affordance instead: icon over label,
 * pinned to the bottom, sized for touch.
 *
 * The parent passes the already-filtered item list, so kids still only see the
 * tabs their role allows.
 */
export function MobileTabBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      // Safe-area padding keeps the bar clear of the iOS gesture handle and
      // Android's gesture pill; zero where there is no inset.
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/60 bg-ink/90 backdrop-blur-xl sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex w-full max-w-lg items-stretch">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = NAV_ICONS[item.href];

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  // min-h-11 keeps every tab at a comfortable 44px touch target.
                  "relative flex min-h-11 flex-col items-center justify-center gap-1 px-1 pt-2 pb-1.5 text-[11px] font-medium transition-colors",
                  active ? "text-fg" : "text-muted hover:text-fg",
                )}
              >
                <span className="relative">
                  <Icon className="size-5" />
                  {item.badge ? (
                    <span className="absolute -top-1.5 -right-2.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] leading-4 font-bold text-[#1a0f05]">
                      {item.badge}
                    </span>
                  ) : null}
                </span>
                <span className="truncate">{item.label}</span>

                {active && (
                  <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-accent" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}