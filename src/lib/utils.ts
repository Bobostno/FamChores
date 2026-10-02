export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Local-time `YYYY-MM-DD` key (never use toISOString here — it shifts days). */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

/** Monday-based start of week. */
export function startOfWeek(d: Date): Date {
  const next = new Date(d);
  const shift = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - shift);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function weekKeys(anchor: Date): string[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => toDateKey(addDays(start, i)));
}

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"] as const;

export function formatDayLabel(key: string): string {
  return DAY_LABELS[fromDateKey(key).getDay()];
}

export function isToday(key: string): boolean {
  return key === todayKey();
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function formatLongDate(key: string): string {
  return fromDateKey(key).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

/** Bitmask helpers — bit 0 is Sunday, matching `Date.getDay()`. */
export function isDayScheduled(daysMask: number, dayIndex: number): boolean {
  return (daysMask & (1 << dayIndex)) !== 0;
}

export function maskToDays(daysMask: number): number[] {
  return [0, 1, 2, 3, 4, 5, 6].filter((d) => isDayScheduled(daysMask, d));
}

export function daysToMask(days: number[]): number {
  return days.reduce((mask, d) => mask | (1 << d), 0);
}

export const MASK_EVERY_DAY = 0b1111111;
export const MASK_WEEKDAYS = 0b0111110;
export const MASK_WEEKENDS = 0b1000001;

export function describeSchedule(daysMask: number): string {
  if (daysMask === MASK_EVERY_DAY) return "Every day";
  if (daysMask === MASK_WEEKDAYS) return "Weekdays";
  if (daysMask === MASK_WEEKENDS) return "Weekends";
  return maskToDays(daysMask)
    .map((d) => DAY_LABELS[d])
    .join(" · ");
}

export const EMOJI_CHOICES = [
  "🧹", "🍽️", "🐕", "📚", "🛏️", "🗑️", "🌱", "🧺", "🧽", "🚿",
  "✏️", "🎒", "🐈", "🥦", "🧹", "📦", "🪴", "🎨", "⚽️", "🎹",
];

export const EMOJI_AVATARS = [
  "🦊", "🐻", "🐼", "🦁", "🐨", "🐵", "🦄", "🐙", "🐧", "🦉",
  "🧒", "👧", "👦", "👩", "🧑", "🧑‍🦰",
];

export const COLOR_CHOICES = [
  "#f97316", "#ec4899", "#8b5cf6", "#3b82f6",
  "#10b981", "#eab308", "#06b6d4", "#ef4444",
];

export function formatRelative(iso: string): string {
  // SQLite datetime('now') is UTC without a zone marker.
  const then = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`);
  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
  if (Number.isNaN(seconds)) return "";
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
