import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8')

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__tests__' || entry.name === 'node_modules') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.(js|jsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(full)
  }
  return out
}

describe('Wiring remediation Phase 4: no mock or fabricated data on reachable screens', () => {
  it('no screen, hook or service imports the seeded OSAD/HR controllers', () => {
    const allowed = new Set(['controllers/OSADController.js', 'controllers/HRController.js', 'hooks/useOSAD.js'])
    const offenders = walk(SRC)
      .map((f) => path.relative(SRC, f).replace(/\\/g, '/'))
      .filter((rel) => !allowed.has(rel))
      .filter((rel) => /from ['"][^'"]*\/(OSADController|HRController|useOSAD)['"]/.test(read(rel)))
    expect(offenders).toEqual([])
  })

  it('OSAD dashboard computes its overview from API lists', () => {
    const page = read('pages/osad-admin/OSADDashboardPage.jsx')
    expect(page).not.toContain('useOSAD')
    expect(page).toContain('provisioningService.fetchStudents()')
    expect(page).toContain('const metrics = React.useMemo')
    const summary = read('components/osad/OSADOperationalSummary.jsx')
    expect(summary).not.toMatch(/3840|activeOrganizationsCount = 24/)
  })

  it('activity log reads GET osad/audit and has no sample entries', () => {
    const page = read('pages/osad-admin/OSADSystemAuditLogsPage.jsx')
    expect(page).toContain('provisioningService.fetchAuditEvents')
    expect(page).not.toMatch(/Director Vance|Maria Santos|OSAD Staff'/)
    expect(read('services/provisioningService.js')).toContain("apiClient.get('/osad/audit'")
  })

  it('accreditation page shows no invented compliance figures', () => {
    const page = read('pages/osad-admin/OSADAccreditationReportsPage.jsx')
    expect(page).not.toMatch(/\b(412|380|520|96\.4)\b/)
  })

  it('useHR no longer reads localStorage-backed HR data or a fixed score', () => {
    const hook = read('hooks/useHR.js')
    expect(hook).not.toContain('HRController')
    expect(hook).not.toContain('accreditationScore')
    expect(read('pages/hr-admin/HRPersonnelDirectoryPage.jsx')).not.toContain('HR-2010-001')
  })

  it('profile defaults carry no demo identity', () => {
    expect(read('models/AccountRolePresentation.js')).not.toContain('defaultUserData')
    expect(read('hooks/useUserProfile.js')).not.toContain('defaultUserData')
    for (const rel of [
      'pages/personnel/PersonnelPortfolioPage.jsx',
      'pages/personnel/PersonnelPortfolioEditPage.jsx',
      'pages/personnel/PersonnelAchievementsPage.jsx',
      'pages/student/StudentAchievementsPage.jsx',
      'pages/student/modals/EditStudentInfoModal.jsx',
      'controllers/PersonnelPortfolioController.js',
      'models/PersonnelPortfolioModel.js'
    ]) {
      expect(read(rel), rel).not.toContain('Maria Santos')
    }
  })

  it('OSAD navigation tab keys match the dashboard tabs', () => {
    const nav = read('config/navigationCatalog.js')
    const page = read('pages/osad-admin/OSADDashboardPage.jsx')
    for (const key of ['accreditation-reports', 'system-logs']) {
      expect(nav).toContain(`tab: '${key}'`)
      expect(page).toContain(`activeTab === '${key}'`)
    }
    expect(read('pages/osad-admin/OSADCommandCenterPage.jsx')).not.toContain('awards-criteria')
  })

  it('setup-guide widget is off until it reads live data', () => {
    expect(read('config/navigationCatalog.js')).not.toContain('showOnboardingGuide: true')
  })
})
