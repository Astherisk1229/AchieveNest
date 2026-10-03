import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { filterAwardCandidates } from '../OSADAwardCandidateReviewPage'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('Potential Candidates live in the Award Candidates module', () => {
  it('redirects the per-award candidate list into the module, filtered by award', () => {
    const route = read('../OSADAwardRoutePage.jsx')
    expect(route).toContain("view === 'candidates'")
    expect(route).toContain('<Navigate to={`/osad/candidates?award=')
    expect(route).not.toContain('<OSADPotentialCandidatesView')
  })

  it('reads the award filter from the URL and offers print/export', () => {
    const page = read('../OSADAwardCandidateReviewPage.jsx')
    expect(page).toContain("searchParams.get('award')")
    expect(page).toContain('title="Award Candidates"')
    expect(page).toContain('Print / Export PDF')
  })

  it('filters potential candidates for one award', () => {
    const rows = [
      { candidate_id: '1', award_definition_id: 'a', eligibility_source: 'portfolio_evaluation', is_candidate: true },
      { candidate_id: '2', award_definition_id: 'b', eligibility_source: 'portfolio_evaluation', is_candidate: true },
      { candidate_id: '3', award_definition_id: 'a', eligibility_source: 'portfolio_evaluation', is_candidate: false },
    ]
    const visible = filterAwardCandidates(rows, { search: '', award: 'a', college: 'all', status: 'potential' })
    expect(visible.map(row => row.candidate_id)).toEqual(['1'])
  })
})
