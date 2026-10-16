#!/bin/sh
set -eu

OCR_PORT="${PADDLE_OCR_WORKER_PORT:-8765}"
export PADDLE_OCR_WORKER_URL="http://127.0.0.1:${OCR_PORT}"
export PADDLE_OCR_INTERNAL_TOKEN="$(python -c 'import secrets; print(secrets.token_urlsafe(32))')"
export PADDLE_PDX_CACHE_HOME="${PADDLE_PDX_CACHE_HOME:-/app/.runtime/paddlex-cache}"
export PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK="True"
export PADDLE_OCR_CPU_THREADS="${PADDLE_OCR_CPU_THREADS:-4}"
export PYTHONPATH="/app/.runtime/python-packages${PYTHONPATH:+:$PYTHONPATH}"

mkdir -p /app/writable/cache /app/writable/logs /app/writable/session \
  /app/writable/uploads/evidence /app/writable/debugbar /app/writable/backups \
  /app/writable/restore_test /app/writable/demo-credentials
freshclam --quiet || true

python ocr/student_ocr_bridge.py --serve --host 127.0.0.1 --port "$OCR_PORT" &
OCR_PID=$!
cleanup() {
  kill "$OCR_PID" 2>/dev/null || true
  wait "$OCR_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

attempt=0
until python -c 'import os, urllib.request; request = urllib.request.Request(os.environ["PADDLE_OCR_WORKER_URL"] + "/ready", headers={"Authorization": "Bearer " + os.environ["PADDLE_OCR_INTERNAL_TOKEN"]}); urllib.request.urlopen(request, timeout=2).read()' >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 180 ] || ! kill -0 "$OCR_PID" 2>/dev/null; then
    echo 'PaddleOCR worker failed to become ready.' >&2
    exit 1
  fi
  sleep 1
done

/start-container.sh &
APP_PID=$!
while kill -0 "$APP_PID" 2>/dev/null; do
  if ! kill -0 "$OCR_PID" 2>/dev/null; then
    echo 'PaddleOCR worker exited; stopping the API container.' >&2
    kill "$APP_PID" 2>/dev/null || true
    wait "$APP_PID" 2>/dev/null || true
    exit 1
  fi
  sleep 1
done

set +e
wait "$APP_PID"
APP_STATUS=$?
set -e
exit "$APP_STATUS"
