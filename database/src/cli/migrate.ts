import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getPool, closePool } from '../connection.js';
import { config } from '../config.js';

const MIGRATIONS_DIR = join(process.cwd(), 'database', 'migrations');

function splitStatements(sql: string): string[] {
  const withoutComments = sql
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('--');
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join('\n');
  return withoutComments
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function ensureSchemaTable(): Promise<void> {
  const pool = getPool();
  await pool.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (filename VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const pool = getPool();
  const [rows] = await pool.query<any[]>('SELECT filename FROM schema_migrations');
  return new Set(rows.map((r: Record<string, unknown>) => String(r.filename)));
}

async function applyMigration(filePath: string): Promise<void> {
  const sql = await readFile(filePath, 'utf8');
  const pool = getPool();
  const statements = splitStatements(sql);
  for (const statement of statements) {
    await pool.execute(statement);
  }
  const filename = filePath.split(/[\\/]/).pop()!;
  await pool.execute('INSERT INTO schema_migrations (filename) VALUES (?) ON DUPLICATE KEY UPDATE filename = filename', [filename]);
}

export async function migrate(): Promise<void> {
  await ensureSchemaTable();
  const applied = await getAppliedMigrations();
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  const pending = files.filter((f) => !applied.has(f));
  if (!pending.length) {
    console.log('No pending migrations.');
    return;
  }
  for (const file of pending) {
    const fullPath = join(MIGRATIONS_DIR, file);
    console.log(`Applying ${file}...`);
    await applyMigration(fullPath);
    console.log(`Applied ${file}`);
  }
  console.log(`Applied ${pending.length} migration(s).`);
}

export async function rollbackLast(): Promise<void> {
  if (config.DB_DATABASE === 'hp_brain') {
    throw new Error('Destructive database operations are blocked on hp_brain.');
  }
  const pool = getPool();
  const [rows] = await pool.query<any[]>('SELECT filename FROM schema_migrations ORDER BY applied_at DESC LIMIT ?', [1]);
  if (!rows.length) { console.log('Nothing to rollback.'); return; }
  const last = String(rows[0].filename);
  const base = last.replace(/\.sql$/, '');
  const rollbackSql = `DROP TABLE IF EXISTS ${base}`;
  await pool.execute(rollbackSql);
  await pool.execute('DELETE FROM schema_migrations WHERE filename = ?', [last]);
  console.log(`Rolled back ${last}`);
}

export async function status(): Promise<void> {
  await ensureSchemaTable();
  const applied = await getAppliedMigrations();
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    console.log(`${applied.has(f) ? 'APPLIED' : 'PENDING'}  ${f}`);
  }
}

async function main(): Promise<void> {
  const cmd = process.argv[2];
  if (cmd === 'rollback') await rollbackLast();
  else if (cmd === 'status') await status();
  else await migrate();
  await closePool();
}

main().catch((e) => { console.error(e); process.exit(1); });
