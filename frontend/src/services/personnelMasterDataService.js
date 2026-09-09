import apiClient from './apiClient'
import { fetchColleges as fetchCollegesFromAdmin, fetchAcademicPrograms } from './collegeAdminService'
import { facultyRankCatalogService } from './facultyRankCatalogService'
import { partTimeFacultyTitleService } from './partTimeFacultyTitleService'

/**
 * Confirmed seeded institutional Administrative Units / Offices (Plan D2 Authoritative Freeze)
 */
export const SEEDED_ADMINISTRATIVE_UNITS = [
  { id: '10000000-0000-0000-0000-000000000010', code: 'REC', name: 'Records Section', unit_name: 'Records Section', status: 'active' },
  { id: '10000000-0000-0000-0000-000000000011', code: 'LIB', name: 'Library', unit_name: 'Library', status: 'active' },
  { id: '10000000-0000-0000-0000-000000000012', code: 'BUS', name: 'Business Office', unit_name: 'Business Office', status: 'active' },
  { id: '10000000-0000-0000-0000-000000000013', code: 'HRD', name: 'Human Resource Management Office', unit_name: 'Human Resource Management Office', status: 'active' },
  { id: '10000000-0000-0000-0000-000000000014', code: 'ICT', name: 'ICT Services Center', unit_name: 'ICT Services Center', status: 'active' },
  { id: '10000000-0000-0000-0000-000000000015', code: 'GCO', name: 'Guidance and Counseling Office', unit_name: 'Guidance and Counseling Office', status: 'active' },
  { id: '10000000-0000-0000-0000-000000000016', code: 'CSO', name: 'Campus Security Office', unit_name: 'Campus Security Office', status: 'active' },
  { id: '10000000-0000-0000-0000-000000000017', code: 'PFM', name: 'Physical Facilities Management', unit_name: 'Physical Facilities Management', status: 'active' }
]

/**
 * Service for HR Personnel Provisioning Master-Data Dropdowns (Plan D2 — Phase D2-1)
 */
export const personnelMasterDataService = {
  /**
   * Fetches institutional Colleges directly from the institutional College API.
   * Independent of personnel records.
   * @param {Object} filters
   * @returns {Promise<Array<{ id: string|number, code: string, name: string }>>}
   */
  async getColleges(filters = {}) {
    try {
      const colleges = await fetchCollegesFromAdmin(filters)
      if (Array.isArray(colleges) && colleges.length > 0) {
        return colleges.map(c => ({
          id: c.id,
          code: c.code || '',
          name: c.name || c.college_name || c.code,
          status: c.status || 'active'
        }))
      }
    } catch (err) {
      console.warn('Direct college admin fetch failed, attempting /colleges fallback:', err?.message)
    }

    try {
      const res = await apiClient.get('/colleges', { params: filters })
      const data = res?.data?.colleges || res?.data?.data || res?.data || []
      if (Array.isArray(data) && data.length > 0) {
        return data.map(c => ({
          id: c.id,
          code: c.code || '',
          name: c.name || c.college_name || c.code,
          status: c.status || 'active'
        }))
      }
    } catch (fallbackErr) {
      console.warn('Fallback /colleges fetch error:', fallbackErr?.message)
    }

    return []
  },

  /**
   * Fetches academic programs optionally filtered by College ID.
   * @param {Object} filters
   * @returns {Promise<Array>}
   */
  async getAcademicPrograms(filters = {}) {
    try {
      const programs = await fetchAcademicPrograms(filters)
      if (Array.isArray(programs)) {
        return programs.map(p => ({
          id: p.id,
          collegeId: p.college_id || p.collegeId,
          code: p.code || '',
          name: p.name || p.academic_program_name || p.code,
          status: p.status || 'active'
        }))
      }
    } catch (err) {
      console.warn('Academic programs fetch failed:', err?.message)
    }
    return []
  },

  /**
   * Fetches persisted non-academic administrative units / departments.
   * @returns {Promise<Array<{ id: string|number, code: string, name: string }>>}
   */
  async getDepartments() {
    try {
      const res = await apiClient.get('/administrative-units')
      const data = res?.data?.administrative_units || res?.data?.data || res?.data || []
      if (Array.isArray(data) && data.length > 0) {
        return data.map(u => ({
          id: u.id,
          code: u.code || '',
          name: u.name || u.unit_name || u.code,
          status: u.status || 'active'
        }))
      }
    } catch (err) {
      // Return seeded units
    }
    return SEEDED_ADMINISTRATIVE_UNITS
  },

  /**
   * Fetches Full-Time Plan E 26-rank catalog.
   * @returns {Promise<Array<{ code: string, label: string, tier: string, order: number }>>}
   */
  async getFacultyRanks(tier = null) {
    try {
      const res = await facultyRankCatalogService.fetchFullTimeFacultyRanks(tier)
      if (res && Array.isArray(res.data) && res.data.length > 0) {
        return res.data
      }
    } catch (err) {
      console.warn('Plan E full-time ranks API failed, using frozen local catalog:', err?.message)
    }
    return facultyRankCatalogService.FULL_TIME_RANKS
  },

  /**
   * Fetches Part-Time Plan E 4-title catalog.
   * @returns {Promise<Array<{ code: string, label: string, tier: string, order: number }>>}
   */
  async getPartTimeTitles() {
    try {
      const res = await partTimeFacultyTitleService.fetchPartTimeTitles()
      if (res && Array.isArray(res.titles) && res.titles.length > 0) {
        return res.titles
      }
    } catch (err) {
      console.warn('Plan E part-time titles API failed, using frozen local catalog:', err?.message)
    }
    return partTimeFacultyTitleService.PART_TIME_TITLES
  },

  /**
   * Synchronous helper for Full-Time Plan E 26-rank catalog.
   */
  getFullTimeFacultyRanks(tier = null) {
    return facultyRankCatalogService.FULL_TIME_RANKS
  },

  /**
   * Synchronous helper for Part-Time Plan E 4-title catalog.
   */
  getPartTimeFacultyTitles() {
    return partTimeFacultyTitleService.PART_TIME_TITLES
  }
}

export default personnelMasterDataService
