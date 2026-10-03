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
// The period name usually already contains its academic year ("AY 2025-2026 …"); don't repeat it.
const cycleLabel = (cycle) => {
  if (!cycle) return ''
  const name = String(cycle.name || '').trim()
  const year = String(cycle.academic_year || '').trim()
  if (!name) return year
  return year && !name.includes(year) ? `${name} · ${year}` : name
}
export const FILE_KIND_LABELS = Object.freeze({ pdf: 'PDF document', image: 'Image', other: 'File' })

/** Stable DOM anchor for one achievement's portfolio entry (keyed on the record id, never on list position). */
export const portfolioAnchorId = (recordId) => `portfolio-record-${recordId}`

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
    this.isPotentialCandidate = this.status === 'POTENTIAL_CANDIDATE'
    this.scoringInSync = payload.scoring_in_sync !== false

    this.fields = [
      ['Student Name', student.student_name],
      ['Student ID', student.student_id_number],
      ['Program', student.program],
      ['Award Cycle / Academic Year', cycleLabel(cycle)],
      ['Generated On', formatDate(payload.generated_at)]
    ].map(([label, value]) => ({ label, value: value || 'Not available' }))

    this.items = (Array.isArray(payload.items) ? payload.items : []).map((item) => ({
      ...item,
      date: formatDateRange(item.activity_date, item.end_date),
      criterionLabel: item.component_name && item.component_name !== item.criterion_name
        ? `${item.criterion_name} — ${item.component_name}`
        : item.criterion_name || 'Criterion unavailable'
    }))

    // Every approved achievement that belongs to this award, counted or not (server decides both).
    this.portfolio = (Array.isArray(payload.portfolio) ? payload.portfolio : []).map((record) => ({
      ...record,
      date: formatDateRange(record.activity_date, record.end_date),
      categoryLabel: [record.category_name, record.subcategory_name].filter(Boolean).join(' › '),
      pointsText: number(record.points),
      anchorId: portfolioAnchorId(record.record_id),
      files: (Array.isArray(record.evidence) ? record.evidence : []).map((file, index) => ({
        ...file,
        position: index + 1,
        kindLabel: FILE_KIND_LABELS[file.file_kind] || FILE_KIND_LABELS.other,
        uploadedOn: formatDate(file.uploaded_at)
      }))
    }))
    this.portfolioIds = new Set(this.portfolio.map((record) => record.record_id))
    this.countedCount = this.portfolio.filter((record) => record.counted).length

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
        recordId: item.record_id,
        date: item.date,
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
