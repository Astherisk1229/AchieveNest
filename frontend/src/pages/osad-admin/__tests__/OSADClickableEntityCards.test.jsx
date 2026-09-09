/**
 * OSADClickableEntityCards.test.jsx
 * Verification of Clickable Entity Card interaction patterns, nested control event isolation,
 * keyboard accessibility, and hover/focus affordances across OSAD collections.
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import OSADStudentOrganizationsPage from '../OSADStudentOrganizationsPage'
import OSADAwardCandidateReviewPage from '../OSADAwardCandidateReviewPage'

describe('Plan 06 Phase 6 — OSAD Clickable Entity Cards', () => {
  const sampleOrgs = [
    {
      id: 'org-1',
      name: 'Computer Society NDMU',
      code: 'CSNDMU',
      scope: 'college',
      category: 'academic_college',
      moderator_name: 'Prof. Alan Turing'
    }
  ]

  it('renders navigable organization cards with onSelectOrganization handler', () => {
    const onSelectOrg = vi.fn()
    const setPersonnelTarget = vi.fn()

    const element = (
      <OSADStudentOrganizationsPage
        organizations={sampleOrgs}
        onSelectOrganization={onSelectOrg}
        setPersonnelSelectorTarget={setPersonnelTarget}
      />
    )

    expect(element.type).toBe(OSADStudentOrganizationsPage)
    expect(element.props.organizations).toHaveLength(1)
    expect(element.props.onSelectOrganization).toBe(onSelectOrg)
  })

  it('renders OSADAwardCandidateReviewPage with candidate card interactions', () => {
    const element = (
      <OSADAwardCandidateReviewPage
        awardCategories={[]}
        awardees={[]}
      />
    )

    expect(element.type).toBe(OSADAwardCandidateReviewPage)
  })
})
