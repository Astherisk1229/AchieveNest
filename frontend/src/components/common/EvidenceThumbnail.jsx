import React, { useEffect, useState } from 'react'
import { FileWarning, FileX2, LoaderCircle } from 'lucide-react'
import portfolioService from '../../services/portfolioService'

const PREVIEWABLE = ['application/pdf', 'image/jpeg', 'image/png']

/** The uploaded file itself (image, or first PDF page), fetched through the protected download endpoint. */
export function evidenceMime(evidence) {
  return evidence?.detected_mime_type || evidence?.mime_type || ''
}

export function useEvidenceObjectUrl(evidence) {
  const [state, setState] = useState({ url: null, loading: false, failed: false })
  const id = evidence?.id || null
  const previewable = PREVIEWABLE.includes(evidenceMime(evidence))
  useEffect(() => {
    if (!id || !previewable) { setState({ url: null, loading: false, failed: false }); return undefined }
    let cancelled = false
    let url = null
    setState({ url: null, loading: true, failed: false })
    portfolioService.downloadEvidence(id)
      .then(blob => {
        if (cancelled) return
        url = URL.createObjectURL(blob)
        setState({ url, loading: false, failed: false })
      })
      .catch(() => { if (!cancelled) setState({ url: null, loading: false, failed: true }) })
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url) }
  }, [id, previewable])
  return state
}

/**
 * Card/preview thumbnail of the real document. With no document it says so explicitly
 * instead of showing a generic icon, so placeholders can't be mistaken for proof.
 */
export default function EvidenceThumbnail({ evidence, className = 'h-32', fit = 'object-cover', interactive = false }) {
  const { url, loading, failed } = useEvidenceObjectUrl(evidence)
  const base = `flex w-full items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-900 ${className}`

  if (!evidence) {
    return <div className={`${base} flex-col gap-1 text-slate-500`}><FileX2 className="h-5 w-5" aria-hidden="true"/><span className="text-[11px] font-semibold">No document attached</span></div>
  }
  if (loading) {
    return <div className={base}><LoaderCircle className="h-5 w-5 animate-spin text-slate-400" aria-label="Loading document preview"/></div>
  }
  if (!url || failed) {
    return <div className={`${base} flex-col gap-1 px-3 text-center text-slate-500`}><FileWarning className="h-5 w-5" aria-hidden="true"/><span className="text-[11px] font-semibold">Preview unavailable</span><span className="max-w-full truncate text-[10px]">{evidence.original_filename}</span></div>
  }
  if (evidenceMime(evidence) === 'application/pdf') {
    return <div className={base}><iframe title={`Preview of ${evidence.original_filename}`} src={`${url}#page=1&view=FitH&toolbar=${interactive ? 1 : 0}`} className={`${interactive ? '' : 'pointer-events-none'} h-full w-full border-0`} tabIndex={interactive ? 0 : -1}/></div>
  }
  return <div className={base}><img src={url} alt={`Document: ${evidence.original_filename}`} className={`h-full w-full ${fit}`}/></div>
}
