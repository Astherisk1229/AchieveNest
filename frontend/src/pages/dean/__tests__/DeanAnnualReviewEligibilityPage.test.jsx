import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Dean annual review and eligibility module', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../DeanAnnualReviewEligibilityPage.jsx'), 'utf8')

  it('opens a faculty detail workspace before the separate workbook upload modal', () => {
    expect(source).toContain('<AnnualReviewDetailWorkspace')
    expect(source).toContain('onUploadReview={() => setUploadPerson(selectedItem.personnel)}')
    expect(source).toContain('{uploadPerson && state.data && <AnnualReviewUploadModal')
    expect(source).toContain('<AnnualReviewUploadModal')
    expect(source).not.toContain('requestedPersonnel')
  })

  it('covers the explicit modal lifecycle and recovery actions', () => {
    for (const contract of ["state: 'idle'", "state: 'inspecting'", "state: 'confirming'", "state: 'success'", "state: 'error'", "'requires_attention'", 'Try Again', 'Choose Another File']) expect(source).toContain(contract)
  })

  it('shows both workbook ratings separately from submission readiness and eligibility', () => {
    for (const contract of ['review_1_school_year', 'review_2_school_year', '1 workbook = 2 annual-review results', 'Annual Review Status', 'Submission readiness', 'Eligibility Requirements']) expect(source).toContain(contract)
  })

  it('contains accessible modal behavior', () => {
    for (const contract of ['aria-modal="true"', 'role="dialog"', "event.key === 'Escape'", 'requestAnimationFrame', 'aria-live="polite"']) expect(source).toContain(contract)
  })

  it('uses accessible faculty rows and clear position labels', () => {
    for (const contract of ['aria-label="Faculty annual reviews"', 'p.position_title || \'Position not recorded\'', 'Faculty position', 'All positions', 'aria-live="polite"']) expect(source).toContain(contract)
    expect(source).not.toContain('No assignment recorded')
    expect(source).toContain("!== 'NON_TEACHING_FACULTY'")
  })

  it('keeps status explanations concise and gives each row one primary action', () => {
    for (const contract of ['Annual Review Status', 'Submission readiness', 'MissingHrRequirements', 'Review History', 'Replace Annual Review', 'Upload Annual Review', 'View Portfolio Evaluation']) expect(source).toContain(contract)
  })

  it('shows current and superseded workbooks in an accessible history drawer', () => {
    for (const contract of ['AnnualReviewHistoryDrawer', 'Previous version', 'Used for current eligibility', 'Replaced {formatDate(row.superseded_at)}', 'View workbook']) expect(source).toContain(contract)
  })

  it('preserves backend error details after the API client unwraps failures', () => {
    expect(source).toContain("annualReviewRequestError(error, 'Annual reviews could not be loaded.').message")
    expect(source).toContain("annualReviewRequestError(error, 'History could not be loaded.').message")
  })
})
