import React, { useState, useEffect } from 'react'
import { X, UserCheck, Briefcase, GraduationCap, Building2, Phone, Mail, MapPin, AlignLeft, CheckCircle2, AlertCircle } from 'lucide-react'

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
    years_of_service: ''
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
        contact_number: profileData.contact_number || '',
        email: profileData.email || '',
        location: profileData.location || '',
        about_me: profileData.about_me || '',
        specialization: profileData.specialization || '',
        years_of_service: profileData.years_of_service || ''
      })
    }
  }, [profileData.employee_id, profileData.full_name, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
      await new Promise(resolve => setTimeout(resolve, 500))
      onSave(formData)
      onClose()
    } catch (err) {
      setError('Failed to update basic information. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="p-3 rounded-2xl bg-[#E7F3E9] border border-[#cbe6d2] text-[#16834a]">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Edit Personnel Profile</h3>
            <p className="text-xs text-slate-500">Update academic credentials, biography, location, and contact info</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name with Titles *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="e.g. Dr. Maria L. Santos, Ph.D."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20 outline-none text-xs text-slate-800 transition"
                required
              />
            </div>

            {/* Employee ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Employee ID Number
              </label>
              <input
                type="text"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                placeholder="e.g. EMP-2021-0842"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20 outline-none text-xs text-slate-800 transition bg-slate-50"
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Designation / Academic Rank */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Designation / Academic Rank *
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="e.g. Associate Professor & Research Head"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20 outline-none text-xs text-slate-800 transition"
                  required
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Institutional affiliation is managed by HR.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Educational Attainment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Highest Educational Attainment
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  name="educational_attainment"
                  value={formData.educational_attainment}
                  onChange={handleChange}
                  placeholder="e.g. Ph.D. in Computer Science"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20 outline-none text-xs text-slate-800 transition"
                />
              </div>
            </div>

            {/* Years of Service */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Years of Institutional Service
              </label>
              <input
                type="text"
                name="years_of_service"
                value={formData.years_of_service}
                onChange={handleChange}
                placeholder="e.g. 8 Years"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20 outline-none text-xs text-slate-800 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Contact Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  placeholder="e.g. +63 917 123 4567"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20 outline-none text-xs text-slate-800 transition"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. maria.santos@ndmu.edu.ph"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20 outline-none text-xs text-slate-800 transition"
                />
              </div>
            </div>
          </div>

          {/* Location / Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Location / Campus Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Koronadal City, South Cotabato"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20 outline-none text-xs text-slate-800 transition"
              />
            </div>
          </div>

          {/* About Me / Professional Biography */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>About Me / Professional Biography</span>
            </label>
            <textarea
              name="about_me"
              value={formData.about_me}
              onChange={handleChange}
              rows={3}
              placeholder="Provide a brief professional biography and introduction..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20 outline-none text-xs text-slate-800 transition resize-none"
            />
          </div>

          {/* Specialization */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Research Focus & Professional Specialization
            </label>
            <textarea
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              rows={2}
              placeholder="e.g. Artificial Intelligence, Data Science, Educational Technology..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20 outline-none text-xs text-slate-800 transition resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white text-xs font-bold shadow-md flex items-center gap-2 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saving Changes...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
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
