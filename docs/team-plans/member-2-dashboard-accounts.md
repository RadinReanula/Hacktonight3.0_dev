# Member 2 — Dashboard & Accounts

You own two feature areas **full-stack** (UI + API + DB access): the **Dashboard** overview and the
**Bank Accounts** management screens. Read `docs/team-plans/README.md` first for the shared standards
and the foundation Member 1 provides.

---

## 1. Scope & files you own

| Layer | Path | Current state | Target |
| --- | --- | --- | --- |
| UI | `app/dashboard/page.tsx` | styled-jsx mockup, hardcoded "Dilara", static transactions | Real overview wired to API, shared components |
| UI | `app/bank-accounts/page.tsx` | CSS-module CRUD mockup, `alert()`/`console.log`, 1 hardcoded account | Real CRUD wired to API |
| CSS (delete) | `app/bank-accounts/accounts.module.css` | page-local design tokens | Remove; migrate to shared design system |
| API | `app/api/accounts/route.ts` | **insecure**: SQLi via `userId`, IDOR, `includePins` leaks PINs | Secure list + create + update + delete |
| API (new) | `app/api/overview/route.ts` | does not exist | Dashboard aggregation endpoint |

You do **not** own auth, transfers, bills, statements, or the shared components.

---

## 2. What the foundation gives you (from Member 1)

- `components/shell/AppShell` — wraps a page with `Sidebar` + `TopBar`; use it instead of importing `Sidebar` directly.
- `components/ui/*` — `Button`, `Card`, `Input`, `Label`, `Field`, `Badge`, `Table`, `Dialog`.
- `lib/db.ts` — `query<T>(text, params)`, `serviceFailure(err)`.
- `lib/auth.ts` — `requireSession()` returns `{ userId, role }` or throws a 401 Response; use in every route.
- `lib/api/*` — add your typed client helpers here (e.g. `lib/api/accounts.ts`).
- TanStack Query provider is already mounted in the root layout.

---

## 3. Backend tasks

### 3.1 Secure `app/api/accounts/route.ts`

Replace the entire file. Requirements:

- `GET` — list accounts **for the authenticated user only**. Get `userId` from `requireSession()`,
  never from the query string. Never select or return `pin_hash`. Remove the `includePins` feature.
- `POST` — create an account for the authenticated user. Validate body with zod
  (`account_number`: 8–16 digits, `account_name`: 1–60 chars, optional 4-digit `pin`). Hash the PIN
  with `hashPin()` from `lib/auth.ts`. Reject duplicate account numbers (handle unique violation).
- `PATCH` — update only the `account_name` (nickname) of an account the user owns. Validate ownership
  with a `WHERE user_id = $1 AND id = $2` clause.
- `DELETE` — delete an account the user owns (block if balance != 0).
- All queries parameterized via `query()`; all failures via `serviceFailure()`.

Example of the required query style:

```ts
const result = await query(
  `SELECT id, user_id, account_number, account_name, balance
   FROM accounts WHERE user_id = $1 ORDER BY id`,
  [session.userId]
)
```

### 3.2 New `app/api/overview/route.ts`

`GET` returns the dashboard summary for the authenticated user:

```jsonc
{
  "ok": true,
  "fullName": "Dilara Perera",
  "totalBalance": 142000.0,
  "accounts": [{ "id": 1, "accountNumber": "1000003423", "accountName": "Dilara Savings", "balance": 100000.0 }],
  "recentTransactions": [
    { "id": 9, "direction": "out", "counterparty": "2000006754", "amount": 4500.0, "description": "Lunch money", "createdAt": "..." }
  ]
}
```

- Sum balances across the user's accounts.
- Recent transactions = last 8 where `from_account` or `to_account` is one of the user's account numbers; compute `direction` relative to the user.
- Parameterized, session-scoped, no PINs.

---

## 4. Frontend tasks

### 4.1 Dashboard (`app/dashboard/page.tsx`)

- Convert to a client component wrapped in `AppShell` with a `PageHeader title="Dashboard"`.
- Fetch `/api/overview` with TanStack Query (`useQuery`). Show loading skeletons and an error state.
- Sections, all using `Card`:
  - **Total balance** hero card + per-account balance cards.
  - **Quick actions** (links to Transfer / Pay Bills / Statements).
  - **Recent transactions** list using the shared `Table`, with in/out styling via `Badge`.
- Remove all hardcoded data and the `<style jsx>` block. No raw `<img>` — use `next/image`.

### 4.2 Bank Accounts (`app/bank-accounts/page.tsx`)

- Rebuild list / add / edit flows with `Card`, `Field`, `Input`, `Button`, and a `Dialog` for delete confirm.
- Keep the existing client-side validation behaviour but move it to `react-hook-form` + `zod` (one schema shared with the API where practical).
- Wire to the real API:
  - list -> `GET /api/accounts`
  - add -> `POST /api/accounts`
  - rename -> `PATCH /api/accounts`
  - delete -> `DELETE /api/accounts` (confirm dialog)
- Use `useMutation` + query invalidation to refresh the list. Replace `alert()` with toast/inline messages.
- Delete `app/bank-accounts/accounts.module.css` once migrated.

---

## 5. Acceptance criteria

- No string-interpolated SQL anywhere; `runStatement` not imported.
- `/api/accounts` and `/api/overview` reject unauthenticated requests (401) and never leak other users' data or PINs.
- Dashboard and Accounts render real data, are responsive, and use only shared components.
- Vitest tests for the accounts route (auth required, ownership enforced, PIN never returned) and a Playwright happy-path for each page.
- `npm run lint && npm run typecheck && npm run build` all pass.

---

## 6. Cursor prompt (paste into Cursor Agent on your feature branch)

```
You are implementing the "Dashboard & Accounts" area of a Next.js 16 / React 19 banking app.
Read docs/team-plans/README.md and docs/team-plans/member-2-dashboard-accounts.md fully, then implement
everything in section 3 (backend) and section 4 (frontend) of my guide.

Hard rules:
- Use only the shared foundation: components/ui/*, components/shell/* (AppShell, PageHeader), lib/db.ts
  (query, serviceFailure), lib/auth.ts (requireSession, hashPin), and the TanStack Query provider.
- All SQL must go through query(text, params) with parameter placeholders. Never use string
  interpolation and never import runStatement.
- Every API route must call requireSession() and enforce that the user owns the resource. Never return
  pin_hash, password hashes, secrets, raw SQL, or stack traces.
- Validate all inputs with zod. Forms use react-hook-form + zod. No styled-jsx, no CSS modules; use the
  design tokens / Tailwind semantic classes. Use next/image, not <img>.

Deliverables:
1. Rewrite app/api/accounts/route.ts with secure GET/POST/PATCH/DELETE (owner-scoped, PIN hashed, no PIN leak).
2. Create app/api/overview/route.ts returning total balance, per-account balances, and recent transactions for the logged-in user.
3. Rebuild app/dashboard/page.tsx as a client page in AppShell, fetching /api/overview, with balance cards,
   quick actions, and a recent-transactions table. Remove all hardcoded data and the <style jsx> block.
4. Rebuild app/bank-accounts/page.tsx (list/add/edit/delete) wired to /api/accounts with react-hook-form + zod,
   useMutation + query invalidation, and a Dialog for delete. Delete accounts.module.css.
5. Add Vitest tests for the accounts route and Playwright happy-path tests for both pages.

Finish by running npm run lint, npm run typecheck, and npm run build and fixing any issues you introduced.
```
