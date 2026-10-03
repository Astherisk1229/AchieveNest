import apiClient from './apiClient'

const data = response => response?.data ?? response
const certificateAssetService = {
  async list(filters = {}, { signal } = {}) { return data(await apiClient.get('/certificate-assets', { params: filters, signal }))?.assets || [] },
  async upload({ file, assetType, displayName, licenseNote = '', licenseAcknowledged = false }) {
    const form = new FormData(); form.append('file', file); form.append('asset_type', assetType); form.append('display_name', displayName); form.append('license_note', licenseNote); form.append('license_acknowledged', licenseAcknowledged ? '1' : '0')
    return data(await apiClient.post('/certificate-assets', form, { headers: { 'Content-Type': 'multipart/form-data' } }))
  },
  async usage(assetId) { return data(await apiClient.get(`/certificate-assets/${encodeURIComponent(assetId)}/usage`))?.usage || [] },
  async archive(assetId) { return data(await apiClient.post(`/certificate-assets/${encodeURIComponent(assetId)}/archive`)) }
}
export default certificateAssetService
