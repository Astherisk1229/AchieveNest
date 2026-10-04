#!/usr/bin/env python3
"""
Anonymous-access probe (Phase 2 safety net).

Lists every API route via `php spark routes`, calls each one WITHOUT credentials against a
running backend, and fails if any route outside the public allowlist answers with something
other than 401/403. New controllers therefore cannot ship an unauthenticated route unnoticed.

Run only against a disposable/test database: it sends empty POST/PUT/PATCH/DELETE requests.

Usage (from backend/):
  ACHIEVENEST_ENV=... php -S 127.0.0.1:8099 -t public public/index.php   # separate shell
  python3 tools/smoke/anon_probe.py --base http://127.0.0.1:8099 [--routes routes.txt]
"""
import argparse, re, subprocess, sys

# Routes that are intentionally reachable without a session (method, regex on path).
PUBLIC = [
    ('GET', r'^api/v1/health$'),
    ('POST', r'^api/v1/auth/login$'),
    ('POST', r'^api/v1/auth/logout$'),
    ('POST', r'^api/v1/password-reset-requests$'),
    ('GET', r'^api/v1/certificates/verify/[^/]+$'),
    ('GET', r'^api/v1/public/official-evaluation-documents/[^/]+/verify$'),
    ('GET', r'^api/v1/osad/(colleges|organizations)/[^/]+/logo$'),
    ('GET', r'^api/v1/portfolio/categories$'),
]
# Parked feature: answers 410 Gone before authentication.
PARKED = r'^api/v1/student/achievements(/|$)'
OK_CODES = {'401', '403'}
# Known, tracked defects (method, route) -> note. Reported but do not fail the run.
KNOWN = {
}


def routes_from_spark():
    out = subprocess.run(['php', 'spark', 'routes'], capture_output=True, text=True).stdout
    out = re.sub(r'\x1b\[[0-9;]*m', '', out)
    rows = []
    for line in out.splitlines():
        m = re.match(r'^\|\s*(GET|POST|PUT|PATCH|DELETE)\s*\|\s*(\S+)\s*\|', line)
        if m and m.group(2).startswith('api/v1/'):
            rows.append((m.group(1), m.group(2)))
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', required=True)
    ap.add_argument('--routes', help='file with "METHOD path" lines instead of running spark')
    a = ap.parse_args()
    rows = ([tuple(l.split(None, 1)) for l in open(a.routes).read().splitlines() if l.strip()]
            if a.routes else routes_from_spark())
    bad = []
    for method, route in rows:
        path = route.replace('([^/]+)', '00000000-0000-4000-8000-000000000000')
        path = re.sub(r'\(:[a-z]+\)', '00000000-0000-4000-8000-000000000000', path)
        code = subprocess.run(['curl', '-g', '-s', '-o', '/dev/null', '-m', '10', '-w', '%{http_code}', '-X', method,
                               a.base.rstrip('/') + '/' + path, '-H', 'Content-Type: application/json', '-d', '{}'],
                              capture_output=True, text=True).stdout
        allowed = any(m == method and re.match(rx, path.replace('00000000-0000-4000-8000-000000000000', 'X'))
                      for m, rx in PUBLIC) or re.match(PARKED, route)
        if code not in OK_CODES and not allowed:
            if (method, route) in KNOWN:
                print('  known: %s %s %s -> %s' % (code, method, route, KNOWN[(method, route)]))
            else:
                bad.append((code, method, route))
    print('routes probed: %d, unexpected anonymous responses: %d' % (len(rows), len(bad)))
    for code, method, route in bad:
        print('  %s %s %s' % (code, method, route))
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
