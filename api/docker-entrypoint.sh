#!/bin/sh
set -e

echo "Running Postgres migrations..."
npx tsx database/src/cli/migrate.ts

echo "Applying Neo4j migrations..."
npx tsx api/src/cli/apply-graph-migrations.ts

echo "Starting API server..."
exec node api/dist/src/server.js
