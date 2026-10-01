import { describe, expect, it } from 'vitest'
import { evaluationAction, mayOpenFacultyPhaseO, mayUseGenericFinalizer } from '../evaluationStagePolicy'

const row = (group, allowed_actions, workflow_state = null) => ({
  personnel: { personnel_group: group },
  evaluation: { status: 'ready_for_finalization' },
  allowed_actions,
  workflow_state,
})

describe('ranking-cycle evaluation stage policy', () => {
  it('routes Faculty final rank work only to Phase O', () => {
    const faculty = row('FACULTY', ['view_evaluation', 'review_final_rank'])
    expect(evaluationAction(faculty)).toEqual({ label: 'Open final rank review', kind: 'phase-o' })
    expect(mayOpenFacultyPhaseO(faculty)).toBe(true)
    expect(mayUseGenericFinalizer(faculty)).toBe(false)
  })

  it('routes only Non-Teaching Faculty to the generic finalizer', () => {
    const ntf = row('NON_TEACHING_FACULTY', ['view_evaluation', 'finalize_evaluation'])
    expect(evaluationAction(ntf)).toEqual({ label: 'Finalize evaluation', kind: 'finalize' })
    expect(mayUseGenericFinalizer(ntf)).toBe(true)
    expect(mayOpenFacultyPhaseO(ntf)).toBe(false)
  })

  it('does not trust a mismatched finalization action', () => {
    const faculty = row('FACULTY', ['view_evaluation', 'finalize_evaluation'])
    expect(evaluationAction(faculty)).toEqual({ label: 'View details', kind: 'view' })
    expect(mayUseGenericFinalizer(faculty)).toBe(false)
  })
})
