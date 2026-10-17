import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(process.cwd(), 'src')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

describe('Faculty Phase O production wiring', () => {
  it('routes ready Faculty cases into Phase O instead of legacy finalize', () => {
    const page = read('pages/hr-admin/HREvaluationSubmissionsPage.jsx')
    expect(page).toContain("sub.status === 'ready_for_finalization'")
    expect(page).toContain("toUpperCase() === 'FACULTY'")
    expect(page).toContain('setPhaseOEvaluation(sub)')
    expect(page).toContain('<FacultyPhaseOWorkspace')
    expect(page).toContain("props.lockStatus && (sub.status === 'ready_for_finalization' || sub.status === 'ready_finalization')")
  })

  it('keeps NTF on the classification-aware completion path', () => {
    const page = read('pages/hr-admin/HREvaluationSubmissionsPage.jsx')
    expect(page).toContain('hrEvaluationService.finalize(subId, scores)')
    expect(page).toContain("sub.personnel_group || ''")
  })

  it('gives Dean preparation controls without HR final review authority', () => {
    const dean = read('pages/dean/DeanPortfolioEvaluationWorkspace.jsx')
    const workspace = read('components/evaluation/FacultyPhaseOWorkspace.jsx')
    expect(dean).toContain('mode="reviewer"')
    expect(dean).toContain('onPreparationReady={ready => setPhaseOReadyId(ready ? review.id :')
    expect(dean).toContain('phaseOReadyId!==review.id')
    expect(workspace).toContain("reviewerMode")
    expect(workspace).toContain("!reviewerMode")
    expect(workspace).toContain('Generate Recommended Rank')
  })

  it('lets HR prepare ranks for Faculty evaluations assigned directly to HR', () => {
    const stage = read('pages/hr-admin/ranking-cycle-stages/EvaluationStage.jsx')
    const studio = read('pages/hr-admin/evaluation-submissions/evaluation/PortfolioEvaluationStudio.jsx')
    const actions = read('pages/hr-admin/evaluation-submissions/studio/StudioDecisionBar.jsx')
    expect(stage).toContain('onOpenRankPreparation=')
    expect(stage).toContain("mode={phaseO.status === 'in_evaluation' ? 'reviewer' : 'hr'}")
    expect(studio).toContain('onOpenRankPreparation={onOpenRankPreparation}')
    expect(actions).toContain('Prepare Faculty Rank')
  })

  it('uses only canonical Phase M through P endpoints', () => {
    const service = read('services/facultyPhaseOService.js')
    expect(service).toContain('/rank-applied-for/suggest')
    expect(service).toContain('/recommended-rank/suggest')
    expect(service).toContain('/hr/recommended-ranks/')
    expect(service).toContain('/official-summary')
    expect(service).toContain("responseType: 'blob'")
    expect(service).toContain('openDocument: async')
    expect(service).not.toContain('/reviewer/evaluations/${enc(evaluationId)}/finalize')
  })
})
