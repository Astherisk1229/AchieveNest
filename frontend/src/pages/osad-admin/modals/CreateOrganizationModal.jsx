import React, { useState, useEffect } from 'react'
import { Users, X, Plus, Upload, Image as ImageIcon, Trash2, Info, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { useConfirmableClose } from '../../../hooks/useConfirmableClose'

export const ORGANIZATION_CATEGORIES = [
  { value: 'academic_college', label: 'Academic / College-Based' },
  { value: 'co_curricular', label: 'Co-Curricular' },
  { value: 'special_interest', label: 'Special Interest' },
  { value: 'socio_cultural', label: 'Socio-Cultural' },
  { value: 'religious', label: 'Religious' },
  { value: 'sports', label: 'Sports' },
  { value: 'student_council', label: 'Student Council' }
]

export const ORGANIZATION_SCOPES = [
  { value: 'university', label: 'University-wide' },
  { value: 'college', label: 'College' },
  { value: 'program', label: 'Academic Program' }
]

const MAX_LOGO_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function CreateOrganizationModal({
  isOpen,
  onClose,
  onSubmit,
  colleges = [],
  degreePrograms = []
}) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState('academic_college')
  const [scope, setScope] = useState('university')
  const [collegeId, setCollegeId] = useState(colleges[0]?.id || '')
  const [selectedProgramIds, setSelectedProgramIds] = useState([])
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Update default collegeId when colleges prop updates
  useEffect(() => {
    if (colleges.length > 0 && !collegeId) {
      setCollegeId(colleges[0].id)
    }
  }, [colleges, collegeId])

  // Filter programs based on selected college
  const filteredPrograms = degreePrograms.filter(
    (p) => !collegeId || p.college_id === collegeId || p.collegeId === collegeId
  )

  const handleReset = () => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl)
    }
    setName('')
    setCode('')
    setCategory('academic_college')
    setScope('university')
    setCollegeId(colleges[0]?.id || '')
    setSelectedProgramIds([])
    setLogoFile(null)
    setLogoPreviewUrl(null)
    setError(null)
  }

  const isDirty = () => (
    name.trim() !== '' ||
    code.trim() !== '' ||
    category !== 'academic_college' ||
    scope !== 'university' ||
    (Boolean(colleges[0]?.id) && collegeId !== colleges[0]?.id) ||
    selectedProgramIds.length > 0 ||
    Boolean(logoFile)
  )

  const { isConfirmOpen, requestClose, confirmDiscard, cancelDiscard } = useConfirmableClose({
    isOpen,
    isDirty,
    onClose,
    onDiscard: handleReset
  })

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl)
      }
    }
  }, [logoPreviewUrl])

  if (!isOpen) return null

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

    setError(null)
    setLogoFile(file)
    setLogoPreviewUrl(URL.createObjectURL(file))
  }

  const handleRemoveLogo = () => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl)
    }
    setLogoFile(null)
    setLogoPreviewUrl(null)
  }

  const handleProgramToggle = (progId) => {
    setSelectedProgramIds((prev) =>
      prev.includes(progId) ? prev.filter((id) => id !== progId) : [...prev, progId]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) {
      setError('Organization name and acronym / code are required.')
      return
    }

    if (scope === 'college' && !collegeId) {
      setError('Please select a college for this college-scoped organization.')
      return
    }

    if (scope === 'program' && selectedProgramIds.length === 0) {
      setError('Please select at least one academic program affiliation.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('code', code.trim().toUpperCase())
      formData.append('category', category)
      formData.append('scope', scope)

      if (scope === 'college' || scope === 'program') {
        formData.append('college_id', collegeId)
      }

      if (scope === 'program') {
        formData.append('program_ids', JSON.stringify(selectedProgramIds))
      }

      if (logoFile) {
        formData.append('logo', logoFile)
      }

      await onSubmit(formData, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category,
        scope,
        college_id: collegeId,
        program_ids: selectedProgramIds,
        logo: logoFile
      })

      handleReset()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to create student organization.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div
        onClick={(e) => { if (e.target === e.currentTarget) requestClose() }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-[#16834a] flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Create Student Organization
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Register a recognized student council, academic society, or club.
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close dialog"
              onClick={requestClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
            {/* Organization Name & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Organization Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science Society"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a] transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Acronym / Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CSS"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={30}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:border-[#16834a] transition"
                  required
                />
              </div>
            </div>

            {/* Category Classification */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Category Classification <span className="text-rose-500">*</span>
                </label>
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a] transition cursor-pointer"
              >
                {ORGANIZATION_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 leading-tight">
                Category Classification describes what type of student organization this is. It is used for organization grouping/filtering and does not determine student awards.
              </p>
            </div>

            {/* Academic Scope */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Academic Scope <span className="text-rose-500">*</span>
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a] transition cursor-pointer"
              >
                {ORGANIZATION_SCOPES.map((sc) => (
                  <option key={sc.value} value={sc.value}>
                    {sc.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Conditional College Selection */}
            {(scope === 'college' || scope === 'program') && (
              <div className="space-y-1 animate-in fade-in duration-150">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  College Affiliation <span className="text-rose-500">*</span>
                </label>
                <select
                  value={collegeId}
                  onChange={(e) => {
                    setCollegeId(e.target.value)
                    setSelectedProgramIds([])
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a] transition cursor-pointer"
                >
                  {colleges.map((col) => (
                    <option key={col.id} value={col.id}>
                      [{col.code}] {col.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Conditional Program Affiliation Selection */}
            {scope === 'program' && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Academic Program Affiliation(s) <span className="text-rose-500">*</span>
                </label>
                {filteredPrograms.length === 0 ? (
                  <p className="text-[11px] text-amber-600 font-medium">
                    No academic programs found under selected college.
                  </p>
                ) : (
                  <div className="max-h-32 overflow-y-auto space-y-1 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    {filteredPrograms.map((prog) => {
                      const isChecked = selectedProgramIds.includes(prog.id)
                      return (
                        <label
                          key={prog.id}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer text-[11px] font-semibold text-slate-800 dark:text-slate-200"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleProgramToggle(prog.id)}
                            className="rounded text-[#16834a] focus:ring-[#16834a]"
                          />
                          <span>
                            [{prog.code}] {prog.name}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Organization Logo (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Organization Logo (Optional)
              </label>

              {logoPreviewUrl ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  <img
                    src={logoPreviewUrl}
                    alt="Logo preview"
                    className="w-12 h-12 rounded-xl object-contain bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 shadow-2xs shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {logoFile?.name || 'Selected Logo'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      {((logoFile?.size || 0) / 1024).toFixed(1)} KB • Image Ready
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                    title="Remove logo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#16834a] rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 hover:bg-emerald-50/30 transition cursor-pointer text-center group">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#16834a] mb-1 transition" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-[#16834a]">
                    Click to upload organization logo
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    JPEG, PNG, or WebP (max 5 MB)
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Moderator Workflow Notice */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Moderator assignment is managed as a separate post-creation workflow from the Student Organizations directory.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={requestClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-1.5 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Organization</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Discard Confirmation Dialog */}
      <ConfirmDialog
        open={isConfirmOpen}
        title="Discard New Organization Draft?"
        message="Are you sure you want to close? All entered organization details and uploaded logo will be lost."
        confirmLabel="Discard Changes"
        cancelLabel="Continue Editing"
        onConfirm={confirmDiscard}
        onCancel={cancelDiscard}
      />
    </>
  )
}
