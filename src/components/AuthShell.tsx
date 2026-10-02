import Link from "next/link";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const SPARKS = [
  { emoji: "🧹", left: "12%", top: "22%", tilt: "-10deg", delay: "0s" },
  { emoji: "🏆", left: "72%", top: "16%", tilt: "12deg", delay: "0.5s" },
  { emoji: "🍦", left: "20%", top: "70%", tilt: "8deg", delay: "1s" },
  { emoji: "⭐", left: "80%", top: "62%", tilt: "-6deg", delay: "1.4s" },
  { emoji: "🧸", left: "46%", top: "84%", tilt: "14deg", delay: "0.8s" },
];

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden border-r border-line/60 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-violet/25 via-transparent to-accent/20" />
        {SPARKS.map((s) => (
          <span
            key={s.emoji}
            aria-hidden="true"
            className="absolute text-5xl opacity-20 select-none"
            style={{
              left: s.left,
              top: s.top,
              ["--tilt" as string]: s.tilt,
              animation: `var(--animate-float) 7s ease-in-out ${s.delay} infinite`,
            }}
          >
            {s.emoji}
          </span>
        ))}

        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-lg">
              🏡
            </span>
            <span className="text-lg font-semibold">Family Hub</span>
          </Link>

          <div>
            <h2 className="max-w-sm text-4xl leading-tight font-semibold tracking-tight text-balance">
              Chores done, points earned,{" "}
              <span className="text-accent">rewards unlocked.</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              One shared place for the whole household — with the controls
              parents need and the simplicity kids enjoy.
            </p>
          </div>

          <p className="text-xs text-muted/70">
            Built for phones, tablets and the kitchen screen.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-lg">
              🏡
            </span>
            <span className="text-lg font-semibold">Family Hub</span>
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>

          <div className="glass mt-8 rounded-card p-7">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
