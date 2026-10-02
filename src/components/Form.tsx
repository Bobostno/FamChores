"use client";

import { cn } from "@/lib/utils";

export const inputClass = cn(
  "w-full rounded-xl border border-line bg-white/5 px-4 py-3 text-sm",
  "placeholder:text-muted/60 outline-none transition-colors",
  "focus:border-accent/60 focus:bg-white/[0.07]",
);

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

export function Field({ label, hint, error, children, className }: FieldProps) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-muted/80">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs text-red-300">{error}</span>}
    </label>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="animate-pop rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
    >
      {message}
    </p>
  );
}
