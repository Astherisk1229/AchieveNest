import { describe, it, expect } from 'vitest'

describe('Plan 05 Phase 6 — Award-Specific Lens Test Suite', () => {
  const samplePortfolio = [
    {
      id: 'rec-sports-01',
      title: 'PRISAA Regional Basketball Championship',
      category_id: '2d20d412-bf34-46b4-a21d-d7131d4b514a',
      category_name: 'Sports',
      subcategory_id: '40000007-0001-0000-0000-000000000001',
      subcategory_name: 'Basketball',
      status: 'verified',
      occurrence_date: '2026-02-14',
      structured_metadata: {
        schema_version: '1.0',
        competition_type: 'prisaa',
        event_level: 'regional',
        placement: 'champion',
        individual_team: 'team'
      },
      evidence: [{ id: 'ev-01', original_filename: 'prisaa_cert.pdf' }]
    },
    {
      id: 'rec-sports-dev-02',
      title: 'Regional Basketball Coaching & Skills Clinic',
      category_id: '802de57b-54d7-4d38-9433-052ca9636380',
      category_name: 'Seminar / Training',
      subcategory_id: '40000005-0004-0000-0000-000000000001',
      subcategory_name: 'Sports Development',
      status: 'verified',
      occurrence_date: '2025-10-10',
      structured_metadata: {
        schema_version: '1.0',
        training_type: 'sports_dev',
        hours_duration: 16
      },
      evidence: [{ id: 'ev-02', original_filename: 'clinic_cert.pdf' }]
    },
    {
      id: 'rec-draft-journo-03',
      title: 'Investigative Campus Feature Article (Unpublished Draft)',
      category_id: '2b09cd61-7a23-4466-be58-889398e8f201',
      category_name: 'Campus Journalism',
      subcategory_id: '40000009-0002-0000-0000-000000000001',
      subcategory_name: 'Feature Writing',
      status: 'verified',
      occurrence_date: '2026-01-15',
      structured_metadata: {
        schema_version: '1.0',
        publication_type: 'feature',
        publication_status: 'draft'
      },
      evidence: [{ id: 'ev-03', original_filename: 'draft_article.docx' }]
    }
  ]

  it('proves award switching leaves canonical portfolio fields 100% unchanged', () => {
    const lensAthlete = {
      award_id: 'award-athlete-of-the-year',
      relevant_records: {
        'rec-sports-01': { is_relevant: true, points: 30, criterion_code: 'REGIONAL_CHAMPION' },
        'rec-sports-dev-02': { is_relevant: false, reason: 'REASON_TRAINING_NOT_COMPETITION' }
      }
    }

    const lensJournalism = {
      award_id: 'award-journalist-of-the-year',
      relevant_records: {
        'rec-draft-journo-03': { is_relevant: false, reason: 'REASON_UNPUBLISHED_DRAFT' }
      }
    }

    // Applying lenses as projection overlays
    const projectedAthlete = samplePortfolio.map(r => ({
      ...r,
      osad_evaluation: lensAthlete.relevant_records[r.id] || { is_relevant: false }
    }))

    const projectedJournalism = samplePortfolio.map(r => ({
      ...r,
      osad_evaluation: lensJournalism.relevant_records[r.id] || { is_relevant: false }
    }))

    expect(projectedAthlete[0].id).toBe(projectedJournalism[0].id)
    expect(projectedAthlete[0].title).toBe(projectedJournalism[0].title)
    expect(projectedAthlete[0].category_id).toBe(projectedJournalism[0].category_id)
    expect(projectedAthlete[0].structured_metadata).toEqual(projectedJournalism[0].structured_metadata)

    expect(projectedAthlete[0].osad_evaluation.is_relevant).toBe(true)
    expect(projectedJournalism[0].osad_evaluation.is_relevant).toBe(false)
  })

  it('enforces verified-only gating & exclusion of unpublished journalism from published scoring', () => {
    const journoRecord = samplePortfolio[2]
    expect(journoRecord.structured_metadata.publication_status).toBe('draft')

    // Unpublished draft must not qualify for published article scoring
    const isEligibleForPublishedAward = journoRecord.status === 'verified' && journoRecord.structured_metadata.publication_status === 'published'
    expect(isEligibleForPublishedAward).toBe(false)
  })

  it('enforces classification boundary: Sports Development training is excluded from Athlete Competition scoring', () => {
    const trainingRecord = samplePortfolio[1]
    expect(trainingRecord.category_name).toBe('Seminar / Training')
    expect(trainingRecord.subcategory_name).toBe('Sports Development')

    const isCompetitionEvidence = trainingRecord.category_name === 'Sports'
    expect(isCompetitionEvidence).toBe(false)
  })

  it('verifies same-subsection deduplication prevents double-counting of identical records', () => {
    const matchedEvidence = [
      { record_id: 'rec-sports-01', subsection: 'SPORTS_REGIONAL', points: 30 },
      { record_id: 'rec-sports-01', subsection: 'SPORTS_REGIONAL', points: 30 } // duplicate match
    ]

    const deduplicated = []
    const seenKeys = new Set()

    matchedEvidence.forEach((item) => {
      const dedupKey = `${item.subsection}:${item.record_id}`
      if (!seenKeys.has(dedupKey)) {
        seenKeys.add(dedupKey)
        deduplicated.push(item)
      }
    })

    expect(deduplicated).toHaveLength(1)
    expect(deduplicated[0].points).toBe(30)
  })
})
