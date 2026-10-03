import certificateTemplateService from '../services/certificateTemplateService'

/**
 * Compatibility adapter for governed certificate-template persistence.
 * It owns no registry: every read and mutation is delegated to the backend.
 */
export class CertificateTemplateController {
  static listFamilies(options) { return certificateTemplateService.listFamilies(options) }
  static getFamily(id, options) { return certificateTemplateService.getFamily(id, options) }
  static createFamily(payload) { return certificateTemplateService.createFamily(payload) }
  static createDraft(familyId, payload) { return certificateTemplateService.createDraft(familyId, payload) }
  static updateDraft(versionId, payload) { return certificateTemplateService.updateDraft(versionId, payload) }
  static validateDraft(versionId, expectedToken) { return certificateTemplateService.validateDraft(versionId, expectedToken) }
  static publishDraft(versionId, expectedToken) { return certificateTemplateService.publishDraft(versionId, expectedToken) }
  static getRegistry(options) { return certificateTemplateService.getRegistry(options) }
}

export default CertificateTemplateController
