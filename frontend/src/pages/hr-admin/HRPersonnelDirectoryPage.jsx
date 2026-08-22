import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useHR } from '../../hooks/useHR'
import PersonnelDirectoryHeader from './personnel-directory/PersonnelDirectoryHeader'
import GovernanceTabs from './personnel-directory/GovernanceTabs'
import PersonnelDirectoryTable from './personnel-directory/PersonnelDirectoryTable'
import FacultyDossierDrawer from './personnel-directory/FacultyDossierDrawer'
import EditAssignmentModal from './personnel-directory/EditAssignmentModal'
import DepartmentAssignments from './personnel-directory/DepartmentAssignments'
import PasswordResetQueue from './personnel-directory/PasswordResetQueue'
import OnboardPersonnelModal from './personnel-directory/OnboardPersonnelModal'
import ResetPersonnelPasswordModal from './personnel-directory/ResetPersonnelPasswordModal'

export function HRPersonnelDirectoryPage(props) {
  const hrHook = useHR()
  const [searchParams, setSearchParams] = useSearchParams()

  const personnelList = props.personnelList || hrHook.personnelList || []
  const passwordResets = props.passwordResets || hrHook.passwordResets || []
  const handleApprovePasswordReset = props.handleApprovePasswordReset || hrHook.handleApprovePasswordReset
  const handleCreatePersonnelAccount = props.handleCreatePersonnelAccount || hrHook.handleCreatePersonnelAccount
  const handleAssignDepartmentSecretary = props.handleAssignDepartmentSecretary || hrHook.handleAssignDepartmentSecretary
  const handleUpdateRank = props.handleUpdateRank || hrHook.handleUpdateRank

  // Tab State: 'directory' | 'departments' | 'resets'
  const tabQuery = searchParams.get('tab')
  const [activeTab, setActiveTabState] = useState(tabQuery || 'directory')

  useEffect(() => {
    if (tabQuery && tabQuery !== activeTab) {
      setActiveTabState(tabQuery)
    }
  }, [tabQuery])

  const setActiveTab = (tab) => {
    setActiveTabState(tab)
    setSearchParams({ tab })
  }

  // Selected Personnel for Drawer & Modals
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [isDossierOpen, setIsDossierOpen] = useState(false)
  const [editingAssignmentPersonnel, setEditingAssignmentPersonnel] = useState(null)
  const [resetPasswordPersonnel, setResetPasswordPersonnel] = useState(null)

  // Modals & Toast State
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

  // Controlled Directory Sorting State
  const [directorySort, setDirectorySort] = useState({
    column: 'full_name',
    direction: 'asc'
  })

  // Onboarding Reveal & Highlight State
  const [newlyCreatedId, setNewlyCreatedId] = useState(null)
  const [revealRequestKey, setRevealRequestKey] = useState(0)

  // 8-second highlight cleanup timer
  useEffect(() => {
    if (!newlyCreatedId) return undefined

    const timeoutId = window.setTimeout(() => {
      setNewlyCreatedId(null)
    }, 8000)

    return () => window.clearTimeout(timeoutId)
  }, [newlyCreatedId])

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
    setResetPasswordPersonnel(p)
  }

  const handleConfirmResetPassword = (p, tempPassword) => {
    showToast(`Issued temporary credentials reset passkey (${tempPassword}) for ${p.full_name || 'personnel'}.`)
    setResetPasswordPersonnel(null)
  }

  const handleManageRole = (p, roleKey) => {
    showToast(`Updated administrative role authorization for ${p.full_name}.`)
  }

  const handleOnboardSubmit = async (formData) => {
    try {
      const createdRecord = await Promise.resolve(
        handleCreatePersonnelAccount?.(formData)
      )

      setActiveTab('directory')
      setDirectorySort({ column: 'created_at', direction: 'desc' })
      setRevealRequestKey(prev => prev + 1)
      if (createdRecord && createdRecord.id) {
        setNewlyCreatedId(createdRecord.id)
      }

      if (formData.action === 'save_pending' || formData.is_pending_placement) {
        showToast(`Personnel record saved as Pending Placement. Complete placement before sending an invitation.`)
      } else {
        showToast(`Personnel account created for ${formData.full_name || 'personnel'} and activation invitation sent.`)
      }
      setIsOnboardingOpen(false)
    } catch (err) {
      console.error('Onboarding failed:', err)
      showToast(`Failed to onboard personnel account. Please try again.`)
    }
  }

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#176B43] text-white font-extrabold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
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
        <PersonnelDirectoryTable
          personnelList={personnelList}
          sortConfig={directorySort}
          onSortChange={setDirectorySort}
          newlyCreatedId={newlyCreatedId}
          revealRequestKey={revealRequestKey}
          onSelectPersonnel={handleOpenDossier}
          onEditAssignment={handleOpenEditAssignment}
          onPromoteRank={handleOpenDossier}
          onResetPassword={handleResetPassword}
          onManageRole={handleManageRole}
          showToast={showToast}
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
          passwordResets={passwordResets}
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

      {/* Reset Personnel Password Modal */}
      <ResetPersonnelPasswordModal
        personnel={resetPasswordPersonnel}
        isOpen={Boolean(resetPasswordPersonnel)}
        onClose={() => setResetPasswordPersonnel(null)}
        onConfirmReset={handleConfirmResetPassword}
      />

      {/* Onboard Personnel Multi-Step Modal */}
      <OnboardPersonnelModal
        isOpen={isOnboardingOpen}
        evaluatorContext={{ evaluatorId: 'HR-2010-001', role: 'hr_staff' }}
        onClose={() => setIsOnboardingOpen(false)}
        onSubmit={handleOnboardSubmit}
      />
    </div>
  )
}

export const HRPersonnelDirectory = HRPersonnelDirectoryPage
export default HRPersonnelDirectoryPage
