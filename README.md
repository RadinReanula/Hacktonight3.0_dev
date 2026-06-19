# Nova Bank — HTN26 Challenge

A Next.js 16 / React 19 banking web app. The project is being rebuilt from a
prototype into an industry-standard app: a shared shadcn-style design system, a
secured PostgreSQL backend (parameterized queries, hashed credentials, signed
sessions, RBAC), and redesigned feature areas.

## Tech stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict)
- Tailwind CSS v4 design tokens + shadcn-style components (`components/ui`, `components/shell`)
- PostgreSQL via `pg` (parameterized `lib/db.ts`)
- Auth: `jose` signed session cookies + `bcryptjs` hashing, route protection in `proxy.ts`
- Data/forms: TanStack Query, React Hook Form, Zod
- Tooling: Biome (lint + format), Lefthook (pre-commit), npm

## Prerequisites

- Docker (with [WSL2 backend](https://docs.docker.com/desktop/features/wsl) on Windows), or
- Node.js >= 20 and a local/Docker PostgreSQL for the non-Docker workflow

## Setup

```bash
git clone https://github.com/RadinReanula/Hacktonight3.0_dev.git
cd Hacktonight3.0_dev
cp .env.example .env.local
```

Set values in `.env.local` (notably `DATABASE_URL` and `SESSION_SECRET`).

## Run with Docker (recommended)

```bash
docker compose up --build --watch
```

App: http://localhost:3001 (mapped from container port 3000)

Postgres runs only on the internal Docker network (`db:5432`). It is **not** exposed on the host
because Windows often reserves ports 5358–5457 (includes 5432). The app does not need a host mapping.

## Run locally (without Docker)

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — Biome check · `npm run lint:fix` — Biome check + autofix
- `npm run typecheck` — `tsc --noEmit`
- `npm run format` — Biome format

Demo Credentials: dilara / password123 · kasun / kasun12345 · admin / admin12345

The database schema and demo data are created automatically on first request
(`lib/db.ts`). Demo credentials are **reset on every app start** so they always
match the table below.

| Username | Password     | Role     |
| -------- | ------------ | -------- |
| `dilara` | `password123` | customer |
| `kasun`  | `kasun12345`  | customer |
| `admin`  | `admin12345`  | admin    |

If login still fails after pulling latest code, reset the database volume:

```bash
docker compose down -v
docker compose up --build --watch
```

## Team development

Per-member implementation plans live in [`docs/team-plans`](docs/team-plans/README.md).
