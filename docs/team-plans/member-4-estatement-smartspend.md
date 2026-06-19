# Member 4 — E-Statement & Smart Spend

You own two feature areas **full-stack**: **E-Statement** (account statements with export) and
**Smart Spend** (spending analytics / budgeting — currently an empty page, build from scratch). You also
own the shared, secure **transactions** data source both features read from. Read
`docs/team-plans/README.md` first for shared standards and the foundation Member 1 provides.

---

## 1. Scope & files you own

| Layer | Path | Current state | Target |
| --- | --- | --- | --- |
| UI | `app/e-statement/page.tsx` | static wireframe, empty data, uncontrolled input | Working statement w/ filters + export |
| UI | `app/smart-spend/page.tsx` | **empty file** | Build analytics dashboard from scratch |
| API | `app/api/transactions/route.ts` | **insecure**: SQLi via `account`, no auth | Secure, owner-scoped, paginated |
| API (new) | `app/api/statements/route.ts` | does not exist | Filtered statement data + summary |
| API (new) | `app/api/analytics/route.ts` | does not exist | Spend analytics aggregation |

You do **not** own auth, accounts CRUD, transfers, bills, or shared components.

---

## 2. What the foundation gives you (from Member 1)

- `components/shell/AppShell`, `PageHeader`.
- `components/ui/*` — `Button`, `Card`, `Input`, `Label`, `Field`, `Badge`, `Table`, `Select`.
- `lib/db.ts` — `query<T>(text, params)`, `serviceFailure(err)`.
- `lib/auth.ts` — `requireSession()`.
- TanStack Query provider mounted in the root layout.
- Charts: use `recharts` (add it as a dependency if not already present) for Smart Spend visuals.

---

## 3. Backend tasks

### 3.1 Rewrite `app/api/transactions/route.ts` (GET)

- `requireSession()`; only return transactions where `from_account` or `to_account` is an account
  **owned by the authenticated user** (join through `accounts.user_id`). Never accept an arbitrary
  `account` from the query string without verifying ownership.
- Support query params (all validated with zod): `accountNumber?` (must be owned), `from?`/`to?` dates,
  `page?`, `pageSize?` (cap at 100). Return paginated, parameterized results.

```ts
const result = await query(
  `SELECT t.* FROM transactions t
   WHERE (t.from_account = ANY($1) OR t.to_account = ANY($1))
   ORDER BY t.created_at DESC LIMIT $2 OFFSET $3`,
  [ownedAccountNumbers, pageSize, offset]
)
```

### 3.2 `app/api/statements/route.ts` (GET)

- Owner-scoped statement for a chosen account + date range. Return:
  - account header (number, name — never PIN),
  - opening/closing balance + totals (credits, debits) for the range,
  - the line items.
- Validate `accountNumber` (owned), `from`, `to` with zod.

### 3.3 `app/api/analytics/route.ts` (GET)

- Owner-scoped spend analytics for a period:
  - spend by category (derive a category from `description` keywords or a `category` column if you add one),
  - month-over-month or daily spend series,
  - income vs expense totals,
  - optional budget vs actual (if you add a `budgets` table — coordinate with Member 1 on schema).
- All aggregation in SQL with parameters; no per-row JS over the full table where avoidable.

---

## 4. Frontend tasks

### 4.1 E-Statement (`app/e-statement/page.tsx`)

- Convert to a client page in `AppShell` + `PageHeader title="E-Statement"`.
- Controls (`Field`, `Select`, date inputs): pick account + date range; controlled state.
- Fetch `/api/statements` with TanStack Query; render with shared `Table`; show summary cards
  (opening/closing balance, total in/out).
- **Export**: "Download PDF" and "Download CSV". CSV can be generated client-side; for PDF either render a
  print-friendly view + `window.print()` or use a lightweight lib. Keep it dependency-light.
- Loading / empty / error states. No raw `<img>`; use `next/image`.

### 4.2 Smart Spend (`app/smart-spend/page.tsx`) — build from scratch

- Client page in `AppShell` + `PageHeader title="Smart Spend"`.
- Fetch `/api/analytics`. Sections using `Card`:
  - KPI row (total spent, total income, net, vs last period).
  - **Spend by category** — `recharts` pie/donut.
  - **Spend over time** — `recharts` bar/line.
  - **Top merchants/payees** list.
  - Optional budget progress bars.
- Period selector (this month / last month / 90 days) driving the query.
- Empty/loading/error states; fully responsive.

---

## 5. Acceptance criteria

- `/api/transactions`, `/api/statements`, `/api/analytics` require auth and only ever return the
  authenticated user's data. No SQLi; `runStatement` not imported; no PINs/secrets returned.
- E-Statement filters, paginates, and exports correctly; Smart Spend renders real aggregated charts.
- Both pages responsive, use shared components, with loading/empty/error states.
- Vitest tests for the three routes (auth required, ownership enforced, pagination/aggregation correct).
- Playwright happy-path for both pages. `npm run lint && npm run typecheck && npm run build` pass.

---

## 6. Cursor prompt (paste into Cursor Agent on your feature branch)

```
You are implementing the "E-Statement & Smart Spend" area of a Next.js 16 / React 19 banking app.
Read docs/team-plans/README.md and docs/team-plans/member-4-estatement-smartspend.md fully, then implement
everything in section 3 (backend) and section 4 (frontend) of my guide.

Hard rules:
- Use only the shared foundation: components/ui/*, components/shell/* (AppShell, PageHeader), lib/db.ts
  (query, serviceFailure), lib/auth.ts (requireSession), TanStack Query. Use recharts for charts.
- All SQL via parameterized query(); never string-interpolate SQL; never import runStatement.
- Every route calls requireSession() and only returns transactions/accounts owned by the user (join via
  accounts.user_id). Validate all inputs with zod. Never return PINs, secrets, raw SQL, or stack traces.
- No styled-jsx/CSS modules; use design tokens. Use next/image. Add loading/empty/error states.

Deliverables:
1. Rewrite app/api/transactions/route.ts as a secure, owner-scoped, paginated, validated GET.
2. Create app/api/statements/route.ts (account + date-range statement with opening/closing balance and totals)
   and app/api/analytics/route.ts (spend by category, spend over time, income vs expense), both owner-scoped.
3. Rebuild app/e-statement/page.tsx with account + date-range filters, a transactions table, summary cards,
   and CSV + PDF export.
4. Build app/smart-spend/page.tsx from scratch: KPIs, spend-by-category donut, spend-over-time chart,
   top payees, period selector (recharts).
5. Add Vitest tests for the three routes and Playwright happy-paths for both pages.

Finish by running npm run lint, npm run typecheck, and npm run build and fixing any issues you introduced.
```
