import { describe, expect, it } from 'vitest'
import { detailRows, isConfiguredAchievement, missingRequiredDetails } from '../achievementDetails'

const catalog = { categories: [{ subcategories: [{
  legacy_subcategory_id: 'contract-subcategory',
  fields: [
    { key: 'title_of_work', label: 'Title of Work', control: 'text', required: true },
    { key: 'publication_outlet', label: 'Publication / Outlet', control: 'text', required: true },
    { key: 'publication_date_period', label: 'Publication Date / Period', control: 'date_range', required: true, validation: { start_key: 'publication_start_date', end_key: 'publication_end_date' } },
    { key: 'publication_role', label: 'Publication Role', control: 'select', required: true, options: [{ value: 'WRITER', label: 'Writer' }] }
  ]
}] }] }

describe('configured student achievement details', () => {
  it('renders saved contract values and grouped dates using the configured labels', () => {
    const metadata = {
      schema_version: 'student-form-schema-2',
      title_of_work: 'Campus feature',
      publication_outlet: 'The Campus Journal',
      publication_start_date: '2026-05-28',
      publication_end_date: '2026-05-30',
      publication_role: 'WRITER'
    }
    expect(isConfiguredAchievement(metadata)).toBe(true)
    expect(detailRows('contract-subcategory', metadata, catalog)).toEqual([
      expect.objectContaining({ label: 'Title of Work', value: 'Campus feature' }),
      expect.objectContaining({ label: 'Publication / Outlet', value: 'The Campus Journal' }),
      expect.objectContaining({ label: 'Publication Date / Period', value: '2026-05-28 – 2026-05-30' }),
      expect.objectContaining({ label: 'Publication Role', value: 'Writer' })
    ])
  })

  it('reports required configured fields to the reviewer when they are missing', () => {
    const missing = missingRequiredDetails('contract-subcategory', {
      schema_version: 'student-form-schema-2',
      title_of_work: 'Campus feature',
      publication_outlet: 'The Campus Journal'
    }, catalog)
    expect(missing.map(field => field.key)).toEqual(['publication_date_period', 'publication_role'])
  })
})
