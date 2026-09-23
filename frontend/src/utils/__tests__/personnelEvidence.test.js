import { describe, expect, it } from 'vitest'
import { hasValidPersonnelEvidence, resolvePersonnelEvidence } from '../personnelEvidence'

describe('canonical Personnel evidence resolution', () => {
  it('accepts persisted active PDF, JPEG, and PNG evidence', () => {
    for (const mime_type of ['application/pdf', 'image/jpeg', 'image/png']) {
      const evidence = { id: `ev-${mime_type}`, mime_type, status: 'active', previewable: true }
      expect(resolvePersonnelEvidence({ primary_evidence: evidence })).toEqual(evidence)
    }
  })

  it('does not treat a legacy filename as persisted proof', () => {
    expect(hasValidPersonnelEvidence({ proof_file_name: 'certificate.pdf' })).toBe(false)
    expect(hasValidPersonnelEvidence({ attached_file_name: 'certificate.jpg' })).toBe(false)
  })

  it('rejects missing, inactive, unsupported, or unavailable evidence', () => {
    expect(hasValidPersonnelEvidence({ evidence: [{ mime_type: 'application/pdf' }] })).toBe(false)
    expect(hasValidPersonnelEvidence({ evidence: [{ id: 'ev-1', mime_type: 'application/pdf', status: 'deleted' }] })).toBe(false)
    expect(hasValidPersonnelEvidence({ evidence: [{ id: 'ev-2', mime_type: 'image/gif', status: 'active' }] })).toBe(false)
    expect(hasValidPersonnelEvidence({ evidence: [{ id: 'ev-3', mime_type: 'image/png', status: 'active', previewable: false }] })).toBe(false)
  })
})
