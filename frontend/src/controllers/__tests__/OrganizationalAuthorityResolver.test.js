import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../../..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')
const resolver = read('backend/app/Services/OrganizationalAuthorityResolver.php')
const adapter = read('backend/app/Services/ReviewerResolverService.php')
const annualReview = read('backend/app/Services/DeanAnnualReviewService.php')

describe('central organizational authority resolution', () => {
  it('resolves Faculty through exactly one active Dean of the assigned College', () => {
    expect(resolver).toContain("personnel_group'] ?? '')) === 'faculty'")
    expect(resolver).toContain('return $this->resolveDean')
    expect(resolver).toContain('AUTHORITY_MISSING_DEAN')
    expect(resolver).toContain('AUTHORITY_AMBIGUOUS_DEAN')
  })

  it('resolves an outside-College Department through exactly one Department Head', () => {
    expect(resolver).toContain('department_head_assignments')
    expect(resolver).toContain('AUTHORITY_MISSING_DEPARTMENT_HEAD')
    expect(resolver).toContain('AUTHORITY_AMBIGUOUS_DEPARTMENT_HEAD')
    expect(resolver).toContain("result('DEPARTMENT_HEAD'")
  })

  it('uses HR for the explicit Non-Teaching Faculty route', () => {
    expect(resolver).toContain('PersonnelReviewerRoutingRegistry::resolveReviewerRoute')
    expect(resolver).toContain("=== 'hr_staff'")
    expect(resolver).toContain("=== 'non_teaching_faculty'")
    expect(resolver).toContain("result('HR'")
  })

  it('surfaces missing authority and denies self or cross-scope action', () => {
    expect(resolver).toContain('AUTHORITY_UNRESOLVED')
    expect(resolver).toContain('AUTHORITY_SELF_REVIEW_BLOCKED')
    expect(resolver).toContain("$actorProfileId === ($authority['authority_profile_id'] ?? '')")
  })

  it('routes initial evaluation and Annual Review through the same resolver', () => {
    expect(adapter).toContain('OrganizationalAuthorityResolver')
    expect(annualReview).toContain('resolveResponsibleAuthority')
    expect(annualReview).not.toContain("personnel_group']??'')!=='faculty'")
  })
})
