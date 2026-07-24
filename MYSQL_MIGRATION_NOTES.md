# What I found and fixed in your MySQL migration

## 1. Critical bug fixed: 122 columns would have failed to create

Your migration files (`database/migrations/*.sql`) used `TEXT PRIMARY KEY` and
`TEXT ... UNIQUE` in 23 of the 28 files. This is valid in Postgres/SQLite but
**MySQL rejects it outright** — MySQL requires an explicit key length for any
TEXT/BLOB column used in a PRIMARY KEY, UNIQUE constraint, or index (error
1170: "BLOB/TEXT column used in key specification without a key length").

Every migration would have failed the moment it tried to create a table.

**Fix applied:** every `id`-named column (primary keys and foreign-key-style
`_id` columns) is now `VARCHAR(36)` (fits a UUID exactly). Every other
TEXT column referenced by a UNIQUE constraint or index (`org_code`, `email`,
`status`, `entity_type`, `key_hash`, etc. — 26 of them, found by cross-checking
every `CREATE INDEX` statement against the real column types) is now
`VARCHAR(255)`. Free-text columns not used in any key (descriptions, names,
notes) were left as `TEXT`, since those are fine.

I verified: zero remaining `TEXT PRIMARY KEY` / `TEXT ... UNIQUE` patterns,
and cross-checked every `CREATE INDEX` statement against actual column types
— zero remaining mismatches. Also checked for other common Postgres→MySQL
porting mistakes (`JSONB`, `SERIAL`, `gen_random_uuid()`, `ON CONFLICT`,
`RETURNING`, Postgres array types) — none present, your migrations were
otherwise clean.

## 2. Important: MySQL alone will not run this app

Your MySQL credentials cover most of the app — Departments, People,
Capabilities, Decisions, Signals, Evidence, and everything the dashboards
use. That migration work (yours or kilocode's) is real and mostly correct.

**But login will not work with only MySQL.** `api/src/auth/auth.repository.ts`
and `auth.service.ts` still call Neo4j directly — nobody can sign in without
a reachable Neo4j instance. A few other features (Graph Explorer, the
graph-sync consumer) also still depend on it.

You have two real options:
- **Get a Neo4j instance running too** (local Docker, or a free Neo4j Aura
  instance) and set `NEO4J_URI`/`NEO4J_USERNAME`/`NEO4J_PASSWORD` in
  `api/.env` — the fastest path to something that actually runs today.
- **Migrate auth to MySQL too** — a real follow-up task, not a config change:
  rewrite `auth.repository.ts` to use `@hpbrain/database` the same way
  `department.routes.ts` etc. already do. I can do this next if you want.

## 3. Files I've set up for you

- `database/.env` — your real MySQL host/port/database/username, with
  `DB_SSL=true` (recommended for a remote host reachable over the open
  internet — confirm with your sir whether their MySQL server supports SSL).
- `api/.env` — same MySQL settings, plus a placeholder Neo4j block you need
  to fill in, plus a placeholder `JWT_SECRET` you must replace before running
  in production (the app refuses to boot with the default secret when
  `NODE_ENV=production`, by design — that's a real security check, not a bug).

**You still need to fill in your real `DB_PASSWORD` and a real `JWT_SECRET`**
in both `.env` files — I left them as placeholders since I don't have your
actual password beyond what you typed in chat, and a JWT secret should be
freshly generated, not something I choose for you.

## 4. Next steps, in order

```bash
# 1. Fill in the two .env files above with your real password + JWT secret

# 2. Run the (now-fixed) migrations against your company's MySQL
cd database
npm install
npm run migrate

# 3. Get Neo4j reachable (see section 2), then start the API
cd ../api
npm install
npm run dev

# 4. Start the frontend
cd ../web
npm install
npm run dev
```

If `npm run migrate` still fails, paste me the exact error — that'll tell us
if there's a permissions issue on the `dev_db` MySQL user (e.g. it may not
have `CREATE TABLE` rights) rather than a SQL syntax problem.
