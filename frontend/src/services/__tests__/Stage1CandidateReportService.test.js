import { describe, it, expect } from 'vitest'
import { Stage1CandidateReportService } from '../Stage1CandidateReportService'

describe('Stage1CandidateReportService', () => {
  it('escapes CSV values and protects against formula injection (=, +, -, @)', () => {
    expect(Stage1CandidateReportService.escapeCsvValue('=SUM(A1:A10)')).toBe('"\'=SUM(A1:A10)"')
    expect(Stage1CandidateReportService.escapeCsvValue('+12345')).toBe('"\'+12345"')
    expect(Stage1CandidateReportService.escapeCsvValue('-500')).toBe('"\'-500"')
    expect(Stage1CandidateReportService.escapeCsvValue('@ADMIN')).toBe('"\'@ADMIN"')
    expect(Stage1CandidateReportService.escapeCsvValue('Maria Santos')).toBe('"Maria Santos"')
  })

  it('generates Stage 1 Summary Report CSV with proper headers and watermark', () => {
    const candidates = [
      { stage1Rank: 1, studentId: '2024-001', student_name: 'Maria Santos', program: 'BSCS', college: 'CEAC', stage1_score: 95, osadDecision: 'ADVANCED_TO_INTERVIEW' }
    ]

    const csv = Stage1CandidateReportService.generateStage1SummaryReportCsv(candidates, "Dean's List", false)
    expect(csv).toContain('STAGE 1 STUDENT PORTFOLIO REVIEW REPORT')
    expect(csv).toContain('Maria Santos')
    expect(csv).toContain('BSCS')
    expect(csv).toContain('Advanced to Interview')
  })
})
