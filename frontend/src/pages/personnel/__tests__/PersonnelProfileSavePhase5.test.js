import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '../../../../..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

describe('Phase 5 item 4: personnel basic info persists', () => {
  it('backend exposes PUT personnel/profile and a migration for the columns', () => {
    expect(read('backend/app/Config/Routes.php')).toContain("put('personnel/profile'")
    const c = read('backend/app/Controllers/Api/PersonnelProfileController.php')
    expect(c).toContain('public function update')
    expect(c).toContain('contact_number')
    const m = read('backend/app/Phase2/Database/Migrations/2026-10-05-000030_AddPersonnelSelfServiceProfileFields.php')
    for (const col of ['contact_number', 'location', 'about_me', 'specialization']) expect(m).toContain(col)
  })
  it('modal calls the service and contains only Personnel-editable profile fields', () => {
    const m = read('frontend/src/pages/personnel/modals/EditBasicInfoModal.jsx')
    expect(m).toContain('updateOwnProfile(')
    expect(m).not.toContain('setTimeout(resolve, 300)')
    for (const editableField of ['contact_number', 'about_me', 'specialization', 'ProfilePhotoUploader']) expect(m).toContain(editableField)
    for (const nonEditableField of ['institutional_email', 'Institutional Email', 'name="location"', 'Campus Location', 'name="full_name"', 'name="employee_id"', 'name="designation"', 'educational_attainment', 'Years of Service']) expect(m).not.toContain(nonEditableField)
  })
  it('service sends only the self-service fields', () => {
    const s = read('frontend/src/services/personnelProfileService.js')
    expect(s).toContain("apiClient.put('/personnel/profile', { contact_number, about_me, specialization })")
  })
  it('Profile loads saved values while Portfolio stays focused on evaluations', () => {
    expect(read('frontend/src/pages/personnel/PersonnelDashboardPage.jsx')).toContain('fetchOwnProfileFields()')
    const portfolio = read('frontend/src/pages/personnel/PersonnelPortfolioPage.jsx')
    expect(portfolio).not.toContain('fetchOwnProfileFields()')
    expect(portfolio).not.toContain('EditBasicInfoModal')
    expect(portfolio).not.toContain('Edit Profile')
    expect(portfolio).toContain('Current HR Evaluation')
    expect(portfolio).toContain('Review Before Submission')
    expect(portfolio).toContain('Submit Portfolio')
  })
})
