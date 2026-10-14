import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const source = readFileSync(fileURLToPath(new URL('../modals/ExportPortfolioPreviewModal.jsx', import.meta.url)), 'utf8')

describe('C2: student portfolio PDF prints every page, not the screen', () => {
  it('prints a dedicated copy of all pages through the shared print area', () => {
    expect(source).toContain('className="print-area print-show student-portfolio-print"')
    expect(source).not.toContain("style={{ display: 'none' }}")
    expect(source).toContain('{pagesList.map((page, idx) => (')
    expect(source).toContain('break-after: page')
  })

  it('does not rely on an inline hidden print portal', () => {
    const css = readFileSync(fileURLToPath(new URL('../../../index.css', import.meta.url)), 'utf8')
    expect(css).toContain('.student-portfolio-print { display: none; }')
    expect(css).toContain('.student-portfolio-print * { visibility: visible !important; }')
    expect(css).toContain('display: block !important;')
  })

  it('uses the same page renderer for the preview and the printed copy', () => {
    expect(source).toContain('{renderPageBody(activePage)}')
    expect(source).toContain('{renderPageBody(page)}')
  })
})
