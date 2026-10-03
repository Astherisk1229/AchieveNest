import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import AwardCatalogController from '../../../controllers/AwardCatalogController'
import AwardCatalogModel from '../../../models/AwardCatalogModel'
import AwardCatalogRow from '../../../components/osad/AwardCatalogRow'

function award(overrides = {}) {
  return new AwardCatalogModel({
    id: 'award-1',
    name: 'Campus Journalism Award',
    authority_status: 'OFFICIAL',
    configuration_status: 'VALID',
    configuration_valid: true,
    raw_qualifying_score: 56,
    computable_max_score: 70,
    candidate_threshold_percent: 80,
    field_availability: {
      computable_max_score: { status: 'AVAILABLE' },
      candidate_threshold_percent: { status: 'AVAILABLE' }
    },
    ...overrides
  })
}

describe('Awards Catalog Phase 2', () => {
  it.each([
    ['OFFICIAL', 'Official'],
    ['OPERATIONALIZED', 'Operationalized'],
    ['PROPOSED', 'Proposed criteria']
  ])('renders the API authority state %s', (authority, expected) => {
    const html = renderToStaticMarkup(<AwardCatalogRow award={award({ authority_status: authority })} onOpen={() => {}} />)
    expect(html).toContain(expected)
  })

  it('renders valid server-authoritative qualification values', () => {
    expect(award().qualificationPresentation().text).toBe('56 / 70 required · 80% threshold')
  })

  it.each([
    [{ configuration_status: 'THRESHOLD_CONFIGURATION_ERROR', candidate_threshold_percent: null }, 'Qualification configuration unavailable'],
    [{ configuration_status: 'CONFIGURATION_ERROR' }, 'Qualification configuration unavailable'],
    [{ configuration_status: 'PARTIALLY_UNSCORABLE' }, 'Some criteria cannot currently be scored automatically.'],
    [{ configuration_status: 'AWARD_AUTHORITY_PENDING' }, 'Candidate generation pending authority approval']
  ])('renders explicit configuration state', (overrides, expected) => {
    expect(award(overrides).qualificationPresentation().text).toBe(expected)
  })

  it('does not infer unavailable eligibility', () => {
    expect(award().eligibilityText()).toBe('Eligibility details unavailable')
  })

  it('searches award names only and preserves clear recovery', () => {
    const awards = [award(), award({ id: 'award-2', name: 'Leadership Award' })]
    expect(AwardCatalogController.filter(awards, 'journal')).toHaveLength(1)
    expect(AwardCatalogController.filter(awards, 'missing')).toHaveLength(0)
    expect(AwardCatalogController.filter(awards, '')).toHaveLength(2)
  })

  it('uses a native button for mouse and keyboard activation', () => {
    const onOpen = vi.fn()
    const element = <AwardCatalogRow award={award()} onOpen={onOpen} />
    expect(element.type).toBe(AwardCatalogRow)
    const html = renderToStaticMarkup(element)
    expect(html).toContain('<button')
    expect(html).toContain('aria-label="Open Campus Journalism Award"')
  })

  it('contains no hard-coded version, year, ranking, or Top-N copy', async () => {
    const source = await import('node:fs').then(({ readFileSync }) => readFileSync(new URL('../OSADAwardsAndCriteriaPage.jsx', import.meta.url), 'utf8'))
    expect(source).not.toMatch(/v1\.0|2025-2026|rank_position|Top\s*[35]/i)
    expect(source).not.toMatch(/candidate_threshold_percent\s*(?:\|\||\?\?)/)
  })
})
