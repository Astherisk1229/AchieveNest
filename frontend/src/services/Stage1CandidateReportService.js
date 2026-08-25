/**
 * Stage1CandidateReportService.js
 * Generates formatted CSV summary reports and print exports for OSAD Stage 1 Candidate Reviews.
 * Includes CSV formula injection escaping (=, +, -, @) and clear Stage 1 evaluation headers.
 */

export class Stage1CandidateReportService {
  static escapeCsvValue(val) {
    if (val === null || val === undefined) return '""'
    let str = String(val).trim()
    // Formula injection protection
    if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
      str = "'" + str
    }
    // Quote string and escape double quotes
    return `"${str.replace(/"/g, '""')}"`
  }

  static generateStage1SummaryReportCsv(candidates = [], categoryName = "Dean's Honor Roll", _isOfficial = false) {
    const headers = [
      'Stage 1 Rank',
      'Student ID',
      'Student Name',
      'Degree Program',
      'College',
      'Available Stage 1 Score',
      'Verified Records Count',
      'Candidate Status',
      'Review Status',
      'OSAD Advancement Decision',
      'Decision Date'
    ]

    const rows = candidates.map((c, idx) => {
      let decisionLabel = 'Pending Review'
      if (c.osadDecision === 'ADVANCED_TO_INTERVIEW' || c.confirmed === true || c.confirmationStatus === 'confirmed') {
        decisionLabel = 'Advanced to Interview'
      } else if (c.osadDecision === 'NOT_ADVANCED' || c.confirmationStatus === 'revoked') {
        decisionLabel = 'Do Not Advance'
      }

      return [
        c.stage1Rank || c.globalRank || (idx + 1),
        c.studentId || c.student_id || 'N/A',
        c.student_name || c.name || 'Unnamed',
        c.program || 'N/A',
        c.college || 'N/A',
        c.stage1_score ?? c.score ?? c.weightedScore ?? 0,
        c.verified_proofs || 0,
        c.potentialCandidateStatus === 'POTENTIAL_CANDIDATE' || c.eligibilityStatus === 'qualified' ? 'Potential Candidate' : 'Below Review Threshold',
        c.reviewStatus || 'Reviewed',
        decisionLabel,
        c.decision_at || c.confirmed_at || 'N/A'
      ]
    })

    const headerLine = headers.map(h => this.escapeCsvValue(h)).join(',')
    const dataLines = rows.map(r => r.map(cell => this.escapeCsvValue(cell)).join(','))

    const watermarkLine = `# ARAW NG PARANGAL — STAGE 1 STUDENT PORTFOLIO REVIEW REPORT [${categoryName}] — FOR OSAD INTERNAL EVALUATION ONLY (STAGE 2 INTERVIEW CONDUCTED SEPARATELY)`

    return [watermarkLine, headerLine, ...dataLines].join('\n')
  }

  static generateRosterCsv(candidates = [], categoryName = "Dean's Honor Roll", isOfficial = false) {
    return this.generateStage1SummaryReportCsv(candidates, categoryName, isOfficial)
  }

  static triggerCsvDownload(csvString, filename = 'OSAD_Stage1_Candidate_Review_Report.csv') {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export const AwardRosterExportService = Stage1CandidateReportService
export default Stage1CandidateReportService
