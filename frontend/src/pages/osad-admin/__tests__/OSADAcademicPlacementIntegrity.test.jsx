import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildStudentProvisioningPayload } from '../modals/AddStudentAccountModalV2'

const source = (relativePath) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  'utf8'
)

describe('OSAD academic placement integrity', () => {
  it('submits canonical college and academic-program IDs using the backend field contract', () => {
    const payload = buildStudentProvisioningPayload({
      institutionalId: ' 202610492 ',
      institutionalEmail: ' STUDENT@NDMU.EDU.PH ',
      firstName: ' Ada ',
      middleName: '',
      lastName: ' Lovelace ',
      suffix: '',
      collegeId: '20000000-0000-0000-0000-000000000001',
      academicProgramId: '30000000-0000-0000-0000-000000000001',
      yearLevel: '1st Year',
      academicYear: '2026-2027',
      sex: 'Female'
    })

    expect(payload.college_id).toBe('20000000-0000-0000-0000-000000000001')
    expect(payload.academic_program_id).toBe('30000000-0000-0000-0000-000000000001')
    expect(payload.institutional_id).toBe('202610492')
    expect(payload.institutional_email).toBe('student@ndmu.edu.ph')
  })

  it('loads programs by selected immutable college ID and guards stale responses', () => {
    const modal = source('../modals/AddStudentAccountModalV2.jsx')
    expect(modal).toContain("fetchAcademicPrograms({ college_id: formData.collegeId }, { signal: controller.signal })")
    expect(modal).toContain('programRequestRef.current.sequence !== sequence')
    expect(modal).toContain("collegeId, academicProgramId: ''")
  })

  it('does not substitute demo academic master records or report failed writes as success', () => {
    const dashboard = source('../OSADDashboardPage.jsx')
    expect(dashboard).toContain('useState([])')
    expect(dashboard).not.toContain('persistentPrograms.length > 0 ? persistentPrograms : degreePrograms')
    expect(dashboard).not.toContain('createDegreeProgram(progData)')
  })
})
