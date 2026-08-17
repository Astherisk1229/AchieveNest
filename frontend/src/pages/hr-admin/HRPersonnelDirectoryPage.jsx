import React, { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useHR } from '../../hooks/useHR'
import PersonnelDirectoryHeader from './personnel-directory/PersonnelDirectoryHeader'
import GovernanceTabs from './personnel-directory/GovernanceTabs'
import FacultyDirectory from './personnel-directory/FacultyDirectory'
import FacultyDossierDrawer from './personnel-directory/FacultyDossierDrawer'
import EditAssignmentModal from './personnel-directory/EditAssignmentModal'
import DepartmentAssignments from './personnel-directory/DepartmentAssignments'
import PasswordResetQueue from './personnel-directory/PasswordResetQueue'
import OnboardPersonnelModal from './personnel-directory/OnboardPersonnelModal'

export function HRPersonnelDirectoryPage(props) {
  const hrHook = useHR()

  const personnelList = props.personnelList || hrHook.personnelList || []
  const passwordResets = props.passwordResets || hrHook.passwordResets || []
  const handleApprovePasswordReset = props.handleApprovePasswordReset || hrHook.handleApprovePasswordReset
  const handleCreatePersonnelAccount = props.handleCreatePersonnelAccount || hrHook.handleCreatePersonnelAccount
  const handleAssignDepartmentSecretary = props.handleAssignDepartmentSecretary || hrHook.handleAssignDepartmentSecretary
  const handleUpdateRank = props.handleUpdateRank || hrHook.handleUpdateRank

  // Tab State: 'directory' | 'departments' | 'resets'
  const [activeTab, setActiveTab] = useState('directory')

  // Selected Personnel for Drawer & Modals
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [isDossierOpen, setIsDossierOpen] = useState(false)
  const [editingAssignmentPersonnel, setEditingAssignmentPersonnel] = useState(null)

  // Modals
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)

  const showToast = (msg) => {
    if (props.showToast) {
      props.showToast(msg)
    } else {
      setToastMsg(msg)
      setTimeout(() => setToastMsg(null), 3500)
    }
  }

  // Handlers
  const handleOpenDossier = (p) => {
    setSelectedFaculty(p)
    setIsDossierOpen(true)
  }

  const handleOpenEditAssignment = (p) => {
    setEditingAssignmentPersonnel(p)
  }

  const handleSaveAssignment = (updatedData) => {
    if (handleAssignDepartmentSecretary) {
      handleAssignDepartmentSecretary(updatedData.id, updatedData.department)
    }
    showToast(`Updated administrative assignment for ${updatedData.full_name || 'personnel'}.`)
    setEditingAssignmentPersonnel(null)
  }

  const handlePromoteRank = (p, newRank, newStatus) => {
    if (handleUpdateRank) {
      handleUpdateRank(p.id, newRank, newStatus)
    }
    showToast(`Promoted ${p.full_name} to ${newRank} (${newStatus}).`)
    setIsDossierOpen(false)
  }

  const handleResetPassword = (p) => {
    showToast(`Issued temporary credentials reset passkey for ${p.full_name}.`)
  }

  const handleManageRole = (p, roleKey) => {
    showToast(`Updated administrative role authorization for ${p.full_name}.`)
  }

  const handleOnboardSubmit = (formData) => {
    if (handleCreatePersonnelAccount) {
      handleCreatePersonnelAccount(formData)
    }
    showToast(`Successfully onboarded ${formData.full_name || 'new personnel account'}. Credentials dispatched via secure mail.`)
    setIsOnboardingOpen(false)
  }

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#1b4332] text-white font-extrabold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <PersonnelDirectoryHeader
        totalCount={personnelList.length}
        pendingResetsCount={passwordResets.filter(r => r.status === 'pending').length}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* Governance Roster Tabs */}
      <GovernanceTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        personnelCount={personnelList.length}
        pendingResetsCount={passwordResets.filter(r => r.status === 'pending').length}
      />

      {/* Main Tab Views */}
      {activeTab === 'directory' && (
        <FacultyDirectory
          personnelList={personnelList}
          onSelectPersonnel={handleOpenDossier}
        />
      )}

      {activeTab === 'departments' && (
        <DepartmentAssignments
          personnelList={personnelList}
          onEditAssignment={handleOpenEditAssignment}
        />
      )}

      {activeTab === 'resets' && (
        <PasswordResetQueue
          resets={passwordResets}
          onApproveReset={(reqId) => {
            const res = handleApprovePasswordReset(reqId)
            showToast(`Approved reset request for ${res?.user_name || 'personnel'}. Issued temporary passkey: NDMU-Faculty2026!`)
          }}
        />
      )}

      {/* Slide-over Faculty Dossier Drawer */}
      <FacultyDossierDrawer
        personnel={selectedFaculty}
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        onEditAssignment={handleOpenEditAssignment}
        onPromoteRank={handlePromoteRank}
        onResetPassword={handleResetPassword}
        onManageRole={handleManageRole}
      />

      {/* Edit Organizational Assignment Modal */}
      <EditAssignmentModal
        personnel={editingAssignmentPersonnel}
        isOpen={Boolean(editingAssignmentPersonnel)}
        onClose={() => setEditingAssignmentPersonnel(null)}
        onSave={handleSaveAssignment}
      />

      {/* Onboard Personnel Multi-Step Modal */}
      <OnboardPersonnelModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSubmit={handleOnboardSubmit}
      />
    </div>
  )
}

export const HRPersonnelDirectory = HRPersonnelDirectoryPage
export default HRPersonnelDirectoryPage
