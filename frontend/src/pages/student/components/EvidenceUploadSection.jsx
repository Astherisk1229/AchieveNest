import React from 'react'
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react'

/**
 * EvidenceUploadSection.jsx
 * Canonical shared evidence attachment interface for Student Achievement entry.
 * Supports PDF, JPG, PNG up to 10MB, drag & drop, file preview, and removal.
 */
export default function EvidenceUploadSection({
  files = [],
  onAddFiles,
  onRemoveFile,
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

  return (
    <div className="space-y-3" data-testid="evidence-upload-section">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <span>Supporting Evidence & Documentation</span>
          {required && <span className="text-rose-600 dark:text-rose-400" aria-hidden="true">*</span>}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Upload certificates, event photos, official appointment letters, or publication copies.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition ${
        error
          ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'
          : 'border-slate-200 dark:border-slate-700 hover:border-[#16834a] dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-900/50'
      }`}>
        <input
          id="evidence-file-input"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          disabled={disabled}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          aria-label="Upload Supporting Evidence Files"
        />
        <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
          <div className="w-10 h-10 rounded-2xl bg-[#eef7f0] dark:bg-emerald-950/40 border border-[#cbe6d2] dark:border-emerald-800 text-[#16834a] dark:text-emerald-400 flex items-center justify-center">
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
            const fileSize = file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''

            return (
              <div
                key={file.id || idx}
                className="p-2.5 rounded-xl bg-[#eef7f0] dark:bg-emerald-950/30 border border-[#cbe6d2] dark:border-emerald-900/60 flex items-center justify-between text-xs text-[#064e2b] dark:text-emerald-300 font-semibold"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <FileText className="w-4 h-4 text-[#16834a] dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{fileName}</span>
                  {fileSize && <span className="text-[10px] text-slate-500 font-normal shrink-0">({fileSize})</span>}
                </div>
                {!disabled && onRemoveFile && (
                  <button
                    type="button"
                    onClick={() => onRemoveFile(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
                    aria-label={`Remove file ${fileName}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
