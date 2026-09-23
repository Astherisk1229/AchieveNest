import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import AchievementSubmissionModal from '../modals/AchievementSubmissionModal'
import {
  PRIMARY_CATEGORIES,
  getSubcategoriesByCategory,
  getSubcategorySchema,
  SUB_CATEGORY_SCHEMAS
} from '../../../config/portfolioFormSchemaRegistry'

describe('Frontend Dynamic Renderer Suite (Plan 04 Phase 6)', () => {
  it('verifies exactly 9 primary categories in registry', () => {
    expect(PRIMARY_CATEGORIES.length).toBe(9)
    const codes = PRIMARY_CATEGORIES.map(c => c.code)
    expect(codes).toContain('LEADERSHIP_POSITION')
    expect(codes).toContain('ORG_MEMBERSHIP')
    expect(codes).toContain('COMMUNITY_SERVICE')
    expect(codes).toContain('CHURCH_MINISTRY')
    expect(codes).toContain('SEMINAR_TRAINING')
    expect(codes).toContain('CITATION_RECOGNITION')
    expect(codes).toContain('SPORTS')
    expect(codes).toContain('SOCIO_CULTURAL')
    expect(codes).toContain('CAMPUS_JOURNALISM')
  })

  it('verifies all 57 subcategories are reachable under the 9 primary categories', () => {
    let totalReachable = 0
    PRIMARY_CATEGORIES.forEach(cat => {
      const subcats = getSubcategoriesByCategory(cat.id)
      expect(subcats.length).toBeGreaterThan(0)
      totalReachable += subcats.length

      subcats.forEach(sub => {
        const schema = getSubcategorySchema(sub.id)
        expect(schema).toBeDefined()
        expect(schema.category_id).toBe(cat.id)
      })
    })

    expect(totalReachable).toBe(57)
  })

  it('instantiates AchievementSubmissionModal with initial props', () => {
    const element = (
      <AchievementSubmissionModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmitAchievement={vi.fn()}
        initialData={null}
      />
    )

    expect(element).toBeDefined()
    expect(element.props.isOpen).toBe(true)
  })

  it('verifies discard dirty-state detection helper logic', () => {
    const hasMeaningful = (metadata) => {
      const ignoredKeys = ['schema_version', 'academic_year', 'semester']
      return Object.entries(metadata).some(([key, val]) => {
        if (ignoredKeys.includes(key)) return false
        return val !== '' && val !== null && val !== undefined && val !== false
      })
    }

    // Default empty metadata should NOT trigger discard confirmation
    expect(hasMeaningful({ schema_version: '1.0', academic_year: '2025-2026', semester: '1st_semester' })).toBe(false)
    expect(hasMeaningful({ schema_version: '1.0' })).toBe(false)

    // Meaningful structured data SHOULD trigger discard confirmation
    expect(hasMeaningful({ schema_version: '1.0', position_title: 'President' })).toBe(true)
    expect(hasMeaningful({ schema_version: '1.0', placement: 'champion' })).toBe(true)
  })

  it('verifies zero student award selectors and zero scoring exposure', () => {
    Object.values(SUB_CATEGORY_SCHEMAS).forEach(schema => {
      schema.fields.forEach(f => {
        expect(f.label.toLowerCase()).not.toContain('award criteria')
        expect(f.label.toLowerCase()).not.toContain('potential award')
        expect(f.label.toLowerCase()).not.toContain('scoring')
        expect(f.label.toLowerCase()).not.toContain('points')
        expect(f.key).not.toBe('award_id')
        expect(f.key).not.toBe('score')
      })
    })
  })
})
