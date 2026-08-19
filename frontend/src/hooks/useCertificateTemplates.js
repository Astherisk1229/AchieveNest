/**
 * useCertificateTemplates.js
 * Neutral React hook for subscribing to OSAD Certificate Template Registry updates.
 * Consumed neutrally by OSAD Studio, Award Categories, and Organization Moderator screens.
 */

import { useState, useEffect, useCallback } from 'react'
import CertificateTemplateController from '../controllers/CertificateTemplateController'

export function useCertificateTemplates(contextFilter = 'all') {
  const [templateFamilies, setTemplateFamilies] = useState(() => 
    CertificateTemplateController.getTemplateFamilies(contextFilter)
  )
  const [publishedTemplates, setPublishedTemplates] = useState(() => 
    CertificateTemplateController.getPublishedTemplates(contextFilter)
  )

  const refresh = useCallback(() => {
    setTemplateFamilies(CertificateTemplateController.getTemplateFamilies(contextFilter))
    setPublishedTemplates(CertificateTemplateController.getPublishedTemplates(contextFilter))
  }, [contextFilter])

  useEffect(() => {
    refresh()
    const unsubscribe = CertificateTemplateController.subscribe(refresh)
    return () => unsubscribe()
  }, [refresh])

  const createTemplate = useCallback((familyData, versionData, publisher) => {
    const res = CertificateTemplateController.createTemplateFamily(familyData, versionData, publisher)
    refresh()
    return res
  }, [refresh])

  const toggleStatus = useCallback((familyId) => {
    const res = CertificateTemplateController.toggleTemplateFamilyStatus(familyId)
    refresh()
    return res
  }, [refresh])

  return {
    templateFamilies,
    publishedTemplates,
    createTemplate,
    toggleStatus,
    refresh
  }
}

export default useCertificateTemplates
