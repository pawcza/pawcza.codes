## pawcza.codes

Personal site — a single static page (Next.js) plus a standalone webhook listener.

No CMS. Everything on the page is typed data in `src/content/`, so updating the
site is editing a file and pushing.

| File                       | What it drives                                    |
| -------------------------- | ------------------------------------------------- |
| `src/content/profile.ts`   | Name, role, tagline, bio, contact details          |
| `src/content/experience.ts`| The experience timeline                            |
| `src/content/projects.ts`  | Selected work — `featured: true` gets a case study |
| `src/content/skills.ts`    | The stack section                                  |

The CV is served from `/cv` — replace `public/CV - Pawel Czarniecki.pdf` to
update it.

### Prerequisites

- Node 18+
- pnpm

### Setup

```bash
pnpm install
```

### Run the main app (dev)

```bash
pnpm dev
# opens https://localhost:3000 (self-signed cert)
```

### Run the webhook service (dev)

```bash
cd webhook
pnpm install
PORT=3011 WEBHOOK_SECRET=dev-secret pnpm start
# health: http://localhost:3011/health
```

### Checks

```bash
pnpm typecheck
pnpm lint
```

### Deploy / PM2

See `DEPLOYMENT.md` for production ports (3010 main, 3011 webhook), env vars, and PM2 commands. A `deploy.sh` helper is included for the main app.
