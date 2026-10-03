import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../services/personnelAccomplishmentService', () => ({
  default: { getEvidenceBlobUrl: vi.fn(), downloadEvidenceBlob: vi.fn() }
}))

import PersonnelPortfolioBookletModal from '../../../pages/personnel/PersonnelPortfolioBookletModal'
import PersonnelSubmissionModal from '../../../pages/personnel/modals/PersonnelSubmissionModal'
import { resolveNtpCriterion, ntpContractCode, NTP_ENTRY_CRITERIA } from '../../../config/nonTeachingPortfolioSchema'
import { normalizeNonTeachingBookletItems, nonTeachingServicePoints, NTP_OTHER_KEY } from '../../../utils/nonTeachingBooklet'

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
  it('keeps older records visible under "previous categories" instead of dropping them', () => {
    const rows = normalizeNonTeachingBookletItems({ area_b_items: [
      { id: 'n1', category: 'B.2.b Active Involvement in Community / Civic Activities', category_metadata: { portfolio_format: 'non_teaching_faculty', criterion_code: 'B.2.b', details: { activity: 'Coastal clean-up', role: 'Volunteer' } }, occurrence_date: '2026-02-01' },
      { id: 'n2', category: 'B.2 Publication', title: 'Office manual', occurrence_date: '2025-08-01' }
    ] })
    expect(rows.map((row) => [row.criterionKey, row.reference])).toEqual([['B.2.b', 'B2B-001'], [NTP_OTHER_KEY, 'OTH-001']])
    expect(rows[0].accomplishment_display).toBe('Coastal clean-up')
    expect(rows[0].organization_display).toBe('Volunteer')
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
})
