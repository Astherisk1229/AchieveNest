/**
 * signatureVault.js
 * Persistent signature vault for organization-issued event certificates.
 * Manages stored digital signature PNG/SVG graphics and auto pre-fills them for new events.
 */

const STORAGE_KEY = 'achievenest_signature_vault'

const emptyVault = { signatory_1: '', signatory_2: '', signatory_1_img: null, signatory_2_img: null }
const isLegacyOsadName = value => typeof value === 'string'
  && (/(?:^|\()OSAD(?:\)|$)/i.test(value)
    || /^Dr\. Ana Reyes \(Club Moderator\)$/i.test(value)
    || /^Prof\. Juan Dela Cruz(?: \(OSAD Director\))?$/i.test(value))
const isLegacySampleSignature = value => typeof value === 'string' && /A\. Reyes|J\. Dela Cruz/i.test(value)

export const cleanOrganizationSignatoryName = value => isLegacyOsadName(value) ? '' : (value || '')
export const cleanOrganizationSignatoryImage = value => isLegacySampleSignature(value) ? null : (value || null)

/**
 * Helper to parse "Name (Title)" or "Name - Title" into separate Name and Position/Title
 */
export const parseSignatoryInfo = (str, fallbackName = 'Signatory Name', fallbackTitle = 'Official Position') => {
  if (!str || typeof str !== 'string') return { name: fallbackName, title: fallbackTitle }

  const parenMatch = str.match(/^(.*?)\((.*?)\)$/)
  if (parenMatch && parenMatch[1] && parenMatch[2]) {
    return {
      name: parenMatch[1].trim() || fallbackName,
      title: parenMatch[2].trim() || fallbackTitle
    }
  }

  if (str.includes(' - ')) {
    const parts = str.split(' - ')
    return {
      name: parts[0]?.trim() || fallbackName,
      title: parts[1]?.trim() || fallbackTitle
    }
  }

  return {
    name: str.trim() || fallbackName,
    title: fallbackTitle
  }
}

export const SignatureVault = {
  /**
   * Retrieves saved organization signatures from LocalStorage
   */
  getSignatures() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          signatory_1: cleanOrganizationSignatoryName(parsed.signatory_1),
          signatory_2: cleanOrganizationSignatoryName(parsed.signatory_2),
          signatory_1_img: cleanOrganizationSignatoryImage(parsed.signatory_1_img),
          signatory_2_img: cleanOrganizationSignatoryImage(parsed.signatory_2_img)
        }
      }
    } catch (e) {
      console.warn('Failed to parse signature vault:', e)
    }

    return { ...emptyVault }
  },

  /**
   * Saves updated signatures into permanent vault
   */
  saveSignatures(data = {}) {
    const current = this.getSignatures()
    const updated = {
      signatory_1: data.signatory_1 || current.signatory_1,
      signatory_2: data.signatory_2 || current.signatory_2,
      signatory_1_img: data.signatory_1_img || current.signatory_1_img,
      signatory_2_img: data.signatory_2_img || current.signatory_2_img
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (e) {
      console.error('Failed to save signature vault:', e)
    }

    return updated
  }
}

export default SignatureVault
