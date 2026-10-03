/**
 * Turns a personnel evidence file into page images for the Portfolio Booklet and its PDF.
 * Images are used as-is; PDFs are rasterized page by page with pdf.js (loaded only when needed),
 * so the printed booklet shows the actual documents and never a link.
 */
const imageCache = new Map()
const MAX_PDF_PAGES = 12
const RENDER_WIDTH = 1240 // px — about 150 dpi on an A4 page

let pdfjsPromise = null
const loadPdfjs = async () => {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      // Legacy build: works in older browsers (the modern build needs very recent JS features).
      import('pdfjs-dist/legacy/build/pdf.mjs'),
      import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')
    ]).then(([pdfjs, worker]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default
      return pdfjs
    })
  }
  return pdfjsPromise
}

async function pdfToImages(blob) {
  const pdfjs = await loadPdfjs()
  const document = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise
  const pages = []
  const count = Math.min(document.numPages, MAX_PDF_PAGES)
  for (let index = 1; index <= count; index += 1) {
    const page = await document.getPage(index)
    const base = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: RENDER_WIDTH / base.width })
    const canvas = window.document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    await page.render({ canvasContext: canvas.getContext('2d'), viewport, canvas }).promise
    pages.push(canvas.toDataURL('image/jpeg', 0.88))
    page.cleanup()
  }
  await document.destroy()
  return { pages, truncated: document.numPages > count ? document.numPages - count : 0 }
}

/**
 * @param {{ id: string, mime_type?: string }} evidence
 * @param {(id: string) => Promise<string>} getBlobUrl  authenticated blob URL loader
 * @returns {Promise<{ pages: string[], truncated: number }>}
 */
export function loadEvidenceImages(evidence, getBlobUrl) {
  if (!evidence?.id) return Promise.resolve({ pages: [], truncated: 0 })
  if (imageCache.has(evidence.id)) return imageCache.get(evidence.id)
  const job = (async () => {
    const url = await getBlobUrl(evidence.id)
    const blob = await fetch(url).then((response) => response.blob())
    const type = String(blob.type || evidence.mime_type || '').toLowerCase()
    if (type.startsWith('image/')) {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      return { pages: [dataUrl], truncated: 0 }
    }
    if (type.includes('pdf')) return pdfToImages(blob)
    return { pages: [], truncated: 0 }
  })()
  imageCache.set(evidence.id, job)
  job.catch(() => imageCache.delete(evidence.id))
  return job
}
