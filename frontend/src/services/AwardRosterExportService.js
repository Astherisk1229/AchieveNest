/**
 * AwardRosterExportService.js
 * Service for generating formatted CSV exports and print data for OSAD Award Roster.
 * Includes CSV formula injection escaping (=, +, -, @) and draft watermark flags.
 */

export class AwardRosterExportService {
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

  static generateRosterCsv(candidates = [], categoryName = "Dean's Honor Roll", isOfficial = false) {
    const headers = [
      'Global Rank',
      'Student ID',
      'Student Name',
      'Degree Program',
      'College',
      'Composite Score',
      'Verified Records Count',
      'Qualification Status',
      'Review Status',
      'Confirmation Status'
    ]

    const rows = candidates.map((c, idx) => [
      c.globalRank || (idx + 1),
      c.student_id || 'N/A',
      c.student_name || c.name || 'Unnamed',
      c.program || 'N/A',
      c.college || 'N/A',
      c.score || c.weightedScore || 0,
      c.verified_proofs || 0,
      c.eligibilityStatus || 'qualified',
      c.reviewStatus || 'reviewed',
      c.confirmationStatus || (c.confirmed ? 'confirmed' : 'unconfirmed')
    ])

    const headerLine = headers.map(h => this.escapeCsvValue(h)).join(',')
    const dataLines = rows.map(r => r.map(cell => this.escapeCsvValue(cell)).join(','))

    const watermarkLine = isOfficial 
      ? '# OFFICIAL PUBLISHED RECIPIENT ROSTER — NDMU OFFICE OF STUDENT AFFAIRS & SERVICES'
      : '# DRAFT ROSTER — FOR OSAD INTERNAL REVIEW ONLY — NOT FOR OFFICIAL PUBLICATION'

    return [watermarkLine, headerLine, ...dataLines].join('\n')
  }

  static triggerCsvDownload(csvString, filename = 'OSAD_Award_Roster.csv') {
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

export default AwardRosterExportService
