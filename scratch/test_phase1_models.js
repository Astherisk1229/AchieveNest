import RankingCriteriaModel from '../src/models/RankingCriteriaModel.js'
import PersonnelPortfolioModel from '../src/models/PersonnelPortfolioModel.js'

console.log('=== TESTING PHASE 1: CORE DOMAIN MODELS & NDMU SCORING ENGINE ===\n')

// 1. Test RankingCriteriaModel area capping
const testAreaCap = RankingCriteriaModel.applyAreaCeilings(85, 65, 55)
console.log('Area Ceiling Test (Raw: A=85, B=65, C=55):')
console.log(`- Accepted Area A: ${testAreaCap.acceptedA} / 70 (Overflow: ${testAreaCap.overflowA})`)
console.log(`- Accepted Area B: ${testAreaCap.acceptedB} / 50 (Overflow: ${testAreaCap.overflowB})`)
console.log(`- Accepted Area C: ${testAreaCap.acceptedC} / 40 (Overflow: ${testAreaCap.overflowC})`)
console.log(`- Final Total: ${testAreaCap.acceptedTotal} / 160\n`)

console.assert(testAreaCap.acceptedA === 70, 'Area A cap failed!')
console.assert(testAreaCap.acceptedB === 50, 'Area B cap failed!')
console.assert(testAreaCap.acceptedC === 40, 'Area C cap failed!')
console.assert(testAreaCap.acceptedTotal === 160, 'Total calculation failed!')

// 2. Test PersonnelPortfolioModel instantiation and item addition
const portfolio = new PersonnelPortfolioModel({
  personnel_name: 'Dr. Maria Santos',
  department_id: 'DEP-CEAC',
  years_of_service: 6
})

portfolio.addItem('A', { category: 'Degree/s', title: 'Ph.D. Computer Science', claimed_points: 40 })
portfolio.addItem('A', { category: 'Seminars', title: 'AI Conference', claimed_points: 10 })

portfolio.addItem('B', { category: 'Publications', title: 'IEEE Research Paper', claimed_points: 40 })
portfolio.addItem('B', { category: 'Guest Lecturer', title: 'Keynote Speaker', claimed_points: 20 })

portfolio.addItem('C', { category: 'Activities', title: 'Club Moderator', claimed_points: 20 })

const totals = portfolio.calculateAcceptedCappedTotals()
console.log('Portfolio Model Test:')
console.log(`- Raw Claimed A: ${totals.claimed.overflowA + totals.claimed.acceptedA} -> Capped Accepted A: ${totals.claimed.acceptedA}`)
console.log(`- Raw Claimed B: ${totals.claimed.overflowB + totals.claimed.acceptedB} -> Capped Accepted B: ${totals.claimed.acceptedB}`)
console.log(`- Raw Claimed C: ${totals.claimed.overflowC + totals.claimed.acceptedC} -> Capped Accepted C: ${totals.claimed.acceptedC}`)
console.log(`- Total Accepted Score: ${totals.claimed.acceptedTotal}\n`)

// 3. Test State Machine Transition
portfolio.transitionStatus('SUBMITTED_TO_DEP_SEC', 'Dr. Maria Santos', 'Personnel', 'Submitted portfolio for review.')
console.log(`State Transition Test: Status is now '${portfolio.status}'`)
console.assert(portfolio.status === 'SUBMITTED_TO_DEP_SEC', 'State transition failed!')
console.assert(portfolio.auditTrail.length === 2, 'Audit trail logging failed!')

console.log('✅ ALL PHASE 1 DOMAIN MODEL TESTS PASSED!')
