/**
 * AttendanceController.js
 * DEPRECATED: Legacy mock controller replaced by canonical attendanceService in R4.
 * Retained solely as a non-authoritative helper for legacy CSV export formatting.
 */

class AttendanceController {
  /**
   * Helper utility for exporting formatted CSV from canonical record arrays.
   */
  exportCSV(records = [], eventTitle = 'Event') {
    const headers = ['Student ID', 'Full Name', 'Program / Course', 'Verified Time', 'Method']
    const rows = (Array.isArray(records) ? records : []).map(s => [
      `"${s.student_id || s.identifier || ''}"`,
      `"${s.student_name || s.full_name || 'Student'}"`,
      `"${s.program || 'N/A'}"`,
      `"${s.verified_at || s.checked_in_at || ''}"`,
      `"${s.verification_method || 'qr_scan'}"`
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
