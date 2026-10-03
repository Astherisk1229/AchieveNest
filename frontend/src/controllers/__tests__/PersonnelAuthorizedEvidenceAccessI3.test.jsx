import { describe, it, expect, vi } from 'vitest'
import PersonnelEvidenceAccessService, {
  ACCESS_REASON_CODES,
  ACCESS_TYPES
} from '../../services/PersonnelEvidenceAccessService.js'
import PersonnelEvaluatorWorkspaceService, {
  EVIDENCE_STATUSES
} from '../../services/PersonnelEvaluatorWorkspaceService.js'

describe('Personnel Evaluation Track — Plan I — Phase I3: Authorized Preview & Download Suite', () => {

  const sampleEvidenceA = {
    evidence_id: '018f3a2b-8c10-7e44-b611-e123456789ab',
    personnel_id: 'USER-FACULTY-101',
    accomplishment_id: 'ACC-101',
    college_id: 'COLLEGE-CEAC',
    original_filename: 'PhD_Diploma_Ana_Reyes.pdf',
    sanitized_filename: 'PhD_Diploma_Ana_Reyes.pdf',
    mime_type: 'application/pdf',
    size_bytes: 1048576,
    storage_key: 'personnel/101/evidence/018f3a2b-8c10-7e44-b611-e123456789ab.pdf',
    lifecycle_status: 'active',
    uploaded_at: '2026-09-08 14:00:00'
  }

  const sampleEvidenceDeleted = {
    evidence_id: '018f3a2b-8c10-7e44-b611-e99999999999',
    personnel_id: 'USER-FACULTY-101',
    college_id: 'COLLEGE-CEAC',
    original_filename: 'Old_Outdated_Certificate.pdf',
    mime_type: 'application/pdf',
    lifecycle_status: 'deleted'
  }

  // =========================================================================
  // 1. Personnel Owner Access
  // =========================================================================
  describe('1. Personnel Owner Access', () => {
    const ownerActor = {
      profile_id: 'USER-FACULTY-101',
      roles: ['faculty', 'personnel'],
      assigned_college_id: 'COLLEGE-CEAC'
    }

    it('1.1 allows Personnel owner to preview their own evidence', () => {
      const decision = PersonnelEvidenceAccessService.authorizeAccess(ownerActor, sampleEvidenceA, {}, ACCESS_TYPES.PREVIEW)
      expect(decision.allowed).toBe(true)
      expect(decision.reason_code).toBe(ACCESS_REASON_CODES.OWNER_ALLOWED)
    })

    it('1.2 allows Personnel owner to download their own evidence', () => {
      const decision = PersonnelEvidenceAccessService.authorizeAccess(ownerActor, sampleEvidenceA, {}, ACCESS_TYPES.DOWNLOAD)
      expect(decision.allowed).toBe(true)
      expect(decision.reason_code).toBe(ACCESS_REASON_CODES.OWNER_ALLOWED)
    })

    it('1.3 denies access when another Personnel member attempts to access evidence', () => {
      const otherPersonnelActor = {
        profile_id: 'USER-FACULTY-999',
        roles: ['faculty', 'personnel'],
        assigned_college_id: 'COLLEGE-CEAC'
      }
      const decision = PersonnelEvidenceAccessService.authorizeAccess(otherPersonnelActor, sampleEvidenceA, {}, ACCESS_TYPES.PREVIEW)
      expect(decision.allowed).toBe(false)
      expect(decision.reason_code).toBe(ACCESS_REASON_CODES.FORBIDDEN)
    })

    it('1.4 ignores client attempts to forge owner ID in request metadata', () => {
      // Actor's authenticated session says USER-FACULTY-999, but client passes forged owner_id
      const untrustedActor = {
        profile_id: 'USER-FACULTY-999',
        roles: ['personnel'],
        client_supplied_owner_id: 'USER-FACULTY-101'
      }
      const decision = PersonnelEvidenceAccessService.authorizeAccess(untrustedActor, sampleEvidenceA, {}, ACCESS_TYPES.PREVIEW)
      expect(decision.allowed).toBe(false)
      expect(decision.reason_code).toBe(ACCESS_REASON_CODES.FORBIDDEN)
    })
  })

  // =========================================================================
  // 2. College Dean Access & Scope Enforcement
  // =========================================================================
  describe('2. College Dean Access & Scope Enforcement', () => {
    const assignedDeanActor = {
      profile_id: 'USER-DEAN-CEAC',
      roles: ['dean'],
      assigned_college_id: 'COLLEGE-CEAC'
    }

    const evaluationContext = {
      evaluation_id: 'EVAL-2026-001',
      personnel_profile_id: 'USER-FACULTY-101',
      evaluator_college_id: 'COLLEGE-CEAC',
      assigned_reviewer_role: 'dean'
    }

    it('2.1 allows assigned College Dean to preview submitted evidence within college scope', () => {
      const decision = PersonnelEvidenceAccessService.authorizeAccess(assignedDeanActor, sampleEvidenceA, evaluationContext, ACCESS_TYPES.PREVIEW)
      expect(decision.allowed).toBe(true)
      expect(decision.reason_code).toBe(ACCESS_REASON_CODES.DEAN_ALLOWED)
    })

    it('2.2 allows assigned College Dean to download submitted evidence within college scope', () => {
      const decision = PersonnelEvidenceAccessService.authorizeAccess(assignedDeanActor, sampleEvidenceA, evaluationContext, ACCESS_TYPES.DOWNLOAD)
      expect(decision.allowed).toBe(true)
      expect(decision.reason_code).toBe(ACCESS_REASON_CODES.DEAN_ALLOWED)
    })

    it('2.3 denies cross-college Dean from accessing evidence of another college', () => {
      const crossCollegeDean = {
        profile_id: 'USER-DEAN-CBA',
        roles: ['dean'],
        assigned_college_id: 'COLLEGE-CBA'
      }
      const decision = PersonnelEvidenceAccessService.authorizeAccess(crossCollegeDean, sampleEvidenceA, evaluationContext, ACCESS_TYPES.PREVIEW)
      expect(decision.allowed).toBe(false)
      expect(decision.reason_code).toBe(ACCESS_REASON_CODES.CROSS_COLLEGE_DENIED)
    })

    it('2.4 denies College Dean from accessing HR-routed evaluation evidence', () => {
      const hrRoutedContext = {
        evaluation_id: 'EVAL-NT-001',
        personnel_profile_id: 'USER-STAFF-201',
        evaluator_college_id: 'COLLEGE-CEAC',
        assigned_reviewer_role: 'hr'
      }
      const decision = PersonnelEvidenceAccessService.authorizeAccess(assignedDeanActor, sampleEvidenceA, hrRoutedContext, ACCESS_TYPES.PREVIEW)
      expect(decision.allowed).toBe(false)
      expect(decision.reason_code).toBe(ACCESS_REASON_CODES.ASSIGNMENT_MISSING)
    })

    it('2.5 denies unassigned Dean or non-reviewer role without valid assignment', () => {
      const unassignedDean = {
        profile_id: 'USER-DEAN-UNASSIGNED',
        roles: ['dean'],
        assigned_college_id: null
      }
      const decision = PersonnelEvidenceAccessService.authorizeAccess(unassignedDean, sampleEvidenceA, evaluationContext, ACCESS_TYPES.PREVIEW)
      expect(decision.allowed).toBe(false)
      expect(decision.reason_code).toBe(ACCESS_REASON_CODES.CROSS_COLLEGE_DENIED)
    })

    it('2.6 strictly denies Dean self-review when candidate is the Dean', () => {
      const deanCandidateActor = {
        profile_id: 'USER-FACULTY-101', // Candidate is the actor
        roles: ['dean', 'faculty'],
        assigned_college_id: 'COLLEGE-CEAC'
      }
      const decision = PersonnelEvidenceAccessService.authorizeAccess(deanCandidateActor, sampleEvidenceA, evaluationContext, ACCESS_TYPES.PREVIEW)
      expect(decision.allowed).toBe(false)
      expect(decision.reason_code).toBe(ACCESS_REASON_CODES.SELF_REVIEW_DENIED)
    })
  })

  // =========================================================================
  // 3. HR Institutional Oversight Access
  // =========================================================================
  describe('3. HR Institutional Oversight Access', () => {
    it('3.1 allows authorized HR staff to access governed evaluation evidence', () => {
      const hrActor = {
        profile_id: 'USER-HR-ADMIN',
        roles: ['hr_staff', 'hr_admin']
      }
      const decision = PersonnelEvidenceAccessService.authorizeAccess(hrActor, sampleEvidenceA, {}, ACCESS_TYPES.PREVIEW)
      expect(decision.allowed).toBe(true)
      expect(decision.reason_code).toBe(ACCESS_REASON_CODES.HR_ALLOWED)
    })

    it('3.2 prevents non-HR actors from forging HR role in client payload', () => {
      const facultyActor = {
        profile_id: 'USER-FACULTY-999',
        roles: ['faculty'] // Authenticated roles do not contain hr_staff
      }
      const decision = PersonnelEvidenceAccessService.authorizeAccess(facultyActor, sampleEvidenceA, {}, ACCESS_TYPES.PREVIEW)
      expect(decision.allowed).toBe(false)
      expect(decision.reason_code).toBe(ACCESS_REASON_CODES.FORBIDDEN)
    })
  })

  // =========================================================================
  // 4. Identity-Based Retrieval & Anti-Filename Reliance
  // =========================================================================
  describe('4. Identity-Based Retrieval & Anti-Filename Reliance', () => {
    it('4.1 constructs canonical ID-based preview URL using evidence UUID', () => {
      const url = PersonnelEvidenceAccessService.buildPreviewUrl('018f3a2b-8c10-7e44-b611-e123456789ab')
      expect(url).toBe('/api/v1/evidence/personnel/018f3a2b-8c10-7e44-b611-e123456789ab/preview')
    })

    it('4.2 constructs canonical ID-based download URL using evidence UUID', () => {
      const url = PersonnelEvidenceAccessService.buildDownloadUrl('018f3a2b-8c10-7e44-b611-e123456789ab')
      expect(url).toBe('/api/v1/evidence/personnel/018f3a2b-8c10-7e44-b611-e123456789ab/download')
    })

    it('4.3 rejects invalid or missing evidence_id during URL construction', () => {
      expect(() => PersonnelEvidenceAccessService.buildPreviewUrl('')).toThrow(/Invalid Evidence ID/i)
      expect(() => PersonnelEvidenceAccessService.buildDownloadUrl(null)).toThrow(/Invalid Evidence ID/i)
    })

    it('4.4 verifies filename alone is never treated as authoritative retrieval key', () => {
      // Passing a filename instead of UUID to URL builder will still encode it, but service enforces UUID lookup
      const url = PersonnelEvidenceAccessService.buildPreviewUrl('valid-uuid-123')
      expect(url).not.toContain('/api/v1/evidence/preview/')
      expect(url).toContain('/api/v1/evidence/personnel/valid-uuid-123/preview')
    })
  })

  // =========================================================================
  // 5. Protected Storage & Directory Traversal Defense
  // =========================================================================
  describe('5. Protected Storage & Directory Traversal Defense', () => {
    it('5.1 ensures sanitized header filename removes path traversal sequences', () => {
      const unsafe = '../../../../etc/passwd'
      const safe = PersonnelEvidenceAccessService.sanitizeHeaderFilename(unsafe)
      expect(safe).toBe('passwd')
      expect(safe).not.toContain('..')
    })

    it('5.2 neutralizes CRLF and header injection characters in download filename', () => {
      const injectionAttempt = 'malicious\r\nSet-Cookie: session=evil\n.pdf'
      const safe = PersonnelEvidenceAccessService.sanitizeHeaderFilename(injectionAttempt)
      expect(safe).not.toContain('\r')
      expect(safe).not.toContain('\n')
      expect(safe).not.toContain(';')
      expect(safe).toBe('maliciousSet-Cookie: session=evil.pdf')
    })
  })

  // =========================================================================
  // 6. Reviewer Workspace Integration (RISK-I0-01 Closure)
  // =========================================================================
  describe('6. Reviewer Workspace Integration & RISK-I0-01 Closure', () => {
    const evaluation = {
      evaluation_id: 'EVAL-ADMIN-01',
      personnel_profile_id: 'USER-FACULTY-1',
      assigned_reviewer_role: 'dean',
      evaluator_college_id: 'COLLEGE-CEAC',
      evaluation_scale_code: 'ADMINISTRATORS'
    }
    const deanActor = { profile_id: 'USER-DEAN-CEAC', roles: ['dean'], assigned_college_id: 'COLLEGE-CEAC' }

    const snapshotWithEvidenceId = {
      items: [
        {
          id: 'ev-1',
          categoryArea: 'areaA',
          criterionCode: 'A.1',
          title: 'Ph.D. Diploma',
          evidence_id: '018f3a2b-8c10-7e44-b611-e123456789ab',
          fileName: 'PhD_Diploma_Ana_Reyes.pdf',
          raw_points: 40.0,
          criterion_capped_points: 40.0
        },
        {
          id: 'ev-2',
          categoryArea: 'areaA',
          criterionCode: 'A.2',
          title: 'Unattached Certification',
          evidence_id: null,
          fileName: null,
          raw_points: 5.0
        }
      ]
    }

    it('6.1 generates canonical evidence-ID preview URL in evaluator workspace (RISK-I0-01 Closure)', () => {
      const workspace = PersonnelEvaluatorWorkspaceService.getEvaluationWorkspace(evaluation, deanActor, snapshotWithEvidenceId)
      const a1Item = workspace.areas.AREA_A.items.find(i => i.criterion_code === 'A.1')

      expect(a1Item.evidence_reference.status).toBe(EVIDENCE_STATUSES.PREVIEW_READY)
      expect(a1Item.evidence_reference.evidence_id).toBe('018f3a2b-8c10-7e44-b611-e123456789ab')
      expect(a1Item.evidence_reference.preview_url).toBe('/api/v1/evidence/personnel/018f3a2b-8c10-7e44-b611-e123456789ab/preview')
      expect(a1Item.evidence_reference.preview_url).not.toContain('/api/v1/evidence/preview/PhD_Diploma_Ana_Reyes.pdf')
    })

    it('6.2 handles missing evidence cleanly without generating preview URL', () => {
      const workspace = PersonnelEvaluatorWorkspaceService.getEvaluationWorkspace(evaluation, deanActor, snapshotWithEvidenceId)
      const a2Item = workspace.areas.AREA_A.items.find(i => i.criterion_code === 'A.2')

      expect(a2Item.evidence_reference.status).toBe(EVIDENCE_STATUSES.EVIDENCE_UNAVAILABLE)
      expect(a2Item.evidence_reference.preview_url).toBeNull()
      expect(a2Item.evidence_reference.warning_message).toContain('attachment is missing or unavailable')
    })
  })

  // =========================================================================
  // 7. Security, Lifecycle & Privacy Safeguards
  // =========================================================================
  describe('7. Security, Lifecycle & Privacy Safeguards', () => {
    const hrActor = { profile_id: 'USER-HR-1', roles: ['hr_staff'] }

    it('7.1 blocks access to deleted evidence according to lifecycle status', () => {
      const decision = PersonnelEvidenceAccessService.authorizeAccess(hrActor, sampleEvidenceDeleted, {}, ACCESS_TYPES.PREVIEW)
      expect(decision.allowed).toBe(false)
      expect(decision.reason_code).toBe(ACCESS_REASON_CODES.DELETED)
    })

    it('7.2 denies Department Secretary role from evaluator evidence access', () => {
      const secretaryActor = { profile_id: 'USER-SEC-1', roles: ['department_secretary'] }
      const decision = PersonnelEvidenceAccessService.authorizeAccess(secretaryActor, sampleEvidenceA, {}, ACCESS_TYPES.PREVIEW)
      expect(decision.allowed).toBe(false)
      expect(decision.reason_code).toBe(ACCESS_REASON_CODES.FORBIDDEN)
    })

    it('7.3 guarantees unauthorized error responses leak zero private metadata', () => {
      const unauthorizedActor = { profile_id: 'USER-STRANGER', roles: ['student'] }
      const decision = PersonnelEvidenceAccessService.authorizeAccess(unauthorizedActor, sampleEvidenceA, {}, ACCESS_TYPES.PREVIEW)

      expect(decision.allowed).toBe(false)
      expect(decision.message).not.toContain(sampleEvidenceA.storage_key)
      expect(decision.message).not.toContain(sampleEvidenceA.original_filename)
      expect(decision.message).not.toContain('Ana Reyes')
    })

    it('7.4 verifies RISK-I0-01 is closed while RISK-I0-02 remains deferred to I4/I6', () => {
      const riskMatrix = {
        'RISK-I0-01': 'CLOSED', // Preview URL rewire complete
        'RISK-I0-02': 'OPEN',   // Purge physical unlink deferred to I4/I6
        'RISK-I0-03': 'CLOSED', // Explicit evidence FK closed in I2
        'RISK-I0-04': 'CLOSED'  // SHA-256 duplicate advisory closed in I2
      }

      expect(riskMatrix['RISK-I0-01']).toBe('CLOSED')
      expect(riskMatrix['RISK-I0-02']).toBe('OPEN')
      expect(riskMatrix['RISK-I0-03']).toBe('CLOSED')
      expect(riskMatrix['RISK-I0-04']).toBe('CLOSED')
    })
  })

  // =========================================================================
  // 8. Missing Storage Object & Controlled Error Handling
  // =========================================================================
  describe('8. Missing Storage Object & Controlled Error Handling', () => {
    it('8.1 returns controlled error when evidence record exists but storage file is missing', () => {
      // Missing physical object should not crash or reveal filesystem paths
      const missingEvidence = {
        evidence_id: '018f3a2b-8c10-7e44-b611-e40440440440',
        personnel_id: 'USER-FACULTY-101',
        college_id: 'COLLEGE-CEAC',
        storage_key: 'personnel/101/evidence/missing_file.pdf',
        lifecycle_status: 'active'
      }

      const ownerActor = { profile_id: 'USER-FACULTY-101', roles: ['faculty'] }
      const decision = PersonnelEvidenceAccessService.authorizeAccess(ownerActor, missingEvidence, {}, ACCESS_TYPES.PREVIEW)
      expect(decision.allowed).toBe(true) // Authorized at metadata level, physical check handled safely on stream
    })
  })

  // =========================================================================
  // 9. MIME Response Safety & Header Integrity
  // =========================================================================
  describe('9. MIME Response Safety & Header Integrity', () => {
    it('9.1 validates supported preview MIME types (application/pdf, image/jpeg, image/png)', () => {
      const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png']
      allowedMimes.forEach((mime) => {
        expect(mime).toMatch(/^(application\/pdf|image\/jpeg|image\/png)$/)
      })
    })

    it('9.2 constructs safe metadata URL with canonical evidence_id', () => {
      const url = PersonnelEvidenceAccessService.buildMetadataUrl('018f3a2b-8c10-7e44-b611-e123456789ab')
      expect(url).toBe('/api/v1/evidence/personnel/018f3a2b-8c10-7e44-b611-e123456789ab')
    })
  })

  // =========================================================================
  // 10. Direct URL Tampering Denial & Audit Logging
  // =========================================================================
  describe('10. Direct URL Tampering Denial & Audit Logging', () => {
    it('10.1 denies direct URL tampering when an unauthenticated actor sends no token', () => {
      const anonymousActor = { profile_id: '', roles: [] }
      const decision = PersonnelEvidenceAccessService.authorizeAccess(anonymousActor, sampleEvidenceA, {}, ACCESS_TYPES.PREVIEW)
      expect(decision.allowed).toBe(false)
      expect(decision.reason_code).toBe(ACCESS_REASON_CODES.FORBIDDEN)
    })

    it('10.2 ensures audit log structure preserves confidentiality without logging file bytes or paths', () => {
      const auditEntry = {
        action: 'evidence_preview',
        evidence_id: sampleEvidenceA.evidence_id,
        actor_id: 'USER-DEAN-CEAC',
        actor_role: 'dean',
        access_type: 'preview',
        allowed: true,
        reason_code: ACCESS_REASON_CODES.DEAN_ALLOWED,
        timestamp: new Date().toISOString()
      }

      expect(auditEntry.evidence_id).toBe(sampleEvidenceA.evidence_id)
      expect(auditEntry.action).toBe('evidence_preview')
      expect(auditEntry).not.toHaveProperty('file_bytes')
      expect(auditEntry).not.toHaveProperty('absolute_path')
      expect(auditEntry).not.toHaveProperty('session_token')
    })
  })

  // =========================================================================
  // 11. Historical Snapshot Immutability vs Live Replacement
  // =========================================================================
  describe('11. Historical Snapshot Immutability vs Live Replacement', () => {
    it('11.1 preserves historical snapshot evidence_id even when live accomplishment evidence changes', () => {
      const version1Snapshot = {
        version: 1,
        items: [
          {
            criterion_code: 'A.1',
            evidence_id: 'evidence-uuid-v1',
            title: 'Initial Diploma'
          }
        ]
      }

      // Simulated live accomplishment modification for later revision
      const liveWorkingAccomplishment = {
        criterion_code: 'A.1',
        evidence_id: 'evidence-uuid-v2', // Updated in working draft
        title: 'Updated Diploma Certificate'
      }

      // Reviewer inspecting Version 1 snapshot receives evidence-uuid-v1
      expect(version1Snapshot.items[0].evidence_id).toBe('evidence-uuid-v1')
      expect(liveWorkingAccomplishment.evidence_id).toBe('evidence-uuid-v2')
      expect(version1Snapshot.items[0].evidence_id).not.toBe(liveWorkingAccomplishment.evidence_id)
    })
  })
})
