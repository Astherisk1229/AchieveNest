import React, { useEffect, useMemo, useState } from 'react'
import { ExternalLink, FileText, FileWarning, LoaderCircle, Minus, Plus, RotateCcw } from 'lucide-react'
import personnelAccomplishmentService from '../../../services/personnelAccomplishmentService'

const formatBytes = (value) => {
  const bytes = Number(value)
  if (!Number.isFinite(bytes) || bytes < 1) return ''
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FacultyDocumentViewer({ evidence = null, localFile = null, localPreviewUrl = '', onPersistedReady }) {
  const [persistedUrl, setPersistedUrl] = useState('')
  const [persistedState, setPersistedState] = useState(evidence?.id ? 'loading' : 'idle')
  const [reloadKey, setReloadKey] = useState(0)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    let active = true
    let currentUrl = ''
    setPersistedUrl('')
    setPersistedState(evidence?.id ? 'loading' : 'idle')
    setZoom(1)
    if (!evidence?.id) return undefined

    personnelAccomplishmentService.getEvidenceBlobUrl(evidence.id)
      .then((url) => {
        currentUrl = url
        if (active) {
          setPersistedUrl(url)
          setPersistedState('ready')
        } else URL.revokeObjectURL(url)
      })
      .catch(() => active && setPersistedState('failed'))

    return () => {
      active = false
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [evidence?.id, reloadKey])

  // A selected replacement remains authoritative until the persisted media itself
  // confirms it rendered. A successful fetch alone is not a safe handoff boundary.
  const source = localPreviewUrl || persistedUrl
  const showingPersisted = Boolean(persistedUrl && !localPreviewUrl)
  const metadata = showingPersisted ? evidence : (localFile || evidence)
  const mimeType = metadata?.detected_mime_type || metadata?.mime_type || metadata?.type || ''
  const filename = metadata?.original_filename || metadata?.name || 'Selected document'
  const byteSize = metadata?.byte_size || metadata?.file_size || metadata?.size
  const isImage = mimeType.startsWith('image/')
  const isPdf = mimeType === 'application/pdf'
  const label = showingPersisted ? 'Uploaded Document' : 'Selected Document'
  const statusText = useMemo(() => {
    if (persistedState === 'failed' && localPreviewUrl) return "The replacement is saved, but its saved preview isn't available yet. The selected document remains visible below."
    if (persistedState === 'loading' && localPreviewUrl) return 'Saving and verifying the replacement document…'
    if (persistedState === 'ready' && localPreviewUrl) return 'Replacement saved. Confirming the saved preview…'
    return ''
  }, [localPreviewUrl, persistedState])

  const confirmPersistedRender = () => {
    if (!persistedUrl || !evidence?.id) return
    onPersistedReady?.(evidence.id)
  }

  const failPersistedRender = () => {
    setPersistedUrl('')
    setPersistedState('failed')
  }

  if (!source && !evidence) return null

  return (
    <section aria-labelledby="faculty-document-viewer-title" className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-slate-950 shadow-[0_14px_35px_-22px_rgba(15,23,42,.8)]">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-slate-900 px-4 py-3 text-white">
        <div className="min-w-0">
          <h3 id="faculty-document-viewer-title" className="truncate text-sm font-extrabold">{label}</h3>
          <p className="mt-0.5 truncate text-xs text-slate-300">{filename}{formatBytes(byteSize) ? ` · ${formatBytes(byteSize)}` : ''}</p>
        </div>
        {source && isImage && (
          <div className="flex shrink-0 items-center gap-1" aria-label="Image zoom controls">
            <button type="button" onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))} disabled={zoom <= 0.5} className="rounded-lg p-2 text-slate-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-40" aria-label="Zoom out"><Minus className="h-4 w-4" /></button>
            <span className="w-11 text-center text-xs tabular-nums text-slate-300">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((value) => Math.min(3, value + 0.25))} disabled={zoom >= 3} className="rounded-lg p-2 text-slate-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-40" aria-label="Zoom in"><Plus className="h-4 w-4" /></button>
            <button type="button" onClick={() => setZoom(1)} className="rounded-lg p-2 text-slate-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white" aria-label="Fit image to viewer"><RotateCcw className="h-4 w-4" /></button>
          </div>
        )}
      </header>
      {statusText && <p role="status" className="bg-amber-50 px-4 py-2 text-xs font-semibold leading-5 text-amber-950">{statusText}</p>}
      <div className="relative flex h-[25rem] min-h-0 items-center justify-center overflow-auto bg-slate-200 lg:h-[calc(94vh-15rem)] lg:min-h-[31rem]">
        {localPreviewUrl && persistedUrl && evidence && String(evidence.detected_mime_type || evidence.mime_type || '').startsWith('image/') && <img src={persistedUrl} alt="" aria-hidden="true" className="hidden" onLoad={confirmPersistedRender} onError={failPersistedRender} />}
        {localPreviewUrl && persistedUrl && evidence && (evidence.detected_mime_type || evidence.mime_type) === 'application/pdf' && <iframe src={persistedUrl} title="Saved document preview verification" className="hidden" onLoad={confirmPersistedRender} />}
        {!source && persistedState === 'loading' && <div role="status" className="flex items-center gap-2 text-sm font-semibold text-slate-700"><LoaderCircle className="h-5 w-5 animate-spin" />Loading your document…</div>}
        {!source && persistedState === 'failed' && <div role="alert" className="max-w-sm p-6 text-center text-sm text-slate-800"><FileWarning className="mx-auto mb-3 h-8 w-8 text-amber-700" /><strong>Unable to load the saved document preview.</strong><p className="mt-2 text-slate-600">It remains safely stored, and you can continue entering the details.</p><div className="mt-5 flex flex-wrap justify-center gap-2"><button type="button" onClick={() => setReloadKey((value) => value + 1)} className="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-600">Retry Preview</button><button type="button" onClick={() => personnelAccomplishmentService.downloadEvidenceBlob(evidence.id, filename)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"><ExternalLink className="h-3.5 w-3.5" />Open Document</button></div></div>}
        {source && isImage && <img src={source} alt={`${label}: ${filename}`} onLoad={showingPersisted ? confirmPersistedRender : undefined} onError={showingPersisted ? failPersistedRender : undefined} className="max-h-full max-w-full origin-center object-contain transition-transform duration-200" style={{ transform: `scale(${zoom})` }} />}
        {source && isPdf && <iframe src={`${source}#toolbar=1&navpanes=0&view=FitH`} title={`${label}: ${filename}`} onLoad={showingPersisted ? confirmPersistedRender : undefined} className="h-full w-full border-0 bg-white" />}
        {source && !isImage && !isPdf && <div className="max-w-sm p-6 text-center text-sm text-slate-800"><FileText className="mx-auto mb-3 h-8 w-8" /><strong>{label}</strong><p className="mt-2 break-all text-slate-600">{filename}</p><p className="mt-1 text-slate-600">{mimeType || 'Document'}{formatBytes(byteSize) ? ` · ${formatBytes(byteSize)}` : ''}</p></div>}
      </div>
    </section>
  )
}
