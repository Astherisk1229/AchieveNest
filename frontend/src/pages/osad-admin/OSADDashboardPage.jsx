import React, { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import {
  Trophy,
  Users,
  Award,
  ShieldCheck,
  Plus,
  Building2,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  X,
  Check
} from 'lucide-react'

import provisioningService from '../../services/provisioningService'
import { Button } from '../../components/ui/button'
import PersonnelSelectorModal from './modals/PersonnelSelectorModal'
import CreateCollegeModal from './modals/CreateCollegeModal'
import CreateProgramModal from './modals/CreateProgramModal'
import CreateOrganizationModal from './modals/CreateOrganizationModal'
import {
  fetchOrganizations as apiFetchOrganizations,
  createOrganization as apiCreateOrganization,
  assignOrganizationModerator as apiAssignOrganizationModerator,
  fetchOrganizationModeratorCandidates
} from '../../services/organizationAdminService'
import {
  fetchColleges as apiFetchColleges,
  createCollege as apiCreateCollege,
  updateCollegeStatus as apiUpdateCollegeStatus,
  fetchAcademicPrograms as apiFetchAcademicPrograms,
  createAcademicProgram as apiCreateAcademicProgram
} from '../../services/collegeAdminService'
import roleService from '../../services/roleService'
import OSADCommandCenterPage from './OSADCommandCenterPage'
import OSADStudentAccountsPage from './OSADStudentAccountsPage'
import OSADAcademicProgramsPage from './OSADAcademicProgramsPage'
import OSADStudentOrganizationsPage from './OSADStudentOrganizationsPage'
import OSADCertificateTemplatesPage from './OSADCertificateTemplatesPage'
import OSADAccreditationReportsPage from './OSADAccreditationReportsPage'
import OSADSystemAuditLogsPage from './OSADSystemAuditLogsPage'
import OSADPasswordResetRequestsPage from './OSADPasswordResetRequestsPage'

export default function OSADDashboardPage({ currentUser }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab') || 'overview'
  const activeTab = rawTab === 'awardees'
    ? 'candidate-review'
    : rawTab === 'academic-structure' ? 'academic-programs' : rawTab


  // Account & Portfolio Viewing States
  const [userRoleFilter, setUserRoleFilter] = useState('student')
  const [selectedCollege, setSelectedCollege] = useState('all')
  const [selectedSort, setSelectedSort] = useState('name')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [personnelSelectorTarget, setPersonnelSelectorTarget] = useState(null)

  // Initial Form Constants
  const INITIAL_ORG_DATA = { name: '', category: 'College Academic Organization' }

  // Modal States
  const [isAddCollegeOpen, setIsAddCollegeOpen] = useState(false)
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false)
  const [isAddOrgOpen, setIsAddOrgOpen] = useState(false)

  // Persistent Student Organizations & College and Programs State
  const [persistentOrgs, setPersistentOrgs] = useState([])
  const [moderatorCandidates, setModeratorCandidates] = useState([])
  const [persistentColleges, setPersistentColleges] = useState([])
  const [persistentPrograms, setPersistentPrograms] = useState([])
  const [students, setStudents] = useState([])
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
      const list = await provisioningService.fetchStudents()
      if (Array.isArray(list)) setStudents(list)
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
      activeStudentsCount: students.filter((s) => (s.status || 'active') === 'active').length,
      activeOrganizationsCount: activeOrgs.length,
      organizationsWithModeratorCount: withModerator,
      pendingAssignmentsCount: activeOrgs.length - withModerator
    }
  }, [persistentColleges, persistentPrograms, persistentOrgs, students])

  const studentsByCollege = React.useMemo(() => {
    const counts = new Map()
    students.forEach((s) => {
      if (!s.college_name && !s.college) return
      const label = s.college_name ? `${s.college ? `${s.college} — ` : ''}${s.college_name}` : s.college
      counts.set(label, (counts.get(label) || 0) + 1)
    })
    const total = Array.from(counts.values()).reduce((a, n) => a + n, 0)
    return Array.from(counts, ([label, count]) => ({ label, count, percent: total ? Math.round((count / total) * 1000) / 10 : 0 }))
      .sort((a, b) => b.count - a.count)
  }, [students])

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

  // Hierarchy Creation Handlers
  const handleCreateCollegeSubmit = async (payload) => {
    try {
      const created = await apiCreateCollege(payload)
      await loadPersistentColleges()
      await loadPersistentPrograms()
      const code = created?.college?.code || (payload instanceof FormData ? payload.get('code') : payload.code)
      const name = created?.college?.name || (payload instanceof FormData ? payload.get('name') : payload.name)
      showToast(`Created Academic College: [${code}] ${name}`)
      return created
    } catch (err) {
      showToast(`Failed to create Academic College: ${err?.message || 'Server error'}`)
      throw err
    }
  }

  const handleCreateProgramSubmit = async (progData) => {
    try {
      const created = await apiCreateAcademicProgram(progData)
      await loadPersistentColleges()
      await loadPersistentPrograms()
      const code = created?.program?.code || progData.code
      const name = created?.program?.name || progData.name
      showToast(`Created Academic Program: [${code}] ${name}`)
      return created
    } catch (err) {
      showToast(`Failed to create Academic Program: ${err?.message || 'Server error'}`)
      throw err
    }
  }

  const handleCollegeStatusChange = async (college, status) => {
    const result = await apiUpdateCollegeStatus(college.id, status)
    await loadPersistentColleges()
    showToast(status === 'inactive' ? `Archived College: [${college.code}]` : `Reactivated College: [${college.code}]`)
    return result
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

      {activeTab === 'accounts' && (
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

      {activeTab === 'academic-programs' && (
        <OSADAcademicProgramsPage
          colleges={persistentColleges}
          academicPrograms={persistentPrograms}
          setIsAddCollegeOpen={setIsAddCollegeOpen}
          setIsAddProgramOpen={setIsAddProgramOpen}
          onCollegeStatusChange={handleCollegeStatusChange}
          onCollegeChanged={async (college) => { await loadPersistentColleges(); showToast(`Updated College: [${college?.code}]`) }}
          onCollegeDeleted={async (college) => { await loadPersistentColleges(); await loadPersistentPrograms(); showToast(`Deleted College: [${college?.code}]`) }}
          onViewCollegeStudents={(college) => {
            // OS-4: one click from a college to its students, filtered by the college.
            setSelectedCollege(college?.code || 'all')
            setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('tab', 'accounts'); return next })
          }}
        />
      )}

      {activeTab === 'organizations' && (
        <OSADStudentOrganizationsPage
          organizations={persistentOrgs}
          colleges={persistentColleges}
          selectedOrganizationId={searchParams.get('orgId') || null}
          onSelectOrganization={(orgId) => setSearchParams({ tab: 'organizations', orgId })}
          onBackToOrganizations={() => setSearchParams({ tab: 'organizations' })}
          setIsAddOrgOpen={setIsAddOrgOpen}
          setPersonnelSelectorTarget={setPersonnelSelectorTarget}
        />
      )}

      {activeTab === 'awards' && (
        <Navigate to="/osad/awards" replace />
      )}

      {activeTab === 'certificate-templates' && (
        <OSADCertificateTemplatesPage />
      )}

      {(activeTab === 'candidate-review' || activeTab === 'awardees') && (
        <Navigate to="/osad/candidates" replace />
      )}

      {activeTab === 'accreditation-reports' && (
        <OSADAccreditationReportsPage />
      )}

      {activeTab === 'system-logs' && (
        <OSADSystemAuditLogsPage />
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

      {/* Hierarchy Modals */}
      <CreateCollegeModal
        isOpen={isAddCollegeOpen}
        onClose={() => setIsAddCollegeOpen(false)}
        onSubmit={handleCreateCollegeSubmit}
      />

      <CreateProgramModal
        isOpen={Boolean(isAddProgramOpen)}
        onClose={() => setIsAddProgramOpen(false)}
        onSubmit={handleCreateProgramSubmit}
        colleges={persistentColleges.filter((college) => college.status === 'active')}
        initialCollegeId={typeof isAddProgramOpen === 'string' ? isAddProgramOpen : (isAddProgramOpen?.collegeId || null)}
      />

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
