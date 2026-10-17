const asObject = (value) => {
  if (typeof value === 'string') {
    try { return JSON.parse(value || '{}') } catch { return {} }
  }
  return value && typeof value === 'object' ? value : {}
}

export function personnelScoringRemark(item = {}) {
  const snapshot = asObject(item.criterion_snapshot)
  const scoring = asObject(item.provisional_scoring || snapshot.provisional_scoring)
  if (scoring.status === 'returned') return 'Returned for correction; no points verified'
  if (scoring.status === 'not_eligible') return 'Not eligible; no points counted'
  if (scoring.status === 'verified_pending_rating') return 'Evidence verified; evaluator rating pending'
  const verified = item.verified_points ?? item.verifiedPoints ?? item.awarded_points ?? item.awardedPoints ?? scoring.verified_points
  const isVerified = scoring.status === 'verified'
    || ['verified', 'approved'].includes(String(item.verification_status || item.status || '').toLowerCase())
    || String(item.rating_status || '').toLowerCase() === 'rated'
  if (isVerified && verified !== null && verified !== undefined && verified !== '' && Number.isFinite(Number(verified))) {
    return `Verified: ${Number(verified)} points`
  }
  if (scoring.points !== null && scoring.points !== undefined && Number.isFinite(Number(scoring.points))) {
    const submitted = String(scoring.portfolio_submission_status || '').toLowerCase() === 'submitted'
    return `Provisional: ${Number(scoring.points)} points · ${submitted ? 'Portfolio submitted; pending evaluator verification' : 'Pending portfolio submission and evaluator verification'}`
  }
  if (scoring.status === 'evaluator_rating_required') return 'Evaluator rating required; no provisional points assigned'
  // Evaluation submissions carry the locked criterion snapshot. For automatic
  // rules its configured_points is the server-resolved provisional score; do
  // not treat a manual/evaluator-rated maximum as an earned score.
  // Submitted evaluation rows persist the same locked value in
  // configured_points_snapshot; older personnel accomplishment rows may only
  // expose it there rather than inside criterion_snapshot.
  const lockedPoints = snapshot.configured_points ?? item.configured_points_snapshot ?? item.configuredPointsSnapshot
  const manual = snapshot.evaluator_judgment_required === true
    || Number(snapshot.evaluator_judgment_required) === 1
    || item.evaluator_judgment_required === true
    || Number(item.evaluator_judgment_required) === 1
  if (!manual && lockedPoints !== null && lockedPoints !== undefined && Number.isFinite(Number(lockedPoints)) && Number(lockedPoints) > 0) {
    return `Provisional: ${Number(lockedPoints)} points · Pending portfolio submission and evaluator verification`
  }
  if (scoring.status === 'hr_data_required') return 'Points pending verified HR service records'
  if (scoring.status === 'missing_scoring_details') {
    const missing = Array.isArray(scoring.missing_information) ? scoring.missing_information.join(', ') : ''
    return missing ? `Points pending: complete ${missing}` : 'Points pending required details'
  }
  if (scoring.status === 'missing_submission_fields') {
    const missing = Array.isArray(scoring.missing_information) ? scoring.missing_information.join('; ') : ''
    return missing ? `Points pending: ${missing}` : 'Points pending required criterion fields'
  }
  if (scoring.status === 'evidence_required') return 'Points pending supporting evidence'
  if (scoring.status === 'criteria_configuration_required') return 'Criteria need HR attention before points can be calculated'
  if (scoring.status === 'scoring_rule_unavailable' || scoring.status === 'unresolved') return 'Points unresolved; HR scoring configuration needs review'
  if (scoring.status === 'invalid_scoring_attribute') {
    const missing = Array.isArray(scoring.missing_information) ? scoring.missing_information.join(', ') : ''
    return missing ? `Points pending: select a valid ${missing}` : 'Points pending a valid scoring option'
  }
  return ''
}
