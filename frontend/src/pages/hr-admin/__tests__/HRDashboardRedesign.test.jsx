import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('HR Dashboard operational home contract', () => {
  const dashboard = fs.readFileSync(path.resolve(__dirname, '../HRDashboardPage.jsx'), 'utf8')
  const layout = fs.readFileSync(path.resolve(__dirname, '../../../components/layout/MainLayout.jsx'), 'utf8')
  const backend = fs.readFileSync(path.resolve(__dirname, '../../../../../backend/app/Controllers/Api/HRPersonnelController.php'), 'utf8')

  it('contains the approved hierarchy and exactly three linked KPI cards', () => {
    expect(dashboard).toContain('HR Dashboard')
    expect(dashboard).toContain('Overview of your HR workspace')
    expect(dashboard).toContain('Needs Attention')
    expect(dashboard).toContain('Current Ranking Period')
    expect(dashboard).toContain('Active Personnel')
    expect(dashboard).toContain('Awaiting HR Review')
    expect(dashboard).toContain('Submitted Portfolios')
    expect(dashboard).not.toContain('At a Glance')
    expect(dashboard).not.toContain('Recent Activity')
    expect(dashboard.match(/aria-label="HR dashboard key metrics"/g)).toHaveLength(1)
  })

  it('uses the current cycle workspace for roster and reviewer-authorized action counts', () => {
    expect(dashboard).toContain("hrEvaluationService.workspace(featured.id, key, 'submissions')")
    expect(dashboard).toContain("hrEvaluationService.workspace(featured.id, key, 'evaluation')")
    expect(dashboard).toContain("'start_evaluation', 'evaluate_items'")
    expect(dashboard).toContain('cycleData?.roster?.length')
    expect(dashboard).not.toContain('fetchHRAudit')
  })

  it('suppresses zero-value attention items and displays an empty state', () => {
    expect(dashboard).toContain('cycleData?.actionable > 0')
    expect(dashboard).toContain('colleges_without_dean || 0) > 0')
    expect(dashboard).toContain('You’re all caught up.')
  })

  it('backs active-personnel and dean metrics with server aggregation', () => {
    expect(backend).toContain("'total_personnel'")
    expect(backend).toContain("'colleges_without_dean'")
  })

  it('keeps dashboard footer and scroll chrome suppressed', () => {
    expect(layout).toContain("location.pathname === '/hr/dashboard'")
    expect(layout).toContain('!isHrDashboard && <Footer />')
    expect(layout).toContain('showScrollTop && !isHrDashboard')
  })
})
