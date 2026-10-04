#!/usr/bin/env python3
"""
AchieveNest model-vs-schema check (Phase 0 of the wiring remediation plan).

Statically scans backend PHP (CodeIgniter query builder) and reports references to
tables or columns that do not exist in a schema built ONLY from the repo's MySQL
migrations (see replay_mysql.sh).

Checks
  T  table referenced via ->table()/->from()/->join() but absent from the schema
  C  column used in where/orderBy/groupBy/like/set on a single-table chain
  I  key in an ->insert([...]) / ->update([...]) array on a single-table chain

Heuristic, static analysis: it can miss dynamic queries and can flag aliases it
cannot resolve. It is meant as a ratchet: findings already listed in the baseline
file are tolerated, any NEW finding fails the run, and Phase 1 shrinks the baseline.

Usage
  python3 schema_check.py --schema replay_schema.json --app ../../app \
      [--baseline known-gaps.json] [--write-baseline known-gaps.json]
Exit code: 0 no new findings, 1 new findings (or stale baseline entries with --strict).
"""
import argparse, collections, json, os, re, sys

SKIP_DIRS = ('/Database/Migrations', '/Database/Seeds', '/Commands', '/Phase17Canonical')


def match_bracket(s, i):
    depth, quote, k = 0, None, i
    while k < len(s):
        c = s[k]
        if quote:
            if c == '\\':
                k += 1
            elif c == quote:
                quote = None
        elif c in "'\"":
            quote = c
        elif c == '[':
            depth += 1
        elif c == ']':
            depth -= 1
            if depth == 0:
                return k
        k += 1
    return -1


def php_files(app):
    for dp, _, fns in os.walk(app):
        norm = dp.replace('\\', '/')
        if any(x in norm for x in SKIP_DIRS):
            continue
        for f in fns:
            if f.endswith('.php'):
                yield os.path.join(dp, f)


def scan(app, schema):
    findings = collections.defaultdict(set)  # key -> {file:line}
    for path in php_files(app):
        s = open(path, encoding='utf8', errors='ignore').read()
        rel = os.path.relpath(path, app).replace('\\', '/')

        for m in re.finditer(r"(?:->table|->from|->join)\(\s*'([a-z_0-9]+)(?:\s+(?:AS\s+)?\w+)?'", s, re.I):
            t = m.group(1)
            if t not in schema:
                findings['T ' + t].add('%s:%d' % (rel, s[:m.start()].count('\n') + 1))

        for st in re.split(r';', s):
            tabs = re.findall(r"->(?:table|from)\(\s*'([a-z_0-9]+)'\s*\)", st)
            if len(set(tabs)) == 1 and '->join(' not in st and tabs[0] in schema:
                cols = set(schema[tabs[0]])
                for c in re.findall(
                    r"->(?:where|orWhere|whereIn|orderBy|groupBy|set|like|whereNotIn)\(\s*'([a-z_][a-z_0-9]*)"
                    r"(?:\s*(?:!=|<=|>=|<|>|IS NOT NULL|IS NULL|LIKE|=))?\s*'", st):
                    if c not in cols:
                        findings['C %s.%s' % (tabs[0], c)].add(rel)

        for m in re.finditer(
            r"->table\(\s*'([a-z_0-9]+)'\s*\)((?:(?!;).)*?)->(insert|update|upsert)\(\s*\[", s, re.S):
            t = m.group(1)
            if t not in schema:
                continue
            st = m.end() - 1
            en = match_bracket(s, st)
            if en < 0:
                continue
            depth, top = 0, ''
            for ch in s[st + 1:en]:
                if ch == '[':
                    depth += 1
                elif ch == ']':
                    depth -= 1
                elif depth == 0:
                    top += ch
            for k in set(re.findall(r"'([a-zA-Z_0-9]+)'\s*=>", top)):
                if k not in schema[t]:
                    findings['I %s.%s' % (t, k)].add('%s:%d' % (rel, s[:m.start()].count('\n') + 1))
    return findings


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--schema', required=True, help='JSON {table: [columns]} from replay_mysql.sh')
    ap.add_argument('--app', required=True, help='path to backend/app')
    ap.add_argument('--baseline')
    ap.add_argument('--write-baseline')
    ap.add_argument('--strict', action='store_true', help='also fail when baseline has fixed entries')
    a = ap.parse_args()

    schema = json.load(open(a.schema))
    findings = scan(a.app, schema)
    keys = sorted(findings)

    if a.write_baseline:
        json.dump({'findings': keys}, open(a.write_baseline, 'w'), indent=1)
        print('baseline written: %d findings -> %s' % (len(keys), a.write_baseline))
        return 0

    base = set(json.load(open(a.baseline))['findings']) if a.baseline else set()
    new = [k for k in keys if k not in base]
    fixed = sorted(base - set(keys))

    by = collections.Counter(k[0] for k in keys)
    print('schema tables: %d | findings: %d (T=%d C=%d I=%d) | baseline: %d | NEW: %d | FIXED: %d'
          % (len(schema), len(keys), by['T'], by['C'], by['I'], len(base), len(new), len(fixed)))
    for k in new:
        print('NEW   ', k, sorted(findings[k])[:3])
    for k in fixed:
        print('FIXED ', k, '(remove from baseline)')
    return 1 if new or (a.strict and fixed) else 0


if __name__ == '__main__':
    sys.exit(main())
