#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
URL="http://localhost:5173"

cleanup() {
  echo ""
  echo "Shutting down FarmConnect NG..."
  [ -n "$BACK_PID" ] && kill "$BACK_PID" 2>/dev/null || true
  [ -n "$FRONT_PID" ] && kill "$FRONT_PID" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

echo "Starting FarmConnect NG backend on http://localhost:8000 ..."
( cd "$BACKEND" && .venv/bin/python -m uvicorn app.main:app --port 8000 ) &
BACK_PID=$!

echo "Starting FarmConnect NG frontend on $URL ..."
( cd "$FRONTEND" && npm run dev ) &
FRONT_PID=$!

echo "Waiting for the frontend to come up..."
for i in $(seq 1 60); do
  if curl -s -o /dev/null "$URL"; then break; fi
  sleep 0.5
done

echo "Opening $URL in your browser..."
open "$URL"

echo ""
echo "FarmConnect NG is running. Press Ctrl+C to stop."
wait
