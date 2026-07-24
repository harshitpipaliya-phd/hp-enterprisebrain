# RUNTIME_FIX_REPORT.md

> Every fix below was verified by actually starting the compiled server and hitting it with real curl requests — not inferred from reading the code. Commands and raw output are included.

---

## Root Cause

**There was no CORS middleware in the API at all.** The `cors` package wasn't even a dependency. Two of your three reported symptoms follow directly from that:

- **"OPTIONS preflight returns 401"** — without CORS middleware to intercept and answer OPTIONS requests, a browser's preflight (which never carries an `Authorization` header) fell through to `authMiddleware`, mounted via `router.use(authMiddleware, ...)` on every route including implicitly OPTIONS. `authMiddleware` rejects anything without a Bearer token — hence 401.
- **"CORS error" / "Failed to fetch"** — a failed preflight means the browser never sends the real request at all. `fetch()` surfaces that as a network-level `TypeError: Failed to fetch`, not an HTTP error, which matches exactly what was reported.

**The third symptom — `GET http://localhost:4000/api/organizations` → "Cannot GET"** — is not a routing bug. The API has always mounted organizations at `/api/v1/organizations` (visible in `app.ts`, unchanged by this fix). I reproduced the exact 404 by hitting `/api/organizations` (no `/v1`) against the running server — it's correct behavior for a URL that was never a valid route. Renaming the prefix to match would be an architecture/contract change, which I was told not to make. If your test tooling is hitting `/api/organizations`, that tooling needs the `/v1` segment, not the API.

**One additional defect found during live verification, not in your original list:** an unhandled promise rejection inside `auth.routes.ts` (a `throw e;` for any non-"already exists" error) was crashing the entire Node process whenever a route touched a database that wasn't reachable — not just failing that one request, but taking down every other route including `/health` until the process was restarted. This would independently produce "Failed to fetch" for *any* request made after the crash. I'm including the fix since a process-wide crash is squarely a runtime integration failure, but flagging it clearly as something outside your original three symptoms — see "Remaining Issues" for what I did *not* do about it.

---

## Files Modified

```
api/src/app.ts       — added CORS middleware, mounted first
api/src/config.ts     — added CORS_ORIGIN env var (default: http://localhost:5173)
api/src/server.ts     — added process-level unhandledRejection/uncaughtException handlers
api/package.json      — added cors + @types/cors dependencies
```

No routes, contracts, graph schema, or authentication logic were touched.

---

## Routes Fixed

None were broken. All routes were already correctly registered under `/api/v1/*` (confirmed by reading `app.ts` and reproducing the "Cannot GET /api/organizations" 404 against the *correct*, unmodified routing table). The fix was entirely in middleware ordering, not route registration.

---

## Middleware Changes

`cors()` is now the **first** middleware in the chain, before `express.json()`, before `tracingMiddleware`, and before every router (which is where `authMiddleware` lives, per-router via `router.use(authMiddleware, ...)`). This ordering matters specifically because the `cors` package fully answers OPTIONS requests itself and never calls `next()` for them — so as long as it's registered before a router, OPTIONS never reaches that router's `authMiddleware` at all.

`authMiddleware` itself was **not modified**. It still rejects any non-OPTIONS request without a valid Bearer token, exactly as before — confirmed by testing `GET /api/v1/organizations/t1` with no token, which correctly still returns `401 {"error":"missing_token"}`.

---

## CORS Changes

```js
app.use(cors({
  origin: config.CORS_ORIGIN.split(',').map(o => o.trim()), // default: http://localhost:5173
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
```

`CORS_ORIGIN` is configurable via env (comma-separated for multiple origins) rather than hardcoded, so this doesn't need another code change when you deploy behind a different frontend URL.

---

## Verification Performed

All of the following were run against the actual compiled server (`node dist/src/server.js`), not simulated:

```
$ curl http://localhost:4000/health
{"status":"ok","sprint":1,...}                                    → 200 ✅

$ curl http://localhost:4000/api/organizations
Cannot GET /api/organizations                                     → 404 (expected — wrong URL, see Root Cause)

$ curl http://localhost:4000/api/v1/organizations/t1
{"error":"missing_token"}                                          → 401 (expected — auth still enforced)

$ curl -X OPTIONS http://localhost:4000/api/v1/organizations \
    -H "Origin: http://localhost:5173" \
    -H "Access-Control-Request-Method: GET"
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PATCH,PUT,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization                → the bug, confirmed fixed
```

Also verified: the process survives a request that touches an unreachable database (previously fatal), confirmed by hitting `/health` and the OPTIONS preflight again immediately after — both still responded correctly.

Build verification:
```
cd contracts && npm run generate   → OK
cd database && npx tsc             → 0 errors
cd events && npx tsc               → 0 errors
cd api && npx tsc                  → 0 errors
cd api && node --test dist/tests/*.test.js  → 121/121 passing
cd web && npx tsc --noEmit         → 0 errors
```

**Not verified: the actual browser loading the Organization Management page.** I have no browser or live Postgres/Neo4j in this environment — I verified the exact HTTP-level mechanics (CORS headers, preflight status, auth enforcement) that were causing the browser-reported failure, using curl against a real running server, but I can't confirm the React app's fetch call resolves successfully without a live database behind it and an actual browser to observe. Please do the final click-through yourself with `npm run dev` on both workspaces and a live Postgres/Neo4j — that's the one verification step in your list I genuinely cannot perform here.

---

## Remaining Issues

1. **A DB-touching request still hangs (times out) rather than returning a clean 500**, because `auth.routes.ts` (and likely other routes following the same pattern) re-throw caught errors instead of calling `res.status(500).json(...)`. My fix stops that from crashing the *whole server*, but the *individual* request will still hang until the client times out. Properly fixing this means wrapping every async route handler or adding consistent `next(err)` + a global Express error-handling middleware — that's a larger, more invasive change than this "repair only" scope justified doing silently. Flagging it rather than fixing it without asking.
2. **No live Postgres/Neo4j in this environment**, so the actual organizations query (once authenticated) was not verified end-to-end — only the CORS/auth layer in front of it.
3. **The browser click-through itself is unverified** — see note above.

No architecture, contracts, graph schema, or authentication behavior were changed. Stopping here as instructed.
