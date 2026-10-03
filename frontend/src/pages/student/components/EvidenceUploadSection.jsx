import React from 'react'
import { UploadCloud, FileText, X, AlertCircle, Eye, RefreshCw, CheckCircle2 } from 'lucide-react'

/**
 * EvidenceUploadSection.jsx
 * Canonical shared evidence attachment interface for Student Achievement entry.
 * Supports PDF, JPG, PNG up to 10MB, drag & drop, file preview, and removal.
 */
export default function EvidenceUploadSection({
  files = [],
  onAddFiles,
  onRemoveFile,
  onReplaceFile,
  onPreviewFile,
  error = '',
  required = true,
  disabled = false
}) {
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files)
      if (onAddFiles) {
        onAddFiles(selected)
      }
    }
  }

  const handleReplacement = (index, event) => {
    const replacement = event.target.files?.[0]
    if (replacement && onReplaceFile) onReplaceFile(index, replacement)
    event.target.value = ''
  }

  return (
    <div className="space-y-3" data-testid="evidence-upload-section">
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <span>Supporting Evidence & Documentation</span>
          {required && <span className="text-rose-600 dark:text-rose-400" aria-hidden="true">*</span>}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Upload certificates, event photos, official appointment letters, or publication copies.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div className={`relative rounded-2xl border border-dashed p-5 text-center transition sm:p-6 ${
        error
          ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'
          : 'border-slate-300 bg-slate-50/70 hover:border-[#16834a] hover:bg-emerald-50/40 dark:border-slate-700 dark:bg-slate-950/30 dark:hover:border-emerald-500'
      }`}>
        <input
          id="evidence-file-input"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          disabled={disabled}
          onChange={handleFileChange}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          aria-label="Upload Supporting Evidence Files"
        />
        <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-[#16834a] dark:bg-emerald-950 dark:text-emerald-400">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              Click or drag document attachments here
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              PDF, JPG, PNG (up to 10MB per file)
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </p>
      )}

      {/* File List / Preview */}
      {files && files.length > 0 && (
        <div className="space-y-2 pt-1">
          {files.map((file, idx) => {
            const fileName = file.name || file.original_name || `evidence_file_${idx + 1}`
            const byteSize = file.size || file.byte_size
            const fileSize = byteSize ? `${(byteSize / 1024 / 1024).toFixed(2)} MB` : ''

            return (
              <div
                key={file.id || idx}
                className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-800 dark:bg-slate-800/60 dark:text-slate-200 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-2 pr-2">
                  <FileText className="w-4 h-4 text-[#16834a] dark:text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="block truncate font-semibold">{fileName}</span>
                    <span className="flex items-center gap-1 text-[11px] font-normal text-slate-500 dark:text-slate-400">
                      {file.id && <><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Saved</>}
                      {fileSize && <span>{fileSize}</span>}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {onPreviewFile && <button type="button" onClick={() => onPreviewFile(file)} className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 font-semibold text-[#126b3c] hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16834a] dark:text-emerald-300 dark:hover:bg-emerald-950" aria-label={`Preview ${fileName}`}><Eye className="h-3.5 w-3.5" /> Preview</button>}
                  {!file.id && !disabled && onReplaceFile && <label className="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-3 font-semibold text-slate-600 hover:bg-slate-200 focus-within:ring-2 focus-within:ring-[#16834a] dark:text-slate-300 dark:hover:bg-slate-700"><RefreshCw className="h-3.5 w-3.5" /> Replace<input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(event) => handleReplacement(idx, event)} /></label>}
                  {!file.id && !disabled && onRemoveFile && <button type="button" onClick={() => onRemoveFile(idx)} className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-300" aria-label={`Remove ${fileName}`}><X className="h-3.5 w-3.5" /> Remove</button>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
