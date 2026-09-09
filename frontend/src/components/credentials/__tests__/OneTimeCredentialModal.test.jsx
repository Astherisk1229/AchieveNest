import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import OneTimeCredentialModal from '../OneTimeCredentialModal'
import CredentialDeliveryFaultModal from '../CredentialDeliveryFaultModal'
import {
  parseProvisioningCredentialResponse,
  buildCredentialCopyText,
  ProvisioningCredentialContractError
} from '../../../contracts/provisioningCredentialContract'

describe('Plan 07 Phase 4 — One-Time Credential Success Modal & Contract Test Suite', () => {
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

  describe('1. Provisioning Credential Response Contract', () => {
    it('P4-CON-001: Correctly parses valid Student 201 response into allowlisted object', () => {
      const raw = {
        data: {
          id: 'usr-student-001',
          account_type: 'student',
          full_name: 'Juan Dela Cruz',
          institutional_id: 'STD-2026-0001',
          institutional_email: 'juan.delacruz@ndmu.edu.ph',
          temporary_password: 'Ndmu#X9y8Z7w6V5u4!',
          account_lifecycle_status: 'pending_first_login',
          must_change_password: true,
          required_next_action: 'change_password',
          extra_secret_token: 'should-not-pass',
          password_hash: '$2y$10$xyz'
        }
      }

      const parsed = parseProvisioningCredentialResponse(raw, 'student')
      expect(parsed).toEqual(mockStudentCredential)
      expect(parsed).not.toHaveProperty('extra_secret_token')
      expect(parsed).not.toHaveProperty('password_hash')
    })

    it('P4-CON-002: Correctly parses valid Personnel 201 response', () => {
      const raw = {
        data: {
          id: 'usr-pers-002',
          account_type: 'personnel',
          full_name: 'Maria Santos',
          institutional_id: 'EMP-2026-0002',
          institutional_email: 'maria.santos@ndmu.edu.ph',
          temporary_password: 'Ndmu#A1b2C3d4E5f6@',
          account_lifecycle_status: 'pending_first_login',
          must_change_password: true,
          required_next_action: 'change_password'
        }
      }

      const parsed = parseProvisioningCredentialResponse(raw, 'personnel')
      expect(parsed).toEqual(mockPersonnelCredential)
    })

    it('P4-CON-003: Throws contract error when temporary_password is missing', () => {
      const raw = {
        data: {
          id: 'usr-001',
          account_type: 'student',
          full_name: 'Test',
          institutional_id: 'STD-001',
          institutional_email: 'test@ndmu.edu.ph',
          account_lifecycle_status: 'pending_first_login',
          must_change_password: true,
          required_next_action: 'change_password'
        }
      }

      expect(() => parseProvisioningCredentialResponse(raw, 'student')).toThrow(ProvisioningCredentialContractError)
    })

    it('P4-CON-005: Throws contract error on owner type mismatch', () => {
      const raw = {
        data: {
          id: 'usr-001',
          account_type: 'personnel',
          full_name: 'Test',
          institutional_id: 'STD-001',
          institutional_email: 'test@ndmu.edu.ph',
          temporary_password: 'Password123!',
          account_lifecycle_status: 'pending_first_login',
          must_change_password: true,
          required_next_action: 'change_password'
        }
      }

      expect(() => parseProvisioningCredentialResponse(raw, 'student')).toThrow(ProvisioningCredentialContractError)
    })

    it('P4-CON-006: Throws contract error if lifecycle is not pending_first_login', () => {
      const raw = {
        data: {
          id: 'usr-001',
          account_type: 'student',
          full_name: 'Test',
          institutional_id: 'STD-001',
          institutional_email: 'test@ndmu.edu.ph',
          temporary_password: 'Password123!',
          account_lifecycle_status: 'active',
          must_change_password: true,
          required_next_action: 'change_password'
        }
      }

      expect(() => parseProvisioningCredentialResponse(raw, 'student')).toThrow(ProvisioningCredentialContractError)
    })

    it('P4-CON-007: Throws contract error if must_change_password is not true', () => {
      const raw = {
        data: {
          id: 'usr-001',
          account_type: 'student',
          full_name: 'Test',
          institutional_id: 'STD-001',
          institutional_email: 'test@ndmu.edu.ph',
          temporary_password: 'Password123!',
          account_lifecycle_status: 'pending_first_login',
          must_change_password: false,
          required_next_action: 'change_password'
        }
      }

      expect(() => parseProvisioningCredentialResponse(raw, 'student')).toThrow(ProvisioningCredentialContractError)
    })

    it('P4-CLIP-001: buildCredentialCopyText formats standardized clipboard text', () => {
      const text = buildCredentialCopyText(mockStudentCredential)
      expect(text).toContain('AchieveNest Account Credentials')
      expect(text).toContain('Account Owner: Juan Dela Cruz')
      expect(text).toContain('Account Type: Student')
      expect(text).toContain('Student ID: STD-2026-0001')
      expect(text).toContain('Institutional Email: juan.delacruz@ndmu.edu.ph')
      expect(text).toContain('Temporary Password: Ndmu#X9y8Z7w6V5u4!')
      expect(text).toContain('First Login: Change this password immediately after signing in.')
    })
  })

  describe('2. OneTimeCredentialModal UI & HTML Output', () => {
    it('P4-UI-001: Renders Student labels and masked password by default', () => {
      const html = renderToString(
        <OneTimeCredentialModal
          isOpen={true}
          credential={mockStudentCredential}
          onRequestClose={() => {}}
          isConfirmDiscardOpen={false}
          onConfirmDiscard={() => {}}
          onCancelDiscard={() => {}}
          onCopy={() => {}}
        />
      )

      expect(html).toContain('Account Created Successfully')
      expect(html).toContain('Student Account')
      expect(html).toContain('Student ID')
      expect(html).toContain('STD-2026-0001')
      expect(html).toContain('juan.delacruz@ndmu.edu.ph')
      expect(html).toContain('••••••••••••••••')
      expect(html).not.toContain('Ndmu#X9y8Z7w6V5u4!')
    })

    it('P4-UI-002: Renders Personnel labels for personnel ownerType', () => {
      const html = renderToString(
        <OneTimeCredentialModal
          isOpen={true}
          credential={mockPersonnelCredential}
          onRequestClose={() => {}}
          isConfirmDiscardOpen={false}
          onConfirmDiscard={() => {}}
          onCancelDiscard={() => {}}
          onCopy={() => {}}
        />
      )

      expect(html).toContain('Personnel Account')
      expect(html).toContain('Personnel ID')
      expect(html).toContain('EMP-2026-0002')
      expect(html).toContain('maria.santos@ndmu.edu.ph')
    })

    it('P4-UI-011: Print button is hidden if onPrint is not supplied', () => {
      const html = renderToString(
        <OneTimeCredentialModal
          isOpen={true}
          credential={mockStudentCredential}
          onRequestClose={() => {}}
          isConfirmDiscardOpen={false}
          onConfirmDiscard={() => {}}
          onCancelDiscard={() => {}}
          onCopy={() => {}}
        />
      )

      expect(html).not.toContain('Print Credential Slip')
    })

    it('P4-UI-012: Print button is visible when onPrint handler is provided', () => {
      const html = renderToString(
        <OneTimeCredentialModal
          isOpen={true}
          credential={mockStudentCredential}
          onRequestClose={() => {}}
          isConfirmDiscardOpen={false}
          onConfirmDiscard={() => {}}
          onCancelDiscard={() => {}}
          onCopy={() => {}}
          onPrint={() => {}}
        />
      )

      expect(html).toContain('Print Credential Slip')
    })

    it('returns empty string when isOpen is false', () => {
      const html = renderToString(
        <OneTimeCredentialModal
          isOpen={false}
          credential={mockStudentCredential}
          onRequestClose={() => {}}
        />
      )
      expect(html).toBe('')
    })
  })

  describe('3. CredentialDeliveryFaultModal Recovery Workflow', () => {
    it('Renders recovery fault message and Refresh Account List button', () => {
      const fault = {
        ownerType: 'student',
        error: 'MISSING_TEMPORARY_PASSWORD',
        message: 'The account was created, but its temporary credential could not be safely displayed.'
      }

      const html = renderToString(
        <CredentialDeliveryFaultModal
          isOpen={true}
          fault={fault}
          onRefreshAndClose={() => {}}
        />
      )

      expect(html).toContain('Credential Presentation Fault')
      expect(html).toContain('Do not create the account again')
      expect(html).toContain('Refresh Account List')
    })

    it('returns empty string when isOpen is false', () => {
      const html = renderToString(
        <CredentialDeliveryFaultModal
          isOpen={false}
          fault={null}
          onRefreshAndClose={() => {}}
        />
      )
      expect(html).toBe('')
    })
  })
})
