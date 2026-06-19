# Nova Bank — HackTonight 2026 Challenge

A full-stack banking web application built for the HTN26 hackathon. **Nova Bank** lets customers manage accounts, transfer money, pay bills, view e-statements, and analyze spending — all behind secure sessions, hashed credentials, and parameterized PostgreSQL queries.

The project was rebuilt from a prototype into an industry-style app: shared design system, secured backend, RBAC, and feature areas split across a four-person team.

---

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4 |
| UI | shadcn-style components (`components/ui`), shared shell (`components/shell`) |
| Data & forms | TanStack Query, React Hook Form, Zod |
| Backend | Next.js Route Handlers (`app/api/*`), `pg` connection pool |
| Auth | `jose` signed HTTP-only session cookies, `bcryptjs` password/PIN hashing |
| Charts | Recharts (Smart Spend analytics) |
| Tooling | Biome (lint + format), Lefthook (pre-commit), Vitest, Playwright |
| Infra | Docker Compose (app + Postgres 17), GitHub Actions CI |

---

## Features

### Public

- **Landing page** (`/`) — marketing hero with sign-in / sign-up links
- **Sign up** (`/sign-up`) — register a new customer account
- **Login** (`/login`) — authenticate and receive a session cookie
- **Reset password** (`/reset-password`) — password recovery flow

### Authenticated (sidebar navigation)

| Page | Route | Description |
| --- | --- | --- |
| Dashboard | `/dashboard` | Account balances, recent transactions, quick actions |
| Bank Accounts | `/bank-accounts` | List, create, edit, and delete owned accounts |
| Bank Transfer | `/bank-transfer` | Transfer funds between accounts (PIN-verified) |
| Pay Bills | `/pay-bills` | Pay registered billers (utilities, mobile, insurance, etc.) |
| Smart Spend | `/smart-spend` | Spending analytics with charts, categories, and budget caps |
| E-Statement | `/e-statement` | Filterable transaction history with print/download |

### Admin

- **System API** (`/api/admin/system`) — admin-only endpoint (role `admin`)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (React client components + TanStack Query)         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  proxy.ts — route protection (pages + API, RBAC for admin)  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  app/api/* — Route Handlers (Zod validation, requireSession)│
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  lib/* — business logic (transfers, pay-bills, auth, db)    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  PostgreSQL (users, accounts, transactions, billers, audit) │
└─────────────────────────────────────────────────────────────┘
```

**Request flow:** Client pages call typed helpers in `lib/api/*` → API routes validate input with Zod and call `requireSession()` → business logic runs parameterized SQL via `query()` or transactional `getClient()` → safe JSON responses (no secrets or stack traces).

**Route protection** lives in `proxy.ts` (Next.js middleware pattern). Public pages and auth APIs are open; everything else requires a valid session. Admin routes additionally require `role === 'admin'`.

---

## Database

Schema is created and seeded automatically on first request (`lib/db.ts` → `ensureDatabase()`). Demo credentials are **reset on every app start**.

### Tables

| Table | Purpose |
| --- | --- |
| `users` | Username, password hash, role (`customer` / `admin`), profile fields |
| `accounts` | Bank accounts linked to users, balance, PIN hash |
| `transactions` | Transfers and bill payments (`from_account`, `to_account`, amount, status) |
| `billers` | Payable merchants (CEB, Dialog, water board, etc.) |
| `audit_logs` | JSON event log for security-sensitive actions |

### Demo users & accounts

| Username | Password | Role | Sample accounts |
| --- | --- | --- | --- |
| `dilara` | `password123` | customer | Savings `1000003423`, Expenses `1000004876` (PIN `1234`) |
| `kasun` | `kasun12345` | customer | Current `2000006754` (PIN `4321`) |
| `admin` | `admin12345` | admin | Vault `9999999999` (PIN `9999`) |

---

## API routes

| Endpoint | Methods | Auth | Description |
| --- | --- | --- | --- |
| `/api/health` | GET | Public | Health check |
| `/api/auth/login` | POST | Public | Sign in |
| `/api/auth/register` | POST | Public | Create account |
| `/api/auth/logout` | POST | Public | Clear session |
| `/api/auth/me` | GET | Session | Current user profile |
| `/api/accounts` | GET, POST, PATCH, DELETE | Session | CRUD for owned accounts |
| `/api/overview` | GET | Session | Dashboard summary |
| `/api/transactions` | GET | Session | Transaction list |
| `/api/transfer` | POST | Session | Execute bank transfer |
| `/api/billers` | GET | Session | List billers |
| `/api/pay-bills` | POST | Session | Pay a biller |
| `/api/statements` | GET | Session | E-statement data |
| `/api/analytics` | GET | Session | Smart Spend analytics |
| `/api/search` | GET | Session | Search |
| `/api/setup` | GET | Session | Setup helper |
| `/api/admin/system` | GET | Admin | System info |

Transfers and bill payments use database transactions with row-level locking (`FOR UPDATE`) to prevent race conditions on balances.

---

## Project structure

```
app/
  (accounts)/          # Auth pages (login, sign-up, reset-password)
  api/                 # Route Handlers
  dashboard/           # Dashboard
  bank-accounts/       # Account management
  bank-transfer/       # Transfers
  pay-bills/           # Bill payments
  smart-spend/         # Spending analytics
  e-statement/         # Statements
  globals.css          # Design tokens (@theme inline)
  layout.tsx           # Root layout + Providers

components/
  ui/                  # Button, Card, Input, Table, Dialog, etc.
  shell/               # AppShell, Sidebar, TopBar, PageHeader, StatusScreen
  auth/                # LogoutButton

lib/
  db.ts                # PostgreSQL pool, schema, seeding, query()
  auth.ts              # Sessions, PIN verification, requireSession()
  session.ts           # JWT cookie signing (jose)
  hash.ts              # bcrypt helpers
  api/                 # Client-side fetch helpers
  transfers/           # Transfer schemas, errors, execute-transfer
  pay-bills/           # Pay-bill schemas, errors, execute-pay-bill
  schemas/             # Shared Zod schemas
  rate-limit.ts        # In-memory rate limiter (dev/hackathon)

tests/
  api/                 # Vitest unit tests
  e2e/                 # Playwright end-to-end tests

docs/team-plans/       # Per-member implementation guides
```

---

## Prerequisites

- **Docker** (recommended) — with [WSL2 backend](https://docs.docker.com/desktop/features/wsl) on Windows, or
- **Node.js ≥ 20** and a local or Docker PostgreSQL instance

---

## Setup

```bash
git clone https://github.com/RadinReanula/Hacktonight3.0_dev.git
cd Hacktonight3.0_dev
cp .env.example .env.local
```

Edit `.env.local`:

- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — secret for signing session JWTs (required in production)

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Run with Docker (recommended)

```bash
docker compose up --build --watch
```

- **App:** http://localhost:3001 (container port 3000)
- **Postgres:** internal Docker network only (`db:5432`) — not exposed on the host to avoid Windows port conflicts

Reset the database volume if login fails after pulling new code:

```bash
docker compose down -v
docker compose up --build --watch
```

```

## Email verification (Resend)

New sign-ups must verify email before login. Configure in `.env.local`:

```env
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
APP_BASE_URL=http://localhost:3001
EMAIL_DISABLE_SEND=false
```

- Set `EMAIL_DISABLE_SEND=true` for local testing without sending mail (verification links are logged in the app container).
- Verify a custom domain in Resend to email arbitrary addresses in production.
- After pulling, run `docker compose exec htn26-challenge-dev npm ci --ignore-scripts` if the app reports `Can't resolve 'resend'`.

---

## Run locally (without Docker)

Point `DATABASE_URL` in `.env.local` at your local Postgres instance, then:

```bash
npm install
npm run dev
```

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Biome check |
| `npm run lint:fix` | Biome check + autofix |
| `npm run format` | Biome format |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright E2E tests |

---

## Security model

- Passwords and account PINs are hashed with bcrypt — never stored or returned in plaintext
- Sessions are signed JWTs in HTTP-only cookies (`lib/session.ts`)
- All SQL uses parameterized `query(text, params)` — no string interpolation
- Every protected route validates the session and enforces resource ownership
- Rate limiting on sensitive endpoints (`lib/rate-limit.ts`)
- Admin routes gated by role in `proxy.ts` and `requireRole('admin')`
- Nova Assist is FAQ-only — no account data is sent to OpenAI

---

## Testing & CI

- **Unit tests** (Vitest): API logic in `tests/api/` and co-located `*.test.ts` files
- **E2E tests** (Playwright): happy-path flows per feature in `tests/e2e/`
- **CI** (`.github/workflows/ci.yml`): lint → typecheck → build on push/PR to `main`

---


## Team development

This repo was built by a four-person team. Per-member guides live in [`docs/team-plans`](docs/team-plans/README.md):

| Member | Area |
| --- | --- |
| Member 1 (Lead) | Foundation, auth, security, design system, CI |
| Member 2 | Dashboard & accounts |
| Member 3 | Bank transfer & pay bills |
| Member 4 | E-statement & Smart Spend |

Shared standards: use `components/ui` and `components/shell`, fetch via `lib/api/*`, validate with Zod, query via `lib/db.ts`, and write tests before opening a PR.

---

## License

Private hackathon project (`"private": true` in `package.json`).
