import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')

describe('OSAD organization governance integrity', () => {
  it('renders authoritative lifecycle status and disables assignment for non-active organizations', () => {
    const page = source('../OSADStudentOrganizationsPage.jsx')
    expect(page).toContain("org.status === 'archived'")
    expect(page).toContain("disabled={org.status !== 'active'}")
  })

  it('uses authoritative moderator candidates rather than the demo personnel directory', () => {
    const dashboard = source('../OSADDashboardPage.jsx')
    expect(dashboard).toContain('fetchOrganizationModeratorCandidates(organizationId)')
    expect(dashboard).toContain("personnelSelectorTarget.roleType === 'moderator' ? moderatorCandidates : []")
    expect(dashboard).not.toContain('getPersonnelList')
    expect(dashboard).not.toContain('useOSAD')
  })

  it('accepts authoritative empty organization responses without restoring demo records', () => {
    const dashboard = source('../OSADDashboardPage.jsx')
    expect(dashboard).toContain('if (Array.isArray(data)) setPersistentOrgs(data)')
    expect(dashboard).not.toContain('persistentOrgs.length > 0 ? persistentOrgs : organizations')
  })
})
