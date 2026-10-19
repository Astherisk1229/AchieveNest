import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import PersonnelPortfolioBookletModal from '../PersonnelPortfolioBookletModal'
import BookletPage, { buildBookletPages } from '../../../components/portfolio-booklet/BookletPage'
import { resolveBookletFormat } from '../../../components/portfolio-booklet/bookletFormats'

vi.mock('../../../services/personnelAccomplishmentService', () => ({
  default: { getEvidenceBlobUrl: vi.fn(), downloadEvidenceBlob: vi.fn() }
}))

const facultyUser = { full_name: 'Test Faculty', employee_id: 'EMP-TEST-1', personnel_group: 'faculty' }

// Isolated test fixture — not production or seeded data.
const fixturePortfolio = {
  academic_year: '2026-2027',
  area_a_items: [{ id: 'acc-a1', category_code: 'A.1', title: 'Fixture Degree', organizer_or_publisher: 'Fixture University', occurrence_date: '2025-06-15', primary_evidence: { id: 'ev-a1', original_filename: 'fixture-degree.pdf', mime_type: 'application/pdf', status: 'active', previewable: true } }],
  area_b_items: [{ id: 'acc-b2', category_code: 'B.2', title: 'Fixture Publication', occurrence_date: '2025-11-20' }],
  area_c_items: []
}

const render = (portfolio) => renderToString(<PersonnelPortfolioBookletModal isOpen onClose={() => {}} portfolio={portfolio} user={facultyUser} />)

describe('Faculty Academic portfolio — continuous viewer', () => {
  it('renders the official portfolio page and every attached proof in one scrollable canvas', () => {
    const html = render(fixturePortfolio)
    // The current Faculty booklet uses one continuous official page, followed by evidence pages.
    expect(html.match(/data-page-index="/g)).toHaveLength(2)
    expect(html).toContain('FACULTY DEVELOPMENT PROGRAM')
    expect(html).toContain('Signature over Printed Name')
    expect(html).toContain('id="booklet-area-A"')
    expect(html).toContain('id="booklet-area-B"')
    expect(html).toContain('id="booklet-area-C"')
    expect(html).toContain('id="booklet-proof-acc-a1"')
    expect(html).toMatch(/1<!-- --> \/ <!-- -->2/)
  })

  it('preserves canonical A → B → C order and evidence pages last', () => {
    const html = render(fixturePortfolio)
    const a = html.indexOf('id="booklet-area-A"')
    const b = html.indexOf('id="booklet-area-B"')
    const c = html.indexOf('id="booklet-area-C"')
    const proof = html.indexOf('id="booklet-proof-acc-a1"')
    expect(a).toBeGreaterThan(-1)
    expect(a).toBeLessThan(b)
    expect(b).toBeLessThan(c)
    expect(c).toBeLessThan(proof)
  })

  it('keeps Areas A, B, and C plus the signature together on the official page', () => {
    const html = render(fixturePortfolio)
    const firstPageStart = html.indexOf('data-faculty-document="true"')
    const firstPageEnd = html.indexOf('</article>', firstPageStart)
    const officialPage = html.slice(firstPageStart, firstPageEnd)
    for (const text of ['A. PROFESSIONAL DEVELOPMENT', 'EDUCATION', 'B. PRODUCTIVITY AND CREATIVE WORK', 'INVITED AS GUEST LECTURER/CONSULTANT/JUDGE/RESOURCE PERSON', 'PUBLICATION', 'C. SERVICE AND LEADERSHIP', 'Signature over Printed Name']) expect(officialPage).toContain(text)
  })

  it('orders Faculty proof pages newest first', () => {
    const format = resolveBookletFormat(facultyUser, {})
    const pages = buildBookletPages(format, [
      { accomplishmentId: 'older-proof', evidence: { id: 'proof-old' }, source: { occurrence_date: '2024-04-01' } },
      { accomplishmentId: 'newer-proof', evidence: { id: 'proof-new' }, source: { occurrence_date: '2026-04-01' } }
    ])
    expect(pages.slice(1).map((page) => page.item.accomplishmentId)).toEqual(['newer-proof', 'older-proof'])
  })

  it('builds a hierarchical outline from the official criteria with a separate Supporting Evidence group', () => {
    const html = render(fixturePortfolio)
    expect(html).toContain('Portfolio Outline')
    expect(html).toContain('data-outline-id="booklet-criterion-A.1"')
    expect(html).toContain('data-outline-id="booklet-criterion-C.3"')
    expect(html).toContain('Supporting Evidence')
    expect(html).toContain('data-outline-id="booklet-proof-acc-a1"')
    expect(html).not.toMatch(/>P\.1</)
  })

  it('offers View Proof only on records that have persisted evidence', () => {
    const html = render(fixturePortfolio)
    expect(html).toContain('aria-label="View proof for A1-001"')
    expect(html).not.toContain('aria-label="View proof for B2-001"')
  })

  it('keeps empty official sections visible and introduces no fallback data', () => {
    const html = render({ academic_year: '2026-2027', area_a_items: [], area_b_items: [], area_c_items: [] })
    expect(html.match(/data-page-index="/g)).toHaveLength(1)
    expect(html).toContain('EDUCATION')
    expect(html).toContain('NO. OF YEARS OF SERVICE AT NDMU')
    expect(html).toContain('Blank row for')
    expect(html).toContain('No attached proofs.')
    expect(html).not.toContain('Fixture')
  })

  it('renders the print copy from the same pages without application controls', () => {
    const html = render(fixturePortfolio)
    // The print copy is mounted only while printing (after the attached documents load as images).
    expect(html).not.toContain('booklet-print-root')
    const format = resolveBookletFormat(facultyUser, fixturePortfolio)
    const rows = format.normalize(fixturePortfolio)
    const pages = buildBookletPages(format, rows)
    const printCopy = pages.map((page) => renderToString(<BookletPage page={page} format={format} rows={rows} user={facultyUser} portfolio={fixturePortfolio} />)).join('')
    expect(printCopy.match(/class="booklet-page/g)).toHaveLength(2)
    expect(printCopy).not.toContain('View Proof')
    expect(printCopy).not.toContain('id="booklet-')
    expect(printCopy).not.toContain('<a ')
  })

  it('shows submitted Ph.D. Units in both the on-screen and print Education table', () => {
    const portfolio = {
      academic_year: '2026-2027',
      items: [{
        accomplishment_id: 'submitted-phd-units',
        criterion_code: 'C.3',
        category_metadata: {},
        item_description: 'Doctoral Program in Communication',
        scoring_payload: {
          category_metadata: {
            subcategory_code: 'A1_PHD_UNITS',
            start_date: '2025-06-27',
            end_date: '2026-04-27',
            details: {
              program: 'Doctoral Program in Communication',
              institution: 'NOTRE DAME OF MARBEL UNIVERSITY',
              semester: 'Second Semester',
              academic_year: '2025-2026',
              units_completed: 15
            }
          }
        }
      }]
    }

    const screenHtml = render(portfolio)
    expect(screenHtml).toContain('Doctoral Program in Communication')
    expect(screenHtml).toContain('NOTRE DAME OF MARBEL UNIVERSITY')
    expect(screenHtml).toContain('Second Semester')
    expect(screenHtml).toContain('AY 2025-2026')
    expect(screenHtml).toContain('15 units completed')

    const format = resolveBookletFormat(facultyUser, portfolio)
    const rows = format.normalize(portfolio)
    const pages = buildBookletPages(format, rows)
    const printHtml = pages.map((page) => renderToString(<BookletPage page={page} format={format} rows={rows} user={facultyUser} portfolio={portfolio} />)).join('')
    expect(printHtml).toContain('Doctoral Program in Communication')
    expect(printHtml).toContain('NOTRE DAME OF MARBEL UNIVERSITY')
    expect(printHtml).toContain('Second Semester')
    expect(printHtml).toContain('AY 2025-2026')
    expect(printHtml).toContain('15 units completed')
  })

  it('shows the official header fields from authoritative personnel data only', () => {
    const user = { ...facultyUser, full_name: 'Header Fixture', faculty_engagement: 'full_time_faculty', employment_status: 'contractual', current_rank_title: 'Instructor I' }
    const html = renderToString(<PersonnelPortfolioBookletModal isOpen onClose={() => {}} portfolio={{ ...fixturePortfolio, academic_year: 'AY 2023-2024' }} user={user} />)
    expect(html).toMatch(/Name: <\/dt><dd class="inline">Header Fixture/)
    expect(html).toMatch(/Status: <\/dt><dd class="inline">Full-Time - Contractual/)
    expect(html).toMatch(/School Year: <\/dt><dd class="inline">2023-2024/)
    expect(html).toMatch(/Rank: <\/dt><dd class="inline">Instructor I/)
    expect(html).not.toContain('Employee ID')
    const blank = render({ academic_year: '2023-2024', area_a_items: [] })
    expect(blank).toMatch(/Status: <\/dt><dd class="inline"><\/dd>/)
    expect(blank).toMatch(/Rank: <\/dt><dd class="inline"><\/dd>/)
  })

  it('exposes accessible toolbar and outline controls', () => {
    const html = render(fixturePortfolio)
    expect(html).toContain('aria-label="Previous page"')
    expect(html).toContain('aria-label="Zoom in"')
    expect(html).toContain('aria-label="Fit page to width"')
    expect(html).toContain('aria-label="Print or save as PDF"')
    expect(html).toMatch(/aria-expanded="(true|false)"/)
  })
})
