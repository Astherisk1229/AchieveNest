import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  X,
  Save,
  AlertCircle,
  Sparkles,
  Building2,
  Lock
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { useConfirmableClose } from '../../../hooks/useConfirmableClose'
import { updateAcademicProgram } from '../../../services/collegeAdminService'

export default function EditProgramModal({
  isOpen,
  onClose,
  program,
  college,
  onSuccess
}) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [degreeLevel, setDegreeLevel] = useState('undergraduate')
  const [status, setStatus] = useState('active')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (program) {
      setCode(program.code || '')
      setName(program.name || '')
      setDegreeLevel(program.degree_level || 'undergraduate')
      setStatus(program.status || 'active')
      setError(null)
    }
  }, [program, isOpen])

  const handleReset = () => {
    if (program) {
      setCode(program.code || '')
      setName(program.name || '')
      setDegreeLevel(program.degree_level || 'undergraduate')
      setStatus(program.status || 'active')
    }
    setError(null)
  }

  const isDirty = () => {
    if (!program) return false
    return (
      code.trim().toUpperCase() !== (program.code || '').toUpperCase() ||
      name.trim() !== (program.name || '') ||
      degreeLevel !== (program.degree_level || 'undergraduate') ||
      status !== (program.status || 'active')
    )
  }

  const { isConfirmOpen, requestClose, confirmDiscard, cancelDiscard } = useConfirmableClose({
    isOpen,
    isDirty,
    onClose,
    onDiscard: handleReset
  })

  if (!isOpen || !program) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedCode = code.trim().toUpperCase()
    const trimmedName = name.trim()

    if (!trimmedCode || !trimmedName) {
      setError('Program code and degree title are required.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await updateAcademicProgram(program.id, {
        code: trimmedCode,
        name: trimmedName,
        degree_level: degreeLevel,
        status: status
      })

      setIsSubmitting(false)
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to update academic program.'
      )
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div
        onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) requestClose() }}
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-white dark:bg-[#131e2e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Edit Academic Program</h3>
                <p className="text-[11px] text-slate-400">
                  Update curriculum master data for [{program.code}]
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close dialog"
              disabled={isSubmitting}
              onClick={requestClose}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Parent College Badge (Read-Only) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Parent College</span>
              </label>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#16834a] text-white">
                  {college?.code || program.college_code || 'COLLEGE'}
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {college?.name || program.college_name || 'Parent Academic Division'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Program Code */}
              <div className="space-y-1 sm:col-span-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Program Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. BSCS"
                  maxLength={20}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:border-[#16834a]"
                />
              </div>

              {/* Degree Level */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Degree Level
                </label>
                <select
                  value={degreeLevel}
                  onChange={(e) => setDegreeLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a]"
                >
                  <option value="undergraduate">Undergraduate (Bachelor's)</option>
                  <option value="graduate">Graduate (Master's / Doctorate)</option>
                  <option value="certificate">Certificate Program</option>
                  <option value="diploma">Diploma Program</option>
                </select>
              </div>
            </div>

            {/* Program Name */}
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
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a]"
              />
            </div>

            {/* Status Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Program Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a] capitalize"
              >
                <option value="active">Active (Enrolling Students)</option>
                <option value="inactive">Inactive (Suspended)</option>
                <option value="archived">Archived (Legacy Curriculum)</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              Note: Program Coordinator appointments are managed independently via the Coordinator Coverage workspace.
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={requestClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="gap-1.5 shadow-xs px-5 py-2 font-bold"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Saving Changes...' : 'Save Program'}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Discard Program Changes?"
        message="Are you sure you want to close? Your unsaved changes to this Academic Program will be lost."
        confirmLabel="Discard Changes"
        cancelLabel="Continue Editing"
        onConfirm={confirmDiscard}
        onCancel={cancelDiscard}
      />
    </>
  )
}
