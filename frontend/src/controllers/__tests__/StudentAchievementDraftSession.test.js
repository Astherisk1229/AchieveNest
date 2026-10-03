import { describe, expect, it, vi } from 'vitest'
import StudentAchievementDraftSession, {
  applyOcrSuggestions,
  applyOcrToDetails,
  parseOcrDate,
  buildRecordPayload,
  parseStructuredMetadata,
  toApiError,
  validateForSubmit
} from '../StudentAchievementDraftSession'

const CATEGORY = '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646'

function makeService(overrides = {}) {
  return {
    fetchRecord: vi.fn(),
    createRecord: vi.fn(async () => ({ id: 'rec-1', status: 'draft' })),
    updateRecord: vi.fn(async () => ({ id: 'rec-1', status: 'draft' })),
    addEvidence: vi.fn(async () => ({ evidence: { id: 'ev-1', status: 'active', security_status: 'pending' } })),
    scanEvidence: vi.fn(async () => ({ scan: { status: 'clean' } })),
    readEvidence: vi.fn(async () => ({ ocr: { review_suggestions: [] } })),
    removeEvidence: vi.fn(async () => ({})),
    resubmitRecord: vi.fn(async () => ({ id: 'rec-1', status: 'submitted' })),
    ...overrides
  }
}

const pdf = () => new File(['%PDF-1.4'], 'proof.pdf', { type: 'application/pdf' })

describe('StudentAchievementDraftSession', () => {
  it('creates no backend record when the form is opened and closed without saving', () => {
    const service = makeService()
    const session = new StudentAchievementDraftSession(service)
    expect(session.recordId).toBeNull()
    expect(service.createRecord).not.toHaveBeenCalled()
    expect(service.updateRecord).not.toHaveBeenCalled()
  })

  it('creates an unclassified draft when evidence comes before the category', async () => {
    const service = makeService()
    const session = new StudentAchievementDraftSession(service)
    await session.uploadEvidence(pdf(), buildRecordPayload({ formData: {} }))
    expect(service.createRecord).toHaveBeenCalledTimes(1)
    expect(service.createRecord.mock.calls[0][0]).toMatchObject({ category_id: null, subcategory_id: null, submit_now: false })
  })

  it('creates exactly one draft even when two uploads start together', async () => {
    const service = makeService()
    const session = new StudentAchievementDraftSession(service)
    const payload = buildRecordPayload({ formData: {}, categoryId: CATEGORY })
    await Promise.all([session.uploadEvidence(pdf(), payload), session.uploadEvidence(pdf(), payload)])
    expect(service.createRecord).toHaveBeenCalledTimes(1)
    expect(service.createRecord.mock.calls[0][0]).toMatchObject({ category_id: CATEGORY, submit_now: false })
    expect(service.addEvidence).toHaveBeenCalledTimes(2)
    expect(service.addEvidence.mock.calls.every(([id]) => id === 'rec-1')).toBe(true)
  })

  it('rejects unsupported evidence types before any request', async () => {
    const service = makeService()
    const session = new StudentAchievementDraftSession(service)
    const text = new File(['x'], 'notes.txt', { type: 'text/plain' })
    await expect(session.uploadEvidence(text, buildRecordPayload({ formData: {}, categoryId: CATEGORY }))).rejects.toMatchObject({ code: 'INVALID_EVIDENCE_FILE' })
    expect(service.createRecord).not.toHaveBeenCalled()
  })

  it('stops submission when saving fails and reports the backend error', async () => {
    const service = makeService({
      updateRecord: vi.fn(async () => { throw { error: { code: 'INVALID_STRUCTURED_METADATA', message: 'Structured metadata validation failed.', errors: { 'structured_metadata.semester': ['Semester is required.'] } } } })
    })
    const session = new StudentAchievementDraftSession(service, { recordId: 'rec-1', status: 'draft' })
    await expect(session.submit(buildRecordPayload({ formData: {}, categoryId: CATEGORY }))).rejects.toMatchObject({
      code: 'INVALID_STRUCTURED_METADATA',
      fieldErrors: expect.objectContaining({ semester: 'Semester is required.' })
    })
    expect(service.resubmitRecord).not.toHaveBeenCalled()
  })

  it('submits the same record id that was saved', async () => {
    const service = makeService()
    const session = new StudentAchievementDraftSession(service, { recordId: 'rec-9', status: 'revision_requested' })
    await session.submit(buildRecordPayload({ formData: { title: 'x' }, categoryId: CATEGORY }))
    expect(service.updateRecord).toHaveBeenCalledWith('rec-9', expect.any(Object))
    expect(service.resubmitRecord).toHaveBeenCalledWith('rec-9')
    expect(session.status).toBe('submitted')
  })

  it('blocks edits of records that are no longer editable', async () => {
    const service = makeService()
    const session = new StudentAchievementDraftSession(service, { recordId: 'rec-1', status: 'submitted' })
    await expect(session.save({})).rejects.toMatchObject({ code: 'RECORD_NOT_EDITABLE' })
    await expect(session.removeEvidence('ev-1')).rejects.toMatchObject({ code: 'RECORD_NOT_EDITABLE' })
    expect(service.updateRecord).not.toHaveBeenCalled()
  })

  it('reports OCR failures as data so manual entry continues', async () => {
    const service = makeService({ readEvidence: vi.fn(async () => { throw { error: { code: 'EVIDENCE_NOT_SCANNED', message: 'scan first' } } }) })
    const session = new StudentAchievementDraftSession(service, { recordId: 'rec-1', status: 'draft' })
    const result = await session.readEvidence('ev-1')
    expect(result.ok).toBe(false)
    expect(result.error.code).toBe('EVIDENCE_NOT_SCANNED')
  })

  it('reports scan failures as data instead of throwing', async () => {
    const service = makeService({ scanEvidence: vi.fn(async () => { throw { error: { code: 'EVIDENCE_FILE_UNAVAILABLE', message: 'missing' } } }) })
    const session = new StudentAchievementDraftSession(service, { recordId: 'rec-1', status: 'draft' })
    const result = await session.scanEvidence('ev-1')
    expect(result.ok).toBe(false)
    expect(result.error.code).toBe('EVIDENCE_FILE_UNAVAILABLE')
  })
})

describe('payload and validation helpers', () => {
  it('maps only real record columns and never sends workflow or scoring fields', () => {
    const payload = buildRecordPayload({
      formData: { title: '  SSG Secretary ', organizer_or_body: '', start_date: '2025-08-01', end_date: '', description: '' },
      categoryId: CATEGORY,
      subcategoryId: '',
      structuredMetadata: { academic_year: '2025-2026' }
    })
    expect(payload).toEqual({
      title: 'SSG Secretary',
      organizer_or_body: null,
      start_date: '2025-08-01',
      occurrence_date: '2025-08-01',
      end_date: null,
      description: null,
      category_id: CATEGORY,
      subcategory_id: null,
      structured_metadata: { academic_year: '2025-2026', schema_version: '1.0' }
    })
    for (const key of ['status', 'points', 'verified_by', 'student_profile_id', 'submit_now']) expect(payload).not.toHaveProperty(key)
  })

  it('applies OCR suggestions only to untouched empty fields and converts unambiguous dates', () => {
    const { formData, applied } = applyOcrSuggestions(
      { title: '', organizer_or_body: 'Typed by student', start_date: '' },
      [
        { key: 'activity_title', value: 'Leadership Summit' },
        { key: 'organizer_granting_body', value: 'OCR organizer' },
        { key: 'start_date_raw', value: 'May 28, 2026' }
      ],
      { organizer_or_body: true }
    )
    expect(formData).toEqual({ title: 'Leadership Summit', organizer_or_body: 'Typed by student', start_date: '2026-05-28' })
    expect(applied).toEqual({ title: true, start_date: true })
  })

  it('converts only unambiguous OCR dates', () => {
    expect(parseOcrDate('May 28, 2026')).toBe('2026-05-28')
    expect(parseOcrDate('28 May 2026')).toBe('2026-05-28')
    expect(parseOcrDate('Aug. 1, 2025')).toBe('2025-08-01')
    expect(parseOcrDate('2025-08-01')).toBe('2025-08-01')
    expect(parseOcrDate('05/06/2026')).toBeNull()
    expect(parseOcrDate('February 30, 2026')).toBeNull()
    expect(parseOcrDate('sometime in May')).toBeNull()
  })

  it('fills details from the document; dropdowns only on an exact option match', () => {
    const fields = [
      { key: 'organization_name', type: 'text' },
      { key: 'position_title', type: 'text' },
      { key: 'position_level', type: 'select', options: [{ value: 'executive', label: 'Executive Officer (President / VP / Governor)' }] },
      { key: 'academic_year', type: 'select', options: [{ value: '2025-2026', label: 'AY 2025-2026' }] }
    ]
    const suggestions = [
      { key: 'organization_name', value: 'Association of Computing Students' },
      { key: 'position_title', value: 'Student Organization President' },
      { key: 'academic_year', value: '2025\u20132026' }
    ]
    const { metadata, applied } = applyOcrToDetails({ schema_version: '1.0' }, suggestions, fields)
    expect(metadata).toEqual({
      schema_version: '1.0',
      organization_name: 'Association of Computing Students',
      position_title: 'Student Organization President',
      academic_year: '2025-2026'
    })
    expect(metadata.position_level).toBeUndefined() // 'Student Organization President' is not an option: left blank
    expect(applied).toEqual({ organization_name: true, position_title: true, academic_year: true })

    const exact = applyOcrToDetails({}, [{ key: 'position_title', value: 'executive officer (president / vp / governor)' }], fields)
    expect(exact.metadata.position_level).toBe('executive')
    const kept = applyOcrToDetails({ organization_name: 'Typed' }, suggestions, fields)
    expect(kept.metadata.organization_name).toBe('Typed')
  })

  it('requires clean active evidence and complete details before submission', () => {
    const errors = validateForSubmit({
      formData: { title: 'ok title', organizer_or_body: 'SSG', start_date: '2025-08-01' },
      categoryId: CATEGORY,
      subcategoryId: 'sub',
      structuredMetadata: {},
      schemaFields: [{ key: 'position_title', label: 'Official Position Title', required: true }],
      evidence: [{ status: 'active', security_status: 'pending' }]
    })
    expect(Object.keys(errors).sort()).toEqual(['evidence', 'position_title'])
  })

  it('parses stored metadata strings and normalizes API errors', () => {
    expect(parseStructuredMetadata('{"semester":"1st_semester"}')).toEqual({ schema_version: '1.0', semester: '1st_semester' })
    expect(parseStructuredMetadata('not json')).toEqual({ schema_version: '1.0' })
    const error = toApiError({ error: { code: 'CLEAN_EVIDENCE_REQUIRED', message: 'Scan first.' } })
    expect(error.code).toBe('CLEAN_EVIDENCE_REQUIRED')
    expect(error.message).toBe('Scan first.')
  })
})
