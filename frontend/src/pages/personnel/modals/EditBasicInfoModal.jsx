import React, { useState, useEffect } from 'react'
import { X, UserCheck, Briefcase, GraduationCap, Building2, Phone, Mail, MapPin, AlignLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import ProfilePhotoUploader from '../../../components/common/ProfilePhotoUploader'

export default function EditBasicInfoModal({ isOpen, onClose, currentInfo, user, onSave }) {
  const profileData = currentInfo || user || {}
  const [formData, setFormData] = useState({
    full_name: '',
    employee_id: '',
    designation: '',
    educational_attainment: '',
    contact_number: '',
    email: '',
    location: '',
    about_me: '',
    specialization: '',
    years_of_service: '',
    avatar_url: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profileData) {
      setFormData({
        full_name: profileData.full_name || '',
        employee_id: profileData.employee_id || '',
        designation: profileData.designation || '',
        educational_attainment: profileData.educational_attainment || '',
        contact_number: profileData.contact_number || profileData.phone || '',
        email: profileData.email || '',
        location: profileData.location || '',
        about_me: profileData.about_me || '',
        specialization: profileData.specialization || '',
        years_of_service: profileData.years_of_service || '',
        avatar_url: profileData.avatar_url || ''
      })
    }
  }, [profileData.employee_id, profileData.full_name, profileData.avatar_url, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoUpdated = (newUrl) => {
    setFormData(prev => ({ ...prev, avatar_url: newUrl }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.full_name.trim() || !formData.designation.trim()) {
      setError('Please fill in all mandatory fields (Name and Designation).')
      return
    }

    try {
      setIsSubmitting(true)
      await new Promise(resolve => setTimeout(resolve, 300))
      if (onSave) {
        onSave(formData)
      }
      onClose()
    } catch (err) {
      setError('Failed to update basic information. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="p-3 rounded-2xl bg-[#E7F3E9] dark:bg-emerald-950/60 border border-[#cbe6d2] dark:border-emerald-800 text-[#16834a] dark:text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Edit Personnel Profile</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Update academic credentials, profile photo, biography, and contact info</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
          
          {/* Profile Photo Upload Section */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
            <ProfilePhotoUploader
              currentAvatarUrl={formData.avatar_url}
              fullName={formData.full_name || 'Personnel'}
              size="sm"
              onPhotoUpdated={handlePhotoUpdated}
            />
            <div className="text-center sm:text-left space-y-0.5">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white block">Profile Picture</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Upload a professional JPG, PNG, or WebP photo (Max 5 MB).</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name with Titles *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="e.g. Dr. Maria L. Santos, Ph.D."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-[#16834a]"
              />
            </div>

            {/* Designation / Academic Rank */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Designation / Position *
              </label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="e.g. Associate Professor IV"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-[#16834a]"
              />
            </div>

            {/* Employee ID (Read-only) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                name="employee_id"
                value={formData.employee_id}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-mono font-bold cursor-not-allowed"
              />
            </div>

            {/* Educational Attainment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Highest Educational Degree
              </label>
              <input
                type="text"
                name="educational_attainment"
                value={formData.educational_attainment}
                onChange={handleChange}
                placeholder="e.g. Doctor of Information Technology"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-[#16834a]"
              />
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                placeholder="+63 9XX XXX XXXX"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-[#16834a]"
              />
            </div>

            {/* Institutional Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Institutional Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="faculty@ndmu.edu.ph"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-[#16834a]"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Campus Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Koronadal City, South Cotabato"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-[#16834a]"
              />
            </div>

            {/* Years of Service */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Years of Service
              </label>
              <input
                type="text"
                name="years_of_service"
                value={formData.years_of_service}
                onChange={handleChange}
                placeholder="e.g. 8 Years Service"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-[#16834a]"
              />
            </div>
          </div>

          {/* About Me / Professional Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Professional Biography & Summary
            </label>
            <textarea
              name="about_me"
              value={formData.about_me}
              onChange={handleChange}
              rows={3}
              placeholder="Write a brief professional summary about your teaching, research, and institutional background..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-[#16834a] resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#16834a] hover:bg-[#11693b] text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
