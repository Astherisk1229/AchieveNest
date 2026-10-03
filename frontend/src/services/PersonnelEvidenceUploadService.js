/**
 * PersonnelEvidenceUploadService.js
 *
 * Frontend service and validation layer for Plan I — Phase I1: Secure Upload Pipeline.
 * Enforces pre-flight checks (extension, size, MIME, magic bytes) and interfaces with the
 * canonical upload endpoint `/api/v1/personnel/accomplishments/:id/evidence`.
 */

import apiClient from './apiClient.js'
import SecurityController from '../controllers/SecurityController.js'

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MiB
export const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']
export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

export default class PersonnelEvidenceUploadService {
  /**
   * Pre-flight validates client-side file upload before network dispatch.
   * @param {File|Blob} file
   * @returns {Promise<{ isValid: boolean, error: string|null, sanitizedFilename?: string }>}
   */
  static async validateUploadPreflight(file) {
    if (!file) {
      return { isValid: false, error: 'No file selected for upload.' }
    }

    // 1. Size Check
    if (file.size <= 0) {
      return { isValid: false, error: 'Zero-byte or empty files are not permitted.' }
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { isValid: false, error: 'File size exceeds maximum allowed limit of 10 MiB.' }
    }

    // 2. Extension Check
    const filename = file.name || 'evidence.pdf'
    const cleanName = SecurityController.sanitizeFilename(filename)
    const ext = cleanName.split('.').pop().toLowerCase()

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { isValid: false, error: `Unsupported file extension .${ext}. Only PDF, JPG, and PNG are permitted.` }
    }

    // 3. Security Controller Magic Byte & MIME Check
    const secResult = await SecurityController.validateFileUpload(file)
    if (!secResult.isValid) {
      return { isValid: false, error: secResult.error }
    }

    return {
      isValid: true,
      error: null,
      sanitizedFilename: cleanName
    }
  }

  /**
   * Uploads evidence to an accomplishment via multipart/form-data.
   * @param {string} accomplishmentId
   * @param {File} file
   * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
   */
  static async uploadEvidence(accomplishmentId, file) {
    const preflight = await this.validateUploadPreflight(file)
    if (!preflight.isValid) {
      return { success: false, error: preflight.error }
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await apiClient.post(`/personnel/accomplishments/${accomplishmentId}/evidence`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return {
        success: true,
        data: res?.data || res
      }
    } catch (err) {
      const errMsg = err?.response?.data?.error?.message || err?.message || 'Failed to upload evidence file.'
      return {
        success: false,
        error: errMsg,
        status: err?.response?.status || 500
      }
    }
  }
}
