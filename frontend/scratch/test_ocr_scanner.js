/**
 * test_ocr_scanner.js
 * Verification test suite for OcrScanController and OcrScanModel.
 */

import OcrScanController from '../src/controllers/OcrScanController.js'
import OcrScanModel from '../src/models/OcrScanModel.js'

async function runTests() {
  console.log('=== STARTING OCR SCANNER INTEGRATION TESTS ===\n')

  let passed = 0
  let total = 0

  function assert(condition, testName) {
    total++
    if (condition) {
      console.log(`[PASS] ${testName}`)
      passed++
    } else {
      console.error(`[FAIL] ${testName}`)
    }
  }

  // TEST 1: Category Classification - Attendance to Seminars (A.3)
  const textSeminar = `CERTIFICATE OF PARTICIPATION\nTHIS IS TO CERTIFY THAT Dr. Maria Santos HAS PARTICIPATED IN THE National AI & Cloud Computing Faculty Development Workshop\nORGANIZED BY CHED REGION XII\nHELD ON AUGUST 14, 2025 AT KORONADAL CITY\nCONTINUING PROFESSIONAL DEVELOPMENT WORKSHOP`
  const res1 = OcrScanController.classifyCategory(textSeminar)
  assert(res1.category === 'A.3 Attendance to Seminars/Trainings', 'Classify Seminar Certificate as Area A.3')
  assert(res1.confidence >= 80, `High confidence for Seminar Certificate (${res1.confidence}%)`)

  // TEST 2: Category Classification - Degree (A.1)
  const textDegree = `NOTRE DAME OF MARBEL UNIVERSITY GRADUATE SCHOOL\nTHIS DIPLOMA CERTIFIES THAT Dr. Maria Santos HAS CONFERRED UPON THE DEGREE OF Doctor of Philosophy in Computer Science\nCompleted 36 Units on June 15, 2025`
  const res2 = OcrScanController.classifyCategory(textDegree)
  assert(res2.category === 'A.1 Degree/s', 'Classify PhD Diploma as Area A.1')
  assert(res2.confidence >= 80, `High confidence for PhD Diploma (${res2.confidence}%)`)

  // TEST 3: Category Classification - Keynote Speaker (B.1)
  const textSpeaker = `CERTIFICATE OF APPRECIATION\nPROUDLY PRESENTED TO Dr. Maria Santos FOR SERVING AS KEYNOTE SPEAKER IN THE National Tech Conference`
  const res3 = OcrScanController.classifyCategory(textSpeaker)
  assert(res3.category === 'B.1 Guest Lecturer / Consultant / Judge', 'Classify Keynote Speaker as Area B.1')

  // TEST 4: Category Classification - Publication (B.2)
  const textPub = `IEEE ACCESS JOURNAL OF COMPUTER SCIENCE\nPEER-REVIEWED PUBLICATION\nTitle: Predictive Student Performance Modeling Using Deep Learning\nISSN: 2169-3536 Volume 12, Issue 4`
  const res4 = OcrScanController.classifyCategory(textPub)
  assert(res4.category === 'B.2 Publication', 'Classify IEEE Journal Article as Area B.2')

  // TEST 5: Structured Entity Extraction
  const linesPub = textPub.split('\n')
  const fields = OcrScanController.extractFieldsFromText(textPub, linesPub, 'B.2 Publication')
  assert(fields.issuer.includes('IEEE'), `Extract IEEE Issuer: ${fields.issuer}`)
  assert(fields.title.length > 5, `Extract Title: ${fields.title}`)
  assert(fields.scopeLevel === 'National' || fields.scopeLevel === 'International', `Extract Scope Level: ${fields.scopeLevel}`)

  // TEST 6: Simulated File Scan
  const mockFile = {
    name: 'PhD_Degree_Certificate.pdf',
    size: 2 * 1024 * 1024,
    type: 'application/pdf'
  }
  
  // Test Security Validation Guard with Mock Binary Bytes
  console.log('\nTesting File Processing...')
  const scanResult = await OcrScanController.processDocumentScan(mockFile)
  assert(scanResult.success === true, 'Successfully process mock document scan')
  assert(scanResult.result.detectedCategory === 'A.1 Degree/s', 'Process scan auto-detected category A.1')

  console.log(`\n=== SUMMARY: ${passed}/${total} TESTS PASSED ===`)
  if (passed === total) {
    console.log('ALL OCR SCANNER LOGIC VERIFIED SUCCESSFULLY!')
  } else {
    process.exit(1)
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err)
  process.exit(1)
})
