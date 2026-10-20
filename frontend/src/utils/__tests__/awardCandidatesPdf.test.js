import { describe, expect, it } from 'vitest'
import { buildAwardCandidatesPdf } from '../awardCandidatesPdf'

describe('award candidate PDF export', () => {
  it('creates a downloadable PDF containing the filtered candidate details', async () => {
    const pdf = buildAwardCandidatesPdf([{
      student_name: 'Alex Reyes',
      student_id_number: '2026450580',
      program_code: 'BSCS',
      college_code: 'CEAC',
      award_name: 'Leadership Award',
      is_candidate: false,
      potential_score: 61,
      raw_portfolio_score: 56,
      computable_max_score: 70,
    }], { awardLabel: 'Leadership Award', searchSummary: 'All students · All colleges' })
    const contents = await pdf.text()

    expect(pdf.type).toBe('application/pdf')
    expect(contents).toMatch(/^%PDF-1\.4/)
    expect(contents).toContain('<416C6578205265796573>')
    expect(contents).toContain(`<${Buffer.from('Potential Awardee for Leadership Award').toString('hex').toUpperCase()}>`)
    expect(contents).toContain(Buffer.from('Score: 56 / 70 points (61%)').toString('hex').toUpperCase())
    expect(contents).toContain('/MediaBox [0 0 595 842]')
    expect(contents).toContain('2032303236343530353830')
    expect(contents).toContain('/Type /Page')
    expect(contents).toContain('%%EOF')
  })
})
