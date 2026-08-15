import React, { useState, useMemo } from 'react'
import { Search, Lock, CheckCircle2, Copy, RefreshCw, KeyRound } from 'lucide-react'

export default function PasswordResetQueue({
  passwordResets = [],
  onApproveReset
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending') // 'pending' | 'approved' | 'all'
  const [tempPassMap, setTempPassMap] = useState({})
  const [copiedId, setCopiedId] = useState(null)

  const generateTempPassword = (reqId) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#'
    let pass = 'NDMU-'
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setTempPassMap(prev => ({ ...prev, [reqId]: pass }))
  }

  const handleCopy = (reqId, pass) => {
    navigator.clipboard.writeText(pass)
    setCopiedId(reqId)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const filteredResets = useMemo(() => {
    return passwordResets.filter(req => {
      const q = search.toLowerCase().trim()
      const matchesSearch = !q ||
        (req.user_name && req.user_name.toLowerCase().includes(q)) ||
        (req.user_email && req.user_email.toLowerCase().includes(q)) ||
        (req.employee_id && req.employee_id.toLowerCase().includes(q))

      const matchesStatus = statusFilter === 'all' || req.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [passwordResets, search, statusFilter])

  return (
    <div className="space-y-4">
      {/* Header & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search reset requests by name, ID, or email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-[#1b4332]"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Pending ({passwordResets.filter(r => r.status === 'pending').length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-[#1b4332] text-white shadow-2xs dark:bg-emerald-600'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Resolved ({passwordResets.filter(r => r.status === 'approved').length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-700 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Reset Requests Grid */}
      {filteredResets.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 font-medium rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800">
          No password reset requests match your filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResets.map(req => {
            const tempPass = tempPassMap[req.id] || 'NDMU-Pass2026!'
            const isApproved = req.status === 'approved'

            return (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isApproved ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#1b4332] dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                    }`}>
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white">{req.user_name || req.user_email}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{req.user_email}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isApproved
                      ? 'bg-[#1b4332]/10 text-[#1b4332] dark:text-emerald-400 border border-[#1b4332]/20'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300'
                  }`}>
                    {isApproved ? '✓ Resolved' : '● Pending Review'}
                  </span>
                </div>

                {/* Temp Password Control */}
                {!isApproved && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase font-extrabold text-slate-400">Generated Temp Password</p>
                      <button
                        type="button"
                        onClick={() => generateTempPassword(req.id)}
                        className="text-[10px] font-extrabold text-[#1b4332] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Randomize</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <code className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 flex-1">
                        {tempPass}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(req.id, tempPass)}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-[11px] hover:bg-slate-300 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedId === req.id ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Approve Action Button */}
                {!isApproved && (
                  <button
                    type="button"
                    onClick={() => onApproveReset(req.id, tempPass)}
                    className="w-full py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143326] dark:bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Approve &amp; Issue Temporary Password</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
