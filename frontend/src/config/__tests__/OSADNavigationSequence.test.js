/**
 * OSADNavigationSequence.test.js
 * Verification of authoritative sequence rules and workflow families for OSAD navigation.
 */

import { describe, it, expect } from 'vitest'
import { getAuthorizedNavigationForSession } from '../personnelRoleNavigation'
import { CANONICAL_ROLES, CANONICAL_ACCOUNT_TYPES } from '../../utils/roleContext'

describe('Plan 06 Phase 3 — OSAD Navigation Sequence Rules', () => {
  const osadSession = {
    account_type: CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN,
    active_role_context: CANONICAL_ROLES.OSAD_STAFF,
    assigned_roles: [CANONICAL_ROLES.OSAD_STAFF]
  }

  it('renders exactly 5 authorized items in authoritative sequence', () => {
    const nav = getAuthorizedNavigationForSession(osadSession)
    expect(nav).toHaveLength(5)

    const expectedOrder = [
      // 1. Overview
      'osad-dashboard',
      // 2. Student & Institutional Setup
      'osad-student-management',
      'osad-password-resets',
      // 3. Portfolio & Evaluation
      'osad-award-categories',
      'osad-award-candidate-review',
    ]

    expect(nav.map(item => item.id)).toEqual(expectedOrder)
  })

  it('places Overview as the very first navigation item', () => {
    const nav = getAuthorizedNavigationForSession(osadSession)
    expect(nav[0].id).toBe('osad-dashboard')
    expect(nav[0].workflowFamily).toBe('overview')
  })

  it('places Setup family before Evaluation family', () => {
    const nav = getAuthorizedNavigationForSession(osadSession)
    const setupIndex = nav.findIndex(i => i.workflowFamily === 'setup')
    const evalIndex = nav.findIndex(i => i.workflowFamily === 'evaluation')
    expect(setupIndex).toBeLessThan(evalIndex)
  })

  it('places Student Management before Award Candidates', () => {
    const nav = getAuthorizedNavigationForSession(osadSession)
    const accountsIndex = nav.findIndex(i => i.id === 'osad-student-management')
    const reviewIndex = nav.findIndex(i => i.id === 'osad-award-candidate-review')
    expect(accountsIndex).toBeLessThan(reviewIndex)
  })

  it('places Awards & Scoring Criteria before Award Candidates', () => {
    const nav = getAuthorizedNavigationForSession(osadSession)
    const criteriaIndex = nav.findIndex(i => i.id === 'osad-award-categories')
    const reviewIndex = nav.findIndex(i => i.id === 'osad-award-candidate-review')
    expect(criteriaIndex).toBeLessThan(reviewIndex)
  })

})
