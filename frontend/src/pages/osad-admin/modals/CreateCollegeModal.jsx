import React, { useState, useEffect } from 'react'
import {
  Building2,
  X,
  Plus,
  Upload,
  Image as ImageIcon,
  Trash2,
  GraduationCap,
  Sparkles,
  Info,
  RotateCcw
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { useConfirmableClose } from '../../../hooks/useConfirmableClose'
import { getAccessibleTextColor, isValidHex } from '../../../utils/colorContrast'

const DEFAULT_BADGE_COLOR = '#16834A'
const MAX_LOGO_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function CreateCollegeModal({ isOpen, onClose, onSubmit }) {
  // Identity & Branding states
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [badgeColor, setBadgeColor] = useState(DEFAULT_BADGE_COLOR)
  const [isCustomColor, setIsCustomColor] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null)

  // Nested Academic Programs state
  const [programsExpanded, setProgramsExpanded] = useState(false)
  const [programs, setPrograms] = useState([])

  // Submission & Validation states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Cleanup object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl)
      }
    }
  }, [logoPreviewUrl])

  const handleReset = () => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl)
    }
    setCode('')
    setName('')
    setDescription('')
    setBadgeColor(DEFAULT_BADGE_COLOR)
    setIsCustomColor(false)
    setLogoFile(null)
    setLogoPreviewUrl(null)
    setProgramsExpanded(false)
    setPrograms([])
    setError(null)
  }

  const isDirty = () => (
    code.trim() !== '' ||
    name.trim() !== '' ||
    description.trim() !== '' ||
    isCustomColor ||
    Boolean(logoFile) ||
    programs.length > 0
  )

  const { isConfirmOpen, requestClose, confirmDiscard, cancelDiscard } = useConfirmableClose({
    isOpen,
    isDirty,
    onClose,
    onDiscard: handleReset
  })

  if (!isOpen) return null

  // File selection handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP).')
      return
    }

    if (file.size > MAX_LOGO_SIZE) {
      setError('Logo file size must not exceed 5 MB.')
      return
    }

    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl)
    }

    setLogoFile(file)
    setLogoPreviewUrl(URL.createObjectURL(file))
    setError(null)
  }

  const handleRemoveLogo = () => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl)
    }
    setLogoFile(null)
    setLogoPreviewUrl(null)
  }

  // Nested programs handlers
  const handleAddProgram = () => {
    if (!programsExpanded) {
      setProgramsExpanded(true)
    }
    setPrograms((prev) => [
      ...prev,
      { id: `temp-prog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, code: '', name: '' }
    ])
  }

  const handleUpdateProgram = (index, field, value) => {
    setPrograms((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleRemoveProgram = (index) => {
    setPrograms((prev) => prev.filter((_, i) => i !== index))
  }

  // Color picker handler
  const handleColorChange = (newHex) => {
    setBadgeColor(newHex)
    setIsCustomColor(true)
  }

  const handleResetColor = () => {
    setBadgeColor(DEFAULT_BADGE_COLOR)
    setIsCustomColor(false)
  }

  // Derived accessible text color for preview
  const effectiveBadgeColor = isCustomColor ? badgeColor : DEFAULT_BADGE_COLOR
  const computedTextColor = getAccessibleTextColor(effectiveBadgeColor)

  const handleSubmit = async (e) => {
    e.preventDefault()

    const trimmedCode = code.trim().toUpperCase()
    const trimmedName = name.trim()
    const trimmedDesc = description.trim()

    if (!trimmedCode || !trimmedName) {
      setError('College code and full name are required.')
      return
    }

    if (isCustomColor && !isValidHex(badgeColor)) {
      setError('Please provide a valid 6-digit hex color (e.g. #16834A).')
      return
    }

    // Validate nested programs
    const validatedPrograms = []
    const programCodes = new Set()

    for (let i = 0; i < programs.length; i++) {
      const p = programs[i]
      const pCode = (p.code || '').trim().toUpperCase()
      const pName = (p.name || '').trim()

      if (!pCode && !pName) {
        continue // Ignore blank rows
      }

      if (!pCode || !pName) {
        setError(`Program #${i + 1}: Both program code and name are required.`)
        return
      }

      if (programCodes.has(pCode)) {
        setError(`Duplicate program code "${pCode}" in submitted batch.`)
        return
      }
      programCodes.add(pCode)

      validatedPrograms.push({ code: pCode, name: pName })
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (logoFile) {
        const formData = new FormData()
        formData.append('code', trimmedCode)
        formData.append('name', trimmedName)
        if (trimmedDesc) formData.append('description', trimmedDesc)
        if (isCustomColor) formData.append('acronym_badge_color', badgeColor.toUpperCase())
        formData.append('logo', logoFile)
        if (validatedPrograms.length > 0) {
          formData.append('programs', JSON.stringify(validatedPrograms))
        }
        await onSubmit(formData)
      } else {
        const payload = {
          code: trimmedCode,
          name: trimmedName,
          description: trimmedDesc || null,
          acronym_badge_color: isCustomColor ? badgeColor.toUpperCase() : null,
          programs: validatedPrograms
        }
        await onSubmit(payload)
      }

      handleReset()
      setIsSubmitting(false)
      onClose()
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to create college.')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div
        onClick={(e) => { if (e.target === e.currentTarget) requestClose() }}
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-white dark:bg-[#131e2e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden font-sans my-8 animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Modal Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Create College</h3>
                <p className="text-[11px] text-slate-400">Establish a university college and configure its branding identity.</p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close dialog"
              onClick={requestClose}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Live College Card Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Live Card Preview
                </span>
                <span className="text-[11px] text-slate-400">Auto-updates as you type</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Logo or Fallback Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {logoPreviewUrl ? (
                      <img src={logoPreviewUrl} alt="College Logo Preview" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span
                        className="text-base font-extrabold"
                        style={{ color: effectiveBadgeColor }}
                      >
                        {code.trim().slice(0, 3).toUpperCase() || 'COL'}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2.5 py-0.5 rounded-md text-xs font-extrabold shadow-2xs tracking-wide transition-colors"
                        style={{
                          backgroundColor: effectiveBadgeColor,
                          color: computedTextColor
                        }}
                      >
                        {code.trim().toUpperCase() || 'ACRONYM'}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1 truncate">
                      {name.trim() || 'College Full Name'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {description.trim() || 'Academic division description...'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-slate-500 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                    {programs.filter(p => p.code || p.name).length} {programs.filter(p => p.code || p.name).length === 1 ? 'Program' : 'Programs'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION A — College Identity & Branding */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-[#16834a]" />
                Section A: College Identity & Visual Branding
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* College Acronym / Code */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Acronym / Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. CEAC"
                    maxLength={20}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:border-[#16834a]"
                  />
                  <p className="text-[10px] text-slate-400">Unique abbreviation</p>
                </div>

                {/* College Full Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    College Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. College of Engineering, Architecture & Computing"
                    maxLength={150}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a]"
                  />
                  <p className="text-[10px] text-slate-400">Official institutional title</p>
                </div>
              </div>

              {/* Acronym Badge Color Picker */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>Acronym Badge Color</span>
                  </label>
                  {isCustomColor && (
                    <button
                      type="button"
                      onClick={handleResetColor}
                      className="text-[11px] text-[#16834a] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset to Default
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex items-center">
                    <input
                      type="color"
                      value={badgeColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      aria-label="Acronym Badge Color Picker"
                      className="w-10 h-10 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <input
                    type="text"
                    value={badgeColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    placeholder="#16834A"
                    maxLength={7}
                    className="w-28 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:border-[#16834a]"
                  />
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded-md text-xs font-extrabold shadow-2xs"
                      style={{
                        backgroundColor: effectiveBadgeColor,
                        color: computedTextColor
                      }}
                    >
                      {code.trim().toUpperCase() || 'PREVIEW'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Font color automatically optimized for WCAG readability.
                    </span>
                  </div>
                </div>
              </div>

              {/* College Logo Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>College Logo (Optional)</span>
                </label>

                {logoPreviewUrl ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <img
                        src={logoPreviewUrl}
                        alt="Staged logo"
                        className="w-10 h-10 object-contain rounded-lg bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-xs">
                          {logoFile?.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {(logoFile?.size / 1024).toFixed(1)} KB — Ready to upload
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer">
                        Replace
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Remove logo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 transition-colors">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Click to choose an official College logo
                    </span>
                    <span className="text-[10px] text-slate-400">
                      PNG, JPEG, or WebP up to 5 MB (Recommended: square / transparent PNG)
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Description Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  College Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of disciplines, departments, or college focus..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a]"
                />
              </div>
            </div>

            {/* SECTION B — Optional Academic Programs */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-[#16834a]" />
                    Section B: Academic Programs (Optional)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Programs can be added now or configured after the College is established.
                  </p>
                </div>

                {!programsExpanded && programs.length === 0 && (
                  <button
                    type="button"
                    onClick={handleAddProgram}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[#16834a] dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Academic Programs</span>
                  </button>
                )}
              </div>

              {programs.length > 0 && (
                <div className="space-y-3">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-900/30">
                    {programs.map((prog, idx) => (
                      <div key={prog.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 w-full">
                          <input
                            type="text"
                            value={prog.code}
                            onChange={(e) => handleUpdateProgram(idx, 'code', e.target.value)}
                            placeholder="Code (e.g. BSCS)"
                            maxLength={20}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:border-[#16834a]"
                          />
                          <input
                            type="text"
                            value={prog.name}
                            onChange={(e) => handleUpdateProgram(idx, 'name', e.target.value)}
                            placeholder="Degree Title (e.g. BS Computer Science)"
                            maxLength={150}
                            className="w-full sm:col-span-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveProgram(idx)}
                          aria-label={`Remove program ${idx + 1}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddProgram}
                    className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-xl text-xs font-bold text-[#16834a] dark:text-emerald-400 flex items-center justify-center gap-1.5 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Program</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={requestClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="gap-1.5 shadow-xs px-5 py-2 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Creating College...' : 'Create College'}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Discard College Changes?"
        message="Are you sure you want to close? Your unsaved college details and draft programs will be lost."
        confirmLabel="Discard Changes"
        cancelLabel="Continue Editing"
        onConfirm={confirmDiscard}
        onCancel={cancelDiscard}
      />
    </>
  )
}
