import { describe, it, expect } from 'vitest'
import {
  isValidHex,
  normalizeHex,
  hexToRgb,
  calculateLuminance,
  getContrastRatio,
  getAccessibleTextColor
} from '../colorContrast.js'

describe('Color Contrast Utilities (Phase C)', () => {
  describe('isValidHex & normalizeHex', () => {
    it('validates 6-digit hex strings correctly', () => {
      expect(isValidHex('#FFFFFF')).toBe(true)
      expect(isValidHex('#ffffff')).toBe(true)
      expect(isValidHex('#16834a')).toBe(true)
      expect(isValidHex('#E9EEF5')).toBe(true)
      expect(isValidHex(' #000000 ')).toBe(true)
    })

    it('rejects invalid hex strings', () => {
      expect(isValidHex('')).toBe(false)
      expect(isValidHex(null)).toBe(false)
      expect(isValidHex(undefined)).toBe(false)
      expect(isValidHex('#FFF')).toBe(false)
      expect(isValidHex('red')).toBe(false)
      expect(isValidHex('rgb(0,0,0)')).toBe(false)
      expect(isValidHex('#GGGGGG')).toBe(false)
      expect(isValidHex('#1234567')).toBe(false)
    })

    it('normalizes valid hex strings to uppercase', () => {
      expect(normalizeHex('#ffffff')).toBe('#FFFFFF')
      expect(normalizeHex(' #16834a ')).toBe('#16834A')
      expect(normalizeHex('invalid')).toBeNull()
    })
  })

  describe('hexToRgb & calculateLuminance', () => {
    it('converts hex to accurate RGB values', () => {
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 })
    })

    it('calculates WCAG relative luminance correctly', () => {
      expect(calculateLuminance('#000000')).toBeCloseTo(0, 4)
      expect(calculateLuminance('#FFFFFF')).toBeCloseTo(1, 4)
    })
  })

  describe('getContrastRatio & getAccessibleTextColor (Test Matrix)', () => {
    const dark = '#0F172A'
    const light = '#FFFFFF'

    it('selects dark text for #FFFFFF (pure white background)', () => {
      expect(getAccessibleTextColor('#FFFFFF', dark, light)).toBe(dark)
    })

    it('selects light text for #000000 (pure black background)', () => {
      expect(getAccessibleTextColor('#000000', dark, light)).toBe(light)
    })

    it('selects dark text for #E9EEF5 (light slate background)', () => {
      expect(getAccessibleTextColor('#E9EEF5', dark, light)).toBe(dark)
    })

    it('selects dark text for #FFFF00 (bright yellow background)', () => {
      expect(getAccessibleTextColor('#FFFF00', dark, light)).toBe(dark)
    })

    it('selects light text for #003366 (dark navy background)', () => {
      expect(getAccessibleTextColor('#003366', dark, light)).toBe(light)
    })

    it('maintains compliant contrast ratio for #176B43 (emerald green background)', () => {
      const textColor = getAccessibleTextColor('#176B43', dark, light)
      const ratio = getContrastRatio('#176B43', textColor)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
      expect(textColor).toBe(light)
    })

    it('falls back safely to dark text on invalid hex inputs', () => {
      expect(getAccessibleTextColor('invalid-color', dark, light)).toBe(dark)
      expect(getAccessibleTextColor(null, dark, light)).toBe(dark)
    })
  })
})
