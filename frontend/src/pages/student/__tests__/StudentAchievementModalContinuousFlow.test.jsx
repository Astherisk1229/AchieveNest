import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import AchievementSubmissionModal from '../modals/AchievementSubmissionModal'
import { PRIMARY_CATEGORIES, getSubcategoriesByCategory } from '../../../config/portfolioFormSchemaRegistry'

const taxonomy = PRIMARY_CATEGORIES.map(category => ({
  ...category,
  subcategories: getSubcategoriesByCategory(category.id)
}))

describe('Student achievement continuous modal flow', () => {
  it('renders classification, common fields, and evidence in one modal without wizard controls', () => {
    const html = renderToStaticMarkup(
      <AchievementSubmissionModal
        isOpen
        onClose={vi.fn()}
        onSubmitAchievement={vi.fn()}
        taxonomy={taxonomy}
      />
    )

    expect(html).toContain('Classification')
    expect(html).toContain('Basic Information')
    expect(html).toContain('Supporting Evidence')
    expect(html).toContain('Save Draft')
    expect(html).toContain('Submit for Verification')
    expect(html).not.toContain('Continue')
    expect(html).not.toContain('Achievement submission progress')
  })

  it('keeps the dependent subcategory disabled before category selection', () => {
    const html = renderToStaticMarkup(
      <AchievementSubmissionModal isOpen onClose={vi.fn()} taxonomy={taxonomy} />
    )

    expect(html).toContain('Select a category first')
    expect(html).toMatch(/name="subcategory_id"[^>]*disabled=""/)
  })
})
