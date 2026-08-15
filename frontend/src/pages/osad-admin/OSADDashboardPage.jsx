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
import PersonnelSelectorModal from './modals/PersonnelSelectorModal'
import OSADCommandCenterPage from './OSADCommandCenterPage'
import OSADStudentGovernancePage from './OSADStudentGovernancePage'
import OSADDepartmentsProgramsPage from './OSADDepartmentsProgramsPage'
import OSADStudentOrganizationsPage from './OSADStudentOrganizationsPage'
import OSADAwardCategoriesPage from './OSADAwardCategoriesPage'
import OSADIdentifyAwardeesPage from './OSADIdentifyAwardeesPage'
import OSADAccreditationReportsPage from './OSADAccreditationReportsPage'
import OSADSystemAuditLogsPage from './OSADSystemAuditLogsPage'

export default function OSADDashboardPage({ currentUser }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  const {
    metrics,
    departments,
    organizations,
    clubs,
    awardCategories,
    awardees,
    accreditationReports,
    auditLogs,
    getUsers,
    getPersonnelList,
    getStudentPortfolios,
    createDepartment,
    createOrganization,
    createClub,
    getStudentLeaderboards,
    getAccreditationReportDetails,
    assignCollegeDean,
    assignProgramCoordinator,
    assignOrganizationModerator,
    revokeRole,
    createAwardCategory,
    generateAwardCandidates,
    confirmAwardee,
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

  // Modal States
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false)
  const [newDeptData, setNewDeptData] = useState({ name: '', code: '', programs: 'BS Computer Science, BS Information Technology' })
  const [isAddOrgOpen, setIsAddOrgOpen] = useState(false)
  const [newOrgData, setNewOrgData] = useState({ name: '', category: 'CEAC — Department Organization' })
  const [isAddClubOpen, setIsAddClubOpen] = useState(false)
  const [newClubData, setNewClubData] = useState({ name: '', parent_org: 'Computer Society NDMU', category: 'Non-Academic Club & Extra-Curricular' })
  const [isAddAwardOpen, setIsAddAwardOpen] = useState(false)
  const [newAwardData, setNewAwardData] = useState({
    title: '',
    category_type: 'Academic Excellence',
    description: '',
    min_points: 200,
    weight_multiplier: 1.5,
    required_prerequisites: 'Program Coordinator Verification',
    attached_template_id: 'OSAD-TPL-01',
    attached_template_name: 'Official NDMU Certificate of Participation'
  })

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null)
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Handle Create Department
  const handleCreateDepartmentSubmit = (e) => {
    e.preventDefault()
    if (!newDeptData.name) return
    const progs = newDeptData.programs.split(',').map(p => p.trim()).filter(Boolean)
    const result = createDepartment({ name: newDeptData.name, code: newDeptData.code, programs: progs })
    setIsAddDeptOpen(false)
    setNewDeptData({ name: '', code: '', programs: 'BS Computer Science, BS Information Technology' })
    const reconciledMsg = (result?.reconciledCount || 0) > 0 
      ? ` & auto-reconciled ${result.reconciledCount} pre-imported student accounts!`
      : '!'
    showToast(`Created Academic Department: [${newDeptData.name}]${reconciledMsg}`)
  }

  // Handle Create Organization
  const handleCreateOrganizationSubmit = (e) => {
    e.preventDefault()
    if (!newOrgData.name) return
    createOrganization(newOrgData)
    setIsAddOrgOpen(false)
    setNewOrgData({ name: '', category: departments[0] ? `${departments[0].code} — Department Organization` : 'Non-Academic Club & Extra-Curricular' })
    showToast(`Created Student Organization: [${newOrgData.name}]`)
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
    setNewAwardData({
      title: '',
      category_type: 'Student Leadership',
      description: '',
      min_points: 200,
      weight_multiplier: 1.5,
      required_prerequisites: 'Program Coordinator Verification',
      attached_template_id: 'OSAD-TPL-01',
      attached_template_name: 'Official NDMU Certificate of Participation'
    })
    showToast(`Created Award Category: [${newAwardData.title}]`)
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-emerald-900 text-white text-xs font-bold shadow-2xl flex items-center gap-3 border border-emerald-500 animate-in fade-in slide-in-from-top duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sub-View Routing */}
      {activeTab === 'overview' && (
        <OSADCommandCenterPage 
          setSearchParams={setSearchParams} 
          awardees={awardees} 
        />
      )}

      {activeTab === 'accounts' && (
        <OSADStudentGovernancePage
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

      {activeTab === 'departments' && (
        <OSADDepartmentsProgramsPage
          departments={departments}
          setIsAddDeptOpen={setIsAddDeptOpen}
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

      {activeTab === 'awardees' && (
        <OSADIdentifyAwardeesPage
          awardCategories={awardCategories}
          generateAwardCandidates={generateAwardCandidates}
          confirmAwardee={confirmAwardee}
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

      {/* Personnel Selector Modal */}
      {personnelSelectorTarget && (
        <PersonnelSelectorModal
          title={personnelSelectorTarget.title}
          targetName={personnelSelectorTarget.targetName}
          roleType={personnelSelectorTarget.roleType}
          personnelList={getPersonnelList()}
          onClose={() => setPersonnelSelectorTarget(null)}
          onSelect={(personnelId) => {
            const personnel = getPersonnelList().find(p => p.id === personnelId)
            if (personnelSelectorTarget.roleType === 'dean') {
              assignCollegeDean(personnelId, personnelSelectorTarget.targetName)
              showToast(`Assigned ${personnel.full_name} as College Dean for [${personnelSelectorTarget.targetName}]`)
            } else if (personnelSelectorTarget.roleType === 'coordinator') {
              assignProgramCoordinator(personnelId, personnelSelectorTarget.targetName)
              showToast(`Assigned ${personnel.full_name} as Program Coordinator for [${personnelSelectorTarget.targetName}]`)
            } else if (personnelSelectorTarget.roleType === 'moderator') {
              assignOrganizationModerator(personnelId, personnelSelectorTarget.targetName)
              showToast(`Assigned ${personnel.full_name} as Org Moderator for [${personnelSelectorTarget.targetName}]`)
            }
            setPersonnelSelectorTarget(null)
          }}
        />
      )}

      {/* Create Department Modal */}
      {isAddDeptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#2d8a4e]" /> Create Academic Department
              </h3>
              <button onClick={() => setIsAddDeptOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Department Code</label>
                <input
                  type="text"
                  placeholder="e.g. CEAC"
                  value={newDeptData.code}
                  onChange={(e) => setNewDeptData({ ...newDeptData, code: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Department Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. College of Engineering, Architecture & Computing"
                  value={newDeptData.name}
                  onChange={(e) => setNewDeptData({ ...newDeptData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Programs (comma separated)</label>
                <input
                  type="text"
                  value={newDeptData.programs}
                  onChange={(e) => setNewDeptData({ ...newDeptData, programs: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddDeptOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2d8a4e] hover:bg-[#236e3e] shadow"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Organization Modal */}
      {isAddOrgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#2d8a4e]" /> Create Student Organization
              </h3>
              <button onClick={() => setIsAddOrgOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrganizationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Organization Name</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Society NDMU"
                  value={newOrgData.name}
                  onChange={(e) => setNewOrgData({ ...newOrgData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category Classification</label>
                <input
                  type="text"
                  value={newOrgData.category}
                  onChange={(e) => setNewOrgData({ ...newOrgData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOrgOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2d8a4e] hover:bg-[#236e3e] shadow"
                >
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Award Category Modal */}
      {isAddAwardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-[#2d8a4e]" /> Create Award Category
              </h3>
              <button onClick={() => setIsAddAwardOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAwardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Award Title</label>
                <input
                  type="text"
                  placeholder="e.g. Most Outstanding Student Researcher"
                  value={newAwardData.title}
                  onChange={(e) => setNewAwardData({ ...newAwardData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category Type</label>
                <select
                  value={newAwardData.category_type}
                  onChange={(e) => setNewAwardData({ ...newAwardData, category_type: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Academic Excellence">Academic Excellence</option>
                  <option value="Student Leadership">Student Leadership</option>
                  <option value="Community Involvement">Community Involvement</option>
                  <option value="Athletics & Sports">Athletics & Sports</option>
                  <option value="Culture & Arts">Culture & Arts</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={newAwardData.description}
                  onChange={(e) => setNewAwardData({ ...newAwardData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Min. Points</label>
                  <input
                    type="number"
                    value={newAwardData.min_points}
                    onChange={(e) => setNewAwardData({ ...newAwardData, min_points: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Weight Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAwardData.weight_multiplier}
                    onChange={(e) => setNewAwardData({ ...newAwardData, weight_multiplier: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddAwardOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2d8a4e] hover:bg-[#236e3e] shadow"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
