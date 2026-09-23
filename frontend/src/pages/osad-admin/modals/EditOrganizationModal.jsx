import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Building2,
  Globe,
  Upload,
  AlertCircle,
  CheckCircle2,
  Edit,
  Trash2,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { updateOrganization, getOrganizationLogoUrl, deleteOrganizationLogo } from '../../../services/organizationAdminService'
import { formatOrganizationNameSuggestion } from '../../../utils/nameFormatter'

const CATEGORY_OPTIONS = [
  { value: 'academic_college', label: 'Academic / College-Based Organization' },
  { value: 'co_curricular', label: 'Co-Curricular Organization' },
  { value: 'special_interest', label: 'Special Interest Club' },
  { value: 'socio_cultural', label: 'Socio-Cultural Guild' },
  { value: 'religious', label: 'Religious Organization' },
  { value: 'sports', label: 'Sports Club' },
  { value: 'student_council', label: 'Supreme Student Council / College Council' }
]

const SCOPE_OPTIONS = [
  { value: 'university', label: 'University-Wide (Institutional)' },
  { value: 'college', label: 'College-Wide (Single Academic College)' },
  { value: 'program', label: 'Degree Program Scope (Program-Specific)' }
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' }
]

export default function EditOrganizationModal({
  isOpen,
  onClose,
  organization,
  colleges = [],
  onSuccess = () => {}
}) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState('academic_college')
  const [scope, setScope] = useState('university')
  const [collegeId, setCollegeId] = useState('')
  const [status, setStatus] = useState('active')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (organization && isOpen) {
      setName(organization.name || '')
      setCode(organization.code || '')
      setCategory(organization.category || 'academic_college')
      setScope(organization.scope || 'university')
      setCollegeId(organization.college_id || '')
      setStatus(organization.status || 'active')
      setLogoFile(null)
      setError(null)

      if (organization.logo_storage_key) {
        setLogoPreview(getOrganizationLogoUrl(organization.id))
      } else {
        setLogoPreview(null)
      }
    }
  }, [organization, isOpen])

  if (!isOpen || !organization) return null

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a valid image (JPEG, PNG, WebP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Logo image must be 5 MB or smaller.')
      return
    }

    setError(null)
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Organization name is required.')
      return
    }
    if (!code.trim()) {
      setError('Organization code / acronym is required.')
      return
    }
    if ((scope === 'college' || scope === 'program') && !collegeId) {
      setError('College selection is required for College- or Program-scoped organizations.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      let payload
      if (logoFile) {
        const formData = new FormData()
        formData.append('name', name.trim())
        formData.append('code', code.trim().toUpperCase())
        formData.append('category', category)
        formData.append('scope', scope)
        formData.append('college_id', (scope === 'college' || scope === 'program') ? collegeId : '')
        formData.append('status', status)
        formData.append('logo', logoFile)
        payload = formData
      } else {
        payload = {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          category,
          scope,
          college_id: (scope === 'college' || scope === 'program') ? collegeId : null,
          status
        }
      }

      await updateOrganization(organization.id, payload)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to update organization.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#131E2E] rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit Organization Master Data</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Update institutional name, acronym, classification, and branding.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-5 mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Logo Section */}
          <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-1" />
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Organization Logo</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">PNG, JPEG, WebP up to 5 MB</span>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-2xs"
                >
                  Upload New Logo
                </button>
                {logoFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null)
                      setLogoPreview(organization.logo_storage_key ? getOrganizationLogoUrl(organization.id) : null)
                    }}
                    className="text-[11px] text-rose-500 font-bold hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Organization Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={150}
                required
                className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a]"
              />
              {(() => {
                const suggestion = formatOrganizationNameSuggestion(name)
                if (suggestion && suggestion !== name.trim() && name.trim().length > 0) {
                  return (
                    <div className="mt-1 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between gap-2 text-[11px] animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Sparkles className="w-3.5 h-3.5 text-[#16834a] dark:text-emerald-400 shrink-0" />
                        <span className="text-slate-600 dark:text-slate-300 truncate">
                          Suggested format: <strong className="text-emerald-800 dark:text-emerald-300 font-semibold">{suggestion}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setName(suggestion)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-[#16834a] dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-700 shadow-2xs hover:bg-emerald-50 transition cursor-pointer shrink-0"
                      >
                        Use Suggested Format
                      </button>
                    </div>
                  )
                }
                return null
              })()}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Acronym / Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={30}
                required
                className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a]"
              />
            </div>
          </div>

          {/* Category & Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Classification / Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a]"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Organizational Scope <span className="text-rose-500">*</span>
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a]"
              >
                {SCOPE_OPTIONS.map((sc) => (
                  <option key={sc.value} value={sc.value}>
                    {sc.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* College Selection (Conditional) */}
          {(scope === 'college' || scope === 'program') && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Parent Academic College <span className="text-rose-500">*</span>
              </label>
              <select
                value={collegeId}
                onChange={(e) => setCollegeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a]"
              >
                <option value="">Select Parent Academic College...</option>
                {colleges.map((col) => (
                  <option key={col.id} value={col.id}>
                    [{col.code}] {col.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Lifecycle Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a]"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#16834a] hover:bg-[#126b3c] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
