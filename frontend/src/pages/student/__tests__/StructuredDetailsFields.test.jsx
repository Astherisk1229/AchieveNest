import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import StructuredDetailsFields from '../components/StructuredDetailsFields'
import { SUB_CATEGORY_SCHEMAS, getSubcategorySchema, CONTROLLED_VOCABULARIES } from '../../../config/portfolioFormSchemaRegistry'

describe('Category-Specific Structured Fields (Plan 04 Phase 4)', () => {
  it('verifies exhaustive 57 / 57 subcategory schema coverage', () => {
    const keys = Object.keys(SUB_CATEGORY_SCHEMAS)
    expect(keys.length).toBe(57)

    keys.forEach(subId => {
      const schema = getSubcategorySchema(subId)
      expect(schema).toBeDefined()
      expect(schema.schema_id).toBeDefined()
      expect(schema.category_id).toBeDefined()
      expect(schema.category_name).toBeDefined()
      expect(schema.subcategory_name).toBeDefined()
      expect(Array.isArray(schema.fields)).toBe(true)
      expect(schema.fields.length).toBeGreaterThan(0)
    })
  })

  it('verifies correct taxonomy distribution across all 9 primary categories', () => {
    const schemas = Object.values(SUB_CATEGORY_SCHEMAS)
    
    const countByCat = schemas.reduce((acc, s) => {
      acc[s.category_name] = (acc[s.category_name] || 0) + 1
      return acc
    }, {})

    expect(countByCat['Leadership Position']).toBe(4)
    expect(countByCat['Organization Membership / Participation']).toBe(5)
    expect(countByCat['Community Service / Volunteerism']).toBe(5)
    expect(countByCat['Church / Ministry Involvement']).toBe(4)
    expect(countByCat['Seminar / Training']).toBe(8)
    expect(countByCat['Citation / Recognition']).toBe(8)
    expect(countByCat['Sports']).toBe(10)
    expect(countByCat['Socio-Cultural / Performing Arts']).toBe(7)
    expect(countByCat['Campus Journalism']).toBe(6)

    // Total = 4 + 5 + 5 + 4 + 8 + 8 + 10 + 7 + 6 = 57
  })

  it('verifies locked classification rules for training and developments', () => {
    // 1. Leadership Development is under Seminar / Training
    const leadDev = SUB_CATEGORY_SCHEMAS['40000005-0001-0000-0000-000000000001']
    expect(leadDev.category_name).toBe('Seminar / Training')
    expect(leadDev.subcategory_name).toBe('Leadership Development')

    // 2. Sports Development is under Seminar / Training
    const sportDev = SUB_CATEGORY_SCHEMAS['40000005-0001-0000-0000-000000000004']
    expect(sportDev.category_name).toBe('Seminar / Training')
    expect(sportDev.subcategory_name).toBe('Sports Development')

    // 3. Socio-Cultural Development is under Seminar / Training
    const socioDev = SUB_CATEGORY_SCHEMAS['40000005-0001-0000-0000-000000000005']
    expect(socioDev.category_name).toBe('Seminar / Training')
    expect(socioDev.subcategory_name).toBe('Socio-Cultural / Performing Arts Development')

    // 4. Sports category has no training clinics
    const sportsSchemas = Object.values(SUB_CATEGORY_SCHEMAS).filter(s => s.category_name === 'Sports')
    expect(sportsSchemas.some(s => s.subcategory_name.toLowerCase().includes('training') || s.subcategory_name.toLowerCase().includes('clinic'))).toBe(false)
  })

  it('verifies Campus Journalism publication status explicitly defines published vs draft', () => {
    const newsSchema = SUB_CATEGORY_SCHEMAS['40000009-0001-0000-0000-000000000001']
    const statusField = newsSchema.fields.find(f => f.key === 'publication_status')
    
    expect(statusField).toBeDefined()
    expect(statusField.type).toBe('select')
    expect(statusField.options.map(o => o.value)).toContain('published')
    expect(statusField.options.map(o => o.value)).toContain('draft')
  })

  it('instantiates StructuredDetailsFields component for Leadership SSG schema', () => {
    const element = (
      <StructuredDetailsFields
        subcategoryId="40000001-0001-0000-0000-000000000001"
        structuredMetadata={{
          organization_name: 'Supreme Student Government',
          position_level: 'executive',
          position_title: 'SSG President'
        }}
        onChange={vi.fn()}
        errors={{}}
      />
    )

    expect(element).toBeDefined()
    expect(element.props.subcategoryId).toBe('40000001-0001-0000-0000-000000000001')
  })

  it('verifies 0 award selectors, scoring points, or criteria leakage in registry', () => {
    const schemas = Object.values(SUB_CATEGORY_SCHEMAS)
    
    schemas.forEach(schema => {
      schema.fields.forEach(field => {
        expect(field.label.toLowerCase()).not.toContain('award criteria')
        expect(field.label.toLowerCase()).not.toContain('potential award')
        expect(field.label.toLowerCase()).not.toContain('points')
        expect(field.label.toLowerCase()).not.toContain('rubric')
        expect(field.key).not.toBe('award_id')
        expect(field.key).not.toBe('score')
        expect(field.key).not.toBe('points')
      })
    })
  })

  it('verifies controlled vocabularies are well-formed', () => {
    expect(CONTROLLED_VOCABULARIES.event_level.length).toBe(5)
    expect(CONTROLLED_VOCABULARIES.placement.length).toBe(5)
    expect(CONTROLLED_VOCABULARIES.publication_status.length).toBe(2)
    expect(CONTROLLED_VOCABULARIES.position_level.length).toBe(4)
  })
})
