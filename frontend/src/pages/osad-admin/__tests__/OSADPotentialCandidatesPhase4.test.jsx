import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const view = readFileSync(new URL('../OSADPotentialCandidatesView.jsx', import.meta.url), 'utf8')
const model = readFileSync(new URL('../../../models/AwardPotentialCandidatesModel.js', import.meta.url), 'utf8')
const route = readFileSync(new URL('../../../App.jsx', import.meta.url), 'utf8')

describe('Phase 4 potential candidate worklist', () => {
  it('uses stable candidate review navigation and no leaderboard presentation', () => {
    expect(route).toContain('/osad/awards/:awardId/candidates/:studentId/review')
    expect(view).not.toMatch(/\bTop (3|5)\b|\bpodium\b/i)
    expect(view).not.toMatch(/rank number|candidate\.rank/i)
  })

  it('renders server values and never performs score arithmetic', () => {
    expect(view).toContain('candidate.raw_portfolio_score')
    expect(view).toContain('candidate.computable_max_score')
    expect(view).toContain('candidate.portfolio_potential_score')
    expect(view).not.toMatch(/raw_portfolio_score\s*\//)
    expect(view).not.toMatch(/portfolio_potential_score\s*[><=]/)
    expect(model).not.toMatch(/raw_portfolio_score\s*\//)
  })

  it('includes authority, warning, loading, error, empty, and search-empty states', () => {
    expect(view).toContain('Candidate generation unavailable')
    expect(view).toContain('Score requires attention')
    expect(view).toContain('CandidateSkeleton')
    expect(view).toContain("We couldn't load potential candidates.")
    expect(view).toContain('No potential candidates yet')
    expect(view).toContain('No candidates found for')
  })

  it('uses semantic responsive worklists and accessible navigation actions', () => {
    expect(view).toContain('<table')
    expect(view).toContain('scope="row"')
    expect(view).toContain('md:hidden')
    expect(view).toContain('aria-label={`Review')
    expect(view).toContain("event.key === 'Enter' || event.key === ' '")
    expect(view).toContain('focus-visible:ring-2')
  })
})
