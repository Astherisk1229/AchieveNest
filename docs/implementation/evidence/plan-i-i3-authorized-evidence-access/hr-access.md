# HR Institutional Oversight Access

## 1. HR Governance Scope
1. **Institutional Jurisdiction**: Authorized HR staff (`hr_staff`, `hr_admin`) have access to evaluate and review evidence across all governed evaluations (both Faculty and Non-Teaching tracks).
2. **Server-Derived Roles**: The system verifies HR permissions strictly from the authenticated session token on the server.
3. **Client Role Forgery Defense**: Clients cannot elevate privileges by supplying `role: 'hr_staff'` in request bodies or query parameters.

## 2. Test Verification
- Test 3.1: `allows authorized HR staff to access governed evaluation evidence` (PASSED)
- Test 3.2: `prevents non-HR actors from forging HR role in client payload` (PASSED)
