import { Pool, type PoolClient, type QueryResultRow } from 'pg'
import { hashSecret } from './hash'

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:supersecurepassword@localhost:5432/htn26db'

export const pool = new Pool({
  connectionString,
  max: 10
})

let booted: Promise<void> | null = null

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  full_name TEXT NOT NULL,
  nic TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_number TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  from_account TEXT NOT NULL,
  to_account TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  created_by INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billers (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  logo_path TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_account);
CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_account);
`

type SeedUser = {
  id: number
  username: string
  password: string
  role: string
  fullName: string
  nic: string
  email: string
}

type SeedAccount = {
  userId: number
  accountNumber: string
  accountName: string
  balance: number
  pin: string
}

const seedUsers: SeedUser[] = [
  {
    id: 1,
    username: 'dilara',
    password: 'password123',
    role: 'customer',
    fullName: 'Dilara Perera',
    nic: '200112345678',
    email: 'dilara@example.test'
  },
  {
    id: 2,
    username: 'kasun',
    password: 'kasun12345',
    role: 'customer',
    fullName: 'Kasun Wickramanayake',
    nic: '199812345678',
    email: 'kasun@example.test'
  },
  {
    id: 3,
    username: 'admin',
    password: 'admin12345',
    role: 'admin',
    fullName: 'Platform Administrator',
    nic: '000000000000',
    email: 'root@example.test'
  }
]

const seedAccounts: SeedAccount[] = [
  {
    userId: 1,
    accountNumber: '1000003423',
    accountName: 'Dilara Savings',
    balance: 100000.0,
    pin: '1234'
  },
  {
    userId: 1,
    accountNumber: '1000004876',
    accountName: 'Dilara Expenses',
    balance: 42000.0,
    pin: '1234'
  },
  {
    userId: 2,
    accountNumber: '2000006754',
    accountName: 'Kasun Current',
    balance: 9870.0,
    pin: '4321'
  },
  {
    userId: 3,
    accountNumber: '9999999999',
    accountName: 'Admin Vault',
    balance: 9999999.99,
    pin: '9999'
  }
]

const seedBillers = [
  { slug: 'ceb', name: 'Ceylon Electricity Board', category: 'Electricity' },
  { slug: 'water-board', name: 'National Water Board', category: 'Water' },
  { slug: 'dialog', name: 'Dialog Axiata', category: 'Mobile' },
  { slug: 'hutch', name: 'Hutch', category: 'Mobile' },
  { slug: 'airtel', name: 'Airtel', category: 'Mobile' },
  { slug: 'cable-tv', name: 'Cable TV', category: 'Entertainment' },
  { slug: 'aia', name: 'AIA Insurance', category: 'Insurance' },
  { slug: 'lolc', name: 'LOLC Finance', category: 'Finance' }
]

async function seedDatabase() {
  const existing = await pool.query('SELECT COUNT(*)::int AS count FROM users')
  if (existing.rows[0].count > 0) return

  for (const user of seedUsers) {
    const passwordHash = await hashSecret(user.password)
    await pool.query(
      `INSERT INTO users (id, username, password_hash, role, full_name, nic, email)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        user.id,
        user.username,
        passwordHash,
        user.role,
        user.fullName,
        user.nic,
        user.email
      ]
    )
  }
  await pool.query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))")

  for (const account of seedAccounts) {
    const pinHash = await hashSecret(account.pin)
    await pool.query(
      `INSERT INTO accounts (user_id, account_number, account_name, balance, pin_hash)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (account_number) DO NOTHING`,
      [
        account.userId,
        account.accountNumber,
        account.accountName,
        account.balance,
        pinHash
      ]
    )
  }

  for (const biller of seedBillers) {
    await pool.query(
      `INSERT INTO billers (slug, name, category, logo_path)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO NOTHING`,
      [biller.slug, biller.name, biller.category, `/billers/${biller.slug}.png`]
    )
  }

  await pool.query(
    `INSERT INTO transactions (from_account, to_account, amount, description, created_by)
     VALUES
       ('1000003423', '2000006754', 4500.00, 'Lunch money', 1),
       ('1000004876', '1000003423', 10000.00, 'Internal move', 1),
       ('2000006754', '1000003423', 9870.00, 'Refund', 2)`
  )
}

/**
 * Lazily ensures the schema exists and demo data is seeded. Safe to call on
 * every request; the work runs at most once per process.
 */
export function ensureDatabase(): Promise<void> {
  if (!booted) {
    booted = (async () => {
      await pool.query(schema)
      await seedDatabase()
    })().catch((err) => {
      booted = null
      throw err
    })
  }
  return booted
}

/**
 * The ONLY supported way to run SQL. Always pass user input through `params`
 * placeholders ($1, $2, ...) — never interpolate values into `text`.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: ReadonlyArray<unknown> = []
) {
  await ensureDatabase()
  return pool.query<T>(text, params as unknown[])
}

/**
 * Checks out a pooled client for multi-statement transactions
 * (BEGIN / COMMIT / ROLLBACK). Always `client.release()` in a finally block.
 */
export async function getClient(): Promise<PoolClient> {
  await ensureDatabase()
  return pool.connect()
}

/**
 * Safe 500 response. Logs the real error server-side and returns a generic
 * message — never leaks SQL, stack traces, secrets, or the connection string.
 */
export function serviceFailure(reason: unknown) {
  console.error('[service-failure]', reason)
  return Response.json(
    { ok: false, message: 'Something went wrong. Please try again.' },
    { status: 500 }
  )
}
