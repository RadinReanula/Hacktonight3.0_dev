# Architecture

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
