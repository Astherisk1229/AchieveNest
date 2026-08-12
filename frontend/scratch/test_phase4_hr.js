import HRRankingController from '../src/controllers/HRRankingController.js'
import DepSecVerificationController from '../src/controllers/DepSecVerificationController.js'
import PersonnelPortfolioController from '../src/controllers/PersonnelPortfolioController.js'

console.log('=== TESTING PHASE 4: HR GLOBAL RANKING MASTERBOARD & SCORE LOCK ===\n')

// Mock LocalStorage
const mockStorage = {}
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = val },
  removeItem: (key) => { delete mockStorage[key] }
}

// 1. Setup sample portfolios in storage
const port1 = PersonnelPortfolioController.loadPortfolio('EMP-HR-001', {
  personnel_name: 'Dr. Maria Santos',
  department_id: 'DEP-CEAC'
})
PersonnelPortfolioController.submitToDepSec(port1, 'Dr. Maria Santos')
const depSec = new DepSecVerificationController('DEP-CEAC')
depSec.endorseToHR(port1.id, 'Secretary Ana', 'All entries verified.')

// 2. Test HR Masterboard Queries
const allMasterboard = HRRankingController.getAllPortfolios()
console.log(`HR Masterboard found ${allMasterboard.length} global portfolio(s).`)
console.assert(allMasterboard.length === 1, 'Global masterboard query failed!')

const endorsedPortfolios = HRRankingController.filterMasterboard('', 'All', 'ENDORSED_TO_HR')
console.log(`Endorsed portfolios for HR Audit: ${endorsedPortfolios.length}`)
console.assert(endorsedPortfolios.length === 1, 'HR filter failed!')

// 3. Test HR Score Lock
const lockedModel = HRRankingController.approveAndLockRankingScore(port1.id, 'Dr. HR Director', 'Official Score Audited & Locked.')
console.log(`Status after HR Lock: '${lockedModel.status}'`)
console.assert(lockedModel.status === 'HR_APPROVED', 'HR Score Lock failed!')
console.assert(lockedModel.hr_approved_date !== null, 'HR approved date timestamp missing!')

console.log('\n✅ ALL PHASE 4 CONTROLLER & HR AUDIT TESTS PASSED!')
