import React, { useState } from 'react'
import { Users, Plus, ShieldCheck, Globe, Building2, GraduationCap } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { getOrganizationLogoUrl } from '../../services/organizationAdminService'
import OSADOrganizationDetailsView from './OSADOrganizationDetailsView'
import OSADPageHeader from '../../components/osad/OSADPageHeader'
import { OSADEmptyState, OSADSearchEmptyState } from '../../components/osad/OSADStateBlock'

const CATEGORY_LABELS = {
  academic_college: 'Academic / College-Based',
  co_curricular: 'Co-Curricular',
  special_interest: 'Special Interest',
  socio_cultural: 'Socio-Cultural',
  religious: 'Religious',
  sports: 'Sports',
  student_council: 'Student Council'
}

export default function OSADStudentOrganizationsPage({ 
  organizations = [], 
  colleges = [],
  setIsAddOrgOpen, 
  setPersonnelSelectorTarget,
  selectedOrganizationId = null,
  onSelectOrganization = () => {},
  onBackToOrganizations = () => {},
  onAssignModeratorFromDetails = null,
  onEditOrganization = null
}) {
  const [scopeFilter, setScopeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // If viewing details of a specific organization
  if (selectedOrganizationId) {
    const selectedOrg = organizations.find((o) => o.id === selectedOrganizationId) || null
    return (
      <OSADOrganizationDetailsView
        organizationId={selectedOrganizationId}
        onBack={onBackToOrganizations}
        fallbackOrganization={selectedOrg}
        colleges={colleges}
        onAssignModerator={(org) => {
          if (typeof onAssignModeratorFromDetails === 'function') {
            onAssignModeratorFromDetails(org)
          } else if (typeof setPersonnelSelectorTarget === 'function') {
            setPersonnelSelectorTarget({
              title: 'Assign Organization Moderator',
              targetName: org.name,
              organizationId: org.id,
              roleType: 'moderator'
            })
          }
        }}
        onEditOrganization={onEditOrganization}
      />
    )
  }

  const filteredOrgs = organizations.filter(o => {
    const orgScope = o.scope || o.scopeType || 'university'
    const orgCat = o.category || 'academic_college'

    if (scopeFilter !== 'all' && orgScope !== scopeFilter) return false
    if (categoryFilter !== 'all' && orgCat !== categoryFilter) return false
    return true
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      
      {/* Standardized Page Header */}
      <OSADPageHeader
        title="Student Organizations"
        description="Manage recognized Student Organizations, logos, and assign Organization Moderators."
        icon={Users}
        badge="Persistent & Validated"
        primaryAction={
          <Button
            onClick={() => setIsAddOrgOpen(true)}
            className="gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Student Organization</span>
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#131e2e] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-slate-500 mr-1">Scope:</span>
          {['all', 'university', 'college', 'program'].map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => setScopeFilter(scope)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer capitalize ${
                scopeFilter === scope
                  ? 'bg-[#16834a] text-white shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {scope === 'all' ? 'All Scopes' : scope}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-500">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#16834a] cursor-pointer"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Organization Cards Grid */}
      {organizations.length === 0 ? (
        <OSADEmptyState
          icon={Users}
          title="No Student Organizations Found"
          description="No recognized student organizations have been registered in the system yet. Click 'Create Student Organization' to establish one."
          actionLabel="Create Student Organization"
          onAction={() => setIsAddOrgOpen(true)}
        />
      ) : filteredOrgs.length === 0 ? (
        <OSADSearchEmptyState
          title="No Matching Organizations"
          description="No student organizations match the selected scope and category filters."
          onReset={() => {
            setScopeFilter('all')
            setCategoryFilter('all')
          }}
          resetLabel="Reset Scope & Category Filters"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrgs.map(org => {
            const orgScope = org.scope || org.scopeType || 'university'
            const scopeLabel = orgScope.replace('_', ' ')
            const categoryLabel = CATEGORY_LABELS[org.category] || org.category || 'Academic / College-Based'
            const moderatorName = org.moderator_name || org.coordinator_name || org.moderatorName || 'Unassigned'
            const hasLogo = Boolean(org.logo_storage_key)
            const logoUrl = hasLogo ? getOrganizationLogoUrl(org.id) : null
            const acronym = org.code || org.name.substring(0, 4).toUpperCase()
            const programCount = org.program_ids?.length ?? org.programs?.length ?? 0

            return (
              <div
                key={org.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectOrganization(org.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectOrganization(org.id)
                  }
                }}
                className="bg-white dark:bg-[#131e2e] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700/60 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#16834a]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-extrabold uppercase flex items-center gap-1">
                      <Globe className="w-3 h-3" /> {scopeLabel}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {categoryLabel}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    {/* Organization Logo or Initials Fallback */}
                    {hasLogo && logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={`${org.name} logo`}
                        className="w-12 h-12 rounded-2xl object-contain bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 shrink-0 shadow-2xs"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div
                      style={{ display: hasLogo && logoUrl ? 'none' : 'flex' }}
                      className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-[#16834a] dark:text-emerald-300 font-black text-sm items-center justify-center border border-emerald-200 dark:border-emerald-800/60 shrink-0 shadow-2xs uppercase"
                    >
                      {acronym.substring(0, 3)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug truncate">
                        {org.name}
                      </h3>
                      <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
                        [{org.code}]
                      </p>
                      {org.college_code && (
                        <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" /> {org.college_code}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-medium">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      {orgScope === 'program' ? `${programCount} Programs` : `${scopeLabel} Scope`}
                    </span>
                    <span className="font-bold text-[#16834a] dark:text-emerald-400">
                      View Details →
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Organization Moderator</span>
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{moderatorName}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (typeof setPersonnelSelectorTarget === 'function') {
                          setPersonnelSelectorTarget({
                            title: 'Assign Organization Moderator',
                            targetName: org.name,
                            organizationId: org.id,
                            roleType: 'moderator'
                          })
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-emerald-50 text-[#064e2b] dark:text-[#245F42] font-extrabold text-[11px] border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <ShieldCheck className="w-3 h-3 text-[#16834a]" />
                      <span>{moderatorName !== 'Unassigned' ? 'Reassign' : 'Assign'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
