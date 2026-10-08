import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import HelpGuidePanel from '../HelpGuidePanel'
import { CANONICAL_ROLES } from '../../../utils/roleContext'

describe('HR Help & Guide index', () => {
  it('shows only the three HR topics without an HR subtitle and exposes accessible navigation controls', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <HelpGuidePanel
          role={CANONICAL_ROLES.HR_STAFF}
          user={{ account_type: 'hr_admin' }}
          onBack={vi.fn()}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    )

    expect(html).toContain('Back to account menu')
    expect(html).toContain('Close panel')
    expect(html).toContain('Help &amp; Guide')
    expect(html).toContain('Getting Started')
    expect(html).toContain('Ranking &amp; Evaluation')
    expect(html).toContain('FAQs')
    expect(html).not.toContain('Ranking Periods &amp; Eligibility')
    expect(html).not.toContain('Personnel Evaluation &amp; Finalization')
    expect(html).not.toContain('>HR</p>')
  })
})

describe('Personnel Help & Guide index', () => {
  it('shows the requested compact index and exactly three help destinations without a role subtitle', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <HelpGuidePanel
          role={CANONICAL_ROLES.PERSONNEL}
          user={{ account_type: 'personnel', personnel_affiliation: { personnel_group: 'faculty' } }}
          onBack={vi.fn()}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    )

    expect(html).toContain('Find guidance for using your Personnel workspace, adding accomplishments, and completing your personnel evaluation.')
    expect(html).toContain('Getting Started')
    expect(html).toContain('Portfolio &amp; Evaluation')
    expect(html).toContain('FAQs')
    expect(html).not.toContain('>Personnel</p>')
    expect(html).not.toContain('About AchieveNest')
    expect(html).not.toContain('Settings</span>')
  })
})
