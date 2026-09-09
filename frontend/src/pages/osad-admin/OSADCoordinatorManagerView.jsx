import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Search,
  ShieldCheck,
  UserCheck,
  User,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Building2,
  GraduationCap,
  Users
} from 'lucide-react'
import { getAccessibleTextColor } from '../../utils/colorContrast'
import { fetchCoordinatorPersonnel } from '../../services/collegeAdminService'
import ManagePersonnelProgramsModal from './modals/ManagePersonnelProgramsModal'
import OSADPageHeader from '../../components/osad/OSADPageHeader'
import {
  OSADLoadingState,
  OSADEmptyState,
  OSADSearchEmptyState,
  OSADErrorState
} from '../../components/osad/OSADStateBlock'

export default function OSADCoordinatorManagerView({
  collegeId,
  onBack,
  fallbackCollege = null,
  onAssignmentsUpdated
}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPersonnel, setSelectedPersonnel] = useState(null)

  const loadData = async () => {
    if (!collegeId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchCoordinatorPersonnel(collegeId)
      setData(res)
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load coordinator personnel.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [collegeId])

  const handleModalSuccess = () => {
    loadData()
    if (onAssignmentsUpdated) {
      onAssignmentsUpdated()
    }
  }

  const college = data?.college || fallbackCollege || {}
  const personnelList = data?.personnel || []
  const badgeBg = college.acronym_badge_color || '#16834A'
  const badgeTextColor = getAccessibleTextColor(badgeBg)

  // Filter personnel by search
  const filteredPersonnel = personnelList.filter((p) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    const nameMatch = p.name?.toLowerCase().includes(q)
    const emailMatch = p.email?.toLowerCase().includes(q)
    const codeMatch = (p.assigned_program_codes || []).some((code) =>
      code.toLowerCase().includes(q)
    )
    return nameMatch || emailMatch || codeMatch
  })

  // Summary counts
  const totalEligible = personnelList.length
  const activeCoordinators = personnelList.filter(
    (p) => (p.current_coordinator_assignment_count || 0) > 0
  ).length
  const totalAssignments = personnelList.reduce(
    (acc, p) => acc + (p.current_coordinator_assignment_count || 0),
    0
  )

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      {/* Standardized Detail Header */}
      <OSADPageHeader
        variant="detail"
        onBack={onBack}
        backLabel="Back to College Details"
        breadcrumbs={[
          { label: 'Academic Structure', onClick: onBack },
          { label: college.code || 'College', onClick: onBack },
          { label: 'Program Coordinators' }
        ]}
        title="Manage Program Coordinators"
        badge={
          college.code ? (
            <span
              className="px-2 py-0.5 rounded text-xs font-extrabold shadow-2xs"
              style={{ backgroundColor: badgeBg, color: badgeTextColor }}
            >
              {college.code}
            </span>
          ) : null
        }
      />

      {/* Metrics Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
            <Users className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{totalEligible}</p>
            <p className="text-xs font-medium text-slate-500">Eligible HR Personnel</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-[#16834a] dark:text-emerald-400">{activeCoordinators}</p>
            <p className="text-xs font-medium text-slate-500">Active Coordinators</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{totalAssignments}</p>
            <p className="text-xs font-medium text-slate-500">Active Assignments</p>
          </div>
        </div>
      </div>

      {/* Personnel Overview Card */}
      <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Affiliated Personnel & Coordinator Coverage
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Assign or adjust multi-program coordinator responsibilities per personnel.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search personnel or program..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a]"
            />
          </div>
        </div>

        {/* State Banners */}
        {loading && (
          <div className="p-6">
            <OSADLoadingState message="Loading affiliated personnel..." />
          </div>
        )}

        {error && !loading && (
          <div className="p-6">
            <OSADErrorState
              title="Unable to Load Personnel Data"
              message={error}
              onRetry={loadData}
            />
          </div>
        )}

        {!loading && !error && personnelList.length === 0 && (
          <div className="p-6">
            <OSADEmptyState
              icon={User}
              title="No Eligible Personnel Found"
              description="Program Coordinator assignments require active HR-established personnel-to-program affiliations under this College."
            />
          </div>
        )}

        {!loading && !error && personnelList.length > 0 && filteredPersonnel.length === 0 && (
          <div className="p-6">
            <OSADSearchEmptyState
              title="No Matching Personnel Found"
              description={`No personnel match your search query: "${searchQuery}".`}
              onReset={() => setSearchQuery('')}
              resetLabel="Clear Personnel Search"
            />
          </div>
        )}

        {/* Personnel Rows */}
        {!loading && !error && filteredPersonnel.length > 0 && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredPersonnel.map((person) => {
              const assignedCodes = person.assigned_program_codes || []
              const assignmentCount = person.current_coordinator_assignment_count || 0
              const eligibleCount = person.eligible_program_count || 0

              return (
                <div
                  key={person.profile_id}
                  className="p-4.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 shrink-0">
                      {person.name ? person.name.charAt(0) : 'P'}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {person.name}
                        </p>
                        {assignmentCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 text-[10px] font-bold border border-emerald-200/60 dark:border-emerald-800/40">
                            {assignmentCount} {assignmentCount === 1 ? 'Program' : 'Programs'} Assigned
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                            Available ({eligibleCount} Eligible)
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 truncate">
                        {person.email} • {person.designation}
                      </p>

                      {/* Assigned Program Badges */}
                      {assignedCodes.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-semibold">Coordinating:</span>
                          {assignedCodes.map((code) => (
                            <span
                              key={code}
                              className="px-2 py-0.5 rounded-md bg-emerald-100/70 dark:bg-emerald-900/50 text-[#16834a] dark:text-emerald-300 font-mono text-[10px] font-bold"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedPersonnel(person)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#1B4D3E] hover:bg-[#143B30] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Manage Programs</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Assignment Editor Modal */}
      {selectedPersonnel && (
        <ManagePersonnelProgramsModal
          isOpen={Boolean(selectedPersonnel)}
          onClose={() => setSelectedPersonnel(null)}
          collegeId={collegeId}
          personnel={selectedPersonnel}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}
