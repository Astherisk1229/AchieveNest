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
  Building2
} from 'lucide-react'
import { getCurrentUser } from '../services/authService'

export default function SettingsPage({ currentUser }) {
  const [user, setUser] = useState(() => {
    const active = currentUser || getCurrentUser()
    if (active) return active
    return {
      full_name: 'Dr. Ana Reyes',
      student_id: 'PRG-2024-001',
      user_type: 'program_coordinator',
      program: 'BS Computer Science',
      department: 'CEAC - College of Engineering, Architecture, and Computing',
      email: 'personnel@ndmu.edu.ph',
      phone: '+63 912 345 6789',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    }
  })

  const isCoordinatorOrPersonnel = user.user_type === 'personnel' || user.user_type === 'program_coordinator'

  // Coordinator Profile Form State
  const [fullName, setFullName] = useState(user.full_name || 'Dr. Ana Reyes')
  const [email, setEmail] = useState(user.email || 'personnel@ndmu.edu.ph')
  const [department, setDepartment] = useState(user.department || 'CEAC - College of Engineering, Architecture, and Computing')

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    achievementAlerts: true,
    weeklyDigest: false
  })

  // Student Settings Specific State
  const [isPublicPortfolio, setIsPublicPortfolio] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)
  const [pdfVisibility, setPdfVisibility] = useState({
    includeStudentId: true,
    includePhone: false
  })

  // Toast Feedback
  const [showSavedToast, setShowSavedToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('Settings updated successfully!')
  const [showResetModal, setShowResetModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)

  const shareableSlug = (fullName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '-')
  const shareableUrl = `achievenest.ndmu.edu/p/${shareableSlug}`

  const showToast = (msg) => {
    setToastMessage(msg)
    setShowSavedToast(true)
    setTimeout(() => setShowSavedToast(false), 3000)
  }

  const handleToggleNotification = (key) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: !prev[key] }
      showToast('Notification preference saved!')
      return updated
    })
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${shareableUrl}`)
    setCopiedLink(true)
    showToast('Custom portfolio URL copied to clipboard!')
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    showToast('Profile information updated successfully!')
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6 font-sans pb-12">
        
        {/* Toast Feedback */}
        {showSavedToast && (
          <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-[#2d8a4e] text-white text-xs font-bold shadow-xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
            <Check className="w-4 h-4 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ================= PROGRAM COORDINATOR / PERSONNEL SETTINGS VIEW ================= */}
        {isCoordinatorOrPersonnel ? (
          <div className="space-y-6">
            
            {/* 1. PROFILE SETTINGS CARD */}
            <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-6">
              
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shadow-xs shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 leading-tight">Profile Settings</h2>
                  <p className="text-xs text-slate-500 font-medium">Manage your account information</p>
                </div>
              </div>

              {/* Form Grid */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#2d8a4e] transition bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#2d8a4e] transition bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#2d8a4e] transition bg-white"
                  />
                </div>
              </form>

            </div>

            {/* 2. NOTIFICATION PREFERENCES CARD */}
            <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-6">
              
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 leading-tight">Notification Preferences</h2>
                  <p className="text-xs text-slate-500 font-medium">Choose how you want to be notified</p>
                </div>
              </div>

              {/* Toggles List */}
              <div className="space-y-5 pt-1">
                
                {/* Email Notifications */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900">Email Notifications</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Receive updates via email</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleNotification('emailNotifications')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notifications.emailNotifications ? 'bg-[#2d8a4e]' : 'bg-slate-300'
                    }`}
                    role="switch"
                    aria-checked={notifications.emailNotifications}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      notifications.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900">Push Notifications</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Get instant notifications</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleNotification('pushNotifications')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notifications.pushNotifications ? 'bg-[#2d8a4e]' : 'bg-slate-300'
                    }`}
                    role="switch"
                    aria-checked={notifications.pushNotifications}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      notifications.pushNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Achievement Alerts */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900">Achievement Alerts</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Notify when achievements are verified</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleNotification('achievementAlerts')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notifications.achievementAlerts ? 'bg-[#2d8a4e]' : 'bg-slate-300'
                    }`}
                    role="switch"
                    aria-checked={notifications.achievementAlerts}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      notifications.achievementAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Weekly Digest */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900">Weekly Digest</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Receive weekly summary emails</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleNotification('weeklyDigest')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notifications.weeklyDigest ? 'bg-[#2d8a4e]' : 'bg-slate-300'
                    }`}
                    role="switch"
                    aria-checked={notifications.weeklyDigest}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      notifications.weeklyDigest ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

              </div>

            </div>

          </div>
        ) : (
          /* ================= STUDENT SETTINGS VIEW ================= */
          <div className="space-y-8">
            <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Settings &amp; Preferences</h1>
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  Manage public portfolio accessibility and notification preferences for <strong>{user.full_name}</strong>
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 shrink-0 hidden sm:block">
                <Settings className="w-7 h-7" />
              </div>
            </div>

            {/* Portfolio Privacy */}
            <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#2d8a4e]" />
                  <span>Portfolio Privacy &amp; Sharing</span>
                </h2>
              </div>
              <div className="space-y-4 text-xs font-medium text-slate-600">
                <p>Public Portfolio link: <code className="bg-slate-100 px-2 py-1 rounded font-mono text-[#2d8a4e]">{shareableUrl}</code></p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-[#2d8a4e] text-white font-bold text-xs"
                >
                  {copiedLink ? 'Copied Link! ✓' : 'Copy Portfolio Link'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  )
}
