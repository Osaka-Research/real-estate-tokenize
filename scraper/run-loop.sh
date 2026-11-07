#!/data/data/com.termux/files/usr/bin/bash
# Outer scheduler: Termux has no cron daemon, so this just loops run-cycle.sh
# forever with a sleep between cycles. Run it detached (tmux or nohup) and
# stop it with stop.sh. CYCLE_HOURS controls spacing between full passes over
# locations.txt — default 6h, keep this generous, this is still meant to be
# low-frequency, not a hammer.
set -uo pipefail

SCRAPER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CYCLE_HOURS="${CYCLE_HOURS:-6}"
PID_FILE="$SCRAPER_DIR/run-loop.pid"
LOG_FILE="$SCRAPER_DIR/run.log"

echo $$ >"$PID_FILE"
trap 'rm -f "$PID_FILE"' EXIT

log() {
  echo "[$(date -Iseconds)] $*" | tee -a "$LOG_FILE"
}

log "Scheduler started (pid $$), cycle interval ${CYCLE_HOURS}h"

while true; do
  "$SCRAPER_DIR/run-cycle.sh"
  log "Sleeping ${CYCLE_HOURS}h until next cycle"
  sleep "$((CYCLE_HOURS * 3600))"
done
