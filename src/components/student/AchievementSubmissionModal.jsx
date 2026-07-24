import React, { useState } from 'react'
import { X, Award, Upload, CheckCircle2, AlertCircle, FileText } from 'lucide-react'

export default function AchievementSubmissionModal({ isOpen, onClose, onSubmitAchievement }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Academic')
  const [dateAchieved, setDateAchieved] = useState(new Date().toISOString().split('T')[0])
  const [issuer, setIssuer] = useState('')
  const [description, setDescription] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size exceeds maximum limit of 5MB.')
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
      setError('Please provide the achievement title.')
      return
    }

    if (!issuer.trim()) {
      setError('Please specify the issuing organization or entity.')
      return
    }

    try {
      setIsSubmitting(true)
      await new Promise(resolve => setTimeout(resolve, 600))

      const newEntry = {
        id: Date.now(),
        title: title.trim(),
        category,
        date: new Date(dateAchieved).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        status: 'Pending',
        issuer: issuer.trim(),
        description: description.trim(),
        attached_file_name: attachedFile ? attachedFile.name : 'certificate_attachment.pdf'
      }

      onSubmitAchievement(newEntry)

      // Reset form
      setTitle('')
      setIssuer('')
      setDescription('')
      setAttachedFile(null)
      onClose()
    } catch (err) {
      setError('Failed to submit achievement entry.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button
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
            <h3 className="text-xl font-extrabold text-slate-900">Submit New Achievement</h3>
            <p className="text-xs text-slate-500">Record accomplishment for verification & portfolio recognition</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Award / Achievement Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dean's Lister - First Semester AY 2025-2026"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#2d8a4e] focus:ring-1 focus:ring-[#2d8a4e] transition"
              required
            />
          </div>

          {/* Category & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#2d8a4e] focus:ring-1 focus:ring-[#2d8a4e] transition bg-white"
              >
                <option value="Academic">Academic</option>
                <option value="Leadership">Leadership</option>
                <option value="Community">Community Extension</option>
                <option value="Sports">Sports & Athletics</option>
                <option value="Arts & Culture">Arts & Culture</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date Conferred *
              </label>
              <input
                type="date"
                value={dateAchieved}
                onChange={(e) => setDateAchieved(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#2d8a4e] focus:ring-1 focus:ring-[#2d8a4e] transition bg-white"
                required
              />
            </div>
          </div>

          {/* Issuing Entity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Issuing Body / Organization *
            </label>
            <input
              type="text"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="e.g. NDMU College of Information Technology Education"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#2d8a4e] focus:ring-1 focus:ring-[#2d8a4e] transition"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Narrative Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief details about the accomplishment or criteria met..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#2d8a4e] focus:ring-1 focus:ring-[#2d8a4e] transition resize-none"
            ></textarea>
          </div>

          {/* File Attachment Uploader */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Supporting Evidence Document (PDF/JPG/PNG)
            </label>
            <div className="relative border-2 border-dashed border-slate-200 hover:border-[#2d8a4e] rounded-2xl p-4 text-center bg-slate-50 transition cursor-pointer">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                <Upload className="w-5 h-5 text-slate-400" />
                {attachedFile ? (
                  <p className="text-xs font-bold text-[#2d8a4e] flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {attachedFile.name}
                  </p>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-slate-700">Click or drag certificate attachment here</p>
                    <p className="text-[10px] text-slate-400">PDF, JPG, PNG up to 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-1/2 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Entry</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
