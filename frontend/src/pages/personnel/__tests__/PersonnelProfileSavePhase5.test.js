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
  it('modal calls the service instead of a timer, and HR-owned fields are read-only', () => {
    const m = read('frontend/src/pages/personnel/modals/EditBasicInfoModal.jsx')
    expect(m).toContain('updateOwnProfile(')
    expect(m).not.toContain('setTimeout(resolve, 300)')
    expect((m.match(/managed by HR/g) || []).length).toBe(4)
  })
  it('service sends only the self-service fields', () => {
    const s = read('frontend/src/services/personnelProfileService.js')
    expect(s).toContain("apiClient.put('/personnel/profile', { contact_number, location, about_me, specialization })")
  })
  it('pages load saved values from the server', () => {
    expect(read('frontend/src/pages/personnel/PersonnelDashboardPage.jsx')).toContain('fetchOwnProfileFields()')
    expect(read('frontend/src/pages/personnel/PersonnelPortfolioPage.jsx')).toContain('fetchOwnProfileFields()')
  })
})
