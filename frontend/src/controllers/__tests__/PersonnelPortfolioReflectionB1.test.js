import { describe, it, expect, vi, beforeEach } from 'vitest'
import PersonnelPortfolioController from '../PersonnelPortfolioController.js'
import personnelAccomplishmentService from '../../services/personnelAccomplishmentService.js'
import PersonnelPortfolioModel from '../../models/PersonnelPortfolioModel.js'

describe('Personnel Evaluation Track — Plan B — Phase B1 Test Suite', () => {
  const sampleAccomplishments = [
    {
      id: 'acc_001',
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
      description: 'Completed doctorate in computer science.'
    },
    {
      id: 'acc_002',
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
      description: 'Published Scopus indexed paper.'
    },
    {
      id: 'acc_003',
      title: 'Faculty Adviser: NDMU Computer Society',
      category: 'C.1 School Involvement',
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
      description: 'Supervised student org activities.'
    }
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  // 25.1 Live load: mock backend canonical achievements
  it('25.1 should load portfolio reflecting live backend accomplishments without static seed items', async () => {
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(sampleAccomplishments)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842', {
      personnel_name: 'Dr. Maria Santos',
      academic_rank: 'Associate Professor II'
    })

    expect(portfolio).toBeInstanceOf(PersonnelPortfolioModel)
    expect(portfolio.area_a_items.length).toBe(1)
    expect(portfolio.area_a_items[0].id).toBe('acc_001')
    expect(portfolio.area_a_items[0].title).toBe('Ph.D. in Computer Science')

    expect(portfolio.area_b_items.length).toBe(1)
    expect(portfolio.area_b_items[0].id).toBe('acc_002')

    expect(portfolio.area_c_items.length).toBe(1)
    expect(portfolio.area_c_items[0].id).toBe('acc_003')

    // Confirm no obsolete mock items like 'item_a1' or 'item_c1' exist
    const allIds = [
      ...portfolio.area_a_items.map(i => i.id),
      ...portfolio.area_b_items.map(i => i.id),
      ...portfolio.area_c_items.map(i => i.id)
    ]
    expect(allIds).not.toContain('item_a1')
    expect(allIds).not.toContain('item_a2')
    expect(allIds).not.toContain('item_b1')
    expect(allIds).not.toContain('item_c1')
  })

  // 25.2 Empty repository
  it('25.2 should render genuine empty state with 0 items when backend returns empty array', async () => {
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue([])

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-EMPTY-001', {
      personnel_name: 'New Faculty Member'
    })

    expect(portfolio.area_a_items).toEqual([])
    expect(portfolio.area_b_items).toEqual([])
    expect(portfolio.area_c_items).toEqual([])
  })

  // 25.3 localStorage independence
  it('25.3 should ignore stale achievenest_personnel_portfolios in localStorage in favor of live backend records', async () => {
    // Inject stale legacy mock portfolio into localStorage
    localStorage.setItem('achievenest_personnel_portfolios', JSON.stringify([{
      personnel_id: 'EMP-2021-0842',
      area_a_items: [{ id: 'stale_mock_item', title: 'Stale LocalStorage Item' }]
    }]))

    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(sampleAccomplishments)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    const allTitles = [
      ...portfolio.area_a_items.map(i => i.title),
      ...portfolio.area_b_items.map(i => i.title),
      ...portfolio.area_c_items.map(i => i.title)
    ]

    expect(allTitles).not.toContain('Stale LocalStorage Item')
    expect(allTitles).toContain('Ph.D. in Computer Science')
  })

  // 25.4 Stable identity
  it('25.4 should maintain stable canonical ID linkage and deduplicate duplicate response records', async () => {
    // Array containing duplicate of acc_001
    const duplicatedList = [...sampleAccomplishments, sampleAccomplishments[0]]
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(duplicatedList)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')

    // acc_001 must appear exactly once
    const acc1Matches = portfolio.area_a_items.filter(i => i.id === 'acc_001')
    expect(acc1Matches.length).toBe(1)
    expect(acc1Matches[0].id).toBe('acc_001')
    expect(acc1Matches[0].canonical_id).toBe('acc_001')
  })

  // 25.5 New achievement reflection
  it('25.5 should automatically reflect newly added canonical achievements upon refetch', async () => {
    let currentDb = [...sampleAccomplishments]
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockImplementation(async () => currentDb)

    const initialPortfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    expect(initialPortfolio.area_b_items.length).toBe(1)

    // Simulate newly created achievement persisted in Plan A
    const newAchievement = {
      id: 'acc_004',
      title: 'Keynote Speaker at Regional AI Summit',
      category: 'B.1 Guest Lecturer',
      domain: 'productivity_creative_work',
      category_area: 'areaB',
      occurrence_date: '2026-02-10',
      organizer_or_publisher: 'DOST Region XII',
      claimed_points: 10,
      scope_level: 'Regional',
      attached_file_name: 'dost_keynote_cert.pdf',
      evidence_id: 'ev_004',
      status: 'Active'
    }
    currentDb.push(newAchievement)

    const refreshedPortfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    expect(refreshedPortfolio.area_b_items.length).toBe(2)
    expect(refreshedPortfolio.area_b_items.some(i => i.id === 'acc_004')).toBe(true)
  })

  // 25.6 Update reflection
  it('25.6 should reflect updated field values while maintaining identical canonical ID', async () => {
    const updatedList = [
      {
        ...sampleAccomplishments[0],
        title: 'Ph.D. in Artificial Intelligence & Data Science'
      }
    ]
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(updatedList)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    expect(portfolio.area_a_items[0].id).toBe('acc_001')
    expect(portfolio.area_a_items[0].title).toBe('Ph.D. in Artificial Intelligence & Data Science')
  })

  // 25.7 Removed achievement
  it('25.7 should remove stale portfolio entries when canonical achievement is deleted', async () => {
    // Delete acc_001 from database
    const remainingList = sampleAccomplishments.filter(i => i.id !== 'acc_001')
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(remainingList)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    expect(portfolio.area_a_items.length).toBe(0)
    expect(portfolio.area_a_items.some(i => i.id === 'acc_001')).toBe(false)
  })

  // 25.8 Advisory points
  it('25.8 should treat claimed/suggested points strictly as advisory values and not self-verify scores', async () => {
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(sampleAccomplishments)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    const item = portfolio.area_a_items[0]

    expect(item.claimed_points).toBe(30)
    expect(item.verified_points).toBe(0) // Unverified in working personnel draft
    expect(item.is_proof_verified).toBe(false) // Not self-verified
  })

  // 25.9 Evidence link
  it('25.9 should link real canonical evidence references to reflected portfolio items', async () => {
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(sampleAccomplishments)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    const itemA = portfolio.area_a_items[0]

    expect(itemA.proof_file_name).toBe('phd_diploma_santos.pdf')
    expect(itemA.evidence_id).toBe('ev_001')
  })

  // 25.10 Profile metadata
  it('25.10 should consume Personnel master profile data as read-only context without mutation', async () => {
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(sampleAccomplishments)

    const profile = {
      personnel_name: 'Dr. Maria Santos',
      academic_rank: 'Associate Professor II',
      college_id: 'COL-CITE',
      college_name: 'College of Information Technology Education',
      years_of_service: 8
    }

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842', profile)
    expect(portfolio.personnel_name).toBe('Dr. Maria Santos')
    expect(portfolio.academic_rank).toBe('Associate Professor II')
    expect(portfolio.college_name).toBe('College of Information Technology Education')
    expect(portfolio.years_of_service).toBe(8)
  })

  // 25.11 Backend error
  it('25.11 should throw or propagate backend failure without silently showing mock/localStorage fallback', async () => {
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockRejectedValue(new Error('Database Connection Timeout'))

    await expect(PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')).rejects.toThrow('Database Connection Timeout')
  })

  // 25.12 Submission guard validation
  it('25.12 should enforce submission guard validation checking for proof file presence', async () => {
    const withoutProof = [
      {
        ...sampleAccomplishments[0],
        attached_file_name: '',
        evidence: null,
        evidence_id: null
      }
    ]
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(withoutProof)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    const guard = PersonnelPortfolioController.validateSubmissionGuard(portfolio)

    expect(guard.isValid).toBe(false)
    expect(guard.missingProofCount).toBe(1)
    expect(() => PersonnelPortfolioController.submitToDean(portfolio)).toThrow(/missing required proof documents/)
  })
})
