import { describe, expect, it } from 'vitest'
import { evaluationAction, mayOpenFacultyPhaseO, mayUseGenericFinalizer } from '../evaluationStagePolicy'

const row = (group, allowed_actions, workflow_state = null) => ({
  personnel: { personnel_group: group },
  evaluation: { status: 'ready_for_finalization' },
  allowed_actions,
  workflow_state,
})

describe('ranking-cycle evaluation stage policy', () => {
  it('opens submitted portfolios for review before evaluation starts', () => {
    expect(evaluationAction(row('FACULTY', ['start_evaluation']))).toEqual({ label: 'Review portfolio', kind: 'evaluate' })
  })

  it('lets HR complete a Faculty portfolio without a separate rank review', () => {
    const faculty = row('FACULTY', ['view_evaluation', 'finalize_evaluation'])
    expect(evaluationAction(faculty)).toEqual({ label: 'Complete portfolio review', kind: 'summary' })
    expect(mayOpenFacultyPhaseO(faculty)).toBe(false)
    expect(mayUseGenericFinalizer(faculty)).toBe(true)
  })

  it('opens the saved summary before Non-Teaching finalization', () => {
    const ntf = row('NON_TEACHING_FACULTY', ['view_evaluation', 'finalize_evaluation'])
    expect(evaluationAction(ntf)).toEqual({ label: 'View summary', kind: 'summary' })
    expect(mayUseGenericFinalizer(ntf)).toBe(true)
    expect(mayOpenFacultyPhaseO(ntf)).toBe(false)
  })

  it('does not route Faculty portfolio completion through the legacy rank action', () => {
    const faculty = row('FACULTY', ['view_evaluation', 'review_final_rank'])
    expect(evaluationAction(faculty)).toEqual({ label: 'View details', kind: 'view' })
    expect(mayUseGenericFinalizer(faculty)).toBe(false)
    expect(mayOpenFacultyPhaseO(faculty)).toBe(true)
  })
})
