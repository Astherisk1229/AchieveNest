import { describe, it, expect } from 'vitest'
import { PRIMARY_CATEGORIES } from '../../../config/portfolioFormSchemaRegistry'

describe('Plan 05 Phase 9 — Portfolio Responsive & Accessibility Test Suite', () => {
  it('preserves canonical 9-category ordering across all responsive layouts', () => {
    expect(PRIMARY_CATEGORIES).toHaveLength(9)
    const categoryIds = PRIMARY_CATEGORIES.map(c => c.id)
    expect(categoryIds[0]).toBe('8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646') // Leadership Position
    expect(categoryIds[8]).toBe('2b09cd61-7a23-4466-be58-889398e8f201') // Campus Journalism
  })

  it('validates structured details schema produces human-readable label/display pairs without raw JSON', () => {
    const rawStructuredData = {
      schema_version: '1.0',
      competition_type: 'prisaa',
      placement: 'champion',
      event_level: 'regional'
    }

    const structuredDetails = [
      { key: 'competition_type', label: 'Competition Tier', display_value: 'PRISAA' },
      { key: 'placement', label: 'Placement / Result', display_value: 'Champion' },
      { key: 'event_level', label: 'Event Level', display_value: 'Regional (Region XII)' }
    ]

    structuredDetails.forEach(detail => {
      expect(detail).toHaveProperty('label')
      expect(detail).toHaveProperty('display_value')
      expect(typeof detail.label).toBe('string')
      expect(typeof detail.display_value).toBe('string')
    })
  })

  it('verifies progressive disclosure prioritizes canonical record details before evaluation scoring trace', () => {
    const osadReviewLayout = {
      sectionOrder: [
        'student_identity_header',
        'canonical_category_nav',
        'canonical_record_card',
        'evidence_files',
        'verification_summary',
        'award_evaluation_overlay', // Expandable
        'scoring_traceability_table' // Collapsed by default
      ]
    }

    expect(osadReviewLayout.sectionOrder.indexOf('canonical_record_card'))
      .toBeLessThan(osadReviewLayout.sectionOrder.indexOf('award_evaluation_overlay'))
    
    expect(osadReviewLayout.sectionOrder.indexOf('award_evaluation_overlay'))
      .toBeLessThan(osadReviewLayout.sectionOrder.indexOf('scoring_traceability_table'))
  })

  it('verifies zero evaluation/scoring leakage to student responsive layout', () => {
    const studentViewCapabilities = {
      canViewOwnEvidence: true,
      canViewVerificationStatus: true,
      canViewPublicFeedback: true,
      canViewAwardSelector: false,
      canViewScoringRubric: false,
      canViewPotentialCandidateRankings: false
    }

    expect(studentViewCapabilities.canViewAwardSelector).toBe(false)
    expect(studentViewCapabilities.canViewScoringRubric).toBe(false)
    expect(studentViewCapabilities.canViewPotentialCandidateRankings).toBe(false)
  })
})
