import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Gift,
  ListChecks,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

const FEATURES = [
  {
    icon: ListChecks,
    title: "Chores that keep everyone honest",
    body: "Set the list once. Kids tick things off, parents approve, and the week chart shows exactly where everyone stands.",
    emoji: ["🧹", "🛏️", "🍽️"],
    accent: "#f97316",
  },
  {
    icon: Trophy,
    title: "Points that add up",
    body: "Every approved chore drops points into a running total. A live leaderboard makes a bit of friendly competition inevitable.",
    emoji: ["🏆", "⭐", "🔥"],
    accent: "#8b5cf6",
  },
  {
    icon: Gift,
    title: "Rewards worth chasing",
    body: "Turn points into movie nights, ice cream trips and Friday dinner picks. Kids decide what the points buy.",
    emoji: ["🍦", "🎬", "🍕"],
    accent: "#10b981",
  },
];

const HIGHLIGHTS = [
  "Separate parent and kid accounts",
  "One invite code to get the family together",
  "Works on the phone, tablet or the kitchen screen",
  "No ads, no subscriptions",
];

function Floaters() {
  const items = [
    { emoji: "🧹", left: "8%", top: "18%", tilt: "-12deg", delay: "0s" },
    { emoji: "🏆", left: "88%", top: "14%", tilt: "10deg", delay: "0.6s" },
    { emoji: "🍦", left: "78%", top: "72%", tilt: "-8deg", delay: "1.2s" },
    { emoji: "🐶", left: "14%", top: "76%", tilt: "14deg", delay: "0.3s" },
    { emoji: "⭐", left: "94%", top: "42%", tilt: "-6deg", delay: "0.9s" },
    { emoji: "🧸", left: "4%", top: "48%", tilt: "8deg", delay: "1.5s" },
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
      {items.map((item) => (
        <span
          key={item.emoji}
          className="absolute text-4xl opacity-30 select-none"
          style={{
            left: item.left,
            top: item.top,
            ["--tilt" as string]: item.tilt,
            animation: `var(--animate-float) 7s ease-in-out ${item.delay} infinite`,
          }}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <Floaters />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-accent text-lg shadow-lg shadow-accent/30">
            🏡
          </span>
          <span className="text-lg font-semibold tracking-tight">Family Hub</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-fg"
          >
            Log in
          </Link>
          <Link
            href="/join"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-[#1a0f05] shadow-lg shadow-accent/25 transition-all hover:brightness-110"
          >
            Create your family
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-6 pt-10 pb-20 text-center sm:pt-20">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-muted">
            <Sparkles className="size-3.5 text-accent" />
            Chores, points and rewards — in one tidy place
          </span>

          <h1 className="mx-auto mt-7 max-w-4xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
            The family hub that{" "}
            <span className="bg-gradient-to-r from-accent via-amber-300 to-violet bg-clip-text text-transparent">
              actually gets used
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Set the chores, watch the points tick up, and let the kids spend what
            they earn. Simple enough for a six-year-old, useful enough for you.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/join"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-[#1a0f05] shadow-xl shadow-accent/25 transition-all hover:brightness-110"
            >
              Start your family hub
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition-colors hover:bg-white/10"
            >
              I already have one
            </Link>
          </div>

          <ul className="stagger mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-muted">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-mint" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-28">
          <div className="grid gap-5 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="glass group relative overflow-hidden rounded-card p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.07]"
              >
                <div
                  className="absolute -top-16 -right-16 size-40 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-40"
                  style={{ background: feature.accent }}
                />
                <span
                  className="grid size-12 place-items-center rounded-2xl"
                  style={{
                    background: `color-mix(in oklab, ${feature.accent} 18%, transparent)`,
                    border: `1px solid color-mix(in oklab, ${feature.accent} 35%, transparent)`,
                  }}
                >
                  <feature.icon
                    className="size-6"
                    style={{ color: feature.accent }}
                  />
                </span>

                <h2 className="mt-5 text-lg font-semibold tracking-tight">
                  {feature.title}
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">
                  {feature.body}
                </p>

                <div className="mt-5 flex gap-2">
                  {feature.emoji.map((e) => (
                    <span
                      key={e}
                      className="grid size-9 place-items-center rounded-xl bg-white/5 text-base"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="glass mt-5 flex flex-col items-center gap-6 rounded-card p-8 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-5">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-violet/15">
                <Users className="size-7 text-violet" />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Parents stay in control
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Only parents can create chores, set point values and approve
                  the work. Kids just tap, earn and spend.
                </p>
              </div>
            </div>
            <Link
              href="/join"
              className="glass inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white/10"
            >
              Get started <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line/60 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-muted sm:flex-row">
          <span className="flex items-center gap-2">
            🏡 Family Hub — made for busy homes
          </span>
          <span>Chores · Points · Rewards</span>
        </div>
      </footer>
    </div>
  );
}
