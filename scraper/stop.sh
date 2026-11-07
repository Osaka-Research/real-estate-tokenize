#!/data/data/com.termux/files/usr/bin/bash
# Stops a run-loop.sh scheduler started via nohup/tmux.
SCRAPER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRAPER_DIR/run-loop.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "No run-loop.pid found — scheduler not running (or already stopped)."
  exit 0
fi

pid="$(cat "$PID_FILE")"
if kill "$pid" 2>/dev/null; then
  echo "Stopped scheduler (pid $pid)."
else
  echo "pid $pid not running; removing stale pid file."
fi
rm -f "$PID_FILE"
