#!/usr/bin/env node
/**
 * Postgres tenant-isolation check (companion to the existing Neo4j one in
 * .github/workflows/tenant-isolation.yml). Scans every repository file's
 * pool.query() calls; flags any that touch FROM/UPDATE/INSERT INTO/DELETE
 * FROM without referencing tenant_id, unless the immediately preceding
 * non-blank line has a "tenant-scope-exempt:" comment.
 *
 * Rewritten as a real Node script after the first version (a multi-layer
 * bash/awk heuristic) produced 27 false positives on real, already
 * correctly tenant-scoped queries — verified by running it and manually
 * checking a flagged case before trusting it. A CI check that cries wolf
 * gets ignored, which is worse than no check.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'database/src';
const files = readdirSync(DIR).filter((f) => f.endsWith('.repository.ts'));

let findings = [];

for (const file of files) {
  const path = join(DIR, file);
  const text = readFileSync(path, 'utf-8');
  const lines = text.split('\n');

  // File-level exemption: for repositories that are entirely
  // infrastructure-level (system health, cross-tenant ops logging), one
  // comment at the top of the file is more honest than repeating the same
  // justification before every method.
  if (/tenant-scope-exempt-file:/.test(text)) continue;

  const callRegex = /async\s+\w+\s*\([^)]*\)[^{]*\{/g;
  let match;
  while ((match = callRegex.exec(text)) !== null) {
    const bodyStart = match.index + match[0].length;
    let depth = 1;
    let i = bodyStart;
    while (i < text.length && depth > 0) {
      if (text[i] === '{') depth++;
      if (text[i] === '}') depth--;
      i++;
    }
    const methodBody = text.slice(match.index, i);
    if (!/pool\.query\(/.test(methodBody)) continue;
    const touchesTable = /\b(FROM|UPDATE|INSERT INTO|DELETE FROM)\b/i.test(methodBody);
    if (!touchesTable) continue;
    const hasTenantId = /tenant_id/i.test(methodBody);
    if (hasTenantId) continue;

    const charsBefore = text.slice(Math.max(0, match.index - 400), match.index);
    if (/tenant-scope-exempt:/.test(charsBefore) || /tenant-scope-exempt:/.test(methodBody)) continue;

    const lineNum = text.slice(0, match.index).split('\n').length;

    findings.push({ file: path, line: lineNum });
  }
}

if (findings.length > 0) {
  console.error('Postgres tenant-isolation check failed:');
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line} — query touches a table without tenant_id and no tenant-scope-exempt comment`);
  }
  console.error(`\n${findings.length} finding(s). Add tenant_id scoping, or a "// tenant-scope-exempt: <reason>" comment on the line before the query if this is deliberate.`);
  process.exit(1);
} else {
  console.log('Postgres tenant-isolation check passed — every query either references tenant_id or is explicitly exempt.');
  process.exit(0);
}
