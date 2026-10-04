import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const pageSource = readFileSync(new URL('../OSADStudentAccountsPage.jsx', import.meta.url), 'utf8')

describe('OSAD student password reset integration', () => {
  it('uses the authenticated lifecycle endpoint instead of the in-memory OSAD controller', () => {
    expect(pageSource).toContain('await lifecycleService.resetTemporaryPassword(accountId)')
    expect(pageSource).toContain('parseProvisioningCredentialResponse(response, \'student\')')
    expect(pageSource).not.toContain('resetStudentPassword(resetPasswordStudent')
  })

  it('shows success only after the server returns the one-time credential', () => {
    const serverCallIndex = pageSource.indexOf('await lifecycleService.resetTemporaryPassword(accountId)')
    const successToastIndex = pageSource.indexOf('Successfully reset credentials for student')

    expect(serverCallIndex).toBeGreaterThan(-1)
    expect(successToastIndex).toBeGreaterThan(serverCallIndex)
    expect(pageSource).toContain('checked={verifiedResetIdentity}')
  })
})
