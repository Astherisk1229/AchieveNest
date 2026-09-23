import { useState, useMemo, useCallback, useEffect } from 'react'
import portfolioService from '../services/portfolioService'

const normalize = record => ({
  ...record,
  status: record.status === 'verified' ? 'Verified'
    : record.status === 'revision_requested' ? 'Returned'
      : record.status === 'rejected' ? 'Rejected' : 'Pending',
  category: record.category_name || record.category || 'Uncategorized',
  date: record.occurrence_date || record.submitted_at || record.created_at,
  student_id: record.student_id_number || record.student_id,
  program: record.program_name || record.program,
  attached_file_name: record.evidence?.[0]?.original_filename || '',
  return_remarks: record.latest_remarks || record.return_remarks || ''
})

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
      const records = await portfolioService.fetchCoordinatorQueue()
      setAllSubmissions(records.map(normalize))
    } catch (err) {
      setAllSubmissions([])
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load verification queue.')
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
    searchQuery, setSearchQuery, statusFilter, setStatusFilter,
    handleApprove, handleReturn, handleExportCSVReport, refreshQueue
  }
}
