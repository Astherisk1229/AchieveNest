import { NO_ACTIVITY_DATE, formatDateRange, formatDateTime } from '../utils/achievementDates'

/**
 * Stateless presentation helpers for backend-authoritative Student portfolio records.
 * Canonical records are never read from or written to browser storage here.
 */
class StudentAchievementController {
  normalize(record = {}) {
    const status = String(record.status || 'draft').toLowerCase()
    const statusLabels = {
      draft: 'Draft',
      submitted: 'Pending Review',
      revision_requested: 'Returned',
      verified: 'Verified',
      rejected: 'Rejected',
      archived: 'Archived'
    }
    const evidence = Array.isArray(record.evidence) ? record.evidence : []
    const latestRevision = Array.isArray(record.events)
      ? [...record.events].reverse().find(event => event.action === 'revision_requested')
      : null

    return {
      ...record,
      id: record.id,
      title: record.title || '',
      display_title: record.title || 'Untitled draft',
      category: record.category_name || record.category || 'Uncategorized',
      // The activity date only; the record's creation time is never shown as the achievement date.
      date: record.start_date || record.occurrence_date || '',
      display_date: formatDateRange(record.start_date || record.occurrence_date, record.end_date) || NO_ACTIVITY_DATE,
      saved_label: status === 'draft' ? `Saved ${formatDateTime(record.updated_at || record.created_at)}` : '',
      // "Newest" = most recently changed, so a just-saved or just-submitted achievement appears first.
      sort_key: record.updated_at || record.submitted_at || record.created_at || '',
      event_name: record.organizer_or_body || '',
      issuer: record.organizer_or_body || '',
      location: record.organizer_or_body || '',
      subcategory: record.subcategory_name || '',
      status: statusLabels[status] || status,
      canonical_status: status,
      attached_file_name: evidence[0]?.original_filename || record.attached_file_name || '',
      evidence_id: evidence[0]?.id || record.evidence_id || null,
      evidence,
      docs_count: Number(record.evidence_count ?? evidence.length),
      return_remarks: latestRevision?.remarks || record.return_remarks || '',
      is_favorited: false,
      portfolio_id: status === 'verified' ? record.id : null,
      portfolio_status: status === 'verified' ? 'Available for Portfolio' : statusLabels[status]
    }
  }

  normalizeMany(records = []) {
    return records.map(record => this.normalize(record))
  }

  getFilteredAchievements(records, searchQuery = '', statusFilter = 'All', categoryFilter = 'All', sortOrder = 'newest') {
    const query = searchQuery.trim().toLowerCase()
    const result = records.filter(item => {
      const matchesSearch = !query || [item.title, item.description, item.issuer, item.category]
        .some(value => String(value || '').toLowerCase().includes(query))
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter
      return matchesSearch && matchesStatus && matchesCategory
    })

    return [...result].sort((a, b) => {
      if (sortOrder === 'title') return a.title.localeCompare(b.title)
      const delta = String(a.sort_key || '').localeCompare(String(b.sort_key || ''))
      return sortOrder === 'oldest' ? delta : -delta
    })
  }

  getStats(records = []) {
    return {
      total: records.length,
      verified: records.filter(item => item.canonical_status === 'verified').length,
      pending: records.filter(item => item.canonical_status === 'submitted').length,
      returned: records.filter(item => item.canonical_status === 'revision_requested').length,
      favorited: 0,
      in_portfolio: records.filter(item => item.canonical_status === 'verified').length
    }
  }
}

export default new StudentAchievementController()
