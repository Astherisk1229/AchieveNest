import React, { useState, useEffect, useId } from 'react'
import { X, AlertCircle, Save, Send, AlertTriangle, Layers, CheckCircle2, FileCheck2 } from 'lucide-react'
import SharedAchievementFields from '../components/SharedAchievementFields'
import StructuredDetailsFields from '../components/StructuredDetailsFields'
import EvidenceUploadSection from '../components/EvidenceUploadSection'
import { getSubcategorySchema } from '../../../config/portfolioFormSchemaRegistry'
import portfolioService from '../../../services/portfolioService'

/**
 * Utility to check if structured metadata has meaningful student-entered data
 * (ignoring default/boilerplate keys like schema_version, default academic_year, semester).
 */
function hasMeaningfulStructuredData(metadata = {}) {
  const ignoredKeys = ['schema_version', 'academic_year', 'semester']
  return Object.entries(metadata).some(([key, val]) => {
    if (ignoredKeys.includes(key)) return false
    return val !== '' && val !== null && val !== undefined && val !== false
  })
}

export default function AchievementSubmissionModal({
  isOpen,
  onClose,
  onSubmitAchievement,
  initialData = null,
  taxonomy = []
}) {
  const modalTitleId = useId()

  // State Authority
  const [formData, setFormData] = useState({
    title: '',
    organizer_or_body: '',
    start_date: '',
    end_date: '',
    description: ''
  })
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [structuredMetadata, setStructuredMetadata] = useState({ schema_version: '1.0' })
  const [evidenceFiles, setEvidenceFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: null, // 'category' | 'subcategory' | 'close'
    pendingValue: null
  })

  // Prefill / Reset effect on open or initialData change
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title || initialData.event_name || '',
          organizer_or_body: initialData.organizer_or_body || initialData.issuer || '',
          start_date: initialData.start_date || initialData.date_achieved || '',
          end_date: initialData.end_date || '',
          description: initialData.description || ''
        })
        setCategoryId(initialData.category_id || '')
        setSubcategoryId(initialData.subcategory_id || '')
        setStructuredMetadata(initialData.structured_metadata || { schema_version: '1.0' })
        setEvidenceFiles(initialData.evidence || [])
      } else {
        setFormData({
          title: '',
          organizer_or_body: '',
          start_date: '',
          end_date: '',
          description: ''
        })
        setCategoryId('')
        setSubcategoryId('')
        setStructuredMetadata({ schema_version: '1.0' })
        setEvidenceFiles([])
      }
      setErrors({})
      setIsSubmitting(false)
      setConfirmDialog({ isOpen: false, type: null, pendingValue: null })
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  // Subcategories for currently selected Category
  const availableSubcategories = taxonomy.find(category => category.id === categoryId)?.subcategories || []
  const currentSchema = getSubcategorySchema(subcategoryId)
  const selectedCategory = taxonomy.find(category => category.id === categoryId)
  const selectedSubcategory = availableSubcategories.find(subcategory => subcategory.id === subcategoryId)
  const classificationComplete = Boolean(categoryId && subcategoryId)
  const basicInformationComplete = Boolean(
    formData.title.trim().length >= 3 &&
    formData.organizer_or_body.trim().length >= 2 &&
    formData.start_date
  )
  const tailoredDetailsComplete = Boolean(currentSchema?.fields?.every(field => {
    const visible = !field.visibility || structuredMetadata[field.visibility.field] === field.visibility.equals
    return !visible || !field.required || ![undefined, null, ''].includes(structuredMetadata[field.key])
  }))
  const evidenceComplete = evidenceFiles.length > 0
  const readyToSubmit = classificationComplete && basicInformationComplete && tailoredDetailsComplete && evidenceComplete

  // Handle Shared Field Changes
  const handleSharedChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  // Handle Category Change Request
  const handleCategorySelect = (newCatId) => {
    if (newCatId === categoryId) return

    if (hasMeaningfulStructuredData(structuredMetadata)) {
      // Prompt confirmation before discarding incompatible structured details
      setConfirmDialog({
        isOpen: true,
        type: 'category',
        pendingValue: newCatId
      })
    } else {
      // Apply directly
      applyCategoryChange(newCatId)
    }
  }

  const applyCategoryChange = (newCatId) => {
    setCategoryId(newCatId)
    setSubcategoryId('')
    setStructuredMetadata({ schema_version: '1.0' })
    setErrors(prev => {
      const next = { ...prev }
      delete next.category_id
      delete next.subcategory_id
      // Clear all structured metadata errors
      Object.keys(next).forEach(k => {
        if (k.startsWith('structured_metadata.')) {
          delete next[k]
        }
      })
      return next
    })
  }

  // Handle Subcategory Change Request
  const handleSubcategorySelect = (newSubId) => {
    if (newSubId === subcategoryId) return

    if (hasMeaningfulStructuredData(structuredMetadata)) {
      setConfirmDialog({
        isOpen: true,
        type: 'subcategory',
        pendingValue: newSubId
      })
    } else {
      applySubcategoryChange(newSubId)
    }
  }

  const applySubcategoryChange = (newSubId) => {
    setSubcategoryId(newSubId)
    setStructuredMetadata({ schema_version: '1.0' })
    setErrors(prev => {
      const next = { ...prev }
      delete next.subcategory_id
      Object.keys(next).forEach(k => {
        if (k.startsWith('structured_metadata.')) {
          delete next[k]
        }
      })
      return next
    })
  }

  // Handle Confirm Dialog Confirmation
  const handleConfirmDiscard = () => {
    if (confirmDialog.type === 'category') {
      applyCategoryChange(confirmDialog.pendingValue)
    } else if (confirmDialog.type === 'subcategory') {
      applySubcategoryChange(confirmDialog.pendingValue)
    } else if (confirmDialog.type === 'close') {
      onClose()
    }
    setConfirmDialog({ isOpen: false, type: null, pendingValue: null })
  }

  // Handle Confirm Dialog Cancellation
  const handleCancelDiscard = () => {
    setConfirmDialog({ isOpen: false, type: null, pendingValue: null })
  }

  // Evidence Handlers
  const handleAddFiles = (newFiles) => {
    setEvidenceFiles(prev => [...prev, ...newFiles])
    if (errors.evidence) {
      setErrors(prev => {
        const next = { ...prev }
        delete next.evidence
        return next
      })
    }
  }

  const handleRemoveFile = (index) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleReplaceFile = (index, file) => {
    setEvidenceFiles(prev => prev.map((entry, i) => i === index ? file : entry))
  }

  const handlePreviewFile = async (file) => {
    let blob
    if (file instanceof File) blob = file
    else if (file?.id) blob = await portfolioService.downloadEvidence(file.id)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const previewLink = document.createElement('a')
    previewLink.href = url
    previewLink.target = '_blank'
    previewLink.rel = 'noopener noreferrer'
    previewLink.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  // Client Validation
  const validateForm = (isSubmitNow, requireEvidence = isSubmitNow) => {
    const errs = {}

    // Draft permits incomplete work; Submit enforces all rules
    if (isSubmitNow) {
      if (!formData.title || formData.title.trim().length < 3) {
        errs.title = 'Title is required (minimum 3 characters).'
      }
      if (!formData.organizer_or_body || formData.organizer_or_body.trim().length < 2) {
        errs.organizer_or_body = 'Organizer / Issuing Body is required.'
      }
      if (!formData.start_date) {
        errs.start_date = 'Start date is required.'
      }
      if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
        errs.end_date = 'End date cannot be before start date.'
      }
      if (!categoryId) {
        errs.category_id = 'Primary Category is required.'
      }
      if (!subcategoryId) {
        errs.subcategory_id = 'Subcategory is required.'
      }
      if (requireEvidence && evidenceFiles.length === 0) {
        errs.evidence = 'At least one supporting evidence attachment is required before submitting.'
      }

      // Validate Schema-required structured fields
      if (currentSchema && currentSchema.fields) {
        currentSchema.fields.forEach(f => {
          // Check visibility
          const isVisible = !f.visibility || (structuredMetadata[f.visibility.field] === f.visibility.equals)
          if (isVisible && f.required) {
            const val = structuredMetadata[f.key]
            if (val === undefined || val === null || val === '') {
              errs[f.key] = `${f.label} is required.`
            }
          }
        })
      }
    } else {
      // Basic draft checks
      if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
        errs.end_date = 'End date cannot be before start date.'
      }
    }

    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0]
      window.setTimeout(() => {
        const fieldName = firstKey.startsWith('structured_metadata.') ? firstKey.split('.')[1] : firstKey
        const target = document.querySelector(`[name="${fieldName}"]`) || document.getElementById('evidence-file-input')
        target?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
        target?.focus?.()
      }, 0)
    }
    return Object.keys(errs).length === 0
  }

  // Submit / Save Action
  const handleSave = async (isSubmitNow) => {
    if (isSubmitting) return

    const isValid = validateForm(isSubmitNow)
    if (!isValid) return

    setIsSubmitting(true)
    try {
      const payload = {
        title: formData.title,
        organizer_or_body: formData.organizer_or_body,
        start_date: formData.start_date,
        occurrence_date: formData.start_date,
        end_date: formData.end_date || null,
        description: formData.description || null,
        category_id: categoryId || null,
        subcategory_id: subcategoryId || null,
        structured_metadata: {
          ...structuredMetadata,
          schema_version: '1.0'
        },
        evidence: evidenceFiles,
        submit_now: isSubmitNow
      }

      if (onSubmitAchievement) {
        await onSubmitAchievement(payload)
      }
      onClose()
    } catch (err) {
      const backendError = err?.error || err
      if (backendError?.errors) {
        setErrors(backendError.errors)
      } else {
        setErrors({ general: backendError?.message || 'Failed to save achievement record.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check dirty state on modal close
  const handleRequestClose = () => {
    const isDirty = formData.title.trim() !== '' ||
      formData.organizer_or_body.trim() !== '' ||
      categoryId !== '' ||
      evidenceFiles.length > 0 ||
      hasMeaningfulStructuredData(structuredMetadata)

    if (isDirty) {
      setConfirmDialog({
        isOpen: true,
        type: 'close',
        pendingValue: null
      })
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4" onKeyDown={(event) => { if (event.key === 'Escape' && !confirmDialog.isOpen) handleRequestClose() }}>
      <div
        className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-6 sm:py-4">
          <div className="min-w-0 pr-4">
            <h3 id={modalTitleId} className="truncate text-lg font-extrabold tracking-[-0.02em] text-slate-900 dark:text-slate-100">
              <span>{initialData ? 'Edit Achievement Record' : 'Add Achievement / Portfolio Record'}</span>
            </h3>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
              Classify the activity, add its details, and attach evidence for review.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16834a] dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 [scrollbar-color:#94a3b8_transparent] dark:[scrollbar-color:#475569_transparent] sm:px-6 sm:py-6">
          {errors.general && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-sm font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-200" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errors.general}</span>
            </div>
          )}

          <section className="space-y-3" aria-labelledby="classification-heading">
            <div className="flex items-center justify-between gap-3">
              <h4 id="classification-heading" className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                <Layers className="w-4 h-4 text-[#16834a]" />
                <span>Classification</span>
              </h4>
              {classificationComplete && <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Complete</span>}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="primary-category" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category <span className="text-rose-600 dark:text-rose-400">*</span>
                </label>
                <select
                  id="primary-category"
                  name="category_id"
                  value={categoryId}
                  disabled={isSubmitting}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  aria-required="true"
                  aria-invalid={Boolean(errors.category_id)}
                  aria-describedby={errors.category_id ? 'category-error' : undefined}
                  className={`min-h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 transition focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100 ${
                    errors.category_id
                      ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20'
                  }`}
                >
                  <option value="">{taxonomy.length ? 'Select a category' : 'Loading approved categories…'}</option>
                  {taxonomy.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p id="category-error" className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.category_id}</span>
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="portfolio-subcategory" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subcategory <span className="text-rose-600 dark:text-rose-400">*</span>
                </label>
                <select
                  id="portfolio-subcategory"
                  name="subcategory_id"
                  value={subcategoryId}
                  disabled={isSubmitting || !categoryId}
                  onChange={(e) => handleSubcategorySelect(e.target.value)}
                  aria-required="true"
                  aria-invalid={Boolean(errors.subcategory_id)}
                  aria-describedby={errors.subcategory_id ? 'subcategory-error' : undefined}
                  className={`min-h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 ${
                    errors.subcategory_id
                      ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20'
                  }`}
                >
                  <option value="">
                    {categoryId ? 'Select a subcategory' : 'Select a category first'}
                  </option>
                  {availableSubcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                {errors.subcategory_id && (
                  <p id="subcategory-error" className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.subcategory_id}</span>
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800" aria-label="Basic information">
            <SharedAchievementFields formData={formData} onChange={handleSharedChange} errors={errors} disabled={isSubmitting} />
          </section>

          <section className="border-t border-slate-200 pt-6 dark:border-slate-800" aria-live="polite">
            {subcategoryId ? (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <StructuredDetailsFields subcategoryId={subcategoryId} structuredMetadata={structuredMetadata} onChange={setStructuredMetadata} errors={errors} disabled={isSubmitting} />
              </div>
            ) : (
              <div className="py-3 text-sm text-slate-500 dark:text-slate-400">
                Choose a category and subcategory to reveal the relevant achievement details.
              </div>
            )}
          </section>

          <section className="border-t border-slate-200 pt-6 dark:border-slate-800" aria-label="Supporting evidence">
            <EvidenceUploadSection
              files={evidenceFiles}
              onAddFiles={handleAddFiles}
              onRemoveFile={handleRemoveFile}
              onReplaceFile={handleReplaceFile}
              onPreviewFile={handlePreviewFile}
              error={errors.evidence}
              required={true}
              disabled={isSubmitting}
            />
          </section>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          {readyToSubmit && (
            <div className="mb-3 flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span><strong>Ready to submit.</strong> {selectedCategory?.name} › {selectedSubcategory?.name} · {evidenceFiles.length} evidence file{evidenceFiles.length === 1 ? '' : 's'}.</span>
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleRequestClose}
              disabled={isSubmitting}
              className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16834a] disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button type="button" onClick={() => handleSave(false)} disabled={isSubmitting || !categoryId || formData.title.trim().length < 3} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16834a] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                <Save className="h-4 w-4" /><span>Save Draft</span>
              </button>
              <button type="button" onClick={() => handleSave(true)} disabled={isSubmitting} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#16834a] px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#126b3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16834a] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                <Send className="h-4 w-4" /><span>{isSubmitting ? 'Submitting…' : 'Submit for Verification'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {confirmDialog.type === 'close'
                    ? 'Discard unsaved changes?'
                    : confirmDialog.type === 'category'
                    ? 'Change category?'
                    : 'Change subcategory?'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {confirmDialog.type === 'close'
                    ? 'You have unsaved changes that will be lost if you close this form.'
                    : 'Changing this selection will clear the category-specific details you entered. Your Basic Information and uploaded evidence will be preserved.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCancelDiscard}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold transition cursor-pointer"
              >
                {confirmDialog.type === 'close' ? 'Discard & Close' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
