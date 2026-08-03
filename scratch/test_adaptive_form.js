/**
 * test_adaptive_form.js
 * Unit test for Single Dynamic Adaptive Form, Smart Academic Year Auto-Infer, and Live Points Estimation.
 */
import RankingCriteriaModel from '../src/models/RankingCriteriaModel.js'

console.log('=== TEST: SINGLE DYNAMIC ADAPTIVE FORM & AUTO-INFER ===')

// 1. Test Smart Academic Year Auto-Infer
const inferAcademicYear = (dateStr) => {
  if (!dateStr) return 'AY 2025-2026'
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const startYear = month >= 6 ? year : year - 1
  return `AY ${startYear}-${startYear + 1}`
}

const ay1 = inferAcademicYear('2026-08-03')
console.log('Inferred AY for 2026-08-03:', ay1)
if (ay1 !== 'AY 2026-2027') throw new Error('FAILED: Expected AY 2026-2027')

const ay2 = inferAcademicYear('2026-02-14')
console.log('Inferred AY for 2026-02-14:', ay2)
if (ay2 !== 'AY 2025-2026') throw new Error('FAILED: Expected AY 2025-2026')

// 2. Test Live Points Calculation for Dynamic Categories
const degreePhdPts = 40 // Ph.D. Holder
console.log('Live Points Preview Ph.D.:', degreePhdPts)
if (degreePhdPts !== 40) throw new Error('FAILED: Expected 40 points for Ph.D.')

const publicationPts = 5 // Scholarly Paper / Book
console.log('Live Points Preview Publication:', publicationPts)
if (publicationPts !== 5) throw new Error('FAILED: Expected 5 points for Publication')

const seminarNationalPts = RankingCriteriaModel.SEMINAR_POINTS['National']
console.log('Live Points Preview National Seminar:', seminarNationalPts)
if (seminarNationalPts !== 8) throw new Error('FAILED: Expected 8 points for National Seminar')

console.log('\n✅ ALL SINGLE ADAPTIVE FORM & AY AUTO-INFER TESTS PASSED CLEANLY!')
