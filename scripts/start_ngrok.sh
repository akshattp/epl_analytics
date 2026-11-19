#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_BIN="/Users/akshat/Document/Coding Project/venv/bin"

echo "=== EPL Single-Tunnel Ngrok Launcher ==="

# 1. Ensure FastAPI backend is listening on :8000
if ! lsof -ti :8000 >/dev/null 2>&1; then
  echo "[1/4] Starting FastAPI backend on :8000..."
  (cd "$PROJECT_DIR" && "$VENV_BIN/uvicorn" backend.main:app --host 127.0.0.1 --port 8000 > logs/backend.log 2>&1 &)
  sleep 2
else
  echo "[1/4] FastAPI backend already running on :8000"
fi

# 2. Ensure Next.js frontend is listening on :3000
if ! lsof -ti :3000 >/dev/null 2>&1; then
  echo "[2/4] Starting Next.js production frontend on :3000..."
  (cd "$PROJECT_DIR/frontend" && npm start > ../logs/frontend.log 2>&1 &)
  sleep 2
else
  echo "[2/4] Next.js frontend already running on :3000"
fi

# 3. Ensure Unified HTTP + WebSocket Gateway is listening on :8080
if ! lsof -ti :8080 >/dev/null 2>&1; then
  echo "[3/4] Starting Unified HTTP + WebSocket Gateway on :8080..."
  (cd "$PROJECT_DIR" && node scripts/gateway.mjs > logs/gateway.log 2>&1 &)
  sleep 1
else
  echo "[3/4] Unified Gateway already running on :8080"
fi

NGROK_BIN="$(command -v ngrok || echo '/opt/homebrew/bin/ngrok')"

# 4. Launch ngrok pointing to unified gateway :8080
echo "[4/4] Launching ngrok tunnel -> http://127.0.0.1:8080 (Serves UI + API + Live WebSocket WSS)..."
exec "$NGROK_BIN" http 8080
