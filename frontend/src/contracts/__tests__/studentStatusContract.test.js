import { describe, it, expect } from 'vitest'
import { resolveStudentAccountStatus, STUDENT_ACCOUNT_STATUSES } from '../studentStatusContract'

describe('Plan 10 Phase 4 — Student Account Status Contract & Presentation', () => {
  it('maps active status with must_change_password=true to Pending First Login', () => {
    const res = resolveStudentAccountStatus('active', true)
    expect(res.statusKey).toBe(STUDENT_ACCOUNT_STATUSES.PENDING_FIRST_LOGIN)
    expect(res.label).toBe('Pending First Login')
    expect(res.isPendingFirstLogin).toBe(true)
    expect(res.badgeClass).toContain('amber')
  })

  it('maps active status with must_change_password=false to Active', () => {
    const res = resolveStudentAccountStatus('active', false)
    expect(res.statusKey).toBe(STUDENT_ACCOUNT_STATUSES.ACTIVE)
    expect(res.label).toBe('Active')
    expect(res.isPendingFirstLogin).toBe(false)
    expect(res.badgeClass).toContain('emerald')
  })

  it('maps locked, suspended, and archived statuses correctly', () => {
    expect(resolveStudentAccountStatus('locked', false).label).toBe('Locked')
    expect(resolveStudentAccountStatus('suspended', false).label).toBe('Suspended')
    expect(resolveStudentAccountStatus('archived', false).label).toBe('Archived')
  })

  it('safely maps unrecognized and null statuses to Unknown without defaulting to Active', () => {
    expect(resolveStudentAccountStatus('unsupported_value', false).label).toBe('Unknown')
    expect(resolveStudentAccountStatus(null, false).label).toBe('Unknown')
    expect(resolveStudentAccountStatus('', false).label).toBe('Unknown')
    expect(resolveStudentAccountStatus(undefined, false).label).toBe('Unknown')
  })
})
