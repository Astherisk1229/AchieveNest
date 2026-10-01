import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')

describe('OSAD College archive lifecycle', () => {
  it('uses the governed lifecycle API and refreshes authoritative College state', () => {
    const service = source('../../../services/collegeAdminService.js')
    const dashboard = source('../OSADDashboardPage.jsx')
    expect(service).toContain('`/osad/colleges/${id}/status`')
    expect(dashboard).toContain('await apiUpdateCollegeStatus(college.id, status)')
    expect(dashboard).toContain('await loadPersistentColleges()')
  })

  it('explains non-destructive archive behavior and preserves reactivation', () => {
    const detail = source('../OSADCollegeDetailsView.jsx')
    expect(detail).toContain('Existing academic programs, student records, and historical data will remain unchanged. No records will be deleted.')
    expect(detail).toContain("performLifecycleChange('inactive')")
    expect(detail).toContain("performLifecycleChange('active')")
    expect(detail).toContain('<ConfirmDialog')
    expect(detail).not.toContain('window.confirm')
    expect(detail).toContain('Reactivate College')
  })

  it('excludes archived Colleges from new operational selectors without hiding the structure grid', () => {
    const dashboard = source('../OSADDashboardPage.jsx')
    const structure = source('../OSADAcademicProgramsPage.jsx')
    expect(dashboard).toContain("persistentColleges.filter((college) => college.status === 'active')")
    expect(structure).toContain('colleges.map((college) =>')
    expect(structure).toContain("const isArchived = college.status === 'inactive'")
  })
})
