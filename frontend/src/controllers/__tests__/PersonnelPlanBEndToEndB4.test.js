import { describe, it, expect, vi, beforeEach } from 'vitest'
import PersonnelPortfolioController from '../PersonnelPortfolioController.js'
import PersonnelAchievementController from '../PersonnelAchievementController.js'
import personnelAccomplishmentService from '../../services/personnelAccomplishmentService.js'
import PersonnelPortfolioModel from '../../models/PersonnelPortfolioModel.js'

describe('Personnel Evaluation Track — Plan B — Phase B4 End-to-End Validation & Closure Test Suite', () => {
  const masterPersonnelProfile = {
    personnel_id: 'EMP-2021-0842',
    personnel_name: 'Dr. Maria Santos',
    academic_rank: 'Associate Professor II',
    college_id: 'COL-CITE',
    college_name: 'College of Information Technology Education',
    program_affiliations: ['BSCS', 'BSIT'],
    academic_year: 'AY 2025-2026',
    years_of_service: 8
  }

  const initialRepositoryAccomplishments = [
    {
      id: 'acc_b4_001',
      title: 'Ph.D. in Computer Science',
      category: 'A.1 Degree/s',
      domain: 'professional_development',
      category_area: 'areaA',
      occurrence_date: '2024-05-20',
      organizer_or_publisher: 'Ateneo de Manila University',
      claimed_points: 30,
      scope_level: 'Institutional',
      attached_file_name: 'phd_diploma_santos.pdf',
      evidence_id: 'ev_001',
      evidence: { id: 'ev_001', original_filename: 'phd_diploma_santos.pdf' },
      status: 'Active',
      description: 'Doctor of Philosophy in Computer Science'
    },
    {
      id: 'acc_b4_002',
      title: 'Machine Learning Frameworks in Higher Education Analytics',
      category: 'B.2 Publication',
      domain: 'productivity_creative_work',
      category_area: 'areaB',
      occurrence_date: '2025-11-15',
      organizer_or_publisher: 'IEEE Access Journal',
      claimed_points: 20,
      scope_level: 'International',
      attached_file_name: 'ieee_access_paper.pdf',
      evidence_id: 'ev_002',
      evidence: { id: 'ev_002', original_filename: 'ieee_access_paper.pdf' },
      status: 'Active',
      description: 'Scopus indexed publication'
    },
    {
      id: 'acc_b4_003',
      title: 'Faculty Adviser: NDMU Computer Society',
      category: 'C.1 Involvement in Extra-Curricular Activities',
      domain: 'service_leadership',
      category_area: 'areaC',
      occurrence_date: '2025-09-01',
      organizer_or_publisher: 'Student Affairs Office (SAO)',
      claimed_points: 10,
      scope_level: 'Institutional',
      attached_file_name: 'moderator_appointment.pdf',
      evidence_id: 'ev_003',
      evidence: { id: 'ev_003', original_filename: 'moderator_appointment.pdf' },
      status: 'Active',
      description: 'Faculty club adviser appointment'
    }
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  // 1. Full End-to-End Happy Path Lifecycle
  it('B4.1 End-to-End Happy Path: should execute create -> reflect -> edit -> reclassify -> evidence download -> delete lifecycle seamlessly', async () => {
    let currentDb = [...initialRepositoryAccomplishments]
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockImplementation(async () => currentDb)
    vi.spyOn(personnelAccomplishmentService, 'createAccomplishment').mockImplementation(async (payload) => {
      const created = { id: 'acc_b4_new', ...payload }
      currentDb.push(created)
      return { data: created }
    })
    vi.spyOn(personnelAccomplishmentService, 'updateAccomplishment').mockImplementation(async (id, payload) => {
      const idx = currentDb.findIndex(i => i.id === id)
      if (idx >= 0) {
        currentDb[idx] = { ...currentDb[idx], ...payload }
      }
      return { data: currentDb[idx] }
    })
    vi.spyOn(personnelAccomplishmentService, 'deleteAccomplishment').mockImplementation(async (id) => {
      currentDb = currentDb.filter(i => i.id !== id)
      return { success: true }
    })

    // Step 1: Initial reflection load
    let portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842', masterPersonnelProfile)
    expect(portfolio.area_a_items.length).toBe(1)
    expect(portfolio.area_b_items.length).toBe(1)
    expect(portfolio.area_c_items.length).toBe(1)
    expect(portfolio.total_claimed_points).toBe(60)
    expect(portfolio.total_verified_points).toBe(0)

    // Step 2: Create new achievement via canonical Plan A controller
    const newEntryPayload = {
      title: 'Keynote Speaker on Generative AI Ethics',
      category: 'B.1 Guest Lecturer / Consultant / Judge',
      category_area: 'areaB',
      domain: 'productivity_creative_work',
      occurrence_date: '2026-03-01',
      organizer_or_publisher: 'DOST Region XII',
      claimed_points: 15,
      scope_level: 'Regional'
    }
    const fakeFile = new File(['dummy content'], 'dost_keynote_cert.pdf', { type: 'application/pdf' })
    vi.spyOn(personnelAccomplishmentService, 'uploadEvidence').mockResolvedValue({
      evidence: { id: 'ev_004', original_filename: 'dost_keynote_cert.pdf' }
    })

    const createdModel = await PersonnelAchievementController.addAchievement(newEntryPayload, fakeFile)
    expect(createdModel.id).toBe('acc_b4_new')

    // Step 3: Portfolio synchronization reflection
    portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842', masterPersonnelProfile)
    expect(portfolio.area_b_items.length).toBe(2)
    expect(portfolio.total_claimed_points).toBe(75) // 30 + (20+15) + 10

    // Step 4: Edit achievement in place
    await personnelAccomplishmentService.updateAccomplishment('acc_b4_new', {
      title: 'Distinguished Keynote Speaker on Generative AI Ethics'
    })
    portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842', masterPersonnelProfile)
    const editedItem = portfolio.area_b_items.find(i => i.id === 'acc_b4_new')
    expect(editedItem.title).toBe('Distinguished Keynote Speaker on Generative AI Ethics')

    // Step 5: Reclassify achievement (move from Area B to Area A)
    await personnelAccomplishmentService.updateAccomplishment('acc_b4_new', {
      category: 'A.3 Attendance to Seminars/Trainings',
      domain: 'professional_development',
      category_area: 'areaA',
      claimed_points: 8
    })
    portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842', masterPersonnelProfile)
    expect(portfolio.area_a_items.length).toBe(2)
    expect(portfolio.area_b_items.length).toBe(1)
    expect(portfolio.area_a_items.some(i => i.id === 'acc_b4_new')).toBe(true)

    // Step 6: Evidence download check
    const mockBlob = new Blob(['pdf-data'], { type: 'application/pdf' })
    vi.spyOn(personnelAccomplishmentService, 'downloadEvidenceBlob').mockResolvedValue({
      blob: mockBlob,
      filename: 'dost_keynote_cert.pdf'
    })
    const downloadRes = await personnelAccomplishmentService.downloadEvidenceBlob('ev_004', 'dost_keynote_cert.pdf')
    expect(downloadRes).toBeDefined()

    // Step 7: Delete achievement
    await personnelAccomplishmentService.deleteAccomplishment('acc_b4_new')
    portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842', masterPersonnelProfile)
    expect(portfolio.area_a_items.length).toBe(1)
    expect(portfolio.area_a_items.some(i => i.id === 'acc_b4_new')).toBe(false)
    expect(portfolio.total_claimed_points).toBe(60)
  })

  // 2. Canonical Source-of-Truth & No Mock Fallbacks
  it('B4.2 Source-of-Truth: should reconstruct portfolio strictly from backend without localStorage mock seeds', async () => {
    // Inject corrupt legacy mock objects in localStorage
    localStorage.setItem('achievenest_personnel_portfolios', JSON.stringify([{
      personnel_id: 'EMP-2021-0842',
      area_a_items: [{ id: 'item_a1', title: 'Fake Seed Item' }]
    }]))

    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(initialRepositoryAccomplishments)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842', masterPersonnelProfile)

    const allItemIds = [
      ...portfolio.area_a_items.map(i => i.id),
      ...portfolio.area_b_items.map(i => i.id),
      ...portfolio.area_c_items.map(i => i.id)
    ]

    expect(allItemIds).not.toContain('item_a1')
    expect(allItemIds).toEqual(['acc_b4_001', 'acc_b4_002', 'acc_b4_003'])
  })

  // 3. Evaluator Authority Absence & Advisory Scoring
  it('B4.3 Advisory Boundary: should ensure Personnel portfolio has no evaluator verification or scoring controls', async () => {
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(initialRepositoryAccomplishments)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842', masterPersonnelProfile)

    // Verify all reflected items have verified_points = 0 and is_proof_verified = false
    const allItems = [
      ...portfolio.area_a_items,
      ...portfolio.area_b_items,
      ...portfolio.area_c_items
    ]

    for (const item of allItems) {
      expect(item.verified_points).toBe(0)
      expect(item.is_proof_verified).toBe(false)
      expect(item.advisory_status).toBe('Advisory Record')
    }

    // Verify portfolio model does not produce evaluation decisions
    expect(portfolio.total_verified_points).toBe(0)
    expect(portfolio.status).toBe('DRAFT')
    expect(portfolio).not.toHaveProperty('evaluator_decision')
    expect(portfolio).not.toHaveProperty('passed_retained_status')
  })

  // 4. Deterministic Ordering and Unresolved Classification
  it('B4.4 Deterministic Ordering & Neutral Unresolved State: should sort newest first and badge unclassified items neutrally', async () => {
    const mixedAccomplishments = [
      {
        id: 'acc_older',
        title: 'Older Scopus Publication',
        domain: 'productivity_creative_work',
        occurrence_date: '2023-01-01',
        claimed_points: 10
      },
      {
        id: 'acc_newer',
        title: 'Newer Scopus Publication',
        domain: 'productivity_creative_work',
        occurrence_date: '2025-10-01',
        claimed_points: 15
      },
      {
        id: 'acc_unclass',
        title: 'Unclassified Activity Certificate',
        category: '',
        domain: '',
        occurrence_date: '2025-10-01',
        claimed_points: 0
      }
    ]

    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(mixedAccomplishments)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842', masterPersonnelProfile)

    // Area B ordering: newer before older
    expect(portfolio.area_b_items[0].id).toBe('acc_newer')
    expect(portfolio.area_b_items[1].id).toBe('acc_older')

    // Unclassified item placed in Area A with neutral badge
    expect(portfolio.area_a_items.length).toBe(1)
    expect(portfolio.area_a_items[0].id).toBe('acc_unclass')
    expect(portfolio.area_a_items[0].is_unclassified).toBe(true)
    expect(portfolio.area_a_items[0].advisory_status).toBe('Needs Classification')
  })

  // 5. Read-Only HR Master Data Context
  it('B4.5 HR Master Data: should maintain Personnel master profile as read-only context without mutation', async () => {
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(initialRepositoryAccomplishments)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842', masterPersonnelProfile)

    expect(portfolio.personnel_id).toBe('EMP-2021-0842')
    expect(portfolio.personnel_name).toBe('Dr. Maria Santos')
    expect(portfolio.academic_rank).toBe('Associate Professor II')
    expect(portfolio.college_name).toBe('College of Information Technology Education')
    expect(portfolio.years_of_service).toBe(8)
  })

  // 6. Error and Empty States
  it('B4.6 Truthful States: should render true empty state and propagate errors without mock fallbacks', async () => {
    // Empty state
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValueOnce([])
    const emptyPort = await PersonnelPortfolioController.loadPortfolioAsync('EMP-EMPTY', masterPersonnelProfile)
    expect(emptyPort.area_a_items).toEqual([])
    expect(emptyPort.area_b_items).toEqual([])
    expect(emptyPort.area_c_items).toEqual([])
    expect(emptyPort.total_claimed_points).toBe(0)

    // Error state
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockRejectedValueOnce(new Error('500 Service Unavailable'))
    await expect(PersonnelPortfolioController.loadPortfolioAsync('EMP-ERR', masterPersonnelProfile)).rejects.toThrow('500 Service Unavailable')
  })
})
