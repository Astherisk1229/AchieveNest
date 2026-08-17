import React from 'react'
import { FileText, ShieldCheck, Download, Lock } from 'lucide-react'
import { useHR } from '../../hooks/useHR'

export function HRAuditTrailPage(props) {
  const hrHook = useHR()

  const auditLogs = props.auditLogs || hrHook.auditLogs || []
  const filteredPersonnel = props.filteredPersonnel || hrHook.filteredPersonnel || []

  const exportCSVHandler = (filename, rows) => {
    if (props.exportCSV) {
      props.exportCSV(filename, rows)
      return
    }
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportFacultyMatrixHandler = () => {
    if (props.handleExportFacultyMatrix) {
      props.handleExportFacultyMatrix()
      return
    }
    const headers = ['Employee ID', 'Full Name', 'College', 'Department', 'Academic Rank', 'Status', 'Tenure Years', 'Verified Accomplishments']
    const dataRows = filteredPersonnel.map(p => [
      p.employee_id, p.full_name, p.college, p.department, p.academic_rank, p.employment_status, p.tenure_years, p.verified_accomplishments_count
    ])
    exportCSVHandler('NDMU_Faculty_CHEd_PACUCOA_Matrix.csv', [headers, ...dataRows])
  }

  const formatActionType = (type) => {
    switch (type) {
      case 'RANK_PROMOTION_UPDATE':
        return 'Academic Rank Updated'
      case 'HR_SCORE_SEAL_APPLIED':
        return 'Faculty Evaluation Finalized'
      case 'CREDENTIAL_RESET_ISSUED':
        return 'Personnel Password Reset Approved'
      case 'EVALUATION_RETURNED':
        return 'Evaluation Returned for Revision'
      case 'PERSONNEL_UPDATE':
        return 'Personnel Record Updated'
      case 'PERSONNEL_REGISTERED':
        return 'Personnel Registered'
      case 'ASSIGNMENT_UPDATED':
        return 'Department Assignment Updated'
      default:
        return (type || '').replace(/_/g, ' ')
    }
  }

  const handleExportAuditLogs = () => {
    const headers = ['Action Type', 'Actor', 'Target Personnel', 'Details', 'Timestamp', 'Reference ID']
    const dataRows = auditLogs.map(log => [
      formatActionType(log.action_type),
      log.admin_name || 'HR Admin',
      log.target_personnel || 'N/A',
      log.details || '',
      log.created_at || '',
      log.id || ''
    ])
    exportCSVHandler('HR_Audit_Trail_History.csv', [headers, ...dataRows])
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#1b4332] dark:text-emerald-400" />
            <span>Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Review recorded HR actions involving personnel administration, faculty evaluation processing, account support, rank changes, and organizational assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportAuditLogs}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143326] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm transition cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit History</span>
        </button>
      </div>

      {/* Security Audit Trail Table */}
      <div className="rounded-3xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#2d8a4e] dark:text-emerald-400" /> Administrative Audit Trail
          </h2>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{auditLogs.length} Transactions Logged</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              No audit logs recorded yet.
            </div>
          ) : (
            auditLogs.map(log => (
              <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-900/60 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[10px] uppercase border border-slate-200 dark:border-slate-700">
                      {formatActionType(log.action_type)}
                    </span>
                    <span className="text-[11px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white">{log.details}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Target Personnel: <strong className="text-slate-700 dark:text-slate-200">{log.target_personnel}</strong></p>
                </div>
                <span className="text-[11px] text-[#2d8a4e] dark:text-emerald-400 font-semibold shrink-0">{log.admin_name}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export const HRAuditTrail = HRAuditTrailPage
export default HRAuditTrailPage
