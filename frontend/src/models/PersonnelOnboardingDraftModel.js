/**
 * PersonnelOnboardingDraftModel.js
 * Domain model defining safe schema validation, sanitization, and serialization
 * for HR personnel onboarding drafts in local storage.
 */

export class PersonnelOnboardingDraftModel {
  #schemaVersion
  #ownerKey
  #draftId
  #createdAt
  #updatedAt
  #activeStep
  #completedSteps
  #identity
  #employment
  #account

  constructor(data = {}, ownerContext = {}) {
    this.#schemaVersion = '1.0'
    this.#ownerKey = PersonnelOnboardingDraftModel.buildOwnerKey(ownerContext)
    this.#draftId = data.draftId || `onboard_draft_${Date.now()}`
    this.#createdAt = data.createdAt || new Date().toISOString()
    this.#updatedAt = data.updatedAt || new Date().toISOString()

    // Clamp activeStep strictly to 1–4
    const stepNum = Number(data.activeStep)
    this.#activeStep = (!isNaN(stepNum) && stepNum >= 1 && stepNum <= 4) ? stepNum : 1

    this.#completedSteps = Array.isArray(data.completedSteps)
      ? Array.from(new Set(data.completedSteps.filter(s => typeof s === 'number' && s >= 1 && s <= 4)))
      : []

    // Step 1: Identity
    const idData = data.identity || {}
    this.#identity = {
      firstName: typeof idData.firstName === 'string' ? idData.firstName : '',
      lastName: typeof idData.lastName === 'string' ? idData.lastName : '',
      middleName: typeof idData.middleName === 'string' ? idData.middleName : '',
      email: typeof idData.email === 'string' ? idData.email : '',
      employeeId: typeof idData.employeeId === 'string' ? idData.employeeId : ''
    }

    // Step 2: Employment Placement
    const empData = data.employment || {}
    this.#employment = {
      personnelCategory: typeof empData.personnelCategory === 'string' ? empData.personnelCategory : 'Faculty Member',
      positionTitle: typeof empData.positionTitle === 'string' ? empData.positionTitle : 'Faculty Member',
      college: typeof empData.college === 'string' ? empData.college : '',
      academicPrograms: Array.isArray(empData.academicPrograms) ? empData.academicPrograms : [],
      administrativeUnit: typeof empData.administrativeUnit === 'string' ? empData.administrativeUnit : '',
      academicRank: typeof empData.academicRank === 'string' ? empData.academicRank : 'Assistant Professor I',
      employmentClassification: typeof empData.employmentClassification === 'string' ? empData.employmentClassification : 'Full-Time Permanent',
      hireDate: typeof empData.hireDate === 'string' ? empData.hireDate : new Date().toISOString().split('T')[0]
    }

    // Step 3: Base Account Access (Sanitized: NO passkeys or acknowledgements stored)
    const accData = data.account || {}
    this.#account = {
      invitationOption: accData.invitationOption === 'temporary_passkey' ? 'temporary_passkey' : 'activation_link'
    }
  }

  static buildOwnerKey(ownerContext = {}) {
    const evaluatorId = ownerContext.evaluatorId || 'HR-DEFAULT'
    const role = ownerContext.role || 'hr_staff'
    return `${evaluatorId}:${role}`.toLowerCase()
  }

  get schemaVersion() { return this.#schemaVersion }
  get ownerKey() { return this.#ownerKey }
  get draftId() { return this.#draftId }
  get createdAt() { return this.#createdAt }
  get updatedAt() { return this.#updatedAt }
  get activeStep() { return this.#activeStep }
  get completedSteps() { return [...this.#completedSteps] }
  get identity() { return { ...this.#identity } }
  get employment() { return { ...this.#employment } }
  get account() { return { ...this.#account } }

  /**
   * Determines if the draft contains meaningful user input beyond defaults.
   */
  hasMeaningfulInput() {
    return Boolean(
      this.#identity.firstName.trim() ||
      this.#identity.lastName.trim() ||
      (this.#identity.email.trim() && !this.#identity.email.endsWith('@ndmu.edu.ph')) ||
      this.#employment.college ||
      (this.#employment.academicPrograms && this.#employment.academicPrograms.length > 0) ||
      this.#employment.administrativeUnit
    )
  }

  /**
   * Serializes safe, sanitized DTO for storage.
   */
  toJSON() {
    return {
      schemaVersion: this.#schemaVersion,
      ownerKey: this.#ownerKey,
      draftId: this.#draftId,
      createdAt: this.#createdAt,
      updatedAt: this.#updatedAt,
      activeStep: this.#activeStep,
      completedSteps: [...this.#completedSteps],
      identity: { ...this.#identity },
      employment: { ...this.#employment },
      account: { ...this.#account }
    }
  }
}
