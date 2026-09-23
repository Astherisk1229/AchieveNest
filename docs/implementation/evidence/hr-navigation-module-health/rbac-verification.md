# RBAC & Navigation Guard Verification

### Verification Summary
- **HR Route Authorization Guard:**
  - Route wrapper: `<Route element={<LayoutShell allowedAccountTypes={['hr_admin']} requiredRoles={['hr_staff']} />}>`
  - Direct URL access to `/hr/*` by `student`, `personnel`, `dean`, `program_coordinator`, `organization_moderator`, or unauthenticated sessions is blocked and redirected to their designated home or login page.
- **Role Context Isolation:**
  - `getAuthorizedNavigationForSession` returns HR routes only when `userSession.active_role_context === 'hr_staff'`.
  - Personnel accounts switching active roles dynamically recalculate authorized navigation items without requiring browser refresh.
