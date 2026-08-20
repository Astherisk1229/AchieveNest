import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Users,
  Calendar,
  Award,
  TrendingUp,
  MapPin,
  Clock,
  Plus,
  QrCode,
  Download,
  Sparkles,
  CheckCircle2,
  Building2,
  Search,
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



import useOrganization from '../../../hooks/useOrganization'
import AttendanceController from '../../../controllers/AttendanceController'
import OrganizationController from '../../../controllers/OrganizationController'
import EventCreationModal from './EventCreationModal'
import AttendanceScannerModal from './AttendanceScannerModal'
import DigitalCertificateModal from './DigitalCertificateModal'
import EventCardOptionsMenu from './EventCardOptionsMenu'
import SignatureVault, { DEFAULT_SIG_1_IMG, DEFAULT_SIG_2_IMG, parseSignatoryInfo } from '../../../utils/signatureVault'
import DigitalCertificatesWorkspace from './certificates/DigitalCertificatesWorkspace'




export default function OrganizationModeratorDashboardPage({ _currentUser }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const _navigate = useNavigate()
  const rawTab = searchParams.get('tab')
  const activeTab = (!rawTab || rawTab === 'dashboard' || rawTab === 'overview') ? 'dashboard' : rawTab

  const { orgInfo, events, metrics, createEvent, updateEvent, archiveEvent } = useOrganization()

  // Selected Active Event for Attendance Monitoring
  const [activeAttendanceEvtId, setActiveAttendanceEvtId] = useState('evt-1')
  const activeEvt = (events && events.length > 0) ? (events.find(e => e.id === activeAttendanceEvtId) || events[0]) : { id: 'evt-1', title: 'Computer Society Tech Summit 2026', venue: 'NDMU Convention Center' }

  // Attendance Session state with safe fallback
  const [session, setSession] = useState(() => AttendanceController.getSession(activeAttendanceEvtId) || { session_status: 'Active', scanned_list: [] })
  const [showCopiedToast, setShowCopiedToast] = useState(false)

  // Real-time listener for attendance updates from Officer Scans
  useEffect(() => {
    const handleUpdate = () => {
      const updated = AttendanceController.getSession(activeAttendanceEvtId)
      if (updated) setSession({ ...updated })
    }
    handleUpdate()
    window.addEventListener('achievenest_attendance_update', handleUpdate)
    return () => window.removeEventListener('achievenest_attendance_update', handleUpdate)
  }, [activeAttendanceEvtId])


  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isCertModalOpen, setIsCertModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  // Attendance Safeguards & Monitoring States
  const [confirmModalAction, setConfirmModalAction] = useState(null) // null | 'Closed' | 'Locked' | 'Active'
  const [_liveStreamSearchTerm, _setLiveStreamSearchTerm] = useState('')
  const [_autoLockGuard, _setAutoLockGuard] = useState(true)
  const [_isEventPickerOpen, _setIsEventPickerOpen] = useState(false)
  const [_eventPickerSearch, _setEventPickerSearch] = useState('')

  // Manage Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    name: 'Computer Society NDMU',
    code: 'CEAC',
    department: 'CEAC - College of Engineering, Architecture, and Computing',
    academic_year: 'AY 2025-2026',
    moderator_name: 'Dr. Ana Reyes',
    description: 'The premier technology organization of Notre Dame of Marbel University, dedicated to fostering excellence in computing, innovation, and leadership among its members.',
    contact_email: 'comsoc@ndmu.edu.ph',
    college_dept: 'CEAC - College of Engineering, Architecture, and Computing',
    facebook_url: 'https://facebook.com/ComSocNDMU',
    established_year: '1998',
    social_status: 'Facebook Active'
  })

  useEffect(() => {
    if (orgInfo) {
      setProfileData(prev => ({
        ...prev,
        name: orgInfo.name || prev.name,
        code: orgInfo.code || prev.code,
        department: orgInfo.department || prev.department,
        academic_year: orgInfo.academic_year || prev.academic_year,
        moderator_name: orgInfo.moderator_name || prev.moderator_name,
        description: orgInfo.description || prev.description,
        contact_email: orgInfo.contact_email || prev.contact_email,
        college_dept: orgInfo.college_dept || prev.college_dept,
        facebook_url: orgInfo.facebook_url || prev.facebook_url,
        established_year: orgInfo.established_year || prev.established_year,
        social_status: orgInfo.social_status || prev.social_status
      }))
    }
  }, [orgInfo])

  const handleSaveProfile = () => {
    OrganizationController.updateProfile(profileData)
    setIsEditingProfile(false)
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

  // Handler to open create event modal from dashboard (Redirects to events tab + opens modal)
  const handleDashboardCreateEvent = () => {
    setEditingEvent(null)
    setSearchParams({ tab: 'events' })
    setIsCreateOpen(true)
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

  // Handler for archiving event
  const handleArchiveEvent = (evtId) => {
    if (window.confirm('Are you sure you want to archive this event?')) {
      archiveEvent(evtId)
    }
  }

  const handleOpenScanner = (evt) => {
    setSelectedEvent(evt || events[0])
    setIsScannerOpen(true)
  }

  const handleOpenCertificates = (evt) => {
    setSelectedEvent(evt || events[0])
    setIsCertModalOpen(true)
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


  // Session Control Actions
  const handleSessionControl = (newStatus) => {
    AttendanceController.updateSessionStatus(activeAttendanceEvtId, newStatus)
    setSession({ ...AttendanceController.getSession(activeAttendanceEvtId) })
  }

  const handleExportCSV = () => {
    AttendanceController.exportCSV(activeAttendanceEvtId, activeEvt?.title || 'Event')
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

  // Counts for Manage Events filter pills
  const allEventsCount = events.length
  const upcomingCount = events.filter(e => e.status === 'Upcoming').length
  const ongoingCount = events.filter(e => e.status === 'Ongoing').length
  const completedCount = events.filter(e => e.status === 'Completed').length
  const archivedCount = events.filter(e => e.status === 'Archived').length

  // Filtered Events List for Manage Events Workspace
  const filteredEventsList = events.filter(evt => {
    if (eventsFilter === 'Upcoming' && evt.status !== 'Upcoming') return false
    if (eventsFilter === 'Ongoing' && evt.status !== 'Ongoing') return false
    if (eventsFilter === 'Completed' && evt.status !== 'Completed') return false
    if (eventsFilter === 'Archived' && evt.status !== 'Archived') return false
    if (eventsFilter === 'All' && evt.status === 'Archived') return false

    if (eventsSearchTerm.trim()) {
      const query = eventsSearchTerm.toLowerCase()
      const matchTitle = evt.title.toLowerCase().includes(query)
      const matchVenue = evt.venue.toLowerCase().includes(query)
      const matchCategory = evt.category.toLowerCase().includes(query)
      return matchTitle || matchVenue || matchCategory
    }

    return true
  })

  return (
    <div className="space-y-8 font-sans relative">

      {/* Copied Toast Notification */}
      {showCopiedToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#1b4332] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-400/30 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-xs font-extrabold">Officer Scanner Link Copied!</p>
            <p className="text-[10px] text-emerald-200">Forward link to Student Officers to scan student barcodes.</p>
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
                  className="px-3.5 py-2 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-white" />
                  <span>Go to Attendance Session</span>
                </button>

                <button
                  onClick={() => handleOpenEditModal(selectedEventDetail)}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 hover:text-[#2d8a4e] border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Event</span>
                </button>

                <button
                  onClick={() => {
                    AttendanceController.exportCSV(selectedEventDetail.id, selectedEventDetail.title)
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export Attendance CSV</span>
                </button>

                <button
                  onClick={() => {
                    handleArchiveEvent(selectedEventDetail.id)
                    handleBackToManageEvents()
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Archive</span>
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
                          : selectedEventDetail.status === 'Archived'
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
                      <Calendar className="w-4 h-4 text-[#2d8a4e] shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Date</p>
                        <p className="font-extrabold text-slate-900">{selectedEventDetail.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <Clock className="w-4 h-4 text-[#2d8a4e] shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Time Schedule</p>
                        <p className="font-extrabold text-slate-900">{selectedEventDetail.time}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <MapPin className="w-4 h-4 text-[#2d8a4e] shrink-0" />
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
                      <Building2 className="w-4 h-4 text-[#2d8a4e] shrink-0" />
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
                      className="px-3.5 py-1.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
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
                  <Users className="w-4.5 h-4.5 text-[#2d8a4e]" />
                  Attendance Statistics & Live Session Status
                </h3>

                <button
                  onClick={() => handleGoToAttendanceSession(selectedEventDetail.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
                >
                  <QrCode className="w-3.5 h-3.5 text-white" />
                  <span>Manage Attendance Session</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Verified Attendees</p>
                  <p className="text-xl font-extrabold text-[#2d8a4e] mt-1">
                    {selectedEventDetail.participants_count} Checked-In
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">
                    Open event scope • Auto-certified on close
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Officer Session Status</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${AttendanceController.getSession(selectedEventDetail.id)?.session_status === 'Active' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
                      }`}></span>
                    {AttendanceController.getSession(selectedEventDetail.id)?.session_status === 'Active' ? 'LIVE SCANNING OPEN' : 'PRE-START / PAUSED'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">
                    Attendance Window: {selectedEventDetail.attendance_start_time || '08:30'} - {selectedEventDetail.attendance_end_time || '09:30'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Officer Duty Link</p>
                  <a
                    href={`/scanner/${selectedEventDetail.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono font-bold text-[#2d8a4e] hover:underline flex items-center gap-1 mt-1 truncate"
                  >
                    <span>/scanner/{selectedEventDetail.id}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              </div>
            </div>

            {/* Section C: Official OSAD Certificate & Accreditation Setup Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="w-4.5 h-4.5 text-[#2d8a4e]" />
                  Official OSAD Certificate & Accreditation Setup
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned OSAD Template</p>
                    <p className="text-xs font-extrabold text-slate-900">
                      {selectedEventDetail.osad_template_id === 'OSAD-TPL-03' ? '[OSAD-TPL-03] Certificate of Workshop Completion' :
                        selectedEventDetail.osad_template_id === 'OSAD-TPL-02' ? '[OSAD-TPL-02] Certificate of Leadership & Merit' :
                          selectedEventDetail.osad_template_id === 'OSAD-TPL-04' ? '[OSAD-TPL-04] Excellence & Special Distinction Award' :
                            selectedEventDetail.osad_template_id === 'OSAD-TPL-05' ? '[OSAD-TPL-05] NDMU Sports & Athletics Accreditation' :
                              '[OSAD-TPL-01] Official NDMU Certificate of Participation'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Template graphics, security seals, and accreditation standards managed centrally by Office of Student Affairs & Services.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Verified Signatories & Vault Signatures</p>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Vault Synced</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Signatory 1 Upload Row */}
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                        <p className="font-extrabold text-slate-800 flex items-center gap-1.5 truncate">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#2d8a4e] shrink-0" />
                          <span className="truncate">{selectedEventDetail.signatory_1 || 'Dr. Ana Reyes (Club Moderator)'}</span>
                        </p>
                        <label className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#2d8a4e] border border-emerald-200 text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shrink-0">
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
                          <span className="truncate">{selectedEventDetail.signatory_2 || 'Prof. Juan Dela Cruz (OSAD Director)'}</span>
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
                      Automatic Portfolio Delivery Enabled
                    </span>
                    <p className="text-[11px] text-slate-600">
                      When event attendance closes, digital certificates will automatically transmit directly to attending students' Student Achievement Portfolios.
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
                      <p className="text-[10px] font-extrabold tracking-widest uppercase text-amber-900">NOTRE DAME OF MARBEL UNIVERSITY</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Office of Student Affairs & Services (OSAD)</p>
                      <h2 className="text-lg font-serif font-extrabold text-slate-900 pt-1 tracking-wide">
                        {selectedEventDetail.osad_template_id === 'OSAD-TPL-03' ? 'CERTIFICATE OF WORKSHOP COMPLETION' :
                          selectedEventDetail.osad_template_id === 'OSAD-TPL-02' ? 'CERTIFICATE OF LEADERSHIP & MERIT' :
                            selectedEventDetail.osad_template_id === 'OSAD-TPL-04' ? 'EXCELLENCE & SPECIAL DISTINCTION AWARD' :
                              selectedEventDetail.osad_template_id === 'OSAD-TPL-05' ? 'SPORTS & ATHLETICS ACCREDITATION CERTIFICATE' :
                                'CERTIFICATE OF PARTICIPATION'}
                      </h2>
                    </div>

                    <div className="space-y-1 relative z-10">
                      <p className="text-[10px] text-slate-500 italic">This official digital certificate is proudly presented to</p>
                      <h3 className="text-base font-extrabold text-[#2d8a4e] underline decoration-amber-500 decoration-2 underline-offset-4">
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
                        const sig1 = parseSignatoryInfo(selectedEventDetail.signatory_1, 'Dr. Ana Reyes', 'Club Moderator')
                        const sig2 = parseSignatoryInfo(selectedEventDetail.signatory_2, 'Prof. Juan Dela Cruz', 'OSAD Director')

                        return (
                          <>
                            {/* Signatory 1 */}
                            <div className="flex flex-col items-center justify-end text-center relative">
                              {/* Floating Signature Graphic */}
                              <div className="h-9 flex items-end justify-center -mb-2 z-10 pointer-events-none">
                                <img
                                  src={selectedEventDetail.signatory_1_img || SignatureVault.getSignatures().signatory_1_img || DEFAULT_SIG_1_IMG}
                                  alt="Primary Signatory Signature"
                                  className="h-9 max-w-[130px] object-contain"
                                />
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
                                <img
                                  src={selectedEventDetail.signatory_2_img || SignatureVault.getSignatures().signatory_2_img || DEFAULT_SIG_2_IMG}
                                  alt="Secondary Signatory Signature"
                                  className="h-9 max-w-[130px] object-contain"
                                />
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
                      Verification Code: NDMU-OSAD-2026-X8921 • OSAD Accreditation Badge Verified
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Section C: Scanned Participant Roster & Audit Log Table */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-[#2d8a4e]" />
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
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2d8a4e]"
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
                    {(() => {
                      const sessionLogs = AttendanceController.getSession(selectedEventDetail.id)?.scanned_list || []
                      const filteredLogs = sessionLogs.filter(item => {
                        if (!rosterSearchTerm.trim()) return true
                        const q = rosterSearchTerm.toLowerCase()
                        return (
                          item.full_name?.toLowerCase().includes(q) ||
                          item.student_id?.toLowerCase().includes(q) ||
                          item.program?.toLowerCase().includes(q) ||
                          item.officer_name?.toLowerCase().includes(q)
                        )
                      })

                      if (filteredLogs.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="py-10 text-center text-slate-400 font-medium">
                              No checked-in participants matching search filter.
                            </td>
                          </tr>
                        )
                      }

                      return filteredLogs.map((item) => (
                        <tr key={item.id} className="hover:bg-emerald-50/20 transition">
                          <td className="p-3.5 font-extrabold text-slate-900 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {item.full_name ? item.full_name[0] : 'S'}
                            </div>
                            <span>{item.full_name}</span>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-emerald-700">{item.student_id}</td>
                          <td className="p-3.5 font-medium text-slate-600">{item.program}</td>
                          <td className="p-3.5 font-bold text-slate-800">{item.scanned_at}</td>
                          <td className="p-3.5 text-slate-500 font-medium">{item.officer_name}</td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">

            {/* Header Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Manage Events</h1>
                  <p className="text-xs text-slate-500 font-medium">{events.length} total events</p>
                </div>
              </div>

              <button
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-md flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Event</span>
              </button>
            </div>

            {/* Search Toolbar & Status Filter Pills */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">

              {/* Search Bar Input */}
              <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search events..."
                  value={eventsSearchTerm}
                  onChange={(e) => setEventsSearchTerm(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2d8a4e] transition"
                />
              </div>

              {/* Filter Pills Row */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 shrink-0">
                <button
                  onClick={() => setEventsFilter('All')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${eventsFilter === 'All'
                    ? 'bg-[#2d8a4e] text-white shadow-xs'
                    : 'bg-[#eef7f0] text-slate-700 hover:bg-emerald-100'
                    }`}
                >
                  All ({allEventsCount - archivedCount})
                </button>

                <button
                  onClick={() => setEventsFilter('Upcoming')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${eventsFilter === 'Upcoming'
                    ? 'bg-[#2d8a4e] text-white shadow-xs'
                    : 'bg-[#eef7f0] text-slate-700 hover:bg-emerald-100'
                    }`}
                >
                  Upcoming ({upcomingCount})
                </button>

                <button
                  onClick={() => setEventsFilter('Ongoing')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${eventsFilter === 'Ongoing'
                    ? 'bg-[#2d8a4e] text-white shadow-xs'
                    : 'bg-[#eef7f0] text-slate-700 hover:bg-emerald-100'
                    }`}
                >
                  Ongoing ({ongoingCount})
                </button>

                <button
                  onClick={() => setEventsFilter('Completed')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${eventsFilter === 'Completed'
                    ? 'bg-[#2d8a4e] text-white shadow-xs'
                    : 'bg-[#eef7f0] text-slate-700 hover:bg-emerald-100'
                    }`}
                >
                  Completed ({completedCount})
                </button>

                <button
                  onClick={() => setEventsFilter('Archived')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${eventsFilter === 'Archived'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  Archived ({archivedCount})
                </button>
              </div>

            </div>

            {/* Formatted Event List Items Container */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 space-y-3">
              {filteredEventsList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-medium text-xs">
                  No events found matching your criteria.
                </div>
              ) : (
                filteredEventsList.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => handleViewEventDetails(evt)}
                    className="p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer"
                  >
                    {/* Left Column: 3D Icon + Title + Metadata */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs">
                        {renderBannerGraphic(evt.banner_type)}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#2d8a4e] transition truncate">
                          {evt.title}
                        </h3>
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
                    <div className="flex items-center justify-between md:justify-end gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100" onClick={(e) => e.stopPropagation()}>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-xs ${evt.status === 'Ongoing'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : evt.status === 'Completed'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : evt.status === 'Archived'
                            ? 'bg-slate-200 text-slate-600 border border-slate-300'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                        {evt.status}
                      </span>

                      <button
                        onClick={() => handleViewEventDetails(evt)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#2d8a4e] border border-emerald-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#2d8a4e]" />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => handleGoToAttendanceSession(evt.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
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
                        onPreviewCertificates={(e) => handleOpenCertificates(e)}
                        onExportCSV={(e) => AttendanceController.exportCSV(e.id, e.title)}
                        onArchiveEvent={(id) => handleArchiveEvent(id)}
                      />
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* 2. CLEAN & ELEGANT ATTENDANCE MONITORING HUB                              */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Top Header Card with Clean Event Selector */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Attendance Monitoring Hub
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Select Event & Monitor Live Student Barcode Check-ins by Officers
                </p>
              </div>
            </div>

            {/* Clean Event Selector Dropdown */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:block">EVENT:</label>
              <select
                value={activeAttendanceEvtId}
                onChange={(e) => setActiveAttendanceEvtId(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-extrabold text-slate-800 focus:outline-none focus:border-[#2d8a4e] cursor-pointer shadow-xs"
              >
                {events.filter(e => e.status !== 'Archived').map(evt => (
                  <option key={evt.id} value={evt.id}>{evt.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Share Officer Scanner Access Link Box */}
          <div className="bg-[#1b4332] text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-[#245233] space-y-4 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-extrabold uppercase tracking-wider">
                  OFFICER ACCESS LINK GENERATED
                </span>
                <h3 className="text-lg font-extrabold text-white">Share Scanner Link with Student Officers</h3>
                <p className="text-xs text-emerald-200/80">
                  Forward this link to assigned Student Officers standing at entrance gates to scan student barcodes.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  onClick={handleCopyOfficerLink}
                  className="px-4 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Officer Link</span>
                </button>

                <a
                  href={`/scanner/${activeAttendanceEvtId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/20 flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-300" />
                  <span>Open Mobile Scanner Tab</span>
                </a>
              </div>
            </div>

            {/* Display Link Container */}
            <div className="p-3.5 rounded-2xl bg-[#0c2416] border border-[#1e4a30] font-mono text-xs text-emerald-300 flex items-center justify-between gap-2 overflow-x-auto relative z-10">
              <span className="truncate">{window.location.origin}/scanner/{activeAttendanceEvtId}</span>
              <span className="text-[10px] font-sans font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-md shrink-0 border border-emerald-800">
                Window: {session?.attendance_start_time || '08:30'} - {session?.attendance_end_time || '09:30'}
              </span>
            </div>
          </div>

          {/* Session Controls & Live Scanned Stream Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-6">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">

              {/* Current Session Status Indicator */}
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${session?.session_status === 'Active' ? 'bg-emerald-500 animate-ping' : session?.session_status === 'Closed' ? 'bg-slate-400' : 'bg-amber-500'
                  }`}></div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Current Session Status</p>
                  <p className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    {session?.session_status === 'Active' ? '● LIVE SCANNING OPEN' : session?.session_status === 'Closed' ? 'CLOSED' : '🔒 PRE-START LOCKED (WAITING COUNTDOWN)'}
                  </p>
                </div>
              </div>

              {/* Session Controls (Triggers Safety Confirmation Modal when closing) */}
              <div className="flex items-center gap-2 flex-wrap">
                {session?.session_status !== 'Active' && (
                  <button
                    onClick={() => handleSessionControl('Active')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 text-[#2d8a4e] hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Force Open Session</span>
                  </button>
                )}

                {session?.session_status === 'Active' && (
                  <button
                    onClick={() => handleSessionControl('Locked')}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Pause / Lock Session</span>
                  </button>
                )}

                <button
                  onClick={() => setConfirmModalAction('Closed')}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Close Session</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export Attendance CSV</span>
                </button>
              </div>

            </div>

            {/* Live Scanned Participant Stream Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Users className="w-4.5 h-4.5 text-[#2d8a4e]" />
                  Live Scanned Participant Stream ({(session?.scanned_list || []).length} Checked In)
                </h3>
                <span className="text-xs text-slate-500 font-medium">Auto-synced live</span>
              </div>

              <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                    <tr>
                      <th className="p-3.5">Student Name</th>
                      <th className="p-3.5">Student ID</th>
                      <th className="p-3.5">Program & Course</th>
                      <th className="p-3.5">Scanned Timestamp</th>
                      <th className="p-3.5">Verified Officer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(!session?.scanned_list || session.scanned_list.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                          No student barcodes scanned yet. Forward officer link to start check-ins.
                        </td>
                      </tr>
                    ) : (
                      session.scanned_list.map((item) => (
                        <tr key={item.id} className="hover:bg-emerald-50/20 transition">
                          <td className="p-3.5 font-extrabold text-slate-900 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {item.full_name ? item.full_name[0] : 'S'}
                            </div>
                            <span>{item.full_name}</span>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-emerald-700">{item.student_id}</td>
                          <td className="p-3.5 font-medium text-slate-600">{item.program}</td>
                          <td className="p-3.5 font-bold text-slate-800">{item.scanned_at}</td>
                          <td className="p-3.5 text-slate-600 font-medium">{item.officer_name}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ORGANIZATION MODERATOR MANAGE PROFILE WORKSPACE VIEW                   */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Top Hero Organization Header Card */}
          <div className="bg-[#1b4332] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#245233] relative overflow-hidden">

            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#2d8a4e] border border-emerald-400/30 flex items-center justify-center text-white shadow-lg shrink-0">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-0.5">
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">
                    {profileData.name}
                  </h1>
                  <p className="text-xs font-bold text-emerald-200/80 uppercase tracking-wider">
                    {profileData.code}
                  </p>
                  <p className="text-xs text-emerald-200/90 font-medium pt-0.5">
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
                    <Edit className="w-4 h-4 text-emerald-300" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
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
              <div className="w-8 h-8 rounded-full bg-emerald-100/80 text-[#2d8a4e] flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Organization Information
              </h3>
            </div>

            <div className="space-y-5">

              {/* Organization Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Organization Name
                </label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-[#eaf4ed] border border-[#c5e4cb] text-sm font-bold text-slate-800 focus:outline-none focus:border-[#2d8a4e]"
                  />
                ) : (
                  <div className="w-full px-4 py-3.5 rounded-2xl bg-[#eaf4ed] border border-[#d2e8d7] text-sm font-extrabold text-slate-800">
                    {profileData.name}
                  </div>
                )}
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
                    className="w-full px-4 py-3 rounded-2xl bg-[#eaf4ed] border border-[#c5e4cb] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2d8a4e] leading-relaxed"
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
                    className="w-full max-w-md px-4 py-3 rounded-2xl bg-[#eaf4ed] border border-[#c5e4cb] text-xs font-bold text-slate-800 focus:outline-none focus:border-[#2d8a4e]"
                  />
                ) : (
                  <div className="w-full max-w-md px-4 py-3 rounded-2xl bg-[#eaf4ed] border border-[#d2e8d7] text-xs font-bold text-slate-800">
                    {profileData.contact_email}
                  </div>
                )}
              </div>

              {/* College / Department */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  College / Department
                </label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={profileData.college_dept}
                    onChange={(e) => setProfileData({ ...profileData, college_dept: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-[#eaf4ed] border border-[#c5e4cb] text-xs font-bold text-slate-800 focus:outline-none focus:border-[#2d8a4e]"
                  />
                ) : (
                  <div className="w-full px-4 py-3.5 rounded-2xl bg-[#eaf4ed] border border-[#d2e8d7] text-xs font-bold text-slate-800">
                    {profileData.college_dept}
                  </div>
                )}
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
                      className="w-full px-4 py-3 rounded-2xl bg-[#eaf4ed] border border-[#c5e4cb] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2d8a4e]"
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
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={profileData.moderator_name}
                      onChange={(e) => setProfileData({ ...profileData, moderator_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-[#eaf4ed] border border-[#c5e4cb] text-xs font-extrabold text-slate-800 focus:outline-none focus:border-[#2d8a4e]"
                    />
                  ) : (
                    <div className="w-full px-4 py-3 rounded-2xl bg-[#eaf4ed] border border-[#d2e8d7] text-xs font-extrabold text-slate-800">
                      {profileData.moderator_name}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Persistent Digital Signature Vault Management Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center font-bold shadow-xs">
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
                    <img src={vaultSignatures.signatory_1_img || DEFAULT_SIG_1_IMG} alt="Sig 1" className="h-9 max-w-[140px] object-contain" />
                  </div>
                  <label className="px-3 py-1.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs">
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
                    <img src={vaultSignatures.signatory_2_img || DEFAULT_SIG_2_IMG} alt="Sig 2" className="h-9 max-w-[140px] object-contain" />
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
              <div className="w-11 h-11 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="truncate">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Email</p>
                <p className="text-xs font-extrabold text-slate-900 truncate mt-0.5">{profileData.contact_email}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shrink-0 shadow-xs">
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
        <DigitalCertificatesWorkspace events={events} />
      )}

      {/* ========================================================================= */}
      {/* 4. DEFAULT DASHBOARD / OVERVIEW VIEW                                      */}
      {/* ========================================================================= */}
      {(!activeTab || activeTab === 'overview' || activeTab === 'dashboard') && (
        <div className="space-y-8 animate-in fade-in duration-200">

          {/* Hero Organization Banner Card */}
          <div className="bg-[#1b4332] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#245233] relative overflow-hidden">

            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Organization Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] border border-emerald-400/30 flex items-center justify-center text-white shadow-lg shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {orgInfo.name}
                  </h1>
                  <p className="text-xs text-emerald-200/90 font-medium">
                    {orgInfo.department} • {orgInfo.academic_year}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button
                  onClick={handleDashboardCreateEvent}
                  className="px-4 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Event</span>
                </button>
                <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="#0f4625" stroke="#f59e0b" strokeWidth="4" />
                    <circle cx="50" cy="50" r="28" fill="#ffffff" />
                    <path d="M50 28 L57 42 L72 42 L60 52 L65 67 L50 57 L35 67 L40 52 L28 42 L43 42 Z" fill="#f59e0b" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 4 Interactive Operational Metric Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">

              <button
                type="button"
                onClick={() => setSearchParams({ tab: 'events' })}
                className="bg-white hover:bg-emerald-50/50 rounded-2xl p-4 text-slate-900 shadow-md border border-transparent hover:border-emerald-200 flex items-center gap-4 text-left transition cursor-pointer group"
                title="Click to Manage All Events"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2d8a4e] group-hover:bg-[#2d8a4e] group-hover:text-white flex items-center justify-center shrink-0 transition">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-[#2d8a4e] transition">EVENTS (AY 25-26)</p>
                  <p className="text-xl font-extrabold text-slate-900">{metrics.events_this_year}</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSearchParams({ tab: 'attendance' })}
                className="bg-white hover:bg-emerald-50/50 rounded-2xl p-4 text-slate-900 shadow-md border border-transparent hover:border-emerald-200 flex items-center gap-4 text-left transition cursor-pointer group"
                title="Click to Monitor Live Attendance Sessions"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2d8a4e] group-hover:bg-[#2d8a4e] group-hover:text-white flex items-center justify-center shrink-0 transition">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-[#2d8a4e] transition">TOTAL ATTENDEES</p>
                  <p className="text-xl font-extrabold text-slate-900">{metrics.total_participants}</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOpenCertificates()}
                className="bg-white hover:bg-emerald-50/50 rounded-2xl p-4 text-slate-900 shadow-md border border-transparent hover:border-emerald-200 flex items-center gap-4 text-left transition cursor-pointer group"
                title="Click to Preview & Issue Digital Certificates"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2d8a4e] group-hover:bg-[#2d8a4e] group-hover:text-white flex items-center justify-center shrink-0 transition">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-[#2d8a4e] transition">DIGITAL CERTS ISSUED</p>
                  <p className="text-xl font-extrabold text-slate-900">{metrics.certs_issued}</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSearchParams({ tab: 'profile' })}
                className="bg-white hover:bg-emerald-50/50 rounded-2xl p-4 text-slate-900 shadow-md border border-transparent hover:border-emerald-200 flex items-center gap-4 text-left transition cursor-pointer group"
                title="Click to View Organization Profile & Roster"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2d8a4e] group-hover:bg-[#2d8a4e] group-hover:text-white flex items-center justify-center shrink-0 transition">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-[#2d8a4e] transition">REGISTERED MEMBERS</p>
                  <p className="text-xl font-extrabold text-slate-900">{metrics.active_members}</p>
                </div>
              </button>

            </div>


          </div>

          {/* Events Showcase Grid */}
          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Upcoming Events
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenScanner()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-[#2d8a4e] hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Live Attendance Scanner</span>
                </button>
                <button
                  onClick={() => handleOpenCertificates()}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-slate-600" />
                  <span>Digital Certificates</span>
                </button>
              </div>
            </div>

            {/* 2x2 Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.filter(e => e.status !== 'Archived').map((evt) => {
                const isOngoing = evt.status === 'Ongoing'
                const isCompleted = evt.status === 'Completed'

                return (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setSearchParams({ tab: 'events' })
                      handleViewEventDetails(evt)
                    }}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                  >
                    {/* Upper 3D Graphic Banner */}
                    <div className="h-36 bg-gradient-to-br from-emerald-800 via-slate-800 to-slate-900 p-5 relative flex items-center justify-between text-white overflow-hidden">

                      {/* Status Badge & Options Menu */}
                      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-xs ${isOngoing
                          ? 'bg-emerald-400 text-emerald-950 border border-emerald-300'
                          : isCompleted
                            ? 'bg-slate-200 text-slate-800 border border-slate-300'
                            : 'bg-emerald-100/90 text-emerald-900 border border-emerald-200'
                          }`}>
                          {evt.status}
                        </span>

                        <EventCardOptionsMenu
                          event={evt}
                          onViewDetails={(e) => {
                            setSearchParams({ tab: 'events' })
                            handleViewEventDetails(e)
                          }}
                          onMonitorAttendance={(id) => handleGoToAttendanceSession(id)}
                          onLaunchScanner={(e) => handleOpenScanner(e)}
                          onEditEvent={(e) => handleOpenEditModal(e)}
                          onPreviewCertificates={(e) => handleOpenCertificates(e)}
                          onExportCSV={(e) => AttendanceController.exportCSV(e.id, e.title)}
                          onArchiveEvent={(id) => handleArchiveEvent(id)}
                        />
                      </div>

                      {/* Title overlay */}
                      <div className="relative z-10 max-w-[70%] self-end">
                        <h3 className="font-extrabold text-lg text-white leading-tight drop-shadow-xs group-hover:text-emerald-300 transition">
                          {evt.title}
                        </h3>
                      </div>

                      {/* 3D Graphic Icon */}
                      <div className="relative z-10 shrink-0 transform group-hover:scale-110 transition duration-300">
                        {renderBannerGraphic(evt.banner_type)}
                      </div>

                      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl"></div>
                    </div>

                    {/* Lower Details Content */}
                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">

                      <div className="space-y-2 text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{evt.date} • {evt.time}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{evt.venue}</span>
                        </div>
                      </div>

                      {/* Participants Counter & Footer Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-500">Total Participants</span>
                          <span className="font-extrabold text-[#2d8a4e] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">{evt.participants_count} checked in</span>
                        </div>

                        <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchParams({ tab: 'events' })
                              handleViewEventDetails(evt)
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-[#2d8a4e] text-slate-700 text-xs font-bold border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleGoToAttendanceSession(evt.id)}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <QrCode className="w-3.5 h-3.5 text-white" />
                            <span>Attendance</span>
                          </button>
                        </div>
                      </div>

                    </div>


                  </div>
                )
              })}
            </div>

          </div>
        </div>
      )}

          {/* ================= MODALS ================= */}
          <EventCreationModal
            isOpen={isCreateOpen}
            onClose={() => { setIsCreateOpen(false); setEditingEvent(null) }}
            onCreateEvent={createEvent}
            onUpdateEvent={updateEvent}
            editingEvent={editingEvent}
          />

          <AttendanceScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            activeEvent={selectedEvent}
          />

          <DigitalCertificateModal
            isOpen={isCertModalOpen}
            onClose={() => setIsCertModalOpen(false)}
            activeEvent={selectedEvent}
          />

          {/* Safety Confirmation Guard Modal for High-Risk Session Overrides */}
          {confirmModalAction && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${confirmModalAction === 'Closed' ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      {confirmModalAction === 'Closed' ? 'Confirm Session Closure' :
                        confirmModalAction === 'Locked' ? 'Confirm Locking Session' : 'Confirm Unlocking Session'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Safety Override Safeguard</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium leading-relaxed">
                  {confirmModalAction === 'Closed' ? (
                    <span>
                      Are you sure you want to <strong>permanently close</strong> attendance scanning for <strong>{activeEvt.title}</strong>? All student officer scanner links will be locked and checked-in attendees will be eligible for digital certificate delivery.
                    </span>
                  ) : confirmModalAction === 'Locked' ? (
                    <span>
                      Are you sure you want to <strong>pause/lock</strong> scanning duty? Officers will be temporarily blocked from scanning student barcodes until re-opened.
                    </span>
                  ) : (
                    <span>
                      Are you sure you want to <strong>force open</strong> live attendance scanning for <strong>{activeEvt.title}</strong>?
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setConfirmModalAction(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => {
                      handleSessionControl(confirmModalAction)
                      setConfirmModalAction(null)
                    }}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer text-white ${confirmModalAction === 'Closed' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#2d8a4e] hover:bg-[#236e3e]'
                      }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Execute</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )
      }
