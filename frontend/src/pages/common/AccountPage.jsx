import React, { useState } from 'react'
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
  HelpCircle,
  Sparkles
} from 'lucide-react'
import { getCurrentUser } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import EditBasicInfoModal from '../personnel/modals/EditBasicInfoModal'

export default function AccountPage({ currentUser }) {
  const { activeRoleContext, switchRoleContext } = useAuth()
  
  const isPersonnelContext = activeRoleContext === 'personnel' || activeRoleContext === 'department_secretary' || activeRoleContext === 'program_coordinator' || activeRoleContext === 'faculty'

  const defaultUserData = isPersonnelContext
    ? {
        full_name: 'Dr. Maria Santos, Ph.D.',
        employee_id: 'EMP-2021-0842',
        student_id: 'EMP-2021-0842',
        designation: 'Associate Professor & Research Head',
        department: 'College of Information Technology',
        educational_attainment: 'Ph.D. in Computer Science',
        years_of_service: '8 Years',
        email: 'faculty@ndmu.edu.ph',
        phone: '+63 917 845 2910',
        location: 'Koronadal City, South Cotabato',
        user_type: 'personnel',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      }
    : {
        full_name: 'Maria Santos',
        student_id: '2024-01234',
        employee_id: '2024-01234',
        designation: 'Student Researcher',
        user_type: 'student',
        department: 'Department of Computer Studies',
        college: 'College of Information Technology Education (CITE)',
        program: 'BS Computer Science',
        educational_attainment: 'Undergraduate Candidate',
        email: 'student@ndmu.edu.ph',
        phone: '+63 912 345 6789',
        location: 'Koronadal City, South Cotabato',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      }

  const [user, setUser] = useState(() => {
    const curr = currentUser || getCurrentUser()
    if (curr) {
      return { ...defaultUserData, ...curr }
    }
    return defaultUserData
  })

  // Edit Mode Toggle State
  const [isEditing, setIsEditing] = useState(false)
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false)

  // Editable Form Inputs State
  const [fullName, setFullName] = useState(user.full_name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone)
  const [location, setLocation] = useState(user.location || 'Koronadal City, South Cotabato')
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

  const isStudent = user.user_type === 'student' && !isPersonnelContext

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
      location,
      avatar_url: avatarUrl
    }))
    setIsEditing(false)
    triggerToast('Account information updated successfully!')
  }

  const handleSaveFacultyProfileModal = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }))
    if (updatedData.full_name) setFullName(updatedData.full_name)
    if (updatedData.email) setEmail(updatedData.email)
    if (updatedData.contact_number || updatedData.phone) setPhone(updatedData.contact_number || updatedData.phone)
    if (updatedData.location) setLocation(updatedData.location)
    triggerToast('Faculty profile updated successfully!')
  }

  const handleCancelEdit = () => {
    setFullName(user.full_name)
    setEmail(user.email)
    setPhone(user.phone)
    setLocation(user.location || 'Koronadal City, South Cotabato')
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
    <>
      <div className="max-w-4xl mx-auto space-y-8 font-sans pb-12">
        
        {/* Toast Feedback */}
        {showSavedToast && (
          <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-[#2d8a4e] text-white text-xs font-bold shadow-xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
            <Check className="w-4 h-4 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ================= PROFILE AVATAR HEADER CARD ================= */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          
          <div className="flex items-center gap-5 sm:gap-6">
            <div className="relative shrink-0 group">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl border-2 border-emerald-600/30 p-1 bg-white overflow-hidden shadow-xs aspect-square">
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
                className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-[#2d8a4e] text-white hover:bg-[#236e3e] border-2 border-white transition shadow-sm cursor-pointer"
                title="Change Profile Picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="space-y-0.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{fullName}</h1>
                <p className="text-xs font-bold text-[#2d8a4e]">
                  {isStudent ? (user.program || 'BS Computer Science') : (user.designation || 'Associate Professor & Research Head')}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {user.department || 'College of Information Technology'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border bg-emerald-50 text-[#2d8a4e] border-emerald-200">
                  {isStudent ? '● Student Account' : '● NDMU Faculty Record'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-600 border-slate-200">
                  ID: {user.employee_id || user.student_id || 'EMP-2021-0842'}
                </span>
                {!isStudent && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-600 border-slate-200">
                    {user.years_of_service || '8+ Yrs Service'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Single Header Action */}
          <button
            type="button"
            onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-2xs cursor-pointer self-start sm:self-center ${
              isEditing 
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                : 'bg-[#2d8a4e] hover:bg-[#236e3e] active:scale-[0.99] text-white shadow-xs'
            }`}
          >
            {isEditing ? <X className="w-4 h-4 text-rose-600" /> : <Edit3 className="w-4 h-4" />}
            <span>{isEditing ? 'Cancel Editing' : 'Edit Account Settings'}</span>
          </button>
        </div>

        {/* ================= 2-COLUMN MAIN CONTENT GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: EDITABLE PERSONAL & CONTACT DETAILS (8 COLS) */}
          <div className="lg:col-span-8">
            <div id="account-info-form" className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-[#2d8a4e]" />
                  <span>Personal & Contact Information</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {isEditing ? 'Modify editable personal details below and click Save Changes' : 'Viewing account contact details (click Edit Account Settings to modify)'}
                </p>
              </div>

              <form onSubmit={handleSaveAccountInfo} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700">Full Name with Titles</label>
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
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold transition ${
                          isEditing 
                            ? 'bg-white border-[#2d8a4e] text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2d8a4e]/20'
                            : 'bg-slate-50/80 border-slate-200/80 text-slate-800 cursor-default'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Institutional Email</label>
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
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold transition ${
                          isEditing 
                            ? 'bg-white border-[#2d8a4e] text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2d8a4e]/20'
                            : 'bg-slate-50/80 border-slate-200/80 text-slate-800 cursor-default'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Contact Number</label>
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
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold transition ${
                          isEditing 
                            ? 'bg-white border-[#2d8a4e] text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2d8a4e]/20'
                            : 'bg-slate-50/80 border-slate-200/80 text-slate-800 cursor-default'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Location / Campus Address */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700">Location / Campus Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Koronadal City, South Cotabato"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold transition ${
                          isEditing 
                            ? 'bg-white border-[#2d8a4e] text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2d8a4e]/20'
                            : 'bg-slate-50/80 border-slate-200/80 text-slate-800 cursor-default'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Save / Cancel Action Buttons (Visible when in Edit Mode) */}
                {isEditing && (
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes ✓</span>
                    </button>
                  </div>
                )}
              </form>

            </div>
          </div>

          {/* RIGHT COLUMN: PROTECTED NDMU RECORDS & SECURITY (4 COLS) */}
          <div className="lg:col-span-4 space-y-6">

            {/* PROTECTED NDMU RECORDS CARD */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#2d8a4e]" />
                  <span>Institutional Records</span>
                </h3>
                <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-[#2d8a4e]" />
                  Protected
                </span>
              </div>

              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">{isStudent ? 'STUDENT ID NUMBER' : 'EMPLOYEE ID NUMBER'}</span>
                  <span className="text-xs font-bold text-slate-900 block mt-0.5">{user.employee_id || user.student_id || 'EMP-2021-0842'}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">{isStudent ? 'ACADEMIC STANDING' : 'ACADEMIC RANK / DESIGNATION'}</span>
                  <span className="text-xs font-bold text-slate-900 block mt-0.5">{user.designation || 'Associate Professor & Research Head'}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">DEPARTMENT / COLLEGE</span>
                  <span className="text-xs font-bold text-slate-900 block mt-0.5">{user.department || 'College of Information Technology'}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">EDUCATIONAL ATTAINMENT</span>
                  <span className="text-xs font-bold text-slate-900 block mt-0.5">{user.educational_attainment || 'Ph.D. in Computer Science'}</span>
                </div>
              </div>
            </div>

            {/* SECURITY & PASSWORD SETTINGS CARD */}
            {!['department_secretary', 'program_coordinator', 'organization_moderator'].includes(activeRoleContext) && (
              <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#2d8a4e]" />
                  <span>Security & Password</span>
                </h3>

                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Manage your account credentials and password security settings.
                </p>

                <div className="pt-1 space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsSelfServiceModalOpen(true)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] active:scale-[0.99] text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Change Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-[11px] border border-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Request Password Reset</span>
                  </button>
                </div>
              </div>
            )}

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

      {/* Shared Personnel Profile Modal */}
      {isFacultyModalOpen && (
        <EditBasicInfoModal
          isOpen={isFacultyModalOpen}
          onClose={() => setIsFacultyModalOpen(false)}
          currentInfo={user}
          onSave={handleSaveFacultyProfileModal}
        />
      )}

    </>
  )
}
