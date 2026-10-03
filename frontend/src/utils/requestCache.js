const entries = new Map()

/**
 * Small in-memory cache for non-authoritative reference data and concurrent
 * request deduplication. Authorization remains enforced by every API call.
 */
export function cachedRequest(key, loader, { ttlMs = 0 } = {}) {
  const now = Date.now()
  const current = entries.get(key)

  if (current?.promise) return current.promise
  if (current && current.expiresAt > now) return Promise.resolve(current.value)

  const promise = Promise.resolve()
    .then(loader)
    .then(value => {
      entries.set(key, { value, expiresAt: Date.now() + ttlMs, promise: null })
      return value
    })
    .catch(error => {
      entries.delete(key)
      throw error
    })

  entries.set(key, { value: current?.value, expiresAt: current?.expiresAt || 0, promise })
  return promise
}

export function invalidateCachedRequest(key) {
  entries.delete(key)
}

export function clearRequestCache() {
  entries.clear()
}
