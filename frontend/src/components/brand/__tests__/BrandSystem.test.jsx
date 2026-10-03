import React from 'react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BRAND } from '../../../config/brand'
import AchieveNestLogo from '../AchieveNestLogo'
import BrandLockup from '../BrandLockup'

describe('official AchieveNest brand system', () => {
  it('exposes one canonical identity and protected variants', () => {
    expect(BRAND.productName).toBe('AchieveNest')
    expect(BRAND.browserTitle).toBe('AchieveNest — NDMU Portal')
    for (const variant of ['horizontal', 'stacked', 'mark']) {
      const html = renderToStaticMarkup(<AchieveNestLogo variant={variant} size="compact" />)
      expect(html).toContain('alt="AchieveNest"')
      expect(html).toContain('object-contain')
    }
  })

  it('keeps the portal label outside the official artwork', () => {
    const expanded = renderToStaticMarkup(<BrandLockup />)
    const compact = renderToStaticMarkup(<BrandLockup compact />)
    expect(expanded).toContain('NDMU Portal')
    expect(compact).not.toContain('NDMU Portal')
  })

  it('removes the draft sidebar monogram and manually typed wordmark', () => {
    const sidebarPath = fileURLToPath(new URL('../../layout/Sidebar.jsx', import.meta.url))
    const source = readFileSync(sidebarPath, 'utf8')
    expect(source).toContain('<BrandLockup')
    expect(source).not.toMatch(/>\s*AN\s*</)
    expect(source).not.toMatch(/>\s*AchieveNest\s*</)
  })
})
