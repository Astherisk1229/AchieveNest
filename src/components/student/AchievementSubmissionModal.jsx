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
  Globe,
  Sparkles,
  Calendar
} from 'lucide-react'

export default function AchievementSubmissionModal({ isOpen, onClose, onSubmitAchievement }) {
  // Wizard Step Control (1, 2, 3)
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1 Form Data
  const [title, setTitle] = useState('')
  const [eventName, setEventName] = useState('')
  const [issuerOrganization, setIssuerOrganization] = useState('')

  // Step 2 Form Data (TOPSIS Weighting Fields)
  const [categoryId, setCategoryId] = useState('Academic')
  const [scopeLevel, setScopeLevel] = useState('Institutional / Campus-Wide')
  const [rankConferred, setRankConferred] = useState("Dean's Lister")
  const [academicYear, setAcademicYear] = useState('AY 2025-2026')
  const [semester, setSemester] = useState('1st Semester')
  const [dateAchieved, setDateAchieved] = useState(new Date().toISOString().split('T')[0])

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
      setError('Award / Achievement Title is required (minimum 5 characters).')
      return
    }
    if (!eventName.trim() || eventName.trim().length < 3) {
      setError('Event / Competition Name is required (minimum 3 characters).')
      return
    }
    if (!issuerOrganization.trim()) {
      setError('Issuing Body / Organization is required.')
      return
    }

    setCurrentStep(2)
  }

  // Step 2 Validation & Next
  const handleStep2Next = (e) => {
    e.preventDefault()
    setError('')

    if (!categoryId || !scopeLevel || !rankConferred || !academicYear || !semester || !dateAchieved) {
      setError('Please complete all classification, scope, and date fields.')
      return
    }

    setCurrentStep(3)
  }

  // File Upload Handler
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

  // Final Step 3 Submission
  const handleFinalSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!attachedFile) {
      setError('Supporting Evidence Document attachment (PDF/JPG/PNG) is required.')
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
        event_name: eventName.trim(),
        issuer: issuerOrganization.trim(),
        category: categoryId,
        scope_level: scopeLevel,
        rank_conferred: rankConferred,
        academic_year: academicYear,
        semester,
        date: formattedDate,
        status: 'Pending Review',
        location: issuerOrganization.trim(),
        description: description.trim(),
        attached_file_name: attachedFile ? attachedFile.name : 'certificate_proof.pdf'
      }

      onSubmitAchievement(newEntry)

      // Reset Form & Step
      setCurrentStep(1)
      setTitle('')
      setEventName('')
      setIssuerOrganization('')
      setDescription('')
      setAttachedFile(null)
      onClose()
    } catch (err) {
      setError('Failed to submit achievement entry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={() => { setCurrentStep(1); setError(''); onClose() }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-4 shrink-0">
          <div className="p-3 rounded-2xl bg-[#eef7f0] border border-[#cbe6d2] text-[#2d8a4e] shadow-2xs">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Submit New Achievement</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {currentStep === 1 && 'Step 1 of 3: Basic Details'}
              {currentStep === 2 && 'Step 2 of 3: Scope & Rank Weighting'}
              {currentStep === 3 && 'Step 3 of 3: Proof & Summary'}
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
            <span>Scope & Rank</span>
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
          
          {/* ================= STEP 1: BASIC ACHIEVEMENT DETAILS ================= */}
          {currentStep === 1 && (
            <form id="wizard-step-1" onSubmit={handleStep1Next} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Award / Achievement Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Dean's Lister - First Semester AY 2025-2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 outline-none text-xs text-slate-800 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event / Competition Name *
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. 12th SOCCSKSARGEN IT Summit / NDMU Intramurals 2025"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 outline-none text-xs text-slate-800 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Issuing Body / Organization *
                </label>
                <input
                  type="text"
                  value={issuerOrganization}
                  onChange={(e) => setIssuerOrganization(e.target.value)}
                  placeholder="e.g. NDMU CITE / DOST Region XII"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 outline-none text-xs text-slate-800 transition"
                  required
                />
              </div>

            </form>
          )}

          {/* ================= STEP 2: CLASSIFICATION, SCOPE & RANK ================= */}
          {currentStep === 2 && (
            <form id="wizard-step-2" onSubmit={handleStep2Next} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-[#2d8a4e] outline-none transition"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Leadership">Leadership</option>
                    <option value="Athletics">Athletics</option>
                    <option value="Volunteerism & Community">Volunteerism & Community</option>
                    <option value="Arts & Culture">Arts & Culture</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Geographic Scope / Level *
                  </label>
                  <select
                    value={scopeLevel}
                    onChange={(e) => setScopeLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-[#2d8a4e] outline-none transition"
                  >
                    <option value="Institutional / Campus-Wide">Institutional / Campus-Wide</option>
                    <option value="Local / City Level">Local / City Level</option>
                    <option value="Regional (Region XII)">Regional (Region XII)</option>
                    <option value="National Level">National Level</option>
                    <option value="International Level">International Level</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rank / Position Conferred *
                </label>
                <select
                  value={rankConferred}
                  onChange={(e) => setRankConferred(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-[#2d8a4e] outline-none transition"
                >
                  <option value="Champion / 1st Place">Champion / 1st Place</option>
                  <option value="2nd Place">2nd Place</option>
                  <option value="3rd Place">3rd Place</option>
                  <option value="Finalist / Runner-Up">Finalist / Runner-Up</option>
                  <option value="Dean's Lister">Dean's Lister</option>
                  <option value="Leadership Officer / Lead">Leadership Officer / Lead</option>
                  <option value="Participant / Special Award">Participant / Special Award</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Academic Year *
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-[#2d8a4e] outline-none transition"
                  >
                    <option value="AY 2025-2026">AY 2025-2026</option>
                    <option value="AY 2024-2025">AY 2024-2025</option>
                    <option value="AY 2023-2024">AY 2023-2024</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Term / Semester *
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-[#2d8a4e] outline-none transition"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Summer Term">Summer Term</option>
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
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-[#2d8a4e] outline-none transition"
                    required
                  />
                </div>
              </div>

            </form>
          )}

          {/* ================= STEP 3: SUPPORTING PROOF & SUMMARY ================= */}
          {currentStep === 3 && (
            <form id="wizard-step-3" onSubmit={handleFinalSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Narrative Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Brief details about the accomplishment, criteria met, or project abstract..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 outline-none text-xs text-slate-800 transition resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supporting Evidence Document (PDF/JPG/PNG) *
                </label>
                
                <div className="relative border-2 border-dashed border-slate-200 hover:border-[#2d8a4e] rounded-2xl p-6 text-center transition bg-slate-50/50 hover:bg-[#eef7f0]/30 cursor-pointer group">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                    <div className="w-10 h-10 rounded-2xl bg-[#eef7f0] border border-[#cbe6d2] text-[#2d8a4e] flex items-center justify-center group-hover:scale-110 transition">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800 group-hover:text-[#2d8a4e] transition">
                        Click or drag certificate attachment here
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        PDF, JPG, PNG up to 5MB
                      </p>
                    </div>
                  </div>
                </div>

                {attachedFile && (
                  <div className="mt-2 p-3 rounded-xl bg-[#eef7f0] border border-[#cbe6d2] flex items-center justify-between text-xs text-[#1e5831] font-bold">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#2d8a4e]" />
                      <span className="truncate max-w-[240px]">{attachedFile.name}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700">{(attachedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                )}
              </div>

            </form>
          )}

        </div>

        {/* Modal Action Buttons Footer */}
        <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          
          {currentStep === 1 && (
            <>
              <button
                type="button"
                onClick={() => { setError(''); onClose() }}
                className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="wizard-step-1"
                className="px-5 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md"
              >
                <span>Next: Scope & Rank</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {currentStep === 2 && (
            <>
              <button
                type="button"
                onClick={() => { setError(''); setCurrentStep(1) }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                form="wizard-step-2"
                className="px-5 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md"
              >
                <span>Next: Proof & Submit</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {currentStep === 3 && (
            <>
              <button
                type="button"
                onClick={() => { setError(''); setCurrentStep(2) }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                form="wizard-step-3"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Entry ✓'}</span>
              </button>
            </>
          )}

        </div>

      </div>
    </div>
  )
}
