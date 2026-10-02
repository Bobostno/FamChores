# Self-hosting Family Hub

Running this on your own box, with a real HTTPS hostname, so the family can add
it to a phone's home screen.

Target here is a Fedora server on a home network, published at
`gamesweplay.duckdns.org`.

---

## What you need first

| Requirement | Why |
| --- | --- |
| **Node 22.13 or newer** | `src/lib/db.ts` imports `node:sqlite`. The `--experimental-sqlite` flag was removed in 22.13, so older 22.x releases will refuse to start. |
| **A public IP, or a tunnel** | Caddy fetches its certificate over HTTP-01 on port 80. |
| **Caddy** | `sudo dnf install caddy` |
| **A persistent disk** | The SQLite file is the whole app. |

Check your Node version first — everything else depends on it:

```bash
node --version    # must be >= v22.13.0
```

---

## 1. Get the code onto the server

Either clone the repository, or copy the tree across:

```bash
# copy from your workstation
rsync -av --delete \
  --exclude node_modules --exclude .next --exclude data \
  ./ fedora:/opt/family-hub/
```

The `data/` directory is deliberately excluded — it holds the live database.

## 2. Create a dedicated user

```bash
sudo useradd --system --home /opt/family-hub --shell /sbin/nologin familyhub
sudo chown -R familyhub:familyhub /opt/family-hub
```

## 3. Install and build

```bash
cd /opt/family-hub
sudo -u familyhub npm ci
sudo -u familyhub npm run build
```

## 4. Configure the environment

```bash
sudo cp deploy/env.production.example deploy/env.production
sudo chmod 600 deploy/env.production
sudo -u familyhub nano deploy/env.production
```

Generate `AUTH_SECRET` once:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **Keep `AUTH_SECRET` safe and permanent.** Changing it invalidates every
> session cookie, logging the whole family out.

## 5. Run it under systemd

```bash
sudo cp deploy/family-hub.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now family-hub
sudo systemctl status family-hub
```

Confirm it answers locally:

```bash
curl -I http://127.0.0.1:3000/login
```

## 6. TLS and the public hostname

```bash
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo journalctl -u caddy -f      # watch for the certificate being issued
```

Caddy needs inbound port 80 reachable to complete the challenge. If your router
DMZs the server, that is already handled.

## 7. Create your family

Visit the hostname and use `/join` to create your family and first parent
account. The demo family is **not** seeded in production (see `SEED_DEMO` in
`src/lib/seed.ts`), so the database starts empty.

## 8. Add it to a phone

Open the hostname in Chrome → menu → **Add to Home screen**. It launches
fullscreen with no URL bar, and updates land as soon as you redeploy.

---

## Backups

The database is the entire application state. Back up the `.db` file **and its
`-wal` companion** — recent writes live in the WAL until a checkpoint.

```bash
# consistent snapshot using SQLite's own backup, safe while running
sqlite3 /opt/family-hub/data/family.db ".backup '/backup/family-$(date +%F).db'"
```

---

## Two things that will bite you later

### DuckDNS can silently break your certificate

The hostname only resolves to your server if something keeps it updated. If your
public IP changes and nothing updates the record, **Caddy cannot renew the
certificate**, and HTTPS stops working when the current one expires —
taking the installed app down with it.

- Run the DuckDNS updater on a timer, and
- Alert on certificate expiry (or just check `systemctl status caddy` monthly).

### The app is on the open internet

`/login` is publicly reachable and has no rate limiting. The password hashing
(scrypt) and the per-request role checks are sound, but for a family app it is
worth adding a rate limit in front of Caddy or in the login action if the
hostname ever gets out in the wild.

---

## Operating notes

```bash
sudo systemctl restart family-hub      # apply a new build
sudo journalctl -u family-hub -f       # logs
npm run verify:seed-gate               # confirm production starts empty
npm run verify:manifest                # manifest + icons still resolve
npm run verify:ledger                  # points invariants still hold
```