import { formatDate, formatDateRange } from '../utils/achievementDates'

export const CANDIDATE_STATUS_LABELS = Object.freeze({
  POTENTIAL_CANDIDATE: 'Potential Candidate',
  BELOW_THRESHOLD: 'Below threshold',
  NEEDS_ATTENTION: 'Needs attention'
})

const number = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'
}
const percent = (value) => (Number.isFinite(Number(value)) ? `${number(value)}%` : '—')

/**
 * Real Student Evaluation Summary for one award, built only from what the server returned.
 * Missing values are shown as "Not available", never filled in.
 */
export default class EvaluationSummaryModel {
  constructor(payload = {}) {
    const student = payload.student || {}
    const cycle = payload.cycle || null
    this.awardName = payload.award?.name || 'Award'
    this.status = payload.candidate_status || null
    this.statusLabel = CANDIDATE_STATUS_LABELS[this.status] || 'Not available'
    this.studentEligible = payload.student_eligible !== false
    this.exceedsMaximum = Number(payload.raw_portfolio_score) > Number(payload.computable_max_score)
    this.humanOnlyCriteria = Array.isArray(payload.human_only_criteria) ? payload.human_only_criteria : []

    this.fields = [
      ['Student Name', student.student_name],
      ['Student ID', student.student_id_number],
      ['Program', student.program],
      ['Award Cycle / Academic Year', [cycle?.name, cycle?.academic_year].filter(Boolean).join(' · ')],
      ['Generated On', formatDate(payload.generated_at)]
    ].map(([label, value]) => ({ label, value: value || 'Not available' }))

    this.items = (Array.isArray(payload.items) ? payload.items : []).map((item) => ({
      ...item,
      date: formatDateRange(item.activity_date, item.end_date),
      criterionLabel: item.component_name && item.component_name !== item.criterion_name
        ? `${item.criterion_name} — ${item.component_name}`
        : item.criterion_name || 'Criterion unavailable'
    }))

    this.criteria = (Array.isArray(payload.criteria) ? payload.criteria : []).map((criterion) => ({
      ...criterion,
      earnedText: number(criterion.earned_points),
      maxText: number(criterion.max_points)
    }))

    // Shape expected by EvaluationSummaryAwardSection (same layout as the approved format).
    this.section = {
      id: payload.award?.id || 'award',
      name: this.awardName,
      rows: this.items.map((item) => ({
        key: item.id,
        evidence: item.achievement_title || 'Untitled achievement',
        criterion: item.criterionLabel,
        points: number(item.points)
      })),
      total: `${number(payload.raw_portfolio_score)} / ${number(payload.computable_max_score)}`,
      portfolioPotentialScore: percent(payload.portfolio_potential_score),
      qualificationThreshold: percent(payload.candidate_threshold_percent),
      status: this.statusLabel
    }
  }

}
