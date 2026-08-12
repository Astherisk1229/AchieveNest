import DepSecVerificationController from '../src/controllers/DepSecVerificationController.js'
import PersonnelPortfolioController from '../src/controllers/PersonnelPortfolioController.js'

console.log('=== TESTING PHASE 3: DEPARTMENT SECRETARY EVALUATOR WORKBENCH & ENDORSEMENT ===\n')

// Mock LocalStorage
const mockStorage = {}
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = val },
  removeItem: (key) => { delete mockStorage[key] }
}

// 1. Setup sample portfolios in storage across different departments
const portCEAC = PersonnelPortfolioController.loadPortfolio('EMP-CEAC-001', {
  personnel_name: 'Dr. Maria Santos',
  department_id: 'DEP-CEAC'
})
PersonnelPortfolioController.submitToDepSec(portCEAC, 'Dr. Maria Santos')

const portCABM = PersonnelPortfolioController.loadPortfolio('EMP-CABM-001', {
  personnel_name: 'Prof. Juan Dela Cruz',
  department_id: 'DEP-CABM'
})
PersonnelPortfolioController.submitToDepSec(portCABM, 'Prof. Juan Dela Cruz')

// 2. Test Department Scoped Filtering
const depSecCEAC = new DepSecVerificationController('DEP-CEAC')
const ceacList = depSecCEAC.getDepartmentPortfolios()

console.log(`Department Secretary (DEP-CEAC) found ${ceacList.length} portfolio(s).`)
console.assert(ceacList.length === 1, 'Department filtering failed!')
console.assert(ceacList[0].personnel_name === 'Dr. Maria Santos', 'Department scoping error!')

// 3. Test Item Verification & Point Adjustments
const itemId = ceacList[0].area_a_items[0].id
const updatedModel = depSecCEAC.updateItemVerification(ceacList[0].id, 'A', itemId, 40, true, 'Verified diploma copy.')
console.log(`Status after starting verification: '${updatedModel.status}'`)
console.assert(updatedModel.status === 'UNDER_DEP_SEC_REVIEW', 'Status transition failed!')

// 4. Test HR Endorsement
const endorsedModel = depSecCEAC.endorseToHR(ceacList[0].id, 'Secretary Ana', 'All entries verified.')
console.log(`Status after endorsement: '${endorsedModel.status}'`)
console.assert(endorsedModel.status === 'ENDORSED_TO_HR', 'Endorsement to HR failed!')

console.log('\n✅ ALL PHASE 3 CONTROLLER & WORKBENCH TESTS PASSED!')
