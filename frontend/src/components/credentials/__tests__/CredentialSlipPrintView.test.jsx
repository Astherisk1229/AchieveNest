import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import CredentialSlipPrintView from '../CredentialSlipPrintView'

describe('Plan 07 Phase 5 — Printable Credential Slip & Print View Test Suite', () => {
  const mockStudentCredential = {
    profileId: 'usr-student-001',
    ownerType: 'student',
    fullName: 'Juan Dela Cruz',
    institutionalId: 'STD-2026-0001',
    institutionalEmail: 'juan.delacruz@ndmu.edu.ph',
    temporaryPassword: 'Ndmu#X9y8Z7w6V5u4!',
    accountLifecycleStatus: 'pending_first_login',
    mustChangePassword: true,
    requiredNextAction: 'change_password'
  }

  const mockPersonnelCredential = {
    profileId: 'usr-pers-002',
    ownerType: 'personnel',
    fullName: 'Maria Santos',
    institutionalId: 'EMP-2026-0002',
    institutionalEmail: 'maria.santos@ndmu.edu.ph',
    temporaryPassword: 'Ndmu#A1b2C3d4E5f6@',
    accountLifecycleStatus: 'pending_first_login',
    mustChangePassword: true,
    requiredNextAction: 'change_password'
  }

  describe('1. Printable Slip Content & Identification', () => {
    it('P5-COMP-001: Renders Student slip with exact headers, labels, and instructions', () => {
      const html = renderToString(
        <CredentialSlipPrintView
          credential={mockStudentCredential}
          printedAtLabel="9/2/2026, 2:30:00 AM"
        />
      )

      expect(html).toContain('Notre Dame of Marbel University')
      expect(html).toContain('Confidential Account Credential Slip')
      expect(html).toContain('Account Owner')
      expect(html).toContain('Juan Dela Cruz')
      expect(html).toContain('Student')
      expect(html).toContain('Student ID')
      expect(html).toContain('STD-2026-0001')
      expect(html).toContain('Pending First Login')
      expect(html).toContain('juan.delacruz@ndmu.edu.ph')
      expect(html).toContain('Ndmu#X9y8Z7w6V5u4!')
      expect(html).toContain('First-Time Sign-In Instructions')
      expect(html).toContain('Printed on: 9/2/2026, 2:30:00 AM')
    })

    it('P5-COMP-002: Renders Personnel slip with exact Personnel ID and labels', () => {
      const html = renderToString(
        <CredentialSlipPrintView
          credential={mockPersonnelCredential}
          printedAtLabel="9/2/2026, 2:30:00 AM"
        />
      )

      expect(html).toContain('Maria Santos')
      expect(html).toContain('Personnel')
      expect(html).toContain('Personnel ID')
      expect(html).toContain('EMP-2026-0002')
      expect(html).toContain('maria.santos@ndmu.edu.ph')
      expect(html).toContain('Ndmu#A1b2C3d4E5f6@')
    })

    it('P5-COMP-004: Preserves all approved special characters in temporary password', () => {
      const specialPasswordCredential = {
        ...mockStudentCredential,
        temporaryPassword: 'Xy9!@#$%*?-_2345'
      }

      const html = renderToString(
        <CredentialSlipPrintView
          credential={specialPasswordCredential}
          printedAtLabel="9/2/2026, 2:30:00 AM"
        />
      )

      expect(html).toContain('Xy9!@#$%*?-_2345')
    })

    it('P5-COMP-008: Escapes special characters in names and IDs safely', () => {
      const xssCredential = {
        ...mockStudentCredential,
        fullName: '<script>alert(1)</script>',
        institutionalId: 'STD"&<>'
      }

      const html = renderToString(
        <CredentialSlipPrintView
          credential={xssCredential}
          printedAtLabel="9/2/2026, 2:30:00 AM"
        />
      )

      expect(html).not.toContain('<script>')
      expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    })

    it('returns empty string when credential is null', () => {
      const html = renderToString(
        <CredentialSlipPrintView
          credential={null}
          printedAtLabel="9/2/2026, 2:30:00 AM"
        />
      )

      expect(html).toBe('')
    })
  })
})
