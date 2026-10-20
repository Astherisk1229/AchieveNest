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
  }, 15000)

  it('OSAD dashboard computes its overview from API summary data', () => {
    const page = read('pages/osad-admin/OSADDashboardPage.jsx')
    expect(page).not.toContain('useOSAD')
    expect(page).toContain('provisioningService.fetchStudentSummary()')
    expect(page).toContain('const metrics = React.useMemo')
    const summary = read('components/osad/OSADOperationalSummary.jsx')
    expect(summary).not.toMatch(/3840|activeOrganizationsCount = 24/)
  })

  it('retired OSAD report and activity modules have no UI or API entry points', () => {
    const navigation = read('config/navigationCatalog.js')
    const dashboard = read('pages/osad-admin/OSADDashboardPage.jsx')
    const routes = read('../../backend/app/Config/Routes.php')
    expect(navigation).not.toContain('osad-accreditation-reports')
    expect(navigation).not.toContain('osad-activity-log')
    expect(dashboard).not.toContain('OSADAccreditationReportsPage')
    expect(dashboard).not.toContain('OSADSystemAuditLogsPage')
    expect(fs.existsSync(new URL('../pages/osad-admin/OSADAccreditationReportsPage.jsx', import.meta.url))).toBe(false)
    expect(fs.existsSync(new URL('../pages/osad-admin/OSADSystemAuditLogsPage.jsx', import.meta.url))).toBe(false)
    expect(routes).not.toContain("'osad/audit'")
    expect(read('services/provisioningService.js')).not.toContain("'/osad/audit'")
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

  it('retired OSAD dashboard links return to overview', () => {
    const nav = read('config/navigationCatalog.js')
    const page = read('pages/osad-admin/OSADDashboardPage.jsx')
    expect(nav).not.toContain("tab: 'accreditation-reports'")
    expect(nav).not.toContain("tab: 'system-logs'")
    expect(page).toContain("['certificate-templates', 'accreditation-reports', 'system-logs'].includes(rawTab)")
    expect(read('pages/osad-admin/OSADCommandCenterPage.jsx')).not.toContain('awards-criteria')
  })

  it('setup-guide widget is off until it reads live data', () => {
    expect(read('config/navigationCatalog.js')).not.toContain('showOnboardingGuide: true')
  })
})
