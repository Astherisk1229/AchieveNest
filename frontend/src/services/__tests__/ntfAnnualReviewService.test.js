import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from '../apiClient'
import { downloadNtfPrefilledSelection, ntfWorkbookFilename, ntfZipFilename } from '../ntfAnnualReviewService'

vi.mock('../apiClient', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const years = ['2025-2026', '2026-2027']
const people = [
  { id: 'p1', institutional_id: 'NTF-002', first_name: 'John', last_name: 'Reyes', full_name: 'John Reyes' },
  { id: 'p2', institutional_id: 'NTF-003', first_name: 'Angela', last_name: 'Cruz', full_name: 'Angela Cruz' },
]

describe('ntfAnnualReviewService selective downloads', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.unstubAllGlobals())

  it('uses formal filenames based on the authoritative period and employee identity', () => {
    expect(ntfWorkbookFilename(people[0], years)).toBe('NTF_AnnualReview_SY2025-2027_NTF-002_Reyes_John.xlsx')
    expect(ntfZipFilename(years)).toBe('NTF_Annual_Review_Workbooks_SY2025-2027.zip')
  })

  it('requests one workbook for one selected person and uses normal browser downloading', async () => {
    const blob = new Blob(['xlsx'])
    const link = { click: vi.fn(), remove: vi.fn() }
    apiClient.get.mockResolvedValueOnce(blob)
    vi.stubGlobal('document', { createElement: vi.fn(() => link), body: { appendChild: vi.fn() } })
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    await downloadNtfPrefilledSelection('period-1', [people[0]], years)

    expect(apiClient.get).toHaveBeenCalledWith('/hr/ntf-annual-review/tracks/period-1/template/personnel/p1', { responseType: 'blob', timeout: 120000 })
    expect(link.download).toBe('NTF_AnnualReview_SY2025-2027_NTF-002_Reyes_John.xlsx')
    expect(link.click).toHaveBeenCalledOnce()
  })

  it('posts only selected profile IDs and writes one ZIP to the chosen folder', async () => {
    const blob = new Blob(['zip'])
    const writable = { write: vi.fn(), close: vi.fn() }
    const directory = { getFileHandle: vi.fn().mockResolvedValue({ createWritable: vi.fn().mockResolvedValue(writable) }) }
    apiClient.post.mockResolvedValueOnce(blob)

    await downloadNtfPrefilledSelection('period-1', people, years, directory)

    expect(apiClient.post).toHaveBeenCalledWith('/hr/ntf-annual-review/tracks/period-1/template/prefilled.zip', { personnel_profile_ids: ['p1', 'p2'] }, { responseType: 'blob', timeout: 120000 })
    expect(directory.getFileHandle).toHaveBeenCalledWith('NTF_Annual_Review_Workbooks_SY2025-2027.zip', { create: true })
    expect(writable.write).toHaveBeenCalledWith(blob)
    expect(writable.close).toHaveBeenCalledOnce()
  })
})
