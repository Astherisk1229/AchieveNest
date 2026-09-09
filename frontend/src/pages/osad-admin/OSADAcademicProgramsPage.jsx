import React, { useState } from 'react'
import {
  Building2,
  GraduationCap,
  Lock,
  Plus,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react'
import { getActionAvailability } from './OSADAcademicHeaderActions'
import { getAccessibleTextColor } from '../../utils/colorContrast'
import OSADCollegeDetailsView from './OSADCollegeDetailsView'
import { getCollegeLogoUrl } from '../../services/collegeAdminService'

import OSADPageHeader from '../../components/osad/OSADPageHeader'
import { OSADEmptyState } from '../../components/osad/OSADStateBlock'

export default function OSADAcademicProgramsPage({
  colleges = [],
  academicPrograms = [],
  setIsAddCollegeOpen,
  setIsAddProgramOpen,
  selectedCollegeId: externalSelectedCollegeId = null,
  onSelectCollege: externalOnSelectCollege = null
}) {
  const [internalSelectedCollegeId, setInternalSelectedCollegeId] = useState(null)

  const selectedCollegeId = externalSelectedCollegeId !== null
    ? externalSelectedCollegeId
    : internalSelectedCollegeId

  const handleSelectCollege = (id) => {
    if (externalOnSelectCollege) {
      externalOnSelectCollege(id)
    } else {
      setInternalSelectedCollegeId(id)
    }
  }

  const handleBackToGrid = () => {
    if (externalOnSelectCollege) {
      externalOnSelectCollege(null)
    } else {
      setInternalSelectedCollegeId(null)
    }
  }

  // If a specific college is selected, render the dedicated College Details view
  if (selectedCollegeId) {
    const fallback = colleges.find((c) => c.id === selectedCollegeId) || null
    return (
      <OSADCollegeDetailsView
        collegeId={selectedCollegeId}
        fallbackCollege={fallback}
        onBack={handleBackToGrid}
        onAddProgram={(cId) => setIsAddProgramOpen(cId)}
      />
    )
  }

  const { canCreateAcademicProgram, academicProgramTooltip } = getActionAvailability({
    collegeCount: colleges.length
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      {/* Standardized Page Header */}
      <OSADPageHeader
        title="Academic Structure"
        description="Click any College card to view its programs, dean leadership, and coordinator coverage."
        icon={Building2}
        primaryAction={
          <button
            type="button"
            onClick={() => setIsAddCollegeOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#1B4D3E] hover:bg-[#143B30] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create College</span>
          </button>
        }
        secondaryActions={
          <button
            type="button"
            disabled={!canCreateAcademicProgram}
            title={academicProgramTooltip || undefined}
            onClick={() => canCreateAcademicProgram && setIsAddProgramOpen(true)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
              canCreateAcademicProgram
                ? 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 cursor-pointer shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create Academic Program</span>
          </button>
        }
      />

      {/* College & Academic Program Interactive Grid or Empty State */}
      {colleges.length === 0 ? (
        <OSADEmptyState
          icon={Building2}
          title="No Colleges Configured"
          description="Academic programs require a parent College. Click 'Create College' to establish your first academic unit."
          actionLabel="Create College"
          onAction={() => setIsAddCollegeOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {colleges.map((college) => {
            const programs = academicPrograms.filter(
              (program) => program.collegeId === college.id || program.college_id === college.id
            )
            const badgeBg = college.acronym_badge_color || '#16834A'
            const badgeColor = getAccessibleTextColor(badgeBg)
            const logoUrl = college.has_logo || college.logo_storage_key ? getCollegeLogoUrl(college.id) : null
            const deanName = college.dean_name || college.deanName
            const isDeanAssigned = Boolean(deanName && deanName !== 'Unassigned')

            return (
            <div
              key={college.id}
              role="button"
              tabIndex={0}
              aria-label={`View details for ${college.name}`}
              onClick={() => handleSelectCollege(college.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSelectCollege(college.id)
                }
              }}
              className="bg-white dark:bg-[#131E2E] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs hover:shadow-md hover:border-emerald-500/60 dark:hover:border-emerald-500/50 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 text-left group"
            >
              {/* College Card Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {/* Thumbnail Logo or Fallback Avatar */}
                  <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={`${college.code} Logo`}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <span
                        className="text-sm font-extrabold"
                        style={{ color: badgeBg }}
                      >
                        {college.code?.slice(0, 3) || 'COL'}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-extrabold shadow-2xs tracking-wide"
                        style={{ backgroundColor: badgeBg, color: badgeColor }}
                      >
                        {college.code}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Dean: {isDeanAssigned ? deanName : 'Not Assigned'}
                      </span>
                    </div>

                    <h2 className="font-bold text-sm text-slate-900 dark:text-white mt-1 group-hover:text-[#16834a] dark:group-hover:text-emerald-400 transition-colors truncate">
                      {college.name}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsAddProgramOpen(college.id)
                    }}
                    className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#16834a] dark:text-emerald-400 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                    title={`Add Academic Program under ${college.code}`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Program</span>
                  </button>
                  <span className="text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-800">
                    {programs.length} {programs.length === 1 ? 'Program' : 'Programs'}
                  </span>
                </div>
              </div>

              {/* Programs Preview Table */}
              <div className="space-y-2">
                {programs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center italic">
                    No Academic Programs configured yet. Click to manage.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-lg border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-[#131E2E]">
                    {programs.slice(0, 3).map((program) => {
                      const coordName = program.coordinatorName || program.coordinator_name
                      const isAssigned = Boolean(coordName && coordName !== 'Unassigned')

                      return (
                        <div
                          key={program.id}
                          className="p-2.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white shrink-0">{program.code}</span>
                            <span className="text-slate-500 dark:text-slate-400 truncate">{program.name}</span>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {isAssigned ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                <span>{coordName}</span>
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                Needs Coordinator
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Card Footer / View Details Affordance */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-semibold transition-colors">
                <span>{programs.length > 3 ? `+${programs.length - 3} more programs` : 'Manage college & programs'}</span>
                <span className="flex items-center gap-1">
                  <span>View College Details</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          )
        })}
        </div>
      )}
    </div>
  )
}
