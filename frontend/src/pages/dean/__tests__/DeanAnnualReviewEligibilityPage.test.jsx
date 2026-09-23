import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Dean annual review and eligibility module', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../DeanAnnualReviewEligibilityPage.jsx'), 'utf8')

  it('opens a row-level modal before the file picker', () => {
    expect(source).toContain('setUploadPerson(p)')
    expect(source).toContain('<AnnualReviewUploadModal')
    expect(source).toContain('Choose Excel Workbook')
    expect(source).not.toContain('requestedPersonnel')
  })

  it('covers the explicit modal lifecycle and recovery actions', () => {
    for (const contract of ["state: 'idle'", "state: 'inspecting'", "state: 'confirming'", "state: 'success'", "state: 'error'", "'requires_attention'", 'Try Again', 'Choose Another File']) expect(source).toContain(contract)
  })

  it('renders both annual reviews, matching, result, and eligibility separately', () => {
    for (const contract of ['Selected personnel', 'Personnel in workbook', 'review_1_school_year', 'review_2_school_year', '2-Year Result', 'Portfolio Eligibility', '1 workbook = 2 annual-review results']) expect(source).toContain(contract)
  })

  it('contains accessible modal behavior', () => {
    for (const contract of ['aria-modal="true"', 'role="dialog"', "event.key === 'Escape'", 'requestAnimationFrame', 'aria-live="polite"']) expect(source).toContain(contract)
  })

  it('uses the proven position terminology and institutional table hierarchy', () => {
    for (const contract of ['<table', 'scope="col"', 'Employment &amp; service', 'Annual review results', '2-year requirement', '>Position<', 'All positions']) expect(source).toContain(contract)
    expect(source).not.toContain('No assignment recorded')
  })

  it('keeps status explanations concise and gives each row one primary action', () => {
    for (const contract of ['Service data pending', 'No annual-review workbook uploaded', 'Workbook needed.', 'View Annual Review', 'Replace Annual Review']) expect(source).toContain(contract)
  })

  it('shows current and superseded workbooks in an accessible history drawer', () => {
    for (const contract of ['AnnualReviewHistoryDrawer', 'Previous version', 'Used for current eligibility', 'Replaced {formatDate(row.superseded_at)}', 'View workbook']) expect(source).toContain(contract)
  })
})
