# Frontend Architecture Security Directory

This document serves as a comprehensive reference of **Frontend Architecture Security Features**, categorized by domain, along with their purpose and practical implementation details.

---

## 1. HTTP Security Headers & Content Policies

| Security Feature | Purpose | Key Details & Example |
| :--- | :--- | :--- |
| **Content Security Policy (CSP)** | Prevents Cross-Site Scripting (XSS), data injection, and unauthorized script execution. | Restricts which domains can load scripts, styles, images, and frames.<br>`Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted.cdn.com; frame-ancestors 'none';` |
| **Strict-Transport-Security (HSTS)** | Forces browsers to interact with the web app exclusively over encrypted HTTPS connections. | Prevents SSL stripping and Man-in-the-Middle (MitM) attacks.<br>`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` |
| **X-Frame-Options / `frame-ancestors`** | Prevents Clickjacking attacks by controlling whether your app can be embedded inside an `<iframe>`. | `X-Frame-Options: DENY` or CSP `frame-ancestors 'none';` |
| **X-Content-Type-Options** | Stops browsers from MIME-sniffing a response away from the declared `Content-Type`. | Prevents browsers from executing malicious non-executable files (e.g. executing an uploaded image as script).<br>`X-Content-Type-Options: nosniff` |
| **Referrer-Policy** | Controls how much referrer information (URL path and query parameters) is included in requests sent to other origins. | Prevents leaks of sensitive token parameters in URLs to third parties.<br>`Referrer-Policy: strict-origin-when-cross-origin` |
| **Permissions-Policy (Feature-Policy)** | Disables unnecessary browser APIs and hardware access (camera, microphone, geolocation, payment). | Reduces attack surface if an XSS vector ever compromised the page.<br>`Permissions-Policy: camera=(), microphone=(), geolocation=()` |
| **COOP, COEP, CORP (Cross-Origin Policies)** | Isolates your application's browsing context from cross-origin documents. | Mitigates side-channel attacks like Spectre/Meltdown.<br>`Cross-Origin-Opener-Policy: same-origin`<br>`Cross-Origin-Embedder-Policy: require-corp` |

---

## 2. Authentication, Token & Storage Security

| Security Feature | Purpose | Key Details & Example |
| :--- | :--- | :--- |
| **`HttpOnly` & `SameSite` Cookies** | Secures session cookies against XSS-based theft and Cross-Site Request Forgery (CSRF). | Setting `HttpOnly` blocks JavaScript from reading cookies (`document.cookie`). `SameSite=Strict` or `Lax` blocks automatic cookie transmission on cross-site requests. |
| **BFF (Backend-for-Frontend) Token Pattern** | Keeps sensitive OAuth access/refresh tokens off the client entirely. | The frontend talks to a lightweight API gateway (BFF) using `HttpOnly` encrypted session cookies. The BFF attaches JWT tokens when proxying requests to downstream microservices. |
| **In-Memory Ephemeral Token Storage** | If cookies cannot be used, store JWTs strictly in memory (React/Vue state variable) rather than `localStorage`. | Storage in `localStorage` or `sessionStorage` is vulnerable to extraction via any XSS script. In-memory tokens vanish when the page reloads and require refresh token exchange via a secure channel. |
| **OAuth 2.0 with PKCE (Proof Key for Code Exchange)** | Prevents authorization code interception attacks during single-page app (SPA) logins. | Dynamically generates a secret `code_verifier` and hashed `code_challenge` per authentication request. |
| **Automatic Session Timeout & Idle Detection** | Logs out inactive users automatically to prevent unauthorized access on shared terminals. | Monitors user events (`mousemove`, `keydown`) with an idle timer reset. |

---

## 3. Input Handling, File Upload & XSS Mitigation

| Security Feature | Purpose | Key Details & Example |
| :--- | :--- | :--- |
| **Client-Side File Upload Security (Max Size & Type Guard)** | Prevents Client DoS, memory crashes, and unauthorized file payload uploads. | Enforces strict max file size limit (e.g. `file.size > 10 * 1024 * 1024` / Max 10MB) and strict MIME type allowlist (`accept="application/pdf,image/png"`). Inspects **Magic Bytes / File Header Signatures** (`%PDF-`, `\xFF\xD8\xFF`) in browser memory via `FileReader` before upload. |
| **Filename Sanitization** | Prevents Path Traversal attempts (`../../malicious.sh`) and HTML/Script injection via filenames. | Sanitizes filenames on the client using safe regex (`file.name.replace(/[^a-zA-Z0-9._-]/g, '_')`) before rendering in DOM or dispatching to API. |
| **Context-Aware Output Encoding** | Converts untrusted characters into safe entity representations before rendering into DOM. | Escapes `<`, `>`, `"`, `'`, `/`, `&`. Modern frameworks (React, Vue, Angular) encode dynamically rendered variables by default. |
| **Trusted Types API** | Forces all DOM mutation APIs (e.g. `innerHTML`, `document.write`) to consume sanitized `TrustedHTML` objects. | Throws browser errors at runtime whenever raw string assignments occur in risky sinks.<br>`Content-Security-Policy: require-trusted-types-for 'script';` |
| **DOM Sanitization Libraries** | Safely strips malicious tags/scripts if your UI *must* render user-submitted HTML (rich text). | Use battle-tested libraries like **DOMPurify**:<br>`const cleanHTML = DOMPurify.sanitize(dirtyInput);` |
| **DOM Clobbering Defenses** | Prevents user-controlled HTML `id` or `name` attributes from overwriting global JavaScript variables or DOM properties. | Namespace custom variables; avoid referencing global variables created by `window[elementId]`. |
| **Prototype Pollution Defenses** | Prevents attackers from injecting malicious properties into JavaScript `Object.prototype`. | Use `Object.freeze()`, validate JSON schemas before merging deep objects, or use `Map` instead of plain objects `{}`. |

---

## 4. Network, API & Communication Security

| Security Feature | Purpose | Key Details & Example |
| :--- | :--- | :--- |
| **Subresource Integrity (SRI)** | Guarantees that third-party scripts loaded from CDNs have not been tampered with or infected. | Includes a cryptographic hash in script tags:<br>`<script src="..." integrity="sha384-..." crossorigin="anonymous"></script>` |
| **Strict CORS Configuration** | Controls which external origins can read response data from your frontend requests. | Configured server-side, but frontend architecture must avoid wildcard `Access-Control-Allow-Origin: *` when credentials are involved. |
| **Anti-CSRF Tokens (Synchronizer / Double Submit)** | Protects state-changing requests from forged cross-site submissions. | Frontend attaches a custom request header (e.g. `X-CSRF-Token`) containing a cryptographically generated token. |
| **Request Signing & Nonces** | Prevents API request tampering and replay attacks. | Hash request parameters along with a nonce timestamp using HMAC-SHA256 before transmitting (`X-Signature`, `X-Timestamp`). |
| **`rel="noopener noreferrer"`** | Prevents **Reverse Tabnabbing** attacks when opening external links (`target="_blank"`). | Stops the destination page from hijacking your app's window using `window.opener.location`. |

---

## 5. UI/UX Access Control & Defense in Depth

| Security Feature | Purpose | Key Details & Example |
| :--- | :--- | :--- |
| **UI Role-Based Access Control (RBAC)** | Hides unauthorized action buttons, routes, and views based on authenticated permissions. | *Note:* Frontend RBAC improves UX; true access control must always be re-enforced by the backend API. |
| **Open Redirect Prevention** | Prevents attackers from supplying malicious `redirect_url` query parameters to log users into phishing sites. | Validate and allowlist redirect targets on origin (e.g. only allow paths starting with `/`). |
| **Data Masking & PII Redaction** | Mask sensitive information (credit cards, SSNs, emails) in UI components. | Renders masked representations (`•••• 1234`) and restricts copying or raw data rendering in DOM nodes. |
| **Sensitive Form Controls** | Prevents keyloggers and password leaks on form elements. | Disable autocomplete, auto-fill, or clipboard pasting where required:<br>`<input type="password" autocomplete="new-password" />` |
| **Client-Side Throttling & CAPTCHA** | Prevents credential stuffing, spam submissions, and automated script attacks. | Integrates bot detection services (Cloudflare Turnstile, reCAPTCHA v3) before triggering expensive client actions. |

---

## 6. Code Integrity & Supply Chain Security

| Security Feature | Purpose | Key Details & Example |
| :--- | :--- | :--- |
| **Software Supply Chain Audit (SCA)** | Detects known vulnerabilities in third-party npm packages. | Enforce CI checks using `npm audit`, Snyk, or Dependabot. Commit `package-lock.json` to verify dependency integrity hashes. |
| **Environment Variable Isolation** | Prevents secret keys (API secrets, database credentials) from leaking into client-side JS bundles. | Only expose variables explicitly prefixed for public client usage (e.g., `NEXT_PUBLIC_*` or `VITE_*`). |
| **Source Map Restriction** | Prevents end-users or attackers from viewing raw source code and internal architecture in production browser dev tools. | Disable production source maps or host source maps on a private, authenticated server. |
| **Client Log Sanitization** | Ensures monitoring tools (Sentry, Datadog, LogRocket) do not capture sensitive tokens or user PII. | Configure scrubbing rules on logger breadcrumbs before data is dispatched. |

---

## 7. Recommended Implementation Roadmap

1. **Baseline Essentials (Day 1)**: Enable strict HTTP Security Headers (HSTS, CSP, X-Frame-Options), store auth in `HttpOnly SameSite` cookies, configure strict CORS.
2. **Data, Rendering & File Controls**: Use DOMPurify for HTML sanitization, enforce strict client-side file upload size/type limits and Magic Byte validation, enforce SRI on external script tags, add `rel="noopener noreferrer"` to all target `_blank` links.
3. **Architecture Hardening**: Implement OAuth 2.0 PKCE / BFF token pattern, restrict source map availability in production, and set up automated SCA vulnerability checks in CI/CD pipelines.
