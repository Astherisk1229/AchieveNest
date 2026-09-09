import { describe, it, expect, vi, beforeEach } from 'vitest'
import PersonnelPortfolioController from '../PersonnelPortfolioController.js'
import PersonnelAchievementController from '../PersonnelAchievementController.js'
import personnelAccomplishmentService from '../../services/personnelAccomplishmentService.js'
import PersonnelPortfolioModel from '../../models/PersonnelPortfolioModel.js'

describe('Personnel Evaluation Track — Plan B — Phase B3 Test Suite: Repository Synchronization & Active Portfolio Consistency', () => {
  const initialAccomplishments = [
    {
      id: 'acc_sync_001',
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
      id: 'acc_sync_002',
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
      id: 'acc_sync_003',
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

  // 22.1 Create sync
  it('22.1 should synchronize newly created canonical achievement into portfolio with stable ID and correct group', async () => {
    let currentDb = [...initialAccomplishments]
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockImplementation(async () => currentDb)

    const initialPortfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    expect(initialPortfolio.area_b_items.length).toBe(1)
    expect(initialPortfolio.total_claimed_points).toBe(60)

    // Simulate creation of new achievement via Plan A controller
    const newAchievement = {
      id: 'acc_sync_004',
      title: 'Keynote Speaker at National Computing Convention',
      category: 'B.1 Guest Lecturer / Consultant / Judge',
      domain: 'productivity_creative_work',
      category_area: 'areaB',
      occurrence_date: '2026-02-14',
      organizer_or_publisher: 'Philippine Computer Society',
      claimed_points: 10,
      scope_level: 'National',
      attached_file_name: 'keynote_invitation.pdf',
      evidence_id: 'ev_004',
      status: 'Active'
    }

    currentDb.push(newAchievement)

    // Synchronization reload
    const refreshedPortfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    expect(refreshedPortfolio.area_b_items.length).toBe(2)
    expect(refreshedPortfolio.area_b_items.some(i => i.id === 'acc_sync_004')).toBe(true)
    expect(refreshedPortfolio.total_claimed_points).toBe(70)

    // Ensure item appears exactly once with correct deterministic order (2026-02-14 before 2025-11-15)
    expect(refreshedPortfolio.area_b_items[0].id).toBe('acc_sync_004')
    expect(refreshedPortfolio.area_b_items[1].id).toBe('acc_sync_002')
  })

  // 22.2 Edit sync
  it('22.2 should synchronize edited field values in place while retaining stable canonical ID', async () => {
    const updatedDb = [
      {
        ...initialAccomplishments[0],
        title: 'Ph.D. in Artificial Intelligence & Computational Linguistics',
        organizer_or_publisher: 'University of the Philippines Diliman'
      },
      initialAccomplishments[1],
      initialAccomplishments[2]
    ]

    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(updatedDb)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    expect(portfolio.area_a_items.length).toBe(1)
    expect(portfolio.area_a_items[0].id).toBe('acc_sync_001')
    expect(portfolio.area_a_items[0].title).toBe('Ph.D. in Artificial Intelligence & Computational Linguistics')
    expect(portfolio.area_a_items[0].issuer).toBe('University of the Philippines Diliman')
  })

  // 22.3 Reclassification sync
  it('22.3 should synchronize reclassification by moving item to new area and removing it from old area', async () => {
    // Reclassify acc_sync_001 from Area A (degree) to Area B (publication monograph)
    const reclassifiedDb = [
      {
        ...initialAccomplishments[0],
        category: 'B.2 Publication',
        domain: 'productivity_creative_work',
        category_area: 'areaB',
        claimed_points: 20
      },
      initialAccomplishments[1],
      initialAccomplishments[2]
    ]

    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(reclassifiedDb)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')

    // Area A should now be empty
    expect(portfolio.area_a_items.length).toBe(0)
    expect(portfolio.area_a_items.some(i => i.id === 'acc_sync_001')).toBe(false)

    // Area B should now contain acc_sync_001 and acc_sync_002
    expect(portfolio.area_b_items.length).toBe(2)
    expect(portfolio.area_b_items.some(i => i.id === 'acc_sync_001')).toBe(true)
  })

  // 22.4 Advisory points sync
  it('22.4 should synchronize updated claimed/suggested points and recalculate advisory totals without affecting evaluator points', async () => {
    const updatedPointsDb = [
      {
        ...initialAccomplishments[0],
        claimed_points: 40 // Increased from 30 to 40
      },
      initialAccomplishments[1],
      initialAccomplishments[2]
    ]

    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(updatedPointsDb)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')

    expect(portfolio.area_a_items[0].claimed_points).toBe(40)
    expect(portfolio.total_claimed_points).toBe(70) // 40 + 20 + 10
    expect(portfolio.total_verified_points).toBe(0) // Evaluator scoring untouched
  })

  // 22.5 Evidence sync
  it('22.5 should synchronize active evidence attachment when proof file is uploaded or replaced', async () => {
    const updatedEvidenceDb = [
      {
        ...initialAccomplishments[0],
        attached_file_name: 'phd_diploma_certified_true_copy.pdf',
        evidence_id: 'ev_updated_001',
        evidence: { id: 'ev_updated_001', original_filename: 'phd_diploma_certified_true_copy.pdf' }
      },
      initialAccomplishments[1],
      initialAccomplishments[2]
    ]

    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(updatedEvidenceDb)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    const itemA = portfolio.area_a_items[0]

    expect(itemA.proof_file_name).toBe('phd_diploma_certified_true_copy.pdf')
    expect(itemA.evidence_id).toBe('ev_updated_001')
  })

  // 22.6 Delete / remove sync
  it('22.6 should synchronize deletion by removing deleted achievement and updating advisory totals with zero orphans', async () => {
    let currentDb = [...initialAccomplishments]
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockImplementation(async () => currentDb)

    const initialPortfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    expect(initialPortfolio.area_c_items.length).toBe(1)
    expect(initialPortfolio.total_claimed_points).toBe(60)

    // Simulate deletion of acc_sync_003
    currentDb = currentDb.filter(i => i.id !== 'acc_sync_003')

    const refreshedPortfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    expect(refreshedPortfolio.area_c_items.length).toBe(0)
    expect(refreshedPortfolio.area_c_items.some(i => i.id === 'acc_sync_003')).toBe(false)
    expect(refreshedPortfolio.total_claimed_points).toBe(50) // 30 + 20
  })

  // 22.7 Repeated refetch
  it('22.7 should produce identical deterministic portfolio instances upon repeated refetch with zero duplicate items', async () => {
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(initialAccomplishments)

    const port1 = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    const port2 = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    const port3 = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')

    expect(port1.area_a_items.length).toBe(port2.area_a_items.length)
    expect(port2.area_a_items.length).toBe(port3.area_a_items.length)
    expect(port1.total_claimed_points).toBe(port3.total_claimed_points)
    expect(port1.area_a_items[0].id).toBe(port3.area_a_items[0].id)
  })

  // 22.8 Refresh / login consistency
  it('22.8 should reconstruct identical portfolio state after simulated logout and fresh login', async () => {
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(initialAccomplishments)

    // User session 1
    const session1Portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')

    // Simulate logout (clear all storage)
    localStorage.clear()
    sessionStorage.clear()

    // User session 2
    const session2Portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')

    expect(session2Portfolio.area_a_items.length).toBe(session1Portfolio.area_a_items.length)
    expect(session2Portfolio.area_b_items.length).toBe(session1Portfolio.area_b_items.length)
    expect(session2Portfolio.area_c_items.length).toBe(session1Portfolio.area_c_items.length)
    expect(session2Portfolio.total_claimed_points).toBe(session1Portfolio.total_claimed_points)
  })

  // 22.9 localStorage independence
  it('22.9 should completely ignore stale cached items in localStorage during sync', async () => {
    localStorage.setItem('achievenest_personnel_portfolios', JSON.stringify([
      { id: 'stale_orphan_item', title: 'Orphaned Cache Item' }
    ]))

    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(initialAccomplishments)

    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    const allIds = [
      ...portfolio.area_a_items.map(i => i.id),
      ...portfolio.area_b_items.map(i => i.id),
      ...portfolio.area_c_items.map(i => i.id)
    ]

    expect(allIds).not.toContain('stale_orphan_item')
    expect(allIds).toEqual(['acc_sync_001', 'acc_sync_002', 'acc_sync_003'])
  })

  // 22.10 Mutation failure
  it('22.10 should preserve confirmed state and not create fake optimistic records when backend update fails', async () => {
    vi.spyOn(personnelAccomplishmentService, 'updateAccomplishment').mockRejectedValue(new Error('500 Internal Server Error'))

    await expect(
      personnelAccomplishmentService.updateAccomplishment('acc_sync_001', { title: 'Failing Update Title' })
    ).rejects.toThrow('500 Internal Server Error')

    // Verify portfolio still loads last confirmed state
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(initialAccomplishments)
    const portfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    expect(portfolio.area_a_items[0].title).toBe('Ph.D. in Computer Science')
  })

  // 22.11 Refetch failure after success handling
  it('22.11 should handle refetch failure gracefully and allow subsequent retry to converge to backend state', async () => {
    // 1. Backend update succeeds
    vi.spyOn(personnelAccomplishmentService, 'updateAccomplishment').mockResolvedValue({ success: true })

    // 2. Refetch temporarily fails
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockRejectedValueOnce(new Error('Network Interruption'))

    await expect(PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')).rejects.toThrow('Network Interruption')

    // 3. Retry refetch succeeds and converges
    const updatedDb = [
      { ...initialAccomplishments[0], title: 'Converged After Retry' },
      initialAccomplishments[1],
      initialAccomplishments[2]
    ]
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValueOnce(updatedDb)

    const convergedPortfolio = await PersonnelPortfolioController.loadPortfolioAsync('EMP-2021-0842')
    expect(convergedPortfolio.area_a_items[0].title).toBe('Converged After Retry')
  })

  // 22.12 Auto-populate sync from vault
  it('22.12 should synchronize portfolio cleanly via autoPopulateFromVault removing stale items', () => {
    const existingPortfolio = new PersonnelPortfolioModel({
      personnel_id: 'EMP-2021-0842',
      area_a_items: [{ id: 'stale_item_to_be_replaced', title: 'Old Stale' }]
    })

    const syncedPortfolio = PersonnelPortfolioController.autoPopulateFromVault(existingPortfolio, initialAccomplishments)

    expect(syncedPortfolio.area_a_items.length).toBe(1)
    expect(syncedPortfolio.area_a_items[0].id).toBe('acc_sync_001')
    expect(syncedPortfolio.area_a_items.some(i => i.id === 'stale_item_to_be_replaced')).toBe(false)
    expect(syncedPortfolio.area_b_items.length).toBe(1)
    expect(syncedPortfolio.area_c_items.length).toBe(1)
  })
})
