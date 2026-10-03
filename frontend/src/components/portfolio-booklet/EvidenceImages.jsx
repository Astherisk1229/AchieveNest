import React, { useEffect, useRef, useState } from 'react'
import { FileWarning, LoaderCircle } from 'lucide-react'
import personnelAccomplishmentService from '../../services/personnelAccomplishmentService'
import { loadEvidenceImages } from './pdfEvidenceRenderer'

/**
 * The attached document drawn as images inside a booklet page.
 * eager = load immediately (print copy); otherwise load when the page scrolls into view.
 * onSettled fires once, whether the images loaded or not, so printing can wait for it.
 */
export default function EvidenceImages({ evidence, eager = false, onSettled }) {
  const rootRef = useRef(null)
  const settledRef = useRef(false)
  const [visible, setVisible] = useState(eager)
  const [state, setState] = useState({ status: 'idle', pages: [], truncated: 0 })

  useEffect(() => {
    if (visible || eager) return undefined
    const element = rootRef.current
    if (!element || typeof IntersectionObserver === 'undefined') { setVisible(true); return undefined }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { setVisible(true); observer.disconnect() }
    }, { rootMargin: '600px 0px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [visible, eager])

  useEffect(() => {
    if (!visible || !evidence?.id) return undefined
    let active = true
    setState({ status: 'loading', pages: [], truncated: 0 })
    loadEvidenceImages(evidence, (id) => personnelAccomplishmentService.getEvidenceBlobUrl(id))
      .then((result) => { if (active) setState({ status: result.pages.length ? 'ready' : 'empty', ...result }) })
      .catch(() => { if (active) setState({ status: 'error', pages: [], truncated: 0 }) })
    return () => { active = false }
  }, [visible, evidence?.id])

  useEffect(() => {
    if (settledRef.current || !['ready', 'empty', 'error'].includes(state.status)) return
    settledRef.current = true
    onSettled?.()
  }, [state.status, onSettled])

  return (
    <div ref={rootRef} className="mt-6 space-y-4">
      {(state.status === 'idle' || state.status === 'loading') && (
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-500 print:hidden"><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />Loading document…</p>
      )}
      {state.status === 'error' && (
        <p className="flex items-center gap-2 rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900"><FileWarning className="h-4 w-4 shrink-0" aria-hidden="true" />The attached document could not be displayed.</p>
      )}
      {state.status === 'empty' && <p className="text-xs italic text-slate-500">This file type cannot be shown as an image.</p>}
      {state.pages.map((src, index) => (
        <img key={index} src={src} alt={`${evidence.original_filename || 'Evidence'} — page ${index + 1}`} className="mx-auto block max-h-[860px] w-auto max-w-full border border-slate-300 object-contain" />
      ))}
      {state.truncated > 0 && <p className="text-center text-[10px] text-slate-500">{state.truncated} more page{state.truncated === 1 ? '' : 's'} not shown.</p>}
    </div>
  )
}
