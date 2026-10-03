import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, RefreshCw, ShieldCheck, Sparkles, X } from 'lucide-react'
import certificateService from '../../../../../services/certificateService'
import {
  certificateReadinessErrorMessage,
  certificateIssuanceError,
  createCertificateIdempotencyKey,
  loadCertificateReadinessForEvent,
  normalizeCertificateReadiness,
  normalizeIssuedCertificate
} from '../../../../../services/certificateReadiness'
import CertificateRecipientReview from './CertificateRecipientReview'
import CertificateTemplatePicker from './CertificateTemplatePicker'
import CertificateSignatoryResolver from './CertificateSignatoryResolver'
import CertificateIssuancePreview from './CertificateIssuancePreview'

const STEP_LABELS = ['Select event', 'Review recipients', 'Compatible template', 'Signatory readiness', 'Unofficial preview']

export default function IssueCertificatesModal({ isOpen, onClose, events = [] }) {
  const [step, setStep] = useState(1)
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '')
  const [readinessState, setReadinessState] = useState('idle')
  const [recipientResults, setRecipientResults] = useState([])
  const [readinessError, setReadinessError] = useState(null)
  const [selectedRecipientId, setSelectedRecipientId] = useState(null)
  const [templateState, setTemplateState] = useState('idle')
  const [retryVersion, setRetryVersion] = useState(0)
  const [issuanceState, setIssuanceState] = useState('idle')
  const [issuedCertificate, setIssuedCertificate] = useState(null)
  const [issuanceError, setIssuanceError] = useState(null)
  const requestVersion = useRef(0)
  const issuanceRequestVersion = useRef(0)
  const issuanceAttempt = useRef(null)

  useEffect(() => {
    if (!selectedEventId && events[0]?.id) setSelectedEventId(events[0].id)
  }, [events, selectedEventId])

  const selectedEvent = useMemo(
    () => events.find(event => String(event.id) === String(selectedEventId)) || null,
    [events, selectedEventId]
  )
  const selectedRecipient = recipientResults.find(result => result.sourceRecord.id === selectedRecipientId) || recipientResults[0] || null

  useEffect(() => {
    if (!isOpen || !selectedEvent) return undefined
    const controller = new AbortController()
    const activeVersion = ++requestVersion.current

    setReadinessState('loading')
    setReadinessError(null)
    setRecipientResults([])

    loadCertificateReadinessForEvent(selectedEvent, { signal: controller.signal })
      .then(results => {
        if (controller.signal.aborted || activeVersion !== requestVersion.current) return
        setRecipientResults(results)
        setSelectedRecipientId(current => (results.find(result => result.sourceRecord.id === current) || results.find(result => result.readinessStatus === 'ISSUABLE') || results[0])?.sourceRecord.id || null)
        setReadinessState('loaded')
      })
      .catch(error => {
        if (controller.signal.aborted || activeVersion !== requestVersion.current) return
        setReadinessError(certificateReadinessErrorMessage(error))
        setReadinessState('error')
      })

    return () => controller.abort()
  }, [isOpen, selectedEvent, retryVersion])

  useEffect(() => {
    if (!isOpen) {
      requestVersion.current += 1
      setStep(1)
      setReadinessState('idle')
      setRecipientResults([])
      setReadinessError(null)
      setSelectedRecipientId(null)
      setIssuanceState('idle')
      setIssuedCertificate(null)
      setIssuanceError(null)
      issuanceAttempt.current = null
      issuanceRequestVersion.current += 1
    }
  }, [isOpen])

  if (!isOpen) return null

  const canContinue = step === 1
    ? Boolean(selectedEvent)
    : readinessState === 'loaded' && Boolean(selectedRecipient)

  const handleTemplateSelect = async template => {
    if (!selectedRecipient || issuanceState === 'issuing' || template.versionId === selectedRecipient.template?.versionId) return
    setIssuanceState('idle')
    setIssuedCertificate(null)
    setIssuanceError(null)
    issuanceAttempt.current = null
    setTemplateState('loading')
    try {
      const readiness = await certificateService.getReadiness({
        source_record_id: selectedRecipient.sourceRecord.id,
        template_version_id: template.versionId,
        signatories: selectedRecipient.signatories || {}
      })
      const updated = normalizeCertificateReadiness({ source_record_id: selectedRecipient.sourceRecord.id, student_id: selectedRecipient.studentId, student_name: selectedRecipient.studentName }, readiness, template)
      updated.compatibleTemplates = selectedRecipient.compatibleTemplates
      updated.signatories = selectedRecipient.signatories || {}
      setRecipientResults(current => current.map(result => result.sourceRecord.id === updated.sourceRecord.id ? updated : result))
      setTemplateState('loaded')
    } catch (error) {
      setReadinessError(certificateReadinessErrorMessage(error))
      setTemplateState('error')
    }
  }

  const refreshReadiness = () => setRetryVersion(version => version + 1)

  const handleIssue = async () => {
    if (!selectedRecipient || selectedRecipient.readinessStatus !== 'ISSUABLE' || !selectedRecipient.template?.versionId || issuanceState === 'issuing') return
    const contextKey = [selectedEvent?.id, selectedRecipient.sourceRecord.id, selectedRecipient.template.versionId].join(':')
    if (!issuanceAttempt.current || issuanceAttempt.current.contextKey !== contextKey) {
      issuanceAttempt.current = { contextKey, idempotencyKey: createCertificateIdempotencyKey() }
    }
    const activeVersion = ++issuanceRequestVersion.current
    setIssuanceState('issuing')
    setIssuanceError(null)
    try {
      const result = await certificateService.issueCertificate({
        source_record_id: selectedRecipient.sourceRecord.id,
        template_version_id: selectedRecipient.template.versionId,
        signatories: selectedRecipient.signatories || {},
        idempotency_key: issuanceAttempt.current.idempotencyKey
      })
      if (activeVersion !== issuanceRequestVersion.current) return
      if (result?.status === 'BLOCKED' || result?.issued === false && result?.status !== 'ALREADY_ISSUED') {
        const code = result?.code || result?.readiness?.blocking_reasons?.[0] || 'READINESS_CHANGED'
        setIssuanceError(certificateIssuanceError({ code }))
        setIssuanceState('issue_error')
        issuanceAttempt.current = null
        refreshReadiness()
        return
      }
      setIssuedCertificate(normalizeIssuedCertificate(result))
      setIssuanceState('issued')
      refreshReadiness()
    } catch (error) {
      if (activeVersion !== issuanceRequestVersion.current) return
      const normalizedError = certificateIssuanceError(error)
      setIssuanceError(normalizedError)
      setIssuanceState(normalizedError.ambiguous ? 'ambiguous' : 'issue_error')
      if (!normalizedError.ambiguous) issuanceAttempt.current = null
      if (!normalizedError.ambiguous && ['READINESS_CHANGED', 'CURRENT_CERTIFICATE_ALREADY_EXISTS', 'SOURCE_RECORD_NOT_VERIFIED', 'MISSING_PUBLISHED_TEMPLATE', 'REQUIRED_SIGNATORY_UNAVAILABLE'].includes(normalizedError.code)) refreshReadiness()
    }
  }

  const handleRecipientSelect = sourceRecordId => {
    if (issuanceState === 'issuing') return
    setSelectedRecipientId(sourceRecordId)
    setIssuanceState('idle')
    setIssuedCertificate(null)
    setIssuanceError(null)
    issuanceAttempt.current = null
  }

  const handleEventSelect = eventId => {
    if (issuanceState === 'issuing') return
    setSelectedEventId(eventId)
    setSelectedRecipientId(null)
    setIssuanceState('idle')
    setIssuedCertificate(null)
    setIssuanceError(null)
    issuanceAttempt.current = null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="certificate-modal-title"
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id="certificate-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-white">Certificate eligibility review</h2>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                Step {step} of {STEP_LABELS.length} — {STEP_LABELS[step - 1]}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={issuanceState === 'issuing'} aria-label={issuanceState === 'issuing' ? 'Certificate issuance is in progress' : 'Close certificate review'} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-white">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="px-5 pt-4 sm:px-6" aria-label="Certificate review progress">
          <div className="grid grid-cols-5 gap-2">
            {STEP_LABELS.map((label, index) => <div key={label} title={label} className={`h-1.5 rounded-full ${index + 1 <= step ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`} />)}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Choose an event context</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">The backend will evaluate only the source records linked to the selected event.</p>
              </div>
              {events.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">No event contexts are available.</div>
              ) : (
                <div className="space-y-2">
                  {events.map(event => (
                    <button key={event.id} type="button" onClick={() => handleEventSelect(event.id)} disabled={issuanceState === 'issuing'} aria-pressed={String(selectedEventId) === String(event.id)} className={`flex w-full min-w-0 items-start justify-between gap-3 rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60 ${String(selectedEventId) === String(event.id) ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950'}`}>
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-extrabold text-slate-900 dark:text-white">{event.title}</span>
                        <span className="mt-1 block text-xs text-slate-600 dark:text-slate-300">{[event.date, event.venue].filter(Boolean).join(' • ') || 'Event details unavailable'}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Backend candidates</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step > 1 && readinessState === 'loading' && (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center" role="status" aria-live="polite">
              <LoaderCircle className="h-8 w-8 animate-spin text-emerald-600" aria-hidden="true" />
              <div><p className="font-extrabold text-slate-900 dark:text-white">Evaluating certificate eligibility…</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Checking verified source records, templates, and readiness blockers.</p></div>
            </div>
          )}

          {step > 1 && readinessState === 'error' && (
            <div className="mx-auto flex min-h-64 max-w-lg flex-col items-center justify-center text-center" role="alert">
              <AlertTriangle className="h-9 w-9 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <h3 className="mt-3 font-extrabold text-slate-900 dark:text-white">{readinessError}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">No mock eligibility data has been substituted.</p>
              <button type="button" onClick={() => setRetryVersion(version => version + 1)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry
              </button>
            </div>
          )}

          {step > 1 && readinessState === 'loaded' && recipientResults.length === 0 && (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300" role="status">
              No certificate candidates were found for this event.
            </div>
          )}

          {step === 2 && readinessState === 'loaded' && recipientResults.length > 0 && <CertificateRecipientReview recipients={recipientResults} selectedRecipientId={selectedRecipient?.sourceRecord.id} onSelectRecipient={handleRecipientSelect} isDisabled={issuanceState === 'issuing'} />}
          {step === 3 && selectedRecipient && <CertificateTemplatePicker recipient={selectedRecipient} onSelectTemplate={handleTemplateSelect} isLoading={templateState === 'loading'} />}
          {step === 4 && selectedRecipient && <CertificateSignatoryResolver recipient={selectedRecipient} />}
          {step === 5 && selectedRecipient && (
            <div className="space-y-4">
              <CertificateIssuancePreview recipient={selectedRecipient} selectedEvent={selectedEvent} issuedCertificate={issuedCertificate} />
              {issuanceError && (
                <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100" role="alert">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div><p className="font-extrabold">Certificate issuance was not completed.</p><p className="mt-1 leading-relaxed">{issuanceError.message}</p></div>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <button type="button" onClick={() => setStep(current => Math.max(1, current - 1))} disabled={step === 1 || issuanceState === 'issuing' || issuanceState === 'issued'} className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
          </button>
          {step < STEP_LABELS.length ? (
            <button type="button" onClick={() => setStep(current => Math.min(STEP_LABELS.length, current + 1))} disabled={!canContinue || readinessState === 'error' || templateState === 'loading'} className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-extrabold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-slate-700 dark:disabled:text-slate-300">
              Continue <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            issuanceState === 'issued' ? (
              <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-extrabold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Done</button>
            ) : (
              <div className="text-right">
                <button type="button" onClick={handleIssue} disabled={selectedRecipient?.readinessStatus !== 'ISSUABLE' || !selectedRecipient?.template?.versionId || issuanceState === 'issuing'} aria-describedby="issuance-action-explanation" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-extrabold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-slate-700 dark:disabled:text-slate-300">
                  {issuanceState === 'issuing' ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Issuing certificate…</> : issuanceState === 'ambiguous' ? <><RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry safely</> : <><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Issue certificate</>}
                </button>
                <p id="issuance-action-explanation" className="mt-1 max-w-sm text-[11px] text-slate-600 dark:text-slate-300">The backend will recheck eligibility, template, signatories, and duplicates before issuing.</p>
              </div>
            )
          )}
        </footer>
      </section>
    </div>
  )
}
