/**
 * safeCsvExport.js
 * Utility for generating safe CSV files with formula-injection mitigation,
 * proper quote escaping, UTF-8 BOM encoding, and memory URL cleanup.
 */

/**
 * Escapes a single value for safe CSV output.
 * Prevents formula injection (e.g., =cmd|' /C ...'!A1) by prefixing leading formula triggers.
 */
export function sanitizeCsvCell(value) {
  if (value === null || value === undefined) {
    return '""'
  }

  let strVal = String(value)

  // Mitigate CSV Formula Injection (Excel / Google Sheets / LibreOffice)
  if (/^[=+\-@\t\r]/.test(strVal)) {
    strVal = "'" + strVal
  }

  // Escape internal double quotes by doubling them
  const escaped = strVal.replace(/"/g, '""')

  // Always wrap in double quotes to preserve commas and newlines
  return `"${escaped}"`
}

/**
 * Converts a 2D array of rows (headers + data rows) into a safe CSV Blob and triggers browser download.
 * @param {string} filename - Target filename (e.g. NDMU_HR_Audit_Trail_2026-08-19.csv)
 * @param {Array<Array<any>>} rows - 2D matrix of row arrays
 */
export function exportSafeCsv(filename, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    console.warn('exportSafeCsv: No rows to export.')
    return false
  }

  const csvLines = rows.map(row => {
    if (!Array.isArray(row)) return ''
    return row.map(cell => sanitizeCsvCell(cell)).join(',')
  })

  const csvString = csvLines.join('\r\n')

  // Prepend UTF-8 Byte Order Mark (BOM) for Excel compatibility
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename || 'export.csv')
  document.body.appendChild(link)
  link.click()

  // Clean up DOM and revoke Blob URL
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 150)

  return true
}

export default exportSafeCsv
