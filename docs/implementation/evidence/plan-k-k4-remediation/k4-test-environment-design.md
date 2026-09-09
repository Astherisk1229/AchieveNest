# Disposable K4 Test Environment Design

- **Runtime Identification**: `ACHIEVENEST_ENV=k4-test`
- **Database**: Dedicated SQLite3 database file `achievenest_k4_test.sqlite`
- **Storage**: Dedicated directory `backend/writable/k4-test-storage/`
- **Isolation**: Completely separate from WAMP MySQL `achievenest_local`.
