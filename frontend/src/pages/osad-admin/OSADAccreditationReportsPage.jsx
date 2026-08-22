import React from 'react'
import {
  FileSpreadsheet,
  Download,
  ShieldCheck
} from 'lucide-react'

export default function OSADAccreditationReportsPage({ accreditationReports, _getAccreditationReportDetails }) {
  const reportsList = accreditationReports || [
    { id: 1, title: 'PACUCOA Annual Institutional Accreditation Summary', date: 'AY 2025-2026', status: 'Ready', count: 142 },
    { id: 2, title: 'CHED Regional Office XII CoE / COD Compliance Report', date: 'AY 2025-2026', status: 'Ready', count: 88 },
    { id: 3, title: 'NDMU OSAD Student Extracurricular Audit Summary', date: 'First Semester 2025', status: 'Ready', count: 215 }
  ]

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-2xs">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-[#16834a] dark:text-emerald-400" />
          Accreditation and Compliance Reports
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Generate reports from verified Student achievement and organization records.
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportsList.map((report) => (
          <div
            key={report.id}
            className="p-5 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:border-[#16834a] transition shadow-2xs"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#16834a] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">{report.title}</h3>
              <p className="text-xs text-slate-500 font-medium">{report.date} • {report.count} Verified Records</p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2 rounded-xl bg-[#EFF7F0] hover:bg-[#16834a] text-white text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#245F42]" />
              <span>Print or Save as PDF</span>
            </button>
          </div>
        ))}
      </div>

    </div>
  )
}
