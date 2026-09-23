import React, { useState } from 'react'
import {
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Eye,
  X,
  FileText
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import OSADPageHeader from '../../components/osad/OSADPageHeader'
import { OSADEmptyState } from '../../components/osad/OSADStateBlock'

export default function OSADAccreditationReportsPage({ accreditationReports, getAccreditationReportDetails, _getAccreditationReportDetails }) {
  const [activeReportDetails, setActiveReportDetails] = useState(null)
  const detailFetcher = getAccreditationReportDetails || _getAccreditationReportDetails

  const reportsList = accreditationReports || [
    { id: 'rpt-01', title: 'PACUCOA Annual Institutional Accreditation Summary', agency: 'PACUCOA', date: 'AY 2025-2026', status: 'Ready', count: 412 },
    { id: 'rpt-02', title: 'CHED Regional Office XII CoE / COD Compliance Report', agency: 'CHEd Region XII', date: 'AY 2025-2026', status: 'Ready', count: 380 },
    { id: 'rpt-03', title: 'NDMU OSAD Student Extracurricular Audit Summary', agency: 'NDMU OSAD Central', date: 'AY 2025-2026', status: 'Ready', count: 520 }
  ]

  const handleViewDetails = (report) => {
    if (typeof detailFetcher === 'function') {
      const details = detailFetcher(report.id)
      setActiveReportDetails(details || report)
    } else {
      setActiveReportDetails(report)
    }
  }

  return (
    <div className="space-y-6 font-sans">

      {/* Standardized Page Header */}
      <OSADPageHeader
        title="Accreditation and Compliance Reports"
        description="Generate traceable reports from verified Student achievement and organization records."
        icon={FileSpreadsheet}
      />

      {/* Reports Grid or Empty State */}
      {reportsList.length === 0 ? (
        <OSADEmptyState
          icon={FileSpreadsheet}
          title="No Accreditation Reports Available"
          description="No verified compliance summaries or institutional accreditation records are currently available for generation."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {reportsList.map((report) => (
          <div
            key={report.id}
            className="p-5 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:border-[#16834a] transition shadow-2xs"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#16834a] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  {report.agency || 'PACUCOA'}
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">{report.title}</h3>
              <p className="text-xs text-slate-500 font-medium">{report.date || report.period || 'AY 2025-2026'} • <span className="font-bold text-slate-700 dark:text-slate-300">{report.count || report.total_student_achievements || 412} Verified Records</span></p>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                variant="outline"
                onClick={() => handleViewDetails(report)}
                className="w-full gap-2 text-xs font-extrabold cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Report Breakdown</span>
              </Button>

              <Button
                onClick={() => window.print()}
                className="w-full gap-2 shadow-2xs text-xs font-extrabold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print or Save as PDF</span>
              </Button>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Report Breakdown Modal */}
      {activeReportDetails && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setActiveReportDetails(null) }}
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#131e2e] rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold tracking-tight">{activeReportDetails.title}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {activeReportDetails.agency || 'Accreditation Agency'} • {activeReportDetails.period || activeReportDetails.date || 'AY 2025-2026'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveReportDetails(null)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-5 overflow-y-auto">

              {/* Aggregate KPI Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Verified</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{activeReportDetails.total_student_achievements || activeReportDetails.count || 412}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faculty Verified</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{activeReportDetails.total_faculty_accomplishments || 188}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compliance Rate</p>
                  <p className="text-lg font-black text-[#16834a] dark:text-emerald-400 mt-0.5">{activeReportDetails.accreditation_status || '96.4% Compliant'}</p>
                </div>
              </div>

              {/* College Breakdown Table */}
              {Array.isArray(activeReportDetails.collegeBreakdown) && activeReportDetails.collegeBreakdown.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">College Breakdown</h4>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="p-2.5">College</th>
                          <th className="p-2.5 text-center">Student</th>
                          <th className="p-2.5 text-center">Faculty</th>
                          <th className="p-2.5 text-right">Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {activeReportDetails.collegeBreakdown.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{row.college}</td>
                            <td className="p-2.5 text-center text-slate-600 dark:text-slate-400 font-mono">{row.student_records}</td>
                            <td className="p-2.5 text-center text-slate-600 dark:text-slate-400 font-mono">{row.faculty_records}</td>
                            <td className="p-2.5 text-right font-bold text-[#16834a] dark:text-emerald-400">{row.verification_rate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sample Verified Evidence */}
              {Array.isArray(activeReportDetails.includedRecordsSample) && activeReportDetails.includedRecordsSample.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Sample Verified Proofs</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {activeReportDetails.includedRecordsSample.map((rec) => (
                      <div key={rec.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white">{rec.title}</p>
                          <p className="text-[11px] text-slate-500">{rec.owner} • {rec.category} ({rec.college_code})</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 shrink-0">
                          {rec.verified_by}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveReportDetails(null)}
                className="text-xs font-extrabold cursor-pointer"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 text-xs font-extrabold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
