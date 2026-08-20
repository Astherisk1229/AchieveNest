/**
 * IssueCertificatesModal.jsx
 * 6-Step Stepper Modal for Bulk Certificate Issuance.
 */

import React, { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react'
import CertificateIssuanceController from '../../../../../controllers/CertificateIssuanceController'
import CertificateRecipientReview from './CertificateRecipientReview'
import CertificateTemplatePicker from './CertificateTemplatePicker'
import CertificateSignatoryResolver from './CertificateSignatoryResolver'
import CertificateIssuancePreview from './CertificateIssuancePreview'

export default function IssueCertificatesModal({ isOpen, onClose, events = [], onIssuanceComplete }) {
  const [step, setStep] = useState(1)
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || 'evt-1')
  const [selectedRecipients, setSelectedRecipients] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('tpl-workshop-01')
  const [resolvedSignatories, setResolvedSignatories] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [issuanceSuccess, setIssuanceSuccess] = useState(null)

  const publishedTemplates = CertificateIssuanceController.getPublishedTemplates()
  const approvedSignatories = CertificateIssuanceController.getApprovedSignatories()
  const selectedEvent = events.find(e => e.id === selectedEventId) || events[0] || { id: 'evt-1', title: 'Computer Society Tech Summit 2026' }
  const selectedTemplate = publishedTemplates.find(t => t.id === selectedTemplateId) || publishedTemplates[0]

  const eligibilityData = CertificateIssuanceController.getRecipientEligibility(selectedEventId)

  // Auto initialize eligible recipients
  useEffect(() => {
    if (eligibilityData?.students) {
      const eligibleIds = eligibilityData.students.filter(s => s.isEligible).map(s => s.id)
      setSelectedRecipients(eligibleIds)
    }
  }, [selectedEventId])

  // Auto initialize signatories
  useEffect(() => {
    if (selectedTemplate?.signatorySlots) {
      const initialMap = {}
      selectedTemplate.signatorySlots.forEach(slot => {
        const match = approvedSignatories.find(s => s.role === slot.defaultRole || s.status === 'approved')
        if (match) initialMap[slot.id] = match
      })
      setResolvedSignatories(initialMap)
    }
  }, [selectedTemplateId])

  if (!isOpen) return null

  const handleNext = () => {
    if (step < 6) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleConfirmIssuance = async () => {
    setIsSubmitting(true)
    const eligibleStudents = eligibilityData.students.filter(s => selectedRecipients.includes(s.id))
    const idempotencyKey = `batch_${selectedEventId}_${selectedTemplateId}_${Date.now()}`

    const res = CertificateIssuanceController.issueCertificateBatch({
      eventId: selectedEventId,
      eventTitle: selectedEvent.title,
      organizationId: 'org-cs',
      organizationName: 'Computer Society NDMU',
      templateId: selectedTemplateId,
      signatories: resolvedSignatories,
      recipients: eligibleStudents,
      idempotencyKey
    })

    setIsSubmitting(false)
    if (res.success) {
      setIssuanceSuccess(res.batch)
      if (onIssuanceComplete) onIssuanceComplete(res.batch)
    }
  }

  const sampleRecipient = eligibilityData.students.find(s => selectedRecipients.includes(s.id)) || eligibilityData.students[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Bulk Digital Certificate Issuance Hub
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Step {step} of 6 — {step === 1 ? 'Select Event' : step === 2 ? 'Review Recipients' : step === 3 ? 'Select OSAD Template' : step === 4 ? 'Resolve Signatories' : step === 5 ? 'Preview Certificate' : 'Confirm & Issue'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Indicator Bar */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {issuanceSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Bulk Issuance Completed Successfully!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Issued <strong>{issuanceSuccess.recipientCount} digital certificates</strong> for event <strong>{issuanceSuccess.eventTitle}</strong>. Credentials have been transmitted to students' portfolios.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#1b4332] text-white font-extrabold text-xs transition cursor-pointer"
              >
                Close & Return to Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* STEP 1: SELECT EVENT */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Select Organization Event for Certificate Issuance
                  </h3>
                  <div className="space-y-2">
                    {events.map(evt => (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEventId(evt.id)}
                        className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                          selectedEventId === evt.id
                            ? 'bg-emerald-50 border-emerald-400 dark:bg-emerald-950/60 dark:border-emerald-700 shadow-xs'
                            : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white">{evt.title}</p>
                          <p className="text-[10px] text-slate-500">{evt.date || 'AY 2025-2026'} • {evt.venue || 'NDMU Campus'}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px]">
                          Issuance Eligible
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: REVIEW RECIPIENTS */}
              {step === 2 && (
                <CertificateRecipientReview
                  eligibilityData={eligibilityData}
                  selectedRecipients={selectedRecipients}
                  setSelectedRecipients={setSelectedRecipients}
                />
              )}

              {/* STEP 3: SELECT OSAD TEMPLATE */}
              {step === 3 && (
                <CertificateTemplatePicker
                  templates={publishedTemplates}
                  selectedTemplateId={selectedTemplateId}
                  setSelectedTemplateId={setSelectedTemplateId}
                />
              )}

              {/* STEP 4: RESOLVE SIGNATORIES */}
              {step === 4 && (
                <CertificateSignatoryResolver
                  template={selectedTemplate}
                  approvedSignatories={approvedSignatories}
                  resolvedSignatories={resolvedSignatories}
                  setResolvedSignatories={setResolvedSignatories}
                />
              )}

              {/* STEP 5: PREVIEW CERTIFICATE */}
              {step === 5 && (
                <CertificateIssuancePreview
                  template={selectedTemplate}
                  selectedEvent={selectedEvent}
                  sampleRecipient={sampleRecipient}
                  resolvedSignatories={resolvedSignatories}
                />
              )}

              {/* STEP 6: CONFIRM & ISSUE */}
              {step === 6 && (
                <div className="space-y-6 text-center py-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 mx-auto">
                    <Sparkles className="w-7 h-7" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      Confirm Bulk Issuance
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      You are about to issue <strong>{selectedRecipients.length} digital certificates</strong> using template <strong>{selectedTemplate.title} ({selectedTemplate.code})</strong> for event <strong>{selectedEvent.title}</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 max-w-lg mx-auto text-left space-y-1">
                    <span className="font-extrabold block flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Idempotence & Automatic Delivery Warning
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Once confirmed, serial verification numbers will be generated and credentials will automatically appear in eligible students' portfolios as read-only verified items.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Modal Footer Controls */}
        {!issuanceSuccess && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1 || isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {step < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={selectedRecipients.length === 0}
                className="px-5 py-2 rounded-xl bg-[#1b4332] text-white font-extrabold text-xs hover:bg-[#143426] transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmIssuance}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Issuing Certificates...' : 'Confirm Bulk Issuance'}</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
