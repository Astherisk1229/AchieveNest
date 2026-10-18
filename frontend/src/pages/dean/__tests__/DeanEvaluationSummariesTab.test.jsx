import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import DeanEvaluationSummariesTab from '../DeanEvaluationSummariesTab'

describe('Dean evaluation summaries tab', () => {
  it('lists endorsed and completed evaluations, with a read summary action', () => {
    const html = renderToStaticMarkup(<DeanEvaluationSummariesTab reviews={[
      { id: 'done-1', full_name: 'Jane Doe', institutional_id: '1001', status: 'completed', version_number: 3, submitted_at: '2026-10-17' },
      { id: 'endorsed-1', full_name: 'John Doe', institutional_id: '1002', status: 'ready_for_finalization', version_number: 1, submitted_at: '2026-10-16' },
      { id: 'active-1', full_name: 'Active Reviewer', institutional_id: '1003', status: 'in_evaluation' },
      { id: 'returned-1', full_name: 'Returned Member', institutional_id: '1004', status: 'returned_for_revision' },
    ]} onViewSummary={vi.fn()} />)

    expect(html).toContain('2 summaries')
    expect(html).toContain('Jane Doe')
    expect(html).toContain('John Doe')
    expect(html).toContain('Completed')
    expect(html).toContain('Endorsed to HR')
    expect(html).toContain('View summary')
    expect(html).not.toContain('Active Reviewer')
    expect(html).not.toContain('Returned Member')
  })

  it('shows a helpful empty state when there are no official results', () => {
    const html = renderToStaticMarkup(<DeanEvaluationSummariesTab reviews={[{ id: 'active-1', status: 'in_evaluation' }]} />)
    expect(html).toContain('No evaluation summaries yet.')
    expect(html).toContain('endorsed to HR or completed')
  })
})
