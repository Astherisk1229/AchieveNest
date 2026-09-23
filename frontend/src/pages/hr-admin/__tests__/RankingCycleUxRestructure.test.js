import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const frontendRoot = path.resolve(import.meta.dirname, '../../..')
const read = relative => fs.readFileSync(path.join(frontendRoot, relative), 'utf8')

describe('Ranking Cycle UX restructure', () => {
  it('exposes one cycle-centric HR navigation entry', () => {
    const navigation = read('config/navigationCatalog.js')
    expect(navigation).toContain("label: 'Ranking Cycles'")
    expect(navigation).toContain("path: '/hr/ranking-cycles'")
    expect(navigation).not.toContain("label: 'Portfolio Evaluations'")
    expect(navigation).not.toContain("label: 'Rank Assignment Logs'")
  })

  it('routes cycle, track, and stage context through the cycle workspace', () => {
    const app = read('App.jsx')
    expect(app).toContain('path="/hr/ranking-cycles/:cycleId/:trackKey/:stage"')
    const context = read('components/ranking/RankingCycleContext.jsx')
    for (const stage of ['Overview', 'Annual Reviews', 'Submissions', 'Evaluations', 'Results']) {
      expect(context).toContain(stage)
    }
  })

  it('keeps Annual Review outside the evaluation queue', () => {
    const queue = read('pages/hr-admin/HREvaluationSubmissionsPage.jsx')
    expect(queue).not.toContain('ImportWorkspace')
    const workspace = read('pages/hr-admin/HRRankingCyclesPage.jsx')
    expect(workspace).toContain("safeStage==='annual-reviews'")
    expect(workspace).toContain('<DeanAnnualReviewEligibilityPage')
  })

  it('locks embedded queues to the selected cycle track and stage', () => {
    const workspace = read('pages/hr-admin/HRRankingCyclesPage.jsx')
    expect(workspace).toContain('fixedPeriodId={track.id}')
    expect(workspace).toContain('embedded lockStatus')
    const queue = read('pages/hr-admin/HREvaluationSubmissionsPage.jsx')
    expect(queue).toContain('!props.lockStatus')
    expect(queue).toContain('!props.fixedPeriodId')
  })
})
