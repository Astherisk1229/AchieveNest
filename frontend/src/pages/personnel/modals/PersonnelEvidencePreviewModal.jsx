import React, { useEffect, useState } from 'react'
import { Download, ExternalLink, FileWarning, LoaderCircle, X } from 'lucide-react'
import personnelAccomplishmentService from '../../../services/personnelAccomplishmentService'

export default function PersonnelEvidencePreviewModal({ evidence, onClose }) {
  const [blobUrl, setBlobUrl] = useState('')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    let currentUrl = ''
    setBlobUrl('')
    setError('')
    if (!evidence?.id) return undefined

    personnelAccomplishmentService.getEvidenceBlobUrl(evidence.id)
      .then((url) => {
        currentUrl = url
        if (active) setBlobUrl(url)
        else URL.revokeObjectURL(url)
      })
      .catch(() => active && setError('The evidence could not be opened. Confirm that the file still exists, then try again.'))

    return () => {
      active = false
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [evidence?.id, reloadKey])

  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  if (!evidence) return null
  const isImage = String(evidence.mime_type).startsWith('image/')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="evidence-preview-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 id="evidence-preview-title" className="truncate text-sm font-extrabold text-slate-900">{evidence.original_filename}</h2>
            <p className="mt-0.5 text-xs text-slate-600">Secure persisted evidence · {evidence.mime_type}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {blobUrl && <a href={blobUrl} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600" aria-label="Open evidence in a new tab"><ExternalLink className="h-4 w-4" /></a>}
            <button type="button" onClick={() => personnelAccomplishmentService.downloadEvidenceBlob(evidence.id, evidence.original_filename)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600" aria-label="Download evidence"><Download className="h-4 w-4" /></button>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600" aria-label="Close evidence preview"><X className="h-5 w-5" /></button>
          </div>
        </header>
        <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-100 p-2 sm:p-4">
          {!blobUrl && !error && <div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><LoaderCircle className="h-5 w-5 animate-spin" /> Loading protected evidence…</div>}
          {error && <div className="max-w-md rounded-xl bg-white p-6 text-center shadow-sm"><FileWarning className="mx-auto mb-3 h-8 w-8 text-amber-700" /><p className="text-sm font-extrabold text-slate-900">Unable to preview this document.</p><p className="mt-2 text-sm text-slate-600">{evidence.original_filename} remains securely stored.</p><div className="mt-5 flex flex-wrap justify-center gap-2"><button type="button" onClick={() => setReloadKey((value) => value + 1)} className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-600">Retry Preview</button><button type="button" onClick={() => personnelAccomplishmentService.downloadEvidenceBlob(evidence.id, evidence.original_filename)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600">Open Document</button></div></div>}
          {blobUrl && isImage && <img src={blobUrl} alt={`Evidence: ${evidence.original_filename}`} className="max-h-full max-w-full object-contain" />}
          {blobUrl && !isImage && <iframe src={blobUrl} title={`Evidence: ${evidence.original_filename}`} className="h-full w-full rounded-lg bg-white" />}
        </div>
      </section>
    </div>
  )
}
