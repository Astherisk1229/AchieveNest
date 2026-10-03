export function normalizeCriteriaCatalogue(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.scales)) return payload.data.scales
  if (Array.isArray(payload?.scales)) return payload.scales
  return []
}
