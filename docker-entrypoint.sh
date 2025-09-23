#!/bin/sh
set -eu

echo "[entrypoint] running migrations"
if ! npx drizzle-kit migrate; then
  echo "[entrypoint] migration failed"
  exit 1
fi

# Seed only once per container data lifecycle to avoid duplicating demo data
if [ ! -f "/app/.seeded" ]; then
  echo "[entrypoint] running seed"
  NODE_OPTIONS="--enable-source-maps --import tsconfig-paths/register.js" npx tsx --tsconfig tsconfig.runtime.json server/db/seed.ts || true
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
      rem=$(( now % 900 ))
      sleep_for=$(( 900 - rem ))
      if [ "$sleep_for" -eq 0 ]; then sleep_for=900; fi
      sleep "$sleep_for"
      echo "[entrypoint] running periodic reset"
      NODE_OPTIONS="--enable-source-maps --import tsconfig-paths/register.js" npx tsx --tsconfig tsconfig.runtime.json server/db/reset.ts || true
    done
  ) &
fi

echo "[entrypoint] starting server"
exec node .output/server/index.mjs
