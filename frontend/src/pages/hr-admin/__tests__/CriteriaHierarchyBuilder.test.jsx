import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import CriteriaHierarchyBuilder, { createCategory, createLevel, createSubcategory } from '../ranking-criteria/CriteriaHierarchyBuilder'

const area = { id: 'area-a', area_code: 'A', name: 'Professional Development', categories: [] }

describe('CriteriaHierarchyBuilder', () => {
  it('shows existing categories collapsed with the configured cut-off and add action', () => {
    const tree = { areas: [{ ...area, categories: [{ ...createCategory(area, 'category-a'), name: 'Training', max_points: 40, subcategories: [createSubcategory({ id: 'category-a' }, 'sub-a')] }] }] }
    const markup = renderToStaticMarkup(<CriteriaHierarchyBuilder tree={tree} onChange={vi.fn()} />)
    expect(markup).toContain('Cut-off: 40')
    expect(markup).toContain('Add Category')
    expect(markup).not.toContain('Category Name')
    expect(markup).not.toContain('Level Name')
  })

  it('allows a category-only draft shape with a required cut-off and no direct levels', () => {
    const category = createCategory(area, 'category-new')
    category.name = 'Professional Development'
    category.max_points = 40
    expect(category.subcategories).toEqual([])
    expect(category.max_points).toBe(40)
    expect(category).not.toHaveProperty('levels')
  })

  it('allows a category with one or many subcategories without forcing levels', () => {
    const category = createCategory(area, 'category-new')
    const one = createSubcategory(category, 'sub-one')
    const many = createSubcategory(category, 'sub-many')
    expect(one.levels).toEqual([])
    expect([one, many]).toHaveLength(2)
    expect(one.default_points).toBe(0)
  })

  it('creates multiple optional levels nested only under a subcategory', () => {
    const subcategory = createSubcategory({ id: 'category-a' }, 'sub-a')
    const levels = []
    for (const id of ['regional', 'national', 'international']) levels.push(createLevel({ ...subcategory, levels }, id))
    expect(levels.map(level => level.scale_subcategory_id)).toEqual(['sub-a', 'sub-a', 'sub-a'])
    expect(levels.map(level => level.is_active)).toEqual([1, 1, 1])
    expect(levels.map(level => level.points)).toEqual([0, 0, 0])
    expect(levels.map(level => level.display_order)).toEqual([1, 2, 3])
  })

  it('supports inactive definitions as versioned, non-destructive draft state', () => {
    const category = { ...createCategory(area, 'category-a'), is_active: 0 }
    const subcategory = { ...createSubcategory(category, 'sub-a'), is_active: 0 }
    const level = { ...createLevel(subcategory, 'level-a'), is_active: 0 }
    expect([category.is_active, subcategory.is_active, level.is_active]).toEqual([0, 0, 0])
  })
})
