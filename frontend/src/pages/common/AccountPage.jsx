import React, { useState } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Shield, 
  Check, 
  Save, 
  Camera, 
  Edit3, 
  X,
  Building2,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  MapPin,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import useUserProfile from '../../hooks/useUserProfile'

export default function AccountPage({ currentUser }) {
  const { user: authUser } = useAuth()
  const activeUser = currentUser || authUser

  const {
    user,
    presentation,
    isSaving,
    saveSuccess,
    saveError,
    handleSaveOverrides
  } = useUserProfile(activeUser)

  // Edit Mode & Input State for Editable Self-Service Fields
  const [isEditing, setIsEditing] = useState(false)
  const [phone, setPhone] = useState(user.phone || '')
  const [location, setLocation] = useState(user.location || '')
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '')

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [tempAvatarUrl, setTempAvatarUrl] = useState(user.avatar_url || '')
  const [showPasswordNoticeModal, setShowPasswordNoticeModal] = useState(false)

  const handleSaveForm = (e) => {
    e.preventDefault()
    const success = handleSaveOverrides({
      phone,
      location,
      avatar_url: avatarUrl
    })
    if (success) {
      setIsEditing(false)
    }
  }

  const handleCancelForm = () => {
    setPhone(user.phone || '')
    setLocation(user.location || '')
    setAvatarUrl(user.avatar_url || '')
    setIsEditing(false)
  }

  const handleSaveAvatarModal = (e) => {
    e.preventDefault()
    if (!tempAvatarUrl.trim()) return
    setAvatarUrl(tempAvatarUrl.trim())
    handleSaveOverrides({ avatar_url: tempAvatarUrl.trim() })
    setIsAvatarModalOpen(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans text-slate-900 dark:text-slate-100">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-6 h-6 text-[#064e2b] dark:text-emerald-400 shrink-0" />
            <span>{presentation.pageTitle}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            View authoritative institutional credentials and update self-service contact details.
          </p>
        </div>

        <span className={`px-3 py-1 rounded-lg text-xs font-extrabold border shrink-0 ${presentation.badgeColor}`}>
          {presentation.badgeText}
        </span>
      </div>

      {/* Persistence Feedback Toast */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-[#245F42] text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Profile contact preferences updated successfully!</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-2xs">
        
        {/* User Identity Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative group shrink-0">
            <img
              src={avatarUrl || user.avatar_url}
              alt={user.full_name}
              className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700"
            />
            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-[#176B43] hover:bg-[#125536] text-white transition shadow-xs cursor-pointer"
              title="Change Profile Picture"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          <div className="space-y-1 text-center sm:text-left min-w-0 flex-1">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug truncate">
              {user.full_name}
            </h2>
            <p className="text-xs font-bold text-[#16834a] dark:text-emerald-400 flex items-center justify-center sm:justify-start gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>{user.designation || 'HR Staff Officer'}</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              {user.department || user.college || 'Human Resource Management & Development Office'}
            </p>
            <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
              <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                ID: {user.employee_id || user.student_id}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#1D2A23] border border-[#B8CDBD] dark:border-[#374B3F] text-[#174E31] dark:text-slate-200 hover:bg-[#F1F7F2] font-extrabold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#174E31]" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveForm}
                  disabled={isSaving}
                  className="px-3.5 py-1.5 rounded-xl bg-[#176B43] hover:bg-[#125536] text-white font-extrabold text-xs flex items-center gap-1 cursor-pointer disabled:bg-[#E5ECE7] disabled:text-[#7A8B80] disabled:cursor-not-allowed transition-all shadow-xs"
                >
                  <Save className="w-3.5 h-3.5 text-white" />
                  <span>Save Edits</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section 1: Authoritative Read-Only Identity Fields */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Authoritative Institutional Details (Read-Only)</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Managed by NDMU HR Administration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Full Legal Name</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>{user.full_name}</span>
                <Lock className="w-3 h-3 text-slate-400" />
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Employee ID</span>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>{user.employee_id || user.student_id}</span>
                <Lock className="w-3 h-3 text-slate-400" />
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Institutional Email</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between truncate">
                <span className="truncate">{user.email}</span>
                <Lock className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Designation / Role</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>{user.designation || 'HR Staff'}</span>
                <Lock className="w-3 h-3 text-slate-400" />
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Self-Service Editable Contact Information */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#16834a] dark:text-emerald-400" />
            <span>Self-Service Contact Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Contact Phone Number</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+63 917 000 0000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#69A97C]"
                />
              ) : (
                <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-200">
                  {user.phone || 'Not specified'}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Work / Office Location</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Koronadal City, South Cotabato"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#69A97C]"
                />
              ) : (
                <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-200">
                  {user.location || 'Koronadal City, South Cotabato'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Account Security & Authentication Policy */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">Account Security & Credentials</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 dark:text-[#245F42] bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              Institutional Passkey Active
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Your account is authenticated via NDMU Single Sign-On (SSO). Password resets and credential updates require authorization from the HR Administration Office or OSAD IT Governance.
          </p>

          <button
            type="button"
            onClick={() => setShowPasswordNoticeModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            <span>Self-Service Credential Reset</span>
          </button>
        </div>
      </div>

      {/* Avatar Edit Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#131e2e] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#16834a]" />
                <span>Update Profile Picture URL</span>
              </h3>
              <button onClick={() => setIsAvatarModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAvatarModal} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Avatar Image URL (HTTP/HTTPS)</label>
                <input
                  type="text"
                  value={tempAvatarUrl}
                  onChange={e => setTempAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#69A97C]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#176B43] hover:bg-[#125536] text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer"
                >
                  Update Picture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Notice Modal */}
      {showPasswordNoticeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#131e2e] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Authentication Notice</span>
              </h3>
              <button onClick={() => setShowPasswordNoticeModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              In accordance with institutional security policies, password updates in this local prototype require verification from the backend authentication service. For password resets, please use the <strong>Personnel Directory Reset Queue</strong> or contact OSAD IT Support.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordNoticeModal(false)}
                className="px-4 py-1.5 rounded-xl bg-[#176B43] hover:bg-[#125536] text-white font-extrabold text-xs cursor-pointer transition-all shadow-xs"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
