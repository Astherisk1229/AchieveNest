import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../../..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')

describe('authority-neutral Ranking Period track roster', () => {
  it('publishes one actor-derived roster endpoint without client scope parameters', () => {
    const routes = read('backend/app/Config/Routes.php')
    expect(routes).toContain("reviewer/ranking-cycles/(:segment)/tracks/(:segment)/personnel")
    const controller = read('backend/app/Controllers/Api/ReviewerRankingRosterController.php')
    expect(controller).toContain('resolveActor')
    expect(controller).not.toMatch(/getGet\(['\"](?:department_id|college_id|dean_id|department_head_id)/)
  })

  it('derives Dean and outside-College Department Head scope from active assignments', () => {
    const service = read('backend/app/Services/AuthorityRankingRosterService.php')
    expect(service).toContain("singleAssignment('dean_assignments', 'college_id'")
    expect(service).toContain("singleAssignment('department_head_assignments', 'department_id'")
    expect(service).toContain("where('au.college_id', null)")
    expect(service).toContain('AUTHORITY_AMBIGUOUS_')
  })

  it('filters candidates by track and proves every returned row with the resolver', () => {
    const service = read('backend/app/Services/AuthorityRankingRosterService.php')
    expect(service).toContain("where('pp.personnel_group', $group)")
    expect(service).toContain('resolveResponsibleAuthority')
    expect(service).toContain('actorMayAct')
    expect(service).toContain("where('p.id !=', $actorId)")
  })

  it('allows HR rows only when the central resolver identifies explicit HR authority', () => {
    const service = read('backend/app/Services/AuthorityRankingRosterService.php')
    expect(service).toContain("return ['HR', 'institution', null]")
    // HR may only manage rows the central resolver assigns to HR; other rows are read-only.
    expect(service).toContain("&& ($authority['authority_type'] ?? '') === $authorityType")
    expect(service).toContain('&& $this->authorityResolver->actorMayAct($authority, $actorId)')
    expect(service).toContain("'can_manage'=>$canManage")
  })

  it('limits the read-only institution-wide view to HR on the Annual Reviews roster only', () => {
    const service = read('backend/app/Services/AuthorityRankingRosterService.php')
    expect(service).toContain("$readOnlyView = $includeReadOnly && $authorityType === 'HR'")
    expect(service).toContain('if (! $canManage && ! $readOnlyView) continue;')
    expect(read('backend/app/Controllers/Api/ReviewerRankingRosterController.php')).toContain('$this->roster->list($actor, $cycleId, $trackKey, true)')
    // Authorization callers keep the managed-only default.
    expect(read('backend/app/Services/AnnualReviewImportService.php')).toContain("$this->rosterService->list($actor,$cycleId,(string)$period['personnel_group'])")
    expect(read('frontend/src/pages/dean/DeanAnnualReviewEligibilityPage.jsx')).toContain('item.can_manage === false ? <ReadOnlyActions item={item} />')
  })

  it('reuses the same roster for Annual Review imports and the shared page', () => {
    expect(read('backend/app/Services/AnnualReviewImportService.php')).toContain('$this->rosterService->list')
    expect(read('frontend/src/services/deanAnnualReviewService.js')).toContain('fetchReviewerTrackRoster')
    expect(read('frontend/src/pages/dean/DeanAnnualReviewEligibilityPage.jsx')).toContain('fetchReviewerTrackRoster(cycleId, trackKey)')
  })
})
