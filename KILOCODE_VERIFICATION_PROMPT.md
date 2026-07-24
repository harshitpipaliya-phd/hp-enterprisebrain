# KiloCode Prompt: Verify and Run HP Enterprise Brain (Sprints 1–6)

You are verifying, not building. Do not write, fix, or modify any code unless a check
below explicitly fails and the fix is trivial (e.g. a typo'd env var). Your job is to
run real commands, show their real raw output, and report honestly — including if
something does NOT work.

## Ground rules

- Every claim of "works" or "passes" must be followed by the actual terminal output
  that proves it, not a summary of what you expect it to say.
- If a command fails, show the full error. Do not paraphrase it away.
- Do not say "Sprint X is complete" unless every check under that sprint actually
  passed with shown evidence.
- This repo already contains honest self-assessment files — read them first and treat
  them as your baseline, not as something to contradict without new evidence:
  `Version1_Report.md`, `Known_Issues.md`, `SPRINT5_ARCHITECTURE.md`,
  `SPRINT6_ARCHITECTURE.md`, `Test_Report.md`. If your findings differ from what
  those files say, flag the discrepancy explicitly — don't silently overwrite it.

---

## Step 1 — Environment check

```powershell
node --version
npm --version
Get-Service -Name postgresql* | Format-Table -AutoSize
```

Confirm Postgres shows `Running`. If Neo4j is via Neo4j Desktop, confirm
`http://localhost:7474` responds (use `Invoke-WebRequest -Uri http://localhost:7474`
or just note that it must be manually confirmed running in the Desktop app).

**Stop and report back if either database isn't reachable — do not proceed to fake
the remaining steps.**

## Step 2 — Install and generate

```powershell
npm install
npm run generate
```

Show the full output of both. `generate` should show 3 `[OK]` lines.

## Step 3 — Migrations

```powershell
npm run db:migrate
```

Show output. It should list each `.sql` file applied, or say "no pending migrations"
if already run. If it errors, show the full error and stop.

For Neo4j (no automated runner exists — this is expected, not a bug):

```powershell
Get-ChildItem graph/migrations/*.cypher | ForEach-Object {
    Write-Host "Applying $($_.Name)..."
    cypher-shell -u neo4j -p password -f $_.FullName
}
```

Show output per file.

## Step 4 — Build every workspace

Run each separately and show the exit result of each:

```powershell
cd database; npx tsc; cd ..
cd events; npx tsc; cd ..
cd api; npx tsc; cd ..
cd web; npx tsc --noEmit; cd ..
```

A clean `tsc` run prints nothing and exits 0 — confirm with
`echo $LASTEXITCODE` after each if the output is empty, don't assume silence means
success without checking.

## Step 5 — Run the real test suite and report the exact count

```powershell
cd api
node --test dist/tests/*.test.js
cd ..
```

Report the exact `# pass` / `# fail` numbers from the output. **Do not round, estimate,
or state a number from memory of what it "should" be — copy the literal line from the
terminal.** If the count differs from 144, that is itself an important finding — report
it, don't hide it.

## Step 6 — Start both servers and prove they're actually up

```powershell
cd api
npm run dev
```

In a second terminal:

```powershell
Invoke-WebRequest -Uri http://localhost:4000/health -UseBasicParsing
```

Show the actual JSON response.

Third terminal:

```powershell
cd web
npm run dev
```

Confirm it reports serving on `http://localhost:5173` — show that line.

## Step 7 — Exercise one real request per sprint (this is the part that actually proves functionality, not just "it builds")

With the API running, using a REST client or `Invoke-RestMethod`:

1. **Sprint 1**: Register/login (dev-token flow), create an Organization. Confirm a
   real ID comes back, not an error.
2. **Sprint 2–4**: Create a Signal → attach Evidence to it → generate a ReasoningStep
   → generate a Recommendation → approve a Decision. Show each response body.
3. **Sprint 5**: Extract a Learning with a `domain` field on a successful Outcome.
   Then `GET /api/v1/mental-models/:tenantId` and confirm the model appears.
4. **Sprint 6**: Create a `business_rule` Policy with an `auto_approve` rule. Generate
   a matching (non-`opportunity`-category) Recommendation. Call
   `POST /api/v1/decisions/:tenantId/:recId/auto-approve-attempt` and confirm
   `"autoApproved": true` with `"decidedBy": "system:policy-engine"`. Then repeat
   with an `opportunity`-category recommendation and confirm it correctly refuses
   to auto-approve — **this negative case matters as much as the positive one.**

## Step 8 — Browser check

Open `http://localhost:5173`, log in, navigate to an Organization, and confirm the
Intelligence Workspace and Decision Analytics screens actually render data (or
correctly render "no data yet" if the database is genuinely empty — that's not a
failure, that's honest).

---

## Final report format

Produce `LOCAL_VERIFICATION_REPORT.md` with:

- Environment: Postgres/Neo4j versions and confirmed running (yes/no with evidence)
- Migrations: applied count, any errors
- Build: pass/fail per workspace, with raw output
- Tests: exact pass/fail count, raw output
- Servers: confirmed running, with raw `/health` response
- Per-sprint functional check: pass/fail with the actual request/response for each,
  not a description of what should have happened
- Any discrepancy found against `Version1_Report.md` / `Known_Issues.md` — explicitly
  named, not smoothed over

If everything in Steps 1–8 genuinely passes with shown evidence, the honest
conclusion is: **the code that was already claimed as verified is now also verified
against a live database** — not a new, bigger claim than that. Do not upgrade the
project to "Version 1.0" or "fully complete" based on this alone; the known gaps
listed in `Known_Issues.md` (Search, AI Platform, multi-agent, digital twin, etc.)
remain unbuilt regardless of how clean this run is.
