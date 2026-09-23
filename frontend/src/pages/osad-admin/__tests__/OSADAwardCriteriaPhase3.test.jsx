import React from 'react'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import CriterionRenderer from '../../../components/osad/criteria/CriterionRenderer'
import AwardCriteriaModel, { AwardCriterionModel } from '../../../models/AwardCriteriaModel'
import OSADAwardDetailPage from '../OSADAwardDetailPage'

const available = { status: 'AVAILABLE', reason: null }
const unavailable = { status: 'UNAVAILABLE', reason: 'MISSING_CONFIGURATION' }

function criterion(type, overrides = {}) {
  return new AwardCriterionModel({
    criterion_id: `criterion-${type}`,
    criterion_name: `${type} criterion`,
    criterion_type: type,
    max_points: 10,
    aggregation_mode: type === 'HIGHEST_VALUE' ? 'HIGHEST_VERIFIED' : 'SUM_CAPPED',
    point_mapping: { local: 3, national: 5 },
    duplicate_rule: 'STABLE_EVIDENCE_IDENTITY',
    evidence_requirement: 'Verified evidence required.',
    scoring_status: 'VALID',
    scoring_warnings: [],
    field_availability: { point_mapping: available },
    ...overrides
  })
}

function renderCriterion(type, overrides) {
  return renderToStaticMarkup(<CriterionRenderer criterion={criterion(type, overrides)} />)
}

describe('Phase 3 criterion renderers', () => {
  it.each(['COUNT', 'HIGHEST_VALUE', 'ADDITIVE'])('renders %s from its declared API type', (type) => {
    const markup = renderCriterion(type)
    expect(markup).toContain(`data-criterion-type="${type}"`)
    expect(markup).toContain('View scoring details')
    expect(markup).toContain('Local')
  })

  it('renders presence criteria without calculating a score', () => {
    const markup = renderCriterion('PRESENCE', {
      evidence_requirement: 'At least one verified qualifying record is required.',
      point_mapping: { qualifying_evidence_present: 10 }
    })
    expect(markup).toContain('At least one verified qualifying record is required')
    expect(markup).toContain('Qualifying Evidence Present')
  })

  it('renders a semantic, horizontally scrollable matrix', () => {
    const markup = renderCriterion('MATRIX', {
      point_mapping: {
        rows: ['GOLD', 'SILVER'],
        columns: ['PRISAA_NATIONAL', 'PRISAA_REGIONAL'],
        values: [[7, 5], [5, 3]]
      }
    })
    expect(markup).toContain('<table')
    expect(markup).toContain('scope="col"')
    expect(markup).toContain('scope="row"')
    expect(markup).toContain('overflow-x-auto')
  })

  it('keeps disclosure keyboard-native and exposes expansion semantics', () => {
    const markup = renderCriterion('COUNT')
    expect(markup).toContain('<details')
    expect(markup).toContain('<summary')
  })

  it('shows partial and unavailable mappings without filling gaps', () => {
    const markup = renderCriterion('ADDITIVE', {
      scoring_status: 'PARTIALLY_UNSCORABLE',
      point_mapping: null,
      field_availability: { point_mapping: unavailable },
      scoring_warnings: [{ code: 'UNRESOLVED', message: 'National and regional values require source clarification.' }]
    })
    expect(markup).toContain('Some scoring details are not currently defined')
    expect(markup).toContain('Point mapping unavailable.')
    expect(markup).toContain('National and regional values require source clarification')
  })
})

describe('Phase 3 award criteria page', () => {
  const award = {
    id: 'campus-journalism',
    name: 'Campus Journalism Award',
    description: 'Authoritative description.',
    authority_status: 'OFFICIAL',
    source_fidelity_status: 'VERIFIED',
    configuration_status: 'VALID',
    raw_qualifying_score: 56,
    candidate_threshold_percent: 80,
    computable_max_score: 70,
    threshold_purpose: 'POTENTIAL_CANDIDATE_DISCOVERY',
    thresholds: {
      discovery: { value: 80, purpose: 'POTENTIAL_CANDIDATE_DISCOVERY', availability: available },
      full: { value: 85, purpose: 'FULL_EVALUATION', availability: available }
    },
    field_availability: {
      raw_qualifying_score: available,
      candidate_threshold_percent: available,
      computable_max_score: available,
      authority_status: available,
      scoring_version: unavailable,
      source_document: unavailable
    },
    criteria: [
      criterion('COUNT').record,
      criterion('ADDITIVE').record,
      criterion('HUMAN_ONLY', { human_only: true, max_points: 20 }).record
    ]
  }

  it('shows overview, authoritative qualification values, both thresholds, and human-only criteria separately', () => {
    const markup = renderToStaticMarkup(<OSADAwardDetailPage award={award} />)
    expect(markup).toContain('How the score is calculated')
    expect(markup).toContain('56 / 70')
    expect(markup).toContain('Portfolio candidate discovery')
    expect(markup).toContain('Full evaluation')
    expect(markup).toContain('85%')
    expect(markup).toContain('Human-evaluated criteria')
    expect(markup).toContain('remain outside automatic portfolio scoring')
  })

  it('preserves proposed authority and blocks candidate generation', () => {
    const markup = renderToStaticMarkup(<OSADAwardDetailPage award={{ ...award, authority_status: 'PROPOSED' }} />)
    expect(markup).toContain('Proposed criteria')
    expect(markup).toContain('Candidate generation remains unavailable')
    expect(markup).toContain('disabled=""')
  })

  it('shows unavailable qualification values instead of deriving them', () => {
    const model = new AwardCriteriaModel({ ...award, raw_qualifying_score: null, field_availability: { ...award.field_availability, raw_qualifying_score: unavailable } })
    expect(model.qualification.required).toBeNull()
  })

  it('uses normalized component criteria for mixed major groups', () => {
    const model = new AwardCriteriaModel({
      criteria: [{
        criterion_id: 'major-group',
        criterion_name: 'Leadership',
        human_only: false,
        components: [criterion('HIGHEST_VALUE').record, criterion('ADDITIVE').record]
      }]
    })
    expect(model.renderableCriteria.map((item) => item.type)).toEqual(['HIGHEST_VALUE', 'ADDITIVE'])
  })

  it('renders authoritative component labels through normalized component models', () => {
    const componentAward = {
      ...award,
      criteria: [{
        criterion_id: 'publication-quality',
        criterion_name: 'Quality of Publication',
        criterion_type: 'ADDITIVE',
        max_points: 60,
        components: [
          { criterion_id: 'news', criterion_name: 'News Item Evidence', max_points: 10 },
          { criterion_id: 'editorial', criterion_name: 'Editorial Evidence', max_points: 20 }
        ]
      }]
    }

    const markup = renderToStaticMarkup(<OSADAwardDetailPage award={componentAward} />)

    expect(markup).toContain('News Item Evidence')
    expect(markup).toContain('Editorial Evidence')
    expect(markup).toContain('10 pts')
    expect(markup).toContain('20 pts')
    expect(markup).not.toContain('Unnamed component')
  })

  it('uses a neutral component fallback without inferring from code, points, or order', () => {
    const parent = new AwardCriterionModel({
      criterion_id: 'parent',
      criterion_name: 'Parent criterion',
      components: [{ criterion_id: 'opaque-code', criterion_code: 'DO_NOT_RENDER_AS_NAME', max_points: 17 }]
    })

    expect(parent.componentModels[0].name).toBe('Component label unavailable')
  })

  it('does not infer criterion types or calculate scores in frontend source', () => {
    const modelSource = readFileSync(new URL('../../../models/AwardCriteriaModel.js', import.meta.url), 'utf8')
    const rendererSource = readFileSync(new URL('../../../components/osad/criteria/CriterionRenderer.jsx', import.meta.url), 'utf8')
    expect(modelSource).not.toMatch(/criterion_(name|code).*includes/i)
    expect(rendererSource).not.toMatch(/award.*code/i)
    expect(`${modelSource}\n${rendererSource}`).not.toMatch(/raw_qualifying_score\s*=|computable_max_score\s*\*/)
  })

  it.each([
    ['Campus Journalism', ['COUNT', 'ADDITIVE', 'HUMAN_ONLY']],
    ['Leadership Award', ['HIGHEST_VALUE', 'ADDITIVE']],
    ['Athlete / Performance in Sports', ['PRESENCE', 'ADDITIVE', 'MATRIX', 'HUMAN_ONLY']]
  ])('renders the declared criterion mix for %s', (_awardName, types) => {
    const models = types.map((type) => criterion(type, type === 'HUMAN_ONLY' ? { human_only: true } : {}))
    const automaticMarkup = models.filter((item) => !item.humanOnly).map((item) => renderToStaticMarkup(<CriterionRenderer criterion={item} />)).join('')
    for (const type of types.filter((item) => item !== 'HUMAN_ONLY')) {
      expect(automaticMarkup).toContain(`data-criterion-type="${type}"`)
    }
    expect(models.filter((item) => item.humanOnly)).toHaveLength(types.includes('HUMAN_ONLY') ? 1 : 0)
  })
})
