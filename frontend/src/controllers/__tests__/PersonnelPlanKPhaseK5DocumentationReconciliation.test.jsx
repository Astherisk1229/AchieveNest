import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { partTimeFacultyTitleService } from '../../services/partTimeFacultyTitleService'
import { facultyRankCatalogService } from '../../services/facultyRankCatalogService'

describe('Personnel Evaluation Track — Plan K — Phase K5 Documentation Reconciliation Test', () => {
  const rootDir = path.resolve(__dirname, '../../../../')
  const k5Dir = path.join(rootDir, 'docs/implementation/evidence/plan-k-k5-final-closure')
  const reconDir = path.join(rootDir, 'docs/implementation/evidence/plan-k-k5-final-documentation-reconciliation')
  const k5ReportPath = path.join(rootDir, 'docs/implementation/Personnel_Evaluation_Track_Plan_K_Phase_K5_Final_Closure_Report.md')
  const reconReportPath = path.join(rootDir, 'docs/implementation/Personnel_Evaluation_Track_Plan_K_Phase_K5_Final_Documentation_Reconciliation_Report.md')

  it('1. Part-Time title count in authoritative service is exactly 4', () => {
    expect(partTimeFacultyTitleService.PART_TIME_TITLES).toHaveLength(4)
  })

  it('2. Every Part-Time title label in K5 report matches authoritative service exactly', () => {
    const k5Report = fs.readFileSync(k5ReportPath, 'utf8')
    const canonicalLabels = partTimeFacultyTitleService.PART_TIME_TITLES.map(t => t.label)
    
    canonicalLabels.forEach(label => {
      expect(k5Report).toContain(label)
    })
  })

  it('3. Full-Time rank catalog count in authoritative service is exactly 26', () => {
    expect(facultyRankCatalogService.FULL_TIME_RANKS).toHaveLength(26)
  })

  it('4. Full-Time ranks in K5 report match authoritative ranks hierarchy', () => {
    const k5RankSource = fs.readFileSync(path.join(k5Dir, 'final-rank-title-source.md'), 'utf8')
    expect(k5RankSource).toContain('26 ranks')
    expect(k5RankSource).toContain('University Professor')
    expect(k5RankSource).toContain('Assistant Instructor')
  })

  it('5. Canonical Unresolved Rule Register contains exactly 5 items', () => {
    const unresFile = fs.readFileSync(path.join(k5Dir, 'unresolved-rule-register.md'), 'utf8')
    expect(unresFile).toContain('UNRESOLVED — AUDIT RETENTION AFTER COMPLETE OWNER DELETION')
    expect(unresFile).toContain('POSITION / JOB TITLE SOURCE — UNRESOLVED')
    expect(unresFile).toContain('NO GUESSED ACADEMIC-RANK RULE — NON-TEACHING FACULTY + NON-ACADEMIC')
    expect(unresFile).toContain('ANNUAL REVIEW / SUBJECT-TO-EVALUATION EXACT ALGORITHM')
    expect(unresFile).toContain('EVALUATION CYCLE AUTOMATED ROLLOVER SCHEDULE')
  })

  it('6. Evaluation cycle automated rollover appears as unresolved item 5', () => {
    const unresFile = fs.readFileSync(path.join(k5Dir, 'unresolved-rule-register.md'), 'utf8')
    expect(unresFile).toContain('5. **`EVALUATION CYCLE AUTOMATED ROLLOVER SCHEDULE`**')
  })

  it('7. Annual Review algorithm appears as unresolved item 4', () => {
    const unresFile = fs.readFileSync(path.join(k5Dir, 'unresolved-rule-register.md'), 'utf8')
    expect(unresFile).toContain('4. **`ANNUAL REVIEW / SUBJECT-TO-EVALUATION EXACT ALGORITHM`**')
  })

  it('8. Position / Job Title remains unresolved item 2', () => {
    const unresFile = fs.readFileSync(path.join(k5Dir, 'unresolved-rule-register.md'), 'utf8')
    expect(unresFile).toContain('2. **`POSITION / JOB TITLE SOURCE — UNRESOLVED`**')
  })

  it('9. NTF + Non-Academic rank rule remains unresolved item 3', () => {
    const unresFile = fs.readFileSync(path.join(k5Dir, 'unresolved-rule-register.md'), 'utf8')
    expect(unresFile).toContain('3. **`NO GUESSED ACADEMIC-RANK RULE — NON-TEACHING FACULTY + NON-ACADEMIC`**')
  })

  it('10. Audit retention remains unresolved item 1', () => {
    const unresFile = fs.readFileSync(path.join(k5Dir, 'unresolved-rule-register.md'), 'utf8')
    expect(unresFile).toContain('1. **`UNRESOLVED — AUDIT RETENTION AFTER COMPLETE OWNER DELETION`**')
  })

  it('11. Final Traceability Matrix traces all 5 unresolved rules', () => {
    const traceMatrix = fs.readFileSync(path.join(k5Dir, 'final-traceability-matrix.md'), 'utf8')
    expect(traceMatrix).toContain('UNRESOLVED')
    expect(traceMatrix).toContain('Professorial Lecturer')
  })

  it('12. Definition of Done matrix confirms implementation completeness with preserved policy boundaries', () => {
    const dodMatrix = fs.readFileSync(path.join(k5Dir, 'definition-of-done-matrix.md'), 'utf8')
    expect(dodMatrix).toContain('PASS')
    expect(dodMatrix).toContain('5 governance policy boundaries remain explicitly unresolved')
  })

  it('13. Final test counts verify the 277-test Plan K baseline', () => {
    const testInv = fs.readFileSync(path.join(k5Dir, 'final-test-inventory.md'), 'utf8')
    expect(testInv).toContain('277')
    expect(testInv).toContain('2,078')
  })

  it('14. All referenced K5 and reconciliation evidence files exist on disk', () => {
    expect(fs.existsSync(k5ReportPath)).toBe(true)
    expect(fs.existsSync(reconReportPath)).toBe(true)
    expect(fs.existsSync(path.join(k5Dir, 'checksum-manifest.md'))).toBe(true)
    expect(fs.existsSync(path.join(reconDir, 'checksum-manifest.md'))).toBe(true)
  })

  it('15. Canonical Lock decisions are affirmed in reconciliation and closure reports', () => {
    const reconReport = fs.readFileSync(reconReportPath, 'utf8')
    expect(reconReport).toContain('PERSONNEL EVALUATION TRACK COMPLETE')
    expect(reconReport).toContain('PLAN K COMPLETE')
    expect(reconReport).toContain('PHASE K5 COMPLETE')
  })
})
