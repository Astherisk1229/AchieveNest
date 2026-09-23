/**
 * AchieveNest — Plan 07 Phase 4
 * Provisioning Credential Response Contract & Normalizer
 *
 * Enforces strict runtime allowlisting and validation of temporary credential responses
 * returned by manual student and personnel provisioning endpoints.
 */

export class ProvisioningCredentialContractError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'ProvisioningCredentialContractError'
    this.code = code
  }
}

/**
 * Validates and normalizes raw provisioning API response into a strict, allowlisted ProvisionedCredential object.
 *
 * @param {Object} rawResponse - The raw API response object from POST /provisioning/manual-student or manual-personnel
 * @param {'student'|'personnel'} expectedOwnerType - The expected account owner type
 * @returns {Object} Normalized ProvisionedCredential object
 */
export function parseProvisioningCredentialResponse(rawResponse, expectedOwnerType) {
  if (!rawResponse || typeof rawResponse !== 'object') {
    throw new ProvisioningCredentialContractError(
      'INVALID_RESPONSE_PAYLOAD',
      'Provisioning response is empty or not an object.'
    )
  }

  // Support both standard { data: { ... } } and direct payload shapes
  const data = rawResponse.data && typeof rawResponse.data === 'object' ? rawResponse.data : rawResponse

  const profileId = data.id || data.profile_id || data.profileId
  if (!profileId || (typeof profileId !== 'string' && typeof profileId !== 'number')) {
    throw new ProvisioningCredentialContractError(
      'MISSING_PROFILE_ID',
      'Provisioning response missing valid profile ID.'
    )
  }

  const ownerType = (data.account_type || data.ownerType || '').toString().toLowerCase().trim()
  const expectedType = (expectedOwnerType || '').toString().toLowerCase().trim()
  if (expectedType && ownerType !== expectedType) {
    throw new ProvisioningCredentialContractError(
      'OWNER_TYPE_MISMATCH',
      `Provisioning response owner type [${ownerType}] does not match expected [${expectedType}].`
    )
  }
  if (ownerType !== 'student' && ownerType !== 'personnel') {
    throw new ProvisioningCredentialContractError(
      'INVALID_OWNER_TYPE',
      `Provisioning response owner type [${ownerType}] is not supported.`
    )
  }

  const fullName = (data.full_name || data.fullName || '').toString().trim()
  if (!fullName) {
    throw new ProvisioningCredentialContractError(
      'MISSING_FULL_NAME',
      'Provisioning response missing account owner name.'
    )
  }

  const institutionalId = (data.institutional_id || data.institutionalId || '').toString().trim()
  if (!institutionalId) {
    throw new ProvisioningCredentialContractError(
      'MISSING_INSTITUTIONAL_ID',
      'Provisioning response missing institutional ID.'
    )
  }

  const institutionalEmail = (data.institutional_email || data.institutionalEmail || data.email || '').toString().trim().toLowerCase()
  if (!institutionalEmail || !institutionalEmail.endsWith('@ndmu.edu.ph')) {
    throw new ProvisioningCredentialContractError(
      'INVALID_INSTITUTIONAL_EMAIL',
      'Provisioning response missing valid NDMU institutional email.'
    )
  }

  const temporaryPassword = data.temporary_password || data.temporaryPassword || data.temp_password
  if (!temporaryPassword || typeof temporaryPassword !== 'string' || temporaryPassword.trim().length === 0) {
    throw new ProvisioningCredentialContractError(
      'MISSING_TEMPORARY_PASSWORD',
      'Provisioning response did not contain a temporary password.'
    )
  }

  const lifecycleStatus = data.account_lifecycle_status || data.accountLifecycleStatus
  if (lifecycleStatus !== 'pending_first_login') {
    throw new ProvisioningCredentialContractError(
      'INVALID_LIFECYCLE_STATUS',
      `Provisioned account lifecycle status [${lifecycleStatus}] must be 'pending_first_login'.`
    )
  }

  const mustChange = data.must_change_password ?? data.mustChangePassword
  if (mustChange !== true && mustChange !== 1) {
    throw new ProvisioningCredentialContractError(
      'INVALID_MUST_CHANGE_PASSWORD',
      'Provisioned account must require first-login password change.'
    )
  }

  const requiredAction = data.required_next_action || data.requiredNextAction
  if (requiredAction !== 'change_password') {
    throw new ProvisioningCredentialContractError(
      'INVALID_REQUIRED_ACTION',
      `Provisioned account next action [${requiredAction}] must be 'change_password'.`
    )
  }

  // Construct strictly allowlisted credential object — zero extraneous fields, zero spreading
  return {
    profileId: String(profileId),
    ownerType,
    fullName,
    institutionalId,
    institutionalEmail,
    temporaryPassword: String(temporaryPassword),
    accountLifecycleStatus: 'pending_first_login',
    mustChangePassword: true,
    requiredNextAction: 'change_password'
  }
}

/**
 * Builds standard plain-text credential package for clipboard copying.
 * Excludes internal IDs, roles, program affiliations, or extra personal data.
 *
 * @param {Object} credential - Normalized ProvisionedCredential object
 * @returns {string} Standardized clipboard text
 */
export function buildCredentialCopyText(credential) {
  if (!credential) return ''

  const typeLabel = credential.ownerType === 'student' ? 'Student' : 'Personnel'
  const idLabel = credential.ownerType === 'student' ? 'Student ID' : 'Personnel ID'

  return [
    'AchieveNest Account Credentials',
    `Account Owner: ${credential.fullName}`,
    `Account Type: ${typeLabel}`,
    `${idLabel}: ${credential.institutionalId}`,
    `Institutional Email: ${credential.institutionalEmail}`,
    `Temporary Password: ${credential.temporaryPassword}`,
    'First Login: Change this password immediately after signing in.',
    'Confidential: Give these credentials only to the verified account owner.'
  ].join('\n')
}
