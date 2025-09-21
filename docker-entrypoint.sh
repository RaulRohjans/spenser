#!/bin/sh
set -e

echo "[entrypoint] running migrations"
npx drizzle-kit migrate | cat

# Seed only once per container data lifecycle to avoid duplicating demo data
if [ ! -f "/app/.seeded" ]; then
  echo "[entrypoint] running seed"
  NODE_OPTIONS="--enable-source-maps --import tsconfig-paths/register.js" npx tsx --tsconfig tsconfig.runtime.json server/db/seed.ts | cat || true
  # Mark as seeded to avoid re-seeding on every restart
  touch /app/.seeded
else
  echo "[entrypoint] seed skipped (already seeded)"
fi

if [ "${DAILY_RESET}" = "true" ]; then
  (
    while true; do
      echo "[entrypoint] reset aligned to :00,:15,:30,:45 UTC (every 15m)"
      # Sleep until the next 15-minute boundary (:00, :15, :30, :45) in UTC
      now=$(date -u +%s)
      sleep_for=$(( ( ( (10#${now} / 900 ) + 1 ) * 900 ) - 10#${now} ))
      sleep $sleep_for
      echo "[entrypoint] running periodic reset"
      NODE_OPTIONS="--enable-source-maps --import tsconfig-paths/register.js" npx tsx --tsconfig tsconfig.runtime.json server/db/reset.ts | cat || true
    done
  ) &
fi

echo "[entrypoint] starting server"
exec node .output/server/index.mjs
