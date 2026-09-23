import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../../..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')

describe('ranking legacy cleanup and compatibility', () => {
  it('quarantines the demo rank register behind a cycle redirect', () => {
    const app = read('frontend/src/App.jsx')
    expect(app).not.toContain("import('./pages/hr-admin/HRRankAssignmentLogsPage')")
    expect(app).toContain('path="/hr/rank-assignment-logs" element={<QueryPreservingRedirect to="/hr/ranking-cycles" />')
  })

  it('resolves legacy ranking work links into the cycle workspace', () => {
    const app = read('frontend/src/App.jsx')
    for (const route of ['/hr/evaluation-submissions', '/hr/faculty-evaluation-and-ranking', '/hr/verification-queue', '/hr/faculty-ranking-and-matrix']) {
      expect(app).toContain(`path="${route}"`)
    }
    expect(read('frontend/src/pages/hr-admin/HRDashboardPage.jsx')).not.toContain("href: '/hr/evaluation-submissions'")
  })

  it('keeps Annual Review controls outside the evaluation queue', () => {
    expect(read('frontend/src/pages/hr-admin/HREvaluationSubmissionsPage.jsx')).not.toContain('ImportWorkspace')
  })

  it('uses the organizational resolver in critical submission and roster workflows', () => {
    expect(read('backend/app/Controllers/Api/PersonnelPortfolioSubmissionController.php')).toContain('(new ReviewerResolverService())->resolve')
    expect(read('backend/app/Services/ReviewerResolverService.php')).toContain('resolveResponsibleAuthority')
    expect(read('backend/app/Services/AuthorityRankingRosterService.php')).toContain('resolveResponsibleAuthority')
  })

  it('uses active classification terminology while retaining official source-form titles', () => {
    const organizationPage = read('frontend/src/pages/hr-admin/HROrganizationalStructurePage.jsx')
    expect(organizationPage).not.toContain("'Non-Teaching Personnel'")
    expect(organizationPage).toContain("'Non-Teaching Faculty'")
    expect(read('backend/app/Controllers/Api/DeanWorkspaceController.php')).toContain("default => 'Non-Teaching Faculty'")
    expect(read('backend/app/Services/EvaluationInstrumentRegistry.php')).toContain('Non-Teaching Personnel Rating Sheet for Ranking (Appendix N)')
  })

  it('uses HR finalization terminology', () => {
    const files = [
      'frontend/src/pages/hr-admin/evaluation-submissions/queue/VerificationStatusTabs.jsx',
      'frontend/src/pages/hr-admin/evaluation-submissions/queue/VerificationQueueHeader.jsx',
      'frontend/src/pages/hr-admin/evaluation-submissions/queue/PortfolioSubmissionRow.jsx'
    ]
    for (const file of files) expect(read(file)).not.toContain('Ready for Final Evaluation')
  })
})
