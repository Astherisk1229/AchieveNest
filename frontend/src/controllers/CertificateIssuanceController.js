/**
 * CertificateIssuanceController.js
 * Controller for Organization Moderator Digital Certificate Hub & Public Verification.
 * 
 * Manages certificate eligibility, template resolution, signatory governance,
 * bulk issuance batches, student portfolio transmission, and public verification records.
 */

const STORAGE_KEYS = {
  BATCHES: 'achievenest_cert_batches_v1',
  ISSUED_CERTS: 'achievenest_issued_certs_v1',
  SIGNATORIES: 'achievenest_signatories_v1'
}

// Initial Mock Published OSAD Certificate Templates
export const DEFAULT_OSAD_TEMPLATES = [
  {
    id: 'tpl-workshop-01',
    code: 'OSAD-TPL-03',
    title: 'Certificate of Workshop Completion',
    family: 'event',
    status: 'published',
    version: 'v2.1',
    description: 'Official OSAD accreditation template for technical workshops, seminars, and training sessions.',
    theme: 'emerald_gold',
    signatorySlots: [
      { id: 'slot-adviser', title: 'Organization Adviser', required: true, defaultRole: 'adviser' },
      { id: 'slot-osad', title: 'OSAD Director', required: true, defaultRole: 'osad_director' }
    ]
  },
  {
    id: 'tpl-merit-02',
    code: 'OSAD-TPL-02',
    title: 'Certificate of Leadership & Merit',
    family: 'event',
    status: 'published',
    version: 'v1.4',
    description: 'For executive leadership summits, officer conventions, and distinguished service awards.',
    theme: 'navy_gold',
    signatorySlots: [
      { id: 'slot-adviser', title: 'Organization Adviser', required: true, defaultRole: 'adviser' },
      { id: 'slot-president', title: 'Organization President', required: true, defaultRole: 'president' },
      { id: 'slot-osad', title: 'OSAD Director', required: true, defaultRole: 'osad_director' }
    ]
  },
  {
    id: 'tpl-excellence-03',
    code: 'OSAD-TPL-04',
    title: 'Excellence & Special Distinction Award',
    family: 'event',
    status: 'published',
    version: 'v3.0',
    description: 'Premier award certificate for competition winners and hackathon champions.',
    theme: 'burgundy_gold',
    signatorySlots: [
      { id: 'slot-adviser', title: 'Organization Adviser', required: true, defaultRole: 'adviser' },
      { id: 'slot-osad', title: 'OSAD Director', required: true, defaultRole: 'osad_director' }
    ]
  }
]

// Approved OSAD Signatory Assets
export const DEFAULT_APPROVED_SIGNATORIES = [
  {
    id: 'sig-adviser-01',
    name: 'Prof. Michael Tan, M.Sc.',
    title: 'Computer Society Organization Adviser',
    role: 'adviser',
    status: 'approved',
    assetUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'sig-osad-01',
    name: 'Dr. Evelyn Mendoza, Ph.D.',
    title: 'Director, Office of Student Affairs & Services',
    role: 'osad_director',
    status: 'approved',
    assetUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'sig-pres-01',
    name: 'Juan Dela Cruz',
    title: 'Computer Society President',
    role: 'president',
    status: 'approved',
    assetUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  }
]

// Default Initial Batches
export const DEFAULT_INITIAL_BATCHES = [
  {
    id: 'batch-2026-001',
    eventId: 'evt-1',
    eventTitle: 'Computer Society Tech Summit 2026',
    organizationId: 'org-cs',
    organizationName: 'Computer Society NDMU',
    templateCode: 'OSAD-TPL-03',
    templateTitle: 'Certificate of Workshop Completion',
    templateVersion: 'v2.1',
    recipientCount: 42,
    issuedBy: 'Dr. Maria Santos',
    issuedAt: '2026-02-15T09:30:00Z',
    status: 'completed',
    idempotencyKey: 'batch_evt-1_tpl-workshop-01_2026-02-15'
  },
  {
    id: 'batch-2026-002',
    eventId: 'evt-2',
    eventTitle: 'Annual AI & Ethics Hackathon',
    organizationId: 'org-cs',
    organizationName: 'Computer Society NDMU',
    templateCode: 'OSAD-TPL-04',
    templateTitle: 'Excellence & Special Distinction Award',
    templateVersion: 'v3.0',
    recipientCount: 18,
    issuedBy: 'Dr. Maria Santos',
    issuedAt: '2026-01-20T14:15:00Z',
    status: 'completed',
    idempotencyKey: 'batch_evt-2_tpl-excellence-03_2026-01-20'
  }
]

// Default Initial Issued Certificates for Public Verification
export const DEFAULT_ISSUED_CERTS = [
  {
    id: 'cert-2026-001-01',
    publicId: 'VER-NDMU-2026-849201',
    serialNumber: 'NDMU-CS-2026-00841',
    batchId: 'batch-2026-001',
    eventId: 'evt-1',
    eventTitle: 'Computer Society Tech Summit 2026',
    organizationName: 'Computer Society NDMU',
    studentName: 'Alex Rivera',
    studentId: '2022-0142',
    templateCode: 'OSAD-TPL-03',
    templateTitle: 'Certificate of Workshop Completion',
    issuedAt: '2026-02-15T09:30:00Z',
    status: 'ACTIVE' // 'ACTIVE' | 'REVOKED' | 'SUPERSEDED'
  },
  {
    id: 'cert-2026-001-02',
    publicId: 'VER-NDMU-2026-849202',
    serialNumber: 'NDMU-CS-2026-00842',
    batchId: 'batch-2026-001',
    eventId: 'evt-1',
    eventTitle: 'Computer Society Tech Summit 2026',
    organizationName: 'Computer Society NDMU',
    studentName: 'Dr. Maria Santos',
    studentId: 'EMP-2021-0842',
    templateCode: 'OSAD-TPL-03',
    templateTitle: 'Certificate of Workshop Completion',
    issuedAt: '2026-02-15T09:30:00Z',
    status: 'ACTIVE'
  }
]

class CertificateIssuanceController {
  #batches = []
  #issuedCerts = []
  #signatories = DEFAULT_APPROVED_SIGNATORIES

  constructor() {
    this.#loadFromStorage()
  }

  #loadFromStorage() {
    try {
      const storedBatches = localStorage.getItem(STORAGE_KEYS.BATCHES)
      this.#batches = storedBatches ? JSON.parse(storedBatches) : DEFAULT_INITIAL_BATCHES

      const storedCerts = localStorage.getItem(STORAGE_KEYS.ISSUED_CERTS)
      this.#issuedCerts = storedCerts ? JSON.parse(storedCerts) : DEFAULT_ISSUED_CERTS
    } catch (_e) {
      this.#batches = DEFAULT_INITIAL_BATCHES
      this.#issuedCerts = DEFAULT_ISSUED_CERTS
    }
  }

  #saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(this.#batches))
      localStorage.setItem(STORAGE_KEYS.ISSUED_CERTS, JSON.stringify(this.#issuedCerts))
    } catch (_e) {
      // Memory fallback
    }
  }

  getPublishedTemplates() {
    return DEFAULT_OSAD_TEMPLATES
  }

  getApprovedSignatories() {
    return this.#signatories
  }

  getIssuanceHistory(_orgId = '') {
    return this.#batches
  }

  getRecipientEligibility(eventId = 'evt-1') {
    // Simulated recipient eligibility analysis
    const sampleStudents = [
      { id: 'std-01', studentId: '2022-0142', name: 'Alex Rivera', program: 'BS Computer Science', attendanceStatus: 'verified', durationMinutes: 240, isEligible: true, exclusionReason: null },
      { id: 'std-02', studentId: '2022-0189', name: 'Samantha Gomez', program: 'BS Information Technology', attendanceStatus: 'verified', durationMinutes: 210, isEligible: true, exclusionReason: null },
      { id: 'std-03', studentId: '2023-0054', name: 'Carlos Yulo', program: 'BS Information Systems', attendanceStatus: 'verified', durationMinutes: 240, isEligible: true, exclusionReason: null },
      { id: 'std-04', studentId: '2023-0112', name: 'Bea Alonzo', program: 'BS Computer Science', attendanceStatus: 'unverified', durationMinutes: 45, isEligible: false, exclusionReason: 'Insufficient attendance duration (< 120 mins)' },
      { id: 'std-05', studentId: '2021-0988', name: 'Mark Bautista', program: 'BS Information Technology', attendanceStatus: 'unverified', durationMinutes: 0, isEligible: false, exclusionReason: 'Unverified attendance record' }
    ]

    const eligibleCount = sampleStudents.filter(s => s.isEligible).length
    const excludedCount = sampleStudents.filter(s => !s.isEligible).length

    return {
      eventId,
      students: sampleStudents,
      eligibleCount,
      excludedCount,
      totalCount: sampleStudents.length
    }
  }

  issueCertificateBatch({ eventId, eventTitle, organizationId, organizationName, templateId, signatories, recipients, idempotencyKey, issuedBy }) {
    // Idempotency check: if key already exists, return existing batch
    if (idempotencyKey) {
      const existing = this.#batches.find(b => b.idempotencyKey === idempotencyKey)
      if (existing) {
        return { success: true, isIdempotent: true, batch: existing }
      }
    }

    const template = DEFAULT_OSAD_TEMPLATES.find(t => t.id === templateId) || DEFAULT_OSAD_TEMPLATES[0]
    const batchId = `batch-${Date.now()}`
    const issuedAt = new Date().toISOString()

    const newBatch = {
      id: batchId,
      eventId,
      eventTitle: eventTitle || 'Computer Society Tech Summit 2026',
      organizationId: organizationId || 'org-cs',
      organizationName: organizationName || 'Computer Society NDMU',
      templateCode: template.code,
      templateTitle: template.title,
      templateVersion: template.version,
      recipientCount: recipients.length,
      issuedBy: issuedBy || 'Dr. Maria Santos',
      issuedAt,
      status: 'completed',
      idempotencyKey: idempotencyKey || `key_${batchId}`
    }

    // Generate individual issued certificate records
    const newCerts = recipients.map((st, idx) => {
      const publicId = `VER-NDMU-2026-${Math.floor(100000 + Math.random() * 900000)}`
      const serialNumber = `NDMU-CS-2026-${String(this.#issuedCerts.length + idx + 1).padStart(5, '0')}`

      return {
        id: `cert-${batchId}-${idx}`,
        publicId,
        serialNumber,
        batchId,
        eventId,
        eventTitle: newBatch.eventTitle,
        organizationName: newBatch.organizationName,
        studentName: st.name,
        studentId: st.studentId || st.id,
        templateCode: template.code,
        templateTitle: template.title,
        signatories,
        issuedAt,
        status: 'ACTIVE'
      }
    })

    this.#batches.unshift(newBatch)
    this.#issuedCerts.push(...newCerts)
    this.#saveToStorage()

    return {
      success: true,
      isIdempotent: false,
      batch: newBatch,
      issuedCertificates: newCerts
    }
  }

  revokeCertificate(certificateId, reason = 'Administrative revocation') {
    const cert = this.#issuedCerts.find(c => c.id === certificateId || c.publicId === certificateId)
    if (!cert) return { success: false, reason: 'Certificate not found' }

    cert.status = 'REVOKED'
    cert.revokedAt = new Date().toISOString()
    cert.revocationReason = reason
    this.#saveToStorage()

    return { success: true, certificate: cert }
  }

  getPublicCertificate(publicId = '') {
    if (!publicId) return null
    const cert = this.#issuedCerts.find(c => c.publicId.toLowerCase() === publicId.toLowerCase())
    if (cert) return cert

    // Sample fallback for direct verification link testing
    if (publicId.toLowerCase().includes('sample') || publicId.toLowerCase().includes('ver-ndmu')) {
      return {
        id: 'cert-sample-01',
        publicId: publicId,
        serialNumber: 'NDMU-CS-2026-00841',
        batchId: 'batch-2026-001',
        eventId: 'evt-1',
        eventTitle: 'Computer Society Tech Summit 2026',
        organizationName: 'Computer Society NDMU',
        studentName: 'Alex Rivera',
        studentId: '2022-0142',
        templateCode: 'OSAD-TPL-03',
        templateTitle: 'Certificate of Workshop Completion',
        issuedAt: '2026-02-15T09:30:00Z',
        status: 'ACTIVE'
      }
    }

    return null
  }
}

export default new CertificateIssuanceController()
