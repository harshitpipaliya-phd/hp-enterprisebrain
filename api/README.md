# @hpbrain/api — Foundation API (Sprint 1, Story 1–3)

Foundation API for HP Enterprise Brain. Implements **Tenant Support** (Story 1), **Authentication & RBAC** (Story 2), and **Organization Management** (Story 3) on a tenant-scoped Neo4j repository and PostgreSQL persistence layer. Later stories add Department, People, Capability, Events, Contracts, and Audit on top.

## Stack
- Node.js + TypeScript (ESM)
- Express (HTTP)
- neo4j-driver (graph)
- `pg` (PostgreSQL)
- `zod` for input validation
- Tests: Node built-in `node:test`

## Layout
```
api/
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── config.ts            # env validation (zod)
│   ├── neo4j/client.ts      # driver + tenant-scoped sessions
│   ├── repository/base.ts   # BaseRepository — enforces tenantId on every query
│   ├── tenant/
│   │   ├── tenant.types.ts  # Tenant DTO
│   │   ├── tenant.service.ts# TenantRepository + TenantService
│   │   └── tenant.routes.ts # REST routes
│   ├── auth/
│   │   ├── auth.types.ts    # Auth DTOs
│   │   ├── jwt.ts           # JWT sign/verify (Node crypto, HS256)
│   │   ├── auth.repository.ts # Person credential queries
│   │   ├── auth.service.ts  # register/login/refresh
│   │   ├── auth.middleware.ts # Bearer token → req.user + RBAC
│   │   └── auth.routes.ts   # REST routes
│   ├── org/
│   │   ├── org.types.ts     # Organization DTOs
│   │   ├── org.service.ts   # OrganizationService (DI repository)
│   │   ├── org.graph.repository.ts # Neo4j Organization queries
│   │   └── org.routes.ts   # REST routes (CRUD + archive + audit)
│   ├── app.ts               # express app
│   └── server.ts            # entrypoint
└── tests/
    ├── tenant.test.ts
    ├── auth.test.ts
    ├── org.test.ts
    ├── org.neo4j.test.ts
    └── org.integration.test.ts
```

## Setup
```bash
npm install
cp api/.env.example api/.env   # set NEO4J_URI / credentials / JWT_SECRET
npm run db:migrate             # create PostgreSQL tables
npm run build
npm start
```

## Run tests (no DB needed — fake sessions)
```bash
cd api && npm test
# or: npx tsc && node --test dist/tests/*.test.js
```

## API

### Health
`GET /health` — `{ status, sprint, stories }`

### Tenants (Story 1)
Base path: `/api/v1/tenants`

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/tenants` | Create a tenant (`tenantId` = its own `id`) |
| GET | `/api/v1/tenants/:tenantId` | Read a tenant |
| POST | `/api/v1/tenants/:tenantId/activate` | Activate a tenant |
| GET | `/api/v1/tenants/:tenantId/stats` | Tenant-scoped node counts |

### Auth (Story 2)
Base path: `/api/v1/auth`

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/auth/register` | Register (creates `Person` node with scrypt password) |
| POST | `/api/v1/auth/login` | Login → returns `accessToken` + `refreshToken` |
| POST | `/api/v1/auth/refresh` | Refresh access token from refresh token |

### Organizations (Story 3)
Base path: `/api/v1/organizations`
Requires authentication. RBAC roles: `admin`, `org_admin`, `tenant_admin`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/organizations` | Create Organization |
| GET | `/api/v1/organizations/:tenantId` | List Organizations (optional `?status=active`) |
| GET | `/api/v1/organizations/:tenantId/:id` | Get single Organization |
| PATCH | `/api/v1/organizations/:tenantId/:id` | Update Organization |
| POST | `/api/v1/organizations/:tenantId/:id/archive` | Archive Organization |
| GET | `/api/v1/organizations/:tenantId/:id/audit` | Get Organization audit logs |

#### Example
```bash
# register
curl -X POST localhost:4000/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"tenantId":"t1","email":"admin@acme.com","password":"s3cret!","name":"Admin"}'
# → 201 { "accessToken": "...", "refreshToken": "..." }

# create org
curl -X POST localhost:4000/api/v1/organizations \
  -H 'authorization: Bearer <accessToken>' \
  -H 'content-type: application/json' \
  -d '{"tenantId":"t1","name":"Acme Corp","orgCode":"ACM","industry":"Technology"}'
```

## Graph
- Migration `graph/migrations/003_organization.cypher` adds `(:Organization)` constraints (id unique, tenantId NOT NULL, orgCode NOT NULL).
- `BaseRepository.run()` asserts every query includes a `tenantId` parameter AND a `tenantId` reference in the Cypher — failing fast if violated, mirroring the CI rule in `.github/workflows/tenant-isolation.yml`.
- `OrganizationGraphRepository` (api/src/org/org.graph.repository.ts) mirrors the PostgreSQL schema in Neo4j for graph-scoped queries.

## Database (PostgreSQL)
- Migration `database/migrations/001_organization.sql` creates the `organizations` table with all required fields.
- Migration `database/migrations/002_audit.sql` creates the `audit_logs` table.
- Migrations are reversible. Run `npm run db:rollback` to undo the last migration.

## Events
Domain events are published via `@hpbrain/events`:
- `OrganizationCreated`
- `OrganizationUpdated`
- `OrganizationArchived`

Events are consumed by the audit handler (`events/organization.audit.ts`) which writes to PostgreSQL `audit_logs`.

## Audit
- Every create/update/archive action writes an audit log entry to PostgreSQL.
- Audit logs are queryable via `GET /api/v1/organizations/:tenantId/:id/audit`.

## Auth details
- Passwords hashed with Node `crypto.scrypt` (salt + derived key); never stored plaintext.
- JWTs signed with HS256 (`node:crypto` Hmac); `access` TTL 1h, `refresh` TTL 24h.
- `authMiddleware` validates Bearer token and attaches `{ id, tenantId, role }` to `req.user`.
- `requireRole(...roles)` enforces RBAC on Organization routes.
- All operations are tenant-scoped; cross-tenant access is impossible.

## Frontend
The `web/` package contains React screens for Organization Management:
- `OrganizationList` — table view with search
- `OrganizationCreate` — create form
- `OrganizationEdit` — edit form
- `OrganizationDetails` — read-only details with audit log
- `OrganizationArchiveConfirm` — archive confirmation with name-match guard

## Reversibility
- `graph/migrations/003_organization.cypher` is additive.
- PostgreSQL migrations use `CREATE TABLE IF NOT EXISTS` and are reversible via `db:rollback`.
- Auth adds properties to existing `Person` nodes (no new labels); reversible by removing those properties.
