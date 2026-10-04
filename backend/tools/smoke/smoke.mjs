#!/usr/bin/env node
/**
 * AchieveNest per-role smoke harness (Phase 0 of the wiring remediation plan).
 *
 * For each role with credentials set in the environment it: logs in, calls auth/me,
 * then GETs that role's read endpoints and checks for a 2xx JSON response.
 * It also runs "must be rejected" checks (Phase 2) against endpoints the wiring audit
 * found unauthenticated; those FAIL today by design (red baseline) until Phase 2.
 *
 * Usage (Node 18+):
 *   SMOKE_BASE_URL=http://localhost:8080/api/v1 \
 *   SMOKE_STUDENT_EMAIL=... SMOKE_STUDENT_PASSWORD=... \
 *   SMOKE_PERSONNEL_EMAIL=... SMOKE_HR_EMAIL=... SMOKE_OSAD_EMAIL=... SMOKE_DEAN_EMAIL=... \
 *   node tools/smoke/smoke.mjs [--role=hr] [--json]
 * Credentials come only from the environment; nothing is stored in the repo.
 *
 * Status: run against a disposable replay database with HR, personnel and student test users (all pass).
 * Add -- anonymous route sweep: tools/smoke/anon_probe.py.
 * Read endpoint lists are a starting set to extend as workflows are fixed.
 */
const BASE = (process.env.SMOKE_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '');

const ROLES = {
  student: ['student/profile', 'portfolio', 'notifications'],
  personnel: ['personnel/profile', 'personnel/portfolio/configuration', 'personnel/portfolio/submission/latest', 'notifications'],
  hr: ['hr/dashboard', 'hr/personnel', 'notifications'],
  osad: ['osad/colleges', 'osad/organizations', 'osad/audit', 'certificates/templates', 'events'],
  dean: ['dean/dashboard', 'dean/roster', 'dean/reviews', 'dean/annual-reviews', 'reviewer/evaluations'],
};

// Phase 2: these answered without any login before the fix. Expect 401/403 (the full route sweep is anon_probe.py).
const MUST_REJECT_ANONYMOUS = [
  ['GET', 'personnel/00000000-0000-0000-0000-000000000000/evaluation-scale'],
  ['GET', 'faculty-ranks'],
  ['GET', 'faculty-titles/part-time'],
  ['GET', 'hr/personnel/00000000-0000-0000-0000-000000000000/rank-resolution'],
  ['POST', 'faculty-ranks/resolve-initial'],
  ['POST', 'faculty-ranks/reconcile-current'],
];

const args = process.argv.slice(2);
const onlyRole = (args.find((a) => a.startsWith('--role=')) || '').split('=')[1];
const asJson = args.includes('--json');
const results = [];
const tokens = {};
const profileIds = {};
const rec = (role, check, ok, detail) => results.push({ role, check, ok, detail });

async function call(method, path, token, body) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON body */ }
  return { status: res.status, json };
}

const pickToken = (j) => j?.data?.token || j?.data?.access_token || j?.token || j?.access_token || null;

async function runRole(role, paths) {
  const key = role.toUpperCase();
  const email = process.env[`SMOKE_${key}_EMAIL`];
  const password = process.env[`SMOKE_${key}_PASSWORD`];
  if (!email || !password) return rec(role, 'credentials', null, 'skipped: SMOKE_%s_EMAIL/PASSWORD not set'.replace('%s', key));
  const login = await call('POST', 'auth/login', null, { institutional_email: email, password });
  const token = pickToken(login.json);
  rec(role, 'login', login.status === 200 && !!token, `HTTP ${login.status}${token ? '' : ' (no token in response)'}`);
  if (!token) return;
  tokens[role] = token;
  const me = await call('GET', 'auth/me', token);
  rec(role, 'auth/me', me.status === 200, `HTTP ${me.status}`);
  profileIds[role] = me.json?.data?.user?.id || me.json?.data?.id || me.json?.data?.profile?.id || me.json?.data?.profile_id || null;
  for (const p of paths) {
    const r = await call('GET', p, token);
    rec(role, `GET ${p}`, r.status >= 200 && r.status < 300 && r.json !== null, `HTTP ${r.status}`);
  }
}

for (const [role, paths] of Object.entries(ROLES)) {
  if (onlyRole && onlyRole !== role) continue;
  try { await runRole(role, paths); } catch (e) { rec(role, 'run', false, String(e.message || e)); }
}

// Phase 2 role matrix: [role, method, path, expected status]. `{self}` is the caller's own profile id,
// `{other}` any other id. Only runs for roles whose credentials are set.
const MATRIX = [
  ['student', 'GET', 'faculty-ranks', 200],
  ['personnel', 'GET', 'faculty-titles/part-time', 200],
  ['personnel', 'GET', 'personnel/{self}/evaluation-scale', 200],
  ['personnel', 'GET', 'personnel/{other}/evaluation-scale', 403],
  ['personnel', 'GET', 'hr/personnel/{self}/rank-resolution', 403],
  ['student', 'POST', 'faculty-ranks/reconcile-current', 403],
  ['hr', 'GET', 'personnel/{other}/evaluation-scale', [200, 404, 422]],
  ['hr', 'GET', 'hr/personnel/{other}/rank-resolution', [200, 404]],
  ['hr', 'POST', 'faculty-ranks/reconcile-current', [200, 422]],
];
const OTHER_ID = '00000000-0000-4000-8000-000000000000';
for (const [role, method, path, expected] of MATRIX) {
  if (onlyRole && onlyRole !== role) continue;
  const token = tokens[role];
  if (!token) continue;
  const p = path.replace('{self}', profileIds[role] || OTHER_ID).replace('{other}', OTHER_ID);
  const r = await call(method, p, token, method === 'GET' ? undefined : {});
  const ok = (Array.isArray(expected) ? expected : [expected]).includes(r.status);
  rec(role, `${method} ${path} -> ${expected}`, ok, `HTTP ${r.status}`);
}

if (!onlyRole || onlyRole === 'anon') {
  for (const [m, p] of MUST_REJECT_ANONYMOUS) {
    try {
      const r = await call(m, p, null, m === 'POST' ? {} : undefined);
      rec('anon', `${m} ${p} rejected`, r.status === 401 || r.status === 403, `HTTP ${r.status}`);
    } catch (e) { rec('anon', `${m} ${p}`, false, String(e.message || e)); }
  }
}

if (asJson) console.log(JSON.stringify(results, null, 1));
else for (const r of results) console.log(`${r.ok === null ? 'SKIP' : r.ok ? 'PASS' : 'FAIL'}  ${r.role.padEnd(9)} ${r.check}  ${r.detail}`);
process.exit(results.some((r) => r.ok === false) ? 1 : 0);
