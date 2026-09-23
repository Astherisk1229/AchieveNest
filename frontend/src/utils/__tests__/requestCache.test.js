import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cachedRequest, clearRequestCache, invalidateCachedRequest } from '../requestCache'

describe('requestCache', () => {
  beforeEach(() => clearRequestCache())

  it('deduplicates concurrent requests for the same resource', async () => {
    let resolveRequest
    const loader = vi.fn(() => new Promise(resolve => { resolveRequest = resolve }))

    const first = cachedRequest('colleges', loader, { ttlMs: 1000 })
    const second = cachedRequest('colleges', loader, { ttlMs: 1000 })
    await Promise.resolve()
    resolveRequest(['CET'])

    await expect(Promise.all([first, second])).resolves.toEqual([['CET'], ['CET']])
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('reuses fresh values and supports explicit invalidation', async () => {
    const loader = vi.fn().mockResolvedValue(['CBA'])

    await cachedRequest('colleges', loader, { ttlMs: 1000 })
    await cachedRequest('colleges', loader, { ttlMs: 1000 })
    expect(loader).toHaveBeenCalledTimes(1)

    invalidateCachedRequest('colleges')
    await cachedRequest('colleges', loader, { ttlMs: 1000 })
    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('does not cache failed requests', async () => {
    const loader = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(['CAS'])

    await expect(cachedRequest('colleges', loader)).rejects.toThrow('offline')
    await expect(cachedRequest('colleges', loader)).resolves.toEqual(['CAS'])
    expect(loader).toHaveBeenCalledTimes(2)
  })
})
