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
  Camera, 
  Send, 
  Edit3, 
  X,
  Building2,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  HelpCircle
} from 'lucide-react'
import { getCurrentUser } from '../services/authService'

export default function AccountPage({ currentUser }) {
  const [user, setUser] = useState(currentUser || getCurrentUser() || {
    full_name: 'Maria Santos',
    student_id: '2024-01234',
    user_type: 'student',
    department: 'Department of Computer Studies',
    college: 'College of Information Technology Education (CITE)',
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
  const [toastMessage, setToastMessage] = useState('Account information updated successfully!')
  const [showResetModal, setShowResetModal] = useState(false)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [tempAvatarUrl, setTempAvatarUrl] = useState(user.avatar_url)

  // Phase 3.5.1 Self-Service Password Change Modal State
  const [isSelfServiceModalOpen, setIsSelfServiceModalOpen] = useState(false)
  const [passwordStep, setPasswordStep] = useState(1) // 1: Current, 2: New, 3: Success
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const isStudent = user.user_type === 'student'

  const triggerToast = (msg) => {
    setToastMessage(msg)
    setShowSavedToast(true)
    setTimeout(() => setShowSavedToast(false), 3000)
  }

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
    triggerToast('Account information updated successfully!')
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
    triggerToast('Profile avatar updated successfully!')
  }

  // Password Strength & Match Calculators
  const hasMinLength = newPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(newPassword)
  const hasSpecialOrNum = /[0-9!@#$%^&*()]/.test(newPassword)
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword

  const getPasswordStrength = () => {
    let score = 0
    if (hasMinLength) score++
    if (hasUppercase) score++
    if (hasSpecialOrNum) score++
    return score
  }

  const strengthScore = getPasswordStrength()

  const handleVerifyCurrentPassword = (e) => {
    e.preventDefault()
    if (!currentPassword.trim()) {
      setPasswordError('Please enter your current password to proceed')
      return
    }
    setPasswordError('')
    setPasswordStep(2)
  }

  const handleUpdatePasswordSubmit = (e) => {
    e.preventDefault()
    if (!hasMinLength || !passwordsMatch) {
      setPasswordError('Please meet all password requirements before saving')
      return
    }
    setPasswordError('')
    setPasswordStep(3)
    triggerToast('Password updated successfully!')
  }

  const handleCloseSelfServiceModal = () => {
    setIsSelfServiceModalOpen(false)
    setPasswordStep(1)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
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

        {/* ================= PROFILE AVATAR HEADER CARD ================= */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-[#2d8a4e] p-1 bg-white overflow-hidden shadow-md aspect-square">
                <img
                  src={avatarUrl}
                  alt={fullName}
                  width="96"
                  height="96"
                  className="w-full h-full object-cover rounded-xl aspect-square"
                  decoding="async"
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
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{fullName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border bg-emerald-50 text-[#2d8a4e] border-emerald-200">
                  ● Student Record
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500">
                {isStudent ? 'Student Account' : 'Faculty / Personnel Account'} • {user.department || 'Department of Computer Studies'} • {user.program}
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
        <div id="account-info-form" className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-6">
          
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

            {/* Department / College (READ ONLY / PROTECTED ALWAYS) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Academic Department & College</span>
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#2d8a4e]" />
                  Protected Registrar Record
                </span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={user.department || 'Department of Computer Studies (College of Information Technology Education)'}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs font-bold text-slate-700 cursor-not-allowed select-none"
                />
              </div>
            </div>

            {/* Degree Program (READ ONLY / PROTECTED ALWAYS - Program is under Department) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Degree Program</span>
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#2d8a4e]" />
                  Protected Registrar Record
                </span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={user.program || 'BS Computer Science'}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs font-bold text-slate-700 cursor-not-allowed select-none"
                />
              </div>
              <p className="text-[11px] font-medium text-slate-400 pl-1">
                Program is governed under {user.department || 'Department of Computer Studies'}
              </p>
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

        {/* ================= SECURITY SETTINGS CARD (DUAL PASSWORD RESET SUITE - PHASE 3.5.1) ================= */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-5">
          
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#2d8a4e]" />
            <span>Security & Credential Settings</span>
          </h2>

          <div className="p-5 sm:p-6 bg-emerald-50/70 border border-emerald-100 rounded-3xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-white text-[#2d8a4e] border border-emerald-200 shrink-0 shadow-xs">
                <KeyRound className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900">Password Management</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Update your password instantly using our 3-step self-service wizard, or request OSAD helpdesk assistance if you forgot your credentials.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {/* Primary Action: Direct Instant Self-Service Change */}
              <button
                type="button"
                onClick={() => setIsSelfServiceModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs flex items-center gap-2 transition shadow-md cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Change Password (Instant)</span>
              </button>

              {/* Secondary Fallback Action: OSAD Reset Ticket Request */}
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <span>Forgot Password? Request OSAD Reset</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ================= INSTANT 3-STEP SELF-SERVICE PASSWORD MODAL (PHASE 3.5.1) ================= */}
      {isSelfServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150 font-sans">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            
            {/* Modal Header & Step Indicator */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Change Password</h3>
                  <p className="text-[11px] font-bold text-[#2d8a4e]">Step {passwordStep} of 3</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseSelfServiceModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Callout */}
            {passwordError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                <X className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* STEP 1: CURRENT PASSWORD VERIFICATION */}
            {passwordStep === 1 && (
              <form onSubmit={handleVerifyCurrentPassword} className="space-y-5 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-900">Verify Current Password</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Please enter your existing password to confirm your identity before setting a new password.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">Current Password *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#2d8a4e] outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseSelfServiceModal}
                    className="px-4 py-2.5 rounded-2xl text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                  >
                    <span>Verify & Proceed</span>
                    <span>→</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: NEW PASSWORD CREATION & STRENGTH METER */}
            {passwordStep === 2 && (
              <form onSubmit={handleUpdatePasswordSubmit} className="space-y-5 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-900">Create New Password</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Set a strong new password meeting NDMU security guidelines.
                  </p>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">New Password *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#2d8a4e] outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">Confirm New Password *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#2d8a4e] outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Real-time Strength Meter & Criteria Checklist */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Password Strength:</span>
                    <span className={`font-extrabold ${
                      strengthScore === 3 ? 'text-[#2d8a4e]' : strengthScore === 2 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {strengthScore === 3 ? 'Strong ✓' : strengthScore === 2 ? 'Medium' : 'Weak'}
                    </span>
                  </div>

                  {/* Strength Bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strengthScore === 3 ? 'bg-[#2d8a4e] w-full' : strengthScore === 2 ? 'bg-amber-500 w-2/3' : 'bg-rose-500 w-1/3'
                      }`}
                    />
                  </div>

                  {/* Criteria Checklist */}
                  <div className="space-y-1.5 pt-1 text-[11px] font-semibold text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className={hasMinLength ? 'text-[#2d8a4e] font-extrabold' : 'text-slate-400'}>
                        {hasMinLength ? '✓' : '○'} At least 8 characters long
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={hasUppercase ? 'text-[#2d8a4e] font-extrabold' : 'text-slate-400'}>
                        {hasUppercase ? '✓' : '○'} Includes an uppercase letter (A-Z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={hasSpecialOrNum ? 'text-[#2d8a4e] font-extrabold' : 'text-slate-400'}>
                        {hasSpecialOrNum ? '✓' : '○'} Includes a number or special symbol
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-0.5 border-t border-slate-200/60">
                      <span className={passwordsMatch ? 'text-[#2d8a4e] font-extrabold' : 'text-rose-600 font-bold'}>
                        {passwordsMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPasswordStep(1)}
                    className="px-4 py-2.5 rounded-2xl text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                  >
                    Update Password ✓
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS & SECURITY AUDIT CONFIRMATION */}
            {passwordStep === 3 && (
              <div className="space-y-6 text-center py-2 animate-in fade-in duration-150">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#2d8a4e] border border-emerald-200 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-lg font-extrabold text-slate-900">Password Updated Successfully!</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-sm mx-auto">
                    Your AchieveNest student account password has been updated. A security notification was dispatched to <strong>{user.email}</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900 font-semibold space-y-1">
                  <p className="font-bold flex items-center justify-center gap-1.5 text-[#1e5831]">
                    <ShieldCheck className="w-4 h-4 text-[#2d8a4e]" /> Account Security Audit Verified
                  </p>
                  <p className="text-[11px] text-emerald-800">Your active session remains authenticated.</p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCloseSelfServiceModal}
                    className="w-full py-3 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                  >
                    Done ✓
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* OSAD PASSWORD RESET MODAL (FALLBACK HELPDESK TICKET) */}
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
                  triggerToast('Password Reset Ticket #OSAD-2026-8912 submitted successfully! OSAD staff notified.')
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
