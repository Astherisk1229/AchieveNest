import { useCallback, useEffect, useState } from 'react'
import CertificateTemplateController from '../controllers/CertificateTemplateController'

export function useCertificateTemplates() {
  const [templateFamilies, setTemplateFamilies] = useState([])
  const [registry, setRegistry] = useState({ placeholders: [], signatory_roles: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async ({ signal } = {}) => {
    setIsLoading(true)
    setError(null)
    try {
      const [families, governanceRegistry] = await Promise.all([
        CertificateTemplateController.listFamilies({ signal }),
        CertificateTemplateController.getRegistry({ signal })
      ])
      setTemplateFamilies(families)
      setRegistry(governanceRegistry || { placeholders: [], signatory_roles: [] })
      return families
    } catch (nextError) {
      if (nextError?.name !== 'CanceledError' && nextError?.code !== 'ERR_CANCELED') setError(nextError)
      throw nextError
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    refresh({ signal: controller.signal }).catch(() => {})
    return () => controller.abort()
  }, [refresh])

  const mutate = useCallback(async (operation) => {
    setError(null)
    const result = await operation()
    await refresh()
    return result
  }, [refresh])

  return {
    templateFamilies,
    registry,
    isLoading,
    error,
    refresh,
    createFamily: (payload) => mutate(() => CertificateTemplateController.createFamily(payload)),
    createDraft: (familyId, payload) => mutate(() => CertificateTemplateController.createDraft(familyId, payload)),
    updateDraft: (versionId, payload) => mutate(() => CertificateTemplateController.updateDraft(versionId, payload)),
    validateDraft: (versionId, expectedToken) => mutate(() => CertificateTemplateController.validateDraft(versionId, expectedToken)),
    publishDraft: (versionId, expectedToken) => mutate(() => CertificateTemplateController.publishDraft(versionId, expectedToken))
  }
}

export default useCertificateTemplates
