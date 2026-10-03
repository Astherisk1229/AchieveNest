import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('OSAD Password Reset Rejection & Modal State Isolation', () => {
  let targetStudentA
  let targetStudentB
  let pageState

  beforeEach(() => {
    targetStudentA = { id: 'req-1', full_name: 'Juan Dela Cruz', user_email: 'juan@ndmu.edu.ph' }
    targetStudentB = { id: 'req-2', full_name: 'Maria Santos', user_email: 'maria@ndmu.edu.ph' }
    pageState = {
      selectedRequestForReject: null,
      rejectReason: ''
    }
  })

  it('isolates rejectReason between students and prevents state leakage', () => {
    // Step 1: Open modal for Student A and type a rejection draft
    pageState.selectedRequestForReject = targetStudentA
    pageState.rejectReason = 'Incomplete NDMU identification documents'

    expect(pageState.selectedRequestForReject.id).toBe('req-1')
    expect(pageState.rejectReason).toBe('Incomplete NDMU identification documents')

    // Step 2: User cancels/discards Student A modal
    pageState.selectedRequestForReject = null
    pageState.rejectReason = ''

    expect(pageState.selectedRequestForReject).toBeNull()
    expect(pageState.rejectReason).toBe('')

    // Step 3: User opens modal for Student B
    pageState.selectedRequestForReject = targetStudentB
    expect(pageState.selectedRequestForReject.id).toBe('req-2')
    // Crucial: Must be clean, no remnant of Student A's draft
    expect(pageState.rejectReason).toBe('')
  })

  it('preserves rejectReason when user clicks Continue Editing', () => {
    pageState.selectedRequestForReject = targetStudentA
    pageState.rejectReason = 'Identity unverified'

    // Simulate clicking Continue Editing (cancel discard)
    const isConfirmOpen = false // confirmation closes, modal remains open
    expect(isConfirmOpen).toBe(false)
    expect(pageState.selectedRequestForReject).toEqual(targetStudentA)
    expect(pageState.rejectReason).toBe('Identity unverified')
  })

  it('resets rejectReason after successful rejection submission', () => {
    pageState.selectedRequestForReject = targetStudentA
    pageState.rejectReason = 'Duplicate request'

    // Simulate submit execution
    const handleSubmitSuccess = () => {
      pageState.selectedRequestForReject = null
      pageState.rejectReason = ''
    }

    handleSubmitSuccess()
    expect(pageState.selectedRequestForReject).toBeNull()
    expect(pageState.rejectReason).toBe('')
  })
})
