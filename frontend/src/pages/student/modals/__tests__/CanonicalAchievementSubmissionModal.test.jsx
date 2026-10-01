import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import CanonicalAchievementSubmissionModal from '../CanonicalAchievementSubmissionModal'

describe('CanonicalAchievementSubmissionModal', () => {
  it('starts with evidence and preserves progressive schema-driven sections', () => {
    const html = renderToStaticMarkup(<CanonicalAchievementSubmissionModal isOpen onClose={vi.fn()} />)

    expect(html).toContain('Upload supporting evidence')
    expect(html).toContain('Basic information')
    expect(html).toContain('Classification')
    expect(html).toContain('Save draft')
    expect(html).toContain('Review &amp; submit')
    expect(html).toContain('Select a category first')
    expect(html).not.toContain('Portfolio Record')
    expect(html).not.toContain('Submit for Verification')
  })
})
