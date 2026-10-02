"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** 0–1 */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  className?: string;
  children?: React.ReactNode;
};

/** Animated SVG progress ring. */
export function ProgressRing({
  value,
  size = 96,
  stroke = 9,
  color = "var(--color-accent)",
  trackColor = "rgba(255,255,255,0.09)",
  className,
  children,
}: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = Math.max(0, Math.min(1, value));
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    // The global reduced-motion rule collapses the CSS transition, so the ring
    // still jumps straight to its final value without a special case here.
    const id = requestAnimationFrame(() =>
      setOffset(circumference * (1 - target)),
    );
    return () => cancelAnimationFrame(id);
  }, [target, circumference]);

  return (
    <div className={cn("relative inline-grid place-items-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
