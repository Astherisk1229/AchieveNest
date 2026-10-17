import React, { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, LoaderCircle, Minus, Plus } from 'lucide-react'
import { loadPdfjs } from '../../../components/portfolio-booklet/pdfEvidenceRenderer'
import { calculatePdfFitScale } from './pdfFitScale'

export default function PersonnelPdfEvidenceViewer({ blobUrl, fileName }) {
  const viewportRef = useRef(null)
  const canvasRef = useRef(null)
  const [document, setDocument] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [loading, setLoading] = useState(true)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const element = viewportRef.current
    if (!element) return undefined
    const update = () => {
      const bounds = element.getBoundingClientRect()
      const width = Math.floor(bounds.width)
      const height = Math.floor(bounds.height)
      setSize(current => current.width === width && current.height === height ? current : { width, height })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let active = true
    let task
    let loadedDocument
    setDocument(null)
    setPageNumber(1)
    setZoom(1)
    setError('')
    setLoading(true)
    if (canvasRef.current) {
      canvasRef.current.width = 0
      canvasRef.current.height = 0
    }
    ;(async () => {
      const pdfjs = await loadPdfjs()
      const response = await fetch(blobUrl)
      if (!response.ok) throw new Error('The evidence PDF could not be loaded.')
      task = pdfjs.getDocument({ data: new Uint8Array(await response.arrayBuffer()) })
      loadedDocument = await task.promise
      if (active) setDocument(loadedDocument)
      else await loadedDocument.destroy()
    })().catch(() => { if (active) setError('The PDF could not be displayed. Use Open in new tab or Download to inspect the original file.') })
      .finally(() => { if (active) setLoading(false) })
    return () => {
      active = false
      if (loadedDocument) void loadedDocument.destroy()
      else if (task) void task.destroy()
    }
  }, [blobUrl])

  useEffect(() => {
    if (!document || !canvasRef.current || size.width < 1 || size.height < 1) return undefined
    let active = true
    let renderTask
    let page
    setRendering(true)
    ;(async () => {
      page = await document.getPage(pageNumber)
      if (!active) return
      const base = page.getViewport({ scale: 1 })
      const fit = calculatePdfFitScale(base.width, base.height, Math.max(1, size.width - 24), Math.max(1, size.height - 24))
      if (!fit) return
      const viewport = page.getViewport({ scale: fit * zoom })
      const canvas = canvasRef.current
      if (!canvas) return
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.ceil(viewport.width * pixelRatio)
      canvas.height = Math.ceil(viewport.height * pixelRatio)
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      renderTask = page.render({
        canvas,
        canvasContext: canvas.getContext('2d'),
        viewport,
        transform: [pixelRatio, 0, 0, pixelRatio, 0, 0],
      })
      await renderTask.promise
      if (active) setRendering(false)
    })().catch(cause => {
      if (active && cause?.name !== 'RenderingCancelledException') setError('The PDF page could not be displayed. Open the original file to inspect it.')
    })
    return () => {
      active = false
      renderTask?.cancel()
      page?.cleanup()
    }
  }, [document, pageNumber, size.width, size.height, zoom])

  return <div className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col bg-slate-100" aria-label={`PDF evidence: ${fileName}`}>
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 sm:px-4">
      <div className="flex items-center gap-1" role="group" aria-label="PDF pages">
        <button type="button" onClick={() => setPageNumber(value => Math.max(1, value - 1))} disabled={!document || pageNumber <= 1} aria-label="Previous PDF page" className="rounded-md p-2 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
        <span className="min-w-14 text-center font-semibold tabular-nums">{pageNumber} / {document?.numPages || '—'}</span>
        <button type="button" onClick={() => setPageNumber(value => Math.min(document?.numPages || 1, value + 1))} disabled={!document || pageNumber >= document.numPages} aria-label="Next PDF page" className="rounded-md p-2 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="flex items-center gap-1" role="group" aria-label="PDF zoom">
        <button type="button" onClick={() => setZoom(value => Math.max(0.5, Math.round((value - 0.25) * 100) / 100))} disabled={!document || zoom <= 0.5} aria-label="Zoom out" className="rounded-md p-2 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-40"><Minus className="h-4 w-4" /></button>
        <span className="min-w-12 text-center font-semibold tabular-nums">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom(value => Math.min(3, Math.round((value + 0.25) * 100) / 100))} disabled={!document || zoom >= 3} aria-label="Zoom in" className="rounded-md p-2 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-40"><Plus className="h-4 w-4" /></button>
        <button type="button" onClick={() => setZoom(1)} disabled={!document || zoom === 1} className="ml-1 rounded-md px-2 py-2 font-semibold hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-40">Fit page</button>
      </div>
    </div>
    <div ref={viewportRef} className="relative min-h-0 min-w-0 flex-1 overflow-auto p-3">
      {error && <p role="alert" className="absolute inset-x-4 top-4 z-10 rounded-lg bg-white p-4 text-center text-sm font-semibold text-rose-800 shadow-sm">{error}</p>}
      {(loading || rendering) && !error && <p role="status" className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"><LoaderCircle className="h-4 w-4 animate-spin" />{loading ? 'Loading PDF…' : 'Rendering page…'}</p>}
      <div className="flex min-h-full min-w-full items-center justify-center"><canvas ref={canvasRef} aria-label={`Page ${pageNumber} of ${fileName}`} className={document && !error ? 'block bg-white shadow-md' : 'hidden'} /></div>
    </div>
  </div>
}
