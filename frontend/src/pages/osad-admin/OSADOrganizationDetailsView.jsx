import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Users,
  Building2,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Edit,
  ExternalLink,
  CheckCircle2,
  Clock,
  RotateCcw,
  Globe,
  SlidersHorizontal,
  History,
  Mail,
  User,
  Plus,
  Trash2,
  UserMinus
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import {
  fetchOrganization,
  getOrganizationLogoUrl,
  removeOrganizationProgram,
  removeOrganizationModerator
} from '../../services/organizationAdminService'
import EditOrganizationModal from './modals/EditOrganizationModal'
import AddProgramScopeModal from './modals/AddProgramScopeModal'
import OSADPageHeader from '../../components/osad/OSADPageHeader'
import {
  OSADLoadingState,
  OSADEmptyState,
  OSADErrorState
} from '../../components/osad/OSADStateBlock'

const CATEGORY_LABELS = {
  academic_college: 'Academic / College-Based',
  co_curricular: 'Co-Curricular',
  special_interest: 'Special Interest',
  socio_cultural: 'Socio-Cultural',
  religious: 'Religious',
  sports: 'Sports',
  student_council: 'Student Council'
}

export default function OSADOrganizationDetailsView({
  organizationId,
  onBack,
  onAssignModerator,
  colleges = [],
  fallbackOrganization = null
}) {
  const [orgData, setOrgData] = useState(fallbackOrganization)
  const [loading, setLoading] = useState(!fallbackOrganization)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)

  // Modals & Confirmation States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddProgramModalOpen, setIsAddProgramModalOpen] = useState(false)
  const [removingProgram, setRemovingProgram] = useState(null)
  const [isConfirmingRemoveMod, setIsConfirmingRemoveMod] = useState(false)
  const [processingAction, setProcessingAction] = useState(false)

  const loadDetails = async () => {
    if (!organizationId) return
    setLoading(true)
    setError(null)
    setActionError(null)
    try {
      const data = await fetchOrganization(organizationId)
      if (data) {
        setOrgData(data)
      } else if (fallbackOrganization) {
        setOrgData(fallbackOrganization)
      } else {
        setError('Organization not found.')
      }
    } catch (err) {
      if (fallbackOrganization) {
        setOrgData(fallbackOrganization)
      } else {
        setError(err.message || 'Failed to load organization details.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetails()
  }, [organizationId])

  const org = orgData || {}
  const programs = org.programs || []
  const history = org.moderator_history || []
  const hasLogo = Boolean(org.logo_storage_key)
  const logoUrl = hasLogo ? getOrganizationLogoUrl(org.id) : null
  const acronym = org.code || (org.name ? org.name.substring(0, 4).toUpperCase() : 'ORG')
  const orgScope = org.scope || 'university'
  const categoryLabel = CATEGORY_LABELS[org.category] || org.category || 'Academic / College-Based'
  
  const currentMod = org.current_moderator || (org.moderator_name ? {
    profile_id: org.moderator_profile_id,
    full_name: org.moderator_name,
    email: org.moderator_email,
    employee_id: org.moderator_employee_id,
    designation: org.moderator_designation
  } : null)

  const isModeratorAssigned = Boolean(currentMod && currentMod.full_name && currentMod.full_name !== 'Unassigned')
  const isComplete = org.configuration_status === 'COMPLETE' || (orgScope !== 'program' && isModeratorAssigned) || (orgScope === 'program' && programs.length > 0 && isModeratorAssigned)

  // Program Removal Handler
  const handleRemoveProgramConfirm = async () => {
    if (!removingProgram) return
    setProcessingAction(true)
    setActionError(null)
    try {
      await removeOrganizationProgram(org.id, removingProgram.id)
      setRemovingProgram(null)
      await loadDetails()
    } catch (err) {
      setActionError(err?.response?.data?.error?.message || err?.message || 'Failed to remove academic program.')
    } finally {
      setProcessingAction(false)
    }
  }

  // Moderator Removal Handler
  const handleRemoveModeratorConfirm = async () => {
    setProcessingAction(true)
    setActionError(null)
    try {
      await removeOrganizationModerator(org.id)
      setIsConfirmingRemoveMod(false)
      await loadDetails()
    } catch (err) {
      setActionError(err?.response?.data?.error?.message || err?.message || 'Failed to remove moderator.')
    } finally {
      setProcessingAction(false)
    }
  }

  if (loading && !orgData) {
    return (
      <div className="space-y-6 font-sans animate-in fade-in duration-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Student Organizations</span>
        </button>

        <OSADLoadingState message="Loading Organization details..." />
      </div>
    )
  }

  if (error && !orgData) {
    return (
      <div className="space-y-6 font-sans">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Student Organizations</span>
        </button>

        <OSADErrorState
          title="Unable to Load Organization Details"
          message={error}
          onRetry={loadDetails}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      {/* Standardized Detail Header */}
      <OSADPageHeader
        variant="detail"
        onBack={onBack}
        backLabel="Back to Student Organizations"
        breadcrumbs={[
          { label: 'Student Organizations', onClick: onBack },
          { label: org.code || 'Organization' }
        ]}
        title={org.name}
        secondaryActions={
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Details</span>
          </button>
        }
        primaryAction={
          <button
            type="button"
            onClick={() => {
              if (typeof onAssignModerator === 'function') {
                onAssignModerator(org)
              }
            }}
            className="px-4 py-2 rounded-xl bg-[#16834a] hover:bg-[#126b3c] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isModeratorAssigned ? 'Reassign Moderator' : 'Assign Moderator'}</span>
          </button>
        }
      />

      {/* Action Error Banner */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Organization Overview & Leadership Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile & Metadata Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-start gap-4">
            {/* Logo or Initials Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              {hasLogo && logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${org.code} Logo`}
                  className="w-full h-full object-contain p-1.5"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : (
                <span className="text-lg font-extrabold text-[#16834a] dark:text-emerald-400 uppercase">
                  {acronym.slice(0, 3)}
                </span>
              )}
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 font-mono text-xs font-extrabold border border-emerald-200/60 dark:border-emerald-800/40">
                  [{org.code}]
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {orgScope}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 text-[11px] font-bold border border-emerald-200/60 dark:border-emerald-800/40 capitalize">
                  {org.status || 'Active'}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {org.name}
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Category: <span className="text-slate-700 dark:text-slate-300 font-bold">{categoryLabel}</span>
                {org.college_code && (
                  <> • College: <span className="text-slate-700 dark:text-slate-300 font-bold">[{org.college_code}] {org.college_name}</span></>
                )}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Configuration Completeness:</span>
            {isComplete ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Fully Configured
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold text-xs">
                <Clock className="w-3.5 h-3.5" /> Partially Configured
              </span>
            )}
          </div>
        </div>

        {/* Current Moderator Leadership Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16834a]" />
              Organization Moderator
            </span>

            <div className="mt-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-200/60 dark:border-emerald-800/40">
                {isModeratorAssigned ? currentMod.full_name.charAt(0) : '?'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {isModeratorAssigned ? currentMod.full_name : 'Unassigned'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {isModeratorAssigned ? (currentMod.email || currentMod.designation || 'Active Faculty Moderator') : 'Needs Moderator assignment'}
                </p>
                {isModeratorAssigned && currentMod.employee_id && (
                  <p className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                    [{currentMod.employee_id}]
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Personnel Governance</span>
            <div className="flex items-center gap-2">
              {isModeratorAssigned && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingRemoveMod(true)}
                  className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <UserMinus className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (typeof onAssignModerator === 'function') {
                    onAssignModerator(org)
                  }
                }}
                className="text-[11px] font-bold text-[#16834a] hover:underline cursor-pointer"
              >
                {isModeratorAssigned ? 'Reassign' : 'Assign Now'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Program Scope Section */}
      <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#16834a]" />
              <span>Academic Program Scope ({programs.length} {programs.length === 1 ? 'Program' : 'Programs'})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Academic degree programs covered under this student organization.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddProgramModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-[#16834a] dark:text-emerald-400 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Programs</span>
          </button>
        </div>

        {programs.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <GraduationCap className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {orgScope === 'university' || orgScope === 'college'
                ? `This organization has ${orgScope === 'university' ? 'University-wide' : 'College-wide'} scope and does not require specific program affiliations.`
                : 'No academic programs currently affiliated.'}
            </p>
            <p className="text-[11px] text-slate-400">
              {orgScope === 'program' ? 'Program-scoped organizations must have at least one affiliated degree program.' : 'All enrolled students within the parent scope are recognized.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {programs.map((program) => (
              <div
                key={program.id}
                className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-bold">
                      [{program.code}]
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {program.name}
                    </span>
                  </div>
                  {program.college_code && (
                    <p className="text-[11px] text-slate-400 font-medium">
                      College: [{program.college_code}] {program.college_name}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 text-[11px] font-bold border border-emerald-200/60 dark:border-emerald-800/40">
                    Active Scope
                  </span>
                  <button
                    type="button"
                    onClick={() => setRemovingProgram(program)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    title={`Remove ${program.code} from scope`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Moderator Assignment History Section */}
      <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-[#16834a]" />
              <span>Moderator Assignment History</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tenure records and historic moderator coverage for this organization.
            </p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center space-y-1 text-xs text-slate-400 font-medium">
            <p>No moderator assignment history recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.map((item) => (
              <div
                key={item.assignment_id}
                className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{item.full_name}</span>
                    {item.employee_id && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold">
                        [{item.employee_id}]
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">{item.email || item.designation}</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="text-slate-500 text-right">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Tenure</span>
                    <span>{item.effective_from} → {item.effective_until || 'Present'}</span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    item.is_active
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                  }`}>
                    {item.is_active ? 'Active' : 'Ended'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Organization Modal */}
      {isEditModalOpen && (
        <EditOrganizationModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          organization={org}
          colleges={colleges}
          onSuccess={loadDetails}
        />
      )}

      {/* Add Academic Program Scope Modal */}
      {isAddProgramModalOpen && (
        <AddProgramScopeModal
          isOpen={isAddProgramModalOpen}
          onClose={() => setIsAddProgramModalOpen(false)}
          organization={org}
          onSuccess={loadDetails}
        />
      )}

      {/* Remove Program Confirmation Dialog */}
      {removingProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#131E2E] rounded-2xl w-full max-w-md shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Remove Program Scope?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Confirm removing [{removingProgram.code}] from {org.name}.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Students belonging to <span className="font-bold">[{removingProgram.code}] {removingProgram.name}</span> will no longer be included in this organization's program jurisdiction.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRemovingProgram(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveProgramConfirm}
                disabled={processingAction}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                {processingAction ? 'Removing...' : 'Confirm Removal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Moderator Confirmation Dialog */}
      {isConfirmingRemoveMod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#131E2E] rounded-2xl w-full max-w-md shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
                <UserMinus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Remove Organization Moderator?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Unassign {currentMod?.full_name} from {org.name}.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              This organization will have no active moderator after this change. The previous tenure assignment will remain recorded in history.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingRemoveMod(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveModeratorConfirm}
                disabled={processingAction}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                {processingAction ? 'Removing...' : 'Confirm Unassignment'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
