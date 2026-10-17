import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import PersonnelPdfEvidenceViewer from '../PersonnelPdfEvidenceViewer'
import { calculatePdfFitScale } from '../pdfFitScale'

describe('personnel PDF evidence preview', () => {
  it('fits a landscape page within both dimensions of the modal', () => {
    const scale = calculatePdfFitScale(1200, 800, 1000, 600)
    expect(scale).toBe(0.75)
    expect(1200 * scale).toBeLessThanOrEqual(1000)
    expect(800 * scale).toBeLessThanOrEqual(600)
  })

  it('fits portrait pages and refuses invalid dimensions', () => {
    expect(calculatePdfFitScale(600, 900, 1000, 600)).toBeCloseTo(2 / 3)
    expect(calculatePdfFitScale(0, 900, 1000, 600)).toBe(0)
  })

  it('provides page navigation and zoom controls without an embedded browser viewer', () => {
    const html = renderToStaticMarkup(<PersonnelPdfEvidenceViewer blobUrl="blob:test" fileName="proof.pdf" />)
    expect(html).toContain('Fit page')
    expect(html).toContain('Previous PDF page')
    expect(html).toContain('Next PDF page')
    expect(html).toContain('Zoom in')
    expect(html).not.toContain('<iframe')
  })
})
