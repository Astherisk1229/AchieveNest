import { describe, expect, it, vi } from 'vitest'
import { submitPortfolioReturn } from '../submitPortfolioReturn'

describe('portfolio return request', () => {
  it('does not submit empty or whitespace-only instructions', async () => {
    const request = vi.fn()
    const inFlight = { current: false }
    await expect(submitPortfolioReturn('   ', inFlight, request)).resolves.toBe(false)
    expect(request).not.toHaveBeenCalled()
    expect(inFlight.current).toBe(false)
  })

  it('sends trimmed instructions and finishes after server success', async () => {
    const request = vi.fn().mockResolvedValue({ status: 'returned_for_revision' })
    const inFlight = { current: false }
    await expect(submitPortfolioReturn('  Upload the correct certificate.  ', inFlight, request)).resolves.toBe(true)
    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith('Upload the correct certificate.')
    expect(inFlight.current).toBe(false)
  })

  it('keeps errors available to the dialog and releases the guard for retry', async () => {
    const failure = new Error('Service unavailable')
    const request = vi.fn().mockRejectedValueOnce(failure).mockResolvedValueOnce({})
    const inFlight = { current: false }
    await expect(submitPortfolioReturn('Please correct the proof.', inFlight, request)).rejects.toBe(failure)
    expect(inFlight.current).toBe(false)
    await expect(submitPortfolioReturn('Please correct the proof.', inFlight, request)).resolves.toBe(true)
  })

  it('ignores repeated clicks while the first request is pending', async () => {
    let resolveRequest
    const request = vi.fn(() => new Promise(resolve => { resolveRequest = resolve }))
    const inFlight = { current: false }
    const first = submitPortfolioReturn('Correct the certificate.', inFlight, request)
    await expect(submitPortfolioReturn('Correct the certificate.', inFlight, request)).resolves.toBe(false)
    expect(request).toHaveBeenCalledTimes(1)
    resolveRequest({})
    await expect(first).resolves.toBe(true)
  })
})
