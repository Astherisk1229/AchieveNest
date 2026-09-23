export const PERSONNEL_PREVIEW_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png'
])

export function resolvePersonnelEvidence(record = {}) {
  const candidates = [
    record.primary_evidence,
    ...(Array.isArray(record.evidence) ? record.evidence : []),
    record.evidence && !Array.isArray(record.evidence) ? record.evidence : null
  ].filter(Boolean)

  return candidates.find((evidence) => {
    const mimeType = String(evidence.mime_type || '').toLowerCase()
    const status = String(evidence.status || 'active').toLowerCase()
    return Boolean(evidence.id) && status === 'active' && evidence.previewable !== false && PERSONNEL_PREVIEW_MIME_TYPES.has(mimeType)
  }) || null
}

export function hasValidPersonnelEvidence(record = {}) {
  return resolvePersonnelEvidence(record) !== null
}
