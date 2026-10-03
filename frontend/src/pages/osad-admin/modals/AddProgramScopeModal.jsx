import React, { useState, useEffect } from 'react'
import {
  X,
  Search,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Plus,
  Building2
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { addOrganizationPrograms } from '../../../services/organizationAdminService'
import { fetchAcademicPrograms } from '../../../services/collegeAdminService'

export default function AddProgramScopeModal({
  isOpen,
  onClose,
  organization,
  onSuccess = () => {}
}) {
  const [allPrograms, setAllPrograms] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && organization) {
      setSelectedIds([])
      setSearch('')
      setError(null)
      loadPrograms()
    }
  }, [isOpen, organization])

  const loadPrograms = async () => {
    setLoading(true)
    try {
      const filters = organization?.college_id ? { college_id: organization.college_id } : {}
      const data = await fetchAcademicPrograms(filters)
      setAllPrograms(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.message || 'Failed to load degree programs.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !organization) return null

  const existingProgramIds = organization.program_ids || organization.programs?.map((p) => p.id) || []

  const filteredPrograms = allPrograms.filter((p) => {
    const term = search.toLowerCase()
    const matchesCode = (p.code || '').toLowerCase().includes(term)
    const matchesName = (p.name || '').toLowerCase().includes(term)
    const matchesCollege = (p.college_code || p.college_name || '').toLowerCase().includes(term)
    return matchesCode || matchesName || matchesCollege
  })

  const toggleSelect = (id) => {
    if (existingProgramIds.includes(id)) return
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedIds.length === 0) {
      setError('Please select at least one academic program to add.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await addOrganizationPrograms(organization.id, selectedIds)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to add academic programs.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#131E2E] rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Add Academic Program Scope</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select degree programs to affiliate with [{organization.code}] {organization.name}
              </p>
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

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code, title, or college..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a]"
            />
          </div>
        </div>

        {/* Program Selection List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading eligible programs...</p>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 font-medium">
              No matching academic programs found.
            </div>
          ) : (
            filteredPrograms.map((prog) => {
              const isAlreadyInScope = existingProgramIds.includes(prog.id)
              const isSelected = selectedIds.includes(prog.id)

              return (
                <div
                  key={prog.id}
                  onClick={() => !isAlreadyInScope && toggleSelect(prog.id)}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 transition ${
                    isAlreadyInScope
                      ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/50 text-slate-400 cursor-not-allowed opacity-70'
                      : isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 cursor-pointer'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 cursor-pointer'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">[{prog.code}]</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{prog.name}</span>
                    </div>
                    {prog.college_code && (
                      <p className="text-[11px] text-slate-400">College: [{prog.college_code}] {prog.college_name}</p>
                    )}
                  </div>

                  <div>
                    {isAlreadyInScope ? (
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-500">
                        In Scope
                      </span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            {selectedIds.length} {selectedIds.length === 1 ? 'Program' : 'Programs'} Selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || selectedIds.length === 0}
              className="px-5 py-2 rounded-xl bg-[#16834a] hover:bg-[#126b3c] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add Selected Scope</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
