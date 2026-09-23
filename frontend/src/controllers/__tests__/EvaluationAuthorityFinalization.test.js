import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../../..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')
const resolver = read('backend/app/Services/OrganizationalAuthorityResolver.php')
const submission = read('backend/app/Controllers/Api/PersonnelPortfolioSubmissionController.php')
const evaluation = read('backend/app/Controllers/Api/HREvaluationController.php')
const routes = read('backend/app/Config/Routes.php')
const tabs = read('frontend/src/pages/hr-admin/evaluation-submissions/queue/VerificationStatusTabs.jsx')
const header = read('frontend/src/pages/hr-admin/evaluation-submissions/queue/VerificationQueueHeader.jsx')
const row = read('frontend/src/pages/hr-admin/evaluation-submissions/queue/PortfolioSubmissionRow.jsx')

describe('evaluation authority routing and HR finalization', () => {
  it('assigns all new and versioned resubmissions through the central resolver and selected track', () => {
    expect((submission.match(/ReviewerResolverService\(\)\)->resolve\(\$personnelProfileId, \$period\)/g) || []).length).toBe(2)
    expect(submission).toContain("'originating_evaluator_profile_id' => $reviewer['evaluator_profile_id']")
    expect(submission).toContain("'returned_for_revision', 'submitted'")
  })

  it('supports Dean, Department Head, and explicit HR initial evaluator paths', () => {
    for (const type of ["result('DEAN'", "result('DEPARTMENT_HEAD'", "result('HR'"]) expect(resolver).toContain(type)
    expect(evaluation).toContain("['dean','department_head']")
    expect(evaluation).toContain('authorityMayEvaluate')
  })

  it('keeps assigned reviewer queue and evidence actions role-neutral and scope checked', () => {
    expect(routes).toContain("'reviewer/evaluations'")
    expect(routes).toContain("'reviewer/evaluations/(:segment)/return'")
    expect(routes).toContain("'reviewer/evaluations/(:segment)/ready'")
    expect(evaluation).toContain("where('pe.evaluator_profile_id', $actor['profile']['id'])")
    expect(evaluation).toContain('isValidEvaluatorActor')
  })

  it('hands Dean and Department Head endorsements to HR and restricts completion to assigned HR', () => {
    expect(evaluation).toContain("if (! $this->isHrAdmin($actor))")
    expect(evaluation).toContain('department_head_endorsement')
    expect(evaluation).toContain("if (! $this->isHrAdmin($actor) || ! $this->isEvaluatorOrHr($actor, $evaluation))")
    expect(evaluation).toContain("'ready_for_finalization' => ['completed']")
  })

  it('uses the accurate HR finalization label everywhere in the queue', () => {
    for (const source of [tabs, header, row]) {
      expect(source).toContain('Ready for HR Finalization')
      expect(source).not.toContain('Ready for Final Evaluation')
    }
  })
})
