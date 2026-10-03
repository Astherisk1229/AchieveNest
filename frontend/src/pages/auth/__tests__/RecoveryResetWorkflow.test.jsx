import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import OneTimeCredentialModal from '../../../components/credentials/OneTimeCredentialModal'
import CredentialSlipPrintView from '../../../components/credentials/CredentialSlipPrintView'

describe('Plan 07 Phase 7 — Account Recovery & Reset Delivery Test Suite', () => {
  const resetCredential = {
    action: 'administrative_reset',
    ownerType: 'student',
    fullName: 'Maria Santos',
    institutionalId: 'STU-98765',
    institutionalEmail: 'maria.santos@ndmu.edu.ph',
    temporaryPassword: 'R#9kL!mQ2vW8*xYz',
    mustChangePassword: true,
    accountLifecycleStatus: 'pending_first_login',
    requiredNextAction: 'change_password'
  }

  describe('1. OneTimeCredentialModal in Reset Mode', () => {
    it('P7-UI-001: Renders reset-specific title, badge, and security warning', () => {
      const html = renderToString(
        <OneTimeCredentialModal
          isOpen={true}
          credential={resetCredential}
          onRequestClose={() => {}}
        />
      )

      expect(html).toContain('Temporary Password Reset Successfully')
      expect(html).toContain('Password Change Required')
      expect(html).toContain('The previous password is no longer valid')
      expect(html).toContain('maria.santos@ndmu.edu.ph')
      expect(html).toContain('STU-98765')
    })
  })

  describe('2. CredentialSlipPrintView in Reset Mode', () => {
    it('P7-UI-002: Renders printable reset slip with recovery instructions', () => {
      const html = renderToString(
        <CredentialSlipPrintView
          credential={resetCredential}
          printedAtLabel="September 2, 2026, 03:00 AM"
        />
      )

      expect(html).toContain('Temporary Reset Credential Slip')
      expect(html).toContain('Password Change Required')
      expect(html).toContain('One-Time Temporary Reset Password:')
      expect(html).toContain('Account Recovery Sign-In Instructions:')
      expect(html).toContain('Your previous password is no longer valid')
      expect(html).toContain('R#9kL!mQ2vW8*xYz')
    })
  })
})
