/**
 * Minimal, dependency-free .xlsx reader for on-screen previews.
 *
 * Reads the workbook's worksheets as plain cell text (shared strings, inline strings,
 * numbers, booleans) and merged-cell ranges. Formatting, formulas and dates are not
 * interpreted; the cached cell value is shown as stored. Uses the browser's
 * DecompressionStream, so nothing is uploaded or sent anywhere.
 */

const MAX_ROWS = 300
const MAX_COLS = 40

const textDecoder = new TextDecoder('utf-8')

function findEndOfCentralDirectory(view) {
  for (let offset = view.byteLength - 22; offset >= Math.max(0, view.byteLength - 65557); offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset
  }
  throw new Error('This file is not a readable .xlsx workbook.')
}

/** Lists the zip entries: name → { method, compressedSize, dataOffset }. */
export function readZipDirectory(buffer) {
  const view = new DataView(buffer)
  const end = findEndOfCentralDirectory(view)
  const count = view.getUint16(end + 10, true)
  let pointer = view.getUint32(end + 16, true)
  const entries = new Map()
  for (let index = 0; index < count; index += 1) {
    if (view.getUint32(pointer, true) !== 0x02014b50) break
    const method = view.getUint16(pointer + 10, true)
    const compressedSize = view.getUint32(pointer + 20, true)
    const nameLength = view.getUint16(pointer + 28, true)
    const extraLength = view.getUint16(pointer + 30, true)
    const commentLength = view.getUint16(pointer + 32, true)
    const localOffset = view.getUint32(pointer + 42, true)
    const name = textDecoder.decode(new Uint8Array(buffer, pointer + 46, nameLength))
    const localNameLength = view.getUint16(localOffset + 26, true)
    const localExtraLength = view.getUint16(localOffset + 28, true)
    entries.set(name, { method, compressedSize, dataOffset: localOffset + 30 + localNameLength + localExtraLength })
    pointer += 46 + nameLength + extraLength + commentLength
  }
  return entries
}

async function readEntry(buffer, entries, name) {
  const entry = entries.get(name)
  if (!entry) return null
  const bytes = new Uint8Array(buffer, entry.dataOffset, entry.compressedSize)
  if (entry.method === 0) return textDecoder.decode(bytes)
  if (entry.method !== 8) throw new Error('This workbook uses an unsupported compression method.')
  if (typeof DecompressionStream !== 'function') throw new Error('This browser cannot preview workbooks. Download the file instead.')
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return textDecoder.decode(await new Response(stream).arrayBuffer())
}

const parseXml = (text) => new DOMParser().parseFromString(text, 'application/xml')
const byTag = (node, tag) => Array.from(node.getElementsByTagName(tag))

/** "AB12" → { row: 11, col: 27 } (zero-based). */
export function cellPosition(reference) {
  const match = /^([A-Z]+)(\d+)$/.exec(String(reference || '').toUpperCase())
  if (!match) return null
  let col = 0
  for (const letter of match[1]) col = col * 26 + (letter.charCodeAt(0) - 64)
  return { row: Number(match[2]) - 1, col: col - 1 }
}

function resolveTarget(target) {
  const clean = String(target || '').replace(/^\//, '')
  return clean.startsWith('xl/') ? clean : `xl/${clean}`
}

function formatNumber(raw) {
  const value = Number(raw)
  if (!Number.isFinite(value)) return raw
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)))
}

function parseSheet(xml, sharedStrings) {
  const doc = parseXml(xml)
  const cells = new Map()
  let maxRow = -1
  let maxCol = -1
  for (const cell of byTag(doc, 'c')) {
    const position = cellPosition(cell.getAttribute('r'))
    if (!position || position.row >= MAX_ROWS || position.col >= MAX_COLS) continue
    const type = cell.getAttribute('t')
    const valueNode = byTag(cell, 'v')[0]
    let value = ''
    if (type === 's') value = sharedStrings[Number(valueNode?.textContent)] ?? ''
    else if (type === 'inlineStr') value = byTag(cell, 't').map((node) => node.textContent).join('')
    else if (type === 'b') value = valueNode?.textContent === '1' ? 'TRUE' : 'FALSE'
    else if (type === 'str' || type === 'e') value = valueNode?.textContent ?? ''
    else if (valueNode) value = formatNumber(valueNode.textContent)
    value = String(value).trim()
    if (!value) continue
    cells.set(`${position.row}:${position.col}`, value)
    maxRow = Math.max(maxRow, position.row)
    maxCol = Math.max(maxCol, position.col)
  }

  const merges = []
  for (const merge of byTag(doc, 'mergeCell')) {
    const [from, to] = String(merge.getAttribute('ref') || '').split(':').map(cellPosition)
    if (!from || !to || from.row >= MAX_ROWS || from.col >= MAX_COLS) continue
    merges.push({ row: from.row, col: from.col, rowSpan: Math.min(to.row, maxRow) - from.row + 1, colSpan: Math.min(to.col, maxCol) - from.col + 1 })
  }

  const rows = []
  for (let row = 0; row <= maxRow; row += 1) {
    const values = []
    for (let col = 0; col <= maxCol; col += 1) values.push(cells.get(`${row}:${col}`) ?? '')
    rows.push(values)
  }
  return { rows, merges: merges.filter((merge) => merge.rowSpan > 0 && merge.colSpan > 0), truncated: maxRow >= MAX_ROWS - 1 }
}

/** Parses an .xlsx ArrayBuffer into [{ name, rows: string[][], merges }]. */
export async function readXlsxWorkbook(buffer) {
  const entries = readZipDirectory(buffer)
  const workbookXml = await readEntry(buffer, entries, 'xl/workbook.xml')
  if (!workbookXml) throw new Error('This file is not a readable .xlsx workbook.')
  const relsXml = await readEntry(buffer, entries, 'xl/_rels/workbook.xml.rels')
  const targets = new Map(relsXml ? byTag(parseXml(relsXml), 'Relationship').map((rel) => [rel.getAttribute('Id'), resolveTarget(rel.getAttribute('Target'))]) : [])
  const sharedXml = await readEntry(buffer, entries, 'xl/sharedStrings.xml')
  const sharedStrings = sharedXml ? byTag(parseXml(sharedXml), 'si').map((item) => byTag(item, 't').map((node) => node.textContent).join('')) : []

  const sheets = []
  for (const [index, sheet] of byTag(parseXml(workbookXml), 'sheet').entries()) {
    if (sheet.getAttribute('state') === 'hidden' || sheet.getAttribute('state') === 'veryHidden') continue
    const relId = sheet.getAttribute('r:id') || sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id')
    const path = targets.get(relId) || `xl/worksheets/sheet${index + 1}.xml`
    const xml = await readEntry(buffer, entries, path)
    if (!xml) continue
    sheets.push({ name: sheet.getAttribute('name') || `Sheet ${index + 1}`, ...parseSheet(xml, sharedStrings) })
  }
  return sheets
}
