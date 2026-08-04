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
  ShieldCheck
} from 'lucide-react'

import RankingCriteriaModel from '../../models/RankingCriteriaModel.js'
import SecurityController from '../../controllers/SecurityController.js'

// Helper component for required field labels (Red Asterisk when unfilled -> Green Checkmark when filled)
const ReqLabel = ({ label, value }) => {
  const isFilled = value !== undefined && value !== null && String(value).trim() !== ''
  return (
    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
      <span>{label}</span>
      {isFilled ? (
        <span className="text-[#2d8a4e] text-[11px] font-extrabold flex items-center gap-0.5" title="Field Requirement Completed">
          <Check className="w-3.5 h-3.5 text-[#2d8a4e] stroke-[3]" />
        </span>
      ) : (
        <span className="text-rose-500 font-extrabold text-xs" title="Required Field">*</span>
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

  // System States
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

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

  // Enhanced Security File Upload Handler (10MB Limit + Magic Byte Binary Inspection + Filename Sanitization)
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
    if (category.startsWith('B.5')) return { title: materialTitle || 'Instructional Material', issuer: courseUsedIn || 'Department' }
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
            <div className="w-10 h-10 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Log New Accomplishment</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#1b4332] text-amber-300 text-[11px] font-extrabold shadow-2xs border border-emerald-700/50">
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

        {/* ================= CATEGORY-TAILORED ADAPTIVE FORM SCROLLABLE BODY ================= */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          {/* CATEGORY SELECTOR AT VERY TOP */}
          <div>
            <ReqLabel label="Category (NDMU Rating Sheet)" value={category} />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-emerald-50/40 text-xs font-bold text-[#1b4332] focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 outline-none transition"
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
                  <ReqLabel label="Degree Level" value={degreeLevel} />
                  <select
                    value={degreeLevel}
                    onChange={(e) => setDegreeLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-[#2d8a4e]"
                  >
                    <option value="Ph.D. Degree Holder">Ph.D. Degree Holder (40 pts)</option>
                    <option value="Ph.D. Units">Ph.D. Units Earned (2 pts / 3 units)</option>
                    <option value="Master's Degree Holder">Master's Degree Holder (20 pts)</option>
                    <option value="Master's Units">Master's Units Earned (1 pt / 3 units)</option>
                  </select>
                </div>

                <div>
                  <ReqLabel label="Degree Program / Specialization" value={degreeTitle} />
                  <input
                    type="text"
                    value={degreeTitle}
                    onChange={(e) => setDegreeTitle(e.target.value)}
                    placeholder="e.g. Ph.D. in Computer Science / MA in Education"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#2d8a4e]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={degreeLevel.includes('Units') ? '' : 'sm:col-span-2'}>
                  <ReqLabel label="University / Conferring Institution" value={institution} />
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Ateneo de Manila University"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#2d8a4e]"
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
                  <ReqLabel label="Organization Name" value={orgName} />
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Philippine Computer Society (PCS) / PSITE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#2d8a4e]"
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
                    <option value="Member">Regular Member (5 pts)</option>
                    <option value="Officer">Officer / Board Member (10 pts)</option>
                  </select>
                </div>
              </div>

              {orgPosition === 'Officer' && (
                <div>
                  <ReqLabel label="Specific Office Held" value={officeHeld} />
                  <input
                    type="text"
                    value={officeHeld}
                    onChange={(e) => setOfficeHeld(e.target.value)}
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
                <ReqLabel label="Seminar / Training Title" value={seminarTitle} />
                <input
                  type="text"
                  value={seminarTitle}
                  onChange={(e) => setSeminarTitle(e.target.value)}
                  placeholder="e.g. National AI & Cloud Computing Faculty Development Workshop"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#2d8a4e]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <ReqLabel label="Organizer / Issuing Entity & Venue" value={organizerVenue} />
                  <input
                    type="text"
                    value={organizerVenue}
                    onChange={(e) => setOrganizerVenue(e.target.value)}
                    placeholder="e.g. CHED Region XII / NDMU Campus"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                    required
                  />
                </div>

                <div>
                  <ReqLabel label="Geographic Scope" value={scopeLevel} />
                  <select
                    value={scopeLevel}
                    onChange={(e) => setScopeLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                  >
                    <option value="In-House">In-House (NDMU) (3 pts)</option>
                    <option value="Local">City / Provincial (4 pts)</option>
                    <option value="Regional">Regional (6 pts)</option>
                    <option value="National">National (8 pts)</option>
                    <option value="International">International (10 pts)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* B.1 SPEAKER / CONSULTANCY TAILORED INPUTS */}
          {category.startsWith('B.1') && (
            <div className="space-y-3 animate-in fade-in">
              <div>
                <ReqLabel label="Event / Activity Title" value={eventTitle} />
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Keynote Address on Machine Learning in Higher Ed Analytics"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#2d8a4e]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <ReqLabel label="Role Played" value={speakerRole} />
                  <select
                    value={speakerRole}
                    onChange={(e) => setSpeakerRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                  >
                    <option value="Keynote Speaker">Keynote Speaker (10 pts)</option>
                    <option value="Resource Person">Resource Person / Consultant (8 pts)</option>
                    <option value="Facilitator">Facilitator / Organizer (6 pts)</option>
                    <option value="Judge">Judge / Evaluator (5 pts)</option>
                    <option value="Reactor">Reactor / Panelist (3 pts)</option>
                  </select>
                </div>

                <div>
                  <ReqLabel label="Sponsoring Agency / Venue" value={sponsoringAgency} />
                  <input
                    type="text"
                    value={sponsoringAgency}
                    onChange={(e) => setSponsoringAgency(e.target.value)}
                    placeholder="e.g. DOST Region XII / Ateneo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                    required
                  />
                </div>

                <div>
                  <ReqLabel label="Scope Level" value={scopeLevel} />
                  <select
                    value={scopeLevel}
                    onChange={(e) => setScopeLevel(e.target.value)}
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
                <ReqLabel label="Title of Published Work / Book" value={pubTitle} />
                <input
                  type="text"
                  value={pubTitle}
                  onChange={(e) => setPubTitle(e.target.value)}
                  placeholder="e.g. Predictive Student Performance Modeling Using Deep Learning"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#2d8a4e]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <ReqLabel label="Type of Publication" value={pubType} />
                  <select
                    value={pubType}
                    onChange={(e) => setPubType(e.target.value)}
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
                  <ReqLabel label="Publisher & ISSN/ISBN" value={publisherIssn} />
                  <input
                    type="text"
                    value={publisherIssn}
                    onChange={(e) => setPublisherIssn(e.target.value)}
                    placeholder="e.g. IEEE Access / ISSN: 2169-3536"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                    required
                  />
                </div>

                <div>
                  <ReqLabel label="Publication Reach" value={scopeLevel} />
                  <select
                    value={scopeLevel}
                    onChange={(e) => setScopeLevel(e.target.value)}
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
                <ReqLabel label="Research Project Title" value={researchTitle} />
                <input
                  type="text"
                  value={researchTitle}
                  onChange={(e) => setResearchTitle(e.target.value)}
                  placeholder="e.g. AI-Driven Student Retention & Early Warning Analytics Framework"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#2d8a4e]"
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
                  <ReqLabel label="Funding Status" value={fundingStatus} />
                  <select
                    value={fundingStatus}
                    onChange={(e) => setFundingStatus(e.target.value)}
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
                <ReqLabel label="Award Title / Honor Received" value={awardTitle} />
                <input
                  type="text"
                  value={awardTitle}
                  onChange={(e) => setAwardTitle(e.target.value)}
                  placeholder="e.g. NDMU Outstanding Research Faculty of the Year"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#2d8a4e]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <ReqLabel label="Conferring Body / Institution" value={conferringBody} />
                  <input
                    type="text"
                    value={conferringBody}
                    onChange={(e) => setConferringBody(e.target.value)}
                    placeholder="e.g. Notre Dame of Marbel University"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                    required
                  />
                </div>

                <div>
                  <ReqLabel label="Recognition Type" value={awardType} />
                  <select
                    value={awardType}
                    onChange={(e) => setAwardType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                  >
                    <option value="Awardee">Awardee / Recipient</option>
                    <option value="Nominee">Nominee</option>
                  </select>
                </div>

                <div>
                  <ReqLabel label="Award Scope" value={scopeLevel} />
                  <select
                    value={scopeLevel}
                    onChange={(e) => setScopeLevel(e.target.value)}
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
                <ReqLabel label="Title of Material" value={materialTitle} />
                <input
                  type="text"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  placeholder="e.g. Bound Laboratory Exercises Manual for Artificial Intelligence"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#2d8a4e]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <ReqLabel label="Material Type" value={matType} />
                  <select
                    value={matType}
                    onChange={(e) => setMatType(e.target.value)}
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
                <ReqLabel label="Description / Title of Creative Output" value={creativeTitle} />
                <input
                  type="text"
                  value={creativeTitle}
                  onChange={(e) => setCreativeTitle(e.target.value)}
                  placeholder="e.g. University Digital Archiving Software / Artistic Performance"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#2d8a4e]"
                  required
                />
              </div>

              <div>
                <ReqLabel label="Venue / Exhibition / Medium" value={exhibitionVenue} />
                <input
                  type="text"
                  value={exhibitionVenue}
                  onChange={(e) => setExhibitionVenue(e.target.value)}
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
                <ReqLabel label="Service Sub-Type" value={subType} />
                <select
                  value={subType}
                  onChange={(e) => setSubType(e.target.value)}
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
                  <ReqLabel label="Name of Club / Service Project" value={serviceTitle} />
                  <input
                    type="text"
                    value={serviceTitle}
                    onChange={(e) => setServiceTitle(e.target.value)}
                    placeholder="e.g. Computer Science Student Society / Barangay Smart Literacy Outreach"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#2d8a4e]"
                    required
                  />
                </div>

                <div>
                  <ReqLabel label="Sponsoring LGU / NGO / Institution" value={sponsoringOrg} />
                  <input
                    type="text"
                    value={sponsoringOrg}
                    onChange={(e) => setSponsoringOrg(e.target.value)}
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
            <ReqLabel label={`Date Achieved / Conferred (Auto AY: ${academicYear})`} value={dateAchieved} />
            <input
              type="date"
              value={dateAchieved}
              onChange={handleDateChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-[#2d8a4e] outline-none transition"
              required
            />
          </div>

          {/* INLINE PROOF ATTACHMENT BOX WITH LIVE HINT */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <ReqLabel label="Supporting Proof Attachment" value={attachedFile} />
              <span className="text-[11px] font-bold text-emerald-700">PDF / JPG / PNG (Max 10MB)</span>
            </div>

            {/* Proof Hint Banner */}
            <div className="mb-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#1e5831] text-[11px] font-semibold flex items-center gap-2">
              <Paperclip className="w-3.5 h-3.5 text-[#2d8a4e] shrink-0" />
              <span><strong>Required Evidence:</strong> {requiredProofHint}</span>
            </div>

            <div className="relative border-2 border-dashed border-slate-200 hover:border-[#2d8a4e] rounded-2xl p-4 text-center transition bg-slate-50/50 hover:bg-[#eef7f0]/30 cursor-pointer group">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#2d8a4e] group-hover:scale-110 transition shadow-2xs">
                  <UploadCloud className="w-5 h-5" />
                </div>
                {attachedFile ? (
                  <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Attached: {attachedFile.name} ({(attachedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-800">Drag & drop certificate here or click to browse</p>
                    <p className="text-[11px] text-slate-400">PDF, PNG, JPG up to 10MB</p>
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
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none transition focus:border-[#2d8a4e]"
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
              className="px-6 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-bold flex items-center gap-2 transition shadow-md disabled:opacity-50 cursor-pointer"
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
