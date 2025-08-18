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
      echo "[entrypoint] daily reset will run at 03:00 UTC"
      # Sleep until next 03:00 UTC
      now=$(date -u +%s)
      # seconds since midnight UTC
      sec_midnight=$(( $(date -u -d @${now} +%H)*3600 + $(date -u -d @${now} +%M)*60 + $(date -u -d @${now} +%S) ))
      target=$(( 3*3600 ))
      sleep_for=$(( target - sec_midnight ))
      if [ $sleep_for -le 0 ]; then
        sleep_for=$(( 24*3600 + sleep_for ))
      fi
      sleep $sleep_for
      echo "[entrypoint] running daily reset"
      NODE_OPTIONS="--enable-source-maps --import tsconfig-paths/register.js" npx tsx --tsconfig tsconfig.runtime.json server/db/reset.ts | cat || true
    done
  ) &
fi

echo "[entrypoint] starting server"
exec node .output/server/index.mjs


