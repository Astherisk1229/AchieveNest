import { describe, expect, it, vi } from 'vitest'
import { applyPersonnelFilters, NOT_RECORDED, uniquePersonnel } from '../personnelDirectoryFilters'

// Isolated fixtures shaped like GET /hr/personnel rows.
const people = [
  { id: 'F1', personnel_group: 'faculty', faculty_engagement: 'full_time_faculty', employment_status: 'permanent', college_id: 'CET', college_code: 'CET', administrative_unit_id: 'CS', assigned_roles: ['dean'], status: 'active' },
  { id: 'F2', personnel_group: 'faculty', faculty_engagement: 'part_time_faculty', employment_status: 'probationary', college_id: 'CET', administrative_unit_id: 'CE', assigned_roles: ['program_coordinator'], status: 'suspended' },
  // College known only through the department (server COALESCE) — must still match the College filter.
  { id: 'F3', personnel_group: 'faculty', faculty_engagement: 'full_time_faculty', employment_status: null, college_id: 'CAS', administrative_unit_id: 'BIO', assigned_roles: [], status: 'inactive' },
  { id: 'N1', personnel_group: 'non_teaching_faculty', faculty_engagement: null, employment_status: 'permanent', college_id: null, administrative_unit_id: 'HRD', assigned_roles: [{ role_key: 'organization_moderator' }], status: 'archived' }
]
const ids = (filters) => applyPersonnelFilters(people, filters).map(p => p.id)

describe('HR Personnel Directory filters', () => {
  it('returns everyone when no filter is set', () => {
    expect(ids({})).toEqual(['F1', 'F2', 'F3', 'N1'])
  })

  it('filters by resolved personnel group', () => {
    expect(ids({ group: 'faculty' })).toEqual(['F1', 'F2', 'F3'])
    expect(ids({ group: 'non_teaching_faculty' })).toEqual(['N1'])
  })

  it('filters by employment type (faculty_engagement)', () => {
    expect(ids({ engagement: 'full_time_faculty' })).toEqual(['F1', 'F3'])
    expect(ids({ engagement: 'part_time_faculty' })).toEqual(['F2'])
  })

  it('filters by appointment and finds personnel with no recorded appointment', () => {
    expect(ids({ appointment: 'permanent' })).toEqual(['F1', 'N1'])
    expect(ids({ appointment: 'probationary' })).toEqual(['F2'])
    expect(ids({ appointment: NOT_RECORDED })).toEqual(['F3'])
  })

  it('filters by college, including a College reached through the department', () => {
    expect(ids({ college: 'CET' })).toEqual(['F1', 'F2'])
    expect(ids({ college: 'CAS' })).toEqual(['F3'])
  })

  it('filters by department, role, and account status (including inactive)', () => {
    expect(ids({ department: 'HRD' })).toEqual(['N1'])
    expect(ids({ role: 'dean' })).toEqual(['F1'])
    expect(ids({ role: 'organization_moderator' })).toEqual(['N1'])
    expect(ids({ status: 'inactive' })).toEqual(['F3'])
    expect(ids({ status: 'archived' })).toEqual(['N1'])
  })

  it('never treats the account status as an appointment', () => {
    expect(ids({ status: 'permanent' })).toEqual([])
    expect(ids({ appointment: 'active' })).toEqual([])
  })

  it('combines filters', () => {
    expect(ids({ group: 'faculty', college: 'CET', appointment: 'permanent' })).toEqual(['F1'])
  })

  it('collapses duplicate rows for the same person', () => {
    expect(uniquePersonnel([{ id: 'A' }, { id: 'A' }, { id: 'B' }]).map(p => p.id)).toEqual(['A', 'B'])
  })
})

describe('Personnel directory loading', () => {
  it('loads every page so filters see all personnel', async () => {
    vi.resetModules()
    const pages = { 1: { total: 230, personnel: Array.from({ length: 100 }, (_, i) => ({ id: `p${i}` })) }, 2: { total: 230, personnel: Array.from({ length: 100 }, (_, i) => ({ id: `p${100 + i}` })) }, 3: { total: 230, personnel: Array.from({ length: 30 }, (_, i) => ({ id: `p${200 + i}` })), summary: { total_personnel: 230 } } }
    vi.doMock('../../services/hrAdminService', () => ({
      fetchPersonnelDirectory: vi.fn(async ({ page }) => ({ data: pages[page] })),
      fetchHRAudit: vi.fn(), fetchHRDashboard: vi.fn(), assignDeanRole: vi.fn(), revokeDeanRole: vi.fn()
    }))
    const { fetchAllPersonnelDirectoryPages } = await import('../../hooks/useHR')
    const result = await fetchAllPersonnelDirectoryPages()
    expect(result.data.personnel).toHaveLength(230)
    expect(result.data.total).toBe(230)
  })
})
