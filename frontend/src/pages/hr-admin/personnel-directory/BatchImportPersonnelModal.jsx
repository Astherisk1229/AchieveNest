import React, { useState, useRef } from 'react'
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  RefreshCw,
  ArrowRight
} from 'lucide-react'
import {
  downloadPersonnelTemplate,
  previewPersonnelImport,
  commitPersonnelImport
} from '../../../services/hrAdminService'

export default function BatchImportPersonnelModal({ isOpen, onClose, onSuccess, showToast }) {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [importReport, setImportReport] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true)
      const blob = await downloadPersonnelTemplate()
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'AchieveNest_Personnel_Import_Template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      showToast?.('XLSX Import Template downloaded successfully.')
    } catch (err) {
      console.error('Failed to download template:', err)
      setErrorMsg('Failed to download template. Please check network connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return
    const name = selectedFile.name.toLowerCase()
    if (!name.endsWith('.xlsx') && !name.endsWith('.csv')) {
      setErrorMsg('Please select a valid .xlsx or .csv workbook file.')
      return
    }
    setFile(selectedFile)
    setErrorMsg(null)
    setPreviewData(null)
    setImportReport(null)
    parseAndPreview(selectedFile)
  }

  const parseAndPreview = async (selectedFile) => {
    try {
      setLoading(true)
      setErrorMsg(null)
      const formData = new FormData()
      formData.append('file', selectedFile)
      const res = await previewPersonnelImport(formData)
      const data = res?.data || res
      setPreviewData(data)
    } catch (err) {
      console.error('Preview parsing failed:', err)
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to parse workbook.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleCommit = async () => {
    if (!previewData || !previewData.preview) return
    const validRows = previewData.preview.filter(r => r.is_valid)
    if (validRows.length === 0) {
      setErrorMsg('No valid rows available to import.')
      return
    }

    try {
      setCommitting(true)
      setErrorMsg(null)
      const res = await commitPersonnelImport(validRows)
      const data = res?.data || res
      setImportReport(data)
      showToast?.(data.summary || `Successfully imported ${data.imported_count} personnel records.`)
      onSuccess?.()
    } catch (err) {
      console.error('Commit failed:', err)
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to commit imported records.'
      setErrorMsg(msg)
    } finally {
      setCommitting(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreviewData(null)
    setImportReport(null)
    setErrorMsg(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">

        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-[#159552] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Batch Import Personnel (XLSX)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Upload validated spreadsheets to create personnel accounts and institutional placement in bulk.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5">
              <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Download Template Guidance */}
          {!importReport && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Step 1 — Download Standard Template</span>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Ensure records follow canonical CHU-01 values: <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px]">Permanent</code> or <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px]">Probationary</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs transition cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-[#159552]" />
                <span>Download XLSX Template</span>
              </button>
            </div>
          )}

          {/* Step 2: Upload Dropzone (if not previewing) */}
          {!previewData && !importReport && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                if (e.dataTransfer.files?.[0]) {
                  handleFileSelect(e.dataTransfer.files[0])
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-[#159552] bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-[#159552] dark:hover:border-[#159552] bg-slate-50/40 dark:bg-slate-900/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
                }}
              />
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-[#159552] flex items-center justify-center shadow-xs">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Click to select workbook or drag and drop here
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  Supported formats: .XLSX, .CSV (Maximum file size: 10MB)
                </p>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#159552] animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Parsing workbook and validating institutional constraints...
              </p>
            </div>
          )}

          {/* Step 3: Validation Preview Table */}
          {previewData && !importReport && !loading && (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Total Rows</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white">{previewData.total_rows}</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">Valid Rows</span>
                  <span className="text-lg font-black text-emerald-800 dark:text-emerald-200">{previewData.valid_count}</span>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60">
                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 block">Invalid Rows</span>
                  <span className="text-lg font-black text-rose-800 dark:text-rose-200">{previewData.invalid_count}</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block">Duplicate Rows</span>
                  <span className="text-lg font-black text-amber-800 dark:text-amber-200">{previewData.duplicate_count}</span>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Personnel</th>
                      <th className="py-2.5 px-3">Classification</th>
                      <th className="py-2.5 px-3">Placement</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Diagnostics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {previewData.preview.map((row) => (
                      <tr key={row.row_number} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-400 font-mono">{row.row_number}</td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">{row.full_name || '—'}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">{row.institutional_email}</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[11px] block capitalize">{row.personnel_group || row.rawGroup || '—'}</span>
                          <span className="text-[10px] text-slate-400 capitalize block">{row.employment_status || '—'}</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{row.unit_code || '—'}</span>
                        </td>
                        <td className="py-2 px-3">
                          {row.is_valid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              VALID
                            </span>
                          ) : row.result_status === 'DUPLICATE' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-extrabold">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              DUPLICATE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-extrabold">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              INVALID
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-rose-600 dark:text-rose-400">
                          {row.errors?.length > 0 ? row.errors.join('; ') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 4: Completion Report */}
          {importReport && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-[#159552] flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Batch Import Completed</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {importReport.summary}
                </p>
              </div>
              <div className="inline-flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Imported</span>
                  <span className="text-xl font-black text-[#159552]">{importReport.imported_count}</span>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Failed</span>
                  <span className="text-xl font-black text-rose-600">{importReport.failed_count}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <button
            type="button"
            onClick={previewData && !importReport ? handleReset : onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
          >
            {previewData && !importReport ? 'Choose Different File' : 'Close'}
          </button>

          {previewData && !importReport && (
            <button
              type="button"
              onClick={handleCommit}
              disabled={committing || previewData.valid_count === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#159552] hover:bg-[#117A43] text-white font-bold text-xs shadow-md disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {committing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Committing Records...</span>
                </>
              ) : (
                <>
                  <span>Commit {previewData.valid_count} Valid Records</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}

          {importReport && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#159552] hover:bg-[#117A43] text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              Done & View Directory
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
