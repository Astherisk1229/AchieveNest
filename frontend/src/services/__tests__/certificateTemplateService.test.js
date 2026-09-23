import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from '../apiClient'
import certificateTemplateService from '../certificateTemplateService'

vi.mock('../apiClient', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }))

describe('certificateTemplateService governed API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads backend-governed families and registry', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { families: [{ id: 'family-1' }] } })
    apiClient.get.mockResolvedValueOnce({ data: { placeholders: [{ code: 'recipient_name' }], signatory_roles: [] } })
    await expect(certificateTemplateService.listFamilies()).resolves.toEqual([{ id: 'family-1' }])
    await expect(certificateTemplateService.getRegistry()).resolves.toEqual({ placeholders: [{ code: 'recipient_name' }], signatory_roles: [] })
  })

  it('uses distinct draft, validation, and publication endpoints', async () => {
    apiClient.post.mockResolvedValue({ data: { id: 'version-2' } })
    apiClient.patch.mockResolvedValue({ data: { id: 'version-2', status: 'DRAFT' } })
    await certificateTemplateService.createDraft('family-1', { source_version_id: 'version-1' })
    await certificateTemplateService.updateDraft('version-2', { expected_token: 'token' })
    await certificateTemplateService.validateDraft('version-2', 'saved-token')
    await certificateTemplateService.publishDraft('version-2', 'validated-token')
    expect(apiClient.post).toHaveBeenNthCalledWith(1, '/certificate-templates/family-1/versions', { source_version_id: 'version-1' })
    expect(apiClient.patch).toHaveBeenCalledWith('/certificate-template-versions/version-2', { expected_token: 'token' })
    expect(apiClient.post).toHaveBeenNthCalledWith(2, '/certificate-template-versions/version-2/validate', { expected_token: 'saved-token' })
    expect(apiClient.post).toHaveBeenNthCalledWith(3, '/certificate-template-versions/version-2/publish', { expected_token: 'validated-token' })
  })
})
