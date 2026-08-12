/**
 * securityUtils.js
 * Frontend security helper utilities for HTML entity escaping, PII data masking, and debounced form submit guards.
 */

/**
 * Context-aware HTML entity encoding to mitigate XSS in dynamic renders
 * @param {string} str 
 * @returns {string}
 */
export function escapeHTML(str = '') {
  if (typeof str !== 'string') return String(str || '')
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Redacts / Masks Employee IDs for public display (e.g. "EMP-2021-0842" -> "EMP-••••-0842")
 * @param {string} empId 
 * @returns {string}
 */
export function maskEmployeeId(empId = '') {
  if (!empId || empId.length < 8) return empId || 'EMP-••••-0000'
  const parts = empId.split('-')
  if (parts.length >= 3) {
    return `${parts[0]}-••••-${parts[parts.length - 1]}`
  }
  return empId.slice(0, 3) + '-••••-' + empId.slice(-4)
}

/**
 * Redacts / Masks Email Addresses (e.g. "msantos@ndmu.edu.ph" -> "m••••s@ndmu.edu.ph")
 * @param {string} email 
 * @returns {string}
 */
export function maskEmail(email = '') {
  if (!email || !email.includes('@')) return 'user@ndmu.edu.ph'
  const [name, domain] = email.split('@')
  if (name.length <= 2) return `${name[0]}*@${domain}`
  return `${name[0]}••••${name[name.length - 1]}@${domain}`
}

/**
 * Creates a debounced handler to prevent double-click / form submit spam attacks
 * @param {Function} func 
 * @param {number} delayMs 
 * @returns {Function}
 */
export function createDebouncedSubmit(func, delayMs = 1000) {
  let isThrottled = false
  return function (...args) {
    if (isThrottled) return
    isThrottled = true
    func.apply(this, args)
    setTimeout(() => {
      isThrottled = false
    }, delayMs)
  }
}
