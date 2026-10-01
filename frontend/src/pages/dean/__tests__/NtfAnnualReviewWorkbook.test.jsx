import React from 'react'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { filterNtfPersonnel, NtfAreaABreakdown, NtfPrefilledDownloadDialog, NtfWorkbookPanel, ntfOrganization, ntfRequiredYears, ntfUnit } from '../NtfAnnualReviewWorkbook'
import CriterionEvaluation from '../../hr-admin/evaluation-submissions/studio/evaluation/CriterionEvaluation'
import { annualReviewRatingResult } from '../../../utils/annualReviewModal'

const root = path.resolve(import.meta.dirname, '../../../../..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')

const payload = {
  school_years: ['2025-2026', '2026-2027'], area_max: 90,
  items: [{ code: 'A.1', name: 'Job Performance', max_points: 50, ds: [75, 82], points: [37.5, 41], average_points: 39.25 }],
  totals: [64.9, 72.7], percentages: [72.11, 80.78], average_total: 68.8, rating_scale: { version: 1, is_provisional: true },
}

describe('NTF annual review workbook', () => {
  it('uses the same two school years as the backend import rule', () => {
    expect(ntfRequiredYears('2027-2028')).toEqual(['2025-2026', '2026-2027'])
    expect(ntfRequiredYears('bad')).toEqual([])
  })

  it('offers blank, selective prefilled downloads, and template settings', () => {
    const html = renderToStaticMarkup(<NtfWorkbookPanel periodId="p1" academicYear="2027-2028" locked={false}/>)
    for (const text of ['NTF annual review workbook', 'Blank Template', 'Download Prefilled Workbooks', 'Template Settings', 'SY 2025-2026 &amp; SY 2026-2027']) expect(html).toContain(text)
    expect(html).not.toContain('All Prefilled (.zip)')
  })

  it('renders the selective modal with authoritative personnel fields and a disabled empty download', () => {
    const personnel = [
      { id: 'college-1', institutional_id: 'NTF-002', full_name: 'John Reyes', first_name: 'John', last_name: 'Reyes', college_name: 'College of Business', department_name: 'Accounting', position_title: 'Analyst', employment_status: 'permanent' },
      { id: 'office-1', institutional_id: 'NTF-003', full_name: 'Angela Cruz', first_name: 'Angela', last_name: 'Cruz', college_name: null, department_name: 'Office of Student Affairs', position_title: 'Coordinator', employment_status: 'probationary' },
    ]
    const html = renderToStaticMarkup(<NtfPrefilledDownloadDialog periodId="p1" academicYear="2027-2028" personnel={personnel} onClose={() => {}} returnFocusRef={{ current: null }} />)
    for (const text of ['Download Prefilled NTF Workbooks', 'Search by name or employee ID...', 'College / Office', 'Department / Unit', 'NTF-002', 'College of Business', 'Accounting', 'Office of Student Affairs', 'Browser download location', 'Choose folder']) expect(html).toContain(text)
    expect(html).toContain('disabled=""')
  })

  it('derives organization display and filters from existing roster fields', () => {
    const people = [
      { id: 'c', full_name: 'John Reyes', institutional_id: 'NTF-002', college_name: 'CBA', department_name: 'Accounting', employment_status: 'permanent' },
      { id: 'o', full_name: 'Angela Cruz', institutional_id: 'NTF-003', college_name: null, department_name: 'Student Affairs', employment_status: 'probationary' },
    ]
    expect(ntfOrganization(people[0])).toBe('CBA')
    expect(ntfUnit(people[0])).toBe('Accounting')
    expect(ntfOrganization(people[1])).toBe('Student Affairs')
    expect(ntfUnit(people[1])).toBe('')
    expect(filterNtfPersonnel(people, { search: 'NTF-003', organization: '', unit: '', status: '' }).map(person => person.id)).toEqual(['o'])
    expect(filterNtfPersonnel(people, { search: '', organization: 'CBA', unit: 'Accounting', status: 'permanent' }).map(person => person.id)).toEqual(['c'])
  })

  it('shows the recalculated Area A breakdown and the provisional scale version', () => {
    const html = renderToStaticMarkup(<NtfAreaABreakdown payload={payload}/>)
    expect(html).toContain('A.1 Job Performance')
    expect(html).toContain('75.00 → 37.50')
    expect(html).toContain('39.25')
    expect(html).toContain('72.11%')
    expect(html).toContain('AchieveNest provisional scale')
  })

  it('treats the NTF Unsatisfactory rating as not passing', () => {
    expect(annualReviewRatingResult('unsatisfactory')).toBe('not_passed')
  })

  it('renders locked Area A evaluation items read-only', () => {
    const item = { id: 'i1', domain: 'ntf_annual_review', criterion_code: 'A.1', criterion_title: 'Job Performance', accepted_points: '45.00', category_area: 'areaA', scoring_payload: JSON.stringify({ locked: true, source: 'ntf_annual_review_workbook', ds: [92, 88], points: [46, 44], school_years: ['2025-2026', '2026-2027'] }) }
    const html = renderToStaticMarkup(<CriterionEvaluation selectedEvidence={item}/>)
    expect(html).toContain('Locked')
    expect(html).toContain('45.00')
    expect(html).toContain('DS 92 → 46 pts')
    expect(html).not.toContain('Confirm')
  })

  it('wires the HR-only NTF panel into the shared annual reviews page', () => {
    const page = read('frontend/src/pages/dean/DeanAnnualReviewEligibilityPage.jsx')
    expect(page).toContain("state.data?.authority_type === 'HR'")
    expect(page).toContain('<NtfWorkbookPanel')
    expect(page).toContain('<NtfPrefilledButton')
    expect(page).toContain('<NtfAreaABreakdown payload={preview.area_a_payload} />')
  })

  it('keeps the backend contract: NTF parser, locked items and HR-only routes', () => {
    const importer = read('backend/app/Services/AnnualReviewImportService.php')
    expect(importer).toContain('NtfAnnualReviewWorkbookParser')
    const controller = read('backend/app/Controllers/Api/HREvaluationController.php')
    expect(controller).toContain('ITEM_LOCKED')
    const routes = read('backend/app/Config/Routes.php')
    for (const route of ["'hr/ntf-annual-review/settings'", "'hr/ntf-annual-review/tracks/(:segment)/template'", "$routes->post('hr/ntf-annual-review/tracks/(:segment)/template/prefilled.zip'"]) expect(routes).toContain(route)
  })
})
