import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Personnel completed evaluation result release UI', () => {
  const gallery = fs.readFileSync(path.resolve(__dirname, '../PersonnelPortfolioGallery.jsx'), 'utf8')
  const modal = fs.readFileSync(path.resolve(__dirname, '../PersonnelEvaluationResultModal.jsx'), 'utf8')
  const service = fs.readFileSync(path.resolve(__dirname, '../../../services/personnelEvaluationResultService.js'), 'utf8')

  it('shows the result action only inside the finalized branch', () => {
    expect(gallery).toMatch(/BookOpen,\s*Award\s*}\s*from 'lucide-react'/)
    expect(gallery).toContain('{isFinalized && (')
    expect(gallery).toContain('View Evaluation Result')
    expect(gallery).not.toContain('Export PDF / Certificate')
  })

  it('renders classification-correct summaries without Faculty rank sections', () => {
    expect(modal).toContain("result?.personnel?.group === 'FACULTY'")
    expect(modal).toContain('Non-Teaching Faculty')
    expect(modal).not.toContain('Rank Applied For')
    expect(modal).not.toContain('Recommended Faculty Rank')
  })

  it('uses the owner-scoped completed result and printable HTML endpoints', () => {
    expect(service).toContain('/personnel/evaluations/${evaluationId}/result')
    expect(service).toContain('/result/print')
  })
})
