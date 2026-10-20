import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Users,
  Calendar,
  Award,
  MapPin,
  Clock,
  Plus,
  QrCode,
  Sparkles,
  CheckCircle2,
  Building2,
  Search,
  X,
  Edit,
  Trash2,
  ShieldCheck,
  Flag,
  Copy,
  ExternalLink,
  Lock,
  AlertTriangle,
  Unlock,
  XCircle,
  FileSpreadsheet,
  ArrowLeft,
  Mail,
  Share2,
  Check,
  Eye,
  Upload
} from 'lucide-react'



import { updateOrganizationModeratorProfile } from '../../../services/organizationAdminService'
import useOrganization from '../../../hooks/useOrganization'
import EventCreationModal from './EventCreationModal'
import AttendanceScannerModal from './AttendanceScannerModal'
import EventCardOptionsMenu from './EventCardOptionsMenu'
import SignatureVault, { cleanOrganizationSignatoryImage, cleanOrganizationSignatoryName, parseSignatoryInfo } from '../../../utils/signatureVault'
import DigitalCertificatesWorkspace from './certificates/DigitalCertificatesWorkspace'
import { alertDialog, confirmDialog } from '../../../components/ui/DialogProvider'




export default function OrganizationModeratorDashboardPage({ currentUser }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab')
  const isLegacyOverview = !rawTab || rawTab === 'dashboard' || rawTab === 'overview'
  const activeTab = isLegacyOverview ? 'events' : rawTab

  useEffect(() => {
    if (isLegacyOverview) setSearchParams({ tab: 'events' }, { replace: true })
  }, [isLegacyOverview, setSearchParams])

  const {
    orgInfo,
    events,
    eventsLoading,
    eventsError,
    metrics,
    createEvent,
    updateEvent,
    cancelEvent,
    attendanceSessions,
    attendanceSessionsLoading,
    attendanceSessionsError,
    activeAttendanceSession,
    attendanceRecords,
    attendanceRecordsLoading,
    attendanceRecordsError,
    loadAttendanceSessions,
    createAttendanceSession,
    selectAttendanceSession,
    openAttendanceSession,
    closeAttendanceSession,
    loadAttendanceRecords,
    refreshData,
    organizationLoading,
    organizationError
  } = useOrganization(currentUser)

  // Selected Active Event for Attendance Monitoring
  const [activeAttendanceEvtId, setActiveAttendanceEvtId] = useState('')
  const activeEvt = (events && events.length > 0)
    ? (events.find(e => e.id === activeAttendanceEvtId) || events[0])
    : null

  // Canonical Session Selection & Creation State
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] = useState(false)
  const [sessionFormData, setSessionFormData] = useState({
    session_name: '',
    session_type: 'general',
    check_in_start: '',
    check_in_end: ''
  })
  const [sessionFormError, setSessionFormError] = useState(null)
  const [sessionFormSubmitting, setSessionFormSubmitting] = useState(false)
  const [attendanceActionError, setAttendanceActionError] = useState(null)
  const [attendanceActionLoading, setAttendanceActionLoading] = useState(false)
  const [showCopiedToast, setShowCopiedToast] = useState(false)

  // Sync active attendance event
  useEffect(() => {
    if (events && events.length > 0) {
      if (!activeAttendanceEvtId || !events.some(e => e.id === activeAttendanceEvtId)) {
        setActiveAttendanceEvtId(events[0].id)
      }
    }
  }, [events, activeAttendanceEvtId])

  // Load attendance sessions when active event changes
  useEffect(() => {
    if (activeAttendanceEvtId) {
      setAttendanceActionError(null)
      loadAttendanceSessions(activeAttendanceEvtId).catch(() => {})
    }
  }, [activeAttendanceEvtId, loadAttendanceSessions])

  // Sync selected session and load records
  useEffect(() => {
    if (attendanceSessions && attendanceSessions.length > 0) {
      const match = attendanceSessions.find(s => s.id === selectedSessionId)
      if (match) {
        selectAttendanceSession(match.id).catch(() => {})
      } else {
        setSelectedSessionId(attendanceSessions[0].id)
        selectAttendanceSession(attendanceSessions[0].id).catch(() => {})
      }
    } else {
      setSelectedSessionId(null)
      selectAttendanceSession(null).catch(() => {})
    }
  }, [attendanceSessions])


  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  // Attendance Safeguards & Monitoring States
  const [confirmModalAction, setConfirmModalAction] = useState(null) // null | 'Closed'
  const [_liveStreamSearchTerm, _setLiveStreamSearchTerm] = useState('')
  const [_autoLockGuard, _setAutoLockGuard] = useState(true)
  const [_isEventPickerOpen, _setIsEventPickerOpen] = useState(false)
  const [_eventPickerSearch, _setEventPickerSearch] = useState('')

  // Manage Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const [profileSaveError, setProfileSaveError] = useState('')
  const [profileSaveNotice, setProfileSaveNotice] = useState('')
  const [profileData, setProfileData] = useState({
    name: '',
    code: '',
    college: '',
    academic_year: '',
    moderator_name: '',
    description: '',
    contact_email: '',
    college_dept: '',
    facebook_url: '',
    established_year: '',
    social_status: ''
  })
  const [savedProfileData, setSavedProfileData] = useState(null)

  useEffect(() => {
    if (orgInfo) {
      const canonicalProfile = {
        name: orgInfo.name || '',
        code: orgInfo.code || '',
        college: orgInfo.college || '',
        academic_year: orgInfo.academic_year || '',
        moderator_name: orgInfo.moderator_name || '',
        description: orgInfo.profile_configuration?.description ?? '',
        contact_email: orgInfo.profile_configuration?.contact_email ?? '',
        college_dept: orgInfo.college_dept || orgInfo.college || '',
        facebook_url: orgInfo.profile_configuration?.facebook_url ?? '',
        established_year: orgInfo.established_year || '',
        social_status: orgInfo.social_status || ''
      }
      setProfileData(canonicalProfile)
      setSavedProfileData(canonicalProfile)
    }
  }, [orgInfo])

  const handleSaveProfile = async () => {
    if (!orgInfo?.id || isProfileSaving) return
    setIsProfileSaving(true)
    setProfileSaveError('')
    setProfileSaveNotice('')
    try {
      const result = await updateOrganizationModeratorProfile(orgInfo.id, {
        description: profileData.description,
        contact_email: profileData.contact_email,
        facebook_url: profileData.facebook_url
      })
      const savedProfile = result?.profile_configuration || {}
      const updatedProfile = {
        ...profileData,
        description: savedProfile.description ?? profileData.description,
        contact_email: savedProfile.contact_email ?? profileData.contact_email,
        facebook_url: savedProfile.facebook_url ?? profileData.facebook_url
      }
      setProfileData(updatedProfile)
      setSavedProfileData(updatedProfile)
      setIsEditingProfile(false)
      setProfileSaveNotice('Organization profile saved.')
    } catch (error) {
      setProfileSaveError(error?.response?.data?.error?.message || error?.message || 'Could not save the organization profile. Try again.')
    } finally {
      setIsProfileSaving(false)
    }
  }

  // Manage Events Search, Filter & Detail View states
  const [eventsSearchTerm, setEventsSearchTerm] = useState('')
  const [eventsFilter, setEventsFilter] = useState('All')
  const [manageEventsViewMode, setManageEventsViewMode] = useState('list') // 'list' | 'details'
  const [selectedEventDetail, setSelectedEventDetail] = useState(null)
  const [rosterSearchTerm, setRosterSearchTerm] = useState('')

  // Sync selectedEventDetail when events updates
  useEffect(() => {
    if (selectedEventDetail) {
      const updated = events.find(e => e.id === selectedEventDetail.id)
      if (updated) setSelectedEventDetail(updated)
    }
  }, [events])

  // Handler to view event full details
  const handleViewEventDetails = (evt) => {
    setSelectedEventDetail(evt)
    setManageEventsViewMode('details')
  }

  // Handler to return back to manage events list
  const handleBackToManageEvents = () => {
    setManageEventsViewMode('list')
    setSelectedEventDetail(null)
  }

  // Handler to navigate directly to Attendance Session for a specific event
  const handleGoToAttendanceSession = (eventId) => {
    if (eventId) {
      setActiveAttendanceEvtId(eventId)
    }
    setSearchParams({ tab: 'attendance' })
  }

  // Handler to open create event modal directly in Manage Events
  const handleOpenCreateModal = () => {
    setEditingEvent(null)
    setIsCreateOpen(true)
  }

  // Handler to open edit event modal
  const handleOpenEditModal = (evt) => {
    setEditingEvent(evt)
    setIsCreateOpen(true)
  }

  // Canonical cancellation preserves the persisted Event record.
  const handleCancelEvent = async (evtId) => {
    if (
      await confirmDialog({
        title: 'Cancel this event?',
        message: 'The event will be marked as cancelled. Its record will be preserved.',
        confirmLabel: 'Cancel event',
        cancelLabel: 'Keep event',
        tone: 'destructive',
      })
    ) {
      try {
        await cancelEvent(evtId)
      } catch (error) {
        const message = (
          error?.error?.message
          ?? error?.message
          ?? 'Unable to cancel the Event.'
        )

        alertDialog({ title: 'Event not cancelled', message, tone: 'destructive' })
      }
    }
  }
  const handleOpenScanner = (evt) => {
    setSelectedEvent(evt || events[0])
    setIsScannerOpen(true)
  }

  const handleOpenCertificates = (evt = null) => {
    setSearchParams(evt?.id
      ? { tab: 'certificates', eventId: String(evt.id) }
      : { tab: 'certificates' })
  }

  const navigateToEvents = () => {
    setManageEventsViewMode('list')
    setSelectedEventDetail(null)
    setSearchParams({ tab: 'events' })
  }

  const navigateToAttendance = () => {
    const selectedEventId = searchParams.get('eventId') || activeEvt?.id
    if (selectedEventId) setActiveAttendanceEvtId(String(selectedEventId))
    setSearchParams({ tab: 'attendance' })
  }

  const navigateToCertificates = () => {
    const selectedEventId = searchParams.get('eventId')
    const event = (selectedEventId && events.find((item) => String(item.id) === String(selectedEventId))) || activeEvt
    handleOpenCertificates(event)
  }

  // Signature Vault state & Handler
  const [vaultSignatures, setVaultSignatures] = useState(SignatureVault.getSignatures())

  const handleDetailSigUpload = (sigKey, file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUri = e.target.result
      const updatedVault = SignatureVault.saveSignatures({ [sigKey]: dataUri })
      setVaultSignatures(updatedVault)
      if (selectedEventDetail) {
        setSelectedEventDetail({
          ...selectedEventDetail,
          [sigKey]: dataUri
        })
      }
    }
    reader.readAsDataURL(file)
  }

  // Copy Officer Scanner link
  const handleCopyOfficerLink = () => {
    const link = `${window.location.origin}/scanner/${activeAttendanceEvtId}`
    navigator.clipboard.writeText(link)
    setShowCopiedToast(true)
    setTimeout(() => setShowCopiedToast(false), 3000)
  }


  const eventCheckInBounds = (() => {
    const toDateTimeLocal = (dateTime) => {
      const match = String(dateTime ?? '').trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/)
      return match ? `${match[1]}T${match[2]}` : ''
    }

    return {
      start: toDateTimeLocal(activeEvt?.start_time) || (activeEvt?.startDate && activeEvt?.startTime ? `${activeEvt.startDate}T${activeEvt.startTime}` : ''),
      end: toDateTimeLocal(activeEvt?.end_time) || (activeEvt?.endDate && activeEvt?.endTime ? `${activeEvt.endDate}T${activeEvt.endTime}` : '')
    }
  })()

  // Canonical Session Handlers (R4 Step 2C-A)
  const handleOpenCreateSessionModal = () => {
    setSessionFormError(null)
    setSessionFormData({
      session_name: '',
      session_type: 'general',
      check_in_start: eventCheckInBounds.start,
      check_in_end: eventCheckInBounds.end
    })
    setIsCreateSessionModalOpen(true)
  }

  const handleCreateSessionSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setSessionFormError(null)

    if (!sessionFormData.session_name.trim()) {
      setSessionFormError('Session name is required.')
      return
    }

    if (!sessionFormData.check_in_start || !sessionFormData.check_in_end) {
      setSessionFormError('This event needs a valid start and end schedule before configuring check-in.')
      return
    }

    const startTs = new Date(sessionFormData.check_in_start).getTime()
    const endTs = new Date(sessionFormData.check_in_end).getTime()

    if (isNaN(startTs) || isNaN(endTs) || endTs <= startTs) {
      setSessionFormError('Check-in end time must be later than start time.')
      return
    }

    if (!eventCheckInBounds.start || !eventCheckInBounds.end
      || sessionFormData.check_in_start < eventCheckInBounds.start
      || sessionFormData.check_in_end > eventCheckInBounds.end) {
      setSessionFormError('Check-in must start and end within the event schedule.')
      return
    }

    setSessionFormSubmitting(true)
    try {
      const created = await createAttendanceSession(activeAttendanceEvtId, {
        session_name: sessionFormData.session_name.trim(),
        session_type: sessionFormData.session_type,
        check_in_start: sessionFormData.check_in_start.replace('T', ' ') + (sessionFormData.check_in_start.length === 16 ? ':00' : ''),
        check_in_end: sessionFormData.check_in_end.replace('T', ' ') + (sessionFormData.check_in_end.length === 16 ? ':00' : '')
      })
      setIsCreateSessionModalOpen(false)
      if (created?.id) {
        setSelectedSessionId(created.id)
        selectAttendanceSession(created.id).catch(() => {})
      }
    } catch (err) {
      setSessionFormError(err?.response?.data?.error?.message || err?.message || 'Failed to create attendance session.')
    } finally {
      setSessionFormSubmitting(false)
    }
  }

  const handleOpenSession = async (sessionId) => {
    setAttendanceActionError(null)
    setAttendanceActionLoading(true)
    try {
      await openAttendanceSession(sessionId, activeAttendanceEvtId)
    } catch (err) {
      setAttendanceActionError(err?.response?.data?.error?.message || err?.message || 'Failed to open attendance session.')
    } finally {
      setAttendanceActionLoading(false)
    }
  }

  const handleCloseSession = async (sessionId) => {
    setAttendanceActionError(null)
    setAttendanceActionLoading(true)
    try {
      await closeAttendanceSession(sessionId, activeAttendanceEvtId)
      setConfirmModalAction(null)
    } catch (err) {
      setAttendanceActionError(err?.response?.data?.error?.message || err?.message || 'Failed to close attendance session.')
    } finally {
      setAttendanceActionLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return
    }
    const headers = ['Student ID', 'Full Name', 'Email / Designation', 'Verification Method', 'Checked In At', 'Verified By']
    const rows = attendanceRecords.map(r => [
      `"${r.institutional_id || r.student_id || ''}"`,
      `"${r.full_name || ''}"`,
      `"${r.email || r.designation_title || ''}"`,
      `"${r.verification_method || ''}"`,
      `"${r.checked_in_at || ''}"`,
      `"${r.scanned_by_name || 'Server Authorized'}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Attendance_${activeEvt?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Session'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderBannerGraphic = (bannerType) => {
    switch (bannerType) {
      case 'laptop':
        return <span className="text-4xl sm:text-5xl filter drop-shadow-md">💻</span>
      case 'target':
        return <span className="text-4xl sm:text-5xl filter drop-shadow-md">🎯</span>
      case 'soccer':
        return <span className="text-4xl sm:text-5xl filter drop-shadow-md">⚽</span>
      case 'sprout':
        return <span className="text-4xl sm:text-5xl filter drop-shadow-md">🌱</span>
      default:
        return <span className="text-4xl sm:text-5xl filter drop-shadow-md">💻</span>
    }
  }

  // Counts for the event lifecycle filters. “All” includes every stored status.
  const allEventsCount = events.length
  const upcomingCount = events.filter(e => e.status === 'Upcoming').length
  const ongoingCount = events.filter(e => e.status === 'Ongoing').length
  const completedCount = events.filter(e => e.status === 'Completed').length
  const cancelledCount = events.filter(e => e.status === 'Cancelled').length
  const hasEventCriteria = Boolean(eventsSearchTerm.trim()) || eventsFilter !== 'All'
  const clearEventCriteria = () => {
    setEventsSearchTerm('')
    setEventsFilter('All')
  }

  // Filtered Events List for Manage Events Workspace
  const filteredEventsList = events.filter(evt => {
    if (eventsFilter === 'Upcoming' && evt.status !== 'Upcoming') return false
    if (eventsFilter === 'Ongoing' && evt.status !== 'Ongoing') return false
    if (eventsFilter === 'Completed' && evt.status !== 'Completed') return false
    if (eventsFilter === 'Cancelled' && evt.status !== 'Cancelled') return false
    if (eventsSearchTerm.trim()) {
      const query = eventsSearchTerm.trim().toLowerCase()
      const matchTitle = String(evt.title || '').toLowerCase().includes(query)
      const matchVenue = String(evt.venue || '').toLowerCase().includes(query)
      const matchCategory = String(evt.category || '').toLowerCase().includes(query)
      return matchTitle || matchVenue || matchCategory
    }

    return true
  })

  return (
    <div data-org-moderator-surface className="space-y-8 font-sans relative">

      {['events', 'attendance', 'certificates'].includes(activeTab) && (
        <nav aria-label="Events module navigation" className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Event features">
            <button
              type="button"
              onClick={navigateToEvents}
              aria-current={activeTab === 'events' ? 'page' : undefined}
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 ${activeTab === 'events' ? 'bg-[#176B43] text-white shadow-sm' : 'text-emerald-950 hover:bg-emerald-50 hover:text-emerald-900'}`}
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
              Events
            </button>
            <button
              type="button"
              onClick={navigateToAttendance}
              aria-current={activeTab === 'attendance' ? 'page' : undefined}
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 ${activeTab === 'attendance' ? 'bg-[#176B43] text-white shadow-sm' : 'text-emerald-950 hover:bg-emerald-50 hover:text-emerald-900'}`}
            >
              <QrCode className="h-4 w-4" aria-hidden="true" />
              Attendance
            </button>
            <button
              type="button"
              onClick={navigateToCertificates}
              aria-current={activeTab === 'certificates' ? 'page' : undefined}
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 ${activeTab === 'certificates' ? 'bg-[#176B43] text-white shadow-sm' : 'text-emerald-950 hover:bg-emerald-50 hover:text-emerald-900'}`}
            >
              <Award className="h-4 w-4" aria-hidden="true" />
              Certificates
            </button>
          </div>
          {(activeTab === 'attendance' || activeTab === 'certificates') && (activeEvt || searchParams.get('eventId')) && (
            <p className="px-1 text-xs font-semibold text-slate-500 sm:text-right">
              Current event: <span className="text-slate-800">{activeTab === 'certificates' && searchParams.get('eventId') ? (events.find((item) => String(item.id) === String(searchParams.get('eventId')))?.title || activeEvt?.title || 'Selected event') : (activeEvt?.title || 'Selected event')}</span>
            </p>
          )}
        </nav>
      )}

      {/* Copied Toast Notification */}
      {showCopiedToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#176B43] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-400/30 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-xs font-extrabold">Officer Scanner Link Copied!</p>
            <p className="text-[10px] text-[#245F42]">Forward link to Student Officers to scan student barcodes.</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MANAGE EVENTS WORKSPACE VIEW (activeTab === 'events')                  */}
      {/* ========================================================================= */}
      {activeTab === 'events' && (
        manageEventsViewMode === 'details' && selectedEventDetail ? (
          /* ========================================================================= */
          /* EVENT FULL DETAILS VIEW WORKFLOW (Phase 4.9.4)                            */
          /* ========================================================================= */
          <div className="space-y-6 animate-in fade-in duration-200">

            {/* Top Navigation & Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                onClick={handleBackToManageEvents}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs transition flex items-center gap-2 self-start cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
                <span>← Back to Manage Events</span>
              </button>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <button
                  onClick={() => handleGoToAttendanceSession(selectedEventDetail.id)}
                  className="px-3.5 py-2 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-white" />
                  <span>Go to Attendance Session</span>
                </button>

                <button
                  onClick={() => handleOpenEditModal(selectedEventDetail)}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 hover:text-[#16834a] border border-slate-200 text-[#17452f] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Event</span>
                </button>

                <button
                  onClick={() => handleGoToAttendanceSession(selectedEventDetail.id)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View Attendance</span>
                </button>

                <button
                  onClick={() => handleOpenCertificates(selectedEventDetail)}
                  className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                >
                  <span>View Certificates</span>
                </button>

                <button
                  onClick={() => {
                    handleCancelEvent(selectedEventDetail.id)
                    handleBackToManageEvents()
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Cancel Event</span>
                </button>
              </div>
            </div>

            {/* Header Title & Status Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs">
                    {renderBannerGraphic(selectedEventDetail.banner_type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-0.5 rounded-full text-[11px] font-bold shadow-xs ${selectedEventDetail.status === 'Ongoing'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : selectedEventDetail.status === 'Completed'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : selectedEventDetail.status === 'Cancelled'
                            ? 'bg-slate-200 text-slate-600 border border-slate-300'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                        {selectedEventDetail.status}
                      </span>
                      <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                        <Flag className="w-3 h-3 text-emerald-600" />
                        {selectedEventDetail.category}
                      </span>
                    </div>

                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {selectedEventDetail.title}
                    </h1>
                  </div>
                </div>
              </div>

              {/* Section A: Event Metadata & Description */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Metadata Column */}
                <div className="space-y-3 md:col-span-1 border-r-0 md:border-r border-slate-100 md:pr-6">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Schedule & Venue Details</h3>

                  <div className="space-y-2.5 text-xs font-medium text-slate-700">
                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <Calendar className="w-4 h-4 text-[#16834a] shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Date</p>
                        <p className="font-extrabold text-slate-900">{selectedEventDetail.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <Clock className="w-4 h-4 text-[#16834a] shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Time Schedule</p>
                        <p className="font-extrabold text-slate-900">{selectedEventDetail.time}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <MapPin className="w-4 h-4 text-[#16834a] shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Venue Location</p>
                        <p className="font-extrabold text-slate-900">{selectedEventDetail.venue}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description & Target Audience Column */}
                <div className="space-y-4 md:col-span-2">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Event Description</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {selectedEventDetail.description || 'Join us for an engaging session designed to foster institutional excellence, technology integration, and student leadership development.'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <div className="flex items-center gap-2 text-xs">
                      <Building2 className="w-4 h-4 text-[#16834a] shrink-0" />
                      <div>
                        <span className="font-bold text-slate-500">Target Audience: </span>
                        <span className="font-extrabold text-slate-900">{selectedEventDetail.target_audience || 'All NDMU Students & Faculty'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/scanner/${selectedEventDetail.id}`
                        navigator.clipboard.writeText(link)
                        setShowCopiedToast(true)
                        setTimeout(() => setShowCopiedToast(false), 3000)
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Officer Scanner Link</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Section B: Attendance Statistics & Live Monitoring Summary */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-4.5 h-4.5 text-[#16834a]" />
                  Attendance Statistics & Live Session Status
                </h3>

                <button
                  onClick={() => handleGoToAttendanceSession(selectedEventDetail.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
                >
                  <QrCode className="w-3.5 h-3.5 text-white" />
                  <span>Manage Attendance Session</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Verified Attendees</p>
                  <p className="text-xl font-extrabold text-[#16834a] mt-1">
                    {selectedEventDetail.participants_count} Checked-In
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">
                    Unique students in canonical attendance sessions
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Attendance Monitoring</p>
                  <button
                    onClick={() => handleGoToAttendanceSession(selectedEventDetail.id)}
                    className="text-xs font-extrabold text-[#16834a] hover:underline flex items-center gap-1 mt-1 text-left"
                  >
                    <span>Manage Live Sessions & Records →</span>
                  </button>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">
                    View canonical check-ins
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Officer Duty Link</p>
                  <a
                    href={`/scanner/${selectedEventDetail.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono font-bold text-[#16834a] hover:underline flex items-center gap-1 mt-1 truncate"
                  >
                    <span>/scanner/{selectedEventDetail.id}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              </div>
            </div>

            {/* Section C: Organization-issued event certificate setup */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="w-4.5 h-4.5 text-[#16834a]" />
                  Organization Certificate Setup
                </h3>
                <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 self-start sm:self-auto">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Auto-Dispatched to Participant Portfolios Upon Event End
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Details Info */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Issuing organization</p>
                    <p className="text-xs font-extrabold text-slate-900">{profileData.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium">Verified attendees receive this organization-issued Certificate of Participation after the event closes.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Organization signatories</p>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Signatory 1 Upload Row */}
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                        <p className="font-extrabold text-slate-800 flex items-center gap-1.5 truncate">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#16834a] shrink-0" />
                          <span className="truncate">{cleanOrganizationSignatoryName(selectedEventDetail.certificate_configuration?.signatory_1 || selectedEventDetail.signatory_1) || 'Organization moderator'}</span>
                        </p>
                        <label className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#16834a] border border-emerald-200 text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shrink-0">
                          <Upload className="w-3 h-3" />
                          <span>Upload PNG</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleDetailSigUpload('signatory_1_img', e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Signatory 2 Upload Row */}
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                        <p className="font-extrabold text-slate-800 flex items-center gap-1.5 truncate">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate">{cleanOrganizationSignatoryName(selectedEventDetail.certificate_configuration?.signatory_2 || selectedEventDetail.signatory_2) || 'Authorized signatory'}</span>
                        </p>
                        <label className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shrink-0">
                          <Upload className="w-3 h-3" />
                          <span>Upload PNG</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleDetailSigUpload('signatory_2_img', e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>


                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-700 font-medium space-y-1">
                    <span className="font-extrabold text-emerald-900 block flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Attendance Certificates Are Automatic
                    </span>
                    <p className="text-[11px] text-slate-600">
                      When an attendance session closes, every verified attendee automatically receives the certificate issued by this organization.
                    </p>
                  </div>
                </div>

                {/* Right Column: High Fidelity Certificate Preview */}
                <div className="lg:col-span-7">
                  <div className="p-6 bg-amber-50/30 text-center space-y-4 relative overflow-hidden border-4 border-double border-amber-800/30 rounded-2xl shadow-xs">

                    {/* Watermark Seal */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                      <div className="w-60 h-60 rounded-full border-8 border-slate-900 flex items-center justify-center">
                        <span className="text-3xl font-extrabold font-serif">NDMU</span>
                      </div>
                    </div>

                    {/* Certificate Header */}
                    <div className="space-y-1 relative z-10">
                      <p className="text-[10px] font-extrabold tracking-widest uppercase text-amber-900">{profileData.name}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Notre Dame of Marbel University</p>
                      <h2 className="text-lg font-serif font-extrabold text-slate-900 pt-1 tracking-wide">CERTIFICATE OF PARTICIPATION</h2>
                    </div>

                    <div className="space-y-1 relative z-10">
                      <p className="text-[10px] text-slate-500 italic">This official digital certificate is proudly presented to</p>
                      <h3 className="text-base font-extrabold text-[#16834a] underline decoration-amber-500 decoration-2 underline-offset-4">
                        [STUDENT PARTICIPANT FULL NAME]
                      </h3>
                    </div>

                    <div className="max-w-xs mx-auto space-y-1 relative z-10 text-[11px] text-slate-700 leading-snug">
                      <p>
                        For active attendance and successful completion of:
                      </p>
                      <p className="font-extrabold text-slate-900 text-xs">{selectedEventDetail.title}</p>
                      <p className="text-slate-500 text-[10px]">
                        Held on <span className="font-bold text-slate-800">{selectedEventDetail.date}</span> at <span className="font-bold text-slate-800">{selectedEventDetail.venue}</span>.
                      </p>
                    </div>

                    {/* Rendered Digital Signatures (Signature Over Printed Name Format) */}
                    <div className="pt-4 grid grid-cols-2 gap-6 border-t border-amber-900/20 max-w-md mx-auto relative z-10 text-[10px]">
                      {(() => {
                        const sig1 = parseSignatoryInfo(cleanOrganizationSignatoryName(selectedEventDetail.certificate_configuration?.signatory_1 || selectedEventDetail.signatory_1), '', 'Organization Moderator')
                        const sig2 = parseSignatoryInfo(cleanOrganizationSignatoryName(selectedEventDetail.certificate_configuration?.signatory_2 || selectedEventDetail.signatory_2), '', 'Authorized Signatory')
                        const sig1Image = cleanOrganizationSignatoryImage(selectedEventDetail.certificate_configuration?.signatory_1_img || selectedEventDetail.signatory_1_img) || SignatureVault.getSignatures().signatory_1_img
                        const sig2Image = cleanOrganizationSignatoryImage(selectedEventDetail.certificate_configuration?.signatory_2_img || selectedEventDetail.signatory_2_img) || SignatureVault.getSignatures().signatory_2_img

                        return (
                          <>
                            {/* Signatory 1 */}
                            <div className="flex flex-col items-center justify-end text-center relative">
                              {/* Floating Signature Graphic */}
                              <div className="h-9 flex items-end justify-center -mb-2 z-10 pointer-events-none">
                                {sig1Image && <img
                                  src={sig1Image}
                                  alt="Primary Signatory Signature"
                                  className="h-9 max-w-[130px] object-contain"
                                />}
                              </div>
                              {/* Printed Name */}
                              <p className="font-extrabold text-slate-900 text-[11px] tracking-wide uppercase z-0 truncate max-w-full">
                                {sig1.name}
                              </p>
                              {/* Signature Line */}
                              <div className="w-full border-t border-slate-700 my-0.5"></div>
                              {/* Official Position / Title */}
                              <p className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wider truncate max-w-full">
                                {sig1.title}
                              </p>
                            </div>

                            {/* Signatory 2 */}
                            <div className="flex flex-col items-center justify-end text-center relative">
                              {/* Floating Signature Graphic */}
                              <div className="h-9 flex items-end justify-center -mb-2 z-10 pointer-events-none">
                                {sig2Image && <img
                                  src={sig2Image}
                                  alt="Secondary Signatory Signature"
                                  className="h-9 max-w-[130px] object-contain"
                                />}
                              </div>
                              {/* Printed Name */}
                              <p className="font-extrabold text-slate-900 text-[11px] tracking-wide uppercase z-0 truncate max-w-full">
                                {sig2.name}
                              </p>
                              {/* Signature Line */}
                              <div className="w-full border-t border-slate-700 my-0.5"></div>
                              {/* Official Position / Title */}
                              <p className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wider truncate max-w-full">
                                {sig2.title}
                              </p>
                            </div>
                          </>
                        )
                      })()}
                    </div>



                    <div className="text-[9px] font-mono text-slate-400 pt-1">
                      Organization-issued attendance certificate
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Section C: Scanned Participant Roster & Audit Log Table */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-[#16834a]" />
                  Scanned Participant Roster & Verified Officer Logs
                </h3>

                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search roster..."
                    value={rosterSearchTerm}
                    onChange={(e) => setRosterSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#16834a]"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                    <tr>
                      <th className="p-3.5">Student Name</th>
                      <th className="p-3.5">Student ID</th>
                      <th className="p-3.5">Program & Course</th>
                      <th className="p-3.5">Scanned Timestamp</th>
                      <th className="p-3.5">Verified Student Officer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                        <div className="space-y-3 max-w-sm mx-auto">
                          <p className="text-xs">Attendance sessions and verified student records are managed in the Attendance Monitoring Hub.</p>
                          <button
                            onClick={() => handleGoToAttendanceSession(selectedEventDetail.id)}
                            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#16834a] border border-emerald-200 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Go to Attendance Monitoring</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">

            {/* Combined organization overview and event workspace */}
            <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-[#EFF7F0] p-5 text-[#17663B] shadow-sm sm:p-6">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{orgInfo?.name || (organizationLoading ? 'Loading organization…' : 'Organization unavailable')}</h1>
                    <p className="mt-1 text-sm font-medium text-[#356148]">{orgInfo?.college || (organizationLoading ? 'Loading assigned organization details…' : 'Organization assignment could not be loaded.')}{orgInfo?.academic_year ? ` · ${orgInfo.academic_year}` : ''}</p>
                    <p className="mt-2 text-xs text-[#356148]">Events, attendance, and certificates for your organization.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    disabled={!orgInfo || organizationLoading}
                    className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg bg-[#16834a] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#126b3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>Create Event</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-emerald-200 pt-4 md:grid-cols-4">
                  <div className="rounded-xl bg-white/90 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Events this academic year</p>
                    <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">{metrics.events_this_year}</p>
                  </div>
                  <button type="button" onClick={() => setSearchParams({ tab: 'attendance' })} className="rounded-xl bg-white/90 px-4 py-3 text-left transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Total attendees</p>
                    <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">{metrics.total_participants}</p>
                  </button>
                  <button type="button" onClick={handleOpenCertificates} className="rounded-xl bg-white/90 px-4 py-3 text-left transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Attendance certificates</p>
                    <p className="mt-1 text-sm font-extrabold text-emerald-800">View records</p>
                  </button>
                  <button type="button" onClick={() => setSearchParams({ tab: 'profile' })} className="rounded-xl bg-white/90 px-4 py-3 text-left transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Registered members</p>
                    <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">{metrics.active_members}</p>
                  </button>
                </div>
              </div>
            </section>
            {organizationError && (
              <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                {organizationError}
              </p>
            )}

            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Events &amp; Activities</h2>
                <p className="mt-1 text-sm text-slate-600">Search and manage upcoming and past events.</p>
              </div>
              <p className="text-xs font-semibold text-slate-500">{events.length} total events</p>
            </div>

            {/* Search Toolbar & Status Filter Pills */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">

              {/* Search Bar Input */}
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  aria-label="Search by event name, venue, or category"
                  placeholder="Search by event name, venue, or category"
                  value={eventsSearchTerm}
                  onChange={(e) => setEventsSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-11 text-sm text-slate-800 placeholder:text-slate-500 focus:border-[#16834a] focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
                {eventsSearchTerm && (
                  <button type="button" onClick={() => setEventsSearchTerm('')} aria-label="Clear event search" className="absolute inset-y-0 right-2 my-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-700">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div role="group" aria-label="Filter events by status" className="flex flex-wrap gap-2">
                  {[
                    ['All', allEventsCount],
                    ['Upcoming', upcomingCount],
                    ['Ongoing', ongoingCount],
                    ['Completed', completedCount],
                    ['Cancelled', cancelledCount],
                  ].map(([status, count]) => {
                    const selected = eventsFilter === status
                    return (
                      <button
                        key={status}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setEventsFilter(status)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${selected
                          ? 'border-[#176B43] bg-[#176B43] text-white'
                          : count === 0
                            ? 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                            : 'border-emerald-100 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                          }`}
                      >
                        {status} ({count})
                      </button>
                    )
                  })}
                </div>
                {hasEventCriteria && (
                  <button type="button" onClick={clearEventCriteria} className="self-start text-xs font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:self-auto">
                    Clear filters
                  </button>
                )}
              </div>

            </div>

            {/* Formatted Event List Items Container */}
            <div className="space-y-3">
              {eventsLoading ? (
                <div role="status" className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-600">Loading events…</div>
              ) : eventsError ? (
                <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-center">
                  <p className="text-sm font-semibold text-rose-900">Events couldn’t be loaded.</p>
                  <p className="mt-1 text-sm text-rose-800">Check your connection and try again.</p>
                  <button type="button" onClick={() => refreshData().catch(() => {})} className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700">Retry</button>
                </div>
              ) : events.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-emerald-300 bg-white px-5 py-8 text-center">
                  <Calendar className="mx-auto h-8 w-8 text-emerald-700" aria-hidden="true" />
                  <h3 className="mt-3 text-base font-bold text-slate-900">No events yet</h3>
                  <p className="mt-1 text-sm text-slate-600">Create your organization’s first event to get started.</p>
                  <button type="button" onClick={() => handleOpenCreateModal()} disabled={organizationLoading || !orgInfo} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#176B43] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#125735] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"><Plus className="h-4 w-4" />Create event</button>
                </div>
              ) : filteredEventsList.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-7 text-center">
                  <h3 className="text-sm font-bold text-slate-900">No events match these filters</h3>
                  <p className="mt-1 text-sm text-slate-600">Try another status or search by event name, venue, or category.</p>
                  <button type="button" onClick={clearEventCriteria} className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Clear search and filters</button>
                </div>
              ) : (
                filteredEventsList.map((evt) => (
                  <div key={evt.id} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm focus-within:ring-2 focus-within:ring-emerald-700/30">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    {/* Left Column: 3D Icon + Title + Metadata */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs">
                        {renderBannerGraphic(evt.banner_type)}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <button type="button" title={evt.title} onClick={() => handleViewEventDetails(evt)} className="block max-w-full truncate text-left text-sm font-extrabold text-slate-900 hover:text-[#16834a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:max-w-2xl">{evt.title}</button>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {evt.date} • {evt.time}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {evt.venue}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {evt.participants_count} participants
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 text-emerald-700 font-bold">
                            <Flag className="w-3.5 h-3.5 text-emerald-600" />
                            {evt.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Status Pill + Actions (Preview / Attendance / Options) */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-3 md:justify-end md:border-t-0 md:pt-0">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-xs ${evt.status === 'Ongoing'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : evt.status === 'Completed'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : evt.status === 'Cancelled'
                            ? 'bg-slate-200 text-slate-600 border border-slate-300'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                        {evt.status}
                      </span>

                      <button
                        onClick={() => handleViewEventDetails(evt)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#16834a] border border-emerald-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#16834a]" />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => handleGoToAttendanceSession(evt.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                      >
                        <QrCode className="w-3.5 h-3.5 text-white" />
                        <span>Attendance</span>
                      </button>

                      <EventCardOptionsMenu
                        event={evt}
                        onViewDetails={(e) => handleViewEventDetails(e)}
                        onMonitorAttendance={(id) => handleGoToAttendanceSession(id)}
                        onLaunchScanner={(e) => handleOpenScanner(e)}
                        onEditEvent={(e) => handleOpenEditModal(e)}
                        onViewCertificates={handleOpenCertificates}
                        onExportCSV={(e) => handleGoToAttendanceSession(e.id)}
                        onCancelEvent={(id) => handleCancelEvent(id)}
                      />
                    </div>

                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* 2. CANONICAL ATTENDANCE MONITORING & SESSION MANAGEMENT (R4 Step 2C-A)    */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Top Header Card with Clean Event Selector & Create Session Action */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#16834a] border border-emerald-100 flex items-center justify-center shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Attendance Monitoring Hub
                  </h1>
                  {activeEvt && (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      activeEvt.status === 'Ongoing'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : activeEvt.status === 'Completed'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : activeEvt.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : activeEvt.status === 'Draft'
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      Event: {activeEvt.status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Manage Attendance Sessions & View Canonical Student Check-ins
                </p>
              </div>
            </div>

            {/* Event Selector & New Session Button */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={navigateToEvents}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-emerald-950 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to organization events
              </button>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:block">EVENT:</label>
                <select
                  value={activeAttendanceEvtId}
                  onChange={(e) => setActiveAttendanceEvtId(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-extrabold text-slate-800 focus:outline-none focus:border-[#16834a] cursor-pointer shadow-xs"
                >
                  {events.map(evt => (
                    <option key={evt.id} value={evt.id}>{evt.title}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleOpenCreateSessionModal}
                disabled={activeEvt?.status === 'Completed' || activeEvt?.status === 'Cancelled'}
                title={activeEvt?.status === 'Completed' || activeEvt?.status === 'Cancelled' ? 'Cannot create sessions for completed or cancelled events.' : 'Create a new attendance session for this event'}
                className="px-4 py-2.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Session</span>
              </button>
            </div>
          </div>

          {/* Session Selector / List View */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#16834a]" />
                Attendance Sessions for {activeEvt?.title || 'Selected Event'} ({attendanceSessions.length})
              </h2>
              {attendanceSessionsLoading && (
                <span className="text-xs text-slate-400 font-medium">Loading sessions...</span>
              )}
            </div>

            {attendanceSessionsError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{attendanceSessionsError}</span>
                </div>
                <button
                  onClick={() => loadAttendanceSessions(activeAttendanceEvtId)}
                  className="px-3 py-1 bg-rose-100 hover:bg-rose-200 rounded-lg text-rose-900 font-bold text-xs transition cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {!attendanceSessionsLoading && attendanceSessions.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#16834a] border border-emerald-100 flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-sm font-extrabold text-slate-800">
                    No attendance sessions have been configured for this event yet.
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure an attendance session to specify check-in time windows and track verified student attendance.
                  </p>
                </div>
                {activeEvt?.status !== 'Completed' && activeEvt?.status !== 'Cancelled' && (
                  <button
                    onClick={handleOpenCreateSessionModal}
                    className="px-4 py-2 bg-[#16834a] hover:bg-[#236e3e] text-white rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Session</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {attendanceSessions.map((sess) => {
                  const isSelected = sess.id === (activeAttendanceSession?.id || selectedSessionId)
                  return (
                    <div
                      key={sess.id}
                      onClick={() => {
                        setSelectedSessionId(sess.id)
                        selectAttendanceSession(sess.id)
                      }}
                      className={`p-4 rounded-2xl border transition text-left cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'border-[#16834a] bg-emerald-50/40 shadow-sm ring-1 ring-[#16834a]/30'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-900 truncate">
                            {sess.session_name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                            {sess.session_type}
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          sess.status === 'open'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse'
                            : sess.status === 'closed'
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {sess.status === 'open' ? '● Open' : sess.status === 'closed' ? 'Closed' : 'Scheduled'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 pt-1 border-t border-slate-100">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{sess.check_in_start} - {sess.check_in_end}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Active Session Details & Controls (if a session is selected) */}
          {activeAttendanceSession && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-6">

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">

                {/* Current Session Status Indicator */}
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${
                    activeAttendanceSession.status === 'open'
                      ? 'bg-emerald-500 animate-ping'
                      : activeAttendanceSession.status === 'closed'
                        ? 'bg-slate-400'
                        : 'bg-amber-500'
                  }`}></div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Selected Session: {activeAttendanceSession.session_name}</p>
                    <p className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      {activeAttendanceSession.status === 'open'
                        ? '● LIVE SCANNING OPEN'
                        : activeAttendanceSession.status === 'closed'
                          ? 'CLOSED'
                          : '🔒 SCHEDULED (NOT STARTED)'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Window: {activeAttendanceSession.check_in_start} - {activeAttendanceSession.check_in_end}
                    </p>
                  </div>
                </div>

                {/* Session Lifecycle Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {activeAttendanceSession.status === 'scheduled' && (
                    <button
                      onClick={() => handleOpenSession(activeAttendanceSession.id)}
                      disabled={attendanceActionLoading || activeEvt?.status === 'Draft' || activeEvt?.status === 'Completed' || activeEvt?.status === 'Cancelled'}
                      title={
                        activeEvt?.status === 'Draft'
                          ? 'Draft events cannot open attendance sessions. Publish event first.'
                          : activeEvt?.status === 'Completed' || activeEvt?.status === 'Cancelled'
                            ? 'Cannot open sessions for completed or cancelled events.'
                            : 'Open this session for attendee check-ins'
                      }
                      className="px-4 py-2 rounded-xl bg-emerald-50 text-[#16834a] hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Open Session</span>
                    </button>
                  )}

                  {activeAttendanceSession.status === 'open' && (
                    <button
                      onClick={() => setConfirmModalAction('Closed')}
                      disabled={attendanceActionLoading}
                      className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Close Session</span>
                    </button>
                  )}

                  {activeAttendanceSession.status === 'closed' && (
                    <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Session Closed</span>
                    </span>
                  )}

                  <button
                    onClick={handleExportCSV}
                    disabled={attendanceRecords.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export CSV</span>
                  </button>
                </div>

              </div>

              {/* Action Error Banner */}
              {attendanceActionError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{attendanceActionError}</span>
                  </div>
                  <button
                    onClick={() => setAttendanceActionError(null)}
                    className="text-xs font-bold text-rose-700 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Share Officer Scanner Access Link Box (Integration boundary for Step 2C-B) */}
              <div className="bg-[#EFF7F0] text-[#17663B] p-5 rounded-2xl shadow-sm border border-[#69A97C] space-y-3 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                  <div className="space-y-0.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#245F42] border border-emerald-400/30 text-[10px] font-extrabold uppercase tracking-wider">
                      OFFICER ACCESS LINK
                    </span>
                    <h3 className="text-sm font-extrabold text-[#17663B]">Student Officer Scanner Gateway</h3>
                    <p className="text-[11px] text-[#245F42]/80">
                      Forward link to assigned Student Officers standing at entrance gates to scan student barcodes.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleCopyOfficerLink}
                      className="px-3.5 py-2 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </button>

                    <a
                      href={`/scanner/${activeAttendanceEvtId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-white/70 hover:bg-white text-[#17663B] font-bold text-xs transition border border-[#69A97C] flex items-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#17663B]" />
                      <span>Open Scanner Tab</span>
                    </a>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/80 border border-[#69A97C]/50 font-mono text-xs text-[#245F42] flex items-center justify-between gap-2 overflow-x-auto relative z-10">
                  <span className="truncate">{window.location.origin}/scanner/{activeAttendanceEvtId}</span>
                  <span className="text-[10px] font-sans font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded shrink-0 border border-emerald-200">
                    Session: {activeAttendanceSession.session_name}
                  </span>
                </div>
              </div>

              {/* Canonical Verified Attendance Records Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Users className="w-4.5 h-4.5 text-[#16834a]" />
                    Verified Attendance Records ({attendanceRecords.length} Checked In)
                  </h3>
                  {attendanceRecordsLoading ? (
                    <span className="text-xs text-slate-400 font-medium">Loading records...</span>
                  ) : (
                    <button
                      onClick={() => loadAttendanceRecords(activeAttendanceSession.id)}
                      className="text-xs text-[#16834a] hover:underline font-bold"
                    >
                      Refresh
                    </button>
                  )}
                </div>

                {attendanceRecordsError && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{attendanceRecordsError}</span>
                    </div>
                    <button
                      onClick={() => loadAttendanceRecords(activeAttendanceSession.id)}
                      className="px-3 py-1 bg-rose-100 hover:bg-rose-200 rounded-lg text-rose-900 font-bold text-xs transition cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                )}

                <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                      <tr>
                        <th className="p-3.5">Student Name</th>
                        <th className="p-3.5">Student ID</th>
                        <th className="p-3.5">Email / Program</th>
                        <th className="p-3.5">Method</th>
                        <th className="p-3.5">Checked-in Timestamp</th>
                        <th className="p-3.5">Verified By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendanceRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                            No attendance records recorded for this session yet.
                          </td>
                        </tr>
                      ) : (
                        attendanceRecords.map((item) => (
                          <tr key={item.id} className="hover:bg-emerald-50/20 transition">
                            <td className="p-3.5 font-extrabold text-slate-900 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                                {item.full_name ? item.full_name[0] : 'S'}
                              </div>
                              <span>{item.full_name}</span>
                            </td>
                            <td className="p-3.5 font-mono font-bold text-emerald-700">{item.institutional_id || item.student_id}</td>
                            <td className="p-3.5 font-medium text-slate-600">{item.email || item.designation_title || 'Student'}</td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                                {item.verification_method}
                              </span>
                            </td>
                            <td className="p-3.5 font-bold text-slate-800">{item.checked_in_at}</td>
                            <td className="p-3.5 text-slate-600 font-medium">{item.scanned_by_name || 'Server Authorized'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Create Attendance Session Modal */}
          {isCreateSessionModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
                <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white">Create Attendance Session</h3>
                      <p className="text-xs text-slate-400">Configure check-in window for {activeEvt?.title}</p>
                      {(activeEvt?.date || activeEvt?.time) && (
                        <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                          Event Schedule: {activeEvt?.date} • {activeEvt?.time}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCreateSessionModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateSessionSubmit} className="p-6 space-y-4">
                  {sessionFormError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{sessionFormError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Session Name *</label>
                    <input
                      type="text"
                      value={sessionFormData.session_name}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, session_name: e.target.value })}
                      placeholder="e.g. Morning Plenary Session"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#16834a] focus:bg-white transition"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Session Type *</label>
                    <select
                      value={sessionFormData.session_type}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, session_type: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#16834a] focus:bg-white transition"
                    >
                      <option value="general">General</option>
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="breakout">Breakout</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Check-in Starts *</label>
                      <input
                        type="datetime-local"
                        value={sessionFormData.check_in_start}
                        onChange={(e) => setSessionFormData({ ...sessionFormData, check_in_start: e.target.value })}
                        min={eventCheckInBounds.start || undefined}
                        max={eventCheckInBounds.end || undefined}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#16834a] focus:bg-white transition"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Check-in Ends *</label>
                      <input
                        type="datetime-local"
                        value={sessionFormData.check_in_end}
                        onChange={(e) => setSessionFormData({ ...sessionFormData, check_in_end: e.target.value })}
                        min={sessionFormData.check_in_start || eventCheckInBounds.start || undefined}
                        max={eventCheckInBounds.end || undefined}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#16834a] focus:bg-white transition"
                        required
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 -mt-1">
                    Check-in must remain within the event schedule shown above.
                  </p>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsCreateSessionModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sessionFormSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] disabled:opacity-50 text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      {sessionFormSubmitting ? (
                        <span>Creating...</span>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Create Session</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ORGANIZATION MODERATOR MANAGE PROFILE WORKSPACE VIEW                   */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Top Hero Organization Header Card */}
          <div className="bg-[#EFF7F0] text-[#17663B] p-6 sm:p-8 rounded-3xl shadow-xl border border-[#69A97C] relative overflow-hidden">

            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#16834a] border border-emerald-400/30 flex items-center justify-center text-white shadow-lg shrink-0">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-0.5">
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">
                    {profileData.name}
                  </h1>
                  <p className="text-xs font-bold text-[#245F42]/80 uppercase tracking-wider">
                    {profileData.code}
                  </p>
                  <p className="text-xs text-[#245F42] font-medium pt-0.5">
                    Adviser: {profileData.moderator_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Edit className="w-4 h-4 text-[#245F42]" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isProfileSaving}
                      className="px-4 py-2.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:cursor-wait disabled:opacity-60"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isProfileSaving ? 'Saving…' : 'Save Changes'}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (savedProfileData) setProfileData(savedProfileData)
                        setProfileSaveError('')
                        setIsEditingProfile(false)
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/20 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 1: Organization Information Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100/80 text-[#16834a] flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Organization Information
              </h3>
            </div>

            <div className="space-y-5">

              {profileSaveError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{profileSaveError}</p>}
              {profileSaveNotice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{profileSaveNotice}</p>}

              {/* Organization Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Organization Name
                </label>
                <div className="w-full px-4 py-3.5 rounded-2xl bg-[#eaf4ed] border border-[#d2e8d7] text-sm font-extrabold text-slate-800">{profileData.name}</div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                {isEditingProfile ? (
                  <textarea
                    rows={3}
                    value={profileData.description}
                    onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-[#eaf4ed] border border-[#c5e4cb] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#16834a] leading-relaxed"
                  />
                ) : (
                  <div className="w-full px-4 py-3.5 rounded-2xl bg-[#eaf4ed] border border-[#d2e8d7] text-xs font-medium text-slate-800 leading-relaxed">
                    {profileData.description}
                  </div>
                )}
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Email
                </label>
                {isEditingProfile ? (
                  <input
                    type="email"
                    value={profileData.contact_email}
                    onChange={(e) => setProfileData({ ...profileData, contact_email: e.target.value })}
                    className="w-full max-w-md px-4 py-3 rounded-2xl bg-[#eaf4ed] border border-[#c5e4cb] text-xs font-bold text-slate-800 focus:outline-none focus:border-[#16834a]"
                  />
                ) : (
                  <div className="w-full max-w-md px-4 py-3 rounded-2xl bg-[#eaf4ed] border border-[#d2e8d7] text-xs font-bold text-slate-800">
                    {profileData.contact_email}
                  </div>
                )}
              </div>

              {/* College */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  College
                </label>
                <div className="w-full px-4 py-3.5 rounded-2xl bg-[#eaf4ed] border border-[#d2e8d7] text-xs font-bold text-slate-800">{profileData.college_dept}</div>
              </div>

              {/* Facebook Page & Faculty Adviser Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Facebook Page / Social Media
                  </label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={profileData.facebook_url}
                      onChange={(e) => setProfileData({ ...profileData, facebook_url: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-[#eaf4ed] border border-[#c5e4cb] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#16834a]"
                    />
                  ) : (
                    <div className="w-full px-4 py-3 rounded-2xl bg-[#eaf4ed] border border-[#d2e8d7] text-xs font-medium text-slate-800 truncate">
                      {profileData.facebook_url}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Faculty Adviser
                  </label>
                  <div className="w-full px-4 py-3 rounded-2xl bg-[#eaf4ed] border border-[#d2e8d7] text-xs font-extrabold text-slate-800">{profileData.moderator_name}</div>
                </div>
              </div>

            </div>
          </div>

          {/* Persistent Digital Signature Vault Management Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#16834a] border border-emerald-100 flex items-center justify-center font-bold shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Digital Signature Vault & Institutional Signatories
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Upload official signatory signature PNGs once to auto pre-fill all event digital certificates.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold border border-emerald-200 self-start sm:self-auto">
                Vault Active & Synced
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Primary Signatory Vault Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Primary Signatory</span>
                  <p className="font-extrabold text-slate-900 text-sm">{vaultSignatures.signatory_1}</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="h-10 flex items-center justify-center flex-1">
                    {vaultSignatures.signatory_1_img && <img src={vaultSignatures.signatory_1_img} alt="Primary organization signatory signature" className="h-9 max-w-[140px] object-contain" />}
                  </div>
                  <label className="px-3 py-1.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload PNG</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleDetailSigUpload('signatory_1_img', e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Secondary Signatory Vault Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Secondary Signatory</span>
                  <p className="font-extrabold text-slate-900 text-sm">{vaultSignatures.signatory_2}</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="h-10 flex items-center justify-center flex-1">
                    {vaultSignatures.signatory_2_img && <img src={vaultSignatures.signatory_2_img} alt="Secondary organization signatory signature" className="h-9 max-w-[140px] object-contain" />}
                  </div>
                  <label className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload PNG</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleDetailSigUpload('signatory_2_img', e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

            </div>
          </div>


          {/* Section 2: Bottom Quick Info Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#16834a] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="truncate">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Email</p>
                <p className="text-xs font-extrabold text-slate-900 truncate mt-0.5">{profileData.contact_email}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#16834a] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Social Media</p>
                <p className="text-xs font-extrabold text-slate-900 mt-0.5">{profileData.social_status}</p>
              </div>
            </div>

        </div>
      </div>
  )}

      {/* ========================================================================= */}
      {/* 3.5. DIGITAL CERTIFICATES & SIGNATORY VAULT WORKSPACE VIEW               */}
      {/* ========================================================================= */}
      {activeTab === 'certificates' && (
        <DigitalCertificatesWorkspace
          events={events}
          eventId={searchParams.get('eventId')}
        />
      )}

          {/* ================= MODALS ================= */}
          <EventCreationModal
            isOpen={isCreateOpen}
            onClose={() => { setIsCreateOpen(false); setEditingEvent(null) }}
            onCreateEvent={createEvent}
            onUpdateEvent={updateEvent}
            editingEvent={editingEvent}
            organizationName={profileData.name}
            moderatorName={profileData.moderator_name}
          />

          <AttendanceScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            activeEvent={selectedEvent || activeEvt}
            activeSession={activeAttendanceSession}
            attendanceRecords={attendanceRecords}
            onCheckInSuccess={async () => {
              if (activeAttendanceSession?.id) {
                await loadAttendanceRecords(activeAttendanceSession.id)
              }
            }}
          />

          {/* The single terminal close confirmation for the active attendance session. */}
          {confirmModalAction === 'Closed' && activeAttendanceSession && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-rose-100 text-rose-600 border border-rose-200">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Confirm Session Closure
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Terminal Lifecycle Transition</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium leading-relaxed">
                  Are you sure you want to <strong>permanently close</strong> attendance session <strong>{activeAttendanceSession.session_name}</strong>? Closed sessions cannot be re-opened for new check-ins.
                </div>

                {attendanceActionError && (
                  <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
                    {attendanceActionError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setConfirmModalAction(null)}
                    disabled={attendanceActionLoading}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 font-bold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await handleCloseSession(activeAttendanceSession.id)
                    }}
                    disabled={attendanceActionLoading}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer text-white bg-rose-600 hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{attendanceActionLoading ? 'Closing…' : 'Confirm & Close'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )
      }
