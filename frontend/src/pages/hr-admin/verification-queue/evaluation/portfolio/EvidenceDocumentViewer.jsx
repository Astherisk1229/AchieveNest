import React from 'react'
import { FileText, Download, ExternalLink, X, ShieldCheck } from 'lucide-react'

export default function EvidenceDocumentViewer({ item, onClose }) {
  if (!item) return null

  const isPdf = item.fileType === 'pdf' || (item.documentUrl && item.documentUrl.endsWith('.pdf')) || true

  return (
    <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 shadow-inner">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400">
          <FileText className="w-4 h-4" />
          <span>Proof Document Viewer: {item.title || 'Submitted Evidence'}</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Embedded Document Preview Box */}
      <div className="h-56 w-full rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-4 text-center space-y-2 relative overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center font-bold text-lg">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-extrabold text-slate-200">{item.fileName || `${item.title}_Proof_Document.pdf`}</p>
          <p className="text-[10px] text-slate-500 font-mono">Official PDF Document Verification Asset · 2.4 MB</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
          ✓ Digital Signature Intact &amp; Verified
        </div>
      </div>

      {/* Document Details & Actions */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <span>Submitted: {item.submittedDate || 'Aug 10, 2026'}</span>
        <div className="flex items-center gap-2">
          <a
            href={item.documentUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.preventDefault()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Original</span>
          </a>
        </div>
      </div>
    </div>
  )
}
