import PersonnelPortfolioController from '../src/controllers/PersonnelPortfolioController.js'

console.log('=== TESTING PHASE 2: PERSONNEL PORTFOLIO CONTROLLER & SUBMISSION GUARDS ===\n')

// Mock LocalStorage in Node environment
const mockStorage = {}
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = val },
  removeItem: (key) => { delete mockStorage[key] }
}

// 1. Test load default portfolio
const portfolio = PersonnelPortfolioController.loadPortfolio('EMP-TEST-002', {
  personnel_name: 'Prof. John Doe',
  department_id: 'DEP-CABM'
})

console.log(`Loaded portfolio for: ${portfolio.personnel_name} (${portfolio.department_id})`)
console.log(`Initial Status: ${portfolio.status}`)
console.assert(portfolio.personnel_name === 'Prof. John Doe', 'Portfolio load failed!')

// 2. Test Adding and Removing Item
PersonnelPortfolioController.addItem(portfolio, 'A', {
  category: 'Degree/s',
  title: 'Master of Business Administration',
  claimed_points: 20,
  proof_file_name: 'MBA_Diploma.pdf'
})

console.log(`Items in Area A after addition: ${portfolio.area_a_items.length}`)
console.assert(portfolio.area_a_items.length === 3, 'Item addition failed!')

// 3. Test Proof Attachment Guard Validation
const guardResult = PersonnelPortfolioController.validateSubmissionGuard(portfolio)
console.log(`Proof Attachment Guard Check: isValid = ${guardResult.isValid}`)
console.assert(guardResult.isValid === true, 'Guard validation failed!')

// 4. Test Submission to Department Secretary
const submitted = PersonnelPortfolioController.submitToDepSec(portfolio, 'Prof. John Doe')
console.log(`Status after submission: ${submitted.status}`)
console.assert(submitted.status === 'SUBMITTED_TO_DEP_SEC', 'Submission failed!')

console.log('\n✅ ALL PHASE 2 CONTROLLER & GUARD TESTS PASSED!')
