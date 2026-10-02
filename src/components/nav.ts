import {
  Gift,
  LayoutDashboard,
  ListChecks,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Route → icon mapping, shared by the desktop pill nav and the mobile tab bar.
 *
 * It lives here rather than inside NavLinks because a Server Component cannot
 * pass a component function across the boundary — AppShell (a Server Component
 * that builds the item list) and the nav both need to resolve these.
 */
export const NAV_ICONS = {
  "/dashboard": LayoutDashboard,
  "/chores": ListChecks,
  "/members": Users,
  "/rewards": Gift,
} as const satisfies Record<string, LucideIcon>;

export type NavItem = {
  href: keyof typeof NAV_ICONS;
  label: string;
  badge?: number;
};