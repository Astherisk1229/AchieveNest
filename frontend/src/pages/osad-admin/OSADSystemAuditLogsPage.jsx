import React, { useState, useMemo, useEffect, useCallback } from 'react'
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
import { OSADEmptyState, OSADSearchEmptyState, OSADErrorState, OSADLoadingState } from '../../components/osad/OSADStateBlock'
import provisioningService from '../../services/provisioningService'

const humanize = (code) => String(code || 'System Action').replace(/[_.]+/g, ' ').toLowerCase().replace(/(^|\s)\w/g, (c) => c.toUpperCase())

const formatTimestamp = (value) => {
  if (!value) return ''
  const d = new Date(String(value).replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString()
}

const toDetailsText = (details) => {
  if (details == null || details === '') return ''
  if (typeof details === 'string') return details
  try { return JSON.stringify(details) } catch { return '' }
}

const severityOf = (outcome) => {
  const o = String(outcome || '').toLowerCase()
  if (o === 'success' || o === 'succeeded') return 'SUCCESS'
  if (o === 'failure' || o === 'failed' || o === 'denied' || o === 'error') return 'WARNING'
  return 'INFO'
}

export default function OSADSystemAuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const loadLogs = useCallback(async (signal) => {
    setLoading(true)
    setLoadError(null)
    try {
      const events = await provisioningService.fetchAuditEvents({ per_page: 200 }, { signal })
      setLogs(events.map((e) => ({
        id: e.id,
        action_type: e.category || e.event_code,
        category: e.category || 'other',
        action: humanize(e.event_code),
        details: toDetailsText(e.details),
        admin_user: e.actor_name || 'System',
        target_entity: e.target_name || '',
        timestamp: formatTimestamp(e.created_at),
        severity: severityOf(e.outcome)
      })))
    } catch (err) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return
      setLogs([])
      setLoadError(err?.error?.message || err?.message || 'The activity log could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadLogs(controller.signal)
    return () => controller.abort()
  }, [loadLogs])

  const categoryOptions = useMemo(() => {
    const cats = Array.from(new Set(logs.map((l) => l.category))).sort()
    return [{ value: 'all', label: 'All Activities' }, ...cats.map((c) => ({ value: c, label: humanize(c) }))]
  }, [logs])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (categoryFilter !== 'all' && log.category !== categoryFilter) return false
      if (!searchTerm.trim()) return true
      const term = searchTerm.toLowerCase()
      return [log.admin_user, log.action, log.details, log.target_entity]
        .some((v) => String(v || '').toLowerCase().includes(term))
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
              loadLogs()
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
          {categoryOptions.map((cat) => (
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
      {loadError ? (
        <OSADErrorState title="Activity Log Unavailable" message={loadError} onRetry={() => loadLogs()} />
      ) : loading && logs.length === 0 ? (
        <OSADLoadingState message="Loading activity log..." subMessage="Fetching recorded OSAD activity." />
      ) : logs.length === 0 ? (
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
