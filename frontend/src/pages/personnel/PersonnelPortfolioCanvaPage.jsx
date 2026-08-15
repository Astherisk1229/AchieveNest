import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { 
  X,
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  Award, 
  Printer,
  Paperclip,
  FolderTree,
  CheckCircle2,
  Layers
} from 'lucide-react'

export default function PersonnelPortfolioCanvaPage({ isOpen, onClose, portfolio, user = {} }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const canvasRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const pageRefs = useRef({})
  const isScrollSyncing = useRef(false)

  // User Profile Metadata
  const facultyName = user.name || 'Dr. Maria Santos'
  const employeeId = user.employee_id || 'EMP-2021-0842'
  const department = user.department_name || 'College of Information Technology'
  const academicRank = user.rank || 'Associate Professor II'
  const academicYear = portfolio?.academic_year || 'AY 2026-2027'
  const status = portfolio?.status || 'HR APPROVED'

  // Comprehensive Category-Tailored Items
  const items = useMemo(() => portfolio?.items || [
    { 
      id: 1, area_key: 'A', category_code: 'A.1',
      category_name: 'A.1 Educational Qualifications / Degrees',
      title: 'Ph.D. in Computer Science', issuer: 'Ateneo de Manila University', 
      date: 'May 20, 2024', status: 'Verified',
      tailored_fields: [
        { label: 'Degree Level', value: 'Ph.D. Degree Holder' },
        { label: 'Specialization / Field', value: 'Artificial Intelligence & Educational Data Mining' },
        { label: 'Conferring University', value: 'Ateneo de Manila University' },
        { label: 'Date Conferred', value: 'May 20, 2024' }
      ],
      description: 'Doctor of Philosophy degree completed with distinction. Dissertation focused on predictive AI models for student learning analytics.',
      proof_file: 'phd_diploma_ateneo_santos.pdf',
      proof_preview_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80'
    },
    { 
      id: 2, area_key: 'A', category_code: 'A.2',
      category_name: 'A.2 Active Membership in Professional Orgs',
      title: 'Philippine Computer Society (PCS)', issuer: 'PCS National Executive Board', 
      date: 'AY 2025-2026', status: 'Verified',
      tailored_fields: [
        { label: 'Organization Name', value: 'Philippine Computer Society (PCS)' },
        { label: 'Position / Role Held', value: 'Officer / Board Member' },
        { label: 'Office Held', value: 'Vice President for External Affairs' },
        { label: 'Period Covered', value: 'AY 2025-2026' }
      ],
      description: 'Active national officer coordinating IT industry linkage and regional computer science symposiums.',
      proof_file: 'pcs_officer_appointment_letter.pdf',
      proof_preview_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80'
    },
    { 
      id: 3, area_key: 'A', category_code: 'A.3',
      category_name: 'A.3 Attendance to Seminars & Workshops',
      title: 'CHED Regional Training on AI Curriculum Integration', issuer: 'CHED Region XII / NDMU Campus', 
      date: 'Mar 20, 2026', status: 'Verified',
      tailored_fields: [
        { label: 'Seminar / Workshop Title', value: 'CHED Regional Training on AI Curriculum Integration' },
        { label: 'Organizer & Venue', value: 'CHED Region XII / NDMU CITE Lab' },
        { label: 'Geographic Scope', value: 'Regional (Region XII)' },
        { label: 'Date Conducted', value: 'Mar 20, 2026 (40 Hours Training)' }
      ],
      description: 'Completed 40-hour intensive faculty development workshop on integrating generative AI tools into IT outcome-based syllabi.',
      proof_file: 'ched_ai_workshop_certificate.pdf',
      proof_preview_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80'
    },
    { 
      id: 4, area_key: 'B', category_code: 'B.1',
      category_name: 'B.1 Guest Lecturer / Resource Person / Consultant',
      title: 'Keynote Speaker: Regional AI in Education Summit', issuer: 'DOST Region XII & Mindanao State University', 
      date: 'Feb 28, 2026', status: 'Verified',
      tailored_fields: [
        { label: 'Event / Activity Title', value: 'Keynote Address on Machine Learning in Higher Ed' },
        { label: 'Role Played', value: 'Keynote Speaker' },
        { label: 'Sponsoring Agency / Venue', value: 'DOST Region XII / MSU General Santos' },
        { label: 'Scope / Level', value: 'Regional' }
      ],
      description: 'Delivered keynote lecture to over 300 faculty delegates on ethical AI deployment in university assessments.',
      proof_file: 'dost_keynote_certificate_invitation.pdf',
      proof_preview_url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80'
    },
    { 
      id: 5, area_key: 'B', category_code: 'B.2',
      category_name: 'B.2 Publication (Scholarly Papers, Books, Articles)',
      title: 'Machine Learning Frameworks in Higher Education Analytics', issuer: 'IEEE Access Journal (Scopus Indexed)', 
      date: 'Apr 15, 2026', status: 'Verified',
      tailored_fields: [
        { label: 'Title of Published Work', value: 'Machine Learning Frameworks in Higher Education Analytics' },
        { label: 'Publication Type', value: 'Scholarly Paper / Journal Article' },
        { label: 'Publisher & ISSN', value: 'IEEE Access Journal / ISSN 2169-3536' },
        { label: 'Reach / Scope', value: 'International / Scopus Indexed' }
      ],
      description: 'Peer-reviewed research publication investigating predictive analytics frameworks for student retention and early academic warning systems.',
      proof_file: 'ieee_access_publication_santos.pdf',
      proof_preview_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
    },
    { 
      id: 6, area_key: 'B', category_code: 'B.3',
      category_name: 'B.3 Conduct of Research Projects',
      title: 'AI-Driven Student Retention Framework for NDMU', issuer: 'NDMU University Research Office', 
      date: 'Dec 15, 2025', status: 'Verified',
      tailored_fields: [
        { label: 'Research Project Title', value: 'AI-Driven Student Retention Framework for NDMU' },
        { label: 'Research Role', value: 'Lead Researcher' },
        { label: 'Funding Status / Source', value: 'Completed Institutional Grant (NDMU URO)' },
        { label: 'Completion Date', value: 'Dec 15, 2025' }
      ],
      description: 'Completed 1-year institutional research project developing automated intervention alerts for at-risk students.',
      proof_file: 'ndmu_research_completion_report.pdf',
      proof_preview_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80'
    },
    { 
      id: 7, area_key: 'B', category_code: 'B.4',
      category_name: 'B.4 Professional Recognition or Awards',
      title: 'NDMU Outstanding Research Faculty of the Year', issuer: 'Notre Dame of Marbel University', 
      date: 'Jan 10, 2026', status: 'Verified',
      tailored_fields: [
        { label: 'Award Title / Honor Received', value: 'NDMU Outstanding Research Faculty of the Year' },
        { label: 'Conferring Institution', value: 'Notre Dame of Marbel University' },
        { label: 'Recognition Type', value: 'Awardee' },
        { label: 'Award Scope', value: 'Institutional Award' }
      ],
      description: 'Conferred during NDMU University Foundation Day in recognition of highest Scopus publication output and research citations.',
      proof_file: 'outstanding_faculty_award_2026.pdf',
      proof_preview_url: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&auto=format&fit=crop&q=80'
    },
    { 
      id: 8, area_key: 'B', category_code: 'B.5',
      category_name: 'B.5 Production of Instructional Materials',
      title: 'Laboratory Workbook for Applied Data Structures', issuer: 'NDMU CITE Department', 
      date: 'Jul 10, 2025', status: 'Verified',
      tailored_fields: [
        { label: 'Title of Material', value: 'Laboratory Workbook for Applied Data Structures & Algorithms' },
        { label: 'Material Type', value: 'Workbooks / Exercises (Bound)' },
        { label: 'Subject / Course Code', value: 'ITE 311 - Data Structures' },
        { label: 'Implementation Date', value: 'First Semester AY 2025-2026' }
      ],
      description: 'Bound 120-page laboratory manual complete with hands-on coding exercises and rubric scoring guides.',
      proof_file: 'data_structures_workbook_isbn.pdf',
      proof_preview_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80'
    },
    { 
      id: 9, area_key: 'C', category_code: 'C.1',
      category_name: 'C.1 School Involvement & Leadership',
      title: 'Faculty Adviser: NDMU Computer Society', issuer: 'Student Affairs Office (SAO)', 
      date: 'AY 2025-2026', status: 'Verified',
      tailored_fields: [
        { label: 'Service Sub-Type', value: 'C.1.1 Moderator of Clubs / Organizations' },
        { label: 'Name of Organization', value: 'NDMU Computer Society (CS Student Org)' },
        { label: 'Period Covered', value: 'AY 2025-2026' },
        { label: 'Role', value: 'Official Faculty Moderator' }
      ],
      description: 'Supervised student org activities, hackathons, and community IT outreach initiatives throughout the school year.',
      proof_file: 'club_moderator_appointment_sao.pdf',
      proof_preview_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80'
    },
    { 
      id: 10, area_key: 'C', category_code: 'C.2',
      category_name: 'C.2 Community & Civic Involvement',
      title: 'Koronadal City LGU Digital Governance Project', issuer: 'City Government of Koronadal', 
      date: 'Feb 14, 2026', status: 'Verified',
      tailored_fields: [
        { label: 'Service Sub-Type', value: 'C.2.2 Community / Civic Extension Project' },
        { label: 'Project Description', value: 'Barangay Smart Digital Literacy Program' },
        { label: 'Sponsoring LGU / NGO', value: 'City Government of Koronadal' },
        { label: 'Period Covered', value: 'Jan – Mar 2026' }
      ],
      description: 'Project Lead for community IT extension program training local barangay secretaries on digital document management.',
      proof_file: 'lgu_extension_project_mou.pdf',
      proof_preview_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80'
    }
  ], [portfolio?.items])

  // BUILD DYNAMIC SLIDE DECK SEQUENCE
  const slides = useMemo(() => {
    const deck = []
    deck.push({ id: 'cover', type: 'COVER', label: 'Official Cover Page', badge: 'Cover' })
    deck.push({ id: 'toc', type: 'TOC', label: 'Table of Contents', badge: 'Index' })

    const grouped = { A: [], B: [], C: [] }
    items.forEach(i => {
      const key = i.area_key || i.category_code?.charAt(0)
      if (grouped[key]) grouped[key].push(i)
    })

    const areaMeta = {
      A: { title: 'AREA A: PROFESSIONAL DEVELOPMENT', sub: 'Degrees, Professional Memberships, and Seminars & Workshops' },
      B: { title: 'AREA B: PRODUCTIVITY AND CREATIVE WORK', sub: 'Lectures, Publications, Research Projects, Awards, and Instructional Materials' },
      C: { title: 'AREA C: SERVICE AND LEADERSHIP', sub: 'School Involvement, Extracurricular Organizations, and Community Extension' }
    }

    for (const areaKey of ['A', 'B', 'C']) {
      if (grouped[areaKey].length === 0) continue
      deck.push({ 
        id: `sep_${areaKey}`, type: 'SEPARATOR', areaKey,
        areaTitle: areaMeta[areaKey].title, subTitle: areaMeta[areaKey].sub,
        itemsCount: grouped[areaKey].length,
        label: `Section: Area ${areaKey}`, badge: `Area ${areaKey}` 
      })
      grouped[areaKey].forEach(item => {
        deck.push({ id: `item_${item.id}`, type: 'ITEM', item, label: item.title, badge: item.category_code })
      })
    }

    deck.push({ id: 'signoff', type: 'SIGN_OFF', label: 'Official Evaluator Sign-Off', badge: 'Sign-Off' })
    return deck
  }, [items])

  const totalPages = slides.length

  // ==================== SCROLL-BASED PAGE TRACKING ====================
  // When user scrolls the right viewport, detect which page is most visible and update currentPage
  const handleScroll = useCallback(() => {
    if (isScrollSyncing.current) return
    const container = scrollContainerRef.current
    if (!container) return

    const containerTop = container.scrollTop
    const containerMid = containerTop + container.clientHeight / 3

    let closestPage = 1
    let closestDist = Infinity

    slides.forEach((_, idx) => {
      const el = pageRefs.current[idx]
      if (!el) return
      const elTop = el.offsetTop - container.offsetTop
      const dist = Math.abs(elTop - containerMid)
      if (dist < closestDist) {
        closestDist = dist
        closestPage = idx + 1
      }
    })

    setCurrentPage(closestPage)
  }, [slides])

  // When clicking sidebar, scroll to that page smoothly
  const scrollToPage = useCallback((pageNum) => {
    const el = pageRefs.current[pageNum - 1]
    if (!el || !scrollContainerRef.current) return

    isScrollSyncing.current = true
    setCurrentPage(pageNum)

    el.scrollIntoView({ behavior: 'smooth', block: 'start' })

    setTimeout(() => { isScrollSyncing.current = false }, 600)
  }, [])

  if (!isOpen) return null

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      canvasRef.current?.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // ==================== RENDER INDIVIDUAL SLIDE BY TYPE ====================
  const renderSlide = (slide, pageNum) => {
    switch (slide.type) {

      case 'COVER':
        return (
          <div className="w-[750px] min-h-[980px] bg-white text-slate-900 p-12 rounded border border-slate-200 flex flex-col justify-between relative font-sans">
            {/* Top Header */}
            <div className="border-b-2 border-[#1b4332] pb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#1b4332] text-amber-300 flex items-center justify-center font-black text-2xl border border-emerald-900">NDMU</div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Notre Dame of Marbel University</h1>
                  <p className="text-xs font-bold text-[#1b4332] uppercase tracking-wider">Office of Academic Affairs • Personnel Ranking Dossier</p>
                  <p className="text-[11px] text-slate-500 font-medium">City of Koronadal, South Cotabato, Philippines</p>
                </div>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs font-extrabold uppercase tracking-wider">{status}</div>
            </div>

            {/* Middle */}
            <div className="my-auto space-y-8 py-4">
              <div className="text-center space-y-3">
                <span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold tracking-widest uppercase border border-slate-300">Institutional Faculty Dossier</span>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight pt-2">Faculty Accomplishments Portfolio</h2>
                <p className="text-xs font-semibold text-slate-600 max-w-lg mx-auto">Submitted in accordance with NDMU Personnel Ranking Policy ({academicYear})</p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 max-w-xl mx-auto">
                <div className="flex items-center gap-5 border-b border-slate-200 pb-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#1b4332] text-white flex items-center justify-center text-xl font-bold">MS</div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{facultyName}</h3>
                    <p className="text-xs font-bold text-[#1b4332]">{academicRank}</p>
                    <p className="text-xs text-slate-600 font-medium">{department}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                  <div><span className="text-[10px] text-slate-400 uppercase font-extrabold block">Employee ID</span><span>{employeeId}</span></div>
                  <div><span className="text-[10px] text-slate-400 uppercase font-extrabold block">Evaluation Period</span><span>{academicYear}</span></div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Notre Dame of Marbel University • AchieveNest System</span>
              <span>Page {pageNum} of {totalPages}</span>
            </div>
          </div>
        )

      case 'TOC':
        return (
          <div className="w-[750px] min-h-[980px] bg-white text-slate-900 p-10 rounded border border-slate-200 flex flex-col justify-between font-sans shadow-sm">
            {/* Header */}
            <div className="border-b-2 border-[#1b4332] pb-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#1b4332] text-amber-300 flex items-center justify-center font-bold">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">Table of Contents & Dossier Index</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Official NDMU Ranking Booklet Structure</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#1b4332] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">{academicYear}</span>
            </div>

            {/* Body */}
            <div className="my-auto space-y-4 py-2">
              <p className="text-xs font-medium text-slate-600">
                This presentation booklet synthesizes faculty accomplishment records categorized under the NDMU Ranking Matrix. Click any entry below to jump directly to its page.
              </p>

              {/* Table of Contents List */}
              <div className="space-y-3">

                {/* Section 1: Executive Summary */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => scrollToPage(1)}
                    className="w-full px-3.5 py-2 bg-slate-100 hover:bg-slate-200 transition text-left flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-[#1b4332] text-white flex items-center justify-center font-black text-[10px]">1</span>
                      <span className="text-xs font-extrabold text-slate-900 uppercase">Cover Page & Institutional Metadata</span>
                    </div>
                    <span className="text-[11px] font-extrabold text-[#1b4332]">Page 1</span>
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => scrollToPage(2)}
                    className="w-full px-3.5 py-2 bg-[#1b4332] text-white transition text-left flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-amber-400 text-slate-900 flex items-center justify-center font-black text-[10px]">2</span>
                      <span className="text-xs font-extrabold text-white uppercase">Table of Contents & Navigation Index</span>
                    </div>
                    <span className="text-[11px] font-extrabold text-amber-300">Page 2 (Current)</span>
                  </button>
                </div>

                {/* Area Sections A, B, C */}
                {['A', 'B', 'C'].map(areaKey => {
                  const areaTitleMap = { 
                    A: 'AREA A: PROFESSIONAL DEVELOPMENT (Max: 70 Pts)', 
                    B: 'AREA B: PRODUCTIVITY AND CREATIVE WORK (Max: 50 Pts Cap)', 
                    C: 'AREA C: SERVICE AND LEADERSHIP (Max: 40 Pts)' 
                  }
                  const areaItems = items.filter(i => (i.area_key || i.category_code?.charAt(0)) === areaKey)
                  if (areaItems.length === 0) return null

                  const sepIdx = slides.findIndex(s => s.type === 'SEPARATOR' && s.areaKey === areaKey)
                  const sepPage = sepIdx >= 0 ? sepIdx + 1 : 3

                  return (
                    <div key={areaKey} className="rounded-xl border border-slate-200 overflow-hidden">
                      <button 
                        type="button" 
                        onClick={() => scrollToPage(sepPage)}
                        className="w-full px-3.5 py-2.5 bg-[#1b4332] text-white hover:bg-[#123124] transition text-left flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-amber-400 text-slate-900 flex items-center justify-center font-black text-[11px]">{areaKey}</span>
                          <h3 className="text-xs font-black tracking-wide text-white uppercase">{areaTitleMap[areaKey]}</h3>
                        </div>
                        <span className="text-[11px] font-bold text-amber-300">Page {sepPage}</span>
                      </button>
                      <div className="p-2 bg-slate-50 divide-y divide-slate-200/60">
                        {areaItems.map(item => {
                          const itemIdx = slides.findIndex(s => s.type === 'ITEM' && s.item?.id === item.id)
                          const itemPage = itemIdx >= 0 ? itemIdx + 1 : 4
                          return (
                            <button 
                              key={item.id} 
                              type="button" 
                              onClick={() => scrollToPage(itemPage)}
                              className="w-full px-2.5 py-1.5 text-left flex items-center justify-between text-xs transition cursor-pointer hover:bg-slate-100 group"
                            >
                              <div className="flex items-center gap-2 pr-2">
                                <span className="text-[10px] font-bold text-[#1b4332] w-7 shrink-0">{item.category_code}</span>
                                <span className="font-semibold text-slate-800 group-hover:text-[#1b4332] line-clamp-1">{item.title}</span>
                              </div>
                              <span className="text-[10px] font-extrabold text-slate-500 shrink-0">Page {itemPage}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* Section Sign-off */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => scrollToPage(totalPages)}
                    className="w-full px-3.5 py-2 bg-slate-100 hover:bg-slate-200 transition text-left flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-[#1b4332] text-white flex items-center justify-center font-black text-[10px]">{totalPages}</span>
                      <span className="text-xs font-extrabold text-slate-900 uppercase">Administrative Authentication & Sign-Off Seal</span>
                    </div>
                    <span className="text-[11px] font-extrabold text-[#1b4332]">Page {totalPages}</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-xs text-slate-500 font-medium shrink-0">
              <span>Notre Dame of Marbel University • Portfolio Dossier</span>
              <span>Page {pageNum} of {totalPages}</span>
            </div>
          </div>
        )

      case 'SEPARATOR':
        return (
          <div className="w-[750px] min-h-[980px] bg-[#1b4332] text-white p-12 rounded border border-emerald-950 flex flex-col justify-between relative overflow-hidden font-sans">
            {/* Header */}
            <div className="border-b border-emerald-800/80 pb-4 flex items-center justify-between relative z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black text-base">{slide.areaKey}</div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">NDMU Portfolio Section Divider</span>
              </div>
              <span className="px-3 py-1 rounded-xl bg-emerald-950 border border-emerald-800 text-slate-200 text-xs font-bold">{slide.itemsCount} Accomplishments</span>
            </div>

            {/* Middle */}
            <div className="my-auto space-y-6 text-center relative z-10 py-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-900 text-amber-300 flex items-center justify-center mx-auto border border-emerald-700">
                <Layers className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-lg mx-auto">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-widest block">Section Category</span>
                <h2 className="text-3xl font-black text-white tracking-tight">{slide.areaTitle}</h2>
                <p className="text-xs font-medium text-emerald-200 pt-1 leading-relaxed">{slide.subTitle}</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-800 max-w-md mx-auto text-left space-y-2">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Included Entries</span>
                <ul className="text-xs text-slate-200 space-y-1 font-medium">
                  {items.filter(i => (i.area_key || i.category_code?.charAt(0)) === slide.areaKey).map(i => (
                    <li key={i.id} className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span className="line-clamp-1">{i.category_code} - {i.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-emerald-800/80 pt-3 flex items-center justify-between text-xs text-emerald-300 relative z-10 font-medium shrink-0">
              <span>Notre Dame of Marbel University • {slide.areaTitle}</span>
              <span>Page {pageNum} of {totalPages}</span>
            </div>
          </div>
        )

      case 'ITEM': {
        const item = slide.item
        if (!item) return null
        const tailoredFields = item.tailored_fields || [
          { label: 'Category', value: item.category_name },
          { label: 'Issuing Body / Venue', value: item.issuer },
          { label: 'Date Achieved', value: item.date }
        ]

        return (
          <div className="w-[750px] min-h-[980px] bg-white text-slate-900 p-10 rounded border border-slate-200 flex flex-col justify-between font-sans">
            {/* Header */}
            <div className="border-b-2 border-[#1b4332] pb-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-[#1b4332] text-amber-300 text-xs font-black">{item.category_code || 'Record'}</span>
                <div>
                  <h2 className="text-[11px] font-extrabold text-[#1b4332] uppercase tracking-wider">{item.category_name}</h2>
                  <h3 className="text-sm font-black text-slate-900 line-clamp-1">{item.title}</h3>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300">{item.status}</span>
            </div>

            {/* Content */}
            <div className="my-auto space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {tailoredFields.map((field, fIdx) => (
                  <div key={fIdx} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">{field.label}</span>
                    <span className="font-bold text-slate-800 mt-0.5 block line-clamp-1">{field.value}</span>
                  </div>
                ))}
              </div>

              {item.description && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Executive Remarks / Description</h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{item.description}</p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Supporting Verification Evidence</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{item.proof_file || 'proof_certificate.pdf'}</span>
                </div>
                <div className="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 h-[240px] flex items-center justify-center">
                  <img src={item.proof_preview_url || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80'} alt="Verification Proof" className="w-full h-full object-cover opacity-95" />
                  <div className="absolute bottom-2 right-2 bg-slate-900/90 text-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Verified Certificate Document</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-xs text-slate-500 font-medium shrink-0">
              <span>NDMU Ranking Portfolio • {item.category_code} Entry</span>
              <span>Page {pageNum} of {totalPages}</span>
            </div>
          </div>
        )
      }

      case 'SIGN_OFF':
        return (
          <div className="w-[750px] min-h-[980px] bg-white text-slate-900 p-10 rounded border border-slate-200 flex flex-col justify-between font-sans">
            <div className="space-y-6">
              <div className="border-b-2 border-[#1b4332] pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900 uppercase">Institutional Verification & Sign-Off</h2>
                  <p className="text-xs text-slate-500">Notre Dame of Marbel University Personnel Ranking System</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300">Evaluation Period: {academicYear}</span>
              </div>

              <div className="p-6 rounded-2xl bg-[#1b4332] text-white flex items-center justify-between border border-emerald-900">
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest">Portfolio Submission Dossier</h4>
                  <p className="text-xs text-emerald-200 font-medium mt-0.5">Evaluation Period: {academicYear}</p>
                </div>
                <div className="text-lg font-black text-white">{items.length} Accomplishment Records Verified</div>
              </div>

              <div className="pt-8 space-y-8">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider text-center">Official Institutional Evaluation Sign-Off & Verification</h3>
                <div className="grid grid-cols-2 gap-8 pt-6">
                  <div className="text-center space-y-2">
                    <div className="h-12 border-b-2 border-slate-900 w-3/4 mx-auto flex items-end justify-center pb-1">
                      <span className="text-xs font-extrabold italic text-slate-800">Engr. Roberto Dela Cruz</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">Department Secretary</p>
                    <p className="text-[10px] text-slate-500">College of Information Technology</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="h-12 border-b-2 border-slate-900 w-3/4 mx-auto flex items-end justify-center pb-1">
                      <span className="text-xs font-extrabold italic text-slate-800">Dr. Victoria Gomez, DPA</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">Human Resources Director</p>
                    <p className="text-[10px] text-slate-500">NDMU HR Office</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-xs text-slate-500 font-medium shrink-0">
              <span>Notre Dame of Marbel University • Final Sign-Off Page</span>
              <span>Page {totalPages} of {totalPages}</span>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      
      <div ref={canvasRef} className="w-full max-w-6xl max-h-[96vh] bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* ================= TOP TOOLBAR ================= */}
        <div className="p-3 bg-slate-800/90 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition cursor-pointer" title="Close Booklet">
              <X className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <button type="button" disabled={currentPage === 1} onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
                className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 transition cursor-pointer" title="Previous Page">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-slate-200">
                Page {currentPage} of {totalPages}
              </span>
              <button type="button" disabled={currentPage === totalPages} onClick={() => scrollToPage(Math.min(totalPages, currentPage + 1))}
                className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 transition cursor-pointer" title="Next Page">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-300">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>NDMU Faculty Ranking Dossier • {facultyName}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-xl px-2 py-1">
              <button type="button" onClick={() => setZoomLevel(prev => Math.max(75, prev - 25))} className="p-1 hover:text-emerald-400 text-slate-400 transition" title="Zoom Out">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-bold text-slate-200 w-10 text-center">{zoomLevel}%</span>
              <button type="button" onClick={() => setZoomLevel(prev => Math.min(125, prev + 25))} className="p-1 hover:text-emerald-400 text-slate-400 transition" title="Zoom In">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
            <button type="button" onClick={toggleFullscreen} className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition cursor-pointer" title="Fullscreen">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => window.print()} className="px-3.5 py-2 rounded-xl bg-[#1b4332] hover:bg-[#123124] text-white text-xs font-bold flex items-center gap-2 transition border border-emerald-800 cursor-pointer">
              <Printer className="w-4 h-4 text-amber-300" /><span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* ================= MAIN WORKSPACE: SIDEBAR + SCROLLABLE CANVAS ================= */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          
          {/* LEFT SIDEBAR: Page Thumbnails Navigator */}
          <div className="lg:col-span-3 space-y-1.5 bg-slate-950 p-3 border-r border-slate-800 overflow-y-auto max-h-[84vh]">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1 mb-2">
              Booklet Pages ({totalPages})
            </h3>

            {slides.map((slide, sIdx) => {
              const pageNum = sIdx + 1
              const isSelected = currentPage === pageNum
              return (
                <button key={slide.id} type="button" onClick={() => scrollToPage(pageNum)}
                  className={`w-full p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col gap-1 ${
                    isSelected 
                      ? 'bg-[#1b4332] border-[#2d8a4e] text-white' 
                      : slide.type === 'SEPARATOR'
                      ? 'bg-slate-900 border-slate-700/80 text-emerald-300'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-300'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300">Page {pageNum}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-semibold">{slide.badge}</span>
                  </div>
                  <p className="text-xs font-semibold line-clamp-1">{slide.label}</p>
                </button>
              )
            })}
          </div>

          {/* RIGHT COLUMN: SCROLLABLE CANVAS VIEWPORT (Canva-style side scrollbar) */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="lg:col-span-9 overflow-y-auto bg-slate-950 px-4 py-6"
          >
            <div 
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="transition-transform duration-200 ease-out flex flex-col items-center gap-8 pb-8"
            >
              {slides.map((slide, sIdx) => (
                <div
                  key={slide.id}
                  ref={el => { pageRefs.current[sIdx] = el }}
                  className="shadow-2xl"
                >
                  {renderSlide(slide, sIdx + 1)}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
