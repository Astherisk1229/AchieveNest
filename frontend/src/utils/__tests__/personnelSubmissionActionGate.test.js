import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { derivePersonnelSubmissionActionGate } from '../personnelPortfolioState'

const editableDraft = { status: 'draft', isReturnedForRevision: false, isEditable: true }
const returnedV1 = { status: 'returned_for_revision', isReturnedForRevision: true, isEditable: true }

describe('personnel submission action gating', () => {
  it('keeps initial submission disabled without an open period', () => {
    const gate = derivePersonnelSubmissionActionGate({ portfolioState: editableDraft, evaluationPeriod: null, eligibilityStatus: 'eligible' })
    expect(gate.action).toBe('submit')
    expect(gate.disabled).toBe(true)
    expect(gate.periodUnavailableReason).toMatch(/No personnel evaluation period/i)
  })

  it('preserves the existing eligible initial-submission path during an open period', () => {
    const gate = derivePersonnelSubmissionActionGate({ portfolioState: editableDraft, evaluationPeriod: { can_submit: true }, eligibilityStatus: 'eligible' })
    expect(gate.action).toBe('submit')
    expect(gate.disabled).toBe(false)
  })

  it('shows a scheduled draft period while keeping initial submission disabled', () => {
    const gate = derivePersonnelSubmissionActionGate({
      portfolioState: editableDraft,
      evaluationPeriod: { status: 'DRAFT', can_submit: false },
      eligibilityStatus: 'eligible'
    })
    expect(gate.disabled).toBe(true)
    expect(gate.periodUnavailableReason).toMatch(/scheduled.*not opened/i)
  })

  it('enables returned Version 1 resubmission when facultyCurrent returns no open period', () => {
    const gate = derivePersonnelSubmissionActionGate({ portfolioState: returnedV1, evaluationPeriod: null, eligibilityStatus: 'eligible' })
    expect(gate.action).toBe('resubmit')
    expect(gate.periodUnavailableReason).toBe('')
    expect(gate.disabled).toBe(false)
  })

  it('keeps returned resubmission disabled while a real submit operation is in progress', () => {
    const gate = derivePersonnelSubmissionActionGate({ portfolioState: returnedV1, evaluationPeriod: null, eligibilityStatus: 'eligible', isSubmitting: true })
    expect(gate.disabled).toBe(true)
  })

  it('does not expose resubmission for a completed portfolio', () => {
    const gate = derivePersonnelSubmissionActionGate({ portfolioState: { status: 'completed', isReturnedForRevision: false, isEditable: false }, evaluationPeriod: null, eligibilityStatus: 'eligible' })
    expect(gate.visible).toBe(false)
    expect(gate.disabled).toBe(true)
    expect(gate.action).toBe('submit')
  })

  it('routes the returned action through the existing production resubmit service', () => {
    const gate = derivePersonnelSubmissionActionGate({ portfolioState: returnedV1, evaluationPeriod: null, eligibilityStatus: 'eligible' })
    const here = path.dirname(fileURLToPath(import.meta.url))
    const page = fs.readFileSync(path.resolve(here, '../../pages/personnel/PersonnelPortfolioEditPage.jsx'), 'utf8')
    expect(gate.action).toBe('resubmit')
    expect(page).toContain('if (isReturnedForRevision)')
    expect(page).toContain('res = await resubmitPortfolio({')
  })
})
