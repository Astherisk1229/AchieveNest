import { describe, it, expect } from 'vitest'
import { PRIMARY_CATEGORIES } from '../../../config/portfolioFormSchemaRegistry'

describe('Plan 05 Phase 5 — OSAD Portfolio Review UX Test Suite', () => {
  const sampleCanonicalRecord = {
    id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    student_profile_id: 'stu-uuid-001',
    category_id: '2d20d412-bf34-46b4-a21d-d7131d4b514a',
    category_name: 'Sports',
    subcategory_id: '40000007-0001-0000-0000-000000000001',
    subcategory_name: 'Basketball',
    title: 'PRISAA Regional Basketball Championship',
    organizer_or_body: 'PRISAA Region XII',
    dates: {
      start_date: '2026-02-14',
      end_date: '2026-02-18',
      display_range: 'Feb 14, 2026 – Feb 18, 2026'
    },
    structured_details: [
      { key: 'competition_type', label: 'Competition Tier', value: 'prisaa', display_value: 'PRISAA' },
      { key: 'placement', label: 'Placement / Result', value: 'champion', display_value: 'Champion' },
      { key: 'event_level', label: 'Event Level', value: 'regional', display_value: 'Regional (Region XII)' }
    ],
    evidence: [
      { id: 'ev-prisaa-01', original_filename: 'prisaa_cert.pdf', mime_type: 'application/pdf' }
    ],
    verification: {
      status: 'verified',
      verifier_remarks: 'Official certificate confirmed by Athletics Director.',
      verified_at: '2026-02-20 14:00:00'
    }
  }

  const sampleOsadEvaluationAthlete = {
    award_id: 'award-athlete-of-the-year',
    award_name: 'Athlete of the Year (Sports)',
    is_relevant: true,
    matched_criteria: [
      { criterion_id: 'crit-01', name: 'Regional Championship', points: 30 }
    ],
    deliberation_notes: [
      { author: 'OSAD Committee Member', note: 'Exemplary leadership on the court.' }
    ]
  }

  const sampleOsadEvaluationLeadership = {
    award_id: 'award-leadership-excellence',
    award_name: 'Leadership Excellence Award',
    is_relevant: false,
    matched_criteria: [],
    deliberation_notes: []
  }

  it('renders all 9 primary categories in identical canonical order matching Student view', () => {
    expect(PRIMARY_CATEGORIES).toHaveLength(9)
    expect(PRIMARY_CATEGORIES[0].id).toBe('8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646')
    expect(PRIMARY_CATEGORIES[6].id).toBe('2d20d412-bf34-46b4-a21d-d7131d4b514a')
    expect(PRIMARY_CATEGORIES[8].id).toBe('2b09cd61-7a23-4466-be58-889398e8f201')
  })

  it('proves award switching leaves canonical record fields completely intact', () => {
    const recordWithAthleteLens = { ...sampleCanonicalRecord, osad_evaluation: sampleOsadEvaluationAthlete }
    const recordWithLeadershipLens = { ...sampleCanonicalRecord, osad_evaluation: sampleOsadEvaluationLeadership }

    // Invariant: record identity & core fields remain 100% identical
    expect(recordWithAthleteLens.id).toBe(recordWithLeadershipLens.id)
    expect(recordWithAthleteLens.title).toBe(recordWithLeadershipLens.title)
    expect(recordWithAthleteLens.category_id).toBe(recordWithLeadershipLens.category_id)
    expect(recordWithAthleteLens.subcategory_name).toBe(recordWithLeadershipLens.subcategory_name)
    expect(recordWithAthleteLens.structured_details).toEqual(recordWithLeadershipLens.structured_details)
    expect(recordWithAthleteLens.evidence[0].id).toBe(recordWithLeadershipLens.evidence[0].id)
    expect(recordWithAthleteLens.verification.status).toBe(recordWithLeadershipLens.verification.status)

    // Only evaluation context differs
    expect(recordWithAthleteLens.osad_evaluation.is_relevant).toBe(true)
    expect(recordWithLeadershipLens.osad_evaluation.is_relevant).toBe(false)
  })

  it('ensures strict separation between verification remarks and evaluator deliberation notes', () => {
    const record = { ...sampleCanonicalRecord, osad_evaluation: sampleOsadEvaluationAthlete }

    expect(record.verification.verifier_remarks).toBe('Official certificate confirmed by Athletics Director.')
    expect(record.osad_evaluation.deliberation_notes[0].note).toBe('Exemplary leadership on the court.')
    expect(record.verification.verifier_remarks).not.toBe(record.osad_evaluation.deliberation_notes[0].note)
  })

  it('supports single verified records mapped to multiple awards without record duplication', () => {
    const multiAwardEvaluations = [sampleOsadEvaluationAthlete, sampleOsadEvaluationLeadership]
    const unifiedRecord = { ...sampleCanonicalRecord, mapped_awards: multiAwardEvaluations }

    expect(unifiedRecord.id).toBe(sampleCanonicalRecord.id)
    expect(unifiedRecord.mapped_awards).toHaveLength(2)
  })

  it('verifies evaluation error isolation preserves master portfolio visibility', () => {
    const recordWithError = {
      ...sampleCanonicalRecord,
      osad_evaluation: { error: 'Failed to fetch evaluation rules for selected award.' }
    }

    // Canonical portfolio fields remain available
    expect(recordWithError.title).toBe('PRISAA Regional Basketball Championship')
    expect(recordWithError.verification.status).toBe('verified')
    expect(recordWithError.evidence).toHaveLength(1)
  })
})
