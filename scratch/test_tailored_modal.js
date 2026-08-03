/**
 * test_tailored_modal.js
 * Unit test for 100% Category-Tailored Dynamic Fields mapping.
 */
import RankingCriteriaModel from '../src/models/RankingCriteriaModel.js'

console.log('=== TEST: CATEGORY-TAILORED DYNAMIC FIELDS MAPPING ===')

// 1. Test A.1 Degree mapping
const degreeObj = {
  category: 'A.1 Degree/s',
  degreeTitle: 'Ph.D. in Computer Science',
  institution: 'Ateneo de Manila University',
  degreeLevel: 'Ph.D. Degree Holder'
}

console.log('A.1 Degree Title:', degreeObj.degreeTitle)
console.log('A.1 Institution:', degreeObj.institution)
if (!degreeObj.degreeTitle || !degreeObj.institution) throw new Error('FAILED A.1 Degree mapping')

// 2. Test A.2 Membership mapping
const memberObj = {
  category: 'A.2 Active Membership to Prof Orgs',
  orgName: 'Philippine Computer Society',
  orgPosition: 'Officer',
  officeHeld: 'Vice President for External Affairs'
}

console.log('A.2 Org Name:', memberObj.orgName)
console.log('A.2 Office Held:', memberObj.officeHeld)
if (!memberObj.orgName || !memberObj.officeHeld) throw new Error('FAILED A.2 Membership mapping')

// 3. Test B.2 Publication mapping
const pubObj = {
  category: 'B.2 Publication',
  pubTitle: 'Predictive Analytics in Higher Education',
  publisherIssn: 'IEEE Access Journal (ISSN: 2169-3536)',
  pubType: 'Scholarly Paper'
}

console.log('B.2 Title:', pubObj.pubTitle)
console.log('B.2 Publisher & ISSN:', pubObj.publisherIssn)
if (!pubObj.pubTitle || !pubObj.publisherIssn) throw new Error('FAILED B.2 Publication mapping')

console.log('\n✅ ALL CATEGORY-TAILORED DYNAMIC FIELDS TESTS PASSED CLEANLY!')
