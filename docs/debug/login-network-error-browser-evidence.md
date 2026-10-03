# AchieveNest Login Network Error — Browser Evidence

Evidence date: 2026-09-12.

## Failed Login Request

The supplied Chrome DevTools evidence reports:

| Field | Observed value |
|---|---|
| Request label | `login` |
| Type | `xhr` |
| Initiator | `authService.js:44` |
| Status | `(failed) net...` |
| Transfer size | `0.0 kB` |
| Duration | approximately 12 ms |
| HTTP response | None |

## Resolved request URL

```text
frontend/.env.local
VITE_API_BASE_URL=http://localhost:8080/api/v1
        +
authService.js
apiClient.post('/auth/login')
        =
http://localhost:8080/api/v1/auth/login
```

The full Chrome `net::ERR_*` suffix was truncated in the supplied evidence and could not be independently captured because browser control was unavailable. It is therefore **Not Confirmed** whether Chrome labeled the failure `ERR_CONNECTION_REFUSED` or another transport code. The zero-byte request and absence of an HTTP status are consistent with the independently confirmed missing port-8080 listener.

## After-fix transport evidence

| Check | Result |
|---|---|
| `GET /api/v1/health` | HTTP 200; status `ok`; MySQL connected |
| `OPTIONS /api/v1/auth/login` | HTTP 204 |
| Allowed origin | `http://localhost:5173` |
| Allowed methods | GET, POST, PUT, PATCH, DELETE, OPTIONS |
| Valid HR login | HTTP 200; 698-byte response |
| Wrong password | HTTP 401; 111-byte response |

No authentication payload, password, token, or authorization header is recorded in this document.
