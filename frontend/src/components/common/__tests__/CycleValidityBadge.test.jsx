import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import CycleValidityBadge, { cycleValidityLabel } from '../CycleValidityBadge'

describe('Cycle validity badge (server decision, display only)', () => {
  it('labels each status without implying a qualification was earned in the cycle', () => {
    expect(cycleValidityLabel({ status: 'ELIGIBLE', validity_type: 'PERIOD' })).toBe('Within evaluation period')
    expect(cycleValidityLabel({ status: 'ELIGIBLE', validity_type: 'QUALIFICATION' })).toBe('Valid qualification')
    expect(cycleValidityLabel({ status: 'OUTSIDE_CYCLE' })).toBe('Outside evaluation period')
    expect(cycleValidityLabel({ status: 'NEEDS_INFORMATION' })).toBe('Needs information')
    expect(cycleValidityLabel(null)).toBeNull()
  })

  it('renders the server reason as the tooltip and nothing when no cycle is open', () => {
    expect(renderToStaticMarkup(<CycleValidityBadge validity={{ status: 'OUTSIDE_CYCLE', reason: 'This accomplishment falls outside the ranking cycle coverage.' }}/>)).toContain('This accomplishment falls outside the ranking cycle coverage.')
    expect(renderToStaticMarkup(<CycleValidityBadge validity={null}/>)).toBe('')
  })
})
