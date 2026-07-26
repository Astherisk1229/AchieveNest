import React, { useState } from 'react'
import { 
  X, 
  Award, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Building, 
  Globe, 
  Calendar,
  Sparkles
} from 'lucide-react'

export default function PersonnelSubmissionModal({ isOpen, onClose, onSubmitAccomplishment }) {
  // Wizard Step Control (1, 2, 3)
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1 Form Data
  const [title, setTitle] = useState('')
  const [issuingEntity, setIssuingEntity] = useState('')
  const [academicYear, setAcademicYear] = useState('AY 2025-2026')
  const [dateAchieved, setDateAchieved] = useState(new Date().toISOString().split('T')[0])

  // Step 2 Form Data (Category & Scope Classification)
  const [category, setCategory] = useState('Research & Publications')
  const [scopeLevel, setScopeLevel] = useState('International / Scopus / WoS')
  const [impactLevel, setImpactLevel] = useState('Lead Author / Principal Investigator')

  // Step 3 Form Data
  const [description, setDescription] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)

  // System States
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  // Step 1 Validation & Next
  const handleStep1Next = (e) => {
    e.preventDefault()
    setError('')

    if (!title.trim() || title.trim().length < 5) {
      setError('Accomplishment Title is required (minimum 5 characters).')
      return
    }
    if (!issuingEntity.trim()) {
      setError('Issuing Entity / Institution / Journal is required.')
      return
    }

    setCurrentStep(2)
  }

  // Step 2 Validation & Next
  const handleStep2Next = (e) => {
    e.preventDefault()
    setError('')

    if (!category || !scopeLevel || !academicYear || !dateAchieved) {
      setError('Please complete all category, scope, and date fields.')
      return
    }

    setCurrentStep(3)
  }

  // File Upload Handler
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

  // Final Step 3 Submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!attachedFile) {
      setError('Supporting Proof Document attachment (PDF/JPG/PNG) is required.')
      return
    }

    try {
      setIsSubmitting(true)
      await new Promise(resolve => setTimeout(resolve, 600))

      const formattedDate = new Date(dateAchieved).toLocaleDateString('en-US', { 
        month: 'short', 
        day: '2-digit', 
        year: 'numeric' 
      })

      const newEntry = {
        id: Date.now(),
        title: title.trim(),
        category,
        academic_year: academicYear,
        scope_level: scopeLevel,
        impact_level: impactLevel,
        date: formattedDate,
        status: 'Pending',
        statusLabel: 'Pending Review',
        issuer: issuingEntity.trim(),
        description: description.trim(),
        attached_file_name: attachedFile ? attachedFile.name : 'faculty_proof_document.pdf',
        icon: FileText
      }

      onSubmitAccomplishment(newEntry)

      // Reset form & step
      setCurrentStep(1)
      setTitle('')
      setIssuingEntity('')
      setDescription('')
      setAttachedFile(null)
      onClose()
    } catch (err) {
      setError('Failed to submit personnel accomplishment entry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={() => { setCurrentStep(1); setError(''); onClose(); }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-4 shrink-0">
          <div className="p-3 rounded-2xl bg-[#eef7f0] border border-[#cbe6d2] text-[#2d8a4e] shadow-2xs">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Submit Personnel Accomplishment</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {currentStep === 1 && 'Step 1 of 3: Basic Accomplishment Details'}
              {currentStep === 2 && 'Step 2 of 3: Category & Institutional Scope'}
              {currentStep === 3 && 'Step 3 of 3: Proof Attachment & Summary'}
            </p>
          </div>
        </div>

        {/* Wizard Step Badges Bar */}
        <div className="grid grid-cols-3 gap-2 mb-4 shrink-0">
          <div className={`py-1.5 px-3 rounded-xl text-center text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            currentStep === 1 
              ? 'bg-[#2d8a4e] text-white shadow-xs' 
              : currentStep > 1 
              ? 'bg-[#eef7f0] text-[#1e5831] border border-[#cbe6d2]' 
              : 'bg-slate-100 text-slate-400'
          }`}>
            {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : <span>1</span>}
            <span>Basic Info</span>
          </div>

          <div className={`py-1.5 px-3 rounded-xl text-center text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            currentStep === 2 
              ? 'bg-[#2d8a4e] text-white shadow-xs' 
              : currentStep > 2 
              ? 'bg-[#eef7f0] text-[#1e5831] border border-[#cbe6d2]' 
              : 'bg-slate-100 text-slate-400'
          }`}>
            {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : <span>2</span>}
            <span>Category & Scope</span>
          </div>

          <div className={`py-1.5 px-3 rounded-xl text-center text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            currentStep === 3 
              ? 'bg-[#2d8a4e] text-white shadow-xs' 
              : 'bg-slate-100 text-slate-400'
          }`}>
            <span>3</span>
            <span>Proof & Summary</span>
          </div>
        </div>

        {/* Error Alert Message */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 shrink-0 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Form Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          
          {/* ================= STEP 1: BASIC ACCOMPLISHMENT DETAILS ================= */}
          {currentStep === 1 && (
            <form id="wizard-step-1" onSubmit={handleStep1Next} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Accomplishment / Publication Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Machine Learning Frameworks in Higher Education Analytics"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 outline-none text-xs text-slate-800 transition font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Issuing Entity / Journal / Conference / Institution *
                </label>
                <input
                  type="text"
                  value={issuingEntity}
                  onChange={(e) => setIssuingEntity(e.target.value)}
                  placeholder="e.g. IEEE Access Journal / CHED Region XII / DOST"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 outline-none text-xs text-slate-800 transition font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Academic Year *
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-[#2d8a4e] outline-none transition"
                  >
                    <option value="AY 2025-2026">AY 2025-2026</option>
                    <option value="AY 2024-2025">AY 2024-2025</option>
                    <option value="AY 2023-2024">AY 2023-2024</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date Achieved / Published *
                  </label>
                  <input
                    type="date"
                    value={dateAchieved}
                    onChange={(e) => setDateAchieved(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-[#2d8a4e] outline-none transition"
                    required
                  />
                </div>
              </div>

            </form>
          )}

          {/* ================= STEP 2: CATEGORY & SCOPE CLASSIFICATION ================= */}
          {currentStep === 2 && (
            <form id="wizard-step-2" onSubmit={handleStep2Next} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-[#2d8a4e] outline-none transition"
                  >
                    <option value="Research & Publications">Research & Publications</option>
                    <option value="Seminars & Workshops">Seminars & Workshops</option>
                    <option value="Extension Services">Extension Services</option>
                    <option value="Institutional Awards">Institutional Awards</option>
                    <option value="Certifications & Licenses">Certifications & Licenses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Academic / Geographic Scope *
                  </label>
                  <select
                    value={scopeLevel}
                    onChange={(e) => setScopeLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-[#2d8a4e] outline-none transition"
                  >
                    <option value="International / Scopus / WoS">International / Scopus / WoS</option>
                    <option value="National / CHED Recognized">National / CHED Recognized</option>
                    <option value="Regional (Region XII)">Regional (Region XII)</option>
                    <option value="Institutional / Campus-Wide">Institutional / Campus-Wide</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Impact & Role Conferred *
                </label>
                <select
                  value={impactLevel}
                  onChange={(e) => setImpactLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-[#2d8a4e] outline-none transition"
                >
                  <option value="Lead Author / Principal Investigator">Lead Author / Principal Investigator</option>
                  <option value="Co-Author / Co-Investigator">Co-Author / Co-Investigator</option>
                  <option value="Keynote Speaker / Resource Person">Keynote Speaker / Resource Person</option>
                  <option value="Participant / Recipient">Participant / Recipient</option>
                </select>
              </div>

              {/* Institutional Endorsement Notice */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                <div className="flex items-center gap-1.5 text-[#1e5831] font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-[#2d8a4e]" />
                  <span>Faculty Accreditation Notice</span>
                </div>
                <p className="text-[11px] text-emerald-900/80 leading-relaxed font-medium">
                  Submitted personnel accomplishments will be reviewed by your Department Secretary and endorsed to HR for accreditation points.
                </p>
              </div>

            </form>
          )}

          {/* ================= STEP 3: PROOF ATTACHMENT & SUMMARY ================= */}
          {currentStep === 3 && (
            <form id="wizard-step-3" onSubmit={handleSubmit} className="space-y-4">
              
              {/* Supporting Evidence File Upload Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Attach Official Supporting Document Proof * (PDF, JPG, PNG - Max 10MB)
                </label>
                
                <div className="relative border-2 border-dashed border-slate-200 hover:border-[#2d8a4e] rounded-2xl p-4 text-center transition bg-slate-50/50 hover:bg-emerald-50/30 group">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <div className="p-2.5 rounded-xl bg-white text-[#2d8a4e] border border-slate-200 group-hover:border-emerald-300 shadow-2xs transition">
                      <UploadCloud className="w-6 h-6" />
                    </div>

                    {attachedFile ? (
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-[#2d8a4e]" />
                          <span>{attachedFile.name}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {(attachedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace file
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800">
                          Click or drag certificate PDF, scanned memo, or photo proof here
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Supported file types: PDF, JPG, PNG (Max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description / Abstract */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Executive Summary / Abstract / Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Provide a brief summary of the research article, extension project, or seminar objective..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 outline-none text-xs text-slate-800 transition resize-none font-medium"
                />
              </div>

              {/* Submission Overview Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-medium">
                <p className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Summary Review:</span>
                  <span className="text-[#2d8a4e] font-extrabold">{category}</span>
                </p>
                <p className="text-slate-600 truncate">• {title || 'Untitled Accomplishment'}</p>
                <p className="text-slate-500">• {scopeLevel} • {academicYear}</p>
              </div>

            </form>
          )}

        </div>

        {/* Modal Action Controls Footer */}
        <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between shrink-0">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setCurrentStep(1); setError(''); onClose(); }}
              className="px-4 py-2.5 rounded-2xl text-slate-500 hover:text-slate-800 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="submit"
              form={`wizard-step-${currentStep}`}
              className="px-5 py-2.5 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs flex items-center gap-1 shadow-md transition cursor-pointer"
            >
              <span>Next: {currentStep === 1 ? 'Category & Scope' : 'Proof & Summary'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              form="wizard-step-3"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit Accomplishment ✓</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
