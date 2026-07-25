import React, { useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import { 
  User, 
  Mail, 
  Shield, 
  Check, 
  Globe,
  Share2,
  Copy,
  ExternalLink,
  Bell,
  Download,
  CheckSquare,
  Square,
  Power,
  ShieldAlert,
  KeyRound,
  FileText,
  Settings,
  Send
} from 'lucide-react'
import { getCurrentUser } from '../services/authService'

export default function SettingsPage({ currentUser }) {
  const [user] = useState(currentUser || getCurrentUser() || {
    full_name: 'Maria Santos',
    student_id: '2024-01234',
    user_type: 'student',
    program: 'BS Computer Science',
    email: 'student@ndmu.edu.ph',
    phone: '+63 912 345 6789',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  })

  // Phase 3.7 State: Privacy & Sharing
  const [isPublicPortfolio, setIsPublicPortfolio] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)
  const [pdfVisibility, setPdfVisibility] = useState({
    includeStudentId: true,
    includePhone: false
  })

  // Phase 3.7 State: Unified NDMU Forest Green Notification Preferences
  const [notifications, setNotifications] = useState({
    emailVerification: true,
    systemAnnouncements: true,
    weeklySummary: false,
    browserPush: true
  })

  // UI Feedback Toasts & Modals
  const [showSavedToast, setShowSavedToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('Settings updated successfully!')
  const [showResetModal, setShowResetModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)

  const shareableSlug = user.full_name.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const shareableUrl = `achievenest.ndmu.edu/p/${shareableSlug}`

  const showToast = (msg) => {
    setToastMessage(msg)
    setShowSavedToast(true)
    setTimeout(() => setShowSavedToast(false), 3000)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${shareableUrl}`)
    setCopiedLink(true)
    showToast('Custom portfolio URL copied to clipboard!')
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleToggleNotification = (key) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: !prev[key] }
      showToast('Notification preference saved!')
      return updated
    })
  }

  const handleDownloadCSV = () => {
    const headers = ['Record ID', 'Student Name', 'Student ID', 'Program', 'Email', 'Phone', 'Public Portfolio Status']
    const row = [
      'REC-2026-001',
      `"${user.full_name}"`,
      `"${user.student_id}"`,
      `"${user.program}"`,
      `"${user.email}"`,
      `"${user.phone}"`,
      `"${isPublicPortfolio ? 'Public' : 'Deactivated / Private'}"`
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), row.join(',')].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `AchieveNest_Settings_Data_${user.student_id}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Settings & account data CSV downloaded successfully!')
  }

  const handleToggleDeactivatePortfolio = () => {
    setIsPublicPortfolio(prev => !prev)
    setShowDeactivateModal(false)
    showToast(isPublicPortfolio ? 'Public portfolio access deactivated.' : 'Public portfolio reactivated successfully!')
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 font-sans pb-12">
        
        {/* Toast Feedback */}
        {showSavedToast && (
          <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-[#2d8a4e] text-white text-xs font-bold shadow-xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
            <Check className="w-4 h-4 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ================= PAGE HEADER CARD ================= */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Settings & Preferences</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                isPublicPortfolio 
                  ? 'bg-emerald-50 text-[#2d8a4e] border-emerald-200' 
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {isPublicPortfolio ? '● Public Portfolio Active' : '● Portfolio Deactivated'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500">
              Manage public portfolio accessibility, custom URL, PDF export visibility, and notification preferences for <strong>{user.full_name}</strong> ({user.student_id})
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 shrink-0 hidden sm:block">
            <Settings className="w-7 h-7" />
          </div>
        </div>

        {/* ================= PORTFOLIO PRIVACY & SHARING CARD ================= */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-6">
          
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#2d8a4e]" />
              <span>Portfolio Privacy & Sharing</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Control public access to your digital portfolio, copy shareable URL link, and set PDF dossier export visibility controls.
            </p>
          </div>

          <div className="space-y-6">
            
            {/* 1. Public Portfolio Toggle */}
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900">Public Portfolio Access</h3>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    isPublicPortfolio ? 'bg-[#2d8a4e] text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {isPublicPortfolio ? 'Active' : 'Off'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Easily turn public portfolio web access on or off for employers and external reviewers.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextState = !isPublicPortfolio
                  setIsPublicPortfolio(nextState)
                  showToast(nextState ? 'Public portfolio enabled!' : 'Public portfolio disabled.')
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isPublicPortfolio ? 'bg-[#2d8a4e]' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={isPublicPortfolio}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isPublicPortfolio ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 2. Custom Shareable Link */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-[#2d8a4e]" />
                <span>Custom Shareable Link</span>
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-xs">
                    https://
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={shareableUrl}
                    className="w-full pl-20 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 select-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-4 py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer shrink-0 ${
                      copiedLink 
                        ? 'bg-emerald-600 text-white border border-emerald-600' 
                        : 'bg-[#2d8a4e] hover:bg-[#236e3e] text-white'
                    }`}
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copied Link! ✓' : 'Copy Link'}</span>
                  </button>
                  <a
                    href={`/student/portfolio`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer border border-slate-200"
                    title="Open Portfolio Preview"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* 3. PDF Export Visibility Controls */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="space-y-0.5">
                <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#2d8a4e]" />
                  <span>PDF Export Visibility Controls</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Checkboxes to include or exclude sensitive contact data on exported PDF dossiers.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-3 text-xs font-bold text-slate-800 cursor-pointer select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setPdfVisibility(prev => ({ ...prev, includeStudentId: !prev.includeStudentId }))
                      showToast('PDF export visibility preference updated!')
                    }}
                    className="text-[#2d8a4e] focus:outline-none"
                  >
                    {pdfVisibility.includeStudentId ? (
                      <CheckSquare className="w-4 h-4 text-[#2d8a4e]" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <span>Include Student ID / Employee Number on exported PDFs</span>
                </label>

                <label className="flex items-center gap-3 text-xs font-bold text-slate-800 cursor-pointer select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setPdfVisibility(prev => ({ ...prev, includePhone: !prev.includePhone }))
                      showToast('PDF export visibility preference updated!')
                    }}
                    className="text-[#2d8a4e] focus:outline-none"
                  >
                    {pdfVisibility.includePhone ? (
                      <CheckSquare className="w-4 h-4 text-[#2d8a4e]" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <span>Include Phone Number on exported PDFs</span>
                </label>
              </div>
            </div>

          </div>

        </div>

        {/* ================= NOTIFICATION PREFERENCES CARD (UNIFIED NDMU FOREST GREEN THEME) ================= */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-6">
          
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#2d8a4e]" />
              <span>Notification Preferences</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              All toggle switches and icon badges match the official NDMU Forest Green color scheme (<span className="font-mono text-[#2d8a4e] font-bold">#2d8a4e</span>) for visual consistency.
            </p>
          </div>

          <div className="space-y-4">
            
            {/* Toggle 1: Email Verification Alerts */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-200 flex items-center justify-between gap-4 transition">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900">Email Verification & Status Alerts</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Receive email notifications when coordinator verifies or returns your achievement</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleNotification('emailVerification')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  notifications.emailVerification ? 'bg-[#2d8a4e]' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={notifications.emailVerification}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  notifications.emailVerification ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Toggle 2: OSAD & Campus Announcements */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-200 flex items-center justify-between gap-4 transition">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900">OSAD System & Campus Announcements</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Notifications regarding student org events, campus announcements, and deadlines</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleNotification('systemAnnouncements')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  notifications.systemAnnouncements ? 'bg-[#2d8a4e]' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={notifications.systemAnnouncements}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  notifications.systemAnnouncements ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Toggle 3: Weekly Achievement Digest */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-200 flex items-center justify-between gap-4 transition">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900">Weekly Portfolio Digest</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Weekly summary email featuring verified points and portfolio analytics</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleNotification('weeklySummary')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  notifications.weeklySummary ? 'bg-[#2d8a4e]' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={notifications.weeklySummary}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  notifications.weeklySummary ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Toggle 4: Real-time Desktop Push */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-200 flex items-center justify-between gap-4 transition">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900">Browser Real-time Desktop Popups</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Show immediate desktop notifications when logged in to AchieveNest</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleNotification('browserPush')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  notifications.browserPush ? 'bg-[#2d8a4e]' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={notifications.browserPush}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  notifications.browserPush ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

          </div>

        </div>

        {/* ================= ACCOUNT & SECURITY CARD (IMPROVED EXPLICIT ACTIONS) ================= */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-6">
          
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#2d8a4e]" />
              <span>Account & Security Management</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Explicit action buttons on the right side of each security & account option.
            </p>
          </div>

          <div className="space-y-4">
            
            {/* Option 1: Download CSV Account Data */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Download Account CSV Backup</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Export a full structured CSV file containing all account metadata and verification records.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="px-5 py-2.5 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md transition cursor-pointer shrink-0 flex items-center gap-2 self-start sm:self-center"
              >
                <Download className="w-4 h-4" />
                <span>Download CSV</span>
              </button>
            </div>

            {/* Option 2: Request Password Reset */}
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white text-[#2d8a4e] border border-emerald-200 shrink-0 shadow-xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">OSAD Password Reset Ticket</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Submit an identity-verified ticket to OSAD to safely update your university credentials.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="px-5 py-2.5 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md transition cursor-pointer shrink-0 self-start sm:self-center"
              >
                Request Reset
              </button>
            </div>

            {/* Option 3: Deactivate Public Portfolio (Soft Red Action) */}
            <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {isPublicPortfolio ? 'Deactivate Public Portfolio' : 'Reactivate Public Portfolio'}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Replaces inappropriate "Delete Account" options. Deactivating turns off public share links while preserving all official university records for registrar compliance.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeactivateModal(true)}
                className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs border transition cursor-pointer shrink-0 self-start sm:self-center ${
                  isPublicPortfolio 
                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300' 
                    : 'bg-emerald-100 hover:bg-emerald-200 text-[#2d8a4e] border-emerald-300'
                }`}
              >
                {isPublicPortfolio ? 'Deactivate Public Portfolio' : 'Reactivate Portfolio'}
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* OSAD PASSWORD RESET MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150 font-sans">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center">
              <Send className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">Submit OSAD Reset Request</h3>
              <p className="text-xs text-slate-500 font-medium">
                A password reset request ticket will be logged for <strong>{user.full_name}</strong> ({user.student_id}).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1 font-medium">
              <p>• <strong>Ticket ID:</strong> #OSAD-2026-{Math.floor(1000 + Math.random() * 9000)}</p>
              <p>• <strong>Status:</strong> Pending OSAD Staff Verification</p>
              <p>• <strong>Expected SLA:</strong> Within 24 Hours</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false)
                  showToast('Password Reset Ticket #OSAD-2026-8912 submitted successfully!')
                }}
                className="px-5 py-2.5 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Confirm Request ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEACTIVATE PUBLIC PORTFOLIO MODAL (SOFT RED ACTION) */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150 font-sans">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-rose-100 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-900">
                {isPublicPortfolio ? 'Deactivate Public Portfolio Access?' : 'Reactivate Public Portfolio Access?'}
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {isPublicPortfolio ? (
                  <>
                    Deactivating turns off public URL sharing (<code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700 font-mono">{shareableUrl}</code>). 
                    All official university records, verified achievements, and registrar transcripts remain <strong>100% preserved and intact</strong>.
                  </>
                ) : (
                  <>
                    Reactivating will make your verified achievements public once again at <code className="bg-slate-100 px-1 py-0.5 rounded text-[#2d8a4e] font-mono">{shareableUrl}</code>.
                  </>
                )}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium space-y-1">
              <p className="font-bold flex items-center gap-1 text-amber-950">
                <Shield className="w-3.5 h-3.5 text-amber-700" /> Institutional Records Guarantee:
              </p>
              <p>AchieveNest preserves official university records for accreditation. Accounts are never destroyed.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleDeactivatePortfolio}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs shadow-md transition cursor-pointer ${
                  isPublicPortfolio 
                    ? 'bg-rose-700 hover:bg-rose-800 text-white' 
                    : 'bg-[#2d8a4e] hover:bg-[#236e3e] text-white'
                }`}
              >
                {isPublicPortfolio ? 'Confirm Deactivation' : 'Confirm Reactivation ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  )
}
