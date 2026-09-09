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
import AchievementClassificationService from '../../../services/achievementClassificationService.js'
import PersonnelAchievementController from '../../../controllers/PersonnelAchievementController.js'

// Helper component for required field labels (Clean Auto-filled badge when OCR populated)
const ReqLabel = ({ label, value, isOcrAutoFilled, isManuallyEdited }) => {
  const isFilled = value !== undefined && value !== null && String(value).trim() !== ''
  return (
    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
      <span className="flex items-center gap-1.5">
        <span>{label}</span>
        {isOcrAutoFilled && !isManuallyEdited && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200" title="Auto-filled from certificate text via AchieveNest OCR Engine">
            Auto-filled
          </span>
        )}
        {isManuallyEdited && isFilled && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200" title="Manually edited by Personnel">
            Manual
          </span>
        )}
      </span>
      {isFilled ? (
        <span className="text-[#16834a] text-[11px] font-bold flex items-center gap-0.5" title="Field Completed">
          <Check className="w-3.5 h-3.5 text-[#16834a] stroke-[3]" />
        </span>
      ) : (
        <span className="text-slate-400 font-normal text-xs" title="Required Field">*</span>
      )}
    </label>
  )
}

export default function PersonnelSubmissionModal({ isOpen, onClose, onSubmitAccomplishment, initialCategory = '', editingItem = null, existingAchievements = [] }) {
  // Helper for Academic Year Infer
  const inferAcademicYear = (dateStr) => {
    if (!dateStr || String(dateStr).trim() === '') return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const year = d.getFullYear()
    const month = d.getMonth() + 1 // 1..12
    const startYear = month >= 6 ? year : year - 1
    return `AY ${startYear}-${startYear + 1}`
  }

  // Active Category State
  const [category, setCategory] = useState(initialCategory || 'A.1 Degree/s')
  const [dateAchieved, setDateAchieved] = useState('')
  const [academicYear, setAcademicYear] = useState('')

  // Tailored Category Fields (Strict Zero-Fabrication initial state)
  // A.1 Degree/s
  const [degreeLevel, setDegreeLevel] = useState('')
  const [degreeTitle, setDegreeTitle] = useState('')
  const [institution, setInstitution] = useState('')
  const [unitsCompleted, setUnitsCompleted] = useState('')

  // A.2 Membership
  const [orgName, setOrgName] = useState('')
  const [orgPosition, setOrgPosition] = useState('')
  const [officeHeld, setOfficeHeld] = useState('')

  // A.3 Seminar
  const [seminarTitle, setSeminarTitle] = useState('')
  const [organizerVenue, setOrganizerVenue] = useState('')
  const [scopeLevel, setScopeLevel] = useState('')

  // B.1 Speaker / Consultancy
  const [eventTitle, setEventTitle] = useState('')
  const [speakerRole, setSpeakerRole] = useState('')
  const [sponsoringAgency, setSponsoringAgency] = useState('')

  // B.2 Publication
  const [pubTitle, setPubTitle] = useState('')
  const [pubType, setPubType] = useState('')
  const [publisherIssn, setPublisherIssn] = useState('')

  // B.3 Conduct of Research
  const [researchTitle, setResearchTitle] = useState('')
  const [researchRole, setResearchRole] = useState('')
  const [fundingStatus, setFundingStatus] = useState('')

  // B.4 Recognition or Awards
  const [awardTitle, setAwardTitle] = useState('')
  const [conferringBody, setConferringBody] = useState('')
  const [awardType, setAwardType] = useState('')

  // B.5 Instructional Materials
  const [materialTitle, setMaterialTitle] = useState('')
  const [matType, setMatType] = useState('')
  const [courseUsedIn, setCourseUsedIn] = useState('')

  // B.6 Creative Work
  const [creativeTitle, setCreativeTitle] = useState('')
  const [exhibitionVenue, setExhibitionVenue] = useState('')

  // C.1 / C.2 Service & Community
  const [serviceTitle, setServiceTitle] = useState('')
  const [sponsoringOrg, setSponsoringOrg] = useState('')
  const [subType, setSubType] = useState('')

  // Proof Attachment & Remarks
  const [description, setDescription] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)

  // Tracking Manual Modifications (Manual overrides OCR and is never silently overwritten)
  const [manuallyEdited, setManuallyEdited] = useState({})

  // System States & Security
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // OCR Document Scan States
  const [isScanning, setIsScanning] = useState(false)
  const [ocrResult, setOcrResult] = useState(null)
  const [ocrBadges, setOcrBadges] = useState({})
  const [isScanModeActive, setIsScanModeActive] = useState(true)

  useEffect(() => {
    if (editingItem) {
      setCategory(editingItem.category || 'A.1 Degree/s')
      setDateAchieved(editingItem.date_achieved || '')
      setAcademicYear(editingItem.academic_year || inferAcademicYear(editingItem.date_achieved))
      setDescription(editingItem.description || '')
      setScopeLevel(editingItem.scope_level || '')
    } else if (initialCategory) {
      setCategory(initialCategory)
    }
  }, [initialCategory, editingItem])

  // Helper to mark a field as manually edited
  const markFieldEdited = (fieldName) => {
    setManuallyEdited(prev => ({ ...prev, [fieldName]: true }))
    setOcrBadges(prev => ({ ...prev, [fieldName]: false }))
  }

  // Sync Academic Year automatically on Date Achieved change
  const handleDateChange = (e) => {
    const d = e.target.value
    setDateAchieved(d)
    setAcademicYear(inferAcademicYear(d))
    markFieldEdited('dateAchieved')
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

        // 1. Auto-select suggested NDMU category only if user hasn't manually chosen one
        if (res.detectedCategory && !manuallyEdited.category) {
          setCategory(res.detectedCategory)
        }

        // 2. Set Date & Academic Year if detected and not manually edited
        if (fields.date && !manuallyEdited.dateAchieved) {
          setDateAchieved(fields.date)
          setAcademicYear(fields.academicYear)
        }

        // 3. Map Category Specific Fields & Track Badges without overwriting manual user inputs
        const newBadges = {
          category: !manuallyEdited.category && !!res.detectedCategory,
          dateAchieved: !manuallyEdited.dateAchieved && !!fields.date
        }

        const catToApply = (!manuallyEdited.category && res.detectedCategory) ? res.detectedCategory : category

        if (catToApply.startsWith('A.1')) {
          if (fields.title && !manuallyEdited.degreeTitle) { setDegreeTitle(fields.title); newBadges.degreeTitle = true }
          if (fields.issuer && !manuallyEdited.institution) { setInstitution(fields.issuer); newBadges.institution = true }
          if (fields.degreeLevel && !manuallyEdited.degreeLevel) { setDegreeLevel(fields.degreeLevel); newBadges.degreeLevel = true }
        } else if (catToApply.startsWith('A.2')) {
          if (fields.title && !manuallyEdited.orgName) { setOrgName(fields.title); newBadges.orgName = true }
          if (fields.issuer && !manuallyEdited.officeHeld) { setOfficeHeld(fields.issuer); newBadges.officeHeld = true }
          if (fields.specificRole && !manuallyEdited.orgPosition) { setOrgPosition(fields.specificRole); newBadges.orgPosition = true }
        } else if (catToApply.startsWith('A.3')) {
          if (fields.title && !manuallyEdited.seminarTitle) { setSeminarTitle(fields.title); newBadges.seminarTitle = true }
          if (fields.issuer && !manuallyEdited.organizerVenue) { setOrganizerVenue(fields.issuer); newBadges.organizerVenue = true }
          if (fields.scopeLevel && !manuallyEdited.scopeLevel) { setScopeLevel(fields.scopeLevel); newBadges.scopeLevel = true }
        } else if (catToApply.startsWith('B.1')) {
          if (fields.title && !manuallyEdited.eventTitle) { setEventTitle(fields.title); newBadges.eventTitle = true }
          if (fields.issuer && !manuallyEdited.sponsoringAgency) { setSponsoringAgency(fields.issuer); newBadges.sponsoringAgency = true }
          if (fields.specificRole && !manuallyEdited.speakerRole) { setSpeakerRole(fields.specificRole); newBadges.speakerRole = true }
          if (fields.scopeLevel && !manuallyEdited.scopeLevel) { setScopeLevel(fields.scopeLevel); newBadges.scopeLevel = true }
        } else if (catToApply.startsWith('B.2')) {
          if (fields.title && !manuallyEdited.pubTitle) { setPubTitle(fields.title); newBadges.pubTitle = true }
          if (fields.issuer && !manuallyEdited.publisherIssn) { setPublisherIssn(fields.issuer); newBadges.publisherIssn = true }
          if (fields.pubType && !manuallyEdited.pubType) { setPubType(fields.pubType); newBadges.pubType = true }
          if (fields.scopeLevel && !manuallyEdited.scopeLevel) { setScopeLevel(fields.scopeLevel); newBadges.scopeLevel = true }
        } else if (catToApply.startsWith('B.3')) {
          if (fields.title && !manuallyEdited.researchTitle) { setResearchTitle(fields.title); newBadges.researchTitle = true }
          if (fields.fundingStatus && !manuallyEdited.fundingStatus) { setFundingStatus(fields.fundingStatus); newBadges.fundingStatus = true }
          if (fields.specificRole && !manuallyEdited.researchRole) { setResearchRole(fields.specificRole); newBadges.researchRole = true }
        } else if (catToApply.startsWith('B.4')) {
          if (fields.title && !manuallyEdited.awardTitle) { setAwardTitle(fields.title); newBadges.awardTitle = true }
          if (fields.issuer && !manuallyEdited.conferringBody) { setConferringBody(fields.issuer); newBadges.conferringBody = true }
          if (fields.awardType && !manuallyEdited.awardType) { setAwardType(fields.awardType); newBadges.awardType = true }
          if (fields.scopeLevel && !manuallyEdited.scopeLevel) { setScopeLevel(fields.scopeLevel); newBadges.scopeLevel = true }
        } else if (catToApply.startsWith('B.5')) {
          if (fields.title && !manuallyEdited.materialTitle) { setMaterialTitle(fields.title); newBadges.materialTitle = true }
          if (fields.matType && !manuallyEdited.matType) { setMatType(fields.matType); newBadges.matType = true }
        } else if (catToApply.startsWith('B.6')) {
          if (fields.title && !manuallyEdited.creativeTitle) { setCreativeTitle(fields.title); newBadges.creativeTitle = true }
          if (fields.issuer && !manuallyEdited.exhibitionVenue) { setExhibitionVenue(fields.issuer); newBadges.exhibitionVenue = true }
        } else {
          if (fields.title && !manuallyEdited.serviceTitle) { setServiceTitle(fields.title); newBadges.serviceTitle = true }
          if (fields.issuer && !manuallyEdited.sponsoringOrg) { setSponsoringOrg(fields.issuer); newBadges.sponsoringOrg = true }
          if (fields.subType && !manuallyEdited.subType) { setSubType(fields.subType); newBadges.subType = true }
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

  // Advisory Classification & Suggested Points derived from Canonical Plan F Rules
  const advisoryClassification = AchievementClassificationService.classifyAchievement({
    category,
    degreeLevel,
    unitsCompleted,
    orgPosition,
    scopeLevel,
    speakerRole,
    pubType,
    fundingStatus,
    awardType,
    matType,
    subType
  }, ocrResult)

  const estimatedPts = advisoryClassification.suggestedPoints !== null && !isNaN(advisoryClassification.suggestedPoints)
    ? advisoryClassification.suggestedPoints
    : 0

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
    if (!attachedFile && !editingItem) {
      setError('Supporting Proof Document attachment (PDF/JPG/PNG) is required.')
      return
    }

    try {
      setIsSubmitting(true)
      const formattedDate = dateAchieved ? new Date(dateAchieved).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) : ''

      const newEntry = {
        title: resolvedTitle.trim(),
        issuer: resolvedIssuer.trim(),
        location: resolvedIssuer.trim(),
        date: formattedDate || dateAchieved,
        date_achieved: dateAchieved,
        academic_year: academicYear || inferAcademicYear(dateAchieved),
        category: category,
        scope_level: scopeLevel,
        claimed_points: estimatedPts,
        advisory_classification: {
          suggested_category: advisoryClassification.suggestedCategory,
          suggested_subcategory: advisoryClassification.suggestedSubcategory,
          criterion_code: advisoryClassification.criterionCode,
          suggested_points: advisoryClassification.suggestedPoints,
          is_advisory: true,
          is_ambiguous: advisoryClassification.isAmbiguous,
          matched_reason: advisoryClassification.matchedReason,
          rule_reference: advisoryClassification.ruleReference
        },
        status: 'Pending Review',
        description: description.trim(),
        attached_file_name: attachedFile ? attachedFile.name : (editingItem?.attached_file_name || 'proof_document.pdf'),
        ocr_metadata: ocrResult ? {
          extracted_category: ocrResult.detectedCategory,
          confidence_score: ocrResult.confidenceScore,
          matched_keywords: ocrResult.matchedKeywords,
          fields: ocrResult.fields,
          warnings: ocrResult.extractionWarnings
        } : null
      }

      if (onSubmitAccomplishment) {
        await onSubmitAccomplishment(newEntry, attachedFile)
      }

      setIsSubmitting(false)
      onClose()
    } catch (err) {
      setIsSubmitting(false)
      console.error('Submission error:', err)
      setError(err?.message || err?.error?.message || 'Failed to submit accomplishment. Please try again.')
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
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {editingItem ? 'Edit Accomplishment' : 'Log New Accomplishment'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EFF7F0] text-[#16834a] text-[11px] font-extrabold shadow-2xs border border-[#cbe6d2]">
                  NDMU Ranking Record
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Category-Tailored Fields • {academicYear ? `Academic Year (${academicYear})` : 'Date-Derived Academic Year'}
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

        {/* Advisory Duplicate Warning Banner (Non-blocking) */}
        {(() => {
          const { title: curTitle, issuer: curIssuer } = getNormalizedTitleAndIssuer()
          const dup = PersonnelAchievementController.checkDuplicateWarning(
            { title: curTitle, date_achieved: dateAchieved, issuer: curIssuer },
            existingAchievements
          )
          if (dup.isDuplicate && !editingItem) {
            return (
              <div className="mx-5 mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium flex items-center gap-2.5 shrink-0 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span><strong>Advisory:</strong> {dup.warningMessage}</span>
              </div>
            )
          }
          return null
        })()}

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
                Extracting text → Suggesting NDMU Category → Auto-filling fields without fabrication...
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
                  Suggested Category: <strong className="text-emerald-950">{ocrResult.detectedCategory || 'Manual Selection Required'}</strong> • You can freely edit or clear any field.
                </p>
                {ocrResult.extractionWarnings?.length > 0 && (
                  <p className="text-[10px] text-amber-800 mt-1 italic">
                    ℹ {ocrResult.extractionWarnings[0]}
                  </p>
                )}
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

          {/* ================= STEP 1: UPLOAD & OCR SCAN CERTIFICATE ================= */}
          <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#16834a] text-white flex items-center justify-center font-extrabold text-[11px]">
                  1
                </div>
                <span className="font-extrabold text-slate-800 text-xs">Supporting Proof Document</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">PDF, JPG, PNG (Max 10MB)</span>
            </div>

            <label className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition ${
              attachedFile ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-300 hover:border-[#16834a] bg-white'
            }`}>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              {attachedFile ? (
                <div className="flex items-center gap-3 text-left w-full">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{attachedFile.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {(attachedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for secure backend persistence
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-[11px] shrink-0">
                    Attached
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto stroke-[1.5]" />
                  <p className="font-bold text-slate-700">Click to upload official certificate or evidence</p>
                  <p className="text-[11px] text-slate-400 font-medium">Automatic OCR will inspect text & suggest category</p>
                </div>
              )}
            </label>
            {requiredProofHint && (
              <p className="text-[11px] text-slate-500 italic">
                * Suggested proof: {requiredProofHint}
              </p>
            )}
          </div>

          {/* ================= STEP 2: CATEGORY SELECTION ================= */}
          <div className="space-y-2">
            <ReqLabel 
              label="2. Select Evaluation Category" 
              value={category} 
              isOcrAutoFilled={ocrBadges.category}
              isManuallyEdited={manuallyEdited.category}
            />
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                markFieldEdited('category')
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-[#16834a]/20 focus:border-[#16834a] outline-hidden cursor-pointer"
            >
              <optgroup label="Area A: Professional Development (70 Pts Max)">
                <option value="A.1 Degree/s">A.1 Degrees & Advanced Units</option>
                <option value="A.2 Active Membership to Prof Orgs">A.2 Active Membership to Professional Organizations</option>
                <option value="A.3 Attendance to Seminars/Trainings">A.3 Attendance to Seminars & Trainings</option>
              </optgroup>
              <optgroup label="Area B: Productivity & Creative Work (50 Pts Max)">
                <option value="B.1 Guest Lecturer / Consultant / Judge">B.1 Lectures, Speakerships & Consultancy</option>
                <option value="B.2 Publication">B.2 Scholarly Publications (Journals, Books, Articles)</option>
                <option value="B.3 Conduct of Research">B.3 Conduct of Research Projects</option>
                <option value="B.4 Professional Recognition or Awards">B.4 Professional Recognitions & Awards</option>
                <option value="B.5 Production of Instructional Materials">B.5 Instructional Materials / Manuals</option>
                <option value="B.6 Creative Work">B.6 Creative Work & Exhibitions</option>
              </optgroup>
              <optgroup label="Area C: Service & Leadership (40 Pts Max)">
                <option value="C.1 Extra-Curricular Activities">C.1 Institutional Service & Committees</option>
                <option value="C.2 Community Involvement">C.2 Community & Extension Involvement</option>
              </optgroup>
            </select>
          </div>

          {/* ================= STEP 3: CATEGORY-SPECIFIC ADAPTIVE FIELDS ================= */}
          <div className="p-4 rounded-3xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
            <div className="font-extrabold text-slate-800 text-xs flex items-center justify-between">
              <span>3. Fill Required Details ({category})</span>
              <span className="text-[11px] font-semibold text-[#16834a]">
                ~{estimatedPts} Provisional Pts (Advisory)
              </span>
            </div>

            {/* A.1 Degrees */}
            {category.startsWith('A.1') && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <ReqLabel 
                      label="Degree Level" 
                      value={degreeLevel} 
                      isOcrAutoFilled={ocrBadges.degreeLevel}
                      isManuallyEdited={manuallyEdited.degreeLevel}
                    />
                    <select
                      value={degreeLevel}
                      onChange={(e) => { setDegreeLevel(e.target.value); markFieldEdited('degreeLevel') }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                    >
                      <option value="">-- Select Degree Level --</option>
                      <option value="Ph.D. Degree Holder">Ph.D. / Doctoral Degree Holder (40 Pts)</option>
                      <option value="Ph.D. Units">Ph.D. Completed Units (2 Pts / 3 Units)</option>
                      <option value="Master's Degree Holder">Master's Degree Holder (20 Pts)</option>
                      <option value="Master's Units">Master's Completed Units (1 Pt / 3 Units)</option>
                    </select>
                  </div>
                  <div>
                    <ReqLabel 
                      label="Units Completed" 
                      value={unitsCompleted} 
                      isManuallyEdited={manuallyEdited.unitsCompleted}
                    />
                    <input
                      type="number"
                      value={unitsCompleted}
                      onChange={(e) => { setUnitsCompleted(e.target.value); markFieldEdited('unitsCompleted') }}
                      placeholder="e.g. 18"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <ReqLabel 
                    label="Official Degree Title" 
                    value={degreeTitle} 
                    isOcrAutoFilled={ocrBadges.degreeTitle}
                    isManuallyEdited={manuallyEdited.degreeTitle}
                  />
                  <input
                    type="text"
                    value={degreeTitle}
                    onChange={(e) => { setDegreeTitle(e.target.value); markFieldEdited('degreeTitle') }}
                    placeholder="e.g. Doctor of Philosophy in Computer Science"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <ReqLabel 
                    label="Conferring University / Institution" 
                    value={institution} 
                    isOcrAutoFilled={ocrBadges.institution}
                    isManuallyEdited={manuallyEdited.institution}
                  />
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => { setInstitution(e.target.value); markFieldEdited('institution') }}
                    placeholder="e.g. Notre Dame of Marbel University"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                  />
                </div>
              </div>
            )}

            {/* A.2 Membership */}
            {category.startsWith('A.2') && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <ReqLabel 
                      label="Organization Name" 
                      value={orgName} 
                      isOcrAutoFilled={ocrBadges.orgName}
                      isManuallyEdited={manuallyEdited.orgName}
                    />
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => { setOrgName(e.target.value); markFieldEdited('orgName') }}
                      placeholder="e.g. Philippine Computer Society (PCS)"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <ReqLabel 
                      label="Position / Role" 
                      value={orgPosition} 
                      isOcrAutoFilled={ocrBadges.orgPosition}
                      isManuallyEdited={manuallyEdited.orgPosition}
                    />
                    <select
                      value={orgPosition}
                      onChange={(e) => { setOrgPosition(e.target.value); markFieldEdited('orgPosition') }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                    >
                      <option value="">-- Select Role --</option>
                      <option value="Officer">Officer / Board Member (10 Pts)</option>
                      <option value="Member">Regular Active Member (5 Pts)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* A.3 Seminars */}
            {category.startsWith('A.3') && (
              <div className="space-y-3">
                <div>
                  <ReqLabel 
                    label="Seminar / Training Title" 
                    value={seminarTitle} 
                    isOcrAutoFilled={ocrBadges.seminarTitle}
                    isManuallyEdited={manuallyEdited.seminarTitle}
                  />
                  <input
                    type="text"
                    value={seminarTitle}
                    onChange={(e) => { setSeminarTitle(e.target.value); markFieldEdited('seminarTitle') }}
                    placeholder="e.g. Regional Training on AI Curriculum Integration"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <ReqLabel 
                      label="Organizer / Venue" 
                      value={organizerVenue} 
                      isOcrAutoFilled={ocrBadges.organizerVenue}
                      isManuallyEdited={manuallyEdited.organizerVenue}
                    />
                    <input
                      type="text"
                      value={organizerVenue}
                      onChange={(e) => { setOrganizerVenue(e.target.value); markFieldEdited('organizerVenue') }}
                      placeholder="e.g. CHED / NDMU CITE"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <ReqLabel 
                      label="Scope Level" 
                      value={scopeLevel} 
                      isOcrAutoFilled={ocrBadges.scopeLevel}
                      isManuallyEdited={manuallyEdited.scopeLevel}
                    />
                    <select
                      value={scopeLevel}
                      onChange={(e) => { setScopeLevel(e.target.value); markFieldEdited('scopeLevel') }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                    >
                      <option value="">-- Select Scope --</option>
                      <option value="International">International (10 Pts)</option>
                      <option value="National">National (8 Pts)</option>
                      <option value="Regional">Regional (6 Pts)</option>
                      <option value="City / Local">City / Local (4 Pts)</option>
                      <option value="In-House">In-House / Institutional (3 Pts)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* B.1 Speaker / Talk */}
            {category.startsWith('B.1') && (
              <div className="space-y-3">
                <div>
                  <ReqLabel 
                    label="Event / Lecture Title" 
                    value={eventTitle} 
                    isOcrAutoFilled={ocrBadges.eventTitle}
                    isManuallyEdited={manuallyEdited.eventTitle}
                  />
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => { setEventTitle(e.target.value); markFieldEdited('eventTitle') }}
                    placeholder="e.g. Keynote on Predictive Student Analytics"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <ReqLabel 
                      label="Speaker / Engagement Role" 
                      value={speakerRole} 
                      isOcrAutoFilled={ocrBadges.speakerRole}
                      isManuallyEdited={manuallyEdited.speakerRole}
                    />
                    <select
                      value={speakerRole}
                      onChange={(e) => { setSpeakerRole(e.target.value); markFieldEdited('speakerRole') }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                    >
                      <option value="">-- Select Role --</option>
                      <option value="Keynote Speaker">Keynote Speaker (10 Pts)</option>
                      <option value="Resource Person">Resource Person / Lecturer (8 Pts)</option>
                      <option value="Facilitator">Facilitator / Trainer (6 Pts)</option>
                      <option value="Judge">Judge / Panelist (5 Pts)</option>
                    </select>
                  </div>
                  <div>
                    <ReqLabel 
                      label="Sponsoring Agency" 
                      value={sponsoringAgency} 
                      isOcrAutoFilled={ocrBadges.sponsoringAgency}
                      isManuallyEdited={manuallyEdited.sponsoringAgency}
                    />
                    <input
                      type="text"
                      value={sponsoringAgency}
                      onChange={(e) => { setSponsoringAgency(e.target.value); markFieldEdited('sponsoringAgency') }}
                      placeholder="e.g. DOST / CHED"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* B.2 Publication */}
            {category.startsWith('B.2') && (
              <div className="space-y-3">
                <div>
                  <ReqLabel 
                    label="Publication / Paper Title" 
                    value={pubTitle} 
                    isOcrAutoFilled={ocrBadges.pubTitle}
                    isManuallyEdited={manuallyEdited.pubTitle}
                  />
                  <input
                    type="text"
                    value={pubTitle}
                    onChange={(e) => { setPubTitle(e.target.value); markFieldEdited('pubTitle') }}
                    placeholder="e.g. Machine Learning Frameworks in Higher Education Analytics"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <ReqLabel 
                      label="Publisher / Journal / ISSN" 
                      value={publisherIssn} 
                      isOcrAutoFilled={ocrBadges.publisherIssn}
                      isManuallyEdited={manuallyEdited.publisherIssn}
                    />
                    <input
                      type="text"
                      value={publisherIssn}
                      onChange={(e) => { setPublisherIssn(e.target.value); markFieldEdited('publisherIssn') }}
                      placeholder="e.g. IEEE Access Journal (Scopus)"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <ReqLabel 
                      label="Publication Type" 
                      value={pubType} 
                      isOcrAutoFilled={ocrBadges.pubType}
                      isManuallyEdited={manuallyEdited.pubType}
                    />
                    <select
                      value={pubType}
                      onChange={(e) => { setPubType(e.target.value); markFieldEdited('pubType') }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                    >
                      <option value="">-- Select Type --</option>
                      <option value="Scholarly Paper">Scholarly Paper / Journal Article (5 Pts)</option>
                      <option value="Book">Published Book / Monograph (5 Pts)</option>
                      <option value="Article">Professional / Trade Article (4 Pts)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* B.3 Research */}
            {category.startsWith('B.3') && (
              <div className="space-y-3">
                <div>
                  <ReqLabel 
                    label="Research Project Title" 
                    value={researchTitle} 
                    isOcrAutoFilled={ocrBadges.researchTitle}
                    isManuallyEdited={manuallyEdited.researchTitle}
                  />
                  <input
                    type="text"
                    value={researchTitle}
                    onChange={(e) => { setResearchTitle(e.target.value); markFieldEdited('researchTitle') }}
                    placeholder="e.g. Predictive Retention Modeling for Marist Scholars"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <ReqLabel 
                      label="Funding / Completion Status" 
                      value={fundingStatus} 
                      isOcrAutoFilled={ocrBadges.fundingStatus}
                      isManuallyEdited={manuallyEdited.fundingStatus}
                    />
                    <select
                      value={fundingStatus}
                      onChange={(e) => { setFundingStatus(e.target.value); markFieldEdited('fundingStatus') }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                    >
                      <option value="">-- Select Status --</option>
                      <option value="Externally Funded Research Project">Externally Funded Project (20 Pts)</option>
                      <option value="Completed Institutional Research">Completed Institutional Research (15 Pts)</option>
                      <option value="Departmental Research">Departmental Research (10 Pts)</option>
                    </select>
                  </div>
                  <div>
                    <ReqLabel 
                      label="Research Role" 
                      value={researchRole} 
                      isManuallyEdited={manuallyEdited.researchRole}
                    />
                    <select
                      value={researchRole}
                      onChange={(e) => { setResearchRole(e.target.value); markFieldEdited('researchRole') }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                    >
                      <option value="">-- Select Role --</option>
                      <option value="Lead Researcher">Lead Researcher / Principal Investigator</option>
                      <option value="Co-Researcher">Co-Researcher</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* B.4 Awards */}
            {category.startsWith('B.4') && (
              <div className="space-y-3">
                <div>
                  <ReqLabel 
                    label="Award / Recognition Title" 
                    value={awardTitle} 
                    isOcrAutoFilled={ocrBadges.awardTitle}
                    isManuallyEdited={manuallyEdited.awardTitle}
                  />
                  <input
                    type="text"
                    value={awardTitle}
                    onChange={(e) => { setAwardTitle(e.target.value); markFieldEdited('awardTitle') }}
                    placeholder="e.g. Outstanding Research Faculty of the Year"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <ReqLabel 
                      label="Conferring Body" 
                      value={conferringBody} 
                      isOcrAutoFilled={ocrBadges.conferringBody}
                      isManuallyEdited={manuallyEdited.conferringBody}
                    />
                    <input
                      type="text"
                      value={conferringBody}
                      onChange={(e) => { setConferringBody(e.target.value); markFieldEdited('conferringBody') }}
                      placeholder="e.g. Notre Dame of Marbel University"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <ReqLabel 
                      label="Scope Level" 
                      value={scopeLevel} 
                      isOcrAutoFilled={ocrBadges.scopeLevel}
                      isManuallyEdited={manuallyEdited.scopeLevel}
                    />
                    <select
                      value={scopeLevel}
                      onChange={(e) => { setScopeLevel(e.target.value); markFieldEdited('scopeLevel') }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                    >
                      <option value="">-- Select Scope --</option>
                      <option value="National">National / International (40 Pts)</option>
                      <option value="Regional">Regional (30 Pts)</option>
                      <option value="Institutional">Institutional (10 Pts)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Fallback Categories B.5, B.6, C.1, C.2 */}
            {(category.startsWith('B.5') || category.startsWith('B.6') || category.startsWith('C.')) && (
              <div className="space-y-3">
                <div>
                  <ReqLabel 
                    label="Activity / Output Title" 
                    value={serviceTitle || materialTitle || creativeTitle} 
                    isManuallyEdited={manuallyEdited.serviceTitle || manuallyEdited.materialTitle || manuallyEdited.creativeTitle}
                  />
                  <input
                    type="text"
                    value={serviceTitle || materialTitle || creativeTitle}
                    onChange={(e) => {
                      setServiceTitle(e.target.value)
                      setMaterialTitle(e.target.value)
                      setCreativeTitle(e.target.value)
                      markFieldEdited('serviceTitle')
                    }}
                    placeholder="e.g. Koronadal City LGU Digital Governance Extension Project"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <ReqLabel 
                    label="Sponsoring / Beneficiary Entity" 
                    value={sponsoringOrg || courseUsedIn || exhibitionVenue} 
                    isManuallyEdited={manuallyEdited.sponsoringOrg}
                  />
                  <input
                    type="text"
                    value={sponsoringOrg || courseUsedIn || exhibitionVenue}
                    onChange={(e) => {
                      setSponsoringOrg(e.target.value)
                      setCourseUsedIn(e.target.value)
                      setExhibitionVenue(e.target.value)
                      markFieldEdited('sponsoringOrg')
                    }}
                    placeholder="e.g. City Government of Koronadal"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ================= STEP 4: DATE ACHIEVED & ACADEMIC YEAR ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <ReqLabel 
                label="4. Date Achieved / Conferred" 
                value={dateAchieved} 
                isOcrAutoFilled={ocrBadges.dateAchieved}
                isManuallyEdited={manuallyEdited.dateAchieved}
              />
              <input
                type="date"
                value={dateAchieved}
                onChange={handleDateChange}
                className="w-full px-3 py-2 rounded-2xl bg-white border border-slate-200 font-medium text-slate-800 text-xs focus:ring-2 focus:ring-[#16834a]/20 focus:border-[#16834a] outline-hidden cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Derived Academic Year
              </label>
              <div className="px-3.5 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 font-bold text-slate-800 text-xs min-h-[38px] flex items-center">
                {academicYear || <span className="text-slate-400 font-normal italic">Derived after date entry</span>}
              </div>
            </div>
          </div>

          {/* ================= STEP 5: OPTIONAL NARRATIVE DESCRIPTION ================= */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              5. Brief Narrative / Impact Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context regarding outcomes, participants, or scope..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 font-medium text-slate-800 text-xs focus:ring-2 focus:ring-[#16834a]/20 focus:border-[#16834a] outline-hidden resize-none"
            />
          </div>

          {/* ================= MODAL FOOTER ================= */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || (!attachedFile && !editingItem)}
              className={`px-5 py-2.5 rounded-2xl text-white text-xs font-extrabold flex items-center gap-2 transition shadow-md cursor-pointer ${
                isSubmitting || (!attachedFile && !editingItem)
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-[#16834a] hover:bg-[#236e3e]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Securing & Persisting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingItem ? 'Save Changes' : 'Submit Accomplishment'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
