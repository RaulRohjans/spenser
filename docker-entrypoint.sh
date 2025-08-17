#!/bin/sh
set -e

echo "[entrypoint] running migrations"
npx drizzle-kit migrate | cat

# Seed only once per container data lifecycle to avoid duplicating demo data
if [ ! -f "/app/.seeded" ]; then
  echo "[entrypoint] running seed"
  npx tsx server/db/seed.ts | cat || true
  # Mark as seeded to avoid re-seeding on every restart
  touch /app/.seeded
else
  echo "[entrypoint] seed skipped (already seeded)"
fi

echo "[entrypoint] starting server"
exec node .output/server/index.mjs


