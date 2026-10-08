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
  it('renders the two official HR pages and every attached proof in one scrollable canvas', () => {
    const html = render(fixturePortfolio)
    // 2 formal Faculty pages + 1 supporting evidence page, all present on screen at once
    expect(html.match(/data-page-index="/g)).toHaveLength(3)
    expect(html).toContain('FACULTY DEVELOPMENT PROGRAM')
    expect(html).toContain('Signature over Printed Name')
    expect(html).toContain('id="booklet-area-A"')
    expect(html).toContain('id="booklet-area-B"')
    expect(html).toContain('id="booklet-area-C"')
    expect(html).toContain('id="booklet-proof-acc-a1"')
    expect(html).toMatch(/1<!-- --> \/ <!-- -->3/)
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

  it('places Area A and B.1 on formal page 1, with remaining B and C plus signature on page 2', () => {
    const html = render(fixturePortfolio)
    const firstPageStart = html.indexOf('data-page-index="0"')
    const secondPageStart = html.indexOf('data-page-index="1"')
    const proofPageStart = html.indexOf('data-page-index="2"')
    const firstPage = html.slice(firstPageStart, secondPageStart)
    const secondPage = html.slice(secondPageStart, proofPageStart)
    expect(firstPage).toContain('A. PROFESSIONAL DEVELOPMENT')
    expect(firstPage).toContain('A.1 Education')
    expect(firstPage).toContain('B. PRODUCTIVITY AND CREATIVE WORK')
    expect(firstPage).toContain('B.1 Guest Lecturer / Consultant / Judge / Resource Person')
    expect(firstPage).not.toContain('B.2 Publication')
    expect(secondPage).toContain('B.2 Publication')
    expect(secondPage).toContain('C. SERVICE AND LEADERSHIP')
    expect(secondPage).toContain('Signature over Printed Name')
  })

  it('orders Faculty proof pages newest first', () => {
    const format = resolveBookletFormat(facultyUser, {})
    const pages = buildBookletPages(format, [
      { accomplishmentId: 'older-proof', evidence: { id: 'proof-old' }, source: { occurrence_date: '2024-04-01' } },
      { accomplishmentId: 'newer-proof', evidence: { id: 'proof-new' }, source: { occurrence_date: '2026-04-01' } }
    ])
    expect(pages.slice(2).map((page) => page.item.accomplishmentId)).toEqual(['newer-proof', 'older-proof'])
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
    expect(html.match(/data-page-index="/g)).toHaveLength(2)
    expect(html).toContain('A.1 Education')
    expect(html).toContain('C.3 Years of Service at NDMU')
    expect(html).toContain('No accomplishments recorded.')
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
    expect(printCopy.match(/class="booklet-page/g)).toHaveLength(3)
    expect(printCopy).not.toContain('View Proof')
    expect(printCopy).not.toContain('id="booklet-')
    expect(printCopy).not.toContain('<a ')
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
