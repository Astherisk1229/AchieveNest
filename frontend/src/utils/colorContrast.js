/**
 * colorContrast.js
 * Centralized WCAG 2.1-compliant color luminance and contrast ratio utilities.
 */

/**
 * Validates a 6-digit hex color string (e.g. #FFFFFF, #16834a).
 * @param {string} hex 
 * @returns {boolean}
 */
export function isValidHex(hex) {
  if (typeof hex !== 'string') return false
  return /^#[0-9A-Fa-f]{6}$/.test(hex.trim())
}

/**
 * Normalizes a hex color string to uppercase `#RRGGBB` format.
 * Returns null if invalid.
 * @param {string} hex 
 * @returns {string|null}
 */
export function normalizeHex(hex) {
  if (!isValidHex(hex)) return null
  return hex.trim().toUpperCase()
}

/**
 * Converts a 6-digit hex color string to an RGB object.
 * @param {string} hex 
 * @returns {{ r: number, g: number, b: number } | null}
 */
export function hexToRgb(hex) {
  if (!isValidHex(hex)) return null
  const cleanHex = hex.trim().replace(/^#/, '')
  const num = parseInt(cleanHex, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  }
}

/**
 * Calculates relative luminance of a color per WCAG 2.1 formula.
 * @param {string} hex 
 * @returns {number} Relative luminance value between 0 and 1.
 */
export function calculateLuminance(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0

  const sRGB = [rgb.r, rgb.g, rgb.b].map((val) => {
    const s = val / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2]
}

/**
 * Computes contrast ratio between two hex colors per WCAG 2.1 formula.
 * @param {string} hex1 
 * @param {string} hex2 
 * @returns {number} Contrast ratio (1.0 to 21.0).
 */
export function getContrastRatio(hex1, hex2) {
  const lum1 = calculateLuminance(hex1)
  const lum2 = calculateLuminance(hex2)
  const brighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return (brighter + 0.05) / (darker + 0.05)
}

/**
 * Automatically determines the most accessible text foreground color (dark or light)
 * against a given background color to satisfy WCAG contrast requirements.
 *
 * @param {string} backgroundHex Background color in #RRGGBB format.
 * @param {string} [darkColor='#0F172A'] Slate-900 / Dark neutral text.
 * @param {string} [lightColor='#FFFFFF'] Pure white text.
 * @returns {string} The chosen accessible text color (darkColor or lightColor).
 */
export function getAccessibleTextColor(
  backgroundHex,
  darkColor = '#0F172A',
  lightColor = '#FFFFFF'
) {
  if (!isValidHex(backgroundHex)) {
    return darkColor
  }

  const contrastWithDark = getContrastRatio(backgroundHex, darkColor)
  const contrastWithLight = getContrastRatio(backgroundHex, lightColor)

  return contrastWithLight > contrastWithDark ? lightColor : darkColor
}
