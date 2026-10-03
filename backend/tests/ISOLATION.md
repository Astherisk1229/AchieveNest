# Backend test isolation

Normal PHPUnit configurations exclude `manual-proof` and `legacy-postgres`.
The manual-proof file inventory is `manual-proof-files.json`. These existing
tests depended on working databases or live HTTP servers and are quarantined,
not claimed as passing automated coverage.

Testing boot installs a guarded database factory. Only SQLite `:memory:` is
accepted; named `default`, `development`, and `local_defense` connections are
rejected before connecting. DSNs, failover, file databases, ATTACH and VACUUM
INTO are rejected. Identity is checked again before SQL execution. Test mode
always selects `tests`, regardless of ACHIEVENEST_ENV or .env configuration.

New persistence tests must explicitly connect to `tests` or a SQLite `:memory:`
configuration and build their own fixtures. Do not invoke application migrations
or seeders against a working database. Examples are in `tests/isolated`.

Manual proofs require both explicit suite/group selection and the process
variable `ACHIEVENEST_MANUAL_PROOFS=1`. Opt-in does not bypass database guards.
Existing working-database proofs must be ported before they can run successfully.
The two legacy raw-PDO suites are additionally blocked before reading .env or
opening PDO, even with opt-in. Do not point live HTTP proofs at a working server;
they must first be adapted to an independently disposable server/database.

Focused safe check, from backend:

    php vendor/bin/phpunit --no-coverage --no-logging --do-not-cache-result tests/isolated

This boundary protects normal test entry points and the catalogued manual tests;
it is not an OS sandbox for arbitrary PHP that directly instantiates drivers.
