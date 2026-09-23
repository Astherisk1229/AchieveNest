import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { provisioningService } from '../../../services/provisioningService'
import OSADController from '../../../controllers/OSADController'

describe('Plan 03 Phase 5 — Backend Projection & Provisioning Alignment (Frontend Contract)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provisioningService exposes fetchStudents endpoint method', () => {
    expect(typeof provisioningService.fetchStudents).toBe('function')
  })

  it('provisioningService exposes provisionManualStudent endpoint method', () => {
    expect(typeof provisioningService.provisionManualStudent).toBe('function')
  })

  it('OSADController.getUsers returns students with full normalized contract fields including sex', () => {
    const students = OSADController.getUsers('student', '', 'all', 'name')
    expect(students.length).toBeGreaterThan(0)

    const firstStudent = students[0]
    expect(firstStudent).toHaveProperty('student_id')
    expect(firstStudent).toHaveProperty('full_name')
    expect(firstStudent).toHaveProperty('email')
    expect(firstStudent).toHaveProperty('sex')
    expect(firstStudent).toHaveProperty('college')
    expect(firstStudent).toHaveProperty('program')
    expect(firstStudent).toHaveProperty('year_level')
    expect(firstStudent).toHaveProperty('status')
  })
})
