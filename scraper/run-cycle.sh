#!/data/data/com.termux/files/usr/bin/bash
# One pass over scraper/locations.txt. Each location gets its own Xvfb (via xvfb-run)
# so no persistent X server has to be managed by hand. Delay between locations is
# randomized to avoid hammering Zillow back-to-back; a blocked/failed location is
# logged and skipped, never retried in-loop (zillow.js already refuses to fight the
# bot wall — this script doesn't either).
set -uo pipefail

SCRAPER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCATIONS_FILE="${1:-$SCRAPER_DIR/locations.txt}"
LOG_FILE="$SCRAPER_DIR/run.log"
MIN_DELAY="${MIN_DELAY_SECONDS:-45}"
MAX_DELAY="${MAX_DELAY_SECONDS:-150}"

mkdir -p "$SCRAPER_DIR/output"

log() {
  echo "[$(date -Iseconds)] $*" | tee -a "$LOG_FILE"
}

if [ ! -f "$LOCATIONS_FILE" ]; then
  log "No locations file at $LOCATIONS_FILE"
  exit 1
fi

ok=0
blocked=0
failed=0

while IFS= read -r location || [ -n "$location" ]; do
  location="$(echo "$location" | sed 's/#.*//' | xargs)"
  [ -z "$location" ] && continue

  log "Scraping $location"
  run_output="$(mktemp)"
  if xvfb-run -a --server-args="-screen 0 1366x900x24" node "$SCRAPER_DIR/zillow.js" "$location" >"$run_output" 2>&1; then
    log "OK: $location"
    ok=$((ok + 1))
  else
    if grep -q "BLOCKED" "$run_output"; then
      log "BLOCKED: $location (bot wall)"
      blocked=$((blocked + 1))
    else
      log "FAILED: $location"
      failed=$((failed + 1))
    fi
  fi
  cat "$run_output" >>"$LOG_FILE"
  rm -f "$run_output"

  delay=$((MIN_DELAY + RANDOM % (MAX_DELAY - MIN_DELAY + 1)))
  log "Sleeping ${delay}s before next location"
  sleep "$delay"
done <"$LOCATIONS_FILE"

log "Cycle done. ok=$ok blocked=$blocked failed=$failed"
