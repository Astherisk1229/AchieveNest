import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../services/personnelAccomplishmentService', () => ({
  default: { getEvidenceBlobUrl: vi.fn(), downloadEvidenceBlob: vi.fn() }
}))

import PersonnelPortfolioBookletModal from '../../../pages/personnel/PersonnelPortfolioBookletModal'
import PersonnelSubmissionModal from '../../../pages/personnel/modals/PersonnelSubmissionModal'
import { resolveNtpCriterion, ntpContractCode, NTP_ENTRY_CRITERIA } from '../../../config/nonTeachingPortfolioSchema'
import { normalizeNonTeachingBookletItems, nonTeachingAreaARows, nonTeachingServicePoints, NTP_OTHER_KEY } from '../../../utils/nonTeachingBooklet'
import { NON_TEACHING_BOOKLET_FORMAT } from '../bookletFormats'
import BookletPage, { buildBookletPages } from '../BookletPage'

const staff = { full_name: 'Demo Staff', personnel_group: 'non_teaching_faculty', designation_title: 'Records Officer' }

describe('Appendix N schema', () => {
  it('maps lettered, numbered and older category labels onto the official criteria', () => {
    expect(resolveNtpCriterion({ category: 'B.1.a Moderator / Officer of Clubs' })).toBe('B.1.a')
    expect(resolveNtpCriterion({ criterion_code: 'B.1.a', criterion_key: 'B.1.3' })).toBe('B.1.c')
    expect(resolveNtpCriterion({ category: 'B.4 Professional Recognition or Awards', category_code: 'B.4' })).toBe('B.5')
    expect(resolveNtpCriterion({ category: 'B.1 Guest Lecturer / Consultant / Judge' })).toBe('B.4')
    expect(resolveNtpCriterion({ category: 'B.2 Publication' })).toBeNull()
  })

  it('uses the server contract codes', () => {
    expect(ntpContractCode('B.1.a')).toBe('NTF-B1A')
    expect(ntpContractCode('B.4')).toBe('NTF-B4')
    expect(NTP_ENTRY_CRITERIA.map((criterion) => criterion.code)).not.toContain('B.3')
  })
})

describe('Non-Teaching booklet rows', () => {
  it('shows the Area A weight factors in the screen and print table', () => {
    const pages = buildBookletPages(NON_TEACHING_BOOKLET_FORMAT, [])
    const html = renderToStaticMarkup(<BookletPage page={pages[0]} format={NON_TEACHING_BOOKLET_FORMAT} rows={[]} user={staff} portfolio={{}} areaARows={nonTeachingAreaARows({})} />)

    expect(html).toMatch(/>Weight<\/th><th[^>]*>%<\/th><th[^>]*>DS<\/th>/)
    expect(html).toContain('>.50</td>')
    expect(html).toContain('>.10</td>')
    expect(html).toContain('>.30</td>')
    expect(html).toContain('colSpan="4">Category Total (maximum 90)')
  })

  it('makes Area A rows selectable for HR without changing the printed booklet', () => {
    const page = buildBookletPages(NON_TEACHING_BOOKLET_FORMAT, [])[0]
    const props = { page, format: NON_TEACHING_BOOKLET_FORMAT, rows: [], user: staff, portfolio: {}, areaARows: nonTeachingAreaARows({}) }
    const interactive = renderToStaticMarkup(<BookletPage {...props} interactive onSelectAreaARow={() => {}} selectedAreaACode="A.2" />)
    const printed = renderToStaticMarkup(<BookletPage {...props} />)

    expect(interactive).toContain('aria-pressed="true"')
    expect(interactive).toContain('A.2</span>Personal Attitudes and Qualities</button>')
    expect(printed).not.toContain('aria-pressed=')
  })

  it('keeps older records visible under "previous categories" instead of dropping them', () => {
    const rows = normalizeNonTeachingBookletItems({ area_b_items: [
      { id: 'n1', category: 'B.2.b Active Involvement in Community / Civic Activities', category_metadata: { portfolio_format: 'non_teaching_faculty', criterion_code: 'B.2.b', details: { activity: 'Coastal clean-up', role: 'Volunteer' } }, occurrence_date: '2026-02-01' },
      { id: 'n2', category: 'B.2 Publication', title: 'Office manual', occurrence_date: '2025-08-01' }
    ] })
    expect(rows.map((row) => [row.criterionKey, row.reference])).toEqual([['B.2.b', 'B2B-001'], [NTP_OTHER_KEY, 'OTH-001']])
    expect(rows[0].accomplishment_display).toBe('Coastal clean-up')
    expect(rows[0].organization_display).toBe('Volunteer')
  })

  it('hides generated references from non-teaching booklet rows and proof pages', () => {
    const portfolio = { area_b_items: [{
      id: 'community-1',
      category: 'B.2.b Active Involvement in Community / Civic Activities',
      category_metadata: { portfolio_format: 'non_teaching_faculty', criterion_code: 'B.2.b', details: { activity: 'Coastal clean-up', role: 'Volunteer' } },
      occurrence_date: '2026-02-01',
      evidence_snapshot: [{ id: 'proof-1', original_filename: 'cleanup.pdf', mime_type: 'application/pdf', status: 'active' }]
    }] }
    const rows = normalizeNonTeachingBookletItems(portfolio)
    const pages = buildBookletPages(NON_TEACHING_BOOKLET_FORMAT, rows)
    const props = { format: NON_TEACHING_BOOKLET_FORMAT, rows, user: staff, portfolio }
    const booklet = renderToStaticMarkup(<BookletPage {...props} page={pages[0]} interactive onOpenProof={() => {}} />)
    const proof = renderToStaticMarkup(<BookletPage {...props} page={pages[1]} />)
    const viewer = renderToStaticMarkup(<PersonnelPortfolioBookletModal isOpen onClose={() => {}} user={staff} portfolio={portfolio} />)

    expect(rows[0].reference).toBe('B2B-001')
    for (const html of [booklet, proof, viewer]) {
      expect(html).toContain('Coastal clean-up')
      expect(html).not.toContain('B2B-001')
    }
    expect(booklet).toContain('B.2.b Active Involvement in Community / Civic Activities')
  })

  it('awards one point per two completed years, up to 10', () => {
    expect(nonTeachingServicePoints(9)).toBe(4)
    expect(nonTeachingServicePoints(25)).toBe(10)
    expect(nonTeachingServicePoints(undefined)).toBeNull()
  })
})

describe('Personnel views', () => {
  it('opens the Non-Teaching booklet instead of "format unavailable"', () => {
    const html = renderToStaticMarkup(<PersonnelPortfolioBookletModal isOpen onClose={() => {}} user={staff} portfolio={{ academic_year: '2026-2027', area_b_items: [] }} />)
    expect(html).toContain('Non-Teaching Personnel Portfolio')
    expect(html).toContain('NON-TEACHING PERSONNEL PORTFOLIO')
    expect(html).toContain('Specific Job: </dt><dd class="inline">Records Officer')
    expect(html).toContain('Rated by HR')
    expect(html).not.toContain('format unavailable')
  })

  it('offers only the Appendix N categories when adding an accomplishment', () => {
    const html = renderToStaticMarkup(<PersonnelSubmissionModal isOpen onClose={() => {}} areaCode="B" />)
    for (const criterion of NTP_ENTRY_CRITERIA) expect(html).toContain(`${criterion.code} ${criterion.title}`)
    expect(html).not.toContain('Scholarly Publications')
    expect(html).toContain('Club / Organization')
    expect(html).toContain('Start date')
  })

  it('uses the compact Faculty document styling while preserving NTF headings, fields, and records', () => {
    const longOrganization = 'Notre Dame of Marbel University Staff Development and Community Engagement Committee '.repeat(2)
    const rows = normalizeNonTeachingBookletItems({ items: [
      {
        id: 'club-role-1', category_area: 'areaB', criterion_code: 'B.1.a',
        category_metadata: { portfolio_format: 'non_teaching_faculty', criterion_code: 'B.1.a', start_date: '2025-08-01', end_date: '2026-05-01', details: { organization: 'University Staff Association', assignment_role: 'OFFICER', organizer: longOrganization } },
        evidence_snapshot: [{ id: 'proof-1', original_filename: 'appointment.pdf', mime_type: 'application/pdf', status: 'active' }]
      },
      {
        id: 'club-role-2', category_area: 'areaB', criterion_code: 'B.1.a',
        category_metadata: { portfolio_format: 'non_teaching_faculty', criterion_code: 'B.1.a', start_date: '2024-08-01', end_date: '2025-05-01', details: { organization: 'Records Management Committee', assignment_role: 'MODERATOR', organizer: 'Human Resources Office' } }
      }
    ] })
    const pages = buildBookletPages(NON_TEACHING_BOOKLET_FORMAT, rows)
    const contentPages = pages.filter(page => page.type === 'content')
    expect(contentPages).toHaveLength(1)
    expect(contentPages[0].contentAreas.map(area => area.key)).toEqual(['A', 'B'])
    const contentPage = pages.find(page => page.type === 'content' && page.contentAreas?.some(area => area.key === 'B'))
    const html = renderToStaticMarkup(<BookletPage page={contentPage} format={NON_TEACHING_BOOKLET_FORMAT} rows={rows} user={staff} portfolio={{ items: [] }} interactive onOpenProof={() => {}} />)

    expect(html).toContain('ntp-document')
    expect(html).toContain('faculty-area-row')
    expect(html).toContain('ntp-group-heading')
    expect(html).toContain('ntp-grid')
    expect(html).toContain('faculty-document-header')
    expect(html).toContain('w-[816px]')
    expect(html).toContain('Century_Schoolbook')
    expect(html).toContain('text-[16px]')
    expect(html).toContain('B. SERVICE AND LEADERSHIP')
    expect(html).toContain('B.1 School Involvement')
    expect(html).toContain('B.1.a Moderator / Officer of Clubs')
    expect(html).toMatch(/class="faculty-criterion-row ntp-group-heading[^\"]*text-\[16px\]/)
    expect(html).toMatch(/class="ntp-criterion-heading[^\"]*bg-white text-black/)
    expect(html).toContain('B.4 Invited as Judge, Lecturer, Resource Person')
    expect(html).toMatch(/ntp-criterion-heading[^\"]*bg-\[#0F243E\] text-white/)
    expect(html).toContain('Date / Period')
    expect(html).toContain('Club / Organization')
    expect(html).toContain('Role · Conducted / Organized by')
    expect(html).toContain('University Staff Association')
    expect(html).toContain(longOrganization.trim())
    expect(html).toContain('Records Management Committee')
    expect(html).toContain('View Proof')
    expect((html.match(/ntp-record-row/g) || []).length).toBeGreaterThanOrEqual(2)
  })

  it('keeps empty NTF criteria compact and preserves outline, search, paging, and print controls', () => {
    const html = renderToStaticMarkup(<PersonnelPortfolioBookletModal isOpen onClose={() => {}} user={staff} portfolio={{ academic_year: '2026-2027', items: [] }} />)

    expect(html).toContain('ntp-document')
    expect(html).not.toContain('This Portfolio Booklet is currently empty.')
    expect(html).not.toContain('Accomplishments appear here once they are added.')
    expect(html).toContain('No accomplishments recorded.')
    expect(html).toContain('Portfolio Outline')
    expect(html).toContain('Search the portfolio')
    expect(html).toContain('Previous page')
    expect(html).toContain('Next page')
    expect(html).toContain('Print or save as PDF')
    expect(html).toContain('Fit page to width')
    expect(html).toContain('Expand viewer')
  })
})
