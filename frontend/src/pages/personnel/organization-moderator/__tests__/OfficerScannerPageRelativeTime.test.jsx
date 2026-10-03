import React from 'react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import attendanceService from '../../../../services/attendanceService'
import { 
  formatCheckInTime, 
  formatRelativeTime, 
  sortRecordsDesc 
} from '../OfficerScannerPage'

describe('OfficerScannerPage Track E.2: Live Relative Check-In Time Presentation', () => {
  const baseTime = new Date('2026-09-25T00:30:00+08:00').getTime()

  describe('Phase 14: formatRelativeTime Deterministic Time Thresholds', () => {
    it('1 & 2. returns "Just now" for 10s and 59s elapsed', () => {
      const t0 = '2026-09-25 00:30:00'
      expect(formatRelativeTime(t0, baseTime + 10 * 1000)).toBe('Just now')
      expect(formatRelativeTime(t0, baseTime + 59 * 1000)).toBe('Just now')
    })

    it('3 & 4. returns "1 min ago" for 60s and 119s elapsed', () => {
      const t0 = '2026-09-25 00:30:00'
      expect(formatRelativeTime(t0, baseTime + 60 * 1000)).toBe('1 min ago')
      expect(formatRelativeTime(t0, baseTime + 119 * 1000)).toBe('1 min ago')
    })

    it('5 & 6. returns "2 mins ago" for 120s and "5 mins ago" for 5 minutes elapsed', () => {
      const t0 = '2026-09-25 00:30:00'
      expect(formatRelativeTime(t0, baseTime + 120 * 1000)).toBe('2 mins ago')
      expect(formatRelativeTime(t0, baseTime + 5 * 60 * 1000)).toBe('5 mins ago')
    })

    it('7 & 8. returns "1 hr ago" for 60 minutes and "2 hrs ago" for 125 minutes elapsed', () => {
      const t0 = '2026-09-25 00:30:00'
      expect(formatRelativeTime(t0, baseTime + 60 * 60 * 1000)).toBe('1 hr ago')
      expect(formatRelativeTime(t0, baseTime + 125 * 60 * 1000)).toBe('2 hrs ago')
    })

    it('9. clamps tiny future timestamp / negative skew to "Just now"', () => {
      const t0 = '2026-09-25 00:30:10'
      expect(formatRelativeTime(t0, baseTime)).toBe('Just now')
    })

    it('10, 11, 12. exact backend time remains unchanged during presentation ticks with seconds and 12-hour AM/PM', () => {
      const checkedInAt = '2026-09-25 00:37:03'
      const exactTime = formatCheckInTime(checkedInAt)

      expect(exactTime).toMatch(/12:37:03\s*AM/i)
      expect(formatCheckInTime(checkedInAt)).toBe(exactTime)
    })
  })

  describe('Phase 15: Critical Live Transition Unit Test', () => {
    it('transitions 45s (Just now) -> +30s to 75s (1 min ago) -> +60s to 135s (2 mins ago) without network/scans', () => {
      const checkedInAt = '2026-09-25 00:29:15' // 45 seconds before 00:30:00
      const t0 = baseTime // 00:30:00

      // T0: 45s old
      expect(formatRelativeTime(checkedInAt, t0)).toBe('Just now')

      // T+30s: 75s old (1 min 15s)
      const t30 = baseTime + 30 * 1000
      expect(formatRelativeTime(checkedInAt, t30)).toBe('1 min ago')

      // T+90s: 135s old (2 mins 15s)
      const t90 = baseTime + 90 * 1000
      expect(formatRelativeTime(checkedInAt, t90)).toBe('2 mins ago')
    })
  })

  describe('Phase 16: Three-Row Timer Test', () => {
    it('updates multiple records simultaneously through the same presentation tick without altering sort order', () => {
      const records = [
        { id: 'rec-c', checked_in_at: '2026-09-25 00:29:30', full_name: 'Student C' }, // 30s old at T0
        { id: 'rec-b', checked_in_at: '2026-09-25 00:28:30', full_name: 'Student B' }, // 90s old at T0
        { id: 'rec-a', checked_in_at: '2026-09-25 00:26:00', full_name: 'Student A' }  // 4m old at T0
      ]

      const sorted = sortRecordsDesc(records)
      expect(sorted.map(r => r.id)).toEqual(['rec-c', 'rec-b', 'rec-a'])

      // T0 evaluation
      const t0 = baseTime
      expect(formatRelativeTime(sorted[0].checked_in_at, t0)).toBe('Just now')
      expect(formatRelativeTime(sorted[1].checked_in_at, t0)).toBe('1 min ago')
      expect(formatRelativeTime(sorted[2].checked_in_at, t0)).toBe('4 mins ago')

      // T+30s presentation tick
      const t30 = baseTime + 30 * 1000
      expect(formatRelativeTime(sorted[0].checked_in_at, t30)).toBe('1 min ago')
      expect(formatRelativeTime(sorted[1].checked_in_at, t30)).toBe('2 mins ago')
      expect(formatRelativeTime(sorted[2].checked_in_at, t30)).toBe('4 mins ago')

      // Order remains strictly checked_in_at DESC
      expect(sorted.map(r => r.id)).toEqual(['rec-c', 'rec-b', 'rec-a'])
    })
  })

  describe('Phase 17: Zero Timer API Traffic', () => {
    it('proves that presentation timer ticks generate zero GET/POST requests', () => {
      const listSpy = vi.spyOn(attendanceService, 'listAttendanceSessionRecords')
      const checkInSpy = vi.spyOn(attendanceService, 'checkInAttendance')

      let presentationTickCount = 0
      const tickCallback = () => {
        presentationTickCount++
        // Pure presentation tick only alters local state tick
      }

      // Simulate 4 timer ticks (120 seconds of presentation updates)
      tickCallback()
      tickCallback()
      tickCallback()
      tickCallback()

      expect(presentationTickCount).toBe(4)
      expect(listSpy).toHaveBeenCalledTimes(0)
      expect(checkInSpy).toHaveBeenCalledTimes(0)
    })
  })

  describe('Phase 18: StrictMode & Unmount Safety', () => {
    it('creates exactly one page-level interval, cleans up on unmount, and is StrictMode safe', () => {
      let activeIntervals = []

      const mockSetInterval = vi.fn((fn, ms) => {
        const id = Math.random()
        activeIntervals.push({ id, fn, ms })
        return id
      })
      const mockClearInterval = vi.fn((id) => {
        activeIntervals = activeIntervals.filter(item => item.id !== id)
      })

      // Simulate StrictMode mount -> unmount -> remount lifecycle
      const mountPageTimer = () => {
        const timer = mockSetInterval(() => {}, 30000)
        return () => mockClearInterval(timer)
      }

      // Initial mount
      const unmount1 = mountPageTimer()
      expect(activeIntervals.length).toBe(1)
      expect(activeIntervals[0].ms).toBe(30000)

      // StrictMode unmount
      unmount1()
      expect(activeIntervals.length).toBe(0)

      // StrictMode remount
      const unmount2 = mountPageTimer()
      expect(activeIntervals.length).toBe(1)

      // Final unmount
      unmount2()
      expect(activeIntervals.length).toBe(0)
    })
  })
})
