import { describe, it, expect, vi, beforeEach } from 'vitest'
import PersonnelPortfolioController from '../PersonnelPortfolioController.js'
import PersonnelAchievementController from '../PersonnelAchievementController.js'
import personnelAccomplishmentService from '../../services/personnelAccomplishmentService.js'
import PersonnelPortfolioModel from '../../models/PersonnelPortfolioModel.js'

describe('Personnel Evaluation Track — Plan B — Phase B2 Test Suite: Unified Portfolio Assembly Workspace & Advisory-Only Presentation', () => {
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

  // 23.1 No self-verification controls
  it('23.1 should ensure Personnel items have no evaluator self-verification or premature approval state', async () => {
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(sampleAccomplishments)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    
    // Check all reflected items across all areas
    const allItems = [
      ...portfolio.area_a_items,
      ...portfolio.area_b_items,
      ...portfolio.area_c_items
    ]

    for (const item of allItems) {
      expect(item.verified_points).toBe(0)
      expect(item.is_proof_verified).toBe(false)
      // Status must not be evaluator-approved
      expect(item.status).not.toBe('Approved')
      expect(item.status).not.toBe('Accepted')
      expect(item.status).not.toBe('Evaluated')
    }
  })

  // 23.2 Advisory points labeling
  it('23.2 should expose claimed points strictly as advisory values without official accepted score', async () => {
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(sampleAccomplishments)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    
    expect(portfolio.total_claimed_points).toBe(60) // 30 + 20 + 10
    expect(portfolio.total_verified_points).toBe(0) // No evaluator score in working assembly

    const itemA = portfolio.area_a_items[0]
    expect(itemA.claimed_points).toBe(30)
    expect(itemA.advisory_status).toBe('Advisory Record')
  })

  // 23.3 Canonical edit path
  it('23.3 should preserve canonical achievement ID and route edits through canonical update service', async () => {
    vi.spyOn(personnelAccomplishmentService, 'updateAccomplishment').mockResolvedValue({
      id: 'acc_001',
      title: 'Ph.D. in Computer Science (Updated Title)',
      claimed_points: 30
    })

    const updatePayload = {
      title: 'Ph.D. in Computer Science (Updated Title)',
      category: 'A.1 Degree/s',
      occurrence_date: '2024-05-20',
      organizer_or_publisher: 'Ateneo de Manila University',
      claimed_points: 30
    }

    const result = await personnelAccomplishmentService.updateAccomplishment('acc_001', updatePayload)
    
    expect(personnelAccomplishmentService.updateAccomplishment).toHaveBeenCalledWith('acc_001', updatePayload)
    expect(result.id).toBe('acc_001')
    expect(result.title).toBe('Ph.D. in Computer Science (Updated Title)')
  })

  // 23.4 Canonical add path
  it('23.4 should route achievement creation through canonical PersonnelAchievementController / Plan A flow', async () => {
    const mockCreated = {
      id: 'acc_new_099',
      title: 'Published AI Research in Springer Nature',
      category: 'B.2 Publication',
      domain: 'productivity_creative_work',
      category_area: 'areaB',
      claimed_points: 25,
      occurrence_date: '2026-03-01',
      status: 'Active',
      evidence_id: 'ev_new_099',
      attached_file_name: 'springer_paper.pdf'
    }

    vi.spyOn(PersonnelAchievementController, 'addAchievement').mockResolvedValue({
      success: true,
      achievement: mockCreated
    })

    const fakeFile = new File(['dummy content'], 'springer_paper.pdf', { type: 'application/pdf' })
    const result = await PersonnelAchievementController.addAchievement({
      title: 'Published AI Research in Springer Nature',
      category: 'B.2 Publication',
      domain: 'productivity_creative_work',
      occurrence_date: '2026-03-01',
      claimed_points: 25
    }, fakeFile)

    expect(result.success).toBe(true)
    expect(result.achievement.id).toBe('acc_new_099')
    expect(result.achievement.category_area).toBe('areaB')
  })

  // 23.5 Evidence access
  it('23.5 should allow secure evidence blob retrieval using canonical evidence references without placeholder files', async () => {
    const mockBlob = new Blob(['sample-pdf-bytes'], { type: 'application/pdf' })
    vi.spyOn(personnelAccomplishmentService, 'downloadEvidenceBlob').mockResolvedValue({
      blob: mockBlob,
      filename: 'phd_diploma_santos.pdf'
    })

    const downloadResult = await personnelAccomplishmentService.downloadEvidenceBlob('acc_001')
    
    expect(downloadResult.blob).toBeInstanceOf(Blob)
    expect(downloadResult.filename).toBe('phd_diploma_santos.pdf')
    expect(personnelAccomplishmentService.downloadEvidenceBlob).toHaveBeenCalledWith('acc_001')
  })

  // 23.6 Unresolved classification
  it('23.6 should safely reflect unclassified achievements with neutral "Needs Classification" badge without failing', async () => {
    const unclassifiedAccomplishments = [
      {
        id: 'acc_unclass_001',
        title: 'Uncategorized Participation Certificate',
        category: '', // Missing category
        domain: '', // Missing domain
        category_area: '',
        occurrence_date: '2026-01-10',
        organizer_or_publisher: 'Regional Consortium',
        claimed_points: 0,
        attached_file_name: 'cert_unclass.pdf',
        evidence_id: 'ev_unclass_001',
        evidence: { id: 'ev_unclass_001', original_filename: 'cert_unclass.pdf' },
        status: 'Active'
      }
    ]

    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(unclassifiedAccomplishments)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    
    // Items with missing domain default to Area A for safe visibility
    expect(portfolio.area_a_items.length).toBe(1)
    const item = portfolio.area_a_items[0]
    expect(item.id).toBe('acc_unclass_001')
    expect(item.is_unclassified).toBe(true)
    expect(item.advisory_status).toBe('Needs Classification')
  })

  // 23.7 Profile / master data
  it('23.7 should keep HR-controlled master data read-only in portfolio presentation', async () => {
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(sampleAccomplishments)

    const hrMasterProfile = {
      personnel_id: 'EMP-2021-0842',
      personnel_name: 'Dr. Maria Santos',
      academic_rank: 'Associate Professor II',
      faculty_type: 'Full-Time Permanent',
      college_id: 'COL-CITE',
      college_name: 'College of Information Technology Education',
      department_name: 'Computer Science Department',
      years_of_service: 8
    }

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842', hrMasterProfile)

    expect(portfolio.personnel_id).toBe('EMP-2021-0842')
    expect(portfolio.personnel_name).toBe('Dr. Maria Santos')
    expect(portfolio.academic_rank).toBe('Associate Professor II')
    expect(portfolio.college_name).toBe('College of Information Technology Education')
    expect(portfolio.years_of_service).toBe(8)
  })

  // 23.8 Summary totals
  it('23.8 should aggregate advisory totals without computing Pass/Retain or rank promotion outcomes', async () => {
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(sampleAccomplishments)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')

    // Advisory claimed points sum
    expect(portfolio.total_claimed_points).toBe(60)
    // No evaluator scoring
    expect(portfolio.total_verified_points).toBe(0)

    // Ensure no evaluation outcome properties are generated on the portfolio
    expect(portfolio).not.toHaveProperty('evaluation_decision')
    expect(portfolio).not.toHaveProperty('promotion_status')
    expect(portfolio).not.toHaveProperty('rank_retention_result')
  })

  // 23.9 Sync
  it('23.9 should sync updated canonical achievement values deterministically without duplicating entries', async () => {
    let dataset = [...sampleAccomplishments]
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockImplementation(async () => dataset)

    const initialPortfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    expect(initialPortfolio.area_a_items.length).toBe(1)
    expect(initialPortfolio.area_a_items[0].title).toBe('Ph.D. in Computer Science')

    // Update canonical achievement in mock backend
    dataset = [
      {
        ...sampleAccomplishments[0],
        title: 'Ph.D. in Computer Science (Summa Cum Laude)',
        claimed_points: 35
      },
      sampleAccomplishments[1],
      sampleAccomplishments[2]
    ]

    const updatedPortfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    expect(updatedPortfolio.area_a_items.length).toBe(1)
    expect(updatedPortfolio.area_a_items[0].id).toBe('acc_001')
    expect(updatedPortfolio.area_a_items[0].title).toBe('Ph.D. in Computer Science (Summa Cum Laude)')
    expect(updatedPortfolio.area_a_items[0].claimed_points).toBe(35)
  })

  // 23.10 Empty state
  it('23.10 should provide a clean empty portfolio with zero mock fallback items', async () => {
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue([])

    const emptyPortfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-9999-0000')

    expect(emptyPortfolio.area_a_items).toEqual([])
    expect(emptyPortfolio.area_b_items).toEqual([])
    expect(emptyPortfolio.area_c_items).toEqual([])
    expect(emptyPortfolio.total_claimed_points).toBe(0)
    expect(emptyPortfolio.total_verified_points).toBe(0)
  })

  // 23.11 Error state
  it('23.11 should propagate error when backend fetch fails and not fallback to stale localStorage seeds', async () => {
    localStorage.setItem('achievenest_personnel_portfolios', JSON.stringify([
      { id: 'stale_1', title: 'Stale Seed Item' }
    ]))

    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockRejectedValue(new Error('Network Unavailable 503'))

    await expect(PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')).rejects.toThrow('Network Unavailable 503')
  })

  // 23.12 Deterministic sorting
  it('23.12 should sort achievements deterministically newest first by occurrence_date then title', async () => {
    const multiDateAreaB = [
      {
        id: 'acc_b1',
        title: 'B Item Older',
        domain: 'productivity_creative_work',
        occurrence_date: '2024-01-01',
        claimed_points: 5,
        attached_file_name: 'proof.pdf',
        evidence_id: 'ev_1'
      },
      {
        id: 'acc_b2',
        title: 'B Item Newer',
        domain: 'productivity_creative_work',
        occurrence_date: '2025-06-01',
        claimed_points: 10,
        attached_file_name: 'proof.pdf',
        evidence_id: 'ev_2'
      },
      {
        id: 'acc_b3',
        title: 'A Item Same Date',
        domain: 'productivity_creative_work',
        occurrence_date: '2025-06-01',
        claimed_points: 10,
        attached_file_name: 'proof.pdf',
        evidence_id: 'ev_3'
      }
    ]

    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(multiDateAreaB)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    
    // Sort: 2025-06-01 comes before 2024-01-01; among same dates: 'A Item Same Date' comes before 'B Item Newer'
    expect(portfolio.area_b_items[0].id).toBe('acc_b3')
    expect(portfolio.area_b_items[1].id).toBe('acc_b2')
    expect(portfolio.area_b_items[2].id).toBe('acc_b1')
  })
})
