import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('HR Dashboard operational home contract', () => {
  const dashboard = fs.readFileSync(path.resolve(__dirname, '../HRDashboardPage.jsx'), 'utf8')
  const layout = fs.readFileSync(path.resolve(__dirname, '../../../components/layout/MainLayout.jsx'), 'utf8')
  const backend = fs.readFileSync(path.resolve(__dirname, '../../../../../backend/app/Controllers/Api/HRPersonnelController.php'), 'utf8')

  it('contains only the approved operational dashboard sections', () => {
    expect(dashboard).toContain('Evaluation Cycle')
    expect(dashboard).toContain('Needs Attention')
    expect(dashboard).toContain('At a Glance')
    expect(dashboard).toContain('Recent Activity')
    expect(dashboard).not.toContain('Operational Overview')
    expect(dashboard).not.toContain('Pending HR Actions')
    expect(dashboard).not.toContain('Assign Dean')
  })

  it('suppresses zero-value attention items and provides the caught-up state', () => {
    expect(dashboard).toContain('evaluationCount > 0')
    expect(dashboard).toContain('colleges_without_dean || 0) > 0')
    expect(dashboard).toContain('You’re all caught up.')
  })

  it('uses confirmed dedicated module routes', () => {
    for (const route of ['/hr/evaluation-submissions', '/hr/organizational-structure', '/hr/personnel-directory', '/hr/audit-trail', '/hr/personnel-evaluation-setup']) {
      expect(dashboard).toContain(route)
    }
  })

  it('loads narrowly owned data instead of the broad useHR hook', () => {
    expect(dashboard).toContain('fetchHRDashboard')
    expect(dashboard).toContain('fetchHRAudit({ per_page: 5 })')
    expect(dashboard).toContain('getCurrentPersonnelEvaluationPeriod')
    expect(dashboard).not.toContain("from '../../hooks/useHR'")
  })

  it('backs institutional metrics with dashboard aggregation queries', () => {
    expect(backend).toContain("'total_colleges'")
    expect(backend).toContain("'total_offices_units'")
    expect(backend).toContain("'colleges_without_dean'")
  })

  it('removes dashboard-only footer and Back to Top chrome', () => {
    expect(layout).toContain("location.pathname === '/hr/dashboard'")
    expect(layout).toContain('!isHrDashboard && <Footer />')
    expect(layout).toContain('showScrollTop && !isHrDashboard')
  })
})
