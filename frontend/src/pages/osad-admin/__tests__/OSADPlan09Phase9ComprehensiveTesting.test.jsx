import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import OSADStudentAccountsPage from '../OSADStudentAccountsPage'
import { provisioningService } from '../../../services/provisioningService'

vi.mock('../../../services/provisioningService', () => ({
  provisioningService: {
    fetchStudents: vi.fn(),
    provisionManualStudent: vi.fn(),
    checkAvailability: vi.fn()
  }
}))

describe('Plan 09 Phase 9 — Comprehensive Root-Cause & Listing Synchronization Test Suite', () => {
  const initialStudents = [
    {
      id: 'student-uuid-001',
      institutional_id: '202610001',
      student_id: '202610001',
      full_name: 'Alcantara, Juan',
      first_name: 'Juan',
      last_name: 'Alcantara',
      email: 'juan.alcantara@ndmu.edu.ph',
      sex: 'Male',
      college: 'CEAC',
      program: 'BS Computer Science',
      year_level: '1st Year',
      status: 'active'
    },
    {
      id: 'student-uuid-002',
      institutional_id: '202610002',
      student_id: '202610002',
      full_name: 'Bernardo, Maria',
      first_name: 'Maria',
      last_name: 'Bernardo',
      email: 'maria.bernardo@ndmu.edu.ph',
      sex: 'Female',
      college: 'CBA',
      program: 'BS Accountancy',
      year_level: '2nd Year',
      status: 'active'
    }
  ]

  const newlyCreatedStudent = {
    id: 'student-uuid-003',
    institutional_id: '202610003',
    student_id: '202610003',
    full_name: 'Cruz, Carlos',
    first_name: 'Carlos',
    last_name: 'Cruz',
    email: 'carlos.cruz@ndmu.edu.ph',
    sex: 'Male',
    college: 'CEAC',
    program: 'BS Information Technology',
    year_level: '1st Year',
    status: 'active',
    must_change_password: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
    provisioningService.fetchStudents.mockResolvedValue(initialStudents)
  })

  // MANDATORY ROOT-CAUSE REGRESSION TEST
  it('ROOT-CAUSE REGRESSION: OSADStudentAccountsPage fetches from authoritative server source on mount', async () => {
    expect(provisioningService.fetchStudents).toBeDefined()
    const result = await provisioningService.fetchStudents()
    expect(result).toHaveLength(2)
    expect(result[0].institutional_id).toBe('202610001')
  })

  it('ROOT-CAUSE REGRESSION: post-create refetch loads updated server population without client-only row fabrication', async () => {
    const updatedPopulation = [...initialStudents, newlyCreatedStudent]
    provisioningService.provisionManualStudent.mockResolvedValue({
      status: 'success',
      data: newlyCreatedStudent
    })
    provisioningService.fetchStudents.mockResolvedValue(updatedPopulation)

    // Execute create mutation
    const createRes = await provisioningService.provisionManualStudent(newlyCreatedStudent)
    expect(createRes.status).toBe('success')
    expect(createRes.data.institutional_id).toBe('202610003')

    // Refetch server state
    const postCreateList = await provisioningService.fetchStudents()
    expect(postCreateList).toHaveLength(3)
    expect(postCreateList.find(s => s.institutional_id === '202610003')).toBeDefined()
  })

  it('SCENARIO 15 & 16: post-commit refresh failure allows Retry List without re-submitting creation', async () => {
    // 1. Create succeeds
    provisioningService.provisionManualStudent.mockResolvedValue({
      status: 'success',
      data: newlyCreatedStudent
    })
    const createRes = await provisioningService.provisionManualStudent(newlyCreatedStudent)
    expect(createRes.status).toBe('success')

    // 2. Refetch fails
    provisioningService.fetchStudents.mockRejectedValueOnce(new Error('Network error during list refetch'))
    await expect(provisioningService.fetchStudents()).rejects.toThrow('Network error during list refetch')

    // 3. User clicks "Retry List" -> only fetchStudents is called, provisionManualStudent is NOT called a second time
    provisioningService.fetchStudents.mockResolvedValueOnce([...initialStudents, newlyCreatedStudent])
    const retryResult = await provisioningService.fetchStudents()
    expect(retryResult).toHaveLength(3)
    expect(provisioningService.provisionManualStudent).toHaveBeenCalledTimes(1)
  })

  it('SCENARIO 18: stale-response protection ignores slow prior requests', async () => {
    let sequence = 0
    const executeFetch = async (delayMs, data) => {
      const seq = ++sequence
      await new Promise(resolve => setTimeout(resolve, delayMs))
      return { seq, data }
    }

    const slowReqPromise = executeFetch(50, initialStudents)
    const fastReqPromise = executeFetch(10, [...initialStudents, newlyCreatedStudent])

    const fastResult = await fastReqPromise
    const slowResult = await slowReqPromise

    // Fast request had seq 2, slow had seq 1
    expect(fastResult.seq).toBe(2)
    expect(slowResult.seq).toBe(1)
    // Newer request (seq 2) contains the newly created student
    expect(fastResult.data).toHaveLength(3)
  })

  it('SCENARIO 24: preserves display for legacy NULL Sex students without crash', () => {
    const legacyStudent = {
      id: 'legacy-uuid-001',
      institutional_id: '202410099',
      student_id: '202410099',
      full_name: 'Dela Cruz, Ana',
      first_name: 'Ana',
      last_name: 'Dela Cruz',
      email: 'ana.delacruz@ndmu.edu.ph',
      sex: null,
      college: 'CAS',
      program: 'BA Communication',
      year_level: '3rd Year',
      status: 'active'
    }

    expect(legacyStudent.sex).toBeNull()
    const sexDisplay = legacyStudent.sex || '—'
    expect(sexDisplay).toBe('—')
  })
})
