import React, { useEffect, useState } from 'react'
import { AlertCircle, Building2, ImagePlus, Save, X } from 'lucide-react'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { useConfirmableClose } from '../../../hooks/useConfirmableClose'
import { getCollegeLogoUrl, updateCollege } from '../../../services/collegeAdminService'
import { getAccessibleTextColor } from '../../../utils/colorContrast'

const DEFAULT_BADGE = '#16834A'
const MAX_LOGO_BYTES = 5 * 1024 * 1024
const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Edits a College's identity. Programs, Dean assignment and lifecycle status are managed elsewhere. */
export default function EditCollegeModal({ isOpen, onClose, college, onSuccess }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [badgeColor, setBadgeColor] = useState(DEFAULT_BADGE)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const initial = () => {
    setCode(college?.code || '')
    setName(college?.name || '')
    setDescription(college?.description || '')
    setBadgeColor((college?.acronym_badge_color || DEFAULT_BADGE).toUpperCase())
    setLogoFile(null)
    setLogoPreviewUrl(null)
    setError(null)
  }

  useEffect(() => { if (college) initial() }, [college, isOpen]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl) }, [logoPreviewUrl])

  const isDirty = () => Boolean(college) && (
    code.trim().toUpperCase() !== (college.code || '').toUpperCase() ||
    name.trim() !== (college.name || '') ||
    description.trim() !== (college.description || '') ||
    badgeColor.toUpperCase() !== (college.acronym_badge_color || DEFAULT_BADGE).toUpperCase() ||
    Boolean(logoFile)
  )

  const { isConfirmOpen, requestClose, confirmDiscard, cancelDiscard } = useConfirmableClose({ isOpen, isDirty, onClose, onDiscard: initial })

  if (!isOpen || !college) return null

  const currentLogoUrl = college.has_logo || college.logo_storage_key ? getCollegeLogoUrl(college.id) : null
  const validHex = /^#[0-9A-Fa-f]{6}$/.test(badgeColor)

  const chooseLogo = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) { setError('Invalid image format. Allowed formats: JPEG, PNG, WebP.'); return }
    if (file.size > MAX_LOGO_BYTES) { setError('Logo file size must not exceed 5 MB.'); return }
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
    setLogoFile(file)
    setLogoPreviewUrl(URL.createObjectURL(file))
    setError(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedCode = code.trim().toUpperCase()
    const trimmedName = name.trim()
    if (!trimmedCode || !trimmedName) { setError('College code and name are required.'); return }
    if (!validHex) { setError('Acronym badge color must be a 6-digit hex value, e.g. #16834A.'); return }

    const formData = new FormData()
    formData.append('code', trimmedCode)
    formData.append('name', trimmedName)
    formData.append('description', description.trim())
    formData.append('acronym_badge_color', badgeColor.toUpperCase())
    if (logoFile) formData.append('logo', logoFile)

    setIsSubmitting(true)
    setError(null)
    try {
      const updated = await updateCollege(college.id, formData)
      setIsSubmitting(false)
      if (onSuccess) await onSuccess(updated)
      onClose()
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to update College.')
      setIsSubmitting(false)
    }
  }

  const input = 'w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a]'

  return (
    <>
      <div onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) requestClose() }} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div role="dialog" aria-modal="true" aria-labelledby="edit-college-title" onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-[#131e2e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center"><Building2 className="w-4 h-4" /></div>
              <div>
                <h3 id="edit-college-title" className="text-sm font-bold tracking-tight">Edit College</h3>
                <p className="text-[11px] text-slate-400">Update College information for [{college.code}]</p>
              </div>
            </div>
            <button type="button" aria-label="Close dialog" disabled={isSubmitting} onClick={requestClose} className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer disabled:opacity-50"><X className="w-4 h-4" /></button>
          </div>

          {error && (
            <div role="alert" className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" /><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="space-y-1 sm:col-span-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">College Code <span className="text-rose-500">*</span></span>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value)} maxLength={20} placeholder="e.g. CET" className={`${input} font-bold uppercase`} />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">College Name <span className="text-rose-500">*</span></span>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={150} placeholder="e.g. College of Engineering and Technology" className={input} />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="e.g. Engineering, Computing, and Architecture Disciplines" className={input} />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Acronym Badge Color</span>
                <div className="flex items-center gap-2">
                  <input type="color" aria-label="Pick badge color" value={validHex ? badgeColor : DEFAULT_BADGE} onChange={(e) => setBadgeColor(e.target.value.toUpperCase())} className="h-9 w-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer" />
                  <input type="text" aria-label="Badge color hex value" value={badgeColor} onChange={(e) => setBadgeColor(e.target.value.toUpperCase())} maxLength={7} className={`${input} font-mono`} />
                  <span className="px-2 py-1 rounded text-[11px] font-extrabold shrink-0" style={{ backgroundColor: validHex ? badgeColor : DEFAULT_BADGE, color: getAccessibleTextColor(validHex ? badgeColor : DEFAULT_BADGE) }}>{code.trim().toUpperCase() || 'CODE'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">College Logo</span>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white flex items-center justify-center overflow-hidden shrink-0">
                    {logoPreviewUrl || currentLogoUrl ? <img src={logoPreviewUrl || currentLogoUrl} alt="College logo" className="w-full h-full object-contain p-0.5" /> : <Building2 className="w-4 h-4 text-slate-400" />}
                  </div>
                  <label className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                    <ImagePlus className="w-3.5 h-3.5" /><span>{logoFile ? 'Change' : 'Replace logo'}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseLogo} className="sr-only" />
                  </label>
                </div>
                {logoFile && <p className="text-[11px] text-slate-500 truncate">{logoFile.name}</p>}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              Programs, coordinators, and archiving are managed from the College page. The Dean is assigned by HR.
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button type="button" disabled={isSubmitting} onClick={requestClose} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={isSubmitting || !isDirty()} className="px-4 py-2 rounded-xl bg-[#1B4D3E] hover:bg-[#143B30] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                <Save className="w-3.5 h-3.5" /><span>{isSubmitting ? 'Saving…' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      <ConfirmDialog open={isConfirmOpen} title="Discard College Changes?" message="Are you sure you want to close? Your unsaved changes to this College will be lost." confirmLabel="Discard Changes" cancelLabel="Continue Editing" onConfirm={confirmDiscard} onCancel={cancelDiscard} />
    </>
  )
}
