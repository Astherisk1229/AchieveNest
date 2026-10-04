import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '../../../../..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const page = () => read('frontend/src/pages/hr-admin/HRPersonnelDirectoryPage.jsx')

describe('Phase 5 item 3: HR directory actions', () => {
  it('reset password calls the real lifecycle endpoint and no client-side password', () => {
    expect(page()).toContain('lifecycleService.resetTemporaryPassword')
    const modal = read('frontend/src/pages/hr-admin/personnel-directory/ResetPersonnelPasswordModal.jsx')
    expect(modal).not.toContain('Math.random')
    expect(modal).toContain('temporary_password')
    expect(modal).toContain('verified')
  })
  it('edit assignment calls the new endpoint', () => {
    expect(read('frontend/src/services/hrAdminService.js')).toContain('/hr/personnel/${profileId}/assignment')
    expect(page()).toContain('updatePersonnelAssignment(')
    expect(read('backend/app/Config/Routes.php')).toContain("hr/personnel/(:segment)/assignment")
    expect(read('backend/app/Controllers/Api/TargetHRPersonnelController.php')).toContain('public function updateAssignment')
  })
  it('assignment modal keeps open and shows the backend error on failure', () => {
    const m = read('frontend/src/pages/hr-admin/personnel-directory/EditAssignmentModal.jsx')
    expect(m).toContain('await onSave')
    expect(m).toContain('catch (err)')
  })
  it('manage role goes to the Dean flow instead of a toast', () => {
    expect(page()).toContain("navigate('/hr/organizational-structure')")
  })
})
