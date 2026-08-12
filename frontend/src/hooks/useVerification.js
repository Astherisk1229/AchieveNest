import { useState, useMemo, useCallback } from 'react'
import VerificationController from '../controllers/VerificationController'

/**
 * useVerification.js
 * Custom React Hook bridging View components to VerificationController & VerificationQueueModel.
 */
export function useVerification(initialSubmissions = []) {
  const [controller] = useState(() => new VerificationController(initialSubmissions))
  const [, setRevision] = useState(0)
  const forceUpdate = useCallback(() => setRevision(r => r + 1), [])

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const pendingCount = controller.getPendingCount()
  const verifiedCount = controller.getVerifiedCount()
  const returnedCount = controller.getReturnedCount()

  const allSubmissions = useMemo(() => {
    return controller.queueModel.items.map(item => item.toJSON())
  }, [controller, forceUpdate])

  const filteredSubmissions = useMemo(() => {
    return controller.getFilteredSubmissions(searchQuery, statusFilter).map(item => item.toJSON())
  }, [controller, searchQuery, statusFilter, forceUpdate])

  const handleApprove = useCallback((id) => {
    controller.approveSubmission(id)
    forceUpdate()
  }, [controller, forceUpdate])

  const handleReturn = useCallback((id, remarks) => {
    controller.returnSubmission(id, remarks)
    forceUpdate()
  }, [controller, forceUpdate])

  const handleExportCSVReport = useCallback((programScope) => {
    controller.exportCSV(programScope)
  }, [controller])

  return {
    allSubmissions,
    filteredSubmissions,
    pendingCount,
    verifiedCount,
    returnedCount,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    handleApprove,
    handleReturn,
    handleExportCSVReport
  }
}
