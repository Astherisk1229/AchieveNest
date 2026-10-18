export const FACULTY = 'FACULTY'
export const NON_TEACHING_FACULTY = 'NON_TEACHING_FACULTY'

export function personnelGroup(row) {
  return String(row?.personnel?.personnel_group || row?.evaluation?.personnel_group_snapshot || '').toUpperCase()
}

export function evaluationAction(row) {
  const actions = row?.allowed_actions || []
  const group = personnelGroup(row)
  if (actions.includes('start_evaluation')) return { label: 'Review portfolio', kind: 'evaluate' }
  if (actions.includes('evaluate_items')) return { label: 'Continue evaluation', kind: 'evaluate' }
  if (actions.includes('finalize_evaluation')) return { label: group === FACULTY ? 'Complete portfolio review' : 'View summary', kind: 'summary' }
  if (actions.includes('view_evaluation')) return { label: 'View details', kind: 'view' }
  return null
}

export function mayUseGenericFinalizer(row) {
  return (row?.allowed_actions || []).includes('finalize_evaluation')
}

export function mayOpenFacultyPhaseO(row) {
  return personnelGroup(row) === FACULTY
    && (row?.allowed_actions || []).includes('review_final_rank')
}
