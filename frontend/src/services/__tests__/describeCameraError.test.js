import { describe, expect, it } from 'vitest'
import { describeCameraError } from '../attendanceService'

describe('describeCameraError', () => {
  it('explains blocked permission for string and Error rejections', () => {
    expect(describeCameraError('NotAllowedError: Permission denied')).toMatch(/blocked/i)
    expect(describeCameraError(new DOMException('x', 'NotAllowedError'))).toMatch(/blocked/i)
  })

  it('explains a missing or busy camera and insecure connections', () => {
    expect(describeCameraError('Requested device not found')).toMatch(/no camera/i)
    expect(describeCameraError('NotReadableError: Could not start video source')).toMatch(/another app/i)
    expect(describeCameraError('Unable to query supported devices, unable to scan')).toMatch(/HTTPS/)
  })

  it('falls back to the provided message', () => {
    expect(describeCameraError(undefined, 'fallback')).toBe('fallback')
    expect(describeCameraError('Something odd')).toBe('Something odd')
  })
})
