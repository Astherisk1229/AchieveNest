#!/bin/sh
set -eu

exec frankenphp run --config /Caddyfile
