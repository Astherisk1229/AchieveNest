const TARGET_BYTES = 2 * 1024 * 1024
const OPTIMIZE_ABOVE_BYTES = 2.5 * 1024 * 1024
const OPTIMIZATION_PASSES = [
  { maxEdge: 2200, quality: 0.86 },
  { maxEdge: 1700, quality: 0.8 }
]

const formatMiB = bytes => `${(bytes / (1024 * 1024)).toFixed(1)} MiB`

function canvasToJpeg(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Image optimization failed.')), 'image/jpeg', quality)
  })
}

/**
 * Shrink large image evidence in the browser before upload. PDFs are deliberately left alone
 * because rasterizing them would remove selectable text and can make documents harder to read.
 */
export async function compressEvidenceImage(file) {
  if (!file || !['image/jpeg', 'image/png'].includes(file.type) || file.size < OPTIMIZE_ABOVE_BYTES) {
    return { file, optimized: false }
  }

  if (typeof createImageBitmap !== 'function') return { file, optimized: false }

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return { file, optimized: false }

    let bestBlob = null
    for (const pass of OPTIMIZATION_PASSES) {
      const scale = Math.min(1, pass.maxEdge / Math.max(bitmap.width, bitmap.height))
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      context.fillStyle = '#fff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

      const blob = await canvasToJpeg(canvas, pass.quality)
      if (!bestBlob || blob.size < bestBlob.size) bestBlob = blob
      if (bestBlob?.size <= TARGET_BYTES) break
    }

    if (!bestBlob || bestBlob.size >= file.size) return { file, optimized: false }
    const baseName = file.name.replace(/\.(jpe?g|png)$/i, '') || 'evidence'
    const optimizedFile = new File([bestBlob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: file.lastModified
    })
    return {
      file: optimizedFile,
      optimized: true,
      originalSize: file.size,
      optimizedSize: optimizedFile.size,
      sizeLabel: `${formatMiB(file.size)} to ${formatMiB(optimizedFile.size)}`
    }
  } catch {
    // Keep the original evidence available if this browser cannot decode or optimize it.
    return { file, optimized: false }
  } finally {
    bitmap?.close?.()
  }
}
