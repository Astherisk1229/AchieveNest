import React, { useState, useEffect } from 'react'
import {
  X,
  Award,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Check,
  Building,
  Globe,
  Calendar,
  Sparkles,
  Paperclip,
  GraduationCap,
  Users,
  BookOpen,
  Heart,
  ShieldCheck,
  Scan,
  RefreshCw,
  FileSearch,
  Wand2
} from 'lucide-react'

import RankingCriteriaModel from '../../../models/RankingCriteriaModel.js'
import SecurityController from '../../../controllers/SecurityController.js'
import OcrScanController from '../../../controllers/OcrScanController.js'

// Helper component for required field labels (Clean Auto-filled badge when OCR populated)
const ReqLabel = ({ label, value, isOcrAutoFilled }) => {
  const isFilled = value !== undefined && value !== null && String(value).trim() !== ''
  return (
    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
      <span className="flex items-center gap-1.5">
        <span>{label}</span>
        {isOcrAutoFilled && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200" title="Auto-filled from certificate text via AchieveNest OCR Engine">
            Auto-filled
          </span>
        )}
      </span>
      {isFilled ? (
        <span className="text-[#16834a] text-[11px] font-bold flex items-center gap-0.5" title="Field Requirement Completed">
          <Check className="w-3.5 h-3.5 text-[#16834a] stroke-[3]" />
        </span>
      ) : (
        <span className="text-slate-400 font-normal text-xs" title="Required Field">*</span>
      )}
    </label>
  )
}

export default function PersonnelSubmissionModal({ isOpen, onClose, onSubmitAccomplishment, initialCategory = '' }) {
  // Helper for Academic Year Infer
  const inferAcademicYear = (dateStr) => {
    if (!dateStr) return 'AY 2025-2026'
    const d = new Date(dateStr)
    const year = d.getFullYear()
    const month = d.getMonth() + 1 // 1..12
    const startYear = month >= 6 ? year : year - 1
    return `AY ${startYear}-${startYear + 1}`
  }

  // Active Category State
  const [category, setCategory] = useState(initialCategory || 'A.1 Degree/s')
  const [dateAchieved, setDateAchieved] = useState(new Date().toISOString().split('T')[0])
  const [academicYear, setAcademicYear] = useState(() => inferAcademicYear(new Date().toISOString().split('T')[0]))

  // Tailored Category Fields
  // A.1 Degree/s
  const [degreeLevel, setDegreeLevel] = useState('Ph.D. Degree Holder')
  const [degreeTitle, setDegreeTitle] = useState('')
  const [institution, setInstitution] = useState('')
  const [unitsCompleted, setUnitsCompleted] = useState('18')

  // A.2 Membership
  const [orgName, setOrgName] = useState('')
  const [orgPosition, setOrgPosition] = useState('Member')
  const [officeHeld, setOfficeHeld] = useState('')

  // A.3 Seminar
  const [seminarTitle, setSeminarTitle] = useState('')
  const [organizerVenue, setOrganizerVenue] = useState('')
  const [scopeLevel, setScopeLevel] = useState('National')

  // B.1 Speaker / Consultancy
  const [eventTitle, setEventTitle] = useState('')
  const [speakerRole, setSpeakerRole] = useState('Keynote Speaker')
  const [sponsoringAgency, setSponsoringAgency] = useState('')

  // B.2 Publication
  const [pubTitle, setPubTitle] = useState('')
  const [pubType, setPubType] = useState('Scholarly Paper')
  const [publisherIssn, setPublisherIssn] = useState('')

  // B.3 Conduct of Research
  const [researchTitle, setResearchTitle] = useState('')
  const [researchRole, setResearchRole] = useState('Lead Researcher')
  const [fundingStatus, setFundingStatus] = useState('Completed Institutional Research')

  // B.4 Recognition or Awards
  const [awardTitle, setAwardTitle] = useState('')
  const [conferringBody, setConferringBody] = useState('')
  const [awardType, setAwardType] = useState('Awardee')

  // B.5 Instructional Materials
  const [materialTitle, setMaterialTitle] = useState('')
  const [matType, setMatType] = useState('Workbooks / Exercises / Lecture Notes (Bound)')
  const [courseUsedIn, setCourseUsedIn] = useState('')

  // B.6 Creative Work
  const [creativeTitle, setCreativeTitle] = useState('')
  const [exhibitionVenue, setExhibitionVenue] = useState('')

  // C.1 / C.2 Service & Community
  const [serviceTitle, setServiceTitle] = useState('')
  const [sponsoringOrg, setSponsoringOrg] = useState('')
  const [subType, setSubType] = useState('C.1.1 Moderator of Clubs / Organizations')

  // Proof Attachment & Remarks
  const [description, setDescription] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)

  // System States & Security
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // OCR Document Scan States
  const [isScanning, setIsScanning] = useState(false)
  const [ocrResult, setOcrResult] = useState(null)
  const [ocrBadges, setOcrBadges] = useState({})
  const [isScanModeActive, setIsScanModeActive] = useState(true)

  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory)
    }
  }, [initialCategory])

  // Sync Academic Year automatically on Date Achieved change
  const handleDateChange = (e) => {
    const d = e.target.value
    setDateAchieved(d)
    setAcademicYear(inferAcademicYear(d))
    setOcrBadges(prev => ({ ...prev, dateAchieved: false }))
  }

  // Perform Intelligent Document Scan & Auto-Fill
  const performOcrScan = async (fileToScan) => {
    if (!fileToScan) return
    setIsScanning(true)
    setError('')
    try {
      const response = await OcrScanController.processDocumentScan(fileToScan)
      setIsScanning(false)
      if (response.success && response.result) {
        const res = response.result
        setOcrResult(res)
        const fields = res.extractedFields

        // Auto-select detected NDMU category
        if (res.detectedCategory) {
          setCategory(res.detectedCategory)
        }

        // Set Date & Academic Year
        if (fields.date) {
          setDateAchieved(fields.date)
          setAcademicYear(fields.academicYear)
        }

        // Map Category Specific Fields & Track Badges
        const newBadges = { category: true, dateAchieved: true }

        if (res.detectedCategory.startsWith('A.1')) {
          if (fields.title) { setDegreeTitle(fields.title); newBadges.degreeTitle = true }
          if (fields.issuer) { setInstitution(fields.issuer); newBadges.institution = true }
          if (fields.degreeLevel) { setDegreeLevel(fields.degreeLevel); newBadges.degreeLevel = true }
        } else if (res.detectedCategory.startsWith('A.2')) {
          if (fields.title) { setOrgName(fields.title); newBadges.orgName = true }
          if (fields.issuer) { setOfficeHeld(fields.issuer); newBadges.officeHeld = true }
        } else if (res.detectedCategory.startsWith('A.3')) {
          if (fields.title) { setSeminarTitle(fields.title); newBadges.seminarTitle = true }
          if (fields.issuer) { setOrganizerVenue(fields.issuer); newBadges.organizerVenue = true }
          if (fields.scopeLevel) { setScopeLevel(fields.scopeLevel); newBadges.scopeLevel = true }
        } else if (res.detectedCategory.startsWith('B.1')) {
          if (fields.title) { setEventTitle(fields.title); newBadges.eventTitle = true }
          if (fields.issuer) { setSponsoringAgency(fields.issuer); newBadges.sponsoringAgency = true }
          if (fields.specificRole) { setSpeakerRole(fields.specificRole); newBadges.speakerRole = true }
          if (fields.scopeLevel) { setScopeLevel(fields.scopeLevel); newBadges.scopeLevel = true }
        } else if (res.detectedCategory.startsWith('B.2')) {
          if (fields.title) { setPubTitle(fields.title); newBadges.pubTitle = true }
          if (fields.issuer) { setPublisherIssn(fields.issuer); newBadges.publisherIssn = true }
          if (fields.pubType) { setPubType(fields.pubType); newBadges.pubType = true }
          if (fields.scopeLevel) { setScopeLevel(fields.scopeLevel); newBadges.scopeLevel = true }
        } else if (res.detectedCategory.startsWith('B.3')) {
          if (fields.title) { setResearchTitle(fields.title); newBadges.researchTitle = true }
          if (fields.fundingStatus) { setFundingStatus(fields.fundingStatus); newBadges.fundingStatus = true }
        } else if (res.detectedCategory.startsWith('B.4')) {
          if (fields.title) { setAwardTitle(fields.title); newBadges.awardTitle = true }
          if (fields.issuer) { setConferringBody(fields.issuer); newBadges.conferringBody = true }
          if (fields.awardType) { setAwardType(fields.awardType); newBadges.awardType = true }
          if (fields.scopeLevel) { setScopeLevel(fields.scopeLevel); newBadges.scopeLevel = true }
        } else if (res.detectedCategory.startsWith('B.5')) {
          if (fields.title) { setMaterialTitle(fields.title); newBadges.materialTitle = true }
          if (fields.matType) { setMatType(fields.matType); newBadges.matType = true }
        } else if (res.detectedCategory.startsWith('B.6')) {
          if (fields.title) { setCreativeTitle(fields.title); newBadges.creativeTitle = true }
          if (fields.issuer) { setExhibitionVenue(fields.issuer); newBadges.exhibitionVenue = true }
        } else {
          if (fields.title) { setServiceTitle(fields.title); newBadges.serviceTitle = true }
          if (fields.issuer) { setSponsoringOrg(fields.issuer); newBadges.sponsoringOrg = true }
          if (fields.subType) { setSubType(fields.subType); newBadges.subType = true }
        }

        setOcrBadges(newBadges)
      } else {
        setError(response.error || 'Failed to scan document.')
      }
    } catch (err) {
      setIsScanning(false)
      setError('OCR processing error. Please check document readability.')
    }
  }

  if (!isOpen) return null

  // Live Points Calculation
  const calculateEstimatedPoints = () => {
    if (category.startsWith('A.1')) {
      if (degreeLevel.includes('Ph.D. Degree Holder')) return 40
      if (degreeLevel.includes('Ph.D. Units')) return Math.min(10, Math.floor(Number(unitsCompleted || 0) / 3) * 2)
      if (degreeLevel.includes('Master') && degreeLevel.includes('Holder')) return 20
      return Math.min(10, Math.floor(Number(unitsCompleted || 0) / 3) * 1)
    }
    if (category.startsWith('A.2')) return orgPosition === 'Officer' ? 10 : 5
    if (category.startsWith('A.3')) {
      if (scopeLevel.includes('In-House')) return 3
      if (scopeLevel.includes('City')) return 4
      if (scopeLevel.includes('Regional')) return 6
      if (scopeLevel.includes('National')) return 8
      return 10
    }
    if (category.startsWith('B.1')) {
      if (speakerRole.includes('Keynote')) return 10
      if (speakerRole.includes('Resource')) return 8
      if (speakerRole.includes('Facilitator')) return 6
      if (speakerRole.includes('Judge')) return 5
      return 3
    }
    if (category.startsWith('B.2')) {
      if (pubType.includes('Book')) return 5
      if (pubType.includes('Article')) return 4
      return 5
    }
    if (category.startsWith('B.3')) {
      if (fundingStatus.includes('Externally')) return 20
      if (fundingStatus.includes('Institutional')) return 15
      return 10
    }
    if (category.startsWith('B.4')) {
      if (awardType === 'Awardee') {
        return scopeLevel.includes('National') || scopeLevel.includes('International') ? 40 : scopeLevel.includes('Regional') ? 30 : 10
      }
      return scopeLevel.includes('National') ? 20 : scopeLevel.includes('Regional') ? 15 : 5
    }
    if (category.startsWith('B.5')) return matType.includes('Workbook') ? 20 : 10
    if (category.startsWith('B.6')) return 20
    if (category.startsWith('C.1')) return 20
    if (category.startsWith('C.2')) return subType.includes('Church') || subType.includes('Community') ? 25 : 5
    return 5
  }

  const estimatedPts = calculateEstimatedPoints()
  const requiredProofHint = RankingCriteriaModel.getRequiredProofType('B', category, degreeLevel || subType || pubType)

  // Enhanced Security File Upload & Automatic OCR Trigger
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setError('')
      const validation = await SecurityController.validateFileUpload(file)
      if (!validation.isValid) {
        setError(validation.error)
        setAttachedFile(null)
        e.target.value = ''
        return
      }
      const sanitizedName = SecurityController.sanitizeFilename(file.name)
      const cleanFile = new File([file], sanitizedName, { type: file.type })
      setAttachedFile(cleanFile)

      // Automatic OCR Scan Trigger if Scan mode is active
      if (isScanModeActive) {
        await performOcrScan(cleanFile)
      }
    }
  }

  // Extract Normalized Title & Issuer based on Category
  const getNormalizedTitleAndIssuer = () => {
    if (category.startsWith('A.1')) return { title: degreeTitle || degreeLevel, issuer: institution || 'Grad School' }
    if (category.startsWith('A.2')) return { title: orgName || 'Professional Org', issuer: officeHeld || orgPosition }
    if (category.startsWith('A.3')) return { title: seminarTitle || 'Seminar/Training', issuer: organizerVenue || 'NDMU' }
    if (category.startsWith('B.1')) return { title: eventTitle || 'Talk/Consultancy', issuer: sponsoringAgency || 'Sponsoring Agency' }
    if (category.startsWith('B.2')) return { title: pubTitle || 'Publication Work', issuer: publisherIssn || 'Publisher' }
    if (category.startsWith('B.3')) return { title: researchTitle || 'Research Project', issuer: fundingStatus }
    if (category.startsWith('B.4')) return { title: awardTitle || 'Recognition/Award', issuer: conferringBody || 'Conferring Org' }
    if (category.startsWith('B.5')) return { title: materialTitle || 'Instructional Material', issuer: courseUsedIn || 'Academic Program' }
    if (category.startsWith('B.6')) return { title: creativeTitle || 'Creative Output', issuer: exhibitionVenue || 'Exhibition Venue' }
    return { title: serviceTitle || 'Service Project', issuer: sponsoringOrg || 'LGU/Parish' }
  }

  // Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const { title: resolvedTitle, issuer: resolvedIssuer } = getNormalizedTitleAndIssuer()

    if (!resolvedTitle.trim() || resolvedTitle.trim().length < 3) {
      setError('Please complete the primary title field for this category.')
      return
    }
    if (!attachedFile) {
      setError('Supporting Proof Document attachment (PDF/JPG/PNG) is required.')
      return
    }

    try {
      setIsSubmitting(true)
      await new Promise(resolve => setTimeout(resolve, 500))

      const formattedDate = new Date(dateAchieved).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })

      const newEntry = {
        id: Date.now(),
        title: resolvedTitle.trim(),
        issuer: resolvedIssuer.trim(),
        date: formattedDate,
        academic_year: academicYear,
        category: category,
        scope_level: scopeLevel,
        claimed_points: estimatedPts,
        status: 'Pending Review',
        description: description.trim(),
        attached_file_name: attachedFile ? attachedFile.name : 'proof_document.pdf'
      }

      if (onSubmitAccomplishment) {
        onSubmitAccomplishment(newEntry)
      }

      setIsSubmitting(false)
      onClose()
    } catch (err) {
      setIsSubmitting(false)
      setError('Failed to submit accomplishment. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ================= MODAL HEADER WITH LIVE ESTIMATED POINTS BADGE ================= */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#16834a] text-white flex items-center justify-center shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Log New Accomplishment</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EFF7F0] text-amber-300 text-[11px] font-extrabold shadow-2xs border border-emerald-700/50">
                  NDMU Ranking Record
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Category-Tailored Fields • Auto Academic Year ({academicYear})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert Message */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 shrink-0 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* ================= OCR SCAN CONFIDENCE & STATUS BANNER ================= */}
        {isScanning && (
          <div className="mx-5 mt-4 p-4 rounded-2xl bg-[#E7F3E9] border border-emerald-300 text-[#064e2b] text-xs font-bold flex items-center gap-3 shrink-0 animate-in fade-in duration-150">
            <div className="w-8 h-8 rounded-xl bg-[#16834a] text-white flex items-center justify-center animate-spin shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900">Scanning Document with AchieveNest OCR Engine...</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-amber-300 text-[10px] font-extrabold">AI Processing</span>
              </div>
              <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                Extracting text → Matching NDMU Category → Auto-filling fields...
              </p>
            </div>
          </div>
        )}

        {ocrResult && !isScanning && (
          <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-[#064e2b] text-xs font-semibold flex items-center justify-between gap-3 shrink-0 animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">OCR Scan Completed</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-[#064e2b] text-[10px] font-extrabold border border-emerald-400/60">
                    {ocrResult.confidenceScore}% Confidence Match
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Detected Category: <strong className="text-emerald-950">{ocrResult.detectedCategory}</strong> • Pre-filled form fields below. You can freely edit any value.
                </p>
              </div>
            </div>

            {attachedFile && (
              <button
                type="button"
                onClick={() => performOcrScan(attachedFile)}
                className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-[#064e2b] hover:bg-emerald-100 text-[11px] font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                <span>Re-scan</span>
              </button>
            )}
          </div>
        )}
        {/* ================= CATEGORY-TAILORED ADAPTIVE FORM SCROLLABLE BODY ================= */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">

          {/* ================= STEP 1: UPLOAD & OCR SCAN CERTIFICATE (VERY TOP STEP) ================= */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#16834a] text-white flex items-center justify-center text-xs font-black shadow-2xs">1</span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <span>Upload & Scan Certificate Document</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-[#064e2b] text-[10px] font-extrabold border border-emerald-300/60 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-300" />
                      <span>OCR Auto-Fill Active</span>
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">Attach your certificate first — system will auto-detect category & populate details.</p>
                </div>
              </div>
              <span className="text-[11px] font-extrabold text-emerald-800 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">PDF / PNG / JPG</span>
            </div>

            {/* Proof Hint Banner */}
            <div className="p-2.5 rounded-xl bg-emerald-100/60 border border-emerald-200 text-[#064e2b] text-[11px] font-semibold flex items-center gap-2">
              <Paperclip className="w-3.5 h-3.5 text-[#16834a] shrink-0" />
              <span><strong>Required Evidence:</strong> {requiredProofHint}</span>
            </div>

            {/* Drag and Drop Zone */}
            <div className="relative border-2 border-dashed border-emerald-300 hover:border-[#16834a] rounded-2xl p-4 text-center transition bg-white hover:bg-[#E7F3E9]/40 cursor-pointer group shadow-2xs">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#16834a] group-hover:scale-110 transition shadow-2xs">
                  <UploadCloud className="w-5 h-5" />
                </div>
                {attachedFile ? (
                  <div className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Attached: <strong>{attachedFile.name}</strong> ({(attachedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 flex items-center justify-center gap-1.5">
                      <span>Click to upload certificate or drag & drop file here</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Scans document instantly using AchieveNest OCR Engine</p>
                  </div>
                )}
              </div>
            </div>

            {/* Live OCR Scanning Spinner Status */}
            {isScanning && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-[#064e2b] text-xs font-bold flex items-center gap-3 animate-in fade-in">
                <RefreshCw className="w-4 h-4 text-[#16834a] animate-spin shrink-0" />
                <span>Scanning document text & detecting NDMU category...</span>
              </div>
            )}

            {/* OCR Success Confidence Card */}
            {ocrResult && !isScanning && (
              <div className="p-3 rounded-xl bg-white border border-emerald-300 text-[#064e2b] text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-300 shrink-0" />
                  <div>
                    <p className="font-extrabold text-slate-900">
                      OCR Scan Complete • <span className="text-[#16834a]">{ocrResult.confidenceScore}% Match</span>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Detected: <strong>{ocrResult.detectedCategory}</strong>
                    </p>
                  </div>
                </div>

                {attachedFile && (
                  <button
                    type="button"
                    onClick={() => performOcrScan(attachedFile)}
                    className="px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#064e2b] text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 text-[#16834a]" />
                    <span>Re-scan</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ================= STEP 2: REVIEW & EDIT EXTRACTED DETAILS ================= */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-black">2</span>
              <h4 className="font-extrabold text-slate-900 text-xs">Review & Edit Accomplishment Details</h4>
            </div>

            {/* CATEGORY SELECTOR */}
            <div>
              <ReqLabel label="Category (NDMU Rating Sheet)" value={category} isOcrAutoFilled={ocrBadges.category} />
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  setOcrBadges(prev => ({ ...prev, category: false }))
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-emerald-50/40 text-xs font-bold text-[#064e2b] focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20 outline-none transition"
              >
                <option value="A.1 Degree/s">Area A: A.1 Educational Qualifications / Degrees</option>
                <option value="A.2 Active Membership to Prof Orgs">Area A: A.2 Active Membership in Professional Orgs</option>
                <option value="A.3 Attendance to Seminars/Trainings">Area A: A.3 Attendance to Seminars / Trainings</option>
                <option value="B.1 Guest Lecturer / Consultant / Judge">Area B: B.1 Guest Lecturer / Resource Person / Consultant</option>
                <option value="B.2 Publication">Area B: B.2 Publication (Papers, Books, Articles)</option>
                <option value="B.3 Conduct of Research">Area B: B.3 Conduct of Research</option>
                <option value="B.4 Professional Recognition or Awards">Area B: B.4 Recognition or Awards</option>
                <option value="B.5 Production of Instructional Materials">Area B: B.5 Instructional Materials</option>
                <option value="B.6 Creative Work">Area B: B.6 Creative Work</option>
                <option value="C.1 Extra-Curricular Activities">Area C: C.1 School Involvement (Extracurricular/Orgs)</option>
                <option value="C.2 Community Involvement">Area C: C.2 Community & Civic Involvement</option>
              </select>
            </div>

            {/* ================= 100% CATEGORY-TAILORED DYNAMIC INPUTS ================= */}

            {/* A.1 DEGREE TAILORED INPUTS */}
            {category.startsWith('A.1') && (
              <div className="space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <ReqLabel label="Degree Level" value={degreeLevel} isOcrAutoFilled={ocrBadges.degreeLevel} />
                    <select
                      value={degreeLevel}
                      onChange={(e) => {
                        setDegreeLevel(e.target.value)
                        setOcrBadges(prev => ({ ...prev, degreeLevel: false }))
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-[#16834a]"
                    >
                      <option value="Ph.D. Degree Holder">Ph.D. Degree Holder</option>
                      <option value="Ph.D. Units">Ph.D. Units Earned</option>
                      <option value="Master's Degree Holder">Master's Degree Holder</option>
                      <option value="Master's Units">Master's Units Earned</option>
                    </select>
                  </div>

                  <div>
                    <ReqLabel label="Degree Program / Specialization" value={degreeTitle} isOcrAutoFilled={ocrBadges.degreeTitle} />
                    <input
                      type="text"
                      value={degreeTitle}
                      onChange={(e) => {
                        setDegreeTitle(e.target.value)
                        setOcrBadges(prev => ({ ...prev, degreeTitle: false }))
                      }}
                      placeholder="e.g. Ph.D. in Computer Science / MA in Education"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#16834a]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={degreeLevel.includes('Units') ? '' : 'sm:col-span-2'}>
                    <ReqLabel label="University / Conferring Institution" value={institution} isOcrAutoFilled={ocrBadges.institution} />
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => {
                        setInstitution(e.target.value)
                        setOcrBadges(prev => ({ ...prev, institution: false }))
                      }}
                      placeholder="e.g. Ateneo de Manila University"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#16834a]"
                      required
                    />
                  </div>

                  {degreeLevel.includes('Units') && (
                    <div>
                      <ReqLabel label="Units Completed" value={unitsCompleted} />
                      <input
                        type="number"
                        value={unitsCompleted}
                        onChange={(e) => setUnitsCompleted(e.target.value)}
                        placeholder="e.g. 18"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* A.2 MEMBERSHIP TAILORED INPUTS */}
            {category.startsWith('A.2') && (
              <div className="space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <ReqLabel label="Organization Name" value={orgName} isOcrAutoFilled={ocrBadges.orgName} />
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => {
                        setOrgName(e.target.value)
                        setOcrBadges(prev => ({ ...prev, orgName: false }))
                      }}
                      placeholder="e.g. Philippine Computer Society (PCS) / PSITE"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#16834a]"
                      required
                    />
                  </div>

                  <div>
                    <ReqLabel label="Membership Position" value={orgPosition} />
                    <select
                      value={orgPosition}
                      onChange={(e) => setOrgPosition(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                    >
                      <option value="Member">Regular Member</option>
                      <option value="Officer">Officer / Board Member</option>
                    </select>
                  </div>
                </div>

                {orgPosition === 'Officer' && (
                  <div>
                    <ReqLabel label="Specific Office Held" value={officeHeld} isOcrAutoFilled={ocrBadges.officeHeld} />
                    <input
                      type="text"
                      value={officeHeld}
                      onChange={(e) => {
                        setOfficeHeld(e.target.value)
                        setOcrBadges(prev => ({ ...prev, officeHeld: false }))
                      }}
                      placeholder="e.g. Vice President for External Affairs"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                    />
                  </div>
                )}
              </div>
            )}

            {/* A.3 SEMINARS TAILORED INPUTS */}
            {category.startsWith('A.3') && (
              <div className="space-y-3 animate-in fade-in">
                <div>
                  <ReqLabel label="Seminar / Training Title" value={seminarTitle} isOcrAutoFilled={ocrBadges.seminarTitle} />
                  <input
                    type="text"
                    value={seminarTitle}
                    onChange={(e) => {
                      setSeminarTitle(e.target.value)
                      setOcrBadges(prev => ({ ...prev, seminarTitle: false }))
                    }}
                    placeholder="e.g. National AI & Cloud Computing Faculty Development Workshop"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#16834a]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <ReqLabel label="Organizer / Issuing Entity & Venue" value={organizerVenue} isOcrAutoFilled={ocrBadges.organizerVenue} />
                    <input
                      type="text"
                      value={organizerVenue}
                      onChange={(e) => {
                        setOrganizerVenue(e.target.value)
                        setOcrBadges(prev => ({ ...prev, organizerVenue: false }))
                      }}
                      placeholder="e.g. CHED Region XII / NDMU Campus"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <ReqLabel label="Geographic Scope" value={scopeLevel} isOcrAutoFilled={ocrBadges.scopeLevel} />
                    <select
                      value={scopeLevel}
                      onChange={(e) => {
                        setScopeLevel(e.target.value)
                        setOcrBadges(prev => ({ ...prev, scopeLevel: false }))
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                    >
                      <option value="In-House">In-House (NDMU)</option>
                      <option value="Local">City / Provincial</option>
                      <option value="Regional">Regional</option>
                      <option value="National">National</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* B.1 SPEAKER / CONSULTANCY TAILORED INPUTS */}
            {category.startsWith('B.1') && (
              <div className="space-y-3 animate-in fade-in">
                <div>
                  <ReqLabel label="Event / Activity Title" value={eventTitle} isOcrAutoFilled={ocrBadges.eventTitle} />
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => {
                      setEventTitle(e.target.value)
                      setOcrBadges(prev => ({ ...prev, eventTitle: false }))
                    }}
                    placeholder="e.g. Keynote Address on Machine Learning in Higher Ed Analytics"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#16834a]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <ReqLabel label="Role Played" value={speakerRole} isOcrAutoFilled={ocrBadges.speakerRole} />
                    <select
                      value={speakerRole}
                      onChange={(e) => {
                        setSpeakerRole(e.target.value)
                        setOcrBadges(prev => ({ ...prev, speakerRole: false }))
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                    >
                      <option value="Keynote Speaker">Keynote Speaker</option>
                      <option value="Resource Person">Resource Person / Consultant</option>
                      <option value="Facilitator">Facilitator / Organizer</option>
                      <option value="Judge">Judge / Evaluator</option>
                      <option value="Reactor">Reactor / Panelist</option>
                    </select>
                  </div>

                  <div>
                    <ReqLabel label="Sponsoring Agency / Venue" value={sponsoringAgency} isOcrAutoFilled={ocrBadges.sponsoringAgency} />
                    <input
                      type="text"
                      value={sponsoringAgency}
                      onChange={(e) => {
                        setSponsoringAgency(e.target.value)
                        setOcrBadges(prev => ({ ...prev, sponsoringAgency: false }))
                      }}
                      placeholder="e.g. DOST Region XII / Ateneo"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <ReqLabel label="Scope Level" value={scopeLevel} isOcrAutoFilled={ocrBadges.scopeLevel} />
                    <select
                      value={scopeLevel}
                      onChange={(e) => {
                        setScopeLevel(e.target.value)
                        setOcrBadges(prev => ({ ...prev, scopeLevel: false }))
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                    >
                      <option value="Local">Local</option>
                      <option value="Regional">Regional</option>
                      <option value="National">National</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* B.2 PUBLICATION TAILORED INPUTS */}
            {category.startsWith('B.2') && (
              <div className="space-y-3 animate-in fade-in">
                <div>
                  <ReqLabel label="Title of Published Work / Book" value={pubTitle} isOcrAutoFilled={ocrBadges.pubTitle} />
                  <input
                    type="text"
                    value={pubTitle}
                    onChange={(e) => {
                      setPubTitle(e.target.value)
                      setOcrBadges(prev => ({ ...prev, pubTitle: false }))
                    }}
                    placeholder="e.g. Predictive Student Performance Modeling Using Deep Learning"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#16834a]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <ReqLabel label="Type of Publication" value={pubType} isOcrAutoFilled={ocrBadges.pubType} />
                    <select
                      value={pubType}
                      onChange={(e) => {
                        setPubType(e.target.value)
                        setOcrBadges(prev => ({ ...prev, pubType: false }))
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                    >
                      <option value="Book">Book (5 pts max)</option>
                      <option value="Scholarly Paper">Scholarly Paper (5 pts max)</option>
                      <option value="Research Output">Research Output (5 pts max)</option>
                      <option value="Journal Article">Journal Article (4 pts max)</option>
                      <option value="Monograph">Monograph (4 pts max)</option>
                      <option value="Compilation">Compilation (5 pts max)</option>
                    </select>
                  </div>

                  <div>
                    <ReqLabel label="Publisher & ISSN/ISBN" value={publisherIssn} isOcrAutoFilled={ocrBadges.publisherIssn} />
                    <input
                      type="text"
                      value={publisherIssn}
                      onChange={(e) => {
                        setPublisherIssn(e.target.value)
                        setOcrBadges(prev => ({ ...prev, publisherIssn: false }))
                      }}
                      placeholder="e.g. IEEE Access / ISSN: 2169-3536"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <ReqLabel label="Publication Reach" value={scopeLevel} isOcrAutoFilled={ocrBadges.scopeLevel} />
                    <select
                      value={scopeLevel}
                      onChange={(e) => {
                        setScopeLevel(e.target.value)
                        setOcrBadges(prev => ({ ...prev, scopeLevel: false }))
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                    >
                      <option value="Local">Local</option>
                      <option value="Regional">Regional</option>
                      <option value="National">National</option>
                      <option value="International">International / Scopus</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* B.3 CONDUCT OF RESEARCH TAILORED INPUTS */}
            {category.startsWith('B.3') && (
              <div className="space-y-3 animate-in fade-in">
                <div>
                  <ReqLabel label="Research Project Title" value={researchTitle} isOcrAutoFilled={ocrBadges.researchTitle} />
                  <input
                    type="text"
                    value={researchTitle}
                    onChange={(e) => {
                      setResearchTitle(e.target.value)
                      setOcrBadges(prev => ({ ...prev, researchTitle: false }))
                    }}
                    placeholder="e.g. AI-Driven Student Retention & Early Warning Analytics Framework"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#16834a]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <ReqLabel label="Research Role" value={researchRole} />
                    <select
                      value={researchRole}
                      onChange={(e) => setResearchRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                    >
                      <option value="Lead Researcher">Lead Researcher / Principal Investigator</option>
                      <option value="Co-Researcher">Co-Researcher / Project Member</option>
                    </select>
                  </div>

                  <div>
                    <ReqLabel label="Funding Status" value={fundingStatus} isOcrAutoFilled={ocrBadges.fundingStatus} />
                    <select
                      value={fundingStatus}
                      onChange={(e) => {
                        setFundingStatus(e.target.value)
                        setOcrBadges(prev => ({ ...prev, fundingStatus: false }))
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                    >
                      <option value="Completed Institutional Research">Completed Institutional Research (15 pts)</option>
                      <option value="Externally Funded Research Project">Externally Funded Project (20 pts)</option>
                      <option value="Ongoing Commissioned Research">Ongoing Commissioned Research (10 pts)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* B.4 RECOGNITION OR AWARDS TAILORED INPUTS */}
            {category.startsWith('B.4') && (
              <div className="space-y-3 animate-in fade-in">
                <div>
                  <ReqLabel label="Award Title / Honor Received" value={awardTitle} isOcrAutoFilled={ocrBadges.awardTitle} />
                  <input
                    type="text"
                    value={awardTitle}
                    onChange={(e) => {
                      setAwardTitle(e.target.value)
                      setOcrBadges(prev => ({ ...prev, awardTitle: false }))
                    }}
                    placeholder="e.g. NDMU Outstanding Research Faculty of the Year"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#16834a]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <ReqLabel label="Conferring Body / Institution" value={conferringBody} isOcrAutoFilled={ocrBadges.conferringBody} />
                    <input
                      type="text"
                      value={conferringBody}
                      onChange={(e) => {
                        setConferringBody(e.target.value)
                        setOcrBadges(prev => ({ ...prev, conferringBody: false }))
                      }}
                      placeholder="e.g. Notre Dame of Marbel University"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <ReqLabel label="Recognition Type" value={awardType} isOcrAutoFilled={ocrBadges.awardType} />
                    <select
                      value={awardType}
                      onChange={(e) => {
                        setAwardType(e.target.value)
                        setOcrBadges(prev => ({ ...prev, awardType: false }))
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                    >
                      <option value="Awardee">Awardee / Recipient</option>
                      <option value="Nominee">Nominee</option>
                    </select>
                  </div>

                  <div>
                    <ReqLabel label="Award Scope" value={scopeLevel} isOcrAutoFilled={ocrBadges.scopeLevel} />
                    <select
                      value={scopeLevel}
                      onChange={(e) => {
                        setScopeLevel(e.target.value)
                        setOcrBadges(prev => ({ ...prev, scopeLevel: false }))
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                    >
                      <option value="Local">Local (10 pts)</option>
                      <option value="Regional">Provincial / Regional (30 pts)</option>
                      <option value="National">National / International (40 pts)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* B.5 INSTRUCTIONAL MATERIALS TAILORED INPUTS */}
            {category.startsWith('B.5') && (
              <div className="space-y-3 animate-in fade-in">
                <div>
                  <ReqLabel label="Title of Material" value={materialTitle} isOcrAutoFilled={ocrBadges.materialTitle} />
                  <input
                    type="text"
                    value={materialTitle}
                    onChange={(e) => {
                      setMaterialTitle(e.target.value)
                      setOcrBadges(prev => ({ ...prev, materialTitle: false }))
                    }}
                    placeholder="e.g. Bound Laboratory Exercises Manual for Artificial Intelligence"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#16834a]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <ReqLabel label="Material Type" value={matType} isOcrAutoFilled={ocrBadges.matType} />
                    <select
                      value={matType}
                      onChange={(e) => {
                        setMatType(e.target.value)
                        setOcrBadges(prev => ({ ...prev, matType: false }))
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                    >
                      <option value="Workbooks / Exercises / Lecture Notes (Bound)">Workbooks / Exercises / Notes (Bound - 20 pts)</option>
                      <option value="Modules (Bound)">Modules (Bound - 10 pts)</option>
                      <option value="Reviewers (Bound)">Reviewers (Bound - 10 pts)</option>
                      <option value="Audio-Visual Aids">Audio-Visual Aids / Software (10 pts)</option>
                    </select>
                  </div>

                  <div>
                    <ReqLabel label="Subject / Course Code Used In" value={courseUsedIn} />
                    <input
                      type="text"
                      value={courseUsedIn}
                      onChange={(e) => setCourseUsedIn(e.target.value)}
                      placeholder="e.g. ITE 311 - Machine Learning"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* B.6 CREATIVE WORK TAILORED INPUTS */}
            {category.startsWith('B.6') && (
              <div className="space-y-3 animate-in fade-in">
                <div>
                  <ReqLabel label="Description / Title of Creative Output" value={creativeTitle} isOcrAutoFilled={ocrBadges.creativeTitle} />
                  <input
                    type="text"
                    value={creativeTitle}
                    onChange={(e) => {
                      setCreativeTitle(e.target.value)
                      setOcrBadges(prev => ({ ...prev, creativeTitle: false }))
                    }}
                    placeholder="e.g. University Digital Archiving Software / Artistic Performance"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#16834a]"
                    required
                  />
                </div>

                <div>
                  <ReqLabel label="Venue / Exhibition / Medium" value={exhibitionVenue} isOcrAutoFilled={ocrBadges.exhibitionVenue} />
                  <input
                    type="text"
                    value={exhibitionVenue}
                    onChange={(e) => {
                      setExhibitionVenue(e.target.value)
                      setOcrBadges(prev => ({ ...prev, exhibitionVenue: false }))
                    }}
                    placeholder="e.g. NDMU CITE Gallery / GitHub Open Source Repository"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                    required
                  />
                </div>
              </div>
            )}

            {/* C.1 / C.2 SERVICE TAILORED INPUTS */}
            {(category.startsWith('C.1') || category.startsWith('C.2')) && (
              <div className="space-y-3 animate-in fade-in">
                <div>
                  <ReqLabel label="Service Sub-Type" value={subType} isOcrAutoFilled={ocrBadges.subType} />
                  <select
                    value={subType}
                    onChange={(e) => {
                      setSubType(e.target.value)
                      setOcrBadges(prev => ({ ...prev, subType: false }))
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                  >
                    <option value="C.1.1 Moderator of Clubs / Organizations">C.1.1 Moderator of Clubs / Organizations (20 pts max)</option>
                    <option value="C.1.2 Coach / Trainer">C.1.2 Coach / Trainer (20 pts max)</option>
                    <option value="C.1.3 Membership in Working Committees">C.1.3 Membership in Working Committees (20 pts max)</option>
                    <option value="C.2.1 Active Church Involvement">C.2.1 Active Church Involvement (25 pts max)</option>
                    <option value="C.2.2 Community / Civic Involvement">C.2.2 Community / Civic Involvement (25 pts max)</option>
                    <option value="C.2.3 Support to Charity / Projects">C.2.3 Support to Charity / Projects (5 pts max)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <ReqLabel label="Name of Club / Service Project" value={serviceTitle} isOcrAutoFilled={ocrBadges.serviceTitle} />
                    <input
                      type="text"
                      value={serviceTitle}
                      onChange={(e) => {
                        setServiceTitle(e.target.value)
                        setOcrBadges(prev => ({ ...prev, serviceTitle: false }))
                      }}
                      placeholder="e.g. Computer Science Student Society / Barangay Smart Literacy Outreach"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#16834a]"
                      required
                    />
                  </div>

                  <div>
                    <ReqLabel label="Sponsoring LGU / NGO / Institution" value={sponsoringOrg} isOcrAutoFilled={ocrBadges.sponsoringOrg} />
                    <input
                      type="text"
                      value={sponsoringOrg}
                      onChange={(e) => {
                        setSponsoringOrg(e.target.value)
                        setOcrBadges(prev => ({ ...prev, sponsoringOrg: false }))
                      }}
                      placeholder="e.g. Koronadal City LGU / Marist Parish"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SINGLE COMMON DATE FIELD */}
            <div>
              <ReqLabel label={`Date Achieved / Conferred (Auto AY: ${academicYear})`} value={dateAchieved} isOcrAutoFilled={ocrBadges.dateAchieved} />
              <input
                type="date"
                value={dateAchieved}
                onChange={handleDateChange}
                required
              />
            </div>
          </div>

          {/* INLINE PROOF ATTACHMENT BOX WITH OCR SCAN TOGGLE */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <ReqLabel label="Supporting Proof Attachment" value={attachedFile} />
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-700">PDF / JPG / PNG (Max 10MB)</span>
                <label className="flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-[11px] font-extrabold text-[#064e2b]" title="Automatically run OCR scan on attached certificate">
                  <input
                    type="checkbox"
                    checked={isScanModeActive}
                    onChange={(e) => setIsScanModeActive(e.target.checked)}
                    className="rounded text-[#16834a] focus:ring-0 cursor-pointer"
                  />
                  <Scan className="w-3 h-3 text-[#16834a]" />
                  <span>OCR Auto-Scan</span>
                </label>
              </div>
            </div>

            {/* Proof Hint Banner */}
            <div className="mb-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#064e2b] text-[11px] font-semibold flex items-center gap-2">
              <Paperclip className="w-3.5 h-3.5 text-[#16834a] shrink-0" />
              <span><strong>Required Evidence:</strong> {requiredProofHint}</span>
            </div>

            <div className="relative border-2 border-dashed border-slate-200 hover:border-[#16834a] rounded-2xl p-4 text-center transition bg-slate-50/50 hover:bg-[#E7F3E9]/30 cursor-pointer group">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#16834a] group-hover:scale-110 transition shadow-2xs">
                  <UploadCloud className="w-5 h-5" />
                </div>
                {attachedFile ? (
                  <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Attached: {attachedFile.name} ({(attachedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                      <span>Drag & drop certificate here or click to browse</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-[#064e2b] rounded-md text-[10px] font-extrabold flex items-center gap-1 border border-emerald-300/60">
                        <Sparkles className="w-3 h-3 text-amber-500 fill-amber-300" />
                        <span>OCR Scanner Ready</span>
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">PDF, PNG, JPG up to 10MB • Automatic Category & Field Auto-Fill</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* OPTIONAL REMARKS */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Remarks / Executive Summary (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional details or publication DOI links if applicable..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none transition focus:border-[#16834a]"
            />
          </div>

          {/* ACTION BUTTONS FOOTER */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white text-xs font-bold flex items-center gap-2 transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Save Accomplishment</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
