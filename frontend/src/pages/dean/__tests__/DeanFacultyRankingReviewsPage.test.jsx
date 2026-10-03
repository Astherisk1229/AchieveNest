import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Dean Faculty ranking review projection', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../DeanFacultyRankingReviewsPage.jsx'), 'utf8')

  it('presents the HR cycle and keeps workflow states separate', () => {
    for (const contract of ['data.ranking_cycle?.display_name', 'lifecycle_status?.label', 'Annual Review', 'Eligibility', 'Dean Review', 'annual_review_status', 'ranking_eligibility_status', 'dean_review_status']) {
      expect(source).toContain(contract)
    }
  })

  it('explains that Needs Review is a derived queue', () => {
    expect(source).toContain('Needs Review is derived from the active HR Faculty ranking period')
  })
})
