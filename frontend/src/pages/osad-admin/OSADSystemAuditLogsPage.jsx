import React, { useState, useMemo } from 'react'
import {
  ShieldCheck,
  Clock,
  UserCheck,
  RefreshCw,
  Search,
  Key,
  Users,
  Award,
  FileSpreadsheet
} from 'lucide-react'
import OSADPageHeader from '../../components/osad/OSADPageHeader'
import { OSADEmptyState, OSADSearchEmptyState } from '../../components/osad/OSADStateBlock'

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Activities' },
  { value: 'ROLE_ASSIGNMENT', label: 'Role Assignments' },
  { value: 'ORGANIZATION_CREATED', label: 'Organizations' },
  { value: 'AWARDEE_CONFIRMATION', label: 'Award Confirmations' },
  { value: 'PASSWORD_RESET', label: 'Password Resets' },
  { value: 'ACCREDITATION_REPORT_GEN', label: 'Report Generation' }
]

export default function OSADSystemAuditLogsPage({ auditLogs, refreshAuditLogs }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const logs = auditLogs || [
    { id: 'log-1', action_type: 'ROLE_ASSIGNMENT', action: 'Role Assigned', details: 'Program Coordinator assigned to Dr. Aris Santos (BSCS)', timestamp: '10 mins ago', admin_user: 'Director Marcus Vance (OSAD)', user: 'Director Vance', severity: 'INFO' },
    { id: 'log-2', action_type: 'AWARDEE_CONFIRMATION', action: 'Award Confirmed', details: "Dean's Lister confirmed for Maria Santos (2024-01234)", timestamp: '1 hour ago', admin_user: 'Director Marcus Vance (OSAD)', user: 'Director Vance', severity: 'SUCCESS' },
    { id: 'log-3', action_type: 'ACCREDITATION_REPORT_GEN', action: 'Report Generated', details: 'PACUCOA Annual Compliance Summary exported to PDF', timestamp: '3 hours ago', admin_user: 'OSAD Staff', user: 'OSAD Staff', severity: 'INFO' }
  ]

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchCat = categoryFilter === 'all' ||
        log.action_type === categoryFilter ||
        (log.action && log.action.toUpperCase().replace(/\s+/g, '_') === categoryFilter)

      if (!matchCat) return false

      if (!searchTerm.trim()) return true
      const term = searchTerm.toLowerCase()
      const user = (log.admin_user || log.user || '').toLowerCase()
      const action = (log.action || log.action_type || '').toLowerCase()
      const details = (log.details || '').toLowerCase()
      const target = (log.target_entity || '').toLowerCase()

      return user.includes(term) || action.includes(term) || details.includes(term) || target.includes(term)
    })
  }, [logs, categoryFilter, searchTerm])

  const getActionIcon = (actionType) => {
    const type = String(actionType || '').toUpperCase()
    if (type.includes('ROLE')) return <Users className="w-4 h-4" />
    if (type.includes('AWARD')) return <Award className="w-4 h-4" />
    if (type.includes('PASSWORD') || type.includes('RESET')) return <Key className="w-4 h-4" />
    if (type.includes('REPORT') || type.includes('ACCREDITATION')) return <FileSpreadsheet className="w-4 h-4" />
    return <UserCheck className="w-4 h-4" />
  }

  return (
    <div className="space-y-6 font-sans">

      {/* Standardized Page Header */}
      <OSADPageHeader
        title="OSAD Activity Log"
        description="Review recorded OSAD actions, including role assignments, award confirmations, and report generation."
        icon={ShieldCheck}
        secondaryActions={
          <button
            type="button"
            onClick={() => {
              if (typeof refreshAuditLogs === 'function') refreshAuditLogs()
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 hover:text-[#16834a] border border-slate-200 dark:border-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Activity Log</span>
          </button>
        }
      />

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#131e2e] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search activity by actor, action, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#16834a] placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                categoryFilter === cat.value
                  ? 'bg-[#16834a] text-white shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table or Empty State */}
      {logs.length === 0 ? (
        <OSADEmptyState
          icon={ShieldCheck}
          title="No OSAD Activity Recorded"
          description="No administrative activities, role updates, or report exports have been logged yet."
        />
      ) : filteredLogs.length === 0 ? (
        <OSADSearchEmptyState
          title="No Matching Activity Logs"
          description={`No activity logs match the search query "${searchTerm}".`}
          onReset={() => {
            setSearchTerm('')
            setCategoryFilter('all')
          }}
        />
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#16834a] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0 font-bold">
                  {getActionIcon(log.action_type || log.action)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">{log.action || (log.action_type ? log.action_type.replace(/_/g, ' ') : 'System Action')}</span>
                    <span className="text-[11px] text-slate-400">• By {log.admin_user || log.user || 'System Guard'}</span>
                    {log.severity && (
                      <span className={`px-2 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                        log.severity === 'SUCCESS' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400' :
                        log.severity === 'WARNING' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {log.severity}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">{log.details}</p>
                </div>
              </div>

              <span className="text-[11px] text-slate-400 font-semibold shrink-0 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {log.timestamp}
              </span>
            </div>
          ))}
          </div>
        </div>
      )}

    </div>
  )
}
