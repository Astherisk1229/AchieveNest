import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { NAVIGATION_CATALOG } from '../../../config/navigationCatalog'
import { isNavigationItemActive } from '../../../config/personnelRoleNavigation'
import { filterAwardCandidates } from '../OSADAwardCandidateReviewPage'

const source = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')

describe('OSAD Award Candidate Review route integrity', () => {
  const candidateNav = NAVIGATION_CATALOG.find((item) => item.id === 'osad-award-candidate-review')
  const scoringNav = NAVIGATION_CATALOG.find((item) => item.id === 'osad-award-categories')

  it('keeps candidate review and scoring criteria on separate routes and active states', () => {
    expect(candidateNav.path).toBe('/osad/candidates')
    expect(scoringNav.path).toBe('/osad/awards')
    expect(isNavigationItemActive(candidateNav, '/osad/candidates')).toBe(true)
    expect(isNavigationItemActive(scoringNav, '/osad/candidates')).toBe(false)
    expect(isNavigationItemActive(scoringNav, '/osad/awards')).toBe(true)
    expect(isNavigationItemActive(candidateNav, '/osad/awards')).toBe(false)
  })

  it('registers the protected candidate workspace and preserves legacy aliases', () => {
    const app = source('../../../App.jsx')
    const dashboard = source('../OSADDashboardPage.jsx')
    expect(app).toContain('path="/osad/candidates" element={<OSADAwardCandidateReviewPage />}')
    expect(app.indexOf('path="/osad/candidates"')).toBeGreaterThan(app.indexOf("requiredRoles={['osad_staff']}"))
    expect(dashboard).toContain('<Navigate to="/osad/candidates" replace />')
    expect(dashboard).not.toMatch(/activeTab === 'candidate-review'[\s\S]{0,150}to="\/osad\/awards"/)
  })

  it('filters only authoritative candidate fields without fabricating fallback rows', () => {
    const rows = [
      { candidate_id: 'a', student_name: 'Ada Lovelace', student_id_number: '2026001', award_definition_id: 'award-1', college_id: 'college-1', eligibility_source: 'portfolio_evaluation', is_candidate: true },
      { candidate_id: 'b', student_name: 'Grace Hopper', student_id_number: '2026002', award_definition_id: 'award-2', college_id: 'college-2', eligibility_source: 'dean_nomination', is_candidate: true }
    ]
    expect(filterAwardCandidates([], { search: '', award: 'all', college: 'all', status: 'all' })).toEqual([])
    expect(filterAwardCandidates(rows, { search: '2026002', award: 'all', college: 'all', status: 'dean_nomination' })).toEqual([rows[1]])
  })

  it('uses the aggregate API and existing detailed review route with explicit empty and error states', () => {
    const page = source('../OSADAwardCandidateReviewPage.jsx')
    expect(page).toContain('fetchCandidates()')
    expect(page).toContain('No award candidates are currently available for review.')
    expect(page).toContain("We couldn't load award candidates.")
    expect(page).toContain('/osad/awards/${candidate.award_definition_id}/candidates/${candidate.student_profile_id}/review')
  })
})
