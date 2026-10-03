import React, { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import CertificateTemplateEditorModal from '../../components/osad/CertificateTemplateEditorModal'
import { useCertificateTemplates } from '../../hooks/useCertificateTemplates'
import { OSADErrorState, OSADLoadingState } from '../../components/osad/OSADStateBlock'

const messageFrom = error => error?.error?.message || error?.message || 'The certificate studio could not be loaded.'
export default function CertificateStudioPage() {
  const { familyId, versionId } = useParams(); const navigate = useNavigate(); const templates = useCertificateTemplates(); const [isBusy, setIsBusy] = useState(false)
  const family = templates.templateFamilies.find(item => item.id === familyId); const draft = family?.draft_version
  const close = () => navigate('/osad/dashboard?tab=certificate-templates')
  const run = async operation => { setIsBusy(true); try { return await operation() } finally { setIsBusy(false) } }
  if (templates.isLoading && !family) return <OSADLoadingState message="Opening Certificate Studio…" />
  if (templates.error && !family) return <OSADErrorState title="Unable to open Certificate Studio" description={messageFrom(templates.error)} onRetry={() => templates.refresh().catch(() => {})} />
  if (!family || !draft || (versionId && draft.id !== versionId)) return <Navigate to="/osad/dashboard?tab=certificate-templates" replace />
  return <CertificateTemplateEditorModal isOpen onClose={close} family={family} registry={templates.registry} isBusy={isBusy} onSave={(id, payload) => run(() => templates.updateDraft(id, payload))} onValidate={(id, token) => run(() => templates.validateDraft(id, token))} onPublish={async (id, token) => { await run(() => templates.publishDraft(id, token)); close() }} />
}
