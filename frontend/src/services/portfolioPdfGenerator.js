import html2canvas from 'html2canvas-pro'

const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89
const CAPTURE_WIDTH = 794
const CAPTURE_HEIGHT = 1123
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('An image could not be prepared for PDF export.'))
    reader.readAsDataURL(blob)
  })
}

async function inlineImageSources(root) {
  const inlineSource = async (element, attribute, source) => {
    if (!source) return

    try {
      if (source.startsWith('data:') || source.startsWith('#')) return
      const response = await fetch(source)
      if (!response.ok) throw new Error('Image request failed.')
      element.setAttribute(attribute, await blobToDataUrl(await response.blob()))
    } catch {
      throw new Error(`An image in the portfolio could not be prepared for PDF export. Refresh the preview and try again.`)
    }
  }

  for (const image of root.querySelectorAll('img')) {
    const source = image.currentSrc || image.getAttribute('src')
    await inlineSource(image, 'src', source)
    image.removeAttribute('srcset')
    image.removeAttribute('crossorigin')
    try { await image.decode() } catch {
      throw new Error(`The image “${image.alt || 'portfolio image'}” could not be prepared for PDF export. Refresh the preview and try again.`)
    }
  }

  // SVG can reference images and symbols without using an <img> tag. Inline all
  // external SVG hrefs (including <use> and <feImage>) before rasterization.
  for (const referencedElement of root.querySelectorAll('svg image, svg use, svg feImage')) {
    if (!referencedElement.hasAttribute('href') && !referencedElement.hasAttribute('xlink:href')) continue
    const attribute = referencedElement.hasAttribute('href') ? 'href' : 'xlink:href'
    const source = referencedElement.getAttribute(attribute)
    if (!source || source.startsWith('data:') || source.startsWith('#')) continue
    try {
      const resolved = new URL(source, document.baseURI)
      const fragment = resolved.hash
      resolved.hash = ''
      const response = await fetch(resolved.href)
      if (!response.ok) throw new Error('SVG asset request failed.')
      referencedElement.setAttribute(attribute, `${await blobToDataUrl(await response.blob())}${fragment}`)
    } catch {
      throw new Error('An SVG asset in the portfolio could not be prepared for PDF export. Refresh the preview and try again.')
    }
  }

  // SVG style blocks bypass element.style, so inline their url() assets as well.
  for (const styleElement of root.querySelectorAll('svg style')) {
    const styleText = styleElement.textContent || ''
    const references = [...styleText.matchAll(/url\((['"]?)(.*?)\1\)/g)]
    let nextStyleText = styleText
    for (const reference of references) {
      const value = reference[2].trim()
      if (!value || value.startsWith('#') || value.startsWith('data:')) continue
      try {
        const resolved = new URL(value, document.baseURI)
        const response = await fetch(resolved.href)
        if (!response.ok) throw new Error('SVG style asset request failed.')
        const dataUrl = await blobToDataUrl(await response.blob())
        nextStyleText = nextStyleText.replace(reference[0], `url("${dataUrl}")`)
      } catch {
        throw new Error('An SVG style asset in the portfolio could not be prepared for PDF export. Refresh the preview and try again.')
      }
    }
    styleElement.textContent = nextStyleText
  }
}

async function renderElement(element, width, height) {
  const canvas = await html2canvas(element, {
    allowTaint: false,
    backgroundColor: '#ffffff',
    foreignObjectRendering: false,
    height,
    logging: false,
    scale: 2,
    scrollX: 0,
    scrollY: 0,
    useCORS: true,
    width,
    windowHeight: height,
    windowWidth: width
  })
  return canvas.toDataURL('image/jpeg', 0.94)
}

function buildImagePdf(images, title) {
  const objects = []
  const add = value => { objects.push(value); return objects.length }
  const catalogId = add('')
  const pagesId = add('')
  const pageIds = []

  images.forEach((dataUrl, index) => {
    const raw = atob(dataUrl.slice(dataUrl.indexOf(',') + 1))
    const jpeg = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i += 1) jpeg[i] = raw.charCodeAt(i)
    const imageId = add(`<< /Type /XObject /Subtype /Image /Width ${CAPTURE_WIDTH * 2} /Height ${CAPTURE_HEIGHT * 2} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n${raw}\nendstream`)
    const content = `q\n${A4_WIDTH} 0 0 ${A4_HEIGHT} 0 0 cm\n/Im${index + 1} Do\nQ`
    const contentId = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
    const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${A4_WIDTH} ${A4_HEIGHT}] /Resources << /XObject << /Im${index + 1} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`)
    pageIds.push(pageId)
  })

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`
  objects[pagesId - 1] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] >>`
  let output = '%PDF-1.4\n% AchieveNest portfolio\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(output.length)
    output += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = output.length
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach(offset => { output += `${String(offset).padStart(10, '0')} 00000 n \n` })
  output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info << /Title (${title.replace(/[()\\]/g, '\\$&')}) >> >>\nstartxref\n${xrefOffset}\n%%EOF`
  const bytes = new Uint8Array(output.length)
  for (let index = 0; index < output.length; index += 1) bytes[index] = output.charCodeAt(index) & 0xff
  return new Blob([bytes], { type: 'application/pdf' })
}

/** Downloads the rendered portfolio pages directly as a PDF file. */
export const generatePortfolioPdf = async (title = 'Student_Portfolio') => {
  const pages = [...document.querySelectorAll('.student-portfolio-print-page')]
  if (!pages.length) throw new Error('Portfolio pages are not ready for PDF export.')

  const imagePages = []
  for (const page of pages) {
    // Evidence PDFs are shown in an iframe in the preview. Rasterize their first page
    // so the downloaded portfolio contains the actual document page as well.
    const clone = page.cloneNode(true)
    const originalFrames = [...page.querySelectorAll('iframe')]
    const clonedFrames = [...clone.querySelectorAll('iframe')]
    for (let index = 0; index < originalFrames.length; index += 1) {
      const frame = originalFrames[index]
      const frameClone = clonedFrames[index]
      try {
        const blob = await fetch(frame.src.split('#')[0]).then(response => response.blob())
        const [{ loadPdfjs }] = await Promise.all([import('../components/portfolio-booklet/pdfEvidenceRenderer.js')])
        const pdfjs = await loadPdfjs()
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise
        const pdfPage = await pdf.getPage(1)
        const viewport = pdfPage.getViewport({ scale: 1.3 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        await pdfPage.render({ canvasContext: canvas.getContext('2d'), viewport, canvas }).promise
        const image = document.createElement('img')
        image.src = canvas.toDataURL('image/jpeg', 0.9)
        image.style.cssText = 'width:100%;height:100%;object-fit:contain;background:#fff'
        frameClone.replaceWith(image)
        await pdf.destroy()
      } catch {
        const message = document.createElement('div')
        message.textContent = 'Supporting PDF could not be rendered.'
        message.style.cssText = 'padding:24px;text-align:center;color:#475569'
        frameClone.replaceWith(message)
      }
    }

    // Make every image self-contained before the DOM renderer paints the page.
    // The renderer is configured to reject any resource that would taint its canvas.
    await inlineImageSources(clone)

    // Render one A4 canvas page per designed portfolio page.
    const host = document.createElement('div')
    host.style.cssText = `position:fixed;left:0;top:0;width:${CAPTURE_WIDTH}px;height:${CAPTURE_HEIGHT}px;overflow:hidden;background:#fff;pointer-events:none;z-index:-2147483648`
    document.body.appendChild(host)
    try {
      host.appendChild(clone)
      clone.style.cssText += `;display:flex!important;position:relative!important;width:${CAPTURE_WIDTH}px!important;height:${CAPTURE_HEIGHT}px!important;min-height:${CAPTURE_HEIGHT}px!important;max-height:${CAPTURE_HEIGHT}px!important;overflow:hidden!important;background:#fff!important`
      imagePages.push(await renderElement(clone, CAPTURE_WIDTH, CAPTURE_HEIGHT))
    } finally {
      host.remove()
    }
  }

  const pdf = buildImagePdf(imagePages, title)
  const url = URL.createObjectURL(pdf)
  const link = document.createElement('a')
  link.href = url
  link.download = `${String(title || 'Student_Portfolio').replace(/[^a-z0-9_-]/gi, '_')}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const printPortfolio = () => window.print()

export const formatPortfolioDate = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch (e) {
    return dateString
  }
}
