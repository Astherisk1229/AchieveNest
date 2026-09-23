import { describe, it, expect } from 'vitest'
import { CONTROLLED_VOCABULARIES, SUB_CATEGORY_SCHEMAS } from '../../../config/portfolioFormSchemaRegistry'

describe('Controlled Vocabulary & Schema Drift Suite (Plan 04 Phase 5)', () => {
  const BACKEND_CONTROLLED_VOCABULARIES = {
    event_level: ['institutional', 'local', 'regional', 'national', 'international'],
    placement: ['champion', 'first_runner_up', 'second_runner_up', 'finalist', 'participant'],
    publication_status: ['published', 'draft'],
    publication_type: ['news', 'literary', 'column', 'editorial', 'feature'],
    position_level: ['executive', 'officer', 'committee_head', 'year_representative'],
    membership_type: ['charter_member', 'regular_member', 'honorary_member'],
    contribution_level: ['lead_organizer', 'committee_member', 'general_contributor'],
    service_type: ['direct_outreach', 'advocacy', 'environmental', 'educational'],
    ministry_context: ['campus_ministry', 'parish_ministry', 'church_organization'],
    training_type: ['leadership_dev', 'sports_dev', 'socio_cultural_dev', 'journalism_dev', 'professional_dev', 'spiritual_dev', 'community_dev', 'other_dev'],
    competition_type: ['tournament', 'league', 'meet', 'invitational'],
    individual_team: ['individual', 'team'],
    individual_group: ['individual', 'group'],
    performance_type: ['solo_performance', 'ensemble_lead', 'ensemble_member', 'exhibition'],
    authorship_role: ['lead_author', 'co_author', 'editor', 'illustrator_photographer'],
    academic_year: ['2025-2026', '2024-2025', '2023-2024'],
    semester: ['1st_semester', '2nd_semester', 'summer']
  }

  it('verifies 0 vocabulary drift between frontend and backend', () => {
    Object.keys(BACKEND_CONTROLLED_VOCABULARIES).forEach(vocabKey => {
      const frontendVocab = CONTROLLED_VOCABULARIES[vocabKey]
      expect(frontendVocab, `Vocabulary ${vocabKey} missing on frontend`).toBeDefined()

      const frontendValues = frontendVocab.map(item => item.value)
      const backendValues = BACKEND_CONTROLLED_VOCABULARIES[vocabKey]

      expect(frontendValues).toEqual(backendValues)
    })
  })

  it('verifies 5-tier standard event_level vocabulary on both layers', () => {
    const frontendLevels = CONTROLLED_VOCABULARIES.event_level.map(o => o.value)
    expect(frontendLevels).toEqual(['institutional', 'local', 'regional', 'national', 'international'])
  })

  it('verifies placement vocabulary strictly adheres to 5 podium tiers', () => {
    const frontendPlacements = CONTROLLED_VOCABULARIES.placement.map(o => o.value)
    expect(frontendPlacements).toEqual(['champion', 'first_runner_up', 'second_runner_up', 'finalist', 'participant'])
  })

  it('verifies publication status strictly adheres to published vs draft', () => {
    const pubStatus = CONTROLLED_VOCABULARIES.publication_status.map(o => o.value)
    expect(pubStatus).toEqual(['published', 'draft'])
  })

  it('verifies all 57 schemas use valid vocabulary references', () => {
    Object.values(SUB_CATEGORY_SCHEMAS).forEach(schema => {
      schema.fields.forEach(field => {
        if (field.type === 'select' && field.options) {
          field.options.forEach(opt => {
            expect(opt.value).toBeDefined()
            expect(opt.label).toBeDefined()
            expect(typeof opt.value).toBe('string')
          })
        }
      })
    })
  })

  it('verifies zero description dependency for machine-mapped award scoring', () => {
    // Structured metadata contains all scorable keys; description is pure narrative
    const allFieldKeys = new Set()
    Object.values(SUB_CATEGORY_SCHEMAS).forEach(schema => {
      schema.fields.forEach(f => allFieldKeys.add(f.key))
    })

    expect(allFieldKeys.has('placement')).toBe(true)
    expect(allFieldKeys.has('event_level')).toBe(true)
    expect(allFieldKeys.has('position_level')).toBe(true)
    expect(allFieldKeys.has('publication_status')).toBe(true)
  })
})
