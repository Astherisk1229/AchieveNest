#!/bin/sh
set -eu

exec docker-php-entrypoint --config /Caddyfile --adapter caddyfile
