## pawcza.codes

Main site (Next.js) plus a standalone webhook listener.

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
# opens http://localhost:3000
```

### Run the webhook service (dev)

```bash
cd webhook
pnpm install
PORT=3011 WEBHOOK_SECRET=dev-secret pnpm start
# health: http://localhost:3011/health
```

### Lint

```bash
pnpm lint
```

### Deploy / PM2

See `DEPLOYMENT.md` for production ports (3010 main, 3011 webhook), env vars, and PM2 commands. A `deploy.sh` helper is included for the main app.
