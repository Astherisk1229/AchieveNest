import { describe, it, expect } from 'vitest'
import { AwardRosterExportService } from '../AwardRosterExportService'

describe('AwardRosterExportService', () => {
  it('escapes CSV values and protects against formula injection (=, +, -, @)', () => {
    expect(AwardRosterExportService.escapeCsvValue('=SUM(A1:A10)')).toBe('"\'=SUM(A1:A10)"')
    expect(AwardRosterExportService.escapeCsvValue('+12345')).toBe('"\'+12345"')
    expect(AwardRosterExportService.escapeCsvValue('-500')).toBe('"\'-500"')
    expect(AwardRosterExportService.escapeCsvValue('@ADMIN')).toBe('"\'@ADMIN"')
    expect(AwardRosterExportService.escapeCsvValue('Maria Santos')).toBe('"Maria Santos"')
  })

  it('generates draft CSV with watermark header', () => {
    const candidates = [
      { globalRank: 1, student_id: '2024-001', student_name: 'Maria Santos', program: 'BSCS', college: 'CEAC', score: 95 }
    ]

    const csv = AwardRosterExportService.generateRosterCsv(candidates, "Dean's List", false)
    expect(csv).toContain('DRAFT ROSTER')
    expect(csv).toContain('Maria Santos')
    expect(csv).toContain('BSCS')
  })

  it('generates official CSV with official watermark header', () => {
    const candidates = [
      { globalRank: 1, student_id: '2024-001', student_name: 'Maria Santos', program: 'BSCS', college: 'CEAC', score: 95 }
    ]

    const csv = AwardRosterExportService.generateRosterCsv(candidates, "Dean's List", true)
    expect(csv).toContain('OFFICIAL PUBLISHED RECIPIENT ROSTER')
  })
})
