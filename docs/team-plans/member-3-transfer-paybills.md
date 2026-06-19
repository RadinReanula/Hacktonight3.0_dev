# Member 3 — Bank Transfer & Pay Bills

You own two feature areas **full-stack**: **Bank Transfer** and **Pay Bills**. These are the
money-movement flows, so security and correctness matter most here. Read
`docs/team-plans/README.md` first for shared standards and the foundation Member 1 provides.

---

## 1. Scope & files you own

| Layer | Path | Current state | Target |
| --- | --- | --- | --- |
| UI | `app/bank-transfer/page.tsx` | Tailwind + global-CSS wizard, simulated transfer | Real transfer wired to API |
| UI | `app/bank-transfer/layout.tsx` | metadata-only passthrough | Keep/clean |
| CSS (delete) | `app/bank-transfer/globals.css` | orphan duplicate of `app/globals.css` | Delete |
| UI | `app/pay-bills/page.tsx` | styled-jsx wizard, hardcoded billers, not responsive | Real bill payment wired to API |
| API | `app/api/transfer/route.ts` | **critically insecure**: SQLi, no auth, no balance/ownership/atomicity | Secure atomic transfer |
| API (new) | `app/api/billers/route.ts` | does not exist | List billers |
| API (new) | `app/api/pay-bills/route.ts` | does not exist | Pay a bill |
| Assets | `public/billers/*` | referenced but missing | Provide or replace with icons |

You do **not** own auth, accounts CRUD, statements, or shared components.

---

## 2. What the foundation gives you (from Member 1)

- `components/shell/AppShell`, `PageHeader`, `StatusScreen` (success/failure screen — reuse for both wizards).
- `components/ui/*` — `Button`, `Card`, `Input`, `Label`, `Field`, `Badge`, `Stepper` (if present, else build the steps with `Card`).
- `lib/db.ts` — `query<T>(text, params)`, `getClient()` for transactions (BEGIN/COMMIT), `serviceFailure(err)`.
- `lib/auth.ts` — `requireSession()`, `verifyPin(accountId, pin)`.
- TanStack Query provider mounted in the root layout.

> If `getClient()` for explicit transactions is not yet exported by `lib/db.ts`, coordinate with
> Member 1 — you need a pooled client to run `BEGIN ... COMMIT/ROLLBACK` for an atomic transfer.

---

## 3. Backend tasks

### 3.1 Rewrite `app/api/transfer/route.ts` (POST)

This is the most safety-critical endpoint. Requirements:

- Auth: `requireSession()`. The `fromAccount` **must** belong to the authenticated user — verify with a
  query, never trust the body.
- Validate body with zod: `fromAccount` (string, owned), `toAccount` (string, exists, != fromAccount),
  `amount` (positive number, 2dp, <= balance), optional `description` (<= 140 chars), `pin` (4 digits).
- Verify the PIN of the source account with `verifyPin()`.
- Run the whole movement in **one DB transaction** using `getClient()`:

```ts
const client = await getClient()
try {
  await client.query('BEGIN')
  // lock + check balance
  const from = await client.query(
    'SELECT balance FROM accounts WHERE account_number = $1 AND user_id = $2 FOR UPDATE',
    [fromAccount, session.userId]
  )
  if (!from.rows[0]) throw new Error('FORBIDDEN')
  if (Number(from.rows[0].balance) < amount) throw new Error('INSUFFICIENT_FUNDS')
  await client.query('UPDATE accounts SET balance = balance - $1 WHERE account_number = $2', [amount, fromAccount])
  await client.query('UPDATE accounts SET balance = balance + $1 WHERE account_number = $2', [amount, toAccount])
  const tx = await client.query(
    `INSERT INTO transactions (from_account, to_account, amount, description, created_by, status)
     VALUES ($1,$2,$3,$4,$5,'SUCCESS') RETURNING *`,
    [fromAccount, toAccount, amount, description, session.userId]
  )
  await client.query(
    `INSERT INTO audit_logs (event, payload) VALUES ('transfer', $1)`,
    [JSON.stringify({ userId: session.userId, fromAccount, toAccount, amount })]
  )
  await client.query('COMMIT')
  return Response.json({ ok: true, transaction: tx.rows[0] })
} catch (err) {
  await client.query('ROLLBACK')
  // map known errors to 400/403; everything else -> serviceFailure
} finally {
  client.release()
}
```

- Never echo SQL. Map `INSUFFICIENT_FUNDS`/`FORBIDDEN`/validation to safe 400/403 messages.

### 3.2 `app/api/billers/route.ts` (GET)

- Return the list of billers. Seed a `billers` table (coordinate with Member 1 to add it to the schema,
  or create it in your own migration): `id, slug, name, category, logo_path`.
- No secrets; this can be available to any authenticated user.

### 3.3 `app/api/pay-bills/route.ts` (POST)

- Same security model as transfer: `requireSession()`, owned `fromAccount`, PIN verify, zod validation
  (`billerId`, `reference`/account at biller, `amount`).
- Atomic transaction: debit the user's account, insert a `transactions` row (`to_account` = biller
  reference or a biller settlement account), write an audit log. Reject insufficient funds.

---

## 4. Frontend tasks

### 4.1 Bank Transfer (`app/bank-transfer/page.tsx`)

- Wrap in `AppShell` + `PageHeader title="Bank Transfer"`. Remove dependency on the global
  `.transfer-card`/`.next-btn` CSS classes; rebuild the wizard with `Card`, `Field`, `Button`.
- Steps: **form -> confirm -> result**. Use `react-hook-form` + `zod` (mirror the API schema).
- On confirm, prompt for the 4-digit PIN, then `useMutation` -> `POST /api/transfer`. Render the shared
  `StatusScreen` for success (show returned confirmation/transaction id) and failure (show safe error).
- Fully responsive (the current 12-col grid is not). Use `next/image` for any imagery.
- Delete `app/bank-transfer/globals.css`.

### 4.2 Pay Bills (`app/pay-bills/page.tsx`)

- Wrap in `AppShell` + `PageHeader title="Pay Bills"`. Replace styled-jsx with shared components.
- Steps: **select biller -> payment form (+PIN) -> result**.
- Fetch billers via `GET /api/billers`; make the biller grid responsive (1/2/3/4 columns by breakpoint).
- Submit via `POST /api/pay-bills`; reuse `StatusScreen`.
- Provide `public/billers/*` assets or switch to `lucide-react` category icons so nothing 404s.

---

## 5. Acceptance criteria

- Transfers are **atomic** (no partial debit/credit), reject overdrafts and unauthorized source accounts,
  and require a valid PIN. No SQLi; `runStatement` not imported.
- Both wizards are responsive, use shared components + `StatusScreen`, and show safe error messages only.
- Audit-log rows written for transfers and bill payments.
- Vitest tests: transfer rejects insufficient funds, foreign source account, and bad PIN; rolls back on error.
- Playwright happy-path for both wizards. `npm run lint && npm run typecheck && npm run build` pass.

---

## 6. Cursor prompt (paste into Cursor Agent on your feature branch)

```
You are implementing the "Bank Transfer & Pay Bills" area of a Next.js 16 / React 19 banking app.
Read docs/team-plans/README.md and docs/team-plans/member-3-transfer-paybills.md fully, then implement
everything in section 3 (backend) and section 4 (frontend) of my guide.

Hard rules:
- Use only the shared foundation: components/ui/*, components/shell/* (AppShell, PageHeader, StatusScreen),
  lib/db.ts (query, getClient, serviceFailure), lib/auth.ts (requireSession, verifyPin), TanStack Query.
- All SQL via parameterized query()/client.query(); never string-interpolate SQL; never import runStatement.
- Money movement MUST run in a single DB transaction (BEGIN/COMMIT/ROLLBACK) with SELECT ... FOR UPDATE,
  a balance check, owner verification of the source account, and PIN verification. Reject overdrafts.
- Every route calls requireSession() and verifies the source account belongs to the user. Validate all
  inputs with zod. Never echo SQL, secrets, PINs, or stack traces.
- Forms use react-hook-form + zod. No styled-jsx/CSS modules; use design tokens. Use next/image.

Deliverables:
1. Rewrite app/api/transfer/route.ts as a secure atomic transfer (auth, ownership, PIN, FOR UPDATE,
   balance check, transaction row + audit log, ROLLBACK on error).
2. Create app/api/billers/route.ts (GET list) and app/api/pay-bills/route.ts (POST, same security model).
3. Rebuild app/bank-transfer/page.tsx (form -> confirm+PIN -> StatusScreen) wired to /api/transfer; make it
   responsive; delete app/bank-transfer/globals.css.
4. Rebuild app/pay-bills/page.tsx (select biller -> form+PIN -> StatusScreen) wired to /api/billers and
   /api/pay-bills; responsive biller grid; provide public/billers assets or lucide icons.
5. Add Vitest tests (insufficient funds, foreign account, bad PIN, rollback) and Playwright happy-paths.

Finish by running npm run lint, npm run typecheck, and npm run build and fixing any issues you introduced.
```
