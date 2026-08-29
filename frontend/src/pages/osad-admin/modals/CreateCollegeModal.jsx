import React, { useState } from 'react'
import { Building2, X, Plus } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { useConfirmableClose } from '../../../hooks/useConfirmableClose'

export default function CreateCollegeModal({ isOpen, onClose, onSubmit }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const isDirty = () => code.trim() !== '' || name.trim() !== '' || description.trim() !== ''

  const handleReset = () => {
    setCode('')
    setName('')
    setDescription('')
    setError(null)
  }

  const { isConfirmOpen, requestClose, confirmDiscard, cancelDiscard } = useConfirmableClose({
    isOpen,
    isDirty,
    onClose,
    onDiscard: handleReset
  })

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim() || !name.trim()) {
      setError('College code and full name are required.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({ code: code.trim(), name: name.trim(), description: description.trim() })
      handleReset()
      setIsSubmitting(false)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create college.')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div
        onClick={(e) => { if (e.target === e.currentTarget) requestClose() }}
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white dark:bg-[#131e2e] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl font-sans"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
              <span>Create College</span>
            </h3>
            <button
              type="button"
              aria-label="Close dialog"
              onClick={requestClose}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs font-medium">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">College Code (Acronym)</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. CEAC"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:border-[#69A97C]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">College Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="College of Engineering, Architecture, and Computing"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#69A97C]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description (Optional)</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Academic division description..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#69A97C]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={requestClose}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Creating...' : 'Create College'}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Discard College Changes?"
        message="Are you sure you want to close? Your unsaved college details will be lost."
        confirmLabel="Discard Changes"
        cancelLabel="Continue Editing"
        onConfirm={confirmDiscard}
        onCancel={cancelDiscard}
      />
    </>
  )
}
