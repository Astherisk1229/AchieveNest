import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import IntakeDefinitionEditor from '../ranking-criteria/IntakeDefinitionEditor'

function render(criterion, editable = true, itemType = 'subcategory') {
  return renderToStaticMarkup(<IntakeDefinitionEditor criterion={criterion} editable={editable} updateItem={vi.fn()} itemType={itemType} />)
}

describe('HR Faculty intake definition editor', () => {
  const configured = {
    id: 'leaf-1',
    name: 'Graduate units',
    intake_active: 1,
    intake_mode: 'FORM',
    scoring_rule_reference: 'Published points by completed units',
    field_schema: [{ key: 'semester', label: 'Semester', type: 'select', required: true, options: ['First Semester', 'Second Semester'], ocr_key: 'academic_period' }],
    evidence_rules: { required: true, accepted: ['Transcript'] },
  }

  it('renders structured field, accepted evidence, scoring reference, and activity controls', () => {
    const html = render(configured)
    for (const label of ['Field key', 'Display label', 'Field type', 'Required', 'Allowed choices', 'OCR mapping key', 'Supporting document', 'Scoring rule reference', 'Available for new Faculty accomplishments in this version']) {
      expect(html).toContain(label)
    }
    expect(html).toContain('First Semester')
    expect(html).toContain('Transcript')
    expect(html).not.toContain('&quot;field_schema&quot;')
  })

  it('shows configured values in read-only published-version mode', () => {
    const html = render(configured, false)
    expect(html).toContain('Graduate units')
    expect(html).toContain('Transcript')
    expect(html).toContain('disabled=""')
    expect(html).not.toContain('Add field')
  })

  it('offers an explicit manual / HR-defined mode without injecting fields', () => {
    const html = render({ ...configured, intake_mode: 'MANUAL_HR', field_schema: [] })
    expect(html).toContain('Manual / HR-defined')
    expect(html).toContain('HR will apply the configured manual scoring rule')
    expect(html).not.toContain('Required fields')
  })

  it('renders a category-level manual intake definition without editing canonical category names', () => {
    const html = render({ ...configured, id: 'category-b3', name: 'Conduct of Research', intake_mode: 'MANUAL_HR', field_schema: [] }, true, 'category')
    expect(html).toContain('Scoring rule reference')
    expect(html).toContain('Manual / HR-defined')
    expect(html).not.toContain('Selectable criterion label')
  })
})
