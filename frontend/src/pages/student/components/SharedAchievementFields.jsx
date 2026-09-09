import React from 'react'
import { Calendar, Building, FileText, AlertCircle } from 'lucide-react'

/**
 * SharedAchievementFields.jsx
 * Canonical, category-neutral shared field layer for Student Achievement entry.
 * Renders Title, Organizer/Body, Start/End Dates, and Contextual Description.
 */
export default function SharedAchievementFields({
  formData = {},
  onChange,
  errors = {},
  isSubmitted = false,
  disabled = false
}) {
  const handleFieldChange = (field, value) => {
    if (onChange) {
      onChange(field, value)
    }
  }

  const {
    title = '',
    organizer_or_body = '',
    start_date = '',
    end_date = '',
    description = ''
  } = formData

  return (
    <div className="space-y-4" data-testid="shared-achievement-fields">
      {/* Header / Section Banner */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Basic Information
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Provide the general event and activity details common to all achievement records.
        </p>
      </div>

      {/* 1. Title / Event Name */}
      <div>
        <label htmlFor="shared-title" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Activity / Event Title <span className="text-rose-600 dark:text-rose-400" aria-hidden="true">*</span>
        </label>
        <input
          id="shared-title"
          name="title"
          type="text"
          value={title}
          disabled={disabled}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder="e.g. 12th Regional Undergraduate IT Research Symposium"
          aria-required="true"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'title-error' : undefined}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none transition ${
            errors.title
              ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
              : 'border-slate-200 dark:border-slate-700 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20'
          }`}
        />
        {errors.title && (
          <p id="title-error" className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errors.title}</span>
          </p>
        )}
      </div>

      {/* 2. Organizer / Issuing Body */}
      <div>
        <label htmlFor="shared-organizer" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Organizer / Issuing Body <span className="text-rose-600 dark:text-rose-400" aria-hidden="true">*</span>
        </label>
        <div className="relative">
          <input
            id="shared-organizer"
            name="organizer_or_body"
            type="text"
            value={organizer_or_body}
            disabled={disabled}
            onChange={(e) => handleFieldChange('organizer_or_body', e.target.value)}
            placeholder="e.g. NDMU CITE / DOST Region XII / University Student Government"
            aria-required="true"
            aria-invalid={Boolean(errors.organizer_or_body)}
            aria-describedby={errors.organizer_or_body ? 'organizer-error' : undefined}
            className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none transition ${
              errors.organizer_or_body
                ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                : 'border-slate-200 dark:border-slate-700 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20'
            }`}
          />
          <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        {errors.organizer_or_body && (
          <p id="organizer-error" className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errors.organizer_or_body}</span>
          </p>
        )}
      </div>

      {/* 3. Dates (Start Date & End Date) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="shared-start-date" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Activity Date / Start Date <span className="text-rose-600 dark:text-rose-400" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <input
              id="shared-start-date"
              name="start_date"
              type="date"
              value={start_date}
              disabled={disabled}
              onChange={(e) => handleFieldChange('start_date', e.target.value)}
              aria-required="true"
              aria-invalid={Boolean(errors.start_date)}
              aria-describedby={errors.start_date ? 'start-date-error' : undefined}
              className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none transition ${
                errors.start_date
                  ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20'
              }`}
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {errors.start_date && (
            <p id="start-date-error" className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.start_date}</span>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="shared-end-date" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            End Date <span className="text-slate-400 text-[11px] font-normal">(Optional for single-day events)</span>
          </label>
          <div className="relative">
            <input
              id="shared-end-date"
              name="end_date"
              type="date"
              value={end_date}
              disabled={disabled}
              min={start_date || undefined}
              onChange={(e) => handleFieldChange('end_date', e.target.value)}
              aria-invalid={Boolean(errors.end_date)}
              aria-describedby={errors.end_date ? 'end-date-error' : undefined}
              className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none transition ${
                errors.end_date
                  ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20'
              }`}
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {errors.end_date && (
            <p id="end-date-error" className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.end_date}</span>
            </p>
          )}
        </div>
      </div>

      {/* 4. Description / Contextual Narrative */}
      <div>
        <label htmlFor="shared-description" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Narrative Description / Context <span className="text-slate-400 text-[11px] font-normal">(Optional)</span>
        </label>
        <textarea
          id="shared-description"
          name="description"
          rows={3}
          value={description}
          disabled={disabled}
          maxLength={1000}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder="Brief overview or background context regarding your participation..."
          aria-describedby="description-help"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20 focus:outline-none transition resize-none"
        />
        <p id="description-help" className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Provide brief context about the activity. Do not use this field for placement, level, role, or other structured details requested in Category-Specific Fields.
        </p>
      </div>
    </div>
  )
}
