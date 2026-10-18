export function apiErrorText(value, fallback = 'The request could not be completed.') {
  const seen = new Set()
  const read = candidate => {
    if (typeof candidate === 'string') return candidate.trim()
    if (!candidate || typeof candidate !== 'object' || seen.has(candidate)) return ''
    seen.add(candidate)
    for (const nested of [candidate.response?.data, candidate.data, candidate.error, candidate.messages?.error, candidate.message, candidate.detail]) {
      const message = read(nested)
      if (message) return message
    }
    return ''
  }
  return read(value) || fallback
}
