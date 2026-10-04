import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import QRCode from 'qrcode'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../../context/AuthContext', () => ({ useAuth: () => ({ user: null }) }))
vi.mock('../../../../services/authService', () => ({ getCurrentUser: () => null }))
vi.mock('../../../../services/apiClient', () => ({ default: { get: vi.fn(async () => ({ data: {} })), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('../../../../services/portfolioService', () => ({ default: { fetchRecords: vi.fn(async () => []) } }))

import StudentDashboardPage from '../../StudentDashboardPage'
import StudentAttendanceQrModal from '../StudentAttendanceQrModal'
import { parseScannedIdentifier } from '../../../../services/attendanceService'

const render = element => renderToStaticMarkup(<MemoryRouter>{element}</MemoryRouter>)

describe('Student attendance QR', () => {
  it('shows an enabled "My QR Code" button on the dashboard when the student has an ID', () => {
    const html = render(<StudentDashboardPage currentUser={{ full_name: 'Demo Student', student_id: '2026-DEMO-001' }} />)
    expect(html).toContain('My QR Code')
    const tag = html.match(/<button[^>]*title="Show my attendance QR code"[^>]*>/)?.[0] || ''
    expect(tag).not.toBe('')
    expect(tag).not.toContain('disabled=""')
  })

  it('disables the button when no student ID is available', () => {
    const html = render(<StudentDashboardPage currentUser={{ full_name: 'No Id' }} />)
    const tag = html.match(/<button[^>]*title="Your student ID is not available yet"[^>]*>/)?.[0] || ''
    expect(tag).toContain('disabled=""')
  })

  it('renders nothing while closed and a dialog when open', () => {
    expect(render(<StudentAttendanceQrModal open={false} onOpenChange={() => {}} studentId="2026-DEMO-001" />)).toBe('')
    const open = render(<StudentAttendanceQrModal open onOpenChange={() => {}} studentId="2026-DEMO-001" fullName="Demo Student" />)
    expect(open).toContain('My Attendance QR')
    expect(open).toContain('2026-DEMO-001')
  })

  it('encodes the plain student ID and the scanner parser returns it unchanged', async () => {
    const url = await QRCode.toDataURL('2026-DEMO-001', { errorCorrectionLevel: 'M', margin: 2, width: 512 })
    expect(url.startsWith('data:image/png;base64,')).toBe(true)
    expect(parseScannedIdentifier('2026-DEMO-001')).toBe('2026-DEMO-001')
  })
})
