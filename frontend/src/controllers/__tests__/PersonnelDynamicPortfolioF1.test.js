import { describe, it, expect, vi, beforeEach } from 'vitest'
import portfolioConfigurationService from '../../services/portfolioConfigurationService.js'
import apiClient from '../../services/apiClient.js'

describe('Personnel Evaluation Track — Plan F1 — Dynamic Portfolio Format, Categories, Subcategories & Criteria Configuration Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('F1.1 & F1.2 Binding Personnel-to-Scale Assignment & Catalogue Resolution', () => {
    it('resolves ADMINISTRATORS_RANKING_SCALE for Faculty + Academic (Max 160, Passing 120)', async () => {
      const mockConfig = {
        data: {
          evaluation_cycle_id: '2025-2026',
          personnel_profile_id: '10000000-0000-0000-0000-000000000003',
          scale: {
            scale_code: 'ADMINISTRATORS_RANKING_SCALE',
            title: 'NDMU Administrators & Academic Faculty Ranking Scale',
            total_max_points: 160.00,
            passing_score: 120.00
          },
          version: {
            version_number: '1.0.0',
            status: 'approved',
            source_document_ref: 'NDMU-RANK-ADMIN-2025-V1 (Official Faculty Ranking Manual)'
          },
          areas: [
            {
              area_code: 'A',
              name: 'Area A: Professional Development',
              max_points: 70.00,
              entry_policy: 'personnel_entry_allowed',
              is_personnel_entry_allowed: true,
              categories: [
                { category_code: 'A.1', name: 'A.1 Degree/s', max_points: 40.00 },
                { category_code: 'A.2', name: 'A.2 Active Membership to Prof Orgs', max_points: 10.00 },
                { category_code: 'A.3', name: 'A.3 Attendance to Seminars/Trainings', max_points: 20.00 }
              ]
            },
            {
              area_code: 'B',
              name: 'Area B: Productivity and Creative Work',
              max_points: 50.00,
              entry_policy: 'personnel_entry_allowed',
              is_personnel_entry_allowed: true
            },
            {
              area_code: 'C',
              name: 'Area C: Service and Leadership',
              max_points: 40.00,
              entry_policy: 'personnel_entry_allowed',
              is_personnel_entry_allowed: true
            }
          ]
        }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockConfig)

      const result = await portfolioConfigurationService.fetchWorkspaceConfiguration({ evaluation_cycle_id: '2025-2026' })
      const data = result?.data || result

      expect(apiClient.get).toHaveBeenCalledWith('/personnel/portfolio/configuration', {
        params: { evaluation_cycle_id: '2025-2026' }
      })
      expect(data.scale.scale_code).toBe('ADMINISTRATORS_RANKING_SCALE')
      expect(data.scale.total_max_points).toBe(160.00)
      expect(data.scale.passing_score).toBe(120.00)
      expect(data.areas).toHaveLength(3)
      expect(data.areas[0].is_personnel_entry_allowed).toBe(true)
    })

    it('resolves ADMINISTRATORS_RANKING_SCALE for Non-Teaching Faculty + Academic', async () => {
      const mockConfig = {
        data: {
          scale: {
            scale_code: 'ADMINISTRATORS_RANKING_SCALE',
            total_max_points: 160.00,
            passing_score: 120.00
          },
          version: {
            version_number: '1.0.0',
            status: 'approved'
          }
        }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockConfig)

      const result = await portfolioConfigurationService.fetchWorkspaceConfiguration()
      const data = result?.data || result

      expect(data.scale.scale_code).toBe('ADMINISTRATORS_RANKING_SCALE')
      expect(data.scale.passing_score).toBe(120.00)
    })

    it('resolves NON_TEACHING_PERSONNEL_RANKING_SCALE for Non-Teaching Faculty + Non-Academic (Max 150, Passing 75)', async () => {
      const mockConfig = {
        data: {
          scale: {
            scale_code: 'NON_TEACHING_PERSONNEL_RANKING_SCALE',
            title: 'NDMU Non-Teaching Personnel Ranking Scale',
            total_max_points: 150.00,
            passing_score: 75.00
          },
          version: {
            version_number: '1.0.0',
            status: 'approved',
            source_document_ref: 'NDMU-RANK-NTP-2025-V1 (Official Non-Teaching Ranking Manual)'
          },
          areas: [
            {
              area_code: 'A',
              name: 'Area A: Performance and Personal Indicators',
              max_points: 70.00,
              entry_policy: 'personnel_entry_disallowed_read_only',
              is_personnel_entry_allowed: false
            },
            {
              area_code: 'B',
              name: 'Area B: Professional Development & Technical Capability',
              max_points: 50.00,
              entry_policy: 'personnel_entry_allowed',
              is_personnel_entry_allowed: true
            },
            {
              area_code: 'C',
              name: 'Area C: Institutional Service & Community Extension',
              max_points: 30.00,
              entry_policy: 'personnel_entry_allowed',
              is_personnel_entry_allowed: true
            }
          ]
        }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockConfig)

      const result = await portfolioConfigurationService.fetchWorkspaceConfiguration()
      const data = result?.data || result

      expect(data.scale.scale_code).toBe('NON_TEACHING_PERSONNEL_RANKING_SCALE')
      expect(data.scale.total_max_points).toBe(150.00)
      expect(data.scale.passing_score).toBe(75.00)
      expect(data.areas[0].entry_policy).toBe('personnel_entry_disallowed_read_only')
      expect(data.areas[0].is_personnel_entry_allowed).toBe(false)
      expect(data.areas[1].is_personnel_entry_allowed).toBe(true)
      expect(data.areas[2].is_personnel_entry_allowed).toBe(true)
    })

    it('rejects invalid classification pairs with 422 INVALID_PERSONNEL_CLASSIFICATION', async () => {
      const mockError = {
        response: {
          status: 422,
          data: {
            code: 'INVALID_PERSONNEL_CLASSIFICATION',
            message: 'Invalid personnel classification pair: [faculty + non_academic]. Cannot resolve evaluation scale.'
          }
        }
      }

      vi.spyOn(apiClient, 'get').mockRejectedValue(mockError)

      await expect(portfolioConfigurationService.fetchWorkspaceConfiguration()).rejects.toMatchObject({
        response: {
          status: 422,
          data: { code: 'INVALID_PERSONNEL_CLASSIFICATION' }
        }
      })
    })
  })

  describe('F1.3 Non-Teaching Area A Read-Only & Mutation Prevention Policy', () => {
    it('blocks personnel accomplishment creation in Area A for Non-Teaching scale with 409 PORTFOLIO_AREA_READ_ONLY', async () => {
      const entryPayload = {
        area_code: 'A',
        title: 'Unauthorized Self-Evaluation Metric',
        category: 'Performance Indicators',
        points: 20
      }

      const mockError = {
        response: {
          status: 409,
          data: {
            code: 'PORTFOLIO_AREA_READ_ONLY',
            message: 'Portfolio Area [A: Area A: Performance and Personal Indicators] does not permit personnel accomplishment entry.'
          }
        }
      }

      vi.spyOn(apiClient, 'post').mockRejectedValue(mockError)

      await expect(portfolioConfigurationService.validateAccomplishmentEntry(entryPayload)).rejects.toMatchObject({
        response: {
          status: 409,
          data: { code: 'PORTFOLIO_AREA_READ_ONLY' }
        }
      })
    })
  })

  describe('F1.4 Point Schedule Validation & Formula Tracing', () => {
    it('calculates Ph.D. degree points as 40 raw points without cap violation', async () => {
      const entry = {
        area_code: 'A',
        category: 'A.1 Degree/s',
        sub_category: 'Ph.D. Degree Holder',
        title: 'Doctor of Philosophy in Computer Science'
      }

      const mockTrace = {
        data: {
          scale_code: 'ADMINISTRATORS_RANKING_SCALE',
          area_code: 'A',
          category: 'A.1 Degree/s',
          sub_category: 'Ph.D. Degree Holder',
          raw_points: 40.00,
          claimed_points: 40.00,
          point_trace: {
            rule_applied: 'Ph.D. Degree Holder (40 pts)',
            formula_key: 'DEGREE_PHD',
            capped: false
          }
        }
      }

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockTrace)

      const result = await portfolioConfigurationService.validateAccomplishmentEntry(entry)
      const data = result?.data || result

      expect(apiClient.post).toHaveBeenCalledWith('/personnel/portfolio/validate-entry', entry)
      expect(data.claimed_points).toBe(40.00)
      expect(data.point_trace.formula_key).toBe('DEGREE_PHD')
    })

    it('calculates Ph.D. units correctly at 2 pts per 3 units and caps at 10 pts', async () => {
      const entry = {
        area_code: 'A',
        category: 'A.1 Degree/s',
        sub_category: 'Ph.D. Units Earned',
        units_earned: 18,
        title: '18 Doctoral Units Earned'
      }

      const mockTrace = {
        data: {
          raw_points: 10.00,
          claimed_points: 10.00,
          point_trace: {
            rule_applied: 'Ph.D. Units (2 pts per 3 units, max 10 pts)',
            formula_key: 'DEGREE_PHD_UNITS',
            capped: true
          }
        }
      }

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockTrace)

      const result = await portfolioConfigurationService.validateAccomplishmentEntry(entry)
      const data = result?.data || result

      expect(data.claimed_points).toBe(10.00)
      expect(data.point_trace.capped).toBe(true)
    })

    it('calculates Seminar Attendance points based on official geographic scope levels', async () => {
      const entry = {
        area_code: 'A',
        category: 'A.3 Attendance to Seminars/Trainings',
        sub_category: 'International Seminar',
        scope: 'International',
        title: 'IEEE International AI Conference'
      }

      const mockTrace = {
        data: {
          raw_points: 10.00,
          claimed_points: 10.00,
          point_trace: {
            rule_applied: 'International Seminar (10 pts)',
            formula_key: 'SEMINAR_INTL'
          }
        }
      }

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockTrace)

      const result = await portfolioConfigurationService.validateAccomplishmentEntry(entry)
      const data = result?.data || result

      expect(data.claimed_points).toBe(10.00)
      expect(data.point_trace.formula_key).toBe('SEMINAR_INTL')
    })

    it('calculates Service Credit accurately at 1 pt per 2 full years capped at 10 pts', async () => {
      const entry = {
        area_code: 'C',
        category: 'C.3 NDMU Service Credit',
        sub_category: 'Years of Service Credit',
        years_of_service: 16,
        title: '16 Years Institutional Service'
      }

      const mockTrace = {
        data: {
          raw_points: 8.00,
          claimed_points: 8.00,
          point_trace: {
            rule_applied: 'Years of Service Credit (1 pt per 2 yrs, max 10 pts)',
            formula_key: 'SRV_CREDIT',
            capped: false
          }
        }
      }

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockTrace)

      const result = await portfolioConfigurationService.validateAccomplishmentEntry(entry)
      const data = result?.data || result

      expect(data.claimed_points).toBe(8.00)
      expect(data.point_trace.formula_key).toBe('SRV_CREDIT')
    })
  })

  describe('F1.5 Rubric Administration Catalogue & Approval Lifecycle', () => {
    it('allows authorized HR Admin to list all catalogue scales and versions', async () => {
      const mockCatalogue = {
        data: [
          {
            scale_code: 'ADMINISTRATORS_RANKING_SCALE',
            title: 'NDMU Administrators & Academic Faculty Ranking Scale',
            total_points: 160.00,
            passing_score: 120.00,
            versions: [
              { version_number: '1.0.0', status: 'approved', evaluation_cycle_id: '2025-2026' }
            ]
          },
          {
            scale_code: 'NON_TEACHING_PERSONNEL_RANKING_SCALE',
            title: 'NDMU Non-Teaching Personnel Ranking Scale',
            total_points: 150.00,
            passing_score: 75.00,
            versions: [
              { version_number: '1.0.0', status: 'approved', evaluation_cycle_id: '2025-2026' }
            ]
          }
        ]
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockCatalogue)

      const result = await portfolioConfigurationService.fetchEvaluationScalesCatalogue()
      const data = result?.data || result

      expect(apiClient.get).toHaveBeenCalledWith('/admin/evaluation-scales')
      expect(data).toHaveLength(2)
      expect(data[0].scale_code).toBe('ADMINISTRATORS_RANKING_SCALE')
      expect(data[1].scale_code).toBe('NON_TEACHING_PERSONNEL_RANKING_SCALE')
    })

    it('approves a draft scale version and records auditable transition', async () => {
      const versionId = 'ver-admin-draft-002'
      const reason = 'Approved updated research publication point schedule for AY 2026-2027.'

      const mockApprove = {
        data: {
          version_id: versionId,
          status: 'approved',
          approved_at: '2026-09-08T15:00:00Z',
          message: 'Scale version approved successfully.'
        }
      }

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockApprove)

      const result = await portfolioConfigurationService.approveScaleVersion(versionId, reason)
      const data = result?.data || result

      expect(apiClient.post).toHaveBeenCalledWith(`/admin/evaluation-scales/${versionId}/approve`, { reason })
      expect(data.status).toBe('approved')
      expect(data.version_id).toBe(versionId)
    })

    it('retires an existing active scale version with reason', async () => {
      const versionId = 'ver-admin-2025-001'
      const reason = 'Retired in favor of v1.1.0 for subsequent cycle.'

      const mockRetire = {
        data: {
          version_id: versionId,
          status: 'retired',
          message: 'Scale version retired successfully.'
        }
      }

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockRetire)

      const result = await portfolioConfigurationService.retireScaleVersion(versionId, reason)
      const data = result?.data || result

      expect(apiClient.post).toHaveBeenCalledWith(`/admin/evaluation-scales/${versionId}/retire`, { reason })
      expect(data.status).toBe('retired')
    })
  })
})
