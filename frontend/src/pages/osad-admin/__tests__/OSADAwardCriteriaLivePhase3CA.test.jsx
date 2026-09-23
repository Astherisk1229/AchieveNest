/**
 * @vitest-environment node
 */
import React from 'react'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import AwardCriteriaModel from '../../../models/AwardCriteriaModel'
import OSADAwardDetailPage from '../OSADAwardDetailPage'

const BASE_URL = process.env.ACHIEVENEST_API_URL || 'http://localhost:8080/api/v1'
const NORMALIZED_TYPES = new Set(['COUNT', 'HIGHEST_VALUE', 'ADDITIVE', 'PRESENCE', 'MATRIX', 'HUMAN_ONLY'])
const VALIDATION_AWARDS = {
  CAMPUS_JOURNALISM_AWARD: { maximum: 70, required: 56, types: ['COUNT', 'ADDITIVE', 'HUMAN_ONLY'] },
  LEADERSHIP_AWARD: { maximum: 50, required: 40, types: ['HIGHEST_VALUE', 'ADDITIVE', 'HUMAN_ONLY'] },
  SPORTS_AWARD_FEMALE: { maximum: 55, required: 44, types: ['PRESENCE', 'ADDITIVE', 'MATRIX', 'HUMAN_ONLY'] },
  ATHLETE_OF_THE_YEAR_MALE: { maximum: 55, required: 44, types: ['PRESENCE', 'ADDITIVE', 'MATRIX', 'HUMAN_ONLY'] }
}

function demoPassword() {
  if (process.env.ACHIEVENEST_DEMO_PASSWORD?.trim()) return process.env.ACHIEVENEST_DEMO_PASSWORD.trim()
  const path = join(process.cwd(), '..', 'backend', '.env')
  if (!existsSync(path)) return ''
  const match = readFileSync(path, 'utf8').match(/^ACHIEVENEST_DEMO_PASSWORD\s*=\s*(.+)$/m)
  return match?.[1]?.trim() || ''
}

function allCriteria(payload) {
  return payload.criteria.flatMap((criterion) => [criterion, ...(criterion.components || [])])
}

describe('Phase 3C-A live authenticated criteria integration', { timeout: 30000 }, () => {
  let token
  const payloads = new Map()

  beforeAll(async () => {
    const password = demoPassword()
    expect(password, 'ACHIEVENEST_DEMO_PASSWORD must be configured for live authenticated validation').not.toBe('')

    const health = await fetch(`${BASE_URL}/health`)
    expect(health.status).toBe(200)

    const login = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institutional_email: 'demo.osad.admin@ndmu.edu.ph', password })
    })
    expect(login.status).toBe(200)
    token = (await login.json()).data.access_token

    const catalogResponse = await fetch(`${BASE_URL}/osad/awards`, { headers: { Authorization: `Bearer ${token}` } })
    expect(catalogResponse.status).toBe(200)
    const catalog = (await catalogResponse.json()).data.awards

    for (const code of Object.keys(VALIDATION_AWARDS)) {
      const award = catalog.find((item) => item.code === code)
      expect(award, `Missing live award ${code}`).toBeDefined()
      const response = await fetch(`${BASE_URL}/osad/awards/${award.id}`, { headers: { Authorization: `Bearer ${token}` } })
      expect(response.status).toBe(200)
      payloads.set(code, (await response.json()).data)
    }
  })

  afterAll(async () => {
    if (token) await fetch(`${BASE_URL}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  })

  it.each(Object.entries(VALIDATION_AWARDS))('validates live API and frontend consumption for %s', (code, expected) => {
    const payload = payloads.get(code)
    expect(payload.authority_status).toBe('OFFICIAL')
    expect(payload.configuration_status).toBe('VALID')
    expect(payload.configuration_valid).toBe(true)
    expect(payload.raw_qualifying_score).toBe(expected.required)
    expect(payload.candidate_threshold_percent).toBe(80)
    expect(payload.computable_max_score).toBe(expected.maximum)
    expect(payload.threshold_purpose).toBe('POTENTIAL_CANDIDATE_DISCOVERY')
    for (const field of ['raw_qualifying_score', 'candidate_threshold_percent', 'computable_max_score']) {
      expect(payload.field_availability[field].status).toBe('AVAILABLE')
    }

    const criteria = allCriteria(payload)
    expect(criteria.length).toBeGreaterThan(0)
    for (const criterion of criteria) {
      expect(NORMALIZED_TYPES.has(criterion.criterion_type), `${code}: ${criterion.criterion_code || criterion.criterion_id} returned ${criterion.criterion_type}`).toBe(true)
      expect(criterion.criterion_type).not.toBe('SUM_CAPPED')
      expect(criterion.field_availability).toBeDefined()
    }

    for (const type of expected.types) expect(criteria.some((criterion) => criterion.criterion_type === type)).toBe(true)
    for (const criterion of criteria.filter((item) => item.criterion_type !== 'HUMAN_ONLY' && (item.components || []).length === 0)) {
      expect(criterion.field_availability.point_mapping.status).toBe('AVAILABLE')
      expect(criterion.point_mapping).not.toBeNull()
    }

    const model = new AwardCriteriaModel(payload)
    expect(model.qualification).toEqual({ required: expected.required, threshold: 80, maximum: expected.maximum, purpose: 'POTENTIAL_CANDIDATE_DISCOVERY' })
    expect(model.humanCriteria.length).toBeGreaterThan(0)
    expect(model.humanCriteria.every((criterion) => criterion.humanOnly)).toBe(true)

    for (const parent of model.criteria.filter((criterion) => criterion.componentModels.length > 0)) {
      expect(parent.componentModels.every((component) => component.name !== 'Component label unavailable')).toBe(true)
    }

    const markup = renderToStaticMarkup(<OSADAwardDetailPage award={payload} />)
    expect(markup).toContain(`${expected.required} / ${expected.maximum}`)
    expect(markup).toContain('Human-evaluated criteria')
    expect(markup).not.toContain('sum_capped')
    expect(markup).not.toContain('Unnamed component')
  })

  it('keeps unresolved Leadership scopes explicit and unscored', () => {
    const leadership = payloads.get('LEADERSHIP_AWARD')
    const criteria = allCriteria(leadership)
    const unresolved = criteria.find((criterion) => criterion.scoring_warnings?.some((warning) => warning.code === 'UNRESOLVED_LEADERSHIP_SCOPE'))
    expect(unresolved).toBeDefined()
    expect(unresolved.scoring_status).toBe('PARTIALLY_UNSCORABLE')
    expect(unresolved.unresolved_mappings).toEqual(['AWARD_REGIONAL', 'AWARD_NATIONAL'])
    expect(unresolved.point_mapping.some((entry) => ['AWARD_REGIONAL', 'AWARD_NATIONAL'].includes(entry.value))).toBe(false)

    const markup = renderToStaticMarkup(<OSADAwardDetailPage award={leadership} />)
    expect(markup).toContain('Regional and National leadership award point mappings remain unresolved')
  })

  it('keeps matrix rows, columns, and values aligned in live sports payloads', () => {
    for (const code of ['SPORTS_AWARD_FEMALE', 'ATHLETE_OF_THE_YEAR_MALE']) {
      const matrix = allCriteria(payloads.get(code)).find((criterion) => criterion.criterion_type === 'MATRIX')
      expect(matrix.point_mapping.rows.length).toBe(matrix.point_mapping.values.length)
      expect(matrix.point_mapping.values.every((row) => row.length === matrix.point_mapping.columns.length)).toBe(true)
      const markup = renderToStaticMarkup(<OSADAwardDetailPage award={payloads.get(code)} />)
      expect(markup).toContain('<table')
      expect(markup).toContain('scope="col"')
      expect(markup).toContain('scope="row"')
    }
  })

  it('contains no frontend qualification arithmetic or criterion-name type inference', () => {
    const model = readFileSync(new URL('../../../models/AwardCriteriaModel.js', import.meta.url), 'utf8')
    const renderer = readFileSync(new URL('../../../components/osad/criteria/CriterionRenderer.jsx', import.meta.url), 'utf8')
    expect(`${model}\n${renderer}`).not.toMatch(/raw_qualifying_score\s*=|candidate_threshold_percent\s*\/|computable_max_score\s*\*/)
    expect(model).not.toMatch(/criterion_(name|code).*includes/i)
  })
})
