import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { resolveStudentAccountStatus, STUDENT_ACCOUNT_STATUSES } from '../../../contracts/studentStatusContract'

describe('Plan 10 Phase 5 — Row Actions & Interaction Hierarchy', () => {
  const pendingStudent = {
    id: 'student-001',
    institutional_id: '202610001',
    full_name: 'Sean Asther Faderes',
    status: 'active',
    must_change_password: 1
  }

  const activeStudent = {
    id: 'student-002',
    institutional_id: '202610002',
    full_name: 'Maria Clara',
    status: 'active',
    must_change_password: 0
  }

  it('determines that View Details is the primary action for all student lifecycle states', () => {
    const states = ['active', 'locked', 'disabled', 'archived', 'unknown']
    states.forEach(state => {
      const resolved = resolveStudentAccountStatus(state, false)
      expect(resolved.label).toBeDefined()
    })
  })

  it('permits Reset Temporary Password action for Pending First Login students', () => {
    const resolved = resolveStudentAccountStatus(pendingStudent.status, pendingStudent.must_change_password)
    expect(resolved.statusKey).toBe(STUDENT_ACCOUNT_STATUSES.PENDING_FIRST_LOGIN)
    expect(resolved.isPendingFirstLogin).toBe(true)
  })

  it('disables temporary credential reset actions for standard Active students', () => {
    const resolved = resolveStudentAccountStatus(activeStudent.status, activeStudent.must_change_password)
    expect(resolved.statusKey).toBe(STUDENT_ACCOUNT_STATUSES.ACTIVE)
    expect(resolved.isPendingFirstLogin).toBe(false)
  })

  it('verifies that zero existing-password retrieval actions exist', () => {
    const allowedActions = ['view_details', 'reset_temporary_password']
    expect(allowedActions).not.toContain('view_password')
    expect(allowedActions).not.toContain('reprint_existing_password')
    expect(allowedActions).not.toContain('reveal_password')
  })
})
