import React, { useState, useEffect, useMemo } from 'react'
import {
  KeyRound,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  User,
  ExternalLink,
  Lock
} from 'lucide-react'
import {
  fetchPasswordResetRequests,
  executePasswordReset,
  rejectPasswordReset
} from '../../services/passwordResetAdminService'

export default function OSADPasswordResetRequestsPage() {
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending') // 'pending' | 'completed' | 'rejected' | 'all'

  // Modal states
  const [selectedRequestForReset, setSelectedRequestForReset] = useState(null)
  const [isResetting, setIsResetting] = useState(false)
  const [resetResult, setResetResult] = useState(null) // { temporary_password, full_name, institutional_email }
  const [copiedPassword, setCopiedPassword] = useState(false)

  const [selectedRequestForReject, setSelectedRequestForReject] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const loadRequests = async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      const data = await fetchPasswordResetRequests(statusFilter)
      setRequests(data || [])
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load password reset requests.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [statusFilter])

  const filteredRequests = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return requests

    return requests.filter(r =>
      (r.full_name || '').toLowerCase().includes(term) ||
      (r.institutional_id || '').toLowerCase().includes(term) ||
      (r.institutional_email || '').toLowerCase().includes(term) ||
      (r.degree_program_id || '').toLowerCase().includes(term)
    )
  }, [requests, searchTerm])

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const completedCount = requests.filter(r => r.status === 'completed').length

  const handleExecuteReset = async () => {
    if (!selectedRequestForReset) return
    setIsResetting(true)
    setErrorMsg('')
    try {
      const res = await executePasswordReset(selectedRequestForReset.id)
      setResetResult(res)
      await loadRequests()
    } catch (err) {
      setErrorMsg(err.message || 'Failed to execute password reset.')
    } finally {
      setIsResetting(false)
    }
  }

  const handleExecuteReject = async () => {
    if (!selectedRequestForReject) return
    setIsRejecting(true)
    setErrorMsg('')
    try {
      await rejectPasswordReset(selectedRequestForReject.id, rejectReason)
      setSelectedRequestForReject(null)
      setRejectReason('')
      await loadRequests()
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reject request.')
    } finally {
      setIsRejecting(false)
    }
  }

  const handleCopyPassword = (pwd) => {
    navigator.clipboard.writeText(pwd)
    setCopiedPassword(true)
    setTimeout(() => setCopiedPassword(false), 2000)
  }

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#16834a] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
            <KeyRound className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Student Password Reset Requests
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-[#16834a] dark:text-emerald-400 text-[10px] font-black uppercase">
                OSAD Authority
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Review institutional password reset requests submitted by enrolled students.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadRequests}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-[#16834a] text-white shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Requests ({pendingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'completed'
                ? 'bg-[#16834a] text-white shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'rejected'
                ? 'bg-[#16834a] text-white shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#16834a] text-white shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            All History
          </button>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name or ID..."
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a] transition"
          />
        </div>
      </div>

      {/* Requests Directory Table */}
      <div className="bg-white dark:bg-[#131e2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#16834a]" />
            <span>Student Verification Queue</span>
          </h3>
          <span className="text-[11px] font-bold text-slate-400">
            {filteredRequests.length} Requests Listed
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#16834a]" />
              <span>Loading password reset requests...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              No password reset requests match the selected filter.
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isPending = req.status === 'pending'
              const isCompleted = req.status === 'completed'
              const isRejected = req.status === 'rejected'

              return (
                <div
                  key={req.id}
                  className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0 md:w-1/3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center font-bold shrink-0">
                      <User className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {req.full_name || 'Student User'}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                          {req.institutional_id || 'ID Pending'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                        {req.institutional_email}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 text-xs space-y-0.5 md:px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400">Requested:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">
                        {new Date(req.requested_at).toLocaleString()}
                      </span>
                    </div>
                    {isCompleted && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">Completed by:</span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {req.handler_name || 'OSAD Administrator'} on {new Date(req.completed_at || req.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {isRejected && req.rejection_reason && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="font-bold text-rose-600">Reason:</span>
                        <span className="text-slate-600 dark:text-slate-400 truncate">{req.rejection_reason}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0 self-end md:self-auto">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequestForReject(req)
                            setRejectReason('')
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 text-xs font-extrabold transition cursor-pointer border border-rose-200 dark:border-rose-800"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequestForReset(req)
                            setResetResult(null)
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white text-xs font-extrabold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Reset Password</span>
                        </button>
                      </>
                    ) : isCompleted ? (
                      <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-xs font-black flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs font-extrabold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rejected</span>
                      </span>
                    )}
                  </div>

                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Execute Reset Modal */}
      {selectedRequestForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
          <div className="relative w-full max-w-md bg-white dark:bg-[#131e2e] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white">
            
            {/* Header */}
            <div className="px-6 py-4 bg-[#064e2b] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-emerald-300" />
                <h3 className="font-extrabold text-base">Issue Temporary Password</h3>
              </div>
              {!resetResult && (
                <button
                  type="button"
                  onClick={() => setSelectedRequestForReset(null)}
                  className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              {resetResult ? (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>

                  <div>
                    <h4 className="font-black text-base text-slate-900 dark:text-white">
                      Temporary Password Generated
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      For student: <strong>{resetResult.full_name || selectedRequestForReset.full_name}</strong> ({resetResult.institutional_email || selectedRequestForReset.institutional_email})
                    </p>
                  </div>

                  {/* Temporary Password Box */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      One-Time Temporary Password
                    </span>
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-mono text-lg font-black text-emerald-400 tracking-wider">
                        {resetResult.temporary_password}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyPassword(resetResult.temporary_password)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedPassword ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPassword ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-left text-amber-900 dark:text-amber-300 font-medium space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Important Security Notice</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      This temporary password will only be shown once and is not stored in the database. Provide it securely to the verified student. The student will be required to create a permanent password upon logging in.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRequestForReset(null)
                      setResetResult(null)
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#064e2b] hover:bg-[#16834a] text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    You are about to issue a temporary password for student{' '}
                    <strong className="text-slate-900 dark:text-white">{selectedRequestForReset.full_name}</strong> ({selectedRequestForReset.institutional_email}).
                  </p>

                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-[#16834a] shrink-0 mt-0.5" />
                    <span>
                      Please verify the student's institutional identity before issuing temporary login credentials.
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRequestForReset(null)}
                      disabled={isResetting}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition cursor-pointer hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteReset}
                      disabled={isResetting}
                      className="px-4 py-2 rounded-xl bg-[#064e2b] hover:bg-[#16834a] text-white font-extrabold text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      {isResetting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isResetting ? 'Generating...' : 'Confirm & Reset Password'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Reject Request Modal */}
      {selectedRequestForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
          <div className="relative w-full max-w-md bg-white dark:bg-[#131e2e] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white">
            <div className="px-6 py-4 bg-rose-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-200" />
                <h3 className="font-extrabold text-base">Reject Password Reset Request</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequestForReject(null)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                Provide a reason for rejecting the password reset request for{' '}
                <strong className="text-slate-900 dark:text-white">{selectedRequestForReject.full_name}</strong>.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Identity verification failed, duplicate request..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequestForReject(null)}
                  disabled={isRejecting}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteReject}
                  disabled={isRejecting}
                  className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {isRejecting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isRejecting ? 'Rejecting...' : 'Confirm Rejection'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
