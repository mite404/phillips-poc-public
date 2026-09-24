#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------- CONFIG
APP="phillips-poc"
START_CMD=(bun dev)
DEFAULT_PORT="${VERIFY_PORT:-5173}"
READY_PATH="/"
DOCTOR_NEEDLE='id="root"'
BOOT_TIMEOUT=90
JSON_SERVER_PORT="${VERIFY_JSON_PORT:-3001}"
# ------------------------------------------------------------- END CONFIG

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
STATE_DIR="${VERIFY_STATE_DIR:-/tmp/${APP}-verify-${VERIFY_RUN_ID:-default}}"
PID_FILE="$STATE_DIR/server.pid"
PORT_FILE="$STATE_DIR/port"
LOG_FILE="$STATE_DIR/dev.log"

mkdir -p "$STATE_DIR"

port_in_use() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
  else
    curl -fsS "http://127.0.0.1:${1}${READY_PATH}" >/dev/null 2>&1
  fi
}

read_port() { [[ -f "$PORT_FILE" ]] && cat "$PORT_FILE" || echo "$DEFAULT_PORT"; }

cmd_launch() {
  local port="${VERIFY_PORT:-$DEFAULT_PORT}"

  if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "$APP: already running (pid $(cat "$PID_FILE"), port $(read_port))" >&2
    exit 1
  fi
  if port_in_use "$port"; then
    echo "$APP: port $port already in use — set VERIFY_PORT to a free port" >&2
    exit 1
  fi
  if port_in_use "$JSON_SERVER_PORT"; then
    echo "$APP: json-server port $JSON_SERVER_PORT already in use — set VERIFY_JSON_PORT" >&2
    exit 1
  fi

  echo "$port" >"$PORT_FILE"
  cd "$ROOT"
  nohup "${START_CMD[@]}" >"$LOG_FILE" 2>&1 &
  echo $! >"$PID_FILE"

  for _ in $(seq 1 "$BOOT_TIMEOUT"); do
    if curl -fsS "http://127.0.0.1:${port}${READY_PATH}" >/dev/null 2>&1 \
      && curl -fsS "http://127.0.0.1:${JSON_SERVER_PORT}/enrollments" >/dev/null 2>&1; then
      echo "$APP: ready at http://127.0.0.1:${port}/ (pid $(cat "$PID_FILE"))"
      echo "$APP: json-server at http://127.0.0.1:${JSON_SERVER_PORT}/"
      echo "$APP: log $LOG_FILE"
      exit 0
    fi
    sleep 1
  done

  echo "$APP: timed out waiting for vite + json-server" >&2
  tail -30 "$LOG_FILE" >&2 || true
  exit 1
}

cmd_doctor() {
  local port pid body enrollments
  port="$(read_port)"
  [[ -f "$PID_FILE" ]] || {
    echo "$APP doctor: FAIL — no pid file at $PID_FILE (run launch first)" >&2
    exit 1
  }
  pid="$(cat "$PID_FILE")"
  kill -0 "$pid" 2>/dev/null || {
    echo "$APP doctor: FAIL — pid $pid is not running" >&2
    exit 1
  }
  port_in_use "$port" || {
    echo "$APP doctor: FAIL — nothing listening on port $port" >&2
    exit 1
  }
  port_in_use "$JSON_SERVER_PORT" || {
    echo "$APP doctor: FAIL — json-server not listening on $JSON_SERVER_PORT" >&2
    exit 1
  }
  body="$(curl -fsS "http://127.0.0.1:${port}${READY_PATH}")" || {
    echo "$APP doctor: FAIL — GET $READY_PATH did not return 200" >&2
    exit 1
  }
  grep -q "$DOCTOR_NEEDLE" <<<"$body" || {
    echo "$APP doctor: FAIL — page missing expected content ($DOCTOR_NEEDLE)" >&2
    exit 1
  }
  enrollments="$(curl -fsS "http://127.0.0.1:${JSON_SERVER_PORT}/enrollments")" || {
    echo "$APP doctor: FAIL — json-server enrollments unreachable" >&2
    exit 1
  }
  grep -q '"learnerId"' <<<"$enrollments" || {
    echo "$APP doctor: FAIL — enrollments payload missing learnerId" >&2
    exit 1
  }

  echo "$APP doctor: OK"
  echo "  url: http://127.0.0.1:${port}/"
  echo "  json-server: http://127.0.0.1:${JSON_SERVER_PORT}/"
  echo "  pid: $pid (owned by this run)"
  echo "  state: $STATE_DIR"
  echo "  log: $LOG_FILE"
}

cmd_stop() {
  [[ -f "$PID_FILE" ]] || { echo "$APP: no server pid file — nothing to stop"; exit 0; }
  local pid
  pid="$(cat "$PID_FILE")"
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    for _ in $(seq 1 15); do kill -0 "$pid" 2>/dev/null || break; sleep 1; done
    kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
    echo "$APP: stopped pid $pid"
  else
    echo "$APP: pid $pid was not running"
  fi
  rm -f "$PID_FILE"
}

case "${1:-}" in
  launch) cmd_launch ;;
  doctor) cmd_doctor ;;
  stop)   cmd_stop ;;
  *) echo "usage: $(basename "$0") {launch|doctor|stop}" >&2; exit 1 ;;
esac
