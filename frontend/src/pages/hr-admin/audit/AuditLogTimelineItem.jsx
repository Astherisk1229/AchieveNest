import React from 'react'
import { getEventMetadata } from '../../../models/HRAuditEventRegistry'
import { Clock, User, ShieldCheck, KeyRound, Award, FileText } from 'lucide-react'

export default function AuditLogTimelineItem({ log }) {
  if (!log) return null

  const meta = getEventMetadata(log.event_code || log.action_type)
  const timestampStr = log.timestamp || log.created_at
  const formattedTime = timestampStr ? new Date(timestampStr).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) : 'Unknown Time'

  // Icon mapping based on category
  const renderCategoryIcon = () => {
    switch (meta.category.key) {
      case 'SECURITY':
        return <KeyRound className="w-3.5 h-3.5" />
      case 'EVALUATION':
        return <ShieldCheck className="w-3.5 h-3.5" />
      case 'RANK_ASSIGNMENT':
        return <Award className="w-3.5 h-3.5" />
      case 'ACCOUNT':
        return <User className="w-3.5 h-3.5" />
      default:
        return <FileText className="w-3.5 h-3.5" />
    }
  }

  const actorName = log.actor_name || log.admin_name || 'HR Director'
  const actorRole = log.actor_role || (actorName.includes('Director') ? 'HR Director' : 'HR Staff')
  const targetLabel = log.target_label || log.target_personnel || 'N/A'

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition space-y-2 font-sans">
      {/* Header Row: Category Badge & Timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${meta.badgeClass}`}>
            {renderCategoryIcon()}
            <span>{meta.label}</span>
          </span>
          {log.reference_id && (
            <span className="font-mono text-[10px] font-semibold text-slate-400">
              Ref: {log.reference_id}
            </span>
          )}
        </div>

        <time dateTime={timestampStr} className="text-[11px] text-slate-400 font-mono font-medium flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{formattedTime}</span>
        </time>
      </div>

      {/* Body: Action Summary & Target Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
            {log.details}
          </p>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Target Personnel: <strong className="text-slate-700 dark:text-slate-200 font-bold">{targetLabel}</strong>
            {log.target_id && <span className="font-mono text-[10px] text-slate-400 ml-1">({log.target_id})</span>}
          </p>
        </div>

        {/* Actor Badge Card */}
        <div className="shrink-0 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="w-6 h-6 rounded-full bg-[#EFF7F0] dark:bg-emerald-600 text-white font-extrabold text-[10px] flex items-center justify-center">
            {actorName.charAt(0)}
          </div>
          <div className="text-[11px]">
            <p className="font-extrabold text-slate-800 dark:text-slate-200 leading-none">{actorName}</p>
            <p className="text-[9px] text-[#16834a] dark:text-emerald-400 font-semibold leading-none mt-0.5">{actorRole}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
