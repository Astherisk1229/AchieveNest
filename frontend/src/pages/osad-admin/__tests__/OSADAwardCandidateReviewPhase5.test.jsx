import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const page = readFileSync(new URL('../OSADStudentAwardReviewWorkspace.jsx', import.meta.url), 'utf8')
const drawer = readFileSync(new URL('../../../components/osad/AwardEvidenceDrawer.jsx', import.meta.url), 'utf8')
const model = readFileSync(new URL('../../../models/AwardCandidateReviewModel.js', import.meta.url), 'utf8')

describe('Phase 5 candidate review explainability', () => {
  it('uses only server-provided score and criterion values', () => {
    for (const field of ['raw_portfolio_score', 'computable_max_score', 'portfolio_potential_score', 'raw_qualifying_score', 'achieved_points', 'max_points', 'calculation_text']) expect(page).toContain(field)
    expect(page).not.toMatch(/raw_portfolio_score\s*\//)
    expect(page).not.toMatch(/portfolio_potential_score\s*[><=]/)
    expect(model).not.toMatch(/raw_portfolio_score\s*\//)
  })

  it('separates human-only criteria and labels the system score as non-final', () => {
    expect(page).toContain('Human-evaluated criteria')
    expect(page).toContain('It is not the final OSAD award score.')
    expect(page).not.toMatch(/Winner|Finalize Winner|Approve Award|Rank Candidate/)
  })

  it('supports criterion warnings and evidence empty/unavailable states', () => {
    expect(page).toContain('criterion.warnings.map')
    expect(drawer).toContain('No evidence records available for this criterion.')
    expect(drawer).toContain('Supporting file unavailable')
    expect(drawer).toContain('Loading evidence records')
    expect(drawer).toContain("We couldn't load the evidence records.")
  })

  it('implements an accessible responsive evidence drawer with focus return', () => {
    expect(drawer).toContain('role="dialog"')
    expect(drawer).toContain('aria-modal="true"')
    expect(drawer).toContain("event.key === 'Escape'")
    expect(drawer).toContain('returnFocusRef?.current?.focus()')
    expect(drawer).toContain('sm:w-[min(34rem,92vw)]')
  })

  it('provides structured loading and safe retry states', () => {
    expect(page).toContain('ReviewSkeleton')
    expect(page).toContain("We couldn't load this candidate review.")
    expect(page).toContain("Your data hasn't been changed.")
  })
})
