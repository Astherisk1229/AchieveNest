import React, { useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Shield, 
  Check, 
  Save, 
  GraduationCap, 
  Building2, 
  Camera, 
  AlertCircle,
  KeyRound,
  FileCheck,
  Send,
  Edit3,
  X
} from 'lucide-react'

export default function AccountPage({ currentUser }) {
  const [user, setUser] = useState(currentUser || {
    full_name: 'Maria Santos',
    student_id: '2024-01234',
    user_type: 'student',
    program: 'BS Computer Science',
    email: 'student@ndmu.edu.ph',
    phone: '+63 912 345 6789',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  })

  // Edit Mode Toggle State
  const [isEditing, setIsEditing] = useState(false)

  // Editable Form Inputs State
  const [fullName, setFullName] = useState(user.full_name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone)
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url)
  
  // UI Feedback Toasts / Modals
  const [showSavedToast, setShowSavedToast] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [tempAvatarUrl, setTempAvatarUrl] = useState(user.avatar_url)

  const isStudent = user.user_type === 'student'

  const handleSaveAccountInfo = (e) => {
    e.preventDefault()
    setUser(prev => ({
      ...prev,
      full_name: fullName,
      email,
      phone,
      avatar_url: avatarUrl
    }))
    setIsEditing(false)
    setShowSavedToast(true)
    setTimeout(() => setShowSavedToast(false), 3000)
  }

  const handleCancelEdit = () => {
    setFullName(user.full_name)
    setEmail(user.email)
    setPhone(user.phone)
    setIsEditing(false)
  }

  const handleUpdateAvatar = (e) => {
    e.preventDefault()
    if (!tempAvatarUrl.trim()) return
    setAvatarUrl(tempAvatarUrl.trim())
    setUser(prev => ({ ...prev, avatar_url: tempAvatarUrl.trim() }))
    setIsAvatarModalOpen(false)
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 font-sans pb-12">
        
        {/* Toast Feedback */}
        {showSavedToast && (
          <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-[#2d8a4e] text-white text-xs font-bold shadow-xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
            <Check className="w-4 h-4 text-emerald-200" />
            <span>Account information updated successfully!</span>
          </div>
        )}

        {/* ================= PROFILE AVATAR HEADER CARD ================= */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-[#2d8a4e] p-1 bg-white overflow-hidden shadow-md">
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <button
                type="button"
                onClick={() => { setTempAvatarUrl(avatarUrl); setIsAvatarModalOpen(true); }}
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-[#2d8a4e] text-white hover:bg-[#236e3e] border-2 border-white transition shadow-md cursor-pointer"
                title="Change Profile Picture"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{fullName}</h1>
              <p className="text-xs font-semibold text-slate-500">
                {isStudent ? 'Student Account' : 'Faculty / Personnel Account'}
              </p>
              
              <button
                type="button"
                onClick={() => { setTempAvatarUrl(avatarUrl); setIsAvatarModalOpen(true); }}
                className="text-xs font-bold text-[#2d8a4e] hover:underline pt-1 block cursor-pointer"
              >
                Change Profile Picture
              </button>
            </div>
          </div>

          {/* Edit Profile Button Header Quick Action */}
          <button
            type="button"
            onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
            className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition shadow-2xs cursor-pointer self-start sm:self-center ${
              isEditing 
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-800'
            }`}
          >
            {isEditing ? <X className="w-4 h-4 text-rose-600" /> : <Edit3 className="w-4 h-4 text-[#2d8a4e]" />}
            <span>{isEditing ? 'Cancel Editing' : 'Edit Information'}</span>
          </button>

        </div>

        {/* ================= ACCOUNT INFORMATION FORM ================= */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-6">
          
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-[#2d8a4e]" />
                <span>Account Information</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isEditing ? 'Modify editable account details below and click Save Changes' : 'Viewing account credentials (click Edit Information to modify)'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
              className="text-xs font-extrabold text-[#2d8a4e] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel' : 'Edit'}</span>
            </button>
          </div>

          <form onSubmit={handleSaveAccountInfo} className="space-y-5">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs font-semibold transition ${
                    isEditing 
                      ? 'bg-white border-[#2d8a4e] text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2d8a4e]/20'
                      : 'bg-emerald-50/50 border-emerald-100 text-slate-800 cursor-default'
                  }`}
                />
              </div>
            </div>

            {/* Student Number / Employee ID (READ ONLY / PROTECTED ALWAYS) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>{isStudent ? 'Student Number' : 'Employee ID'}</span>
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#2d8a4e]" />
                  Protected Registrar Record
                </span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-emerald-700" />
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={user.student_id}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs font-bold text-slate-700 cursor-not-allowed select-none"
                />
              </div>
              <p className="text-[11px] font-medium text-slate-400 pl-1">
                This field cannot be edited
              </p>
            </div>

            {/* Program / Department (READ ONLY ALWAYS) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                {isStudent ? 'Program' : 'Department / College'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={user.program}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs font-bold text-slate-700 cursor-not-allowed select-none"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  disabled={!isEditing}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs font-semibold transition ${
                    isEditing 
                      ? 'bg-white border-[#2d8a4e] text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2d8a4e]/20'
                      : 'bg-emerald-50/50 border-emerald-100 text-slate-800 cursor-default'
                  }`}
                />
              </div>
            </div>

            {/* Contact Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">Contact Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs font-semibold transition ${
                    isEditing 
                      ? 'bg-white border-[#2d8a4e] text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2d8a4e]/20'
                      : 'bg-emerald-50/50 border-emerald-100 text-slate-800 cursor-default'
                  }`}
                />
              </div>
            </div>

            {/* Save / Cancel Action Buttons (Visible when in Edit Mode) */}
            {isEditing && (
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2.5 rounded-2xl text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes ✓</span>
                </button>
              </div>
            )}

          </form>

        </div>

        {/* ================= SECURITY SETTINGS CARD ================= */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-5">
          
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#2d8a4e]" />
            <span>Security Settings</span>
          </h2>

          <div className="p-5 sm:p-6 bg-emerald-50/70 border border-emerald-100 rounded-3xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-white text-[#2d8a4e] border border-emerald-200 shrink-0 shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900">Password Reset</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  To reset your password, submit a request to OSAD. They will verify your identity and provide you with new credentials.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="px-5 py-2.5 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs transition shadow-md cursor-pointer"
              >
                Request Password Reset
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
                A password reset request ticket will be logged for <strong>{fullName}</strong> ({user.student_id}).
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
                  alert('Password Reset Ticket #OSAD-2026-8912 submitted successfully! Please check with OSAD.')
                }}
                className="px-5 py-2.5 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Confirm Request ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PROFILE PICTURE AVATAR MODAL */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150 font-sans">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">Change Profile Picture</h3>
              <p className="text-xs text-slate-500 font-medium">
                Enter a direct URL link for your profile picture avatar
              </p>
            </div>

            <form onSubmit={handleUpdateAvatar} className="space-y-4">
              <input
                type="url"
                required
                value={tempAvatarUrl}
                onChange={(e) => setTempAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#2d8a4e] transition"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Update Picture ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </MainLayout>
  )
}
