/**
 * Backwards-compatible shim.
 *
 * The secure data layer now lives in `lib/db.ts`. New code MUST import
 * { query, getClient, ensureDatabase, serviceFailure } from '@/lib/db' and use
 * parameterized queries.
 *
 * The `runStatement` / `asText` helpers below are DEPRECATED. They execute raw,
 * non-parameterized SQL and are only retained so feature routes that have not
 * yet been migrated keep compiling. Do not use them in new work — they will be
 * removed once Members 2-4 migrate their routes to `query()`.
 */
import { ensureDatabase, pool } from './db'

export {
  ensureDatabase,
  getClient,
  pool,
  query,
  serviceFailure
} from './db'

/** @deprecated Use parameterized `query()` from '@/lib/db'. */
export async function runStatement(sql: string) {
  await ensureDatabase()
  return pool.query(sql)
}

/** @deprecated String coercion is not SQL sanitization. Use `query()` params. */
export function asText(value: unknown) {
  if (value === undefined || value === null) return ''
  return String(value)
}
