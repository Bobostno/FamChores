# 🏡 Family Hub

A simple, stylish home for a family's **chores**, **points** and **rewards**.

- A **public landing page** introduces the product — no family data is exposed.
- Everything real lives **behind a login**, split into parent and kid roles.
- Parents get a **control centre** for setting up chores, point values, schedules and rewards.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then set AUTH_SECRET
npm run dev
```

Open <http://localhost:3000>. On first run the SQLite database is created and seeded with a demo family.

### Demo accounts

The seed creates **The Rivera Family** (invite code `RIVERA24`). Every account uses the password `demo1234`:

| Username | Role  |
| -------- | ----- |
| `sam`    | Parent |
| `alex`   | Kid |
| `mia`    | Kid |

Sign in as `sam` to see the parent controls, or as `alex` / `mia` to see the kid experience.

To start from scratch, delete `data/` and restart the dev server.

---

## Routes

| Route       | Access  | What it is                                                     |
| ----------- | ------- | -------------------------------------------------------------- |
| `/`         | Public  | Marketing-style landing page (hero, features, calls to action)   |
| `/login`    | Public  | Sign in                                                          |
| `/join`     | Public  | Create a family, or join one with an invite code                 |
| `/dashboard`| Signed in | Stat tiles, week chore chart, leaderboard, reward shop, activity |
| `/chores`   | Parent  | Approval queue + full chore CRUD                                 |
| `/members`  | Parent  | Roster, invite code, points adjustments, password resets        |
| `/rewards`  | Both    | Parents manage the catalogue; kids see the shop                  |

---

## How it works

### Points never drift

Balances are **not** stored on the user. Every change appends a row to
`points_ledger`, and a balance is always `SUM(amount)`. This means:

- the chore chart and the points total can never disagree,
- the activity feed is free — it is just the ledger, newest first,
- approving the same chore twice can never pay out twice (guarded by the
  completion's own status plus a `UNIQUE (chore_id, due_date)` constraint).

### Two layers of protection

1. `src/proxy.ts` — the Next 16 replacement for middleware — redirects anyone
   without a valid session cookie away from the protected routes.
2. `requireUser()` / `requireParent()` run again inside **every** page and
   **every** Server Action, and each mutation re-scopes its query by
   `family_id`. Middleware alone is never trusted.

Kids additionally only ever see their own chores (`getChoresForDay` filters by
assignee) and can only tick off chores for **today**.

### Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) | Server Components + Server Actions |
| Database | `node:sqlite` (built into Node) | No native build step, zero install risk |
| Auth | `node:crypto` scrypt + `jose` JWT in an httpOnly cookie | No bcrypt native build |
| Styling | Tailwind CSS 4 | Design tokens live in `src/app/globals.css` |
| Validation | `zod` | Every Server Action input |
| Animation | CSS keyframes + `requestAnimationFrame` | No animation dependency |

---

## Scripts

| Command                | What it does                                        |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Start the dev server                                 |
| `npm run build`        | Production build                                     |
| `npm run typecheck`    | `tsc --noEmit`                                       |
| `npm run lint`         | ESLint                                               |
| `npm run check`        | typecheck + lint + build                             |
| `npm run smoke`        | Route-protection and content checks (server must be running) |
| `npm run verify:ledger`| Points-ledger invariants against a database snapshot |

`scripts/mint-dev-token.mjs` mints a session cookie for a given user id, which
is handy for `curl`-ing the authenticated pages.

---

## Project layout

```
src/
  app/
    page.tsx            public landing page
    login/ join/        auth pages
    (app)/              authenticated route group (shared AppShell)
      dashboard/        the family home
      chores/           parent control centre
      members/          parent roster
      rewards/          catalogue (parent) / shop (kid)
  components/           UI, split into server and client pieces
  lib/
    db.ts               SQLite connection, schema, migration
    seed.ts             demo family + five weeks of history
    auth.ts             requireUser / requireParent
    session.ts          JWT sign/verify (db-free, usable from proxy)
    password.ts         scrypt hashing
    data.ts             all read queries
    actions/            server actions, grouped by feature
  proxy.ts              optimistic route gate
```

---

## Notes

- Sessions are 30-day httpOnly, `SameSite=Lax` cookies. Set `AUTH_SECRET` in
  production — the app refuses to boot without it.
- `node:sqlite` returns **null-prototype** rows, which React cannot send to
  Client Components. Every query in `data.ts` rebuilds rows as plain objects.
- The database lives at `data/family.db` (override with `DATABASE_PATH`) and is
  git-ignored.