import React, { useEffect, useRef, useState } from 'react'
import { Download, ExternalLink, FileWarning, LoaderCircle, LocateFixed, X } from 'lucide-react'
import personnelAccomplishmentService from '../../../services/personnelAccomplishmentService'

/**
 * In-context evidence preview for the Faculty Academic portfolio viewer.
 * Uses the same authenticated evidence stream as PersonnelEvidencePreviewModal
 * (GET /evidence/personnel/:id/preview). The file is only fetched when the drawer opens.
 */
export default function BookletEvidenceDrawer({ item, criterionLabel = '', onClose, onLocate }) {
  const evidence = item?.evidence || null
  const [blobUrl, setBlobUrl] = useState('')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const closeRef = useRef(null)

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
    if (evidence) closeRef.current?.focus()
  }, [evidence])

  if (!item || !evidence) return null
  const isImage = String(evidence.mime_type || '').startsWith('image/')
  const filename = evidence.original_filename || 'Persisted evidence'

  return (
    <aside
      className="fixed inset-0 z-[60] flex flex-col bg-white lg:static lg:z-auto lg:w-[400px] lg:border-l lg:border-slate-300 2xl:w-[480px] print:hidden"
      role="complementary"
      aria-labelledby="booklet-evidence-title"
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">Supporting Evidence · {item.reference}</p>
          <h3 id="booklet-evidence-title" className="mt-0.5 line-clamp-2 text-sm font-extrabold text-slate-900">{item.accomplishment_display || '—'}</h3>
        </div>
        <button ref={closeRef} type="button" onClick={onClose} className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600" aria-label="Close evidence preview (Escape)">
          <X className="h-5 w-5" />
        </button>
      </header>

      <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 border-b border-slate-200 px-4 py-3 text-xs">
        <dt className="font-bold text-slate-500">Criterion</dt><dd className="text-slate-800">{criterionLabel || item.criterionKey}</dd>
        <dt className="font-bold text-slate-500">Document</dt><dd className="break-all text-slate-800">{filename}</dd>
        <dt className="font-bold text-slate-500">Status</dt><dd className="text-slate-800">{item.status || '—'}</dd>
        <dt className="font-bold text-slate-500">Evidence ID</dt><dd className="break-all font-mono text-[11px] text-slate-700">{evidence.id}</dd>
      </dl>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 px-4 py-2">
        {onLocate && <button type="button" onClick={onLocate} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><LocateFixed className="h-3.5 w-3.5" />Show record in portfolio</button>}
        {blobUrl && <a href={blobUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><ExternalLink className="h-3.5 w-3.5" />Open in new tab</a>}
        <button type="button" onClick={() => personnelAccomplishmentService.downloadEvidenceBlob(evidence.id, filename).catch(() => setError('The evidence could not be downloaded.'))} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><Download className="h-3.5 w-3.5" />Download</button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-100 p-2">
        {!blobUrl && !error && <div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><LoaderCircle className="h-5 w-5 animate-spin" /> Loading protected evidence…</div>}
        {error && (
          <div className="max-w-sm rounded-xl bg-white p-5 text-center shadow-sm">
            <FileWarning className="mx-auto mb-3 h-8 w-8 text-amber-700" />
            <p className="text-sm font-extrabold text-slate-900">Unable to preview this document.</p>
            <p className="mt-2 text-xs text-slate-600">{error}</p>
            <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-4 rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">Retry Preview</button>
          </div>
        )}
        {blobUrl && isImage && <img src={blobUrl} alt={`Evidence: ${filename}`} className="max-h-full max-w-full object-contain" />}
        {blobUrl && !isImage && <iframe src={blobUrl} title={`Evidence: ${filename}`} className="h-full w-full rounded bg-white" />}
      </div>
    </aside>
  )
}
