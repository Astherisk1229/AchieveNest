import React, { useState, useEffect, useId } from 'react'
import { X, AlertCircle, Save, Send, AlertTriangle, Layers, Tag } from 'lucide-react'
import SharedAchievementFields from '../components/SharedAchievementFields'
import StructuredDetailsFields from '../components/StructuredDetailsFields'
import EvidenceUploadSection from '../components/EvidenceUploadSection'
import {
  PRIMARY_CATEGORIES,
  getSubcategoriesByCategory,
  getSubcategorySchema
} from '../../../config/portfolioFormSchemaRegistry'

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
  initialData = null
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
  const availableSubcategories = getSubcategoriesByCategory(categoryId)
  const currentSchema = getSubcategorySchema(subcategoryId)

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

  // Client Validation
  const validateForm = (isSubmitNow) => {
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
      if (evidenceFiles.length === 0) {
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
      if (err.errors) {
        setErrors(err.errors)
      } else {
        setErrors({ general: err.message || 'Failed to save achievement record.' })
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 id={modalTitleId} className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{initialData ? 'Edit Achievement Record' : 'Add Achievement / Portfolio Record'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter your verified co-curricular and extra-curricular accomplishment details.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* General Error Banner */}
          {errors.general && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* 1. Basic Information (Shared Core Fields) */}
          <SharedAchievementFields
            formData={formData}
            onChange={handleSharedChange}
            errors={errors}
            disabled={isSubmitting}
          />

          {/* 2. Classification Section (Primary Category & Subcategory) */}
          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#16834a]" />
                <span>Classification</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select the primary activity domain and specific subcategory to load required details.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Primary Category Selector */}
              <div>
                <label htmlFor="primary-category" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Category <span className="text-rose-600 dark:text-rose-400">*</span>
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
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none transition ${
                    errors.category_id
                      ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20'
                  }`}
                >
                  <option value="">-- Select Primary Category --</option>
                  {PRIMARY_CATEGORIES.map(cat => (
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

              {/* Subcategory Selector */}
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
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed ${
                    errors.subcategory_id
                      ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20'
                  }`}
                >
                  <option value="">
                    {categoryId ? '-- Select Subcategory --' : 'Select a primary category first'}
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
          </div>

          {/* 3. Structured Details Region (Dynamically mounted when Subcategory is selected) */}
          {subcategoryId ? (
            <StructuredDetailsFields
              subcategoryId={subcategoryId}
              structuredMetadata={structuredMetadata}
              onChange={setStructuredMetadata}
              errors={errors}
              disabled={isSubmitting}
            />
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500">
              Select a primary category and subcategory above to reveal specific participation details.
            </div>
          )}

          {/* 4. Supporting Evidence Section */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <EvidenceUploadSection
              files={evidenceFiles}
              onAddFiles={handleAddFiles}
              onRemoveFile={handleRemoveFile}
              error={errors.evidence}
              required={true}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={handleRequestClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            {/* Save Draft Button */}
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>Save Draft</span>
            </button>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#16834a] hover:bg-[#126b3c] text-white text-xs font-extrabold shadow-sm hover:shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit for Verification'}</span>
            </button>
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
