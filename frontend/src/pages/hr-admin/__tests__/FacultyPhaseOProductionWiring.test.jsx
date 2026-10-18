import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(process.cwd(), 'src')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

describe('Faculty portfolio review and rank progression are separate', () => {
  it('lets HR complete the Faculty portfolio review without opening a rank workflow', () => {
    const stage = read('pages/hr-admin/ranking-cycle-stages/EvaluationStage.jsx')
    const submissionsPage = read('pages/hr-admin/HREvaluationSubmissionsPage.jsx')
    expect(stage).toContain('onOpenFinalizeModal=')
    expect(stage).toContain('Rank progression is handled separately.')
    expect(stage).toContain('finalizeLabel="Complete review"')
    expect(submissionsPage).not.toContain('<FacultyPhaseOWorkspace')
  })

  it('keeps NTF rank handling separate from Faculty portfolio completion', () => {
    const stage = read('pages/hr-admin/ranking-cycle-stages/EvaluationStage.jsx')
    expect(stage).toContain('NonTeachingRankApplicationPanel')
    expect(stage).toContain("String(studio.personnel_group || '').toUpperCase() === 'NON_TEACHING_FACULTY'")
  })

  it('keeps Dean portfolio review focused on evidence decisions and endorsement', () => {
    const dean = read('pages/dean/DeanPortfolioEvaluationWorkspace.jsx')
    expect(dean).toContain('approveDeanReviewItem')
    expect(dean).toContain('endorseDeanReview')
    expect(dean).toContain('FacultyEvaluationSummary')
    expect(dean).not.toContain('Generate Recommended Rank')
    expect(dean).not.toContain('FacultyPhaseOWorkspace')
  })

  it('gives HR a direct complete-review action for assigned Faculty evaluations', () => {
    const stage = read('pages/hr-admin/ranking-cycle-stages/EvaluationStage.jsx')
    const studio = read('pages/hr-admin/evaluation-submissions/evaluation/PortfolioEvaluationStudio.jsx')
    const actions = read('pages/hr-admin/evaluation-submissions/studio/StudioDecisionBar.jsx')
    expect(stage).toContain('finalizeLabel="Complete review"')
    expect(studio).toContain('onOpenFinalizeModal ? handleFinalizeClicked : undefined')
    expect(actions).toContain('{finalizeLabel}')
    expect(actions).not.toContain('Prepare Faculty Rank')
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
