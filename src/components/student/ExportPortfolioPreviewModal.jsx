import React, { useState } from 'react'
import { 
  X as CloseIcon, 
  FileText as DocIcon, 
  Download as DownloadIcon, 
  Printer as PrintIcon, 
  CheckCircle2 as CheckIcon, 
  QrCode as QrIcon, 
  ShieldCheck as ShieldIcon, 
  Award as AwardIcon 
} from 'lucide-react'

export default function ExportPortfolioPreviewModal({ isOpen, onClose, student }) {
  const [exportFormat, setExportFormat] = useState('pdf')
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen) return null

  const handleDownload = () => {
    setIsExporting(true)
    setTimeout(() => {
      if (exportFormat === 'csv') {
        const csvContent = "data:text/csv;charset=utf-8," 
          + "Student Name,Student ID,Program,Achievement Title,Category,Date,Status\n"
          + `${student?.full_name || 'Maria Santos'},${student?.student_id || '2024-01234'},BS Computer Science,Dean's Lister - First Semester AY 2025-2026,Academic,Dec 15 2025,Verified\n`
          + `${student?.full_name || 'Maria Santos'},${student?.student_id || '2024-01234'},BS Computer Science,Student Council President,Leadership,Jan 10 2026,Verified\n`
          + `${student?.full_name || 'Maria Santos'},${student?.student_id || '2024-01234'},BS Computer Science,Basketball Intramurals Champion,Sports,Feb 14 2026,Verified`

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `NDMU_Portfolio_${student?.student_id || '2024-01234'}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        window.print()
      }
      setIsExporting(false)
      onClose()
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
        >
          <CloseIcon className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-4 shrink-0">
          <div className="p-3 rounded-2xl bg-[#eef7f0] border border-[#cbe6d2] text-[#2d8a4e] shadow-2xs">
            <DocIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Export Portfolio Preview</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Official Notre Dame of Marbel University Student Accomplishments Summary
            </p>
          </div>
        </div>

        {/* Scrollable Document Preview Card */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 my-2">
          
          {/* Format Selector Pills */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setExportFormat('pdf')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 ${
                exportFormat === 'pdf'
                  ? 'bg-[#2d8a4e] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DocIcon className="w-4 h-4" />
              <span>Official PDF Portfolio</span>
            </button>

            <button
              type="button"
              onClick={() => setExportFormat('csv')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 ${
                exportFormat === 'csv'
                  ? 'bg-[#2d8a4e] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DownloadIcon className="w-4 h-4" />
              <span>Accreditation CSV Sheet</span>
            </button>
          </div>

          {/* PDF Official Letterhead Document Box Preview */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-5 text-slate-800 text-xs shadow-inner">
            
            {/* University Letterhead */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1b4332] p-1 flex items-center justify-center text-amber-400 font-black shadow-xs shrink-0">
                  <ShieldIcon className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm tracking-tight">NOTRE DAME OF MARBEL UNIVERSITY</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">City of Koronadal, South Cotabato • AchieveNest System</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-[#1e5831] border border-emerald-200">
                OFFICIAL RECORD
              </span>
            </div>

            {/* Student Header Details */}
            <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200/80">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Student Name</p>
                <p className="text-sm font-extrabold text-slate-900">{student?.full_name || 'Maria Santos'}</p>
                <p className="text-[11px] text-slate-500 font-medium">ID: {student?.student_id || '2024-01234'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Degree Program</p>
                <p className="text-xs font-bold text-slate-900">{student?.program || 'BS Computer Science'}</p>
                <p className="text-[11px] text-slate-500 font-medium">3rd Year • AY 2025-2026</p>
              </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <p className="text-lg font-black text-[#2d8a4e]">5</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase">Total Submissions</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <p className="text-lg font-black text-[#2d8a4e]">3</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase">Verified Records</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <p className="text-lg font-black text-amber-600">30</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase">Points Conferred</p>
              </div>
            </div>

            {/* Verified Accomplishments Table */}
            <div className="space-y-2">
              <p className="text-xs font-extrabold text-[#143823] flex items-center gap-1.5">
                <AwardIcon className="w-4 h-4 text-[#2d8a4e]" />
                <span>Verified Accomplishments Summary</span>
              </p>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-100/80 text-slate-700 font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Achievement Title</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">Dean's Lister - First Semester AY 2025-2026</td>
                      <td className="p-2.5">Academic</td>
                      <td className="p-2.5">Dec 15, 2025</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">Verified ✓</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">Student Council President</td>
                      <td className="p-2.5">Leadership</td>
                      <td className="p-2.5">Jan 10, 2026</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">Verified ✓</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">Basketball Intramurals Champion</td>
                      <td className="p-2.5">Sports</td>
                      <td className="p-2.5">Feb 14, 2026</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">Verified ✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Digital Stamp Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-[10px] text-slate-500 font-semibold">
              <div className="flex items-center gap-2">
                <QrIcon className="w-6 h-6 text-slate-700" />
                <span>Digitally Verified by NDMU AchieveNest System</span>
              </div>
              <p>Generated: {new Date().toLocaleDateString()}</p>
            </div>

          </div>

        </div>

        {/* Action Buttons Footer */}
        <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs flex items-center gap-2 transition shadow-md disabled:opacity-50"
          >
            {exportFormat === 'pdf' ? <PrintIcon className="w-4 h-4" /> : <DownloadIcon className="w-4 h-4" />}
            <span>{isExporting ? 'Exporting...' : exportFormat === 'pdf' ? 'Print / Save as PDF' : 'Download CSV File'}</span>
          </button>
        </div>

      </div>
    </div>
  )
}
