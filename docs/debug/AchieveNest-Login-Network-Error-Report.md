# AchieveNest Login Network Error Report

## 1. Observed Failure

The login UI displayed Axios `Network Error`. Chrome showed a failed zero-byte XHR initiated by `authService.js`, completing in roughly 12 ms with no HTTP status. This identifies a transport failure rather than a credential rejection.

## 2. Browser Evidence

The supplied DevTools record is preserved in `login-network-error-browser-evidence.md`. The complete `net::ERR_*` suffix was not available and is explicitly **Not Confirmed**.

## 3. Final Request URL

The active URL is:

```text
http://localhost:8080/api/v1/auth/login
```

It is composed from `VITE_API_BASE_URL=http://localhost:8080/api/v1` and `apiClient.post('/auth/login')`. There is no duplicate or missing API prefix.

## 4. Frontend API Configuration

`apiClient.js` uses `VITE_API_BASE_URL` and a 15-second timeout. Its request interceptor always returns the Axios config. The recent performance instrumentation only adds a metadata object in development; it does not modify the URL, method, payload, cancellation signal, or transport. The response interceptor returns response data and rejects errors normally.

## 5. Backend Server Status

At initial diagnosis, no process was listening on port 8080 while the Vite frontend remained active on IPv6 localhost port 5173. This exactly explains an immediate zero-byte network failure. A clean WAMP PHP 8.4.15 listener now serves port 8080, and `/api/v1/health` returns HTTP 200 with MySQL connected.

## 6. Login Route Verification

CodeIgniter route:

```text
POST /api/v1/auth/login
-> App\Controllers\Api\AuthController::login
```

The existing health endpoint is `GET /api/v1/health`. No authentication controller, credential, token, account-status, role, or validation rule was changed.

## 7. CORS Findings

CodeIgniter applies its CORS filter before and after `api/*`. The configured development origin is exactly `http://localhost:5173`; allowed headers include Content-Type and Authorization; allowed methods include POST and OPTIONS. A live preflight returned HTTP 204 and the expected origin. CORS is not the root cause.

## 8. Proxy Findings

Vite has no API proxy. The frontend intentionally calls the absolute CodeIgniter URL from `.env.local`. Therefore no proxy rewrite, stale proxy target, or duplicate `/api` prefix caused this incident.

## 9. HTTP/HTTPS and apiClient Findings

Both active development origins use HTTP, so there is no mixed-content block. The API interceptor returns its config. Instrumentation did not cause the failure. Development error logging now records method, resolved URL, Axios code/message, response presence, status and duration without request bodies, tokens, or passwords.

## 10. Root Cause

### NET-001 — Backend API was not running

**Observed:** The frontend sent a request to port 8080 and received no HTTP response.

**Evidence:** The configured final URL was correct, the CodeIgniter route existed, and no port-8080 listener existed at diagnosis. Starting one known WAMP PHP runtime changed health, preflight, valid login and invalid login to real HTTP responses.

**Root cause:** Local development previously started Vite independently and did not ensure CodeIgniter remained running. The browser could render the login form but could not reach its required API.

**Status:** Confirmed / Fixed.

## 11. Implemented Fix

- `npm run dev` now invokes `scripts/start-achievenest-dev.ps1`.
- The launcher resolves the MySQL-enabled WAMP PHP 8.4 runtime before PATH PHP.
- It starts a single PHP built-in server directly, avoiding orphan child servers.
- It waits for `/api/v1/health` and fails with a precise message if the API/MySQL is unavailable.
- It starts Vite on fixed port 5173, matching the CORS allowlist.
- It detects a pre-existing frontend listener instead of silently choosing another port.
- `npm run dev:frontend` remains available when the API is intentionally managed separately.
- Network failures now show: “Unable to connect to the AchieveNest server. Please check the server connection and try again.”

## 12. Validation

| Scenario | Result |
|---|---|
| Backend health | HTTP 200, database connected |
| Login preflight | HTTP 204, correct CORS origin |
| Correct HR credentials | HTTP 200 and access token response |
| Incorrect password | HTTP 401 authentication response |
| API offline | Safe connectivity-specific frontend error implemented |
| Email validation | Unchanged |
| Password/auth rules | Unchanged |

## 13. Remaining Issues

- Chrome’s complete original `net::ERR_*` suffix remains **Not Confirmed** because only the truncated DevTools value was supplied.
- The frontend process that was already running must be restarted before it observes the changed Vite port configuration or package script. It does not need a restart to use the API now running at the unchanged absolute URL.
- Production environments must provide their own HTTPS API base URL; the local HTTP URL must not be reused by an HTTPS deployment.
