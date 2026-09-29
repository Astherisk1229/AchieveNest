import { useState, useMemo, useCallback, useEffect } from 'react'
import portfolioService from '../services/portfolioService'

/** Backend status → coordinator UI label. One label per real backend status. */
export const STATUS_LABELS = Object.freeze({
  submitted: 'Pending',
  revision_requested: 'Returned',
  verified: 'Verified',
  rejected: 'Rejected'
})

export const STATUS_FILTERS = ['All', 'Pending', 'Returned', 'Verified', 'Rejected']

/** Formats an API rejection ({ error: { code, message } }) verbatim for display. */
export function formatApiError(error, fallback = 'The request failed.') {
  const body = error?.error || error?.data?.error || null
  const message = body?.message || error?.message || fallback
  const code = body?.code || null
  return code ? `${message} (${code})` : message
}

export const normalizeQueueRecord = record => {
  const status = String(record.status || '').toLowerCase()
  const evidence = Array.isArray(record.evidence) ? record.evidence : []
  return {
    ...record,
    canonical_status: status,
    status: STATUS_LABELS[status] || status,
    category: record.category_name || record.category || 'Uncategorized',
    date: record.occurrence_date || record.submitted_at || record.created_at,
    student_id: record.student_id_number || record.student_id,
    program: record.program_name || record.program,
    evidence,
    docs_count: Number(record.evidence_count ?? evidence.length),
    attached_file_name: evidence[0]?.original_filename || '',
    return_remarks: record.latest_remarks || record.return_remarks || ''
  }
}

export function useVerification() {
  const [allSubmissions, setAllSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const refreshQueue = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 'all' so the Verified/Rejected filters and metrics reflect real decided records.
      const records = await portfolioService.fetchCoordinatorQueue({ status: 'all' })
      setAllSubmissions(records.map(normalizeQueueRecord))
    } catch (err) {
      setAllSubmissions([])
      setError(formatApiError(err, 'Failed to load verification queue.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refreshQueue() }, [refreshQueue])

  const filteredSubmissions = useMemo(() => allSubmissions.filter(item => {
    const query = searchQuery.trim().toLowerCase()
    const matchesQuery = !query || [item.title, item.student_name, item.student_id, item.category]
      .some(value => String(value || '').toLowerCase().includes(query))
    return matchesQuery && (statusFilter === 'All' || item.status === statusFilter)
  }), [allSubmissions, searchQuery, statusFilter])

  const handleApprove = useCallback(async (id, remarks = '') => {
    await portfolioService.verifyRecord(id, remarks)
    await refreshQueue()
  }, [refreshQueue])

  const handleReturn = useCallback(async (id, remarks) => {
    await portfolioService.requestRevision(id, remarks)
    await refreshQueue()
  }, [refreshQueue])

  const handleReject = useCallback(async (id, remarks) => {
    await portfolioService.rejectRecord(id, remarks)
    await refreshQueue()
  }, [refreshQueue])

  const loadRecordDetail = useCallback(id => portfolioService.fetchRecord(id), [])

  const handleExportCSVReport = useCallback(programScope => {
    const headers = ['Record ID', 'Student ID', 'Student', 'Program', 'Title', 'Status']
    const rows = allSubmissions.map(item => [item.id, item.student_id, item.student_name, item.program, item.title, item.status])
    const csv = [headers, ...rows].map(row => row.map(value => JSON.stringify(value ?? '')).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${String(programScope || 'program').replace(/\W+/g, '_')}_verification_queue.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }, [allSubmissions])

  return {
    allSubmissions, filteredSubmissions, loading, error,
    pendingCount: allSubmissions.filter(item => item.status === 'Pending').length,
    verifiedCount: allSubmissions.filter(item => item.status === 'Verified').length,
    returnedCount: allSubmissions.filter(item => item.status === 'Returned').length,
    rejectedCount: allSubmissions.filter(item => item.status === 'Rejected').length,
    searchQuery, setSearchQuery, statusFilter, setStatusFilter,
    handleApprove, handleReturn, handleReject, loadRecordDetail, handleExportCSVReport, refreshQueue
  }
}
