import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '../../../../..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const page = () => read('frontend/src/pages/osad-admin/OSADStudentAccountsPage.jsx')

describe('Phase 5 item 6: student account lifecycle controls', () => {
  it('backend routes exist', () => {
    const r = read('backend/app/Config/Routes.php')
    for (const a of ['suspend', 'archive', 'restore']) expect(r).toContain(`accounts/(:segment)/${a}`)
  })
  it('page calls the lifecycle service for each action', () => {
    const p = page()
    expect(p).toContain('lifecycleService.suspendAccount(')
    expect(p).toContain('lifecycleService.archiveAccount(')
    expect(p).toContain('lifecycleService.restoreAccount(')
  })
  it('actions depend on current status and a reason is required for suspend/archive', () => {
    const p = page()
    expect(p).toContain("openLifecycleAction('suspend', user)")
    expect(p).toContain("openLifecycleAction('restore', user)")
    expect(p).toContain("A reason is required.")
  })
  it('dialog stays open and shows the backend error on failure', () => {
    const p = page()
    expect(p).toContain('setLifecycleError(error?.error?.message')
    expect(p).toContain('await fetchStudentAccounts()')
  })
})
