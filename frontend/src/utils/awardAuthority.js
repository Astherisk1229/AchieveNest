export function resolveAwardAuthority(value) {
  const normalized = String(value || '').trim().toUpperCase()

  if (normalized === 'OFFICIAL') return 'Official'
  if (normalized === 'SYSTEM_OPERATIONALIZATION' || normalized === 'OPERATIONALIZED') return 'Operationalized'
  if (normalized === 'PROPOSED' || normalized === 'PROPOSED_PENDING_APPROVAL') return 'Proposed'
  return null
}
