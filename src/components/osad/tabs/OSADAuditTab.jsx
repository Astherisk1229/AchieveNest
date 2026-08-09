import React from 'react'
import {
  ShieldCheck,
  Clock,
  UserCheck,
  RefreshCw
} from 'lucide-react'

export default function OSADAuditTab({ auditLogs, refreshAuditLogs }) {
  const logs = auditLogs || [
    { id: 1, action: 'Role Assigned', details: 'Program Coordinator assigned to Dr. Aris Santos (BSCS)', timestamp: '10 mins ago', user: 'Director Vance' },
    { id: 2, action: 'Award Confirmed', details: "Dean's Lister confirmed for Maria Santos (2024-01234)", timestamp: '1 hour ago', user: 'Director Vance' },
    { id: 3, action: 'Report Generated', details: 'PACUCOA Annual Compliance Summary exported to PDF', timestamp: '3 hours ago', user: 'OSAD Staff' }
  ]

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 shadow-2xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#2d8a4e] dark:text-emerald-400" />
            System Security &amp; Administrative Audit Logs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Immutable log trail of role assignments, points verification, and executive accreditation actions.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshAuditLogs}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 hover:text-[#2d8a4e] border border-slate-200 dark:border-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {logs.map((log) => (
            <div key={log.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0 font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">{log.action}</span>
                    <span className="text-[11px] text-slate-400">• By {log.user}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{log.details}</p>
                </div>
              </div>

              <span className="text-[11px] text-slate-400 font-semibold shrink-0 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
