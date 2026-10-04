import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const read = rel => fs.readFileSync(path.join(SRC, rel), 'utf8')

describe('Phase 5.1: rank promotion screens call the live endpoints', () => {
  const service = read('services/rankPlacementViewService.js')
  const routes = fs.readFileSync(path.resolve(SRC, '../../backend/app/Config/Routes.php'), 'utf8')

  it('service paths all exist as backend routes', () => {
    const wired = [
      ["post", "hr/final-rank-reviews/(:segment)/approved-rank"],
      ["post", "hr/approved-ranks/(:segment)/correct"],
      ["post", "hr/approved-ranks/(:segment)/cancel"],
      ["post", "hr/approved-ranks/(:segment)/recovery-path"],
      ["post", "reviewer/hr-final-rank-reviews/(:segment)/begin-reconsideration"],
      ["post", "hr/personnel/(:segment)/rank-placement/suggest"],
      ["post", "hr/rank-placement-suggestions/(:segment)/confirm"],
      ["post", "hr/rank-placements/(:segment)/retry"],
      ["post", "hr/rank-placements/(:segment)/correct"],
      ["post", "hr/rank-placements/(:segment)/cancel"]
    ]
    for (const [method, route] of wired) expect(routes).toContain(`$routes->${method}('${route}'`)
    for (const frag of ['/approved-rank`', '/correct`', '/cancel`', '/recovery-path`', '/begin-reconsideration`', '/rank-placement/suggest`', '/confirm`', '/retry`']) {
      expect(service).toContain(frag)
    }
  })

  it('record and correct send the multipart fields the backend reads', () => {
    for (const field of ['approved_rank_code', 'approval_date', 'effectivity_date', 'official_document_id', 'signed_approved_document']) {
      expect(service).toContain(`'${field}'`)
    }
    for (const field of ['correction_type', 'reason', 'reuse_original_document', 'original_document_still_supports', 'supporting_document']) {
      expect(service).toContain(`'${field}'`)
    }
    expect(service).toContain("{ path, reason }")
    expect(service).toContain("{ effective_date: effectiveDate }")
  })

  it('HR workspace exposes record, correct, cancel, recovery and placement actions', () => {
    const workspace = read('components/ranking/RankPlacementWorkspace.jsx')
    for (const key of ['correct-rank', 'cancel-rank', 'recover-correction', 'recover-cancellation', 'confirm-placement', 'correct-placement', 'cancel-placement']) {
      expect(workspace).toContain(`'${key}'`)
    }
    expect(workspace).toContain('Suggest placement')
    const phaseO = read('components/evaluation/FacultyPhaseOWorkspace.jsx')
    expect(phaseO).toContain('Record Approved Rank')
    expect(phaseO).toContain('beginReconsideration(review.id)')
    expect(phaseO).toContain("review?.status==='returned_for_reconsideration'")
  })

  it('context returns the approved rank without the stored document path', () => {
    const svc = fs.readFileSync(path.resolve(SRC, '../../backend/app/Services/HrFinalRankReviewService.php'), 'utf8')
    expect(svc).toContain("'approved_rank'=>$approvedRank")
    expect(svc).not.toMatch(/select\('[^']*signed_document_storage_path/)
  })
})
