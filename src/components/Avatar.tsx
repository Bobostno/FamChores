import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-8 text-base",
  md: "size-11 text-xl",
  lg: "size-16 text-3xl",
  xl: "size-24 text-5xl",
} as const;

type Props = {
  emoji: string;
  color: string;
  size?: keyof typeof SIZES;
  className?: string;
  /** Draws a soft halo in the member's colour. */
  glow?: boolean;
};

export function Avatar({ emoji, color, size = "md", className, glow }: Props) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full",
        "bg-white/5 border border-white/10",
        SIZES[size],
        className,
      )}
      style={
        glow
          ? {
              background: `color-mix(in oklab, ${color} 22%, transparent)`,
              borderColor: `color-mix(in oklab, ${color} 45%, transparent)`,
              boxShadow: `0 0 24px color-mix(in oklab, ${color} 35%, transparent)`,
            }
          : undefined
      }
      aria-hidden="true"
    >
      {emoji}
    </span>
  );
}
