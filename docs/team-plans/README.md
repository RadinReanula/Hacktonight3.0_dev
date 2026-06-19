# Team Implementation Guides — Nova Bank Redesign

This folder contains the per-member implementation plans for turning the prototype into an
industry-standard banking app. Each guide is **self-contained** and written so the owning member
can paste the "Cursor prompt" section into Cursor Agent and build their area independently.

## Member assignments (full-stack ownership)

| Member | Area | Guide |
| --- | --- | --- |
| Member 1 (Lead) | Foundation, Auth & Security | implemented directly in the repo (design system, secure DB/auth, middleware, CI) |
| Member 2 | Dashboard & Accounts | [member-2-dashboard-accounts.md](member-2-dashboard-accounts.md) |
| Member 3 | Bank Transfer & Pay Bills | [member-3-transfer-paybills.md](member-3-transfer-paybills.md) |
| Member 4 | E-Statement & Smart Spend | [member-4-estatement-smartspend.md](member-4-estatement-smartspend.md) |

## How to use a guide in Cursor

1. Pull the latest `main` so you have Member 1's foundation (design system + `lib/db`, `lib/auth`, `middleware.ts`).
2. Create a feature branch: `git checkout -b feat/<your-area>`.
3. Open Cursor, start an Agent chat, and paste the **"Cursor prompt"** block from your guide.
4. Work through the task checklist; keep to the **shared standards** below.
5. Open a PR. CI (lint + typecheck + build) must pass.

## Shared standards (everyone follows)

These are provided by Member 1's foundation. Do not reinvent them.

- **UI components** live in `components/ui/*` (shadcn-style: `Button`, `Card`, `Input`, `Label`,
  `Field`, `Badge`, `Table`, etc.) and shared shell components in `components/shell/*`
  (`AppShell`, `Sidebar`, `TopBar`, `PageHeader`, `StatusScreen`). Use `cn()` from `lib/utils.ts`.
- **Design tokens** are CSS variables defined in `app/globals.css` (`@theme inline`). Use semantic
  Tailwind classes (`bg-card`, `text-muted-foreground`, `bg-primary`, `rounded-lg`) — never hardcode
  hex colors and never add new `styled-jsx` or CSS-module files.
- **Data fetching**: client components use TanStack Query via the provider already mounted in the
  root layout; wrap calls in typed helpers under `lib/api/*`. Forms use `react-hook-form` + `zod`.
- **Backend rules (non-negotiable)**:
  - All SQL goes through `query(text, params)` from `lib/db.ts`. **Never** build SQL with string
    interpolation. **Never** import or use the deprecated `runStatement`.
  - Validate every request body / query param with a `zod` schema.
  - Every protected route calls `requireSession()` (or `requireRole('admin')`) from `lib/auth.ts`
    and enforces that the authenticated user **owns** the resource it touches.
  - Never return secrets, stack traces, raw SQL, PINs, or password hashes in responses. Use
    `serviceFailure()` from `lib/db.ts` for 500s.
- **Quality**: write Vitest unit tests for API logic and a Playwright happy-path e2e for each page.
  Run `npm run lint`, `npm run typecheck`, and `npm run build` before opening a PR.

## Definition of done (per feature)

- Page uses only shared design-system components, is responsive (mobile/tablet/desktop), and passes
  basic a11y (labels, focus, keyboard).
- Every API call is validated, parameterized, session-protected, and ownership-checked.
- Tests written; lint + typecheck + build green in CI.
