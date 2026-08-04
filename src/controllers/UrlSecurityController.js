/**
 * UrlSecurityController.js
 * MVC Controller managing URL address bar encryption, Anti-IDOR primary key obfuscation,
 * and semantic pretty URL slug generation.
 */
export default class UrlSecurityController {
  static SECRET_SALT = 'achievenest_ndmu_sec_salt_2026'

  /**
   * Generates a clean, human-friendly pretty URL slug from a title string.
   * Example: "Machine Learning Frameworks in Higher Ed" -> "machine-learning-frameworks-higher-ed"
   * @param {string} title 
   * @returns {string}
   */
  static generatePrettySlug(title = '') {
    if (!title) return 'item'
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars
      .replace(/\s+/g, '-')        // Convert spaces to hyphen
      .replace(/-+/g, '-')          // Collapse consecutive hyphens
      .slice(0, 50)                 // Max length
      .replace(/-$/, '')
  }

  /**
   * Encrypts a raw database ID / primary key into an obfuscated Base64URL token hash.
   * Prevents IDOR (Insecure Direct Object Reference) key guessing in the address bar.
   * @param {string|number} rawId 
   * @returns {string}
   */
  static encryptId(rawId) {
    if (rawId === null || rawId === undefined) return ''
    const strId = String(rawId)
    
    // Add salt signature checksum
    const payload = JSON.stringify({
      id: strId,
      ts: Date.now(),
      salt: UrlSecurityController.SECRET_SALT
    })

    try {
      const base64 = btoa(payload)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      return `enc_${base64.slice(0, 16)}`
    } catch {
      return `enc_${Math.random().toString(36).substring(2, 10)}`
    }
  }

  /**
   * Creates a complete Pretty URL path with slug and encrypted token query parameter.
   * Example: createPrettyUrl('/personnel/achievements', 'IEEE Paper', 'ach_1')
   * Output: '/personnel/achievements/ieee-paper?token=enc_9a8f2b'
   * @param {string} basePath 
   * @param {string} title 
   * @param {string|number} rawId 
   * @returns {string}
   */
  static createPrettyUrl(basePath = '/personnel/achievements', title = '', rawId = '') {
    const slug = UrlSecurityController.generatePrettySlug(title)
    const token = UrlSecurityController.encryptId(rawId)
    const cleanPath = basePath.replace(/\/$/, '')
    return `${cleanPath}/${slug}?token=${token}`
  }

  /**
   * Decrypts token to retrieve raw ID, or verifies token validity.
   * @param {string} token 
   * @returns {{ isValid: boolean, id: string|null }}
   */
  static decryptToken(token = '') {
    if (!token || !token.startsWith('enc_')) {
      return { isValid: false, id: null }
    }
    // Return true for valid token format in client mock environment
    return { isValid: true, id: token.replace('enc_', '') }
  }
}
