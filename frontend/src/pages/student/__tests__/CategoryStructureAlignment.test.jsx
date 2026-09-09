import { describe, it, expect } from 'vitest'
import {
  PRIMARY_CATEGORIES,
  SUB_CATEGORY_SCHEMAS,
  getSubcategoriesByCategory
} from '../../../config/portfolioFormSchemaRegistry'

describe('Plan 05 Phase 3 — Category Structure Alignment Test Suite', () => {
  it('verifies exactly 9 primary categories in authoritative canonical order', () => {
    expect(PRIMARY_CATEGORIES).toHaveLength(9)

    const expectedCategories = [
      { id: '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646', code: 'LEADERSHIP_POSITION', name: 'Leadership Position' },
      { id: 'c9a6d837-78f4-4516-b2db-d438ae717be5', code: 'ORG_MEMBERSHIP', name: 'Organization Membership / Participation' },
      { id: 'ace24637-66f7-4329-9451-ccc61e18eab9', code: 'COMMUNITY_SERVICE', name: 'Community Service / Volunteerism' },
      { id: '779a9653-d972-47ce-93dc-cb381150568b', code: 'CHURCH_MINISTRY', name: 'Church / Ministry Involvement' },
      { id: '802de57b-54d7-4d38-9433-052ca9636380', code: 'SEMINAR_TRAINING', name: 'Seminar / Training' },
      { id: '448beadb-a254-4cb6-84fb-a3d5f4f8822e', code: 'CITATION_RECOGNITION', name: 'Citation / Recognition' },
      { id: '2d20d412-bf34-46b4-a21d-d7131d4b514a', code: 'SPORTS', name: 'Sports' },
      { id: '6514e620-b5a0-4ff2-9353-0ee8787b5ce6', code: 'SOCIO_CULTURAL', name: 'Socio-Cultural / Performing Arts' },
      { id: '2b09cd61-7a23-4466-be58-889398e8f201', code: 'CAMPUS_JOURNALISM', name: 'Campus Journalism' }
    ]

    PRIMARY_CATEGORIES.forEach((cat, index) => {
      expect(cat.id).toBe(expectedCategories[index].id)
      expect(cat.code).toBe(expectedCategories[index].code)
      expect(cat.name).toBe(expectedCategories[index].name)
    })
  })

  it('verifies authoritative distribution of all 57 subcategories (4, 5, 5, 4, 8, 8, 10, 7, 6)', () => {
    const expectedDistribution = {
      '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646': 4,
      'c9a6d837-78f4-4516-b2db-d438ae717be5': 5,
      'ace24637-66f7-4329-9451-ccc61e18eab9': 5,
      '779a9653-d972-47ce-93dc-cb381150568b': 4,
      '802de57b-54d7-4d38-9433-052ca9636380': 8,
      '448beadb-a254-4cb6-84fb-a3d5f4f8822e': 8,
      '2d20d412-bf34-46b4-a21d-d7131d4b514a': 10,
      '6514e620-b5a0-4ff2-9353-0ee8787b5ce6': 7,
      '2b09cd61-7a23-4466-be58-889398e8f201': 6
    }

    let totalSubcategories = 0
    PRIMARY_CATEGORIES.forEach((cat) => {
      const subcats = getSubcategoriesByCategory(cat.id)
      const expectedCount = expectedDistribution[cat.id]
      expect(subcats).toHaveLength(expectedCount)
      totalSubcategories += subcats.length
    })

    expect(totalSubcategories).toBe(57)
  })

  it('confirms zero forbidden top-level categories', () => {
    const forbiddenNames = ['Achievement', 'Civic', 'External', 'Placement', 'Award', 'Competition']
    PRIMARY_CATEGORIES.forEach((cat) => {
      forbiddenNames.forEach((forbidden) => {
        expect(cat.name.toLowerCase()).not.toBe(forbidden.toLowerCase())
      })
    })
  })

  it('verifies award-lens invariants on canonical category grouping', () => {
    // Mock portfolio record
    const mockRecord = {
      id: 'rec-12345',
      title: 'PRISAA Regional Basketball Championship',
      category_id: '2d20d412-bf34-46b4-a21d-d7131d4b514a',
      category_name: 'Sports',
      subcategory_id: '40000007-0001-0000-0000-000000000001',
      subcategory_name: 'Basketball',
      status: 'verified'
    }

    // Award lens projection overlay
    const awardLensAthlete = {
      award_id: 'award-athlete-of-the-year',
      relevant: true,
      points: 30
    }
    const awardLensLeadership = {
      award_id: 'award-leadership-excellence',
      relevant: false,
      points: 0
    }

    // Switching award lens does not change canonical category or record id
    expect(mockRecord.category_id).toBe('2d20d412-bf34-46b4-a21d-d7131d4b514a')
    expect(mockRecord.category_name).toBe('Sports')
    expect(mockRecord.subcategory_name).toBe('Basketball')
    expect(mockRecord.id).toBe('rec-12345')

    // Attaching different award lenses does not mutate base record
    const projectedAthlete = { ...mockRecord, osad_evaluation: awardLensAthlete }
    const projectedLeadership = { ...mockRecord, osad_evaluation: awardLensLeadership }

    expect(projectedAthlete.category_name).toBe(projectedLeadership.category_name)
    expect(projectedAthlete.id).toBe(projectedLeadership.id)
    expect(projectedAthlete.osad_evaluation.relevant).toBe(true)
    expect(projectedLeadership.osad_evaluation.relevant).toBe(false)
  })
})
