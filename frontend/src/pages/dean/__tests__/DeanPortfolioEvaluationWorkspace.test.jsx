import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.cwd(), 'src')
const workspace = fs.readFileSync(path.join(root, 'pages/dean/DeanPortfolioEvaluationWorkspace.jsx'), 'utf8')
const summary = fs.readFileSync(path.join(root, 'components/evaluation/FacultyEvaluationSummary.jsx'), 'utf8')
const service = fs.readFileSync(path.join(root, 'services/deanWorkspaceService.js'), 'utf8')
const hrPage = fs.readFileSync(path.join(root, 'pages/hr-admin/HREvaluationSubmissionsPage.jsx'), 'utf8')

describe('real Dean portfolio evaluation workspace contracts', () => {
  it('renders synchronized portfolio and locked-criteria panes in submission order', () => {
    expect(workspace).toContain('Exact submitted portfolio')
    expect(workspace).toContain('Locked criteria evaluation sheet')
    expect(workspace).toContain('items.map((item,index)')
    expect(workspace).toContain('setActiveId(item.id)')
    expect(workspace).toContain('evidenceFor(item)')
  })

  it('supports configured approve/reject decisions with no manual score field', () => {
    expect(workspace).toContain('approveDeanReviewItem')
    expect(workspace).toContain('rejectDeanReviewItem')
    expect(workspace).toContain('A rejection reason is required.')
    expect(workspace).not.toMatch(/type=["']number["']/)
    expect(service).toContain('/rate`')
    expect(service).toContain("verification_status: 'ineligible'")
  })

  it('checks persisted draft state and gates incomplete endorsement', () => {
    expect(workspace).toContain('await onReload()')
    expect(workspace).toContain('Saved and reloaded')
    expect(workspace).toContain('Evaluation is incomplete.')
    expect(workspace).toContain('disabled={!editable||remaining>0}')
  })

  it('shares one immutable printable summary between Dean and HR', () => {
    expect(workspace).toContain('FacultyEvaluationSummary')
    expect(hrPage).toContain('FacultyEvaluationSummary')
    expect(hrPage).toContain('getReport(sub.id)')
    expect(summary).toContain('data-evaluation-summary')
    expect(summary).toContain('window.print()')
    expect(summary).toContain('rejection_reason')
  })
})
