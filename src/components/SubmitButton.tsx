"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
};

const VARIANTS = {
  primary:
    "bg-accent text-[#1a0f05] hover:brightness-110 shadow-lg shadow-accent/25 font-semibold",
  ghost: "glass hover:bg-white/10 text-fg",
  danger: "bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30",
} as const;

export function SubmitButton({
  children,
  pendingLabel = "Working…",
  className,
  variant = "primary",
  disabled,
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5",
        "text-sm transition-all duration-200 disabled:opacity-55 disabled:cursor-not-allowed",
        VARIANTS[variant],
        className,
      )}
    >
      {pending && (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {pending ? pendingLabel : children}
    </button>
  );
}
