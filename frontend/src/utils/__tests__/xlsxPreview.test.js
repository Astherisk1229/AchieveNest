import { describe, expect, it } from 'vitest'
import { deflateRawSync } from 'node:zlib'
import { cellPosition, readZipDirectory } from '../xlsxPreview'
import { annualReviewFileError } from '../../pages/dean/AnnualReviewViewerDialog'

// Builds a minimal zip archive (deflate) in memory.
function buildZip(files) {
  const encoder = new TextEncoder()
  const locals = []
  const centrals = []
  let offset = 0
  for (const [name, text] of Object.entries(files)) {
    const nameBytes = encoder.encode(name)
    const data = deflateRawSync(Buffer.from(text))
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(8, 8)
    local.writeUInt32LE(data.length, 18); local.writeUInt32LE(text.length, 22)
    local.writeUInt16LE(nameBytes.length, 26)
    locals.push(local, Buffer.from(nameBytes), data)
    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(8, 10)
    central.writeUInt32LE(data.length, 20); central.writeUInt32LE(text.length, 24)
    central.writeUInt16LE(nameBytes.length, 28); central.writeUInt32LE(offset, 42)
    centrals.push(central, Buffer.from(nameBytes))
    offset += 30 + nameBytes.length + data.length
  }
  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(Object.keys(files).length, 8); end.writeUInt16LE(Object.keys(files).length, 10)
  end.writeUInt32LE(centralSize, 12); end.writeUInt32LE(offset, 16)
  const all = Buffer.concat([...locals, ...centrals, end])
  return all.buffer.slice(all.byteOffset, all.byteOffset + all.byteLength)
}

describe('xlsx preview reader', () => {
  it('lists zip entries with their data offsets', async () => {
    const buffer = buildZip({ 'xl/workbook.xml': '<workbook/>', 'xl/sharedStrings.xml': '<sst><si><t>Rating</t></si></sst>' })
    const entries = readZipDirectory(buffer)
    expect([...entries.keys()]).toEqual(['xl/workbook.xml', 'xl/sharedStrings.xml'])
    const entry = entries.get('xl/sharedStrings.xml')
    expect(entry.method).toBe(8)
    const bytes = new Uint8Array(buffer, entry.dataOffset, entry.compressedSize)
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
    expect(await new Response(stream).text()).toContain('<t>Rating</t>')
  })

  it('rejects files that are not workbooks', () => {
    expect(() => readZipDirectory(new TextEncoder().encode('not a zip at all, just text').buffer)).toThrow(/not a readable \.xlsx/)
  })

  it('converts cell references to zero-based positions', () => {
    expect(cellPosition('A1')).toEqual({ row: 0, col: 0 })
    expect(cellPosition('AB12')).toEqual({ row: 11, col: 27 })
    expect(cellPosition('bad')).toBeNull()
  })
})

describe('annual review file errors', () => {
  it('explains a missing stored workbook (JSON error delivered as a Blob)', async () => {
    const blob = new Blob([JSON.stringify({ error: { code: 'NOT_FOUND', message: 'NOT_FOUND: Stored report is unavailable.' } })])
    const result = await annualReviewFileError(blob)
    expect(result.missingFile).toBe(true)
    expect(result.message).toMatch(/not stored on the server/)
  })

  it('strips error codes from other messages', async () => {
    const result = await annualReviewFileError({ error: { code: 'IMPORT_ERROR', message: 'IMPORT_ERROR: Something failed.' } })
    expect(result).toEqual({ missingFile: false, message: 'Something failed.' })
  })
})
