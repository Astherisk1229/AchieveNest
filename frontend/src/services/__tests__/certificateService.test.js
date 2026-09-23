import { beforeEach, describe, expect, it, vi } from 'vitest'

const { post } = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('../apiClient', () => ({ default: { post } }))

import certificateService from '../certificateService'

describe('certificate issuance API service', () => {
  beforeEach(() => post.mockReset())

  it('sends stable references and the caller idempotency key to the backend', async () => {
    const signal = new AbortController().signal
    const payload = {
      source_record_id: 'source-1',
      template_version_id: 'template-1',
      signatories: {},
      idempotency_key: 'stable-attempt-key'
    }
    post.mockResolvedValue({ data: { status: 'ISSUED', issued: true, certificate: { id: 'certificate-1' } } })

    await expect(certificateService.issueCertificate(payload, { signal })).resolves.toMatchObject({ status: 'ISSUED', issued: true })
    expect(post).toHaveBeenCalledWith('/certificates/issue', payload, { signal })
  })

  it('returns the backend current-certificate result without synthesizing local issuance', async () => {
    post.mockResolvedValue({ data: { status: 'ALREADY_ISSUED', issued: false, certificate: { id: 'certificate-1', certificate_number: 'AN-2026-000001' } } })
    await expect(certificateService.issueCertificate({ idempotency_key: 'new-key' })).resolves.toMatchObject({
      status: 'ALREADY_ISSUED', issued: false, certificate: { id: 'certificate-1' }
    })
  })
})
