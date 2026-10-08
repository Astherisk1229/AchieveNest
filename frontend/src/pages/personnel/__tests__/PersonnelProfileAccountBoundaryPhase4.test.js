import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '../../../../..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

describe('Phase 4: Profile and Account responsibilities', () => {
  it('makes the personnel profile editor reachable from Profile', () => {
    const profile = read('frontend/src/pages/personnel/PersonnelDashboardPage.jsx')
    expect(profile).toContain('onClick={() => setIsEditInfoOpen(true)}')
    expect(profile).toContain('<EditBasicInfoModal')
    expect(profile).toContain('My Accomplishments')
    expect(profile).not.toContain('Manage accomplishments')
  })

  it('keeps personnel account limited to security while preserving other account profile tools', () => {
    const account = read('frontend/src/pages/common/AccountPage.jsx')
    expect(account).toContain("const isPersonnelAccount = user.account_type === 'personnel'")
    expect(account).toContain('{!isPersonnelAccount && <>')
    expect(account).toContain('Account Security & Credentials')
    expect(account).toContain('Self-Service Credential Reset')
  })
})
