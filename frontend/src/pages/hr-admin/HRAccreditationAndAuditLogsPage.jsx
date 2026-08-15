import React from 'react'
import { FileText, ShieldCheck, Download, Lock } from 'lucide-react'
import { useHR } from '../../hooks/useHR'

export function HRAccreditationAndAuditLogsPage(props) {
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

  return (
    <div className="space-y-6 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-[#2d8a4e] dark:text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">CHEd &amp; PACUCOA Faculty Qualification Matrix</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Export complete university-wide faculty academic ranks, tenure years, degree qualifications, and verified publication numbers in standardized CSV format.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportFacultyMatrixHandler}
            className="w-full py-3 rounded-2xl bg-[#1b4332] text-white hover:bg-[#12361e] font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download Official CSV Matrix
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Faculty Promotion Board Dossier Compiler</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Compile verified accomplishment files and seal records into an aggregated promotion summary for institutional promotion evaluation boards.
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportCSVHandler('Faculty_Promotion_Board_Summary.csv', [
              ['Employee ID', 'Name', 'Current Rank', 'Target Promotion Track', 'Verified Points'],
              ...filteredPersonnel.map(p => [p.employee_id, p.full_name, p.academic_rank, 'Promotion Candidate', p.verified_accomplishments_count])
            ])}
            className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" /> Compile Promotion Board CSV
          </button>
        </div>
      </div>

      {/* Security Audit Trail Table */}
      <div className="rounded-3xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#2d8a4e] dark:text-emerald-400" /> HR Security Audit Trail
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
                      {log.action_type}
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

export const HRAccreditationAndAuditLogs = HRAccreditationAndAuditLogsPage
export default HRAccreditationAndAuditLogsPage
