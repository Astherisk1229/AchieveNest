#!/bin/sh
set -eu

mkdir -p \
    /app/writable/cache \
    /app/writable/logs \
    /app/writable/session \
    /app/writable/uploads/evidence \
    /app/writable/debugbar \
    /app/writable/backups \
    /app/writable/restore_test \
    /app/writable/demo-credentials

exec docker-php-entrypoint --config /Caddyfile --adapter caddyfile
