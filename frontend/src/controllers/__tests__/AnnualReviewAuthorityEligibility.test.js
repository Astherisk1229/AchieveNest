import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../../..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')
const imports = read('backend/app/Services/AnnualReviewImportService.php')
const roster = read('backend/app/Services/AuthorityRankingRosterService.php')
const eligibility = read('backend/app/Services/PersonnelEligibilityService.php')
const parser = read('backend/app/Services/AnnualReviewWorkbookParser.php')
const page = read('frontend/src/pages/dean/DeanAnnualReviewEligibilityPage.jsx')

describe('Annual Review authority and eligibility', () => {
  it('authorizes Dean, Department Head, or HR only through the central authority resolver', () => {
    expect(imports).toContain('OrganizationalAuthorityResolver')
    expect(imports).toContain("in_array('department_head',$roles,true)")
    expect(imports).toContain('$this->rosterService->list')
    expect(roster).toContain('resolveResponsibleAuthority')
    expect(roster).toContain('actorMayAct')
    expect(roster).toContain("return ['DEPARTMENT_HEAD', 'department'")
    expect(roster).toContain("return ['HR', 'institution', null]")
  })

  it('denies cross-scope imports and confirmation', () => {
    expect(imports).toContain('Expected personnel is outside authorized scope.')
    expect(imports).toContain('assigned to your authority for this ranking track')
    expect(imports).toContain('outside authorized authority or ranking-track scope')
  })

  it('scopes candidates and import responses to the selected ranking track', () => {
    expect(imports).toContain("$period['personnel_group']")
    expect(imports).toContain("'ranking_cycle_id'=>$period['ranking_cycle_id']")
    expect(imports).toContain("'ranking_track_id'=>$period['id']")
  })

  it('preserves workbook parsing and eligibility prerequisite semantics without points', () => {
    expect(parser).toContain("SHEET = 'SUMMARY 1st & 2nd'")
    expect(eligibility).toContain("$annualStatus==='passed'")
    expect(eligibility).toContain("'annual_review_requirement'")
    expect(eligibility).not.toMatch(/annual.*(?:points|score)|(?:points|score).*annual/i)
  })

  it('accurately explains that inspection persists a preview before confirmation', () => {
    expect(page).toContain('Inspection stores a secure preview')
    expect(page).toContain('Preview stored securely; confirmation makes these ratings authoritative for eligibility.')
    expect(page).not.toContain('Nothing is saved until confirmation.')
    expect(page).not.toContain('Nothing has been saved yet.')
  })
})
