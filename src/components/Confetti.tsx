"use client";

import { useMemo } from "react";

const COLORS = ["#f97316", "#8b5cf6", "#10b981", "#3b82f6", "#ec4899", "#eab308"];

type Piece = {
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotation: number;
  size: number;
};

/**
 * Fire `burst` times to replay the effect. The `key` remounts the container on
 * every change so the CSS animations restart, and the pieces animate to
 * `opacity: 0`, so nothing needs to unmount them afterwards.
 */
export function Confetti({ burst }: { burst: number }) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: ((i * 53) % 700) / 1000,
        duration: 1.1 + ((i * 31) % 60) / 100,
        color: COLORS[i % COLORS.length],
        rotation: (i * 47) % 360,
        size: 6 + (i % 4) * 3,
      })),
    [],
  );

  if (burst === 0) return null;

  return (
    <div
      key={burst}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-[-10%] rounded-[2px]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            background: p.color,
            animation: `confetti-fall ${p.duration}s cubic-bezier(0.3,0.7,0.6,1) ${p.delay}s forwards`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-8vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(108vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
