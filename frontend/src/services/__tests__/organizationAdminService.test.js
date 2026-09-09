import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../apiClient'
import {
  fetchOrganizations,
  fetchOrganization,
  createOrganization,
  updateOrganizationLogo,
  deleteOrganizationLogo,
  getOrganizationLogoUrl
} from '../organizationAdminService'

vi.mock('../apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '/api/v1' }
  }
}))

describe('organizationAdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('fetches organizations with query filters', async () => {
    const mockOrgs = [
      { id: 'org-1', code: 'CSS', name: 'Computer Science Society', scope: 'college', category: 'academic_college' }
    ]
    apiClient.get.mockResolvedValueOnce({
      data: { organizations: mockOrgs }
    })

    const result = await fetchOrganizations({ scope: 'college', category: 'academic_college' })
    expect(apiClient.get).toHaveBeenCalledWith('/osad/organizations', {
      params: { scope: 'college', category: 'academic_college' },
      headers: {}
    })
    expect(result).toEqual(mockOrgs)
  })

  it('fetches a single organization by ID', async () => {
    const mockOrg = { id: 'org-1', code: 'CSS', name: 'Computer Science Society' }
    apiClient.get.mockResolvedValueOnce({
      data: { organization: mockOrg }
    })

    const result = await fetchOrganization('org-1')
    expect(apiClient.get).toHaveBeenCalledWith('/osad/organizations/org-1', {
      headers: {}
    })
    expect(result).toEqual(mockOrg)
  })

  it('creates an organization with payload', async () => {
    const mockCreated = { id: 'org-2', code: 'JPIA', name: 'Junior Philippine Institute of Accountants' }
    apiClient.post.mockResolvedValueOnce({
      data: { organization: mockCreated }
    })

    const payload = { name: 'Junior Philippine Institute of Accountants', code: 'JPIA', category: 'academic_college', scope: 'college' }
    const result = await createOrganization(payload)

    expect(apiClient.post).toHaveBeenCalledWith('/osad/organizations', payload, {
      headers: { 'Content-Type': 'application/json' }
    })
    expect(result).toEqual(mockCreated)
  })

  it('updates an organization logo using FormData', async () => {
    const mockUpdated = { id: 'org-1', logo_storage_key: 'organizations/org-1/logo_123.png' }
    apiClient.post.mockResolvedValueOnce({
      data: { organization: mockUpdated }
    })

    const fakeFile = new File(['fake-content'], 'logo.png', { type: 'image/png' })
    const result = await updateOrganizationLogo('org-1', fakeFile)

    expect(apiClient.post).toHaveBeenCalledWith('/osad/organizations/org-1/logo', expect.any(FormData), {
      headers: {}
    })
    expect(result).toEqual(mockUpdated)
  })

  it('deletes an organization logo', async () => {
    const mockResponse = { message: 'Logo removed successfully.' }
    apiClient.delete.mockResolvedValueOnce({
      data: mockResponse
    })

    const result = await deleteOrganizationLogo('org-1')
    expect(apiClient.delete).toHaveBeenCalledWith('/osad/organizations/org-1/logo', {
      headers: {}
    })
    expect(result).toEqual(mockResponse)
  })

  it('generates the correct organization logo URL', () => {
    const url = getOrganizationLogoUrl('org-test-uuid')
    expect(url).toBe('/api/v1/osad/organizations/org-test-uuid/logo')
  })
})
