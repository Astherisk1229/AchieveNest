import React, { useState } from 'react'
import { X, Award, Upload, CheckCircle2, AlertCircle, FileText, Calendar, Building } from 'lucide-react'

export default function PersonnelSubmissionModal({ isOpen, onClose, onSubmitAccomplishment }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Research & Publications')
  const [academicYear, setAcademicYear] = useState('AY 2025-2026')
  const [issuingEntity, setIssuingEntity] = useState('')
  const [dateAchieved, setDateAchieved] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds maximum limit of 10MB.')
        return
      }
      setError('')
      setAttachedFile(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Please enter the accomplishment title.')
      return
    }

    if (!issuingEntity.trim()) {
      setError('Please specify the issuing institution, journal, or organization.')
      return
    }

    try {
      setIsSubmitting(true)
      await new Promise(resolve => setTimeout(resolve, 600))

      const newEntry = {
        id: Date.now(),
        title: title.trim(),
        category,
        academic_year: academicYear,
        date: new Date(dateAchieved).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        status: 'Pending',
        issuer: issuingEntity.trim(),
        description: description.trim(),
        attached_file_name: attachedFile ? attachedFile.name : 'supporting_proof.pdf',
        icon: FileText
      }

      onSubmitAccomplishment(newEntry)

      // Reset form
      setTitle('')
      setIssuingEntity('')
      setDescription('')
      setAttachedFile(null)
      onClose()
    } catch (err) {
      setError('Failed to submit accomplishment entry.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        
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
          <div className="p-3 rounded-2xl bg-[#eef7f0] border border-[#cbe6d2] text-[#2d8a4e]">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Submit Personnel Accomplishment</h3>
            <p className="text-xs text-slate-500">Record research, seminar, extension, or honor for endorsement</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
          
          {/* Accomplishment Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Accomplishment Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. International Journal Publication in IEEE Access"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 outline-none text-xs text-slate-800 transition"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 outline-none text-xs text-slate-800 transition bg-white"
              >
                <option value="Research & Publications">Research & Publications</option>
                <option value="Seminars & Workshops">Seminars & Workshops</option>
                <option value="Extension Services">Extension Services</option>
                <option value="Institutional Awards">Institutional Awards</option>
                <option value="Certifications & Licenses">Certifications & Licenses</option>
              </select>
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Academic Year *
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 outline-none text-xs text-slate-800 transition bg-white"
              >
                <option value="AY 2025-2026">AY 2025-2026</option>
                <option value="AY 2024-2025">AY 2024-2025</option>
                <option value="AY 2023-2024">AY 2023-2024</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Issuing Entity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Issuing Institution / Publisher *
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={issuingEntity}
                  onChange={(e) => setIssuingEntity(e.target.value)}
                  placeholder="e.g. IEEE / CHED / NDMU"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 outline-none text-xs text-slate-800 transition"
                  required
                />
              </div>
            </div>

            {/* Date Completed */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date Completed *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  value={dateAchieved}
                  onChange={(e) => setDateAchieved(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 outline-none text-xs text-slate-800 transition"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Details & Abstract Summary
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of research methodology, workshop scope, or community impact..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 outline-none text-xs text-slate-800 transition resize-none"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Attach Supporting Evidence Proof (PDF / Image)
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-[#2d8a4e] rounded-2xl p-4 text-center transition bg-slate-50/50 hover:bg-[#eef7f0]/30 cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-6 h-6 text-[#2d8a4e] mx-auto mb-1" />
              {attachedFile ? (
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#2d8a4e]">
                  <FileText className="w-4 h-4" />
                  <span>{attachedFile.name} ({(attachedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold text-slate-700">Click to upload document proof</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG (Max 10MB)</p>
                </>
              )}
            </div>
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
              className="px-5 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-bold shadow-md flex items-center gap-2 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Accomplishment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
