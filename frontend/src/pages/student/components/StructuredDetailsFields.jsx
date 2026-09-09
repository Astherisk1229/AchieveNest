import React, { useEffect } from 'react'
import { getSubcategorySchema } from '../../../config/portfolioFormSchemaRegistry'
import { AlertCircle, HelpCircle } from 'lucide-react'

/**
 * StructuredDetailsFields.jsx
 * Canonical Category-Specific Dynamic Form Renderer.
 * Renders structured metadata fields dynamically according to the selected Subcategory schema.
 */
export default function StructuredDetailsFields({
  subcategoryId,
  structuredMetadata = {},
  onChange,
  errors = {},
  disabled = false
}) {
  const schema = getSubcategorySchema(subcategoryId)

  // Ensure schema_version is set
  useEffect(() => {
    if (schema && (!structuredMetadata.schema_version || structuredMetadata.schema_version !== '1.0')) {
      if (onChange) {
        onChange({ ...structuredMetadata, schema_version: '1.0' })
      }
    }
  }, [schema, structuredMetadata, onChange])

  if (!schema || !schema.fields || schema.fields.length === 0) {
    return null
  }

  // Evaluate field visibility based on schema conditions
  const isFieldVisible = (field) => {
    if (!field.visibility) return true
    const targetValue = structuredMetadata[field.visibility.field]
    return targetValue === field.visibility.equals
  }

  const handleFieldChange = (key, value) => {
    const updated = {
      ...structuredMetadata,
      schema_version: '1.0',
      [key]: value
    }

    // Clear incompatible hidden values if controlling value changes
    schema.fields.forEach(f => {
      if (f.visibility && f.visibility.field === key) {
        if (value !== f.visibility.equals && updated[f.key] !== undefined) {
          delete updated[f.key]
        }
      }
    })

    if (onChange) {
      onChange(updated)
    }
  }

  return (
    <div className="space-y-4 pt-2" data-testid="structured-details-fields">
      {/* Section Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
          <span>Category-Specific Fields: {schema.subcategory_name}</span>
          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
            {schema.category_name}
          </span>
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Enter specific details regarding your participation and role for verified evaluation.
        </p>
      </div>

      {/* Dynamic Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {schema.fields.map(field => {
          if (!isFieldVisible(field)) return null

          const value = structuredMetadata[field.key] !== undefined 
            ? structuredMetadata[field.key] 
            : (field.defaultValue !== undefined ? field.defaultValue : '')
          const fieldError = errors[field.key]
          const isFullWidth = field.type === 'textarea' || field.fullWidth

          return (
            <div 
              key={field.key} 
              className={isFullWidth ? 'sm:col-span-2' : ''}
              data-testid={`structured-field-${field.key}`}
            >
              {/* Boolean Checkbox Type */}
              {field.type === 'boolean' ? (
                <div className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                  <input
                    id={`meta-${field.key}`}
                    name={field.key}
                    type="checkbox"
                    checked={Boolean(value)}
                    disabled={disabled}
                    onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#16834a] focus:ring-[#16834a]/20 border-slate-300 dark:border-slate-600"
                  />
                  <div>
                    <label htmlFor={`meta-${field.key}`} className="block text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                      {field.label} {field.required && <span className="text-rose-600 dark:text-rose-400">*</span>}
                    </label>
                    {field.helpText && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {field.helpText}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <label 
                    htmlFor={`meta-${field.key}`} 
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    {field.label} {field.required && <span className="text-rose-600 dark:text-rose-400" aria-hidden="true">*</span>}
                  </label>

                  {/* Select Dropdown Type */}
                  {field.type === 'select' ? (
                    <select
                      id={`meta-${field.key}`}
                      name={field.key}
                      value={value}
                      disabled={disabled}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      aria-required={field.required ? 'true' : 'false'}
                      aria-invalid={Boolean(fieldError)}
                      aria-describedby={fieldError ? `error-${field.key}` : (field.helpText ? `help-${field.key}` : undefined)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none transition ${
                        fieldError
                          ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-slate-200 dark:border-slate-700 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20'
                      }`}
                    >
                      <option value="">-- Select {field.label} --</option>
                      {field.options && field.options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'date' ? (
                    <input
                      id={`meta-${field.key}`}
                      name={field.key}
                      type="date"
                      value={value}
                      disabled={disabled}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      aria-required={field.required ? 'true' : 'false'}
                      aria-invalid={Boolean(fieldError)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none transition ${
                        fieldError
                          ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-slate-200 dark:border-slate-700 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20'
                      }`}
                    />
                  ) : field.type === 'number' ? (
                    <input
                      id={`meta-${field.key}`}
                      name={field.key}
                      type="number"
                      value={value}
                      disabled={disabled}
                      placeholder={field.placeholder || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
                      aria-required={field.required ? 'true' : 'false'}
                      aria-invalid={Boolean(fieldError)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none transition ${
                        fieldError
                          ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-slate-200 dark:border-slate-700 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20'
                      }`}
                    />
                  ) : (
                    <input
                      id={`meta-${field.key}`}
                      name={field.key}
                      type="text"
                      value={value}
                      disabled={disabled}
                      placeholder={field.placeholder || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      aria-required={field.required ? 'true' : 'false'}
                      aria-invalid={Boolean(fieldError)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none transition ${
                        fieldError
                          ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-slate-200 dark:border-slate-700 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20'
                      }`}
                    />
                  )}

                  {/* Help Text */}
                  {field.helpText && (
                    <p id={`help-${field.key}`} className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{field.helpText}</span>
                    </p>
                  )}

                  {/* Field Error */}
                  {fieldError && (
                    <p id={`error-${field.key}`} className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldError}</span>
                    </p>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
