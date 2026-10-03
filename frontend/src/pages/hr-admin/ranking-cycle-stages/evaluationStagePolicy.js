export const FACULTY = 'FACULTY'
export const NON_TEACHING_FACULTY = 'NON_TEACHING_FACULTY'

export function personnelGroup(row) {
  return String(row?.personnel?.personnel_group || row?.evaluation?.personnel_group_snapshot || '').toUpperCase()
}

export function evaluationAction(row) {
  const actions = row?.allowed_actions || []
  const group = personnelGroup(row)
  if (actions.includes('start_evaluation')) return { label: 'Start evaluation', kind: 'start' }
  if (actions.includes('evaluate_items')) return { label: 'Continue evaluation', kind: 'evaluate' }
  if (actions.includes('review_final_rank') && group === FACULTY) return { label: 'Open final rank review', kind: 'phase-o' }
  if (actions.includes('finalize_evaluation') && group === NON_TEACHING_FACULTY) return { label: 'Finalize evaluation', kind: 'finalize' }
  if (actions.includes('view_evaluation')) return { label: 'View details', kind: 'view' }
  return null
}

export function mayUseGenericFinalizer(row) {
  return personnelGroup(row) === NON_TEACHING_FACULTY
    && (row?.allowed_actions || []).includes('finalize_evaluation')
}

export function mayOpenFacultyPhaseO(row) {
  return personnelGroup(row) === FACULTY
    && (row?.allowed_actions || []).includes('review_final_rank')
}
