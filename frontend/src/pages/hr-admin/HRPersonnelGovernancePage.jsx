import React, { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useHR } from '../../hooks/useHR'
import PersonnelGovernanceHeader from './personnel-governance/PersonnelGovernanceHeader'
import GovernanceTabs from './personnel-governance/GovernanceTabs'
import FacultyDirectory from './personnel-governance/FacultyDirectory'
import FacultyDossierDrawer from './personnel-governance/FacultyDossierDrawer'
import EditAssignmentModal from './personnel-governance/EditAssignmentModal'
import DepartmentAssignments from './personnel-governance/DepartmentAssignments'
import PasswordResetQueue from './personnel-governance/PasswordResetQueue'
import OnboardPersonnelModal from './personnel-governance/OnboardPersonnelModal'

export function HRPersonnelGovernancePage(props) {
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

  const handleSaveAssignment = (personnelId, updateData) => {
    if (handleUpdateRank) {
      handleUpdateRank(personnelId, {
        college: updateData.college,
        department: updateData.department
      })
    }
    showToast(`Successfully updated organizational assignment for ${editingAssignmentPersonnel?.full_name || 'personnel'}.`)
    setEditingAssignmentPersonnel(null)
  }

  const handlePromoteRank = (p) => {
    const nextRank = p.academic_rank.includes('Instructor') ? 'Assistant Professor I' :
                     p.academic_rank.includes('Assistant') ? 'Associate Professor I' : 'Full Professor I'
    if (handleUpdateRank) {
      handleUpdateRank(p.id, { academic_rank: nextRank })
    }
    showToast(`Promoted ${p.full_name} to ${nextRank}.`)
  }

  const handleResetPassword = (p) => {
    showToast(`Issued temporary password for ${p.full_name}.`)
  }

  const handleManageRole = (p) => {
    showToast(`Managing account roles for ${p.full_name}.`)
  }

  const handleAssignSecretary = (departmentName, secretaryPerson, effectiveDate) => {
    if (handleAssignDepartmentSecretary) {
      handleAssignDepartmentSecretary(departmentName, secretaryPerson.id)
    }
    showToast(`Assigned ${secretaryPerson.full_name} as Department Secretary for ${departmentName}.`)
  }

  const handleOnboardSubmit = (formData) => {
    if (handleCreatePersonnelAccount) {
      handleCreatePersonnelAccount(formData)
    }
    showToast(`Successfully onboarded ${formData.full_name} as ${formData.academic_rank}.`)
  }

  const handleApproveReset = (requestId, tempPass) => {
    if (handleApprovePasswordReset) {
      handleApprovePasswordReset(requestId, tempPass)
    }
    showToast(`Password reset request approved and resolved.`)
  }

  const pendingResetCount = passwordResets.filter(r => r.status === 'pending').length

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#1b4332] text-white font-extrabold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Lightweight Header */}
      <PersonnelGovernanceHeader onOpenOnboarding={() => setIsOnboardingOpen(true)} />

      {/* 3 Task Navigation Tabs */}
      <GovernanceTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingResetCount={pendingResetCount}
      />

      {/* Tab Content Views */}
      {activeTab === 'directory' && (
        <FacultyDirectory
          personnelList={personnelList}
          onSelectFaculty={handleOpenDossier}
          onEditAssignment={handleOpenEditAssignment}
          onManageRole={handleManageRole}
          onResetPassword={handleResetPassword}
          onPromoteRank={handlePromoteRank}
        />
      )}

      {activeTab === 'departments' && (
        <DepartmentAssignments
          personnelList={personnelList}
          onAssignSecretary={handleAssignSecretary}
        />
      )}

      {activeTab === 'resets' && (
        <PasswordResetQueue
          passwordResets={passwordResets}
          onApproveReset={handleApproveReset}
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

export default HRPersonnelGovernancePage
