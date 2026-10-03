/**
 * PersonnelProfilePhotoService.js
 *
 * Frontend service for Package B: Real Personnel Profile Photo Upload.
 * Implements client-side pre-flight validation (size, MIME, magic bytes, allowed formats)
 * and dispatches to `/api/v1/personnel/profile/photo`.
 */

import apiClient from './apiClient.js'
import SecurityController from '../controllers/SecurityController.js'

export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024 // 5 MiB
export const ALLOWED_PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
export const ALLOWED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default class PersonnelProfilePhotoService {
  /**
   * Pre-flight validates the selected image file before upload.
   * @param {File|Blob} file
   * @returns {Promise<{ isValid: boolean, error: string|null, sanitizedFilename?: string }>}
   */
  static async validatePhotoPreflight(file) {
    if (!file) {
      return { isValid: false, error: 'No image file selected.' }
    }

    // 1. Size Check
    if (file.size <= 0) {
      return { isValid: false, error: 'Zero-byte or empty files are not permitted.' }
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return { isValid: false, error: 'Photo size exceeds maximum allowed limit of 5 MB.' }
    }

    // 2. Extension Check
    const filename = file.name || 'avatar.jpg'
    const cleanName = SecurityController.sanitizeFilename(filename)
    const ext = cleanName.split('.').pop().toLowerCase()

    if (!ALLOWED_PHOTO_EXTENSIONS.includes(ext)) {
      return {
        isValid: false,
        error: `Unsupported file format .${ext}. Only JPG, PNG, and WebP images are allowed (SVG and other formats are rejected).`
      }
    }

    // 3. MIME type check
    if (file.type && !ALLOWED_PHOTO_MIME_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: `Invalid image type (${file.type}). Only JPEG, PNG, and WebP images are allowed.`
      }
    }

    // 4. Magic byte inspection
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
   * Uploads the validated profile photo to the server.
   * @param {File} file
   * @returns {Promise<{ data: { avatar_url: string, message: string } }>}
   */
  static async uploadProfilePhoto(file) {
    const preflight = await this.validatePhotoPreflight(file)
    if (!preflight.isValid) {
      throw new Error(preflight.error)
    }

    const formData = new FormData()
    formData.append('photo', file, preflight.sanitizedFilename)

    const res = await apiClient.post('/personnel/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return res?.data || res
  }

  /**
   * Removes the profile photo from the personnel profile.
   * @returns {Promise<{ data: { avatar_url: null, message: string } }>}
   */
  static async removeProfilePhoto() {
    const res = await apiClient.delete('/personnel/profile/photo')
    return res?.data || res
  }

  /**
   * Generates initials from a full name for avatar placeholder.
   * @param {string} name
   * @returns {string}
   */
  static getInitials(name) {
    if (!name || typeof name !== 'string') return 'PN'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
}
