/**
 * AttendanceController.js
 * Controller handling attendance sessions, student barcode scans, pre-start time locks, and live monitoring.
 */

// Mock Student Records Database for Barcode Matching
const MOCK_STUDENT_DATABASE = {
  '2022-01452': {
    student_id: '2022-01452',
    full_name: 'Juan A. Dela Cruz',
    program: 'BS Computer Science',
    year_level: '3rd Year',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  '2021-00123': {
    student_id: '2021-00123',
    full_name: 'Maria Clara Santos',
    program: 'BS Information Technology',
    year_level: '4th Year',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  '2023-08812': {
    student_id: '2023-08812',
    full_name: 'Marcus Aurelius Vance',
    program: 'BS Computer Engineering',
    year_level: '2nd Year',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  '2024-05119': {
    student_id: '2024-05119',
    full_name: 'Sophia Isabel Reyes',
    program: 'BS Cybersecurity',
    year_level: '1st Year',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
  }
}

// Mock Student Officer Barcode Database
const MOCK_OFFICER_DATABASE = {
  'OFFICER-2024-001': {
    officer_id: 'OFFICER-2024-001',
    student_id: '2021-00988',
    full_name: 'Juan Dela Cruz',
    position: 'CompSoc Vice President (Gate 1 Operator)',
    organization: 'Computer Society NDMU',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  'OFFICER-2024-002': {
    officer_id: 'OFFICER-2024-002',
    student_id: '2022-00412',
    full_name: 'Maria Clara Santos',
    position: 'Student Affairs Secretary (Gate 2 Operator)',
    organization: 'Computer Society NDMU',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  'OFFICER-2024-003': {
    officer_id: 'OFFICER-2024-003',
    student_id: '2023-00155',
    full_name: 'Marcus Aurelius Vance',
    position: 'Logistics Officer (Main Hall Access)',
    organization: 'Computer Society NDMU',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  }
}

// Initial Scanned Feed Seed
const STORAGE_KEY_ATTENDANCE = 'achievenest_attendance_sessions'

class AttendanceController {
  #sessions

  getMockOfficerDatabase() {
    return MOCK_OFFICER_DATABASE
  }

  verifyOfficerBarcode(barcodeInput) {
    if (!barcodeInput) throw new Error('Please scan or enter your Student Officer Barcode ID!')
    const cleanCode = barcodeInput.trim().toUpperCase()
    
    // Direct match or fallback officer match
    const matched = MOCK_OFFICER_DATABASE[cleanCode] || {
      officer_id: cleanCode,
      student_id: cleanCode,
      full_name: `Officer ${cleanCode}`,
      position: 'Verified Student Gatekeeper',
      organization: 'NDMU Student Council'
    }

    return matched
  }


  constructor() {
    this.#sessions = {
      'evt-1': {
        eventId: 'evt-1',
        session_status: 'Active',
        attendance_start_time: '08:30',
        attendance_end_time: '09:30',
        scanned_list: [
          {
            id: 'scan-1',
            student_id: '2021-00123',
            full_name: 'Maria Clara Santos',
            program: 'BS Information Technology',
            scanned_at: '8:42:15 AM',
            officer_name: 'Officer Alex (Student Council)'
          },
          {
            id: 'scan-2',
            student_id: '2023-08812',
            full_name: 'Marcus Aurelius Vance',
            program: 'BS Computer Engineering',
            scanned_at: '8:48:30 AM',
            officer_name: 'Officer Alex (Student Council)'
          }
        ]
      }
    }
  }

  getSession(eventId) {
    if (!this.#sessions[eventId]) {
      this.#sessions[eventId] = {
        eventId,
        session_status: 'Locked',
        attendance_start_time: '08:30',
        attendance_end_time: '09:30',
        scanned_list: []
      }
    }
    return this.#sessions[eventId]
  }

  updateSessionStatus(eventId, status) {
    const session = this.getSession(eventId)
    session.session_status = status
    window.dispatchEvent(new CustomEvent('achievenest_attendance_update', { detail: { eventId } }))
    return session
  }

  recordScan(eventId, barcodeInput, officerName = 'Student Officer Gate 1') {
    const session = this.getSession(eventId)
    const cleanCode = barcodeInput.trim()

    // Look up in mock student database or generate fallback
    const matched = MOCK_STUDENT_DATABASE[cleanCode] || {
      student_id: cleanCode || `2024-${Math.floor(10000 + Math.random() * 90000)}`,
      full_name: `NDMU Student ${cleanCode}`,
      program: 'College of Computer Studies',
      year_level: 'NDMU Student',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    }

    // Check if already scanned
    const alreadyScanned = session.scanned_list.some(s => s.student_id === matched.student_id)
    if (alreadyScanned) {
      throw new Error(`Student ${matched.full_name} (${matched.student_id}) has already checked in!`)
    }

    const scanRecord = {
      id: `scan-${Date.now()}`,
      student_id: matched.student_id,
      full_name: matched.full_name,
      program: matched.program,
      year_level: matched.year_level,
      avatar: matched.avatar,
      scanned_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      officer_name: officerName
    }

    session.scanned_list.unshift(scanRecord)

    // Dispatch global custom event so Moderator Hub & Scanner Page update live in real-time
    window.dispatchEvent(new CustomEvent('achievenest_attendance_update', { detail: { eventId, scanRecord } }))

    return scanRecord
  }

  exportCSV(eventId, eventTitle = 'Event') {
    const session = this.getSession(eventId)
    const headers = ['Student ID', 'Full Name', 'Program / Course', 'Year Level', 'Scanned Time', 'Verified Officer']
    const rows = session.scanned_list.map(s => [
      `"${s.student_id}"`,
      `"${s.full_name}"`,
      `"${s.program}"`,
      `"${s.year_level || 'N/A'}"`,
      `"${s.scanned_at}"`,
      `"${s.officer_name}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Attendance_Report_${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export default new AttendanceController()
