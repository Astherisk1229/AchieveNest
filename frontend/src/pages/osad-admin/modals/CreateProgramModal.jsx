import React, { useState, useEffect } from 'react'
import { GraduationCap, X, Plus, Building2, Sparkles } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { useConfirmableClose } from '../../../hooks/useConfirmableClose'
import { getAccessibleTextColor } from '../../../utils/colorContrast'

export default function CreateProgramModal({
  isOpen,
  onClose,
  onSubmit,
  colleges = [],
  initialCollegeId = null
}) {
  // Determine if College context is locked/scoped
  const isCollegeLocked = Boolean(
    initialCollegeId && colleges.some((c) => c.id === initialCollegeId)
  )

  const defaultCollegeId = isCollegeLocked
    ? initialCollegeId
    : colleges[0]?.id || ''

  const [collegeId, setCollegeId] = useState(defaultCollegeId)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Reset or update state whenever modal opens or initialCollegeId changes
  useEffect(() => {
    if (isOpen) {
      const activeCollegeId = isCollegeLocked
        ? initialCollegeId
        : colleges[0]?.id || ''
      setCollegeId(activeCollegeId)
      setCode('')
      setName('')
      setError(null)
    }
  }, [isOpen, initialCollegeId, isCollegeLocked, colleges])

  const isDirty = () => (
    code.trim() !== '' ||
    name.trim() !== '' ||
    (!isCollegeLocked && Boolean(defaultCollegeId) && collegeId !== defaultCollegeId)
  )

  const handleReset = () => {
    const activeCollegeId = isCollegeLocked
      ? initialCollegeId
      : colleges[0]?.id || ''
    setCollegeId(activeCollegeId)
    setCode('')
    setName('')
    setError(null)
  }

  const { isConfirmOpen, requestClose, confirmDiscard, cancelDiscard } = useConfirmableClose({
    isOpen,
    isDirty,
    onClose,
    onDiscard: handleReset
  })

  if (!isOpen) return null

  // Resolved active college object for display
  const activeCollege = colleges.find((c) => c.id === collegeId) || (isCollegeLocked ? null : colleges[0])
  const badgeBg = activeCollege?.acronym_badge_color || '#16834A'
  const badgeTextColor = getAccessibleTextColor(badgeBg)

  const handleSubmit = async (e) => {
    e.preventDefault()

    const trimmedCode = code.trim().toUpperCase()
    const trimmedName = name.trim()

    if (!collegeId) {
      setError('Please select a parent College for this academic program.')
      return
    }

    if (!trimmedCode || !trimmedName) {
      setError('Program code and degree title are required.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        college_id: collegeId,
        code: trimmedCode,
        name: trimmedName
      })
      handleReset()
      setIsSubmitting(false)
      onClose()
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to create Academic Program.')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div
        onClick={(e) => { if (e.target === e.currentTarget) requestClose() }}
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-white dark:bg-[#131e2e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Modal Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Create Academic Program</h3>
                <p className="text-[11px] text-slate-400">
                  {isCollegeLocked
                    ? `Adding new undergraduate degree under ${activeCollege?.code || 'College'}`
                    : 'Establish a new undergraduate academic degree program under a College.'}
                </p>
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
            <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-medium">
            {/* Parent College Section */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Parent College</span>
              </label>

              {isCollegeLocked ? (
                /* Read-Only College Card */
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="px-2.5 py-1 rounded-md text-xs font-extrabold shadow-2xs shrink-0"
                      style={{
                        backgroundColor: badgeBg,
                        color: badgeTextColor
                      }}
                    >
                      {activeCollege?.code || 'COLLEGE'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {activeCollege?.name || 'Selected College'}
                      </p>
                      <p className="text-[10px] text-slate-400">Fixed College Context (Read-Only)</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Global Selectable College Dropdown */
                <select
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a]"
                >
                  {colleges.length === 0 && (
                    <option value="">No active Colleges available</option>
                  )}
                  {colleges.map((college) => (
                    <option key={college.id} value={college.id}>
                      [{college.code}] {college.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Program Code */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Program Code (Acronym) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. BSCS, BSIT, BSA"
                maxLength={20}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:border-[#16834a]"
              />
              <p className="text-[10px] text-slate-400">Unique abbreviation for student records and coordinator queues</p>
            </div>

            {/* Program Name / Degree Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Academic Program Name (Degree Title) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bachelor of Science in Computer Science"
                maxLength={150}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a]"
              />
              <p className="text-[10px] text-slate-400">Official diploma and transcript title (Undergraduate degree level)</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                <span>{isSubmitting ? 'Creating Program...' : 'Create Program'}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Discard Program Changes?"
        message="Are you sure you want to close? Your unsaved academic program details will be lost."
        confirmLabel="Discard Changes"
        cancelLabel="Continue Editing"
        onConfirm={confirmDiscard}
        onCancel={cancelDiscard}
      />
    </>
  )
}
