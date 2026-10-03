export const PERSONNEL_PREVIEW_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png'
])

export function resolvePersonnelEvidence(record = {}) {
  // Evaluation items carry the evidence frozen at submission as evidence_snapshot (array or JSON string).
  let snapshot = record.evidence_snapshot
  if (typeof snapshot === 'string') { try { snapshot = JSON.parse(snapshot) } catch { snapshot = [] } }
  const candidates = [
    record.primary_evidence,
    ...(Array.isArray(record.evidence) ? record.evidence : []),
    record.evidence && !Array.isArray(record.evidence) ? record.evidence : null,
    ...(Array.isArray(snapshot) ? snapshot.map((row) => row && ({ ...row, id: row.id || row.evidence_id })) : [])
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
