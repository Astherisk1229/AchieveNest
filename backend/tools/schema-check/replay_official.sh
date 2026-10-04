#!/usr/bin/env bash
# Replays the repo's OFFICIAL migration chain (Phase17Canonical baseline + Phase2 namespace,
# via `php spark verify:phase17m-fresh-replay`) into a disposable MySQL database, then exports
# {table: [columns]} for schema_check.py.
#
# Usage:  ./replay_official.sh [out.json]
# Needs: php + composer deps in backend/ (vendor), a MySQL 8 server, and these env vars:
#   PHASE17M_REPLAY_HOST/PORT/USERNAME/PASSWORD (defaults 127.0.0.1:3306 root, empty password)
#   PHASE17M_REPLAY_DATABASE (must start with achievenest_phase17m_; default achievenest_phase17m_replay)
# The database is DROPPED AND RECREATED. Never point it at achievenest_local.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$HERE/../.."
OUT="${1:-$HERE/replay_schema.json}"
DB="${PHASE17M_REPLAY_DATABASE:-achievenest_phase17m_replay}"
case "$DB" in achievenest_phase17m_*) ;; *) echo "refusing database $DB" >&2; exit 2;; esac
MYSQL=(mysql -h"${PHASE17M_REPLAY_HOST:-127.0.0.1}" -P"${PHASE17M_REPLAY_PORT:-3306}" -u"${PHASE17M_REPLAY_USERNAME:-root}")
[ -n "${PHASE17M_REPLAY_PASSWORD:-}" ] && MYSQL+=(-p"$PHASE17M_REPLAY_PASSWORD")

"${MYSQL[@]}" -e "DROP DATABASE IF EXISTS \`$DB\`; CREATE DATABASE \`$DB\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
( cd "$BACKEND" && ACHIEVENEST_ENV=phase17m-replay CI_ENVIRONMENT=development php spark verify:phase17m-fresh-replay )
# the verify command runs the Canonical and Phase2 namespaces to latest (includes the drift reconciliation migration)

"${MYSQL[@]}" "$DB" -N -B -e "SELECT table_name, GROUP_CONCAT(column_name ORDER BY ordinal_position)
  FROM information_schema.columns WHERE table_schema='$DB' GROUP BY table_name" |
python3 -c "
import sys, json
d = {l.split('\t')[0]: l.rstrip('\n').split('\t')[1].split(',') for l in sys.stdin}
json.dump(d, open(sys.argv[1], 'w'), separators=(',', ':'), sort_keys=True)
print('schema exported: %d tables -> %s' % (len(d), sys.argv[1]))" "$OUT"
