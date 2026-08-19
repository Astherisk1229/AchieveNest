/**
 * HRAuditTrailController.js
 * Controller managing audit query normalization, multi-field searching,
 * category & date filtering, deterministic sorting, pagination, and CSV row preparation.
 */

import { getEventMetadata } from '../models/HRAuditEventRegistry'

export class HRAuditTrailController {
  /**
   * Sorts audit logs newest first (timestamp descending) with ID descending as deterministic tie-breaker.
   */
  static sortLogs(logs = []) {
    return [...logs].sort((a, b) => {
      const timeA = new Date(a.timestamp || a.created_at || 0).getTime()
      const timeB = new Date(b.timestamp || b.created_at || 0).getTime()

      if (timeB !== timeA) {
        return timeB - timeA
      }
      return String(b.id || '').localeCompare(String(a.id || ''))
    })
  }

  /**
   * Filters audit logs based on search term, canonical category key, and date range preset.
   */
  static filterLogs(logs = [], { searchTerm = '', categoryFilter = 'ALL', dateFilter = 'all' } = {}) {
    const term = (searchTerm || '').trim().toLowerCase()
    const now = new Date()

    return logs.filter(log => {
      const meta = getEventMetadata(log.event_code || log.action_type)
      const logCategory = log.category || meta.category.key

      // 1. Category Filter Matching
      if (categoryFilter && categoryFilter !== 'ALL') {
        if (logCategory !== categoryFilter) {
          return false
        }
      }

      // 2. Date Range Preset Matching
      if (dateFilter && dateFilter !== 'all') {
        const logTime = new Date(log.timestamp || log.created_at || 0).getTime()
        if (isNaN(logTime)) {
          // Keep invalid date logs under 'all', hide under date-specific filters
          return false
        }

        if (dateFilter === 'today') {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
          if (logTime < startOfToday) return false
        } else if (dateFilter === '7days') {
          const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000
          if (logTime < sevenDaysAgo) return false
        } else if (dateFilter === '30days') {
          const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000
          if (logTime < thirtyDaysAgo) return false
        }
      }

      // 3. Search Term Keyword Matching
      if (term) {
        const actorName = (log.actor_name || log.admin_name || '').toLowerCase()
        const actorRole = (log.actor_role || '').toLowerCase()
        const targetLabel = (log.target_label || log.target_personnel || '').toLowerCase()
        const targetId = (log.target_id || '').toLowerCase()
        const eventLabel = (meta.label || '').toLowerCase()
        const eventCode = (log.event_code || log.action_type || '').toLowerCase()
        const details = (log.details || '').toLowerCase()
        const referenceId = (log.reference_id || log.id || '').toLowerCase()

        const match =
          actorName.includes(term) ||
          actorRole.includes(term) ||
          targetLabel.includes(term) ||
          targetId.includes(term) ||
          eventLabel.includes(term) ||
          eventCode.includes(term) ||
          details.includes(term) ||
          referenceId.includes(term)

        if (!match) return false
      }

      return true
    })
  }

  /**
   * Returns paginated slice of sorted logs along with metadata.
   */
  static paginateLogs(sortedLogs = [], page = 1, itemsPerPage = 10) {
    const totalItems = sortedLogs.length
    const pageSize = Math.max(1, parseInt(itemsPerPage, 10) || 10)
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const validPage = Math.min(Math.max(1, page), totalPages)

    const startIndex = (validPage - 1) * pageSize
    const pageLogs = sortedLogs.slice(startIndex, startIndex + pageSize)

    return {
      pageLogs,
      currentPage: validPage,
      totalPages,
      totalItems,
      pageSize,
      startIndex: totalItems > 0 ? startIndex + 1 : 0,
      endIndex: Math.min(startIndex + pageSize, totalItems)
    }
  }

  /**
   * Prepares 2D matrix rows for safe CSV exporting.
   */
  static prepareCsvRows(filteredSortedLogs = []) {
    const headers = [
      'Event Code',
      'Event Label',
      'Category',
      'Actor ID',
      'Actor Name',
      'Actor Role',
      'Target Type',
      'Target ID',
      'Target Label',
      'Details',
      'Timestamp UTC',
      'Reference ID'
    ]

    const dataRows = filteredSortedLogs.map(log => {
      const meta = getEventMetadata(log.event_code || log.action_type)
      const dateIso = log.timestamp || log.created_at || ''

      return [
        log.event_code || log.action_type || 'UNKNOWN',
        meta.label || 'System Action',
        log.category || meta.category.key,
        log.actor_id || 'N/A',
        log.actor_name || log.admin_name || 'HR Admin',
        log.actor_role || 'HR Staff',
        log.target_type || 'personnel',
        log.target_id || 'N/A',
        log.target_label || log.target_personnel || 'N/A',
        log.details || '',
        dateIso,
        log.reference_id || log.id || ''
      ]
    })

    return [headers, ...dataRows]
  }
}

export default HRAuditTrailController
