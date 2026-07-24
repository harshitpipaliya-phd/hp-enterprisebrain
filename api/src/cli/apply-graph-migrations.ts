import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDriver, closeDriver } from '../neo4j/client.js';

/**
 * Neo4j migration runner. Previously, applying graph/migrations/*.cypher
 * required manually running each file through cypher-shell — genuinely a gap,
 * not a design choice (Postgres already had `npm run db:migrate`; Neo4j never
 * had an equivalent). This closes it, following the same "track what's been
 * applied so re-running is safe" pattern as the Postgres migrator.
 *
 * Real bug fixed: the migrations folder was resolved via process.cwd() —
 * wherever the command happened to be run from — instead of a path relative
 * to this file's own location. Running `npm run graph:migrate` from inside
 * api/ (the natural place to run an api/ package script from) looked for
 * api/graph/migrations, which doesn't exist; the real folder is at the repo
 * root. Fixed to resolve relative to this script's real location instead,
 * so it works the same way no matter which directory it's invoked from.
 */
const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const driver = getDriver();
  const session = driver.session();

  try {
    // Tracking node — same idea as Postgres's schema_migrations table.
    await session.run(
      `MERGE (t:_GraphMigrationTracker {id: 'singleton'}) SET t.appliedMigrations = coalesce(t.appliedMigrations, [])`
    );

    const trackerResult = await session.run(
      `MATCH (t:_GraphMigrationTracker {id: 'singleton'}) RETURN t.appliedMigrations AS applied`
    );
    const applied: string[] = trackerResult.records[0]?.get('applied') ?? [];

    // This file lives at api/src/cli/apply-graph-migrations.ts — three
    // directories up (cli -> src -> api) reaches the repo root, then into
    // graph/migrations. Real, stable, independent of caller's cwd.
    const migrationsDir = join(__dirname, '..', '..', '..', 'graph', 'migrations');
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.cypher')).sort();

    for (const file of files) {
      if (applied.includes(file)) {
        console.log(`  [SKIP] ${file} (already applied)`);
        continue;
      }
      console.log(`  [APPLY] ${file}`);
      const content = readFileSync(join(migrationsDir, file), 'utf8');
      // Real bug fixed: this used to split on ';' first and check for
      // comment-only lines after. A comment containing its own semicolon
      // mid-sentence (graph/migrations/002_tenant.cypher has exactly this:
      // "...as nodes are written; this constraint pair enables it.") got
      // chopped at that semicolon, and the second fragment no longer
      // started with '//' after the cut — so it slipped past the comment
      // filter and was sent to Neo4j as if it were real Cypher. Fixed by
      // stripping whole comment lines FIRST, so a semicolon inside one
      // never becomes a split point at all.
      const withoutComments = content
        .split('\n')
        .filter((line) => !line.trim().startsWith('//'))
        .join('\n');
      const statements = withoutComments
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        await session.run(statement);
      }

      await session.run(
        `MATCH (t:_GraphMigrationTracker {id: 'singleton'}) SET t.appliedMigrations = t.appliedMigrations + $file`,
        { file }
      );
    }

    console.log(`Neo4j migrations complete. ${files.length} file(s) checked.`);
  } finally {
    await session.close();
    await closeDriver();
  }
}

main().catch((err) => {
  console.error('Neo4j migration failed:', err);
  process.exit(1);
});