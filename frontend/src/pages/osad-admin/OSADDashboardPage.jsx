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
import OSADAwardCategoriesPage from './OSADAwardCategoriesPage'
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
  const INITIAL_AWARD_DATA = {
    title: '',
    category_type: 'Academic Excellence',
    description: '',
    min_points: 200,
    weight_multiplier: 1.5,
    required_prerequisites: 'Program Coordinator Verification',
    attached_template_id: 'OSAD-TPL-01',
    attached_template_name: 'Official NDMU Certificate of Participation'
  }

  // Modal States
  const [isAddCollegeOpen, setIsAddCollegeOpen] = useState(false)
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false)
  const [isAddOrgOpen, setIsAddOrgOpen] = useState(false)
  const [isAddClubOpen, setIsAddClubOpen] = useState(false)
  const [newClubData, setNewClubData] = useState({ name: '', parent_org: 'Computer Society NDMU', category: 'Non-Academic Club & Extra-Curricular' })
  const [isAddAwardOpen, setIsAddAwardOpen] = useState(false)
  const [newAwardData, setNewAwardData] = useState(INITIAL_AWARD_DATA)

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

  const awardConfirmClose = useConfirmableClose({
    isOpen: isAddAwardOpen,
    isDirty: () => (newAwardData.title || '').trim() !== '' || (newAwardData.description || '').trim() !== '' || newAwardData.category_type !== INITIAL_AWARD_DATA.category_type || newAwardData.min_points !== INITIAL_AWARD_DATA.min_points || newAwardData.weight_multiplier !== INITIAL_AWARD_DATA.weight_multiplier,
    onClose: () => setIsAddAwardOpen(false),
    onDiscard: () => setNewAwardData(INITIAL_AWARD_DATA)
  })

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

  // Handle Create Award Category
  const handleCreateAwardSubmit = (e) => {
    e.preventDefault()
    if (!newAwardData.title) return
    createAwardCategory(newAwardData)
    setIsAddAwardOpen(false)
    setNewAwardData(INITIAL_AWARD_DATA)
    showToast(`Created Award Category: [${newAwardData.title}]`)
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
        <OSADAwardCategoriesPage
          awardCategories={awardCategories}
          setIsAddAwardOpen={setIsAddAwardOpen}
        />
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

      {activeTab === 'reports' && (
        <OSADAccreditationReportsPage
          accreditationReports={accreditationReports}
          getAccreditationReportDetails={getAccreditationReportDetails}
          showToast={showToast}
        />
      )}

      {activeTab === 'audit' && (
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

      {/* Create Award Category Modal */}
      {isAddAwardOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) awardConfirmClose.requestClose() }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#16834a]" /> Create Award Category
              </h3>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={awardConfirmClose.requestClose}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAwardSubmit} className="space-y-3 text-xs font-medium">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Award Title</label>
                <input
                  type="text"
                  placeholder="e.g. Most Outstanding Student Researcher"
                  value={newAwardData.title}
                  onChange={(e) => setNewAwardData({ ...newAwardData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#69A97C]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category Type</label>
                <select
                  value={newAwardData.category_type}
                  onChange={(e) => setNewAwardData({ ...newAwardData, category_type: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#69A97C]"
                >
                  <option value="Academic Excellence">Academic Excellence</option>
                  <option value="Student Leadership">Student Leadership</option>
                  <option value="Community Involvement">Community Involvement</option>
                  <option value="Athletics & Sports">Athletics & Sports</option>
                  <option value="Culture & Arts">Culture & Arts</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows="2"
                  value={newAwardData.description}
                  onChange={(e) => setNewAwardData({ ...newAwardData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#69A97C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Min. Points</label>
                  <input
                    type="number"
                    value={newAwardData.min_points}
                    onChange={(e) => setNewAwardData({ ...newAwardData, min_points: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#69A97C]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Weight Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAwardData.weight_multiplier}
                    onChange={(e) => setNewAwardData({ ...newAwardData, weight_multiplier: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#69A97C]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={awardConfirmClose.requestClose}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                {/* Temporary accessibility correction. Feature is scheduled for replacement during Awards Alignment. */}
                <Button
                  type="submit"
                  size="sm"
                  className="shadow-2xs"
                >
                  Create Category
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      <ConfirmDialog
        open={awardConfirmClose.isConfirmOpen}
        title="Discard Award Category Changes?"
        message="Are you sure you want to close? Your unsaved category details will be lost."
        confirmLabel="Discard Changes"
        cancelLabel="Continue Editing"
        onConfirm={awardConfirmClose.confirmDiscard}
        onCancel={awardConfirmClose.cancelDiscard}
      />

    </div>
  )
}
