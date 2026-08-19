/**
 * signatureVault.js
 * Persistent Signature Vault for AchieveNest Organization Accounts & OSAD Signatories.
 * Manages stored digital signature PNG/SVG graphics and auto pre-fills them for new events.
 */

// Official SVG Signature Data URIs for Default Signatories
export const DEFAULT_SIG_1_IMG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60"><path d="M 20 40 Q 35 10 50 35 T 75 25 Q 90 45 110 20 Q 130 50 150 30 Q 170 15 185 35" fill="none" stroke="%231b4332" stroke-width="3" stroke-linecap="round"/><path d="M 40 45 C 70 50, 120 48, 165 42" fill="none" stroke="%231b4332" stroke-width="2.5" stroke-linecap="round"/><text x="140" y="22" font-family="serif" font-style="italic" font-size="14" fill="%231b4332" font-weight="bold">A. Reyes</text></svg>`

export const DEFAULT_SIG_2_IMG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60"><path d="M 15 25 Q 40 5 60 45 T 90 20 Q 115 55 140 15 Q 160 45 180 25" fill="none" stroke="%23854d0e" stroke-width="3" stroke-linecap="round"/><path d="M 30 48 C 65 52, 110 49, 175 44" fill="none" stroke="%23854d0e" stroke-width="2.5" stroke-linecap="round"/><text x="135" y="22" font-family="serif" font-style="italic" font-size="14" fill="%23854d0e" font-weight="bold">J. Dela Cruz</text></svg>`

const STORAGE_KEY = 'achievenest_signature_vault'

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
        return JSON.parse(saved)
      }
    } catch (e) {
      console.warn('Failed to parse signature vault:', e)
    }

    return {
      signatory_1: 'Dr. Ana Reyes (Club Moderator)',
      signatory_2: 'Prof. Juan Dela Cruz (OSAD Director)',
      signatory_1_img: DEFAULT_SIG_1_IMG,
      signatory_2_img: DEFAULT_SIG_2_IMG
    }
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
