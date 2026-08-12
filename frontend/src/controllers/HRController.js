/**
 * HRController.js
 * Controller handling HR business logic, personnel filtering, rank updates,
 * role governance, accomplishment verifications, service award ranking, compliance reports, and audit logs.
 */

import { PersonnelEntity, FacultyAccomplishmentEntity, ServiceAwardCategoryEntity, HRAuditLogEntity } from '../models/HRModel'
import SecurityController from './SecurityController.js'

const STORAGE_KEY_PERSONNEL = 'achievenest_hr_personnel_v1'
const STORAGE_KEY_VERIFICATION = 'achievenest_hr_verifications_v1'
const STORAGE_KEY_AWARDS = 'achievenest_hr_awards_v1'
const STORAGE_KEY_AUDIT = 'achievenest_hr_audit_logs_v1'
const STORAGE_KEY_RESETS = 'achievenest_password_resets'

const DEFAULT_PERSONNEL = [
  {
    id: 'emp_001',
    employee_id: 'EMP-2021-0842',
    full_name: 'Dr. Maria Santos',
    email: 'faculty@ndmu.edu.ph',
    college: 'CEAC - College of Engineering, Architecture, and Computing',
    department: 'Department of Computer Studies',
    academic_rank: 'Associate Professor II',
    employment_status: 'Full-Time Permanent',
    tenure_years: 9,
    verified_accomplishments_count: 14,
    assigned_roles: ['program_coordinator', 'organization_moderator', 'department_secretary'],
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
  },
  {
    id: 'emp_002',
    employee_id: 'EMP-2015-0120',
    full_name: 'Prof. Ricardo Gomez',
    email: 'coordinator@ndmu.edu.ph',
    college: 'CEAC - College of Engineering, Architecture, and Computing',
    department: 'Department of Engineering',
    academic_rank: 'Assistant Professor IV',
    employment_status: 'Full-Time Permanent',
    tenure_years: 11,
    verified_accomplishments_count: 22,
    assigned_roles: ['program_coordinator'],
    avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'
  },
  {
    id: 'emp_003',
    employee_id: 'EMP-2019-0881',
    full_name: 'Dr. Ana Reyes',
    email: 'moderator@ndmu.edu.ph',
    college: 'CEAC - College of Engineering, Architecture, and Computing',
    department: 'Department of Computer Studies',
    academic_rank: 'Associate Professor I',
    employment_status: 'Full-Time Permanent',
    tenure_years: 7,
    verified_accomplishments_count: 18,
    assigned_roles: ['organization_moderator'],
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'
  },
  {
    id: 'emp_004',
    employee_id: 'EMP-2018-0412',
    full_name: 'Dr. Gabriel Mendoza',
    email: 'gmendoza@ndmu.edu.ph',
    college: 'CBA - College of Business Administration',
    department: 'Department of Business Management',
    academic_rank: 'Full Professor I',
    employment_status: 'Full-Time Permanent',
    tenure_years: 15,
    verified_accomplishments_count: 31,
    assigned_roles: ['department_secretary'],
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  },
  {
    id: 'emp_005',
    employee_id: 'EMP-2022-0901',
    full_name: 'Engr. Sarah Cruz',
    email: 'scruz@ndmu.edu.ph',
    college: 'CAS - College of Arts and Sciences',
    department: 'Department of Physical Sciences',
    academic_rank: 'Instructor III',
    employment_status: 'Full-Time Probationary',
    tenure_years: 4,
    verified_accomplishments_count: 8,
    assigned_roles: [],
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
  }
]

const DEFAULT_ACCOMPLISHMENTS = [
  {
    id: 'acc_101',
    title: 'AI-Driven Curriculum Assessment & Quality Assurance in CHEd Frameworks',
    faculty_id: 'EMP-2021-0842',
    faculty_name: 'Dr. Maria Santos',
    college: 'CEAC',
    department: 'Computer Studies',
    category: 'Research Publication',
    date_completed: '2026-03-15',
    publisher_or_issuer: 'IEEE Philippine Section Journal (Scopus Indexed)',
    status: 'dept_endorsed',
    secretary_endorsement_date: '2026-04-01',
    secretary_remarks: 'Verified publication documentation & peer review confirmation.',
    proof_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    id: 'acc_102',
    title: 'Regional Extension Program: Cyber Literacy for South Cotabato Public Educators',
    faculty_id: 'EMP-2015-0120',
    faculty_name: 'Prof. Ricardo Gomez',
    college: 'CEAC',
    department: 'Engineering',
    category: 'Extension Service',
    date_completed: '2026-02-28',
    publisher_or_issuer: 'Provincial Government of South Cotabato & NDMU Community Extension',
    status: 'dept_endorsed',
    secretary_endorsement_date: '2026-03-10',
    secretary_remarks: 'Verified project completion certificate & DepEd endorsement.',
    proof_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    id: 'acc_103',
    title: 'International Training on Quantum Computing & Data Architecture',
    faculty_id: 'EMP-2019-0881',
    faculty_name: 'Dr. Ana Reyes',
    college: 'CEAC',
    department: 'Computer Studies',
    category: 'Faculty Training / Seminar',
    date_completed: '2026-01-20',
    publisher_or_issuer: 'Singapore Institute of Technology',
    status: 'hr_verified',
    secretary_endorsement_date: '2026-02-01',
    secretary_remarks: 'International certificate verified.',
    hr_verification_date: '2026-02-05',
    hr_verification_seal: 'HR-SEAL-2026-0041',
    proof_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }
]

const DEFAULT_AWARDS = [
  {
    id: 'awd_001',
    title: 'Excellence in Research & Scholarly Publication',
    min_tenure_years: 3,
    min_verified_points: 20,
    target_group: 'Full-Time Faculty',
    badge_color: 'emerald'
  },
  {
    id: 'awd_002',
    title: 'Outstanding Community Extension & Leadership Award',
    min_tenure_years: 5,
    min_verified_points: 15,
    target_group: 'All Academic Staff',
    badge_color: 'blue'
  },
  {
    id: 'awd_003',
    title: '10-Year Dedicated Loyalty & Service Award',
    min_tenure_years: 10,
    min_verified_points: 10,
    target_group: 'Tenured Personnel',
    badge_color: 'amber'
  }
]

const DEFAULT_AUDIT_LOGS = [
  {
    id: 'log_001',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    admin_name: 'Director Evelyn Tan (HR Director)',
    action_type: 'ROLE_ASSIGNMENT',
    target_personnel: 'Dr. Maria Santos (EMP-2021-0842)',
    details: 'Appointed as Department Secretary for Department of Computer Studies.'
  },
  {
    id: 'log_002',
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    admin_name: 'Director Evelyn Tan (HR Director)',
    action_type: 'ACCOMPLISHMENT_SEALED',
    target_personnel: 'Dr. Ana Reyes (EMP-2019-0881)',
    details: 'Applied official HR Verification Seal [HR-SEAL-2026-0041] for International Training certification.'
  }
]

class HRController {
  constructor() {
    this.initStorage()
  }

  initStorage() {
    if (!localStorage.getItem(STORAGE_KEY_PERSONNEL)) {
      localStorage.setItem(STORAGE_KEY_PERSONNEL, JSON.stringify(DEFAULT_PERSONNEL))
    }
    if (!localStorage.getItem(STORAGE_KEY_VERIFICATION)) {
      localStorage.setItem(STORAGE_KEY_VERIFICATION, JSON.stringify(DEFAULT_ACCOMPLISHMENTS))
    }
    if (!localStorage.getItem(STORAGE_KEY_AWARDS)) {
      localStorage.setItem(STORAGE_KEY_AWARDS, JSON.stringify(DEFAULT_AWARDS))
    }
    if (!localStorage.getItem(STORAGE_KEY_AUDIT)) {
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(DEFAULT_AUDIT_LOGS))
    }
  }

  // --- Personnel Methods ---
  getPersonnelList() {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_PERSONNEL) || '[]')
    return raw.map(item => new PersonnelEntity(item))
  }

  updatePersonnelRank(id, newRank, newStatus) {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_PERSONNEL) || '[]')
    let targetName = ''
    const updated = raw.map(p => {
      if (p.id === id) {
        targetName = p.full_name
        return { ...p, academic_rank: newRank, employment_status: newStatus }
      }
      return p
    })
    localStorage.setItem(STORAGE_KEY_PERSONNEL, JSON.stringify(updated))
    this.logAudit('RANK_PROMOTION', targetName, `Academic rank updated to "${newRank}" (${newStatus}).`)
    return updated.map(item => new PersonnelEntity(item))
  }

  assignPersonnelRole(id, roleKey) {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_PERSONNEL) || '[]')
    let targetName = ''
    const updated = raw.map(p => {
      if (p.id === id) {
        targetName = p.full_name
        const roles = Array.isArray(p.assigned_roles) ? p.assigned_roles : []
        if (!roles.includes(roleKey)) {
          roles.push(roleKey)
        }
        return { ...p, assigned_roles: roles }
      }
      return p
    })
    localStorage.setItem(STORAGE_KEY_PERSONNEL, JSON.stringify(updated))
    this.logAudit('ROLE_ASSIGNMENT', targetName, `Assigned administrative role: ${roleKey}.`)
    return updated.map(item => new PersonnelEntity(item))
  }

  revokePersonnelRole(id, roleKey) {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_PERSONNEL) || '[]')
    let targetName = ''
    const updated = raw.map(p => {
      if (p.id === id) {
        targetName = p.full_name
        const roles = (Array.isArray(p.assigned_roles) ? p.assigned_roles : []).filter(r => r !== roleKey)
        return { ...p, assigned_roles: roles }
      }
      return p
    })
    localStorage.setItem(STORAGE_KEY_PERSONNEL, JSON.stringify(updated))
    this.logAudit('ROLE_REVOCATION', targetName, `Revoked administrative role: ${roleKey}.`)
    return updated.map(item => new PersonnelEntity(item))
  }

  // --- Verification Queue Methods ---
  getAccomplishments() {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_VERIFICATION) || '[]')
    return raw.map(item => new FacultyAccomplishmentEntity(item))
  }

  sealVerification(accomplishmentId, sealCode = 'HR-SEAL-2026-0099') {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_VERIFICATION) || '[]')
    let targetFaculty = ''
    let title = ''
    const updated = raw.map(acc => {
      if (acc.id === accomplishmentId) {
        targetFaculty = acc.faculty_name
        title = acc.title
        return {
          ...acc,
          status: 'hr_verified',
          hr_verification_date: new Date().toISOString(),
          hr_verification_seal: sealCode
        }
      }
      return acc
    })
    localStorage.setItem(STORAGE_KEY_VERIFICATION, JSON.stringify(updated))
    this.logAudit('ACCOMPLISHMENT_SEALED', targetFaculty, `Stamped HR seal [${sealCode}] on accomplishment: "${title}".`)
    return updated.map(item => new FacultyAccomplishmentEntity(item))
  }

  returnAccomplishment(accomplishmentId, remarks) {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_VERIFICATION) || '[]')
    let targetFaculty = ''
    const updated = raw.map(acc => {
      if (acc.id === accomplishmentId) {
        targetFaculty = acc.faculty_name
        return {
          ...acc,
          status: 'returned',
          secretary_remarks: remarks
        }
      }
      return acc
    })
    localStorage.setItem(STORAGE_KEY_VERIFICATION, JSON.stringify(updated))
    this.logAudit('ACCOMPLISHMENT_RETURNED', targetFaculty, `Returned accomplishment with remarks: "${remarks}".`)
    return updated.map(item => new FacultyAccomplishmentEntity(item))
  }

  // --- Service Award Methods ---
  getServiceAwards() {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_AWARDS) || '[]')
    return raw.map(item => new ServiceAwardCategoryEntity(item))
  }

  identifyAwardCandidates(awardId) {
    const awards = this.getServiceAwards()
    const award = awards.find(a => a.id === awardId) || awards[0]
    const personnel = this.getPersonnelList()

    if (!award) return []

    return personnel.filter(p => {
      return p.tenure_years >= award.min_tenure_years || p.verified_accomplishments_count >= award.min_verified_points
    }).sort((a, b) => (b.verified_accomplishments_count + b.tenure_years * 2) - (a.verified_accomplishments_count + a.tenure_years * 2))
  }

  // --- Audit Logs ---
  getAuditLogs() {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_AUDIT) || '[]')
    return raw.map(item => new HRAuditLogEntity(item))
  }

  logAudit(actionType, targetPersonnel, details) {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_AUDIT) || '[]')
    const newLog = new HRAuditLogEntity({
      admin_name: 'Director Evelyn Tan (HR Director)',
      action_type: actionType,
      target_personnel: targetPersonnel || 'N/A',
      details: details
    })
    raw.unshift(newLog.toJSON())
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(raw))
  }

  /**
   * Retrieves pending and approved password reset requests targeted for the HR Office.
   * Auto-seeds a sample personnel reset request if storage is empty.
   */
  getPersonnelPasswordResetRequests() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RESETS)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hrRequests = parsed.filter(r => r.target_office === 'hr' || r.user_type === 'personnel')
          if (hrRequests.length > 0) return hrRequests
        }
      }
    } catch (e) {
      console.warn('Failed to fetch HR password reset requests:', e)
    }

    return [
      {
        id: 'req_hr_01',
        user_email: 'faculty@ndmu.edu.ph',
        user_name: 'Dr. Maria Santos',
        user_type: 'personnel',
        target_office: 'hr',
        remarks: 'Locked out of personnel portal after password change attempt.',
        status: 'pending',
        requested_at: new Date(Date.now() - 1800000).toISOString()
      }
    ]
  }

  /**
   * Approves a personnel password reset request, issues temporary credentials, and logs an audit trail.
   */
  approvePersonnelPasswordReset(requestId, tempPassword = 'NDMU-Faculty2026!', hrOfficerName = 'Director Evelyn Tan') {
    const requests = JSON.parse(localStorage.getItem(STORAGE_KEY_RESETS) || '[]')
    let hrRequests = this.getPersonnelPasswordResetRequests()
    const targetReq = hrRequests.find(r => r.id === requestId) || requests.find(r => r.id === requestId)

    if (targetReq) {
      targetReq.status = 'approved'
      targetReq.approved_at = new Date().toISOString()
      targetReq.temp_password = tempPassword

      // Update in storage
      const updatedAll = requests.map(r => r.id === requestId ? targetReq : r)
      if (!requests.some(r => r.id === requestId)) {
        updatedAll.push(targetReq)
      }
      localStorage.setItem(STORAGE_KEY_RESETS, JSON.stringify(updatedAll))

      // Audit logs
      this.logAudit('PERSONNEL_PASSWORD_RESET_APPROVED', targetReq.user_name || targetReq.user_email, `Approved personnel password reset. Issued temporary credentials.`)
      SecurityController.logEvent('PERSONNEL_PASSWORD_RESET_APPROVED', hrOfficerName, 'hr_staff', `Approved personnel password reset for ${targetReq.user_name} (${targetReq.user_email}).`)
      
      window.dispatchEvent(new Event('storage'))
    }

    return targetReq
  }
}

export default new HRController()
