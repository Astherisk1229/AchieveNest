import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Building2,
  GraduationCap,
  Lock,
  Plus,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Edit,
  ExternalLink,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  Archive,
  Trash2
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { getAccessibleTextColor } from '../../utils/colorContrast'
import { deleteCollege, fetchCollege, getCollegeLogoUrl } from '../../services/collegeAdminService'
import EditCollegeModal from './modals/EditCollegeModal'
import OSADCoordinatorManagerView from './OSADCoordinatorManagerView'
import EditProgramModal from './modals/EditProgramModal'
import OSADPageHeader from '../../components/osad/OSADPageHeader'
import {
  OSADLoadingState,
  OSADEmptyState,
  OSADErrorState
} from '../../components/osad/OSADStateBlock'

export default function OSADCollegeDetailsView({
  collegeId,
  onBack,
  onAddProgram,
  onEditCollege,
  onAssignCoordinator,
  onCollegeStatusChange,
  onCollegeChanged,
  onCollegeDeleted,
  fallbackCollege = null
}) {
  const [collegeData, setCollegeData] = useState(fallbackCollege)
  const [loading, setLoading] = useState(!fallbackCollege)
  const [error, setError] = useState(null)
  const [isManagingCoordinators, setIsManagingCoordinators] = useState(false)
  const [editingProgram, setEditingProgram] = useState(null)
  const [lifecycleBusy, setLifecycleBusy] = useState(false)
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false)
  const [lifecycleError, setLifecycleError] = useState(null)
  const [isEditingCollege, setIsEditingCollege] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteBlockers, setDeleteBlockers] = useState(null)

  const loadDetails = async () => {
    if (!collegeId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCollege(collegeId)
      if (data) {
        setCollegeData(data)
      } else if (fallbackCollege) {
        setCollegeData(fallbackCollege)
      } else {
        setError('College not found.')
      }
    } catch (err) {
      if (fallbackCollege) {
        setCollegeData(fallbackCollege)
      } else {
        setError(err.message || 'Failed to load College details.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetails()
  }, [collegeId])

  const college = collegeData || {}
  const programs = college.programs || []
  const badgeBg = college.acronym_badge_color || '#16834A'
  const badgeTextColor = getAccessibleTextColor(badgeBg)
  const logoUrl = college.has_logo || college.logo_storage_key ? getCollegeLogoUrl(college.id) : null
  const isArchived = college.status === 'inactive'

  const performLifecycleChange = async (nextStatus) => {
    if (!onCollegeStatusChange || lifecycleBusy) return
    setLifecycleBusy(true)
    setLifecycleError(null)
    try {
      await onCollegeStatusChange(college, nextStatus)
      await loadDetails()
      setArchiveConfirmOpen(false)
    } catch (err) {
      setLifecycleError(err?.response?.data?.error?.message || err?.message || 'The College lifecycle could not be updated. Try again.')
    } finally {
      setLifecycleBusy(false)
    }
  }

  const handleLifecycleChange = () => {
    if (isArchived) {
      performLifecycleChange('active')
      return
    }
    setArchiveConfirmOpen(true)
  }

  const canEditCollege = Boolean(onEditCollege || onCollegeChanged)
  const openEditCollege = () => (onEditCollege ? onEditCollege(college) : setIsEditingCollege(true))

  // Permanent delete: only offered for archived Colleges; the server also refuses while any record references it.
  const performDelete = async () => {
    if (deleteBusy) return
    setDeleteBusy(true)
    setLifecycleError(null)
    setDeleteBlockers(null)
    try {
      await deleteCollege(college.id)
      setDeleteConfirmOpen(false)
      if (onCollegeDeleted) await onCollegeDeleted(college)
      onBack()
    } catch (err) {
      const apiError = err?.response?.data?.error
      setDeleteConfirmOpen(false)
      if (apiError?.code === 'COLLEGE_IN_USE') setDeleteBlockers(apiError.references || [])
      else setLifecycleError(apiError?.message || err?.message || 'The College could not be deleted. Try again.')
    } finally {
      setDeleteBusy(false)
    }
  }

  // If currently in Coordinator Manager subview
  if (isManagingCoordinators) {
    return (
      <OSADCoordinatorManagerView
        collegeId={collegeId}
        onBack={() => setIsManagingCoordinators(false)}
        fallbackCollege={college}
        onAssignmentsUpdated={loadDetails}
      />
    )
  }

  if (loading && !collegeData) {
    return (
      <div className="space-y-6 font-sans animate-in fade-in duration-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Colleges</span>
        </button>

        <OSADLoadingState message="Loading College management details..." />
      </div>
    )
  }

  if (error && !collegeData) {
    return (
      <div className="space-y-6 font-sans">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Colleges</span>
        </button>

        <OSADErrorState
          title="Unable to Load College Details"
          message={error}
          onRetry={loadDetails}
        />
      </div>
    )
  }

  // Summary Metrics
  const totalPrograms = programs.length
  const assignedCoordinators = programs.filter(p => p.coordinator_name || p.coordinatorName).length
  const unassignedCoordinators = totalPrograms - assignedCoordinators

  const deanName = college.dean_name || college.deanName
  const isDeanAssigned = Boolean(deanName && deanName !== 'Unassigned')

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      {/* Standardized Detail Header */}
      <OSADPageHeader
        variant="detail"
        onBack={onBack}
        backLabel="Back to Academic Structure"
        breadcrumbs={[
          { label: 'Academic Structure', onClick: onBack },
          { label: college.code || 'College' }
        ]}
        title={college.name}
        secondaryActions={
          <>
            {onCollegeStatusChange && (
              <button type="button" disabled={lifecycleBusy} onClick={handleLifecycleChange} className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 disabled:opacity-50">
                {isArchived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                <span>{isArchived ? 'Reactivate College' : 'Archive College'}</span>
              </button>
            )}
            {isArchived && onCollegeDeleted && (
              <button type="button" disabled={deleteBusy} onClick={() => { setDeleteBlockers(null); setDeleteConfirmOpen(true) }} className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 disabled:opacity-50">
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete College</span>
              </button>
            )}
            {canEditCollege && (
              <button
                type="button"
                onClick={openEditCollege}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit College</span>
              </button>
            )}

            <button
              type="button"
              disabled={isArchived}
              onClick={() => setIsManagingCoordinators(true)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#16834a] dark:text-emerald-400 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Manage Program Coordinators</span>
            </button>
          </>
        }
        primaryAction={
          <button
            type="button"
            disabled={isArchived}
            onClick={() => onAddProgram(college.id)}
            className="px-4 py-2 rounded-xl bg-[#1B4D3E] hover:bg-[#143B30] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Add Academic Program</span>
          </button>
        }
      />

      {deleteBlockers && (
        <div role="alert" className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-950 dark:text-amber-100 text-xs">
          <p className="font-bold text-sm">This College can’t be deleted yet</p>
          <p className="mt-1">It is still linked to the records below. Keep it archived, or move or remove these links first.</p>
          <ul className="mt-2 list-disc pl-5 space-y-0.5">{deleteBlockers.map((ref) => <li key={`${ref.table}.${ref.column}`}><span className="font-semibold">{ref.label}</span>: {ref.count}</li>)}</ul>
        </div>
      )}
      {lifecycleError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{lifecycleError}</span>
        </div>
      )}

      {/* College Identity & Leadership Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* College Profile & Branding Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-start gap-4">
            {/* Logo or Fallback Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${college.code} Logo`}
                  className="w-full h-full object-contain p-1.5"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : (
                <span
                  className="text-xl font-extrabold"
                  style={{ color: badgeBg }}
                >
                  {college.code?.slice(0, 3) || 'COL'}
                </span>
              )}
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-lg text-xs font-extrabold shadow-2xs tracking-wide"
                  style={{ backgroundColor: badgeBg, color: badgeTextColor }}
                >
                  {college.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 text-[11px] font-bold border border-emerald-200/60 dark:border-emerald-800/40 capitalize">
                  {isArchived ? 'Archived' : (college.status || 'Active')}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {college.name}
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {college.description || 'Academic division of Notre Dame of Marbel University.'}
              </p>
            </div>
          </div>
        </div>

        {/* Dean Leadership Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              College Dean (HR Designated)
            </span>

            <div className="mt-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold shrink-0 border border-slate-200 dark:border-slate-700">
                {isDeanAssigned ? deanName.charAt(0) : '?'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {isDeanAssigned ? deanName : 'Not Assigned'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {isDeanAssigned ? (college.dean_email || 'Active Institutional Dean') : 'No Dean currently assigned'}
                </p>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5">
            Dean governance and personnel assignment is exclusively managed by HR.
          </p>
        </div>
      </div>

      {/* Program Coordinator Coverage Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{totalPrograms}</p>
            <p className="text-xs font-medium text-slate-500">Total Academic Programs</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-[#16834a] dark:text-emerald-400">{assignedCoordinators}</p>
            <p className="text-xs font-medium text-slate-500">Assigned Coordinators</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{unassignedCoordinators}</p>
            <p className="text-xs font-medium text-slate-500">Needs Coordinator</p>
          </div>
        </div>
      </div>

      {/* Academic Programs & Coordinators Table Section */}
      <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#16834a]" />
              <span>Academic Programs & Coordinator Coverage</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Undergraduate degree programs active under {college.code}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsManagingCoordinators(true)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#16834a] dark:text-emerald-400 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Manage Coordinators</span>
            </button>

            <button
              type="button"
              onClick={() => onAddProgram(college.id)}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-[#16834a] dark:text-emerald-400 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Program</span>
            </button>
          </div>
        </div>

        {programs.length === 0 ? (
          <div className="p-6">
            <OSADEmptyState
              icon={GraduationCap}
              title="No Academic Programs Added"
              description="No undergraduate degree programs have been configured under this College yet."
              actionLabel="Add Academic Program"
              onAction={() => onAddProgram(college.id)}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {programs.map((program) => {
              const coordName = program.coordinator_name || program.coordinatorName
              const isAssigned = Boolean(coordName && coordName !== 'Unassigned')

              return (
                <div
                  key={program.id}
                  className="p-4.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-bold">
                        {program.code}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {program.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="capitalize">{program.degree_level || 'Undergraduate'}</span>
                      <span>•</span>
                      <span>Status: <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">{program.status || 'Active'}</span></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      {isAssigned ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{coordName}</span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs font-bold">
                          Needs Coordinator
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingProgram(program)}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1 shadow-2xs transition cursor-pointer"
                      title={`Edit master data for ${program.code}`}
                    >
                      <Edit className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsManagingCoordinators(true)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#1B4D3E] dark:text-emerald-400 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1 shadow-2xs transition cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isAssigned ? 'Reassign' : 'Assign'}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Academic Program Modal */}
      {editingProgram && (
        <EditProgramModal
          isOpen={Boolean(editingProgram)}
          onClose={() => setEditingProgram(null)}
          program={editingProgram}
          college={college}
          onSuccess={loadDetails}
        />
      )}

      {isEditingCollege && (
        <EditCollegeModal
          isOpen={isEditingCollege}
          onClose={() => setIsEditingCollege(false)}
          college={college}
          onSuccess={async (updated) => {
            if (updated) setCollegeData((current) => ({ ...current, ...updated }))
            await loadDetails()
            if (onCollegeChanged) await onCollegeChanged(updated || college)
          }}
        />
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete College Permanently?"
        message={`This permanently deletes [${college.code}] ${college.name || ''}. It is allowed only when no programs, Dean history, personnel, events, organizations, or other records are linked to it. This cannot be undone.`}
        confirmLabel="Delete College"
        cancelLabel="Cancel"
        tone="destructive"
        isProcessing={deleteBusy}
        onCancel={() => !deleteBusy && setDeleteConfirmOpen(false)}
        onConfirm={performDelete}
      />

      <ConfirmDialog
        open={archiveConfirmOpen}
        title="Archive College"
        message="Archiving this College will remove it from active academic placement options. Existing academic programs, student records, and historical data will remain unchanged. No records will be deleted."
        confirmLabel="Archive College"
        cancelLabel="Cancel"
        tone="destructive"
        isProcessing={lifecycleBusy}
        onCancel={() => !lifecycleBusy && setArchiveConfirmOpen(false)}
        onConfirm={() => performLifecycleChange('inactive')}
      />
    </div>
  )
}
