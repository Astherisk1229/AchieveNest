import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8')

describe('Phase W legacy rank integration',()=>{
  it('shows canonical history or an explicit legacy uninitialized state',()=>{const view=read('../RankPlacementWorkspace.jsx');expect(view).toContain('current_present_rank');expect(view).toContain('Legacy Present Rank · history not initialized');expect(view).toContain('Unknown / not initialized')})
  it('keeps legacy assignment data quarantined and redirects its route',()=>{const page=read('../../../pages/hr-admin/HRRankAssignmentLogsPage.jsx');const app=read('../../../App.jsx');expect(page).toContain('LEGACY_QUARANTINED');expect(app).toContain('path="/hr/rank-assignment-logs" element={<QueryPreservingRedirect to="/hr/ranking-cycles"')} )
  it('quarantines the client mutation engine but preserves shared vocabulary',()=>{const service=read('../../../services/PersonnelPromotionDecisionService.js');const finalLock=read('../../../services/PersonnelEvaluationFinalLockService.js');expect(service).toContain('static LEGACY_QUARANTINED = true');expect(service).toContain('export const DECISION_VOCABULARY');expect(finalLock).toContain("import { DECISION_VOCABULARY }");expect(finalLock).not.toContain('recordPromotionDecision')})
  it('keeps all role routes reachable',()=>{const app=read('../../../App.jsx');for(const route of ['/personnel/rank-placement','/dean/personnel/:personnelId/rank-placement','/department/personnel/:personnelId/rank-placement','/hr/personnel/:personnelId/rank-placement'])expect(app).toContain(route)})
})
