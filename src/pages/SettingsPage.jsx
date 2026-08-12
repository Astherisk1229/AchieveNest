import React, { useState } from 'react'
import useTheme from '../hooks/useTheme'
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
  Building2,
  Sun,
  Moon
} from 'lucide-react'
import { getCurrentUser } from '../services/authService'

export default function SettingsPage({ currentUser }) {
  const { theme, isDark, setTheme } = useTheme()
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
    <>
      <div className="max-w-4xl mx-auto space-y-6 font-sans pb-12">
        
        {/* Toast Feedback */}
        {showSavedToast && (
          <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-[#2d8a4e] text-white text-xs font-bold shadow-xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
            <Check className="w-4 h-4 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Unified Top Header Banner */}
        <div className="bg-white dark:bg-[#131e2e] p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
              <Settings className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Settings &amp; Preferences</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Manage profile details, notification preferences, and system appearance for <strong>{user.full_name}</strong></p>
            </div>
          </div>
        </div>

        {/* ================= PROGRAM COORDINATOR / PERSONNEL SETTINGS VIEW ================= */}
        {isCoordinatorOrPersonnel ? (
          <div className="space-y-6">
            
            {/* 1. PROFILE SETTINGS CARD */}
            <div className="p-6 sm:p-7 bg-white dark:bg-[#131e2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
              
              {/* Card Header */}
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
                  <User className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">Profile Settings</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Manage your personal and administrative account details</p>
                </div>
              </div>

              {/* Form Grid */}
              <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-[#2d8a4e] transition bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-[#2d8a4e] transition bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Department / College Unit
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-[#2d8a4e] transition bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </form>

            </div>

            {/* 2. NOTIFICATIONS PREFERENCES CARD */}
            <div className="p-6 sm:p-7 bg-white dark:bg-[#131e2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">Notification Preferences</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Control system email and push notification alerts</p>
                </div>
              </div>

              <div className="space-y-3 pt-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Email Notification Alerts</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Receive email alerts for pending achievement submissions and verification updates</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('emailNotifications')}
                    className={`w-11 h-6 rounded-full transition-colors duration-200 p-0.5 cursor-pointer ${
                      notifications.emailNotifications ? 'bg-[#2d8a4e]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-xs ${
                      notifications.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Achievement Approval Digest</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Receive summary reports when student achievements are confirmed</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('achievementAlerts')}
                    className={`w-11 h-6 rounded-full transition-colors duration-200 p-0.5 cursor-pointer ${
                      notifications.achievementAlerts ? 'bg-[#2d8a4e]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-xs ${
                      notifications.achievementAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* 3. COMPACT APPEARANCE & THEME PREFERENCES ROW */}
            <div className="p-5 bg-white dark:bg-[#131e2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 flex items-center justify-center shrink-0">
                  <Sun className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">Appearance &amp; Theme Mode</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Switch between Day (Light) and Night (Dark) mode</p>
                </div>
              </div>

              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setTheme('light')
                    showToast('Switched to Day Mode (Light)!')
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    !isDark
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span>☀️ Day</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark')
                    showToast('Switched to Night Mode (Dark)!')
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    isDark
                      ? 'bg-slate-950 text-amber-400 border border-slate-800'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>🌙 Night</span>
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* ================= STUDENT SETTINGS VIEW ================= */
          <div className="space-y-6">
            
            {/* Compact Appearance Card for Students */}
            <div className="p-5 bg-white dark:bg-[#131e2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 flex items-center justify-center shrink-0">
                  <Sun className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">Appearance &amp; Theme Mode</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Switch between Day (Light) and Night (Dark) mode</p>
                </div>
              </div>

              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setTheme('light')
                    showToast('Switched to Day Mode (Light)!')
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    !isDark
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span>☀️ Day</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark')
                    showToast('Switched to Night Mode (Dark)!')
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    isDark
                      ? 'bg-slate-950 text-amber-400 border border-slate-800'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>🌙 Night</span>
                </button>
              </div>
            </div>

            {/* Portfolio Privacy */}
            <div className="p-6 sm:p-7 bg-white dark:bg-[#131e2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
                  <Globe className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">Portfolio Privacy &amp; Sharing</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Manage custom public link and portfolio visibility</p>
                </div>
              </div>

              <div className="space-y-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                <p>Public Portfolio link: <code className="bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg font-mono text-[#2d8a4e] dark:text-emerald-400 text-xs font-semibold border border-slate-200 dark:border-slate-700">{shareableUrl}</code></p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
                >
                  {copiedLink ? 'Copied Link! ✓' : 'Copy Portfolio Link'}
                </button>
              </div>
            </div>

            {/* Account Security & Password Update */}
            <div className="p-6 sm:p-7 bg-white dark:bg-[#131e2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">Account Security &amp; Password</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Self-service password update for active sessions</p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  showToast('Security Update: Your password has been updated successfully!')
                }}
                className="space-y-4 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password (min. 8 chars)"
                      minLength={8}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-[#2d8a4e]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Re-enter new password"
                      minLength={8}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-[#2d8a4e]"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
                  >
                    Update Account Password
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

      </div>
    </>
  )
}
