import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useHR } from '../../hooks/useHR'
import PersonnelDirectoryHeader from './personnel-directory/PersonnelDirectoryHeader'
import GovernanceTabs from './personnel-directory/GovernanceTabs'
import PersonnelDirectoryTable from './personnel-directory/PersonnelDirectoryTable'
import FacultyDossierDrawer from './personnel-directory/FacultyDossierDrawer'
import EditAssignmentModal from './personnel-directory/EditAssignmentModal'
import EditMasterDataModal from './personnel-directory/EditMasterDataModal'
import PasswordResetQueue from './personnel-directory/PasswordResetQueue'
import OnboardPersonnelModal from './personnel-directory/OnboardPersonnelModal'
import BatchImportPersonnelModal from './personnel-directory/BatchImportPersonnelModal'
import ResetPersonnelPasswordModal from './personnel-directory/ResetPersonnelPasswordModal'
import { collectPersonnelPlacementOptions, mergePlacementMasterData } from '../../utils/personnelPlacement'
import { updatePersonnelMasterData, updatePersonnelAssignment } from '../../services/hrAdminService'
import lifecycleService from '../../services/lifecycleService'
import { personnelMasterDataService } from '../../services/personnelMasterDataService'

export function HRPersonnelDirectoryPage(props) {
  // This route needs directory and reset data only. Dashboard and audit data
  // have their own routes and must not block the personnel table.
  const hrHook = useHR({ resources: ['directory', 'passwordResets'] })
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const personnelList = props.personnelList || hrHook.personnelList
  const passwordResets = props.passwordResets || hrHook.passwordResets
  const handleApprovePasswordReset = props.handleApprovePasswordReset || hrHook.handleApprovePasswordReset
  const handleCreatePersonnelAccount = props.handleCreatePersonnelAccount || hrHook.handleCreatePersonnelAccount

  // Master Data Placement Options State (Institutional API backed)
  const [institutionalMasterData, setInstitutionalMasterData] = useState({
    colleges: [],
    academicPrograms: [],
    administrativeUnits: []
  })

  useEffect(() => {
    let isMounted = true
    Promise.all([
      personnelMasterDataService.getColleges(),
      personnelMasterDataService.getAcademicPrograms(),
      personnelMasterDataService.getDepartments()
    ]).then(([colleges, programs, departments]) => {
      if (isMounted) {
        setInstitutionalMasterData({
          colleges: colleges || [],
          academicPrograms: programs || [],
          administrativeUnits: departments || []
        })
      }
    }).catch(err => {
      console.warn('Failed to load institutional placement master data:', err?.message)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const placementOptions = useMemo(() => {
    const scraped = collectPersonnelPlacementOptions(personnelList)
    return mergePlacementMasterData(scraped, institutionalMasterData)
  }, [personnelList, institutionalMasterData])

  // Tab State: 'directory' | 'resets'
  const tabQuery = searchParams.get('tab')
  const safeTabQuery = tabQuery === 'resets' ? 'resets' : 'directory'
  const [activeTab, setActiveTabState] = useState(safeTabQuery)

  useEffect(() => {
    if (safeTabQuery !== activeTab) {
      setActiveTabState(safeTabQuery)
    }
  }, [safeTabQuery, activeTab])

  const setActiveTab = (tab) => {
    setActiveTabState(tab)
    setSearchParams({ tab })
  }

  // Selected Personnel for Drawer & Modals
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [isDossierOpen, setIsDossierOpen] = useState(false)
  const [editingAssignmentPersonnel, setEditingAssignmentPersonnel] = useState(null)
  const [editingMasterDataPersonnel, setEditingMasterDataPersonnel] = useState(null)
  const [resetPasswordPersonnel, setResetPasswordPersonnel] = useState(null)

  // Modals & Toast State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false)
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

  const handleOpenEditMasterData = (p) => {
    setEditingMasterDataPersonnel(p)
  }

  const handleSaveAssignment = async (updatedData) => {
    await updatePersonnelAssignment(updatedData.id || updatedData.profile_id, {
      college_id: updatedData.college_id,
      academic_program_ids: updatedData.academic_program_ids,
      administrative_unit_id: updatedData.administrative_unit_id
    })
    showToast(`Updated assignment for ${updatedData.full_name || 'personnel'}.`)
    setEditingAssignmentPersonnel(null)
    await hrHook.refreshData?.()
  }

  const handleSaveMasterData = async (profileId, payload) => {
    try {
      const result = await updatePersonnelMasterData(profileId, payload)
      const saved = result?.data || result
      setSelectedFaculty(current => (
        current && (current.id === profileId || current.profile_id === profileId)
          ? { ...current, full_name: saved?.full_name || payload.full_name }
          : current
      ))
      showToast('HR Master Data updated successfully with audit trail.')
      setEditingMasterDataPersonnel(null)
      await hrHook.refreshData?.()
    } catch (err) {
      console.error('Failed to update master data:', err)
      showToast('Failed to update master data. Please check authorization.')
      throw err
    }
  }

  const handlePromoteRank = (p, newRank, newStatus) => {
    // Rank changes are not saved from the directory yet, so do not report one as done.
    showToast(`No rank change was saved for ${p.full_name}. Rank changes are not available from the directory yet.`)
  }

  const handleResetPassword = (p) => {
    setResetPasswordPersonnel(p)
  }

  // Returns the server-issued one-time credential; the modal shows it and surfaces any error.
  const handleConfirmResetPassword = async (p) => {
    const result = await lifecycleService.resetTemporaryPassword(p.id || p.profile_id)
    showToast(`Temporary password issued for ${p.full_name || 'personnel'}.`)
    return result
  }

  // HR's only governance role is Dean, which has its own assign/reassign/revoke flow on the organization page.
  const handleManageRole = () => {
    navigate('/hr/organizational-structure')
  }

  const handleOnboardSubmit = async (formData) => {
    try {
      const createdRecord = await Promise.resolve(
        handleCreatePersonnelAccount?.(formData)
      )

      setActiveTab('directory')
      setDirectorySort({ column: 'created_at', direction: 'desc' })
      setRevealRequestKey(prev => prev + 1)
      if (createdRecord && (createdRecord.id || createdRecord.data?.id)) {
        setNewlyCreatedId(createdRecord.id || createdRecord.data?.id)
      }

      if (formData.action === 'save_pending' || formData.is_pending_placement) {
        showToast(`Personnel record saved as Pending Placement. Complete placement before sending an invitation.`)
      } else {
        showToast(`Personnel account created for ${formData.full_name || 'personnel'} and activation invitation sent.`)
      }
      return createdRecord
    } catch (err) {
      console.error('Onboarding failed:', err)
      showToast(`Failed to onboard personnel account. Please try again.`)
      throw err
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
        summary={props.directorySummary || hrHook.directorySummary}
        summaryLoading={!props.personnelList && hrHook.isLoading}
        totalCount={personnelList.length}
        pendingResetsCount={passwordResets.filter(r => r.status === 'pending').length}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenBatchImport={() => setIsBatchImportOpen(true)}
      />

      {/* Governance Roster Tabs */}
      <GovernanceTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        personnelCount={personnelList.length}
        pendingResetsCount={passwordResets.filter(r => r.status === 'pending').length}
      />

      {/* Main Tab Views */}
      {activeTab === 'directory' && hrHook.error && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200">
          <span>{hrHook.error}</span>
          <button type="button" onClick={() => hrHook.refreshData?.()} className="font-bold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700">Retry directory</button>
        </div>
      )}

      {activeTab === 'directory' && hrHook.isLoading && (
        <div aria-label="Loading Personnel Directory" className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {[1, 2, 3, 4, 5].map(row => <div key={row} className="h-16 animate-pulse bg-slate-50/80 dark:bg-slate-800/30" />)}
        </div>
      )}

      {activeTab === 'directory' && !hrHook.isLoading && (
        <PersonnelDirectoryTable
          personnelList={personnelList}
          sortConfig={directorySort}
          onSortChange={setDirectorySort}
          newlyCreatedId={newlyCreatedId}
          revealRequestKey={revealRequestKey}
          onSelectPersonnel={handleOpenDossier}
          onEditAssignment={handleOpenEditAssignment}
          onEditMasterData={handleOpenEditMasterData}
          onPromoteRank={handleOpenDossier}
          onResetPassword={handleResetPassword}
          onManageRole={handleManageRole}
          showToast={showToast}
        />
      )}

      {activeTab === 'resets' && (
        <PasswordResetQueue
          passwordResets={passwordResets}
          resets={passwordResets}
          onApproveReset={async (reqId) => {
            const res = await handleApprovePasswordReset(reqId)
            const temporaryPassword = res?.temporary_password
            showToast(temporaryPassword
              ? `Reset approved. Copy the one-time temporary password now: ${temporaryPassword}`
              : 'Reset approved. The temporary credential was issued securely.')
          }}
        />
      )}

      {/* Slide-over Faculty Dossier Drawer */}
      <FacultyDossierDrawer
        personnel={selectedFaculty}
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        onEditAssignment={handleOpenEditAssignment}
        onEditMasterData={handleOpenEditMasterData}
        onPromoteRank={handlePromoteRank}
        onResetPassword={handleResetPassword}
        onManageRole={handleManageRole}
      />

      {/* Edit Master Data Modal (Plan D2 HR Control) */}
      <EditMasterDataModal
        personnel={editingMasterDataPersonnel}
        isOpen={Boolean(editingMasterDataPersonnel)}
        onClose={() => setEditingMasterDataPersonnel(null)}
        onSave={handleSaveMasterData}
        placementOptions={placementOptions}
      />

      {/* Edit Organizational Assignment Modal */}
      <EditAssignmentModal
        personnel={editingAssignmentPersonnel}
        isOpen={Boolean(editingAssignmentPersonnel)}
        onClose={() => setEditingAssignmentPersonnel(null)}
        onSave={handleSaveAssignment}
        placementOptions={placementOptions}
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
        onClose={() => setIsOnboardingOpen(false)}
        onSubmit={handleOnboardSubmit}
        placementOptions={placementOptions}
      />

      {/* Batch Import Personnel XLSX Modal */}
      <BatchImportPersonnelModal
        isOpen={isBatchImportOpen}
        onClose={() => setIsBatchImportOpen(false)}
        onSuccess={() => hrHook.refreshData?.()}
        showToast={showToast}
      />
    </div>
  )
}

export const HRPersonnelDirectory = HRPersonnelDirectoryPage
export default HRPersonnelDirectoryPage
