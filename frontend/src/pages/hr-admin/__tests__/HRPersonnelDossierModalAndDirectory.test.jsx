import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Package W — HR Personnel Profile Dossier Drawer', () => {
  const filePath = path.resolve(__dirname, '../personnel-directory/FacultyDossierDrawer.jsx')
  const content = fs.readFileSync(filePath, 'utf8')

  it('renders as an accessible right-side drawer with a fixed backdrop', () => {
    expect(content).toContain('role="dialog"')
    expect(content).toContain('aria-modal="true"')
    expect(content).toContain('fixed inset-0 z-50 flex justify-end')
    expect(content).toContain('h-full w-full max-w-2xl')
    expect(content).toContain('slide-in-from-right')
    expect(content).toContain('overflow-y-auto')
  })

  it('implements Escape key listener for keyboard accessibility', () => {
    expect(content).toContain("e.key === 'Escape'")
    expect(content).toContain('onClose?.()')
  })

  it('supports initials placeholder fallback and does not hardcode unsplash mock photos', () => {
    expect(content).not.toContain('images.unsplash.com')
    expect(content).toContain('initials')
  })

  it('preserves all HR master data sections and edit master data action', () => {
    expect(content).toContain('HR Master Data &amp; Status')
    expect(content).toContain('Classification &amp; Assignment')
    expect(content).toContain('Tenure &amp; Verified Proofs')
    expect(content).toContain('Account &amp; Security Administration')
    expect(content).toContain('Edit Master Data')
    expect(content).toContain('Account Access')
    expect(content).toContain('Login readiness')
  })
})

describe('Package X — Personnel Directory Table & Impeccable Quality', () => {
  const tableFilePath = path.resolve(__dirname, '../personnel-directory/PersonnelDirectoryTable.jsx')
  const tableContent = fs.readFileSync(tableFilePath, 'utf8')

  const actionsMenuPath = path.resolve(__dirname, '../personnel-directory/PersonnelActionsMenu.jsx')
  const menuContent = fs.readFileSync(actionsMenuPath, 'utf8')

  it('provides compact filter controls and multi-attribute search', () => {
    expect(tableContent).toContain('matchesPersonnelSearch')
    expect(tableContent).toContain('groupFilter')
    expect(tableContent).toContain('engagementFilter')
    expect(tableContent).toContain('collegeFilter')
    expect(tableContent).toContain('roleFilter')
    expect(tableContent).toContain('All Employment Types')
    expect(tableContent).toContain('Status &amp; Responsibilities')
    expect(tableContent).toContain('Job Title')
    expect(tableContent).toContain('Academic Rank')
    expect(tableContent).not.toContain('Engagement &amp; Status (Plan D2)')
  })

  it('keeps role badges unified and collapses role overflow', () => {
    expect(tableContent).toContain('.slice(0, 1)')
    expect(tableContent).toContain('responsibility</span>')
  })

  it('renders backend-provided login readiness independently from profile status', () => {
    expect(tableContent).toContain('p.login_readiness')
    expect(tableContent).toContain('Login Ready')
    expect(tableContent).toContain('Login Not Ready')
    expect(tableContent).toContain('Readiness Unknown')
  })

  it('shows empty state without fake seed rows', () => {
    expect(tableContent).toContain('No personnel records found')
    expect(tableContent).toContain('Clear filters')
    expect(tableContent).not.toContain('fake')
  })

  it('action menu uses specific personnel and assignment actions', () => {
    expect(menuContent).toContain('View Personnel')
    expect(menuContent).toContain('Edit Personnel Information')
    expect(menuContent).toContain('View Assignments')
    expect(menuContent).not.toContain('Manage Roles')
    expect(menuContent).toContain('Record Rank Change')
    expect(menuContent).toContain('Reset Password')
  })
})
