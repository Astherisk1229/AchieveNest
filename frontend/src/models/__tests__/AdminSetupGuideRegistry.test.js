import { describe, it, expect } from 'vitest'
import ADMIN_SETUP_GUIDES, { getAdminSetupGuide } from '../AdminSetupGuideRegistry'

describe('AdminSetupGuideRegistry', () => {
  it('resolves OSAD guide for osad_staff role string', () => {
    const guide = getAdminSetupGuide('osad_staff')
    expect(guide).not.toBeNull()
    expect(guide.id).toBe('osad-get-started')
    expect(guide.ownerRole).toBe('osad_staff')
    expect(guide.steps).toHaveLength(4)
  })

  it('resolves HR guide for hr_staff role string', () => {
    const guide = getAdminSetupGuide('hr_staff')
    expect(guide).not.toBeNull()
    expect(guide.id).toBe('hr-get-started')
    expect(guide.ownerRole).toBe('hr_staff')
    expect(guide.steps).toHaveLength(4)
  })

  it('resolves OSAD guide from user object with active_role_context', () => {
    const user = { active_role_context: 'osad_staff', primary_role: 'personnel' }
    const guide = getAdminSetupGuide(user)
    expect(guide).not.toBeNull()
    expect(guide.id).toBe('osad-get-started')
  })

  it('resolves HR guide from user object with active_role_context', () => {
    const user = { active_role_context: 'hr_staff', primary_role: 'personnel' }
    const guide = getAdminSetupGuide(user)
    expect(guide).not.toBeNull()
    expect(guide.id).toBe('hr-get-started')
  })

  it('returns null for unsupported roles (student, personnel)', () => {
    expect(getAdminSetupGuide('student')).toBeNull()
    expect(getAdminSetupGuide('personnel')).toBeNull()
    expect(getAdminSetupGuide('program_coordinator')).toBeNull()
    expect(getAdminSetupGuide({ active_role_context: 'student' })).toBeNull()
  })

  it('ensures OSAD and HR step collections are distinct and valid', () => {
    const osadSteps = ADMIN_SETUP_GUIDES.osad_staff.steps
    const hrSteps = ADMIN_SETUP_GUIDES.hr_staff.steps

    expect(osadSteps.map(s => s.id)).toEqual([
      'osad_step_1_structure',
      'osad_step_2_students',
      'osad_step_3_coordinators',
      'osad_step_4_organizations'
    ])

    expect(hrSteps.map(s => s.id)).toEqual([
      'hr_step_1_personnel',
      'hr_step_2_college_placement',
      'hr_step_3_deans',
      'hr_step_4_secretaries'
    ])
  })
})
