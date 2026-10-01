const LOCKED_SUBMISSION_STATUSES = new Set([
  'submitted',
  'in_evaluation',
  'submitted_to_dep_sec',
  'endorsed_to_hr',
  'ready_for_finalization',
  'completed',
  'finalized',
  'hr_approved'
])

const RETURNED_SUBMISSION_STATUSES = new Set([
  'returned_for_revision',
  'returned_to_personnel'
])

const normalizeStatus = (status) => String(status || '').trim().toLowerCase()

/**
 * Normalize both the service-level payload and a raw API data envelope.
 * A DRAFT empty-state response is not an authoritative submission snapshot.
 */
export function normalizeLatestPersonnelSubmission(response) {
  const payload = response?.data || response
  const submission = payload?.submission

  if (!submission) return null

  return {
    ...submission,
    status: submission.status || payload.status || 'submitted',
    version_number: submission.version_number || payload.version_number || 1,
    return_feedback: submission.return_feedback || payload.return_feedback || null,
    items_count: payload.items_count ?? submission.items_count ?? 0,
    items: Array.isArray(payload.items) ? payload.items : (submission.items || [])
  }
}

/**
 * The latest immutable submission is authoritative when it exists. The rebuilt
 * working model is only the fallback for a personnel member without a submission.
 */
export function derivePersonnelPortfolioState(portfolio, latestSubmission) {
  const workingStatus = normalizeStatus(portfolio?.status) || 'draft'
  const submissionStatus = latestSubmission ? normalizeStatus(latestSubmission.status) : ''
  const status = submissionStatus || workingStatus
  const isReturnedForRevision = RETURNED_SUBMISSION_STATUSES.has(status)
  const isLocked = !isReturnedForRevision && LOCKED_SUBMISSION_STATUSES.has(status)
  const isEditable = !isLocked && (status === 'draft' || isReturnedForRevision)

  return { status, isReturnedForRevision, isLocked, isEditable }
}

/**
 * Initial submissions require the current OPEN_FOR_SUBMISSION period. A returned
 * submission already owns its period lineage, so resubmission must not depend on
 * facultyCurrent() finding a new open period.
 */
export function derivePersonnelSubmissionActionGate({
  portfolioState,
  evaluationPeriod,
  eligibilityStatus,
  isSubmitting = false
}) {
  const isReturnedForRevision = Boolean(portfolioState?.isReturnedForRevision)
  const periodUnavailableReason = isReturnedForRevision
    ? ''
    : !evaluationPeriod
      ? 'No personnel evaluation period is currently open for submission.'
      : !evaluationPeriod.can_submit
        ? 'The current personnel evaluation period is outside its submission window.'
        : ''
  const eligibilityBlocked = !isReturnedForRevision && eligibilityStatus !== 'eligible'
  const visible = Boolean(portfolioState?.isEditable)

  return {
    action: isReturnedForRevision ? 'resubmit' : 'submit',
    visible,
    periodUnavailableReason,
    eligibilityBlocked,
    disabled: !visible || isSubmitting || Boolean(periodUnavailableReason) || eligibilityBlocked
  }
}
