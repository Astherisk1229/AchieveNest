import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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

import useOSAD from '../../hooks/useOSAD'
import { Button } from '../../components/ui/button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useConfirmableClose } from '../../hooks/useConfirmableClose'
import PersonnelSelectorModal from './modals/PersonnelSelectorModal'
import CreateCollegeModal from './modals/CreateCollegeModal'
import CreateProgramModal from './modals/CreateProgramModal'
import CreateOrganizationModal from './modals/CreateOrganizationModal'
import { fetchOrganizations as apiFetchOrganizations, createOrganization as apiCreateOrganization } from '../../services/organizationAdminService'
import roleService from '../../services/roleService'
import OSADCommandCenterPage from './OSADCommandCenterPage'
import OSADStudentAccountsPage from './OSADStudentAccountsPage'
import OSADAcademicProgramsPage from './OSADAcademicProgramsPage'
import OSADStudentOrganizationsPage from './OSADStudentOrganizationsPage'
import OSADCertificateTemplatesPage from './OSADCertificateTemplatesPage'
import OSADAwardsAndCriteriaPage from './OSADAwardsAndCriteriaPage'
import OSADAwardCandidateReviewPage from './OSADAwardCandidateReviewPage'
import OSADAccreditationReportsPage from './OSADAccreditationReportsPage'
import OSADSystemAuditLogsPage from './OSADSystemAuditLogsPage'
import OSADPasswordResetRequestsPage from './OSADPasswordResetRequestsPage'

export default function OSADDashboardPage({ currentUser }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab') || 'overview'
  const activeTab = rawTab === 'awardees'
    ? 'candidate-review'
    : rawTab === 'academic-structure' ? 'academic-programs' : rawTab

  const {
    metrics,
    colleges,
    degreePrograms,
    organizations,
    clubs,
    awardCategories,
    awardees,
    accreditationReports,
    auditLogs,
    getUsers,
    getPersonnelList,
    getStudentPortfolios,
    createDegreeProgram,
    createOrganization,
    createClub,
    getStudentLeaderboards,
    getAccreditationReportDetails,
    assignOrganizationModerator,
    revokeRole,
    createAwardCategory,
    generateAwardCandidates,
    confirmAwardee,
    batchConfirmAwardees,
    undoAwardeeConfirmation,
    resetStudentPassword,
    getPasswordResetRequests,
    approvePasswordResetRequest,
    refreshAuditLogs
  } = useOSAD()

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
  const [isAddClubOpen, setIsAddClubOpen] = useState(false)
  const [newClubData, setNewClubData] = useState({ name: '', parent_org: 'Computer Society NDMU', category: 'Non-Academic Club & Extra-Curricular' })

  // Persistent Student Organizations State
  const [persistentOrgs, setPersistentOrgs] = useState(organizations)

  const loadPersistentOrgs = React.useCallback(async () => {
    try {
      const data = await apiFetchOrganizations()
      if (Array.isArray(data) && data.length > 0) {
        setPersistentOrgs(data)
      }
    } catch (err) {
      console.warn('Failed to load persistent organizations:', err)
    }
  }, [])

  React.useEffect(() => {
    loadPersistentOrgs()
  }, [loadPersistentOrgs])

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null)
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Hierarchy Creation Handlers
  const handleCreateCollegeSubmit = async (collegeData) => {
    showToast(`Created Academic College: [${collegeData.code}] ${collegeData.name}`)
  }

  const handleCreateProgramSubmit = async (progData) => {
    createDegreeProgram(progData)
    showToast(`Created Academic Program: [${progData.code}] ${progData.name}`)
  }

  // Handle Create Organization (Persistent API Submission)
  const handleCreateOrganizationSubmit = async (formData, rawData) => {
    const created = await apiCreateOrganization(formData)
    await loadPersistentOrgs()
    showToast(`Created Student Organization: [${rawData.code || rawData.name}] ${rawData.name}`)
    return created
  }

  // Handle Create Club
  const handleCreateClubSubmit = (e) => {
    e.preventDefault()
    if (!newClubData.name) return
    createClub(newClubData)
    setIsAddClubOpen(false)
    setNewClubData({ name: '', parent_org: organizations[0]?.name || 'Computer Society NDMU', category: 'Non-Academic Club & Extra-Curricular' })
    showToast(`Created Student Club: [${newClubData.name}]`)
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

      {/* Sub-View Routing */}
      {activeTab === 'overview' && (
        <OSADCommandCenterPage 
          setSearchParams={setSearchParams} 
          awardees={awardees} 
          candidateDecisions={awardees}
          currentUser={currentUser}
          metrics={metrics}
          awardCategories={awardCategories}
          getUsers={getUsers}
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
          getUsers={getUsers}
          getStudentPortfolios={getStudentPortfolios}
          resetStudentPassword={resetStudentPassword}
          getPasswordResetRequests={getPasswordResetRequests}
          approvePasswordResetRequest={approvePasswordResetRequest}
          showToast={showToast}
        />
      )}

      {activeTab === 'academic-programs' && (
        <OSADAcademicProgramsPage
          colleges={colleges}
          academicPrograms={degreePrograms}
          setIsAddCollegeOpen={setIsAddCollegeOpen}
          setIsAddProgramOpen={setIsAddProgramOpen}
          setPersonnelSelectorTarget={setPersonnelSelectorTarget}
        />
      )}

      {activeTab === 'organizations' && (
        <OSADStudentOrganizationsPage
          organizations={organizations}
          clubs={clubs}
          setIsAddOrgOpen={setIsAddOrgOpen}
          setIsAddClubOpen={setIsAddClubOpen}
          setPersonnelSelectorTarget={setPersonnelSelectorTarget}
        />
      )}

      {activeTab === 'awards' && (
        <OSADAwardsAndCriteriaPage />
      )}

      {activeTab === 'certificate-templates' && (
        <OSADCertificateTemplatesPage />
      )}

      {(activeTab === 'candidate-review' || activeTab === 'awardees') && (
        <OSADAwardCandidateReviewPage
          awardCategories={awardCategories}
          awardees={awardees}
          candidateDecisions={awardees}
          getUsers={getUsers}
          getStudentLeaderboards={getStudentLeaderboards}
          generateAwardCandidates={generateAwardCandidates}
          advanceCandidateToInterview={confirmAwardee}
          doNotAdvanceCandidate={undoAwardeeConfirmation}
          reverseAdvancementDecision={undoAwardeeConfirmation}
          confirmAwardee={confirmAwardee}
          batchConfirmAwardees={batchConfirmAwardees}
          undoAwardeeConfirmation={undoAwardeeConfirmation}
          showToast={showToast}
        />
      )}

      {activeTab === 'accreditation-reports' && (
        <OSADAccreditationReportsPage
          accreditationReports={accreditationReports}
          getAccreditationReportDetails={getAccreditationReportDetails}
          showToast={showToast}
        />
      )}

      {activeTab === 'system-logs' && (
        <OSADSystemAuditLogsPage
          auditLogs={auditLogs}
          refreshAuditLogs={refreshAuditLogs}
        />
      )}

      {activeTab === 'password-resets' && (
        <OSADPasswordResetRequestsPage />
      )}

      {/* Personnel Selector Modal */}
      {personnelSelectorTarget && (
        <PersonnelSelectorModal
          isOpen={Boolean(personnelSelectorTarget)}
          title={personnelSelectorTarget.title}
          targetName={personnelSelectorTarget.targetName}
          roleType={personnelSelectorTarget.roleType}
          personnelList={getPersonnelList()}
          onClose={() => setPersonnelSelectorTarget(null)}
          onSelect={(personnel) => {
            if (personnelSelectorTarget.roleType === 'coordinator') {
              showToast(`Assigned ${personnel.full_name} as Program Coordinator for [${personnelSelectorTarget.targetName}]`)
            } else if (personnelSelectorTarget.roleType === 'moderator') {
              assignOrganizationModerator(personnel.id, personnelSelectorTarget.targetName)
              showToast(`Assigned ${personnel.full_name} as Org Moderator for [${personnelSelectorTarget.targetName}]`)
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
        isOpen={isAddProgramOpen}
        onClose={() => setIsAddProgramOpen(false)}
        onSubmit={handleCreateProgramSubmit}
        colleges={colleges}
      />

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={isAddOrgOpen}
        onClose={() => setIsAddOrgOpen(false)}
        onSubmit={handleCreateOrganizationSubmit}
        colleges={colleges}
        degreePrograms={degreePrograms}
      />

      {/* Discard Confirmation Dialogs */}
      <ConfirmDialog
        open={orgConfirmClose.isConfirmOpen}
        title="Discard Organization Changes?"
        message="Are you sure you want to close? Your unsaved organization details will be lost."
        confirmLabel="Discard Changes"
        cancelLabel="Continue Editing"
        onConfirm={orgConfirmClose.confirmDiscard}
        onCancel={orgConfirmClose.cancelDiscard}
      />

    </div>
  )
}
