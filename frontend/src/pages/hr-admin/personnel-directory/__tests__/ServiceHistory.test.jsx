import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ServiceHistorySummary } from '../ServiceHistorySection'
import ServiceHistoryModal from '../ServiceHistoryModal'
import ServicePeriodsEditor from '../ServicePeriodsEditor'
import {
  apiErrorToFormErrors,
  initialOnboardingPeriods,
  normalizeOnboardingPeriods,
  onboardingCurrentType,
  validateOnboardingPeriods,
  emptyPeriod,
  toEditablePeriod,
  toPayloadSegments,
  validateServiceHistory,
} from '../../../../utils/serviceHistory'

const TODAY = '2026-10-02'
const period = (start, end, classification = 'full_time', extra = {}) => ({ ...emptyPeriod(), start_date: start, end_date: end || '', is_ongoing: !end, classification, ...extra })

describe('Service history editor rules (mirror of server policy LOS-2026-10-v1)', () => {
  it('accepts part-time followed by ongoing full-time', () => {
    const result = validateServiceHistory([period('2015-06-01', '2019-05-31', 'part_time'), period('2019-06-01')], 'From 201 file', TODAY)
    expect(result.isValid).toBe(true)
  })

  it('reports row, form and reason problems', () => {
    expect(validateServiceHistory([period('2027-01-01')], 'x', TODAY).rows[0]).toMatch(/future/)
    expect(validateServiceHistory([period('2020-01-01', '2019-01-01')], 'x', TODAY).rows[0]).toMatch(/before the start/)
    expect(validateServiceHistory([period('2020-01-01', null, 'full_time', { excluded: true })], 'x', TODAY).rows[0]).toMatch(/HR reason/)
    expect(validateServiceHistory([period('2010-06-01', '2015-06-01'), period('2015-06-01')], 'x', TODAY).form).toMatch(/overlap/)
    expect(validateServiceHistory([period('2010-06-01'), period('2015-06-01')], 'x', TODAY).form).toMatch(/Only one/)
    expect(validateServiceHistory([period('2005-06-01'), period('2010-06-01', '2012-05-31')], 'x', TODAY).form).toMatch(/most recent/)
    expect(validateServiceHistory([period('2010-06-01')], '  ', TODAY).changeReason).toMatch(/reason/)
    expect(validateServiceHistory([], 'x', TODAY).form).toMatch(/at least one/)
  })

  it('builds the API payload: part-time always excluded, ongoing has no end date', () => {
    const segments = toPayloadSegments([
      period('2015-06-01', '2019-05-31', 'part_time', { excluded: false }),
      period('2019-06-01', '2020-05-31', 'full_time', { excluded: true, hr_reason: ' Leave without pay ' }),
      period('2020-06-01'),
    ])
    expect(segments.map(s => s.countability)).toEqual(['excluded', 'excluded', 'countable'])
    expect(segments[1].hr_reason).toBe('Leave without pay')
    expect(segments[2]).toMatchObject({ end_date: null, is_ongoing: true })
  })

  it('round-trips a server segment into an editable row', () => {
    expect(toEditablePeriod({ start_date: '2012-06-01', end_date: '2013-05-31', is_ongoing: false, classification: 'full_time', countability: 'excluded', hr_reason: 'LWOP' }))
      .toMatchObject({ excluded: true, hr_reason: 'LWOP', end_date: '2013-05-31' })
  })

  it('maps server errors to the right place', () => {
    const err = code => ({ response: { data: { error: code } } })
    expect(apiErrorToFormErrors(err({ code: 'SEGMENT_2_END_BEFORE_START', field: 'segments.1', message: 'Employment period 2 ends before it starts.' })).rows[1]).toMatch(/period 2/)
    expect(apiErrorToFormErrors(err({ code: 'CHANGE_REASON_REQUIRED', message: 'Enter the reason' })).changeReason).toBe('Enter the reason')
    expect(apiErrorToFormErrors(err({ code: 'SEGMENTS_OVERLAP', message: 'Employment periods must not overlap.' })).form).toMatch(/overlap/)
  })
})

describe('Dossier length-of-service summary', () => {
  const history = {
    current_version: {
      version_number: 2, resolved_at: '2026-10-02 09:00:00',
      segments: [
        { id: 's1', start_date: '2015-06-01', end_date: '2019-05-31', is_ongoing: false, classification: 'part_time', countability: 'excluded' },
        { id: 's2', start_date: '2019-06-01', end_date: null, is_ongoing: true, classification: 'full_time', countability: 'countable' },
      ],
    },
    qualifying_service: { basis: 'service_history', display: '7 years, 4 months', reference_date: '2026-10-02', part_time: { total_months: 48, display: '4 years' }, gaps: [] },
  }

  it('shows qualifying service, excluded part-time and the periods', () => {
    const html = renderToStaticMarkup(<ServiceHistorySummary history={history} loading={false} error="" onEdit={() => {}} />)
    for (const text of ['Length of Service', '7 years, 4 months', '4 years', 'From HR service history', 'Part-time', 'Present', 'Version 2', 'Edit Service History']) expect(html).toContain(text)
  })

  it('flags the start-date fallback as unverified and offers to record history', () => {
    const html = renderToStaticMarkup(<ServiceHistorySummary history={{ current_version: null, qualifying_service: { basis: 'legacy_start_date', display: '3 years', part_time: { total_months: 0 } } }} loading={false} error="" onEdit={() => {}} />)
    expect(html).toContain('not yet verified by HR')
    expect(html).toContain('Record Service History')
    expect(html).toContain('No employment periods recorded yet')
  })

  it('renders the editor prefilled from the current version', () => {
    const html = renderToStaticMarkup(<ServiceHistoryModal personnel={{ id: 'P1', full_name: 'Test Faculty' }} history={history} isOpen onClose={() => {}} />)
    // Effects do not run in static rendering, so the editor shell is checked here.
    for (const text of ['Service History', 'Test Faculty', 'Saving creates version 3', 'Add period', 'Reason for this change', 'Save Service History']) expect(html).toContain(text)
  })
})

describe('Service history at account onboarding', () => {
  it('derives the current appointment type from Faculty Engagement (non-teaching counts as full-time)', () => {
    expect(onboardingCurrentType('part_time_faculty')).toBe('part_time')
    expect(onboardingCurrentType('full_time_faculty')).toBe('full_time')
    expect(onboardingCurrentType(undefined)).toBe('full_time')
  })

  it('starts with one earlier period from the start date and the current appointment', () => {
    const rows = initialOnboardingPeriods('2015-06-01', 'full_time_faculty')
    expect(rows.map(r => [r.start_date, r.is_ongoing, r.classification])).toEqual([['2015-06-01', false, 'part_time'], ['', true, 'full_time']])
  })

  it('keeps the locked parts in sync with the account form', () => {
    const rows = normalizeOnboardingPeriods([period('2010-01-01', '2019-05-31', 'part_time'), period('2019-06-01', '2020-01-01', 'part_time')], '2015-06-01', 'full_time_faculty')
    expect(rows[0].start_date).toBe('2015-06-01')
    expect(rows[1]).toMatchObject({ is_ongoing: true, end_date: '', classification: 'full_time' })
  })

  it('validates like the server', () => {
    const ok = validateOnboardingPeriods([period('2015-06-01', '2019-05-31', 'part_time'), period('2019-06-01')], '2015-06-01', 'full_time_faculty', TODAY)
    expect(ok.isValid).toBe(true)
    const overlap = validateOnboardingPeriods([period('2015-06-01', '2019-06-01', 'part_time'), period('2019-06-01')], '2015-06-01', 'full_time_faculty', TODAY)
    expect(overlap.form).toMatch(/overlap/)
    const missingStart = validateOnboardingPeriods([period('2015-06-01', '2019-05-31', 'part_time'), { ...emptyPeriod(), is_ongoing: true }], '2015-06-01', 'full_time_faculty', TODAY)
    expect(missingStart.rows[1]).toMatch(/start date/)
  })

  it('renders the current appointment as locked in onboarding mode', () => {
    const rows = normalizeOnboardingPeriods(initialOnboardingPeriods('2015-06-01', 'full_time_faculty'), '2015-06-01', 'full_time_faculty')
    const html = renderToStaticMarkup(<ServicePeriodsEditor periods={rows} onChange={() => {}} onboarding={{ startDate: '2015-06-01', currentType: 'full_time' }} />)
    for (const text of ['Period 1', 'Current appointment', 'Same as Employment Start Date', 'From Faculty Engagement', 'Add earlier period', 'Part-time — not counted']) expect(html).toContain(text)
  })
})
