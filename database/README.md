# Database workspace
# Sprint 1 — PostgreSQL persistence for Organization Management

## Layout
```
database/
├── package.json
├── tsconfig.json
├── .env.example
├── migrations/
│   ├── 001_organization.sql
│   └── 002_audit.sql
└── src/
    ├── config.ts
    ├── connection.ts
    ├── organization.repository.ts
    ├── audit.repository.ts
    └── cli/
        └── migrate.ts
```

## Setup
```bash
cd database
npm install
cp .env.example .env
npm run migrate
```

## Migration standard
- Filenames are `NNN_description.sql`.
- Idempotent: use `CREATE TABLE IF NOT EXISTS` or `CREATE OR REPLACE`.
- Run in lexicographic order.
- Never edit a migration after it has been applied in any environment.
