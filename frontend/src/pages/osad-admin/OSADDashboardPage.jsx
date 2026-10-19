import React, { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Check } from 'lucide-react'

import provisioningService from '../../services/provisioningService'
import PersonnelSelectorModal from './modals/PersonnelSelectorModal'
import CreateOrganizationModal from './modals/CreateOrganizationModal'
import {
  fetchOrganizations as apiFetchOrganizations,
  createOrganization as apiCreateOrganization,
  assignOrganizationModerator as apiAssignOrganizationModerator,
  fetchOrganizationModeratorCandidates
} from '../../services/organizationAdminService'
import {
  fetchColleges as apiFetchColleges,
  fetchAcademicPrograms as apiFetchAcademicPrograms
} from '../../services/collegeAdminService'
import OSADCommandCenterPage from './OSADCommandCenterPage'
import OSADStudentAccountsPage from './OSADStudentAccountsPage'
import OSADAcademicProgramsPage from './OSADAcademicProgramsPage'
import OSADStudentOrganizationsPage from './OSADStudentOrganizationsPage'
import OSADPasswordResetRequestsPage from './OSADPasswordResetRequestsPage'

export default function OSADDashboardPage({ currentUser }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab') || 'overview'
  const legacyStudentSection = ({
    accounts: 'accounts',
    'academic-structure': 'colleges',
    'academic-programs': 'colleges',
    organizations: 'organizations'
  })[rawTab]
  const activeTab = ['certificate-templates', 'accreditation-reports', 'system-logs'].includes(rawTab)
    ? 'overview'
    : rawTab === 'awardees'
    ? 'candidate-review'
    : legacyStudentSection ? 'student-management' : rawTab
  const studentSection = activeTab === 'student-management'
    ? (legacyStudentSection || ['accounts', 'colleges', 'organizations'].includes(searchParams.get('section'))
      ? (legacyStudentSection || searchParams.get('section'))
      : 'accounts')
    : 'accounts'

  React.useEffect(() => {
    if (!legacyStudentSection) return
    const next = new URLSearchParams(searchParams)
    next.set('tab', 'student-management')
    next.set('section', legacyStudentSection)
    setSearchParams(next, { replace: true })
  }, [legacyStudentSection, searchParams, setSearchParams])


  // Account & Portfolio Viewing States
  const [selectedCollege, setSelectedCollege] = useState('all')
  const [selectedSort, setSelectedSort] = useState('name')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [personnelSelectorTarget, setPersonnelSelectorTarget] = useState(null)

  // Modal States
  const [isAddOrgOpen, setIsAddOrgOpen] = useState(false)

  // Persistent Student Organizations & College and Programs State
  const [persistentOrgs, setPersistentOrgs] = useState([])
  const [moderatorCandidates, setModeratorCandidates] = useState([])
  const [persistentColleges, setPersistentColleges] = useState([])
  const [persistentPrograms, setPersistentPrograms] = useState([])
  const [studentSummary, setStudentSummary] = useState({ total: 0, active: 0, by_college: [] })
  const [loadErrors, setLoadErrors] = useState({})
  const noteLoad = React.useCallback((key, err) => {
    setLoadErrors((prev) => {
      const next = { ...prev }
      if (err) next[key] = err?.error?.message || err?.message || 'Server error'
      else delete next[key]
      return next
    })
  }, [])

  const loadPersistentOrgs = React.useCallback(async () => {
    try {
      const data = await apiFetchOrganizations()
      if (Array.isArray(data)) setPersistentOrgs(data)
      noteLoad('organizations', null)
    } catch (err) {
      noteLoad('organizations', err)
    }
  }, [noteLoad])

  const loadPersistentColleges = React.useCallback(async () => {
    try {
      const data = await apiFetchColleges()
      if (Array.isArray(data)) setPersistentColleges(data)
      noteLoad('colleges', null)
    } catch (err) {
      noteLoad('colleges', err)
    }
  }, [noteLoad])

  const loadPersistentPrograms = React.useCallback(async () => {
    try {
      const data = await apiFetchAcademicPrograms()
      if (Array.isArray(data)) setPersistentPrograms(data)
      noteLoad('academic programs', null)
    } catch (err) {
      noteLoad('academic programs', err)
    }
  }, [noteLoad])

  const loadStudents = React.useCallback(async () => {
    try {
      const summary = await provisioningService.fetchStudentSummary()
      setStudentSummary(summary)
      noteLoad('student accounts', null)
    } catch (err) {
      noteLoad('student accounts', err)
    }
  }, [noteLoad])

  React.useEffect(() => {
    loadPersistentOrgs()
    loadPersistentColleges()
    loadPersistentPrograms()
    loadStudents()
  }, [loadPersistentOrgs, loadPersistentColleges, loadPersistentPrograms, loadStudents])

  // Overview figures come from the lists loaded above, never from seeded data.
  const metrics = React.useMemo(() => {
    const activeOrgs = persistentOrgs.filter((o) => !o.status || o.status === 'active')
    const withModerator = activeOrgs.filter((o) => o.moderator_profile_id).length
    return {
      collegesCount: persistentColleges.filter((c) => !c.status || c.status === 'active').length,
      programsCount: persistentPrograms.length,
      activeStudentsCount: studentSummary.active,
      activeOrganizationsCount: activeOrgs.length,
      organizationsWithModeratorCount: withModerator,
      pendingAssignmentsCount: activeOrgs.length - withModerator
    }
  }, [persistentColleges, persistentPrograms, persistentOrgs, studentSummary])

  const studentsByCollege = React.useMemo(() => {
    const counts = new Map()
    studentSummary.by_college.forEach((college) => {
      const label = college.college_name ? `${college.college ? `${college.college} — ` : ''}${college.college_name}` : college.college
      counts.set(label, (counts.get(label) || 0) + college.count)
    })
    const total = Array.from(counts.values()).reduce((a, n) => a + n, 0)
    return Array.from(counts, ([label, count]) => ({ label, count, percent: total ? Math.round((count / total) * 1000) / 10 : 0 }))
      .sort((a, b) => b.count - a.count)
  }, [studentSummary])

  React.useEffect(() => {
    const organizationId = personnelSelectorTarget?.roleType === 'moderator'
      ? personnelSelectorTarget.organizationId
      : null
    if (!organizationId) {
      setModeratorCandidates([])
      return
    }
    let active = true
    setModeratorCandidates([])
    fetchOrganizationModeratorCandidates(organizationId)
      .then((personnel) => { if (active) setModeratorCandidates(personnel) })
      .catch((err) => {
        if (active) {
          setPersonnelSelectorTarget(null)
          showToast(`Failed to load eligible moderators: ${err?.response?.data?.error?.message || err?.message || 'Server error'}`)
        }
      })
    return () => { active = false }
  }, [personnelSelectorTarget])

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null)
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Handle Create Organization (Persistent API Submission)
  const handleCreateOrganizationSubmit = async (formData, rawData) => {
    const created = await apiCreateOrganization(formData)
    await loadPersistentOrgs()
    showToast(`Created Student Organization: [${rawData.code || rawData.name}] ${rawData.name}`)
    return created
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-[#176B43] text-white text-xs font-bold shadow-2xl flex items-center gap-3 border border-emerald-500 animate-in fade-in slide-in-from-top duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {Object.keys(loadErrors).length > 0 && (
        <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center justify-between gap-3">
          <span>
            Some data could not be loaded ({Object.entries(loadErrors).map(([k, v]) => `${k}: ${v}`).join('; ')}). Figures on this page may be incomplete.
          </span>
          <button
            type="button"
            onClick={() => { loadPersistentOrgs(); loadPersistentColleges(); loadPersistentPrograms(); loadStudents() }}
            className="font-bold underline cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Sub-View Routing */}
      {activeTab === 'overview' && (
        <OSADCommandCenterPage 
          setSearchParams={setSearchParams} 
          metrics={metrics}
          studentsByCollege={studentsByCollege}
        />
      )}

      {activeTab === 'student-management' && (
        <div className="space-y-5">
          <div role="tablist" aria-label="Student Management" className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-700">
            {[
              ['accounts', 'Student Accounts'],
              ['colleges', 'College and Programs'],
              ['organizations', 'Student Organizations']
            ].map(([section, label]) => (
              <button
                key={section}
                id={`student-management-tab-${section}`}
                type="button"
                role="tab"
                aria-selected={studentSection === section}
                aria-controls="student-management-panel"
                onClick={() => setSearchParams({ tab: 'student-management', section })}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${studentSection === section ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div id="student-management-panel" role="tabpanel" aria-labelledby={`student-management-tab-${studentSection}`}>
          {studentSection === 'accounts' && (
        <OSADStudentAccountsPage
          userSearchTerm={userSearchTerm}
          setUserSearchTerm={setUserSearchTerm}
          selectedCollege={selectedCollege}
          setSelectedCollege={setSelectedCollege}
          selectedSort={selectedSort}
          setSelectedSort={setSelectedSort}
          showToast={showToast}
          colleges={persistentColleges}
          degreePrograms={persistentPrograms}
        />
      )}

      {studentSection === 'colleges' && (
        <OSADAcademicProgramsPage
          colleges={persistentColleges}
          academicPrograms={persistentPrograms}
          onProgramsChanged={loadPersistentPrograms}
          showToast={showToast}
        />
      )}

      {studentSection === 'organizations' && (
        <OSADStudentOrganizationsPage
          organizations={persistentOrgs}
          colleges={persistentColleges}
          selectedOrganizationId={searchParams.get('orgId') || null}
          onSelectOrganization={(orgId) => setSearchParams({ tab: 'student-management', section: 'organizations', orgId })}
          onBackToOrganizations={() => setSearchParams({ tab: 'student-management', section: 'organizations' })}
          onOrganizationChanged={loadPersistentOrgs}
          setIsAddOrgOpen={setIsAddOrgOpen}
          setPersonnelSelectorTarget={setPersonnelSelectorTarget}
        />
      )}
          </div>
        </div>
      )}

      {activeTab === 'awards' && (
        <Navigate to="/osad/awards" replace />
      )}

      {(activeTab === 'candidate-review' || activeTab === 'awardees') && (
        <Navigate to="/osad/candidates" replace />
      )}

      {activeTab === 'password-resets' && (
        <OSADPasswordResetRequestsPage />
      )}

      {/* Personnel Selector Modal for Organization Moderation */}
      {personnelSelectorTarget && (
        <PersonnelSelectorModal
          isOpen={Boolean(personnelSelectorTarget)}
          title={personnelSelectorTarget.title}
          targetName={personnelSelectorTarget.targetName}
          roleType={personnelSelectorTarget.roleType}
          personnelList={personnelSelectorTarget.roleType === 'moderator' ? moderatorCandidates : []}
          onClose={() => setPersonnelSelectorTarget(null)}
          onSelect={async (personnel) => {
            if (personnelSelectorTarget.roleType === 'moderator') {
              if (personnelSelectorTarget.organizationId) {
                try {
                  await apiAssignOrganizationModerator(personnelSelectorTarget.organizationId, personnel.id)
                  await loadPersistentOrgs()
                  showToast(`Assigned ${personnel.full_name} as Org Moderator for [${personnelSelectorTarget.targetName}]`)
                } catch (err) {
                  showToast(`Failed to assign moderator: ${err?.message || 'Server error'}`)
                }
              } else {
                showToast('Could not assign a moderator: the organization was not identified.')
              }
            }
            setPersonnelSelectorTarget(null)
          }}
        />
      )}

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={isAddOrgOpen}
        onClose={() => setIsAddOrgOpen(false)}
        onSubmit={handleCreateOrganizationSubmit}
        colleges={persistentColleges.filter((college) => !college.status || college.status === 'active')}
        degreePrograms={persistentPrograms}
      />

    </div>
  )
}
