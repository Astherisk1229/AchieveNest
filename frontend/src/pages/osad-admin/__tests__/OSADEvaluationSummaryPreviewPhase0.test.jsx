import React from 'react'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import OSADAwardsAndCriteriaPage from '../OSADAwardsAndCriteriaPage'
import OSADEvaluationSummaryPreviewPage from '../OSADEvaluationSummaryPreviewPage'

const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8')

describe('Phase 0 evaluation summary format preview', () => {
  it('exposes a keyboard-native preview action in the Awards & Criteria header', () => {
    const markup = renderToStaticMarkup(<OSADAwardsAndCriteriaPage onPreviewEvaluationSummary={() => {}} />)
    const source = read('../OSADAwardsAndCriteriaPage.jsx')

    expect(markup).toContain('<button')
    expect(markup).toContain('Preview Evaluation Summary')
    expect(markup).toContain('focus-visible:ring-2')
    expect(source).toContain('onClick={onPreviewEvaluationSummary}')
  })

  it('registers and navigates to the dedicated preview route', () => {
    const app = read('../../../App.jsx')
    const routePage = read('../OSADAwardRoutePage.jsx')

    expect(app).toContain('path="/osad/awards/evaluation-summary-preview"')
    expect(routePage).toContain("navigate('/osad/awards/evaluation-summary-preview')")
    expect(routePage).toContain("view === 'summary-preview'")
  })

  it('renders the preview notice, one student header, and multiple award sections', () => {
    const markup = renderToStaticMarkup(<OSADEvaluationSummaryPreviewPage onBack={() => {}} />)

    expect(markup.match(/Student Name:/g)).toHaveLength(1)
    expect(markup).toContain('Preview only — sample data is shown')
    expect(markup).toContain('Campus Journalism Award')
    expect(markup).toContain('Leadership Award')
  })

  it('renders the exact table and award-summary vocabulary', () => {
    const markup = renderToStaticMarkup(<OSADEvaluationSummaryPreviewPage onBack={() => {}} />)

    for (const label of [
      'Achievement / Evidence',
      'Criterion',
      'Points',
      'Total',
      'Portfolio Potential Score',
      'Qualification Threshold',
      'Potential Candidate'
    ]) {
      expect(markup).toContain(label)
    }
  })

  it('uses print keep-together and repeating-header semantics', () => {
    const markup = renderToStaticMarkup(<OSADEvaluationSummaryPreviewPage onBack={() => {}} />)

    expect(markup).toContain('break-inside-avoid')
    expect(markup).toContain('page-break-inside:avoid')
    expect(markup).toContain('display:table-header-group')
    expect(markup).toContain('<th scope="col"')
  })

  it('uses a 12 pt document baseline and keeps both short award sections on one A4 page', () => {
    const markup = renderToStaticMarkup(<OSADEvaluationSummaryPreviewPage onBack={() => {}} />)

    expect(markup).toContain('text-[12pt]')
    expect(markup).toContain('text-[13pt]')
    expect(markup).toContain('text-[17pt]')
    expect(markup).toContain('text-[9pt]')
    expect(markup.match(/<article/g)).toHaveLength(1)
    expect(markup).toContain('Campus Journalism Award')
    expect(markup).toContain('Leadership Award')
  })

  it('uses spacing rather than smaller type to keep the document breathable', () => {
    const page = read('../OSADEvaluationSummaryPreviewPage.jsx')
    const awardSection = read('../../../components/osad/EvaluationSummaryAwardSection.jsx')

    expect(page).toContain('space-y-8')
    expect(awardSection).toContain('mt-2.5')
    expect(awardSection).toContain('py-1.5')
    expect(awardSection).toContain('mt-3')
    expect(`${page}\n${awardSection}`).not.toMatch(/text-\[(?:9|10|11)pt\].*(?:table|criterion|metadata)/i)
  })

  it('contains no API request or production document action', () => {
    const page = read('../OSADEvaluationSummaryPreviewPage.jsx')
    const model = read('../../../models/EvaluationSummaryPreviewModel.js')

    expect(`${page}\n${model}`).not.toMatch(/fetch\(|apiClient|awardAdminService|student.*service/i)
    expect(page).not.toMatch(/download|generate pdf|window\.print/i)
  })
})
