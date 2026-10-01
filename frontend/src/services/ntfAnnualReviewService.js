import apiClient from './apiClient'

const unwrap = response => response?.data?.data || response?.data || response
const base = '/hr/ntf-annual-review'
const track = periodId => `${base}/tracks/${encodeURIComponent(periodId)}/template`

export async function fetchNtfAnnualReviewSettings() { return unwrap(await apiClient.get(`${base}/settings`)) }
export async function saveNtfRatingScale(payload) { return unwrap(await apiClient.put(`${base}/settings/rating-scale`, payload)) }
export async function saveNtfSignatories(payload) { return unwrap(await apiClient.put(`${base}/settings/signatories`, payload)) }

// apiClient's response interceptor returns the body, so a blob request resolves to the Blob itself.
async function requestBlob(path, { method = 'get', data } = {}) {
  let response
  try {
    response = method === 'post'
      ? await apiClient.post(path, data, { responseType: 'blob', timeout: 120000 })
      : await apiClient.get(path, { responseType: 'blob', timeout: 120000 })
  } catch (failure) {
    // Error bodies of blob requests arrive as a Blob; surface the backend message.
    if (failure instanceof Blob) {
      let parsed = null
      try { parsed = JSON.parse(await failure.text()) } catch { /* not JSON */ }
      throw new Error(parsed?.error?.message || 'The workbook could not be downloaded.')
    }
    throw failure
  }
  const blob = response instanceof Blob ? response : response?.data
  if (!(blob instanceof Blob)) throw new Error('The workbook could not be downloaded.')
  return blob
}

async function saveBlob(blob, filename, directoryHandle = null) {
  if (directoryHandle) {
    const fileHandle = await directoryHandle.getFileHandle(filename, { create: true })
    const writable = await fileHandle.createWritable()
    try { await writable.write(blob) } finally { await writable.close() }
    return
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const filenamePart = value => String(value || '').trim().replace(/[^\p{L}\p{N}-]+/gu, '_').replace(/^[_-]+|[_-]+$/g, '')
export const ntfPeriodToken = (years = []) => {
  const first = /^(\d{4})-\d{4}$/.exec(String(years[0] || ''))
  const second = /^\d{4}-(\d{4})$/.exec(String(years[1] || ''))
  return first && second ? `SY${first[1]}-${second[1]}` : `SY${filenamePart(years.join('-')) || 'Period'}`
}
export const ntfWorkbookFilename = (person, years = []) => {
  const identity = [person?.institutional_id, person?.last_name, person?.first_name].map(filenamePart).filter(Boolean)
  if (!identity.length) identity.push(filenamePart(person?.full_name) || 'Personnel')
  return `NTF_AnnualReview_${ntfPeriodToken(years)}_${identity.join('_')}.xlsx`
}
export const ntfZipFilename = (years = []) => `NTF_Annual_Review_Workbooks_${ntfPeriodToken(years)}.zip`
export const supportsDirectoryPicker = () => typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'

export async function downloadNtfBlankTemplate(periodId, years = []) {
  return saveBlob(await requestBlob(track(periodId)), `NTF-Annual-Review-${years.join('-') || 'Template'}-Blank.xlsx`)
}
export async function downloadNtfPrefilledWorkbook(periodId, person, years = [], directoryHandle = null) {
  const blob = await requestBlob(`${track(periodId)}/personnel/${encodeURIComponent(person.id)}`)
  return saveBlob(blob, ntfWorkbookFilename(person, years), directoryHandle)
}
export async function downloadNtfPrefilledSelection(periodId, people, years = [], directoryHandle = null) {
  if (!Array.isArray(people) || people.length === 0) throw new Error('Select at least one person before downloading.')
  if (people.length === 1) return downloadNtfPrefilledWorkbook(periodId, people[0], years, directoryHandle)
  const blob = await requestBlob(`${track(periodId)}/prefilled.zip`, { method: 'post', data: { personnel_profile_ids: people.map(person => person.id) } })
  return saveBlob(blob, ntfZipFilename(years), directoryHandle)
}
export async function downloadNtfPrefilledZip(periodId, years = []) {
  return saveBlob(await requestBlob(`${track(periodId)}/prefilled.zip`), ntfZipFilename(years))
}

export default { fetchNtfAnnualReviewSettings, saveNtfRatingScale, saveNtfSignatories, downloadNtfBlankTemplate, downloadNtfPrefilledWorkbook, downloadNtfPrefilledSelection, downloadNtfPrefilledZip }
