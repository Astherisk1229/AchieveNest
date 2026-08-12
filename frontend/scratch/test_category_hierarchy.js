/**
 * test_category_hierarchy.js
 * Unit test for NDMU Categories & Sub-Categories Hierarchy and 1-Click Vault Auto-Population.
 */
import RankingCriteriaModel from '../src/models/RankingCriteriaModel.js'
import PersonnelPortfolioModel from '../src/models/PersonnelPortfolioModel.js'
import PersonnelPortfolioController from '../src/controllers/PersonnelPortfolioController.js'

console.log('=== TEST: NDMU CATEGORIES & SUB-CATEGORIES HIERARCHY ===')

// 1. Test getRequiredProofType
const degreeProof = RankingCriteriaModel.getRequiredProofType('A', 'A.1 Degree/s', 'Ph.D. Degree Holder')
console.log('Proof Hint for Ph.D.:', degreeProof)
if (!degreeProof.includes('Diploma')) {
  throw new Error('FAILED: Expected Diploma in proof hint.')
}

const pubProof = RankingCriteriaModel.getRequiredProofType('B', 'B.2 Publication', 'Scholarly Paper')
console.log('Proof Hint for Scholarly Paper:', pubProof)
if (!pubProof.includes('Journal Copy')) {
  throw new Error('FAILED: Expected Journal Copy in publication proof hint.')
}

// 2. Test 1-Click Vault Auto-Populate
const mockPortfolio = new PersonnelPortfolioModel({
  id: 'PORT-TEST-001',
  personnel_id: 'EMP-2024-001',
  personnel_name: 'Dr. Test User',
  department_name: 'College of IT',
  area_a_items: [],
  area_b_items: [],
  area_c_items: []
})

console.log('\n--- Before Auto-Populate ---')
console.log('Area A Count:', mockPortfolio.area_a_items.length)
console.log('Area B Count:', mockPortfolio.area_b_items.length)

PersonnelPortfolioController.autoPopulateFromVault(mockPortfolio, 'EMP-2024-001')

console.log('\n--- After Auto-Populate ---')
console.log('Area A Count:', mockPortfolio.area_a_items.length)
console.log('Area B Count:', mockPortfolio.area_b_items.length)
console.log('Area C Count:', mockPortfolio.area_c_items.length)

const totals = mockPortfolio.calculateAcceptedCappedTotals()
console.log('\nCalculated Totals:', totals.claimed)

if (mockPortfolio.area_a_items.length === 0 || mockPortfolio.area_b_items.length === 0) {
  throw new Error('FAILED: Auto-populate did not import items into Area A and Area B.')
}

console.log('\n✅ ALL CATEGORY HIERARCHY & VAULT TESTS PASSED CLEANLY!')
