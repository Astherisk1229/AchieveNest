import React, { useState, useRef, useMemo, useCallback } from 'react'
import useTheme from '../../hooks/useTheme'
import { formatPersonnelPlacement } from '../../utils/personnelPlacement'
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2,
  ZoomIn, 
  ZoomOut, 
  Award, 
  Printer,
  Paperclip,
  CheckCircle2,
  FileSpreadsheet,
  Images,
  ShieldCheck,
  Search,
  Layers,
  ExternalLink
} from 'lucide-react'

export default function PersonnelPortfolioBookletModal({ isOpen, onClose, portfolio, user = {} }) {
  const { isDark } = useTheme()
  const [currentPage, setCurrentPage] = useState(1)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sidebarQuery, setSidebarQuery] = useState('')
  const canvasRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const pageRefs = useRef({})
  const isScrollSyncing = useRef(false)

  // User Profile & Metadata
  const facultyName = user.full_name || user.name || portfolio?.personnel_name || 'Dr. Maria Santos'
  const employeeId = user.employee_id || portfolio?.personnel_id || 'EMP-2021-0842'
  const affiliation = formatPersonnelPlacement({ ...portfolio, ...user })
  const academicRank = user.rank || user.academic_rank || portfolio?.academic_rank || 'Associate Professor II'
  const academicYear = portfolio?.academic_year || 'AY 2025-2026'
  const status = portfolio?.status || 'HR APPROVED'
  const yearsOfService = portfolio?.years_of_service || 10

  // Combine items from props or standard fallback list
  const rawItems = useMemo(() => {
    if (portfolio?.items && portfolio.items.length > 0) return portfolio.items

    const combined = []
    if (portfolio?.area_a_items && portfolio.area_a_items.length > 0) {
      portfolio.area_a_items.forEach(i => combined.push({ ...i, area_key: 'A' }))
    }
    if (portfolio?.area_b_items && portfolio.area_b_items.length > 0) {
      portfolio.area_b_items.forEach(i => combined.push({ ...i, area_key: 'B' }))
    }
    if (portfolio?.area_c_items && portfolio.area_c_items.length > 0) {
      portfolio.area_c_items.forEach(i => combined.push({ ...i, area_key: 'C' }))
    }

    if (combined.length > 0) return combined

    // Default Comprehensive Fallback Items adhering strictly to NDMU Spec
    return [
      { 
        id: 1, area_key: 'A', category_code: 'A.1',
        category_name: 'A.1 Educational Qualifications / Degrees',
        title: 'Ph.D. in Computer Science', issuer: 'Ateneo de Manila University', 
        date: '2024-05-20', date_display: 'May 20, 2024', status: 'Verified', points: 30,
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
        date: '2025-08-15', date_display: 'AY 2025-2026', status: 'Verified', points: 10,
        tailored_fields: [
          { label: 'Organization Name', value: 'Philippine Computer Society (PCS)' },
          { label: 'Position / Role Held', value: 'Vice President for External Affairs' },
          { label: 'Scope', value: 'National Organization' },
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
        date: '2026-03-20', date_display: 'Mar 20, 2026', status: 'Verified', points: 15,
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
        date: '2026-02-28', date_display: 'Feb 28, 2026', status: 'Verified', points: 10,
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
        date: '2026-04-15', date_display: 'Apr 15, 2026', status: 'Verified', points: 20,
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
        date: '2025-12-15', date_display: 'Dec 15, 2025', status: 'Verified', points: 15,
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
        date: '2026-01-10', date_display: 'Jan 10, 2026', status: 'Verified', points: 15,
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
          title: 'Laboratory Workbook for Applied Data Structures', issuer: 'NDMU BSCS Academic Program',
        date: '2025-07-10', date_display: 'Jul 10, 2025', status: 'Verified', points: 10,
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
        date: '2025-09-01', date_display: 'AY 2025-2026', status: 'Verified', points: 10,
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
        date: '2026-02-14', date_display: 'Feb 14, 2026', status: 'Verified', points: 15,
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
    ]
  }, [portfolio])

  // REVERSE CHRONOLOGICAL SORTING FOR ATTACHED PROOF CERTIFICATES (Pages 3+)
  const proofItemsSortedReverseChrono = useMemo(() => {
    return [...rawItems].sort((a, b) => {
      const dateA = new Date(a.date || a.submittedDate || '2025-01-01')
      const dateB = new Date(b.date || b.submittedDate || '2025-01-01')
      return dateB - dateA
    })
  }, [rawItems])

  // BUILD OFFICIAL NDMU FORMAL HR BOOKLET SEQUENCE
  // Page 1: Formal HR Form (Header, Metadata, Sections A & B.1)
  // Page 2: Formal HR Form (Sections B.2-B.5, C.1-C.3, Signature Block)
  // Pages 3+: Attached Certificate Proof Documents in Reverse Chronological Order
  const slides = useMemo(() => {
    const deck = []

    // Slide 1: Formal HR Page 1
    deck.push({
      id: 'hr_page_1',
      type: 'HR_PAGE_1',
      label: 'Formal HR Form - Page 1',
      subtitle: 'Sections A-B (Education & Seminars)',
      badge: 'HR 1',
      pageNum: 1
    })

    // Slide 2: Formal HR Page 2
    deck.push({
      id: 'hr_page_2',
      type: 'HR_PAGE_2',
      label: 'Formal HR Form - Page 2',
      subtitle: 'Sections B-C & Signature Sign-Off',
      badge: 'HR 2',
      pageNum: 2
    })

    // Slides 3+: Attached Proof Documents
    proofItemsSortedReverseChrono.forEach((item, idx) => {
      const categoryCode = item.category_code || item.category || `P.${idx + 3}`
      deck.push({
        id: `proof_${item.id || idx}`,
        type: 'ATTACHED_PROOF',
        item,
        label: item.title,
        subtitle: item.category_name || item.category || 'Attached Proof Certificate',
        badge: categoryCode,
        pageNum: idx + 3
      })
    })

    return deck
  }, [proofItemsSortedReverseChrono])

  const totalPages = slides.length

  // Filter slides dynamically for left sidebar search
  const filteredSlides = useMemo(() => {
    if (!sidebarQuery.trim()) return slides
    const q = sidebarQuery.toLowerCase()
    return slides.filter(s => 
      s.label.toLowerCase().includes(q) ||
      s.badge.toLowerCase().includes(q) ||
      (s.subtitle && s.subtitle.toLowerCase().includes(q)) ||
      (s.item && (
        (s.item.title && s.item.title.toLowerCase().includes(q)) ||
        (s.item.issuer && s.item.issuer.toLowerCase().includes(q)) ||
        (s.item.proof_file && s.item.proof_file.toLowerCase().includes(q))
      ))
    )
  }, [slides, sidebarQuery])

  // Partition slides into HR Dossier & Attached Proofs for structured sidebar sections
  const hrSlides = useMemo(() => filteredSlides.filter(s => s.type === 'HR_PAGE_1' || s.type === 'HR_PAGE_2'), [filteredSlides])
  const proofSlides = useMemo(() => filteredSlides.filter(s => s.type === 'ATTACHED_PROOF'), [filteredSlides])

  // Scroll handler for updating current page indicator based on maximum visible page area
  const handleScroll = useCallback(() => {
    if (isScrollSyncing.current) return
    const container = scrollContainerRef.current
    if (!container) return

    const viewTop = container.scrollTop
    const viewBottom = viewTop + container.clientHeight

    let activePage = 1
    let maxVisibleHeight = -1

    slides.forEach((_, idx) => {
      const el = pageRefs.current[idx]
      if (!el) return

      const elTop = el.offsetTop - container.offsetTop
      const elBottom = elTop + el.offsetHeight

      const visibleTop = Math.max(elTop, viewTop)
      const visibleBottom = Math.min(elBottom, viewBottom)
      const visibleHeight = Math.max(0, visibleBottom - visibleTop)

      if (visibleHeight > maxVisibleHeight) {
        maxVisibleHeight = visibleHeight
        activePage = idx + 1
      }
    })

    setCurrentPage(activePage)
  }, [slides])

  // Scroll to targeted page when clicking sidebar item
  const scrollToPage = useCallback((pageNum) => {
    const el = pageRefs.current[pageNum - 1]
    if (!el || !scrollContainerRef.current) return

    isScrollSyncing.current = true
    setCurrentPage(pageNum)

    el.scrollIntoView({ behavior: 'smooth', block: 'start' })

    setTimeout(() => { isScrollSyncing.current = false }, 800)
  }, [])

  // Jump directly to the proof attachment page for a matrix achievement item
  const scrollToProofForItem = useCallback((item) => {
    if (!item) return
    const matchedSlide = slides.find(s => 
      s.type === 'ATTACHED_PROOF' && (
        (item.id && s.item?.id === item.id) ||
        (item.title && s.item?.title?.trim().toLowerCase() === item.title.trim().toLowerCase())
      )
    )
    if (matchedSlide) {
      scrollToPage(matchedSlide.pageNum)
    }
  }, [slides, scrollToPage])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      canvasRef.current?.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // Sort items within each section in reverse chronological order (most recent first)
  const sortItemsReverseChrono = useCallback((items) => {
    return [...items].sort((a, b) => {
      const parseYearOrDate = (item) => {
        if (!item) return 0
        const d = String(item.date || item.date_display || item.date_achieved || '')
        const yearMatches = d.match(/\b(20\d\d|19\d\d)\b/g)
        if (yearMatches && yearMatches.length > 0) {
          return Math.max(...yearMatches.map(Number))
        }
        const ts = Date.parse(d)
        return isNaN(ts) ? 0 : ts
      }
      return parseYearOrDate(b) - parseYearOrDate(a)
    })
  }, [])

  // Filter & sort items for matrix tables (Strict Reverse Chronological Order)
  const areaAItems = useMemo(() => sortItemsReverseChrono(rawItems.filter(i => (i.area_key || i.category_code?.charAt(0)) === 'A')), [rawItems, sortItemsReverseChrono])
  const areaBItems = useMemo(() => sortItemsReverseChrono(rawItems.filter(i => (i.area_key || i.category_code?.charAt(0)) === 'B')), [rawItems, sortItemsReverseChrono])
  const areaCItems = useMemo(() => sortItemsReverseChrono(rawItems.filter(i => (i.area_key || i.category_code?.charAt(0)) === 'C')), [rawItems, sortItemsReverseChrono])

  if (!isOpen) return null

  // ==================== RENDER FORMAL SLIDES ACCORDING TO NDMU SPEC ====================
  const renderSlide = (slide, pageNum) => {
    switch (slide.type) {

      // ================= PAGE 1: FORMAL HR HEADER & SECTIONS A-B =================
      case 'HR_PAGE_1':
        return (
          <div className="w-[780px] min-h-[1010px] bg-white text-slate-900 p-8 sm:p-10 rounded border border-slate-200 font-sans flex flex-col justify-between shadow-lg">
            
            <div className="space-y-6">
              {/* Formal Centered HR Header */}
              <div className="text-center space-y-1 pb-4 border-b border-slate-300">
                <h1 className="text-xl font-extrabold tracking-wide uppercase font-sans text-slate-900">
                  FACULTY DEVELOPMENT PROGRAM
                </h1>
                <p className="text-sm font-semibold font-sans italic text-slate-700">
                  Portfolio
                </p>

                <div className="pt-4 grid grid-cols-2 text-left text-xs font-sans text-slate-800 leading-relaxed">
                  <div>
                    <p><span className="font-bold">Name:</span> {facultyName}</p>
                    <p><span className="font-bold">School Year:</span> {academicYear}</p>
                  </div>
                  <div>
                    <p><span className="font-bold">Status:</span> Full-Time - Permanent</p>
                    <p><span className="font-bold">Rank:</span> {academicRank}</p>
                  </div>
                </div>
              </div>

              {/* Main Formal HR Rating Matrix Table */}
              <div className="border-2 border-slate-900 text-xs font-sans overflow-hidden">
                
                {/* SECTION A */}
                <div className="bg-[#0f2537] text-white font-bold p-2 text-xs sm:text-sm uppercase tracking-wider border-b border-slate-900">
                  A. PROFESSIONAL DEVELOPMENT
                </div>

                {/* A.1 Education */}
                <div className="bg-[#183a54] text-white font-bold p-1.5 pl-3 text-xs border-b border-slate-900">
                  1. EDUCATION
                </div>
                <table className="w-full border-collapse border-b border-slate-900 text-slate-900">
                  <thead>
                    <tr className="bg-[#e6f2ff] text-slate-900 font-sans italic font-bold border-b border-slate-900 text-[11px]">
                      <th className="p-2 border-r border-slate-900 w-1/5 text-left">Date(s)</th>
                      <th className="p-2 border-r border-slate-900 w-2/5 text-left">Course/Degree</th>
                      <th className="p-2 border-r border-slate-900 w-1/4 text-left">School/University</th>
                      <th className="p-2 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-sans text-xs">
                    {areaAItems.filter(i => (i.category_code === 'A.1' || i.category?.includes('A.1'))).map(item => (
                      <tr 
                        key={item.id} 
                        onClick={() => scrollToProofForItem(item)}
                        title="Click row to jump to attached proof certificate document"
                        className="hover:bg-emerald-50/90 transition-colors cursor-pointer group"
                      >
                        <td className="p-2 border-r border-slate-900 font-sans text-[11px]">{item.date_display || item.date || '2024'}</td>
                        <td className="p-2 border-r border-slate-900 font-bold group-hover:text-emerald-900">{item.title}</td>
                        <td className="p-2 border-r border-slate-900">{item.issuer || 'Ateneo de Manila University'}</td>
                        <td className="p-2 font-bold text-[#064e2b] group-hover:text-emerald-700 flex items-center justify-between gap-1">
                          <span>Conferred / Verified Attachment</span>
                          <ExternalLink className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </td>
                      </tr>
                    ))}
                    {areaAItems.filter(i => (i.category_code === 'A.1' || i.category?.includes('A.1'))).length === 0 && (
                      <tr 
                        onClick={() => scrollToProofForItem({ title: 'Ph.D. in Computer Science' })}
                        title="Click row to jump to attached proof certificate document"
                        className="hover:bg-emerald-50/90 transition-colors cursor-pointer group"
                      >
                        <td className="p-2 border-r border-slate-900 font-sans text-[11px]">2020-2024</td>
                        <td className="p-2 border-r border-slate-900 font-bold group-hover:text-emerald-900">Ph.D. in Computer Science</td>
                        <td className="p-2 border-r border-slate-900">Ateneo de Manila University</td>
                        <td className="p-2 font-bold text-[#064e2b] group-hover:text-emerald-700 flex items-center justify-between gap-1">
                          <span>Conferred / Verified Attachment</span>
                          <ExternalLink className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* A.2 Active Membership in Professional Orgs */}
                <div className="bg-[#183a54] text-white font-bold p-1.5 pl-3 text-xs border-b border-slate-900">
                  2. ACTIVE MEMBERSHIP TO PROFESSIONAL ORGANIZATIONS
                </div>
                <table className="w-full border-collapse border-b border-slate-900 text-slate-900">
                  <thead>
                    <tr className="bg-[#e6f2ff] text-slate-900 font-sans italic font-bold border-b border-slate-900 text-[11px]">
                      <th className="p-2 border-r border-slate-900 w-1/5 text-left">Date(s)</th>
                      <th className="p-2 border-r border-slate-900 w-2/5 text-left">Organization</th>
                      <th className="p-2 border-r border-slate-900 w-1/4 text-left">Conducted or Organized by</th>
                      <th className="p-2 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-sans text-xs">
                    {areaAItems.filter(i => (i.category_code === 'A.2' || i.category?.includes('A.2'))).map(item => (
                      <tr 
                        key={item.id} 
                        onClick={() => scrollToProofForItem(item)}
                        title="Click row to jump to attached proof certificate document"
                        className="hover:bg-emerald-50/90 transition-colors cursor-pointer group"
                      >
                        <td className="p-2 border-r border-slate-900 font-sans text-[11px]">{item.date_display || item.date || '2025'}</td>
                        <td className="p-2 border-r border-slate-900 font-bold group-hover:text-emerald-900">{item.title}</td>
                        <td className="p-2 border-r border-slate-900">{item.issuer || 'PCS Executive Board'}</td>
                        <td className="p-2 font-bold text-[#064e2b] group-hover:text-emerald-700 flex items-center justify-between gap-1">
                          <span>Active Officer / Member</span>
                          <ExternalLink className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* A.3 Attendance to Seminars & Workshops */}
                <div className="bg-[#183a54] text-white font-bold p-1.5 pl-3 text-xs border-b border-slate-900">
                  3. ATTENDANCE TO SEMINAR-WORKSHOP/TRAININGS
                </div>
                <table className="w-full border-collapse border-b border-slate-900 text-slate-900">
                  <thead>
                    <tr className="bg-[#e6f2ff] text-slate-900 font-sans italic font-bold border-b border-slate-900 text-[11px]">
                      <th className="p-2 border-r border-slate-900 w-1/5 text-left">Date(s)</th>
                      <th className="p-2 border-r border-slate-900 w-2/5 text-left">Title</th>
                      <th className="p-2 border-r border-slate-900 w-1/4 text-left">Conducted or Organized by</th>
                      <th className="p-2 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-sans text-xs">
                    {areaAItems.filter(i => (i.category_code === 'A.3' || i.category?.includes('A.3'))).map(item => (
                      <tr 
                        key={item.id} 
                        onClick={() => scrollToProofForItem(item)}
                        title="Click row to jump to attached proof certificate document"
                        className="hover:bg-emerald-50/90 transition-colors cursor-pointer group"
                      >
                        <td className="p-2 border-r border-slate-900 font-sans text-[11px]">{item.date_display || item.date || '2026'}</td>
                        <td className="p-2 border-r border-slate-900 font-bold group-hover:text-emerald-900">{item.title}</td>
                        <td className="p-2 border-r border-slate-900">{item.issuer || 'CHED Region XII'}</td>
                        <td className="p-2 font-bold text-[#064e2b] group-hover:text-emerald-700 flex items-center justify-between gap-1">
                          <span>Completed (40 Hours)</span>
                          <ExternalLink className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* SECTION B (PART 1) */}
                <div className="bg-[#0f2537] text-white font-bold p-2 text-xs sm:text-sm uppercase tracking-wider border-b border-slate-900">
                  B. PRODUCTIVITY AND CREATIVE WORK
                </div>

                {/* B.1 Guest Lecturer */}
                <div className="bg-[#183a54] text-white font-bold p-1.5 pl-3 text-xs border-b border-slate-900">
                  1. INVITED AS GUEST LECTURER/CONSULTANT/JUDGE/RESOURCE PERSON
                </div>
                <table className="w-full border-collapse text-slate-900">
                  <thead>
                    <tr className="bg-[#e6f2ff] text-slate-900 font-sans italic font-bold border-b border-slate-900 text-[11px]">
                      <th className="p-2 border-r border-slate-900 w-1/5 text-left">Date(s)</th>
                      <th className="p-2 border-r border-slate-900 w-2/5 text-left">Activity</th>
                      <th className="p-2 border-r border-slate-900 w-1/4 text-left">Conducted or Organized by</th>
                      <th className="p-2 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-sans text-xs">
                    {areaBItems.filter(i => (i.category_code === 'B.1' || i.category?.includes('B.1'))).map(item => (
                      <tr 
                        key={item.id} 
                        onClick={() => scrollToProofForItem(item)}
                        title="Click row to jump to attached proof certificate document"
                        className="hover:bg-emerald-50/90 transition-colors cursor-pointer group"
                      >
                        <td className="p-2 border-r border-slate-900 font-sans text-[11px]">{item.date_display || item.date || 'Feb 2026'}</td>
                        <td className="p-2 border-r border-slate-900 font-bold group-hover:text-emerald-900">{item.title}</td>
                        <td className="p-2 border-r border-slate-900">{item.issuer || 'DOST Region XII'}</td>
                        <td className="p-2 font-bold text-[#064e2b] group-hover:text-emerald-700 flex items-center justify-between gap-1">
                          <span>Keynote Speaker / Served</span>
                          <ExternalLink className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>
            </div>

            {/* Document Footer */}
            <div className="border-t border-slate-300 pt-3 flex items-center justify-between text-xs text-slate-500 font-sans font-medium">
              <span>Notre Dame of Marbel University • Formal Faculty Portfolio</span>
              <span>Page {pageNum} of {totalPages}</span>
            </div>

          </div>
        )

      // ================= PAGE 2: FORMAL HR SECTIONS B-C & SIGNATURE BLOCK =================
      case 'HR_PAGE_2':
        return (
          <div className="w-[780px] min-h-[1010px] bg-white text-slate-900 p-8 sm:p-10 rounded border border-slate-200 font-sans flex flex-col justify-between shadow-lg">
            
            <div className="space-y-6">
              
              {/* Continuing Sub-Header Bar */}
              <div className="border-b border-slate-300 pb-2 flex items-center justify-between text-xs font-sans text-slate-700">
                <span className="font-bold uppercase tracking-wide">NDMU Faculty Development Portfolio • {facultyName}</span>
                <span className="italic">{academicYear}</span>
              </div>

              {/* Main Table Continued */}
              <div className="border-2 border-slate-900 text-xs font-sans overflow-hidden">
                
                {/* SECTION B (CONTINUED) */}
                <div className="bg-[#0f2537] text-white font-bold p-2 text-xs sm:text-sm uppercase tracking-wider border-b border-slate-900">
                  B. PRODUCTIVITY AND CREATIVE WORK (Cont.)
                </div>

                {/* B.2 Publications */}
                <div className="bg-[#183a54] text-white font-bold p-1.5 pl-3 text-xs border-b border-slate-900">
                  2. PUBLICATION (scholarly paper/article/research output/book)
                </div>
                <table className="w-full border-collapse border-b border-slate-900 text-slate-900">
                  <thead>
                    <tr className="bg-[#e6f2ff] text-slate-900 font-sans italic font-bold border-b border-slate-900 text-[11px]">
                      <th className="p-2 border-r border-slate-900 w-1/5 text-left">Date(s)</th>
                      <th className="p-2 border-r border-slate-900 w-2/5 text-left">Publications</th>
                      <th className="p-2 border-r border-slate-900 w-1/4 text-left">Granted by</th>
                      <th className="p-2 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-sans text-xs">
                    {areaBItems.filter(i => (i.category_code === 'B.2' || i.category?.includes('B.2'))).map(item => (
                      <tr 
                        key={item.id} 
                        onClick={() => scrollToProofForItem(item)}
                        title="Click row to jump to attached proof certificate document"
                        className="hover:bg-emerald-50/90 transition-colors cursor-pointer group"
                      >
                        <td className="p-2 border-r border-slate-900 font-sans text-[11px]">{item.date_display || item.date || 'Apr 2026'}</td>
                        <td className="p-2 border-r border-slate-900 font-bold group-hover:text-emerald-900">{item.title}</td>
                        <td className="p-2 border-r border-slate-900">{item.issuer || 'IEEE Access Journal'}</td>
                        <td className="p-2 font-bold text-[#064e2b] group-hover:text-emerald-700 flex items-center justify-between gap-1">
                          <span>Scopus Published / Peer-Reviewed</span>
                          <ExternalLink className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* B.3 Conduct of Research */}
                <div className="bg-[#183a54] text-white font-bold p-1.5 pl-3 text-xs border-b border-slate-900">
                  3. CONDUCT OF RESEARCH PROJECTS
                </div>
                <table className="w-full border-collapse border-b border-slate-900 text-slate-900">
                  <thead>
                    <tr className="bg-[#e6f2ff] text-slate-900 font-sans italic font-bold border-b border-slate-900 text-[11px]">
                      <th className="p-2 border-r border-slate-900 w-1/5 text-left">Date(s)</th>
                      <th className="p-2 border-r border-slate-900 w-2/5 text-left">Research Project Title</th>
                      <th className="p-2 border-r border-slate-900 w-1/4 text-left">Funding Source / Agency</th>
                      <th className="p-2 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-sans text-xs">
                    {areaBItems.filter(i => (i.category_code === 'B.3' || i.category?.includes('B.3'))).map(item => (
                      <tr 
                        key={item.id} 
                        onClick={() => scrollToProofForItem(item)}
                        title="Click row to jump to attached proof certificate document"
                        className="hover:bg-emerald-50/90 transition-colors cursor-pointer group"
                      >
                        <td className="p-2 border-r border-slate-900 font-sans text-[11px]">{item.date_display || item.date || 'Dec 2025'}</td>
                        <td className="p-2 border-r border-slate-900 font-bold group-hover:text-emerald-900">{item.title}</td>
                        <td className="p-2 border-r border-slate-900">{item.issuer || 'NDMU University Research Office'}</td>
                        <td className="p-2 font-bold text-[#064e2b] group-hover:text-emerald-700 flex items-center justify-between gap-1">
                          <span>Completed Institutional Grant</span>
                          <ExternalLink className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* SECTION C */}
                <div className="bg-[#0f2537] text-white font-bold p-2 text-xs sm:text-sm uppercase tracking-wider border-b border-slate-900">
                  C. SERVICE AND LEADERSHIP
                </div>

                {/* C.1 Extra-Curricular / School Orgs */}
                <div className="bg-[#183a54] text-white font-bold p-1.5 pl-3 text-xs border-b border-slate-900">
                  1. INVOLVEMENT IN EXTRA-CURRICULAR ACTIVITIES/RECOGNIZED SCHOOL ORGS.
                </div>
                <table className="w-full border-collapse border-b border-slate-900 text-slate-900">
                  <thead>
                    <tr className="bg-[#e6f2ff] text-slate-900 font-sans italic font-bold border-b border-slate-900 text-[11px]">
                      <th className="p-2 border-r border-slate-900 w-1/5 text-left">Date(s)</th>
                      <th className="p-2 border-r border-slate-900 w-2/5 text-left">Activity / Club</th>
                      <th className="p-2 border-r border-slate-900 w-1/4 text-left">Organized by</th>
                      <th className="p-2 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-sans text-xs">
                    {areaCItems.map(item => (
                      <tr 
                        key={item.id} 
                        onClick={() => scrollToProofForItem(item)}
                        title="Click row to jump to attached proof certificate document"
                        className="hover:bg-emerald-50/90 transition-colors cursor-pointer group"
                      >
                        <td className="p-2 border-r border-slate-900 font-sans text-[11px]">{item.date_display || item.date || 'SY 2025-2026'}</td>
                        <td className="p-2 border-r border-slate-900 font-bold group-hover:text-emerald-900">{item.title}</td>
                        <td className="p-2 border-r border-slate-900">{item.issuer || 'NDMU OSAD / LGU'}</td>
                        <td className="p-2 font-bold text-[#064e2b] group-hover:text-emerald-700 flex items-center justify-between gap-1">
                          <span>Official Faculty Moderator</span>
                          <ExternalLink className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* C.3 Years of Service at NDMU */}
                <div className="bg-[#183a54] text-white font-bold p-1.5 pl-3 text-xs border-b border-slate-900">
                  2. YEARS OF SERVICE AT NDMU
                </div>
                <table className="w-full border-collapse text-slate-900">
                  <thead>
                    <tr className="bg-[#e6f2ff] text-slate-900 font-sans italic font-bold border-b border-slate-900 text-[11px]">
                      <th className="p-2 border-r border-slate-900 w-1/5 text-left">Service Period</th>
                      <th className="p-2 border-r border-slate-900 w-2/5 text-left">Institution</th>
                      <th className="p-2 border-r border-slate-900 w-1/4 text-left">Total Years</th>
                      <th className="p-2 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="font-sans text-xs">
                    <tr>
                      <td className="p-2 border-r border-slate-900 font-sans text-[11px]">2016 – Present</td>
                      <td className="p-2 border-r border-slate-900 font-bold">Notre Dame of Marbel University</td>
                      <td className="p-2 border-r border-slate-900 font-bold">{yearsOfService} Years Full-Time Service</td>
                      <td className="p-2 font-bold text-[#064e2b]">Active Permanent Faculty</td>
                    </tr>
                  </tbody>
                </table>

              </div>

              {/* Official Signature Line Block */}
              <div className="pt-8 flex justify-end">
                <div className="text-center space-y-1 font-sans">
                  <div className="w-72 border-b-2 border-slate-900 pb-1">
                    <span className="font-bold text-sm text-slate-900">{facultyName}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">Signature over Printed Name</p>
                  <p className="text-[10px] text-slate-500 font-sans font-medium">{academicRank} • {affiliation}</p>
                </div>
              </div>

            </div>

            {/* Document Footer */}
            <div className="border-t border-slate-300 pt-3 flex items-center justify-between text-xs text-slate-500 font-sans font-medium">
              <span>Notre Dame of Marbel University • Formal Faculty Portfolio Sign-Off</span>
              <span>Page {pageNum} of {totalPages}</span>
            </div>

          </div>
        )

      // ================= PAGES 3+: ATTACHED CERTIFICATE PROOF DOCUMENTS (REVERSE CHRONO) =================
      case 'ATTACHED_PROOF': {
        const item = slide.item
        if (!item) return null

        return (
          <div className="w-[780px] min-h-[1010px] bg-white text-slate-900 p-6 sm:p-8 rounded border border-slate-200 font-sans flex flex-col justify-between shadow-lg">
            
            {/* Minimal Header Strip */}
            <div className="border-b border-slate-300 pb-2 flex items-center justify-between text-xs text-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#0f2537] text-white text-[10px] font-bold">
                  {item.category_code || 'ATTACHMENT'}
                </span>
                <span className="font-bold text-slate-900 truncate max-w-[480px]">
                  {item.title}
                </span>
              </div>
              <span className="italic text-slate-500 text-[11px]">
                {item.issuer || 'Official Proof Attachment'}
              </span>
            </div>

            {/* Full-Page Document / Certificate Container (No Extra Text Blocks) */}
            <div className="my-auto flex-1 py-3 flex items-center justify-center">
              <div className="w-full h-full min-h-[870px] bg-slate-50 rounded-lg border border-slate-300 overflow-hidden flex items-center justify-center shadow-inner">
                <img 
                  src={item.proof_preview_url || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80'} 
                  alt={`Attached Proof: ${item.title}`} 
                  className="w-full h-full object-contain p-2" 
                />
              </div>
            </div>

            {/* Page Footer */}
            <div className="border-t border-slate-300 pt-3 flex items-center justify-between text-xs text-slate-500 font-medium shrink-0">
              <span>NDMU Faculty Development Portfolio • Attached Certificate Proof</span>
              <span>Page {pageNum} of {totalPages}</span>
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200 font-sans ${
      isDark ? 'bg-black/85 text-slate-100' : 'bg-slate-900/60 text-slate-900'
    }`}>
      
      <div ref={canvasRef} className={`w-full max-w-6xl max-h-[96vh] rounded-3xl border flex flex-col overflow-hidden shadow-2xl transition-colors duration-200 ${
        isDark ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-200'
      }`}>
        
        {/* ================= TOP TOOLBAR ================= */}
        <div className={`px-4 py-2.5 border-b backdrop-blur-md flex items-center justify-between gap-3 shrink-0 font-sans transition-colors duration-200 ${
          isDark ? 'bg-slate-950/95 border-slate-800/90 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
        }`}>
          
          {/* Left Section: Institutional Branding Anchor */}
          <div className="flex items-center gap-2">
            <Award className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>NDMU Portfolio Booklet</span>
          </div>

          {/* Center Section: Centered Document Navigation & Viewing Controls */}
          <div className="flex items-center gap-2">
            {/* Unified Page Stepper */}
            <div className={`flex items-center border rounded-xl p-1 shadow-xs ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}>
              <button 
                type="button" 
                disabled={currentPage === 1} 
                onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
                className={`p-1 rounded-lg disabled:opacity-30 transition cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
                }`} 
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className={`text-xs font-bold font-mono px-2.5 py-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Page {currentPage} <span className={isDark ? 'text-slate-500 font-normal' : 'text-slate-400 font-normal'}>/ {totalPages}</span>
              </span>

              <button 
                type="button" 
                disabled={currentPage === totalPages} 
                onClick={() => scrollToPage(Math.min(totalPages, currentPage + 1))}
                className={`p-1 rounded-lg disabled:opacity-30 transition cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
                }`} 
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Control Bar */}
            <div className={`flex items-center border rounded-xl px-1.5 py-1 font-mono text-xs ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'
            }`}>
              <button 
                type="button" 
                onClick={() => setZoomLevel(prev => Math.max(75, prev - 25))} 
                className={`p-1 transition cursor-pointer ${isDark ? 'hover:text-emerald-400 text-slate-400' : 'hover:text-emerald-700 text-slate-500'}`} 
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              
              <span className={`text-[11px] font-bold w-11 text-center font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{zoomLevel}%</span>
              
              <button 
                type="button" 
                onClick={() => setZoomLevel(prev => Math.min(125, prev + 25))} 
                className={`p-1 transition cursor-pointer ${isDark ? 'hover:text-emerald-400 text-slate-400' : 'hover:text-emerald-700 text-slate-500'}`} 
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button 
              type="button" 
              onClick={toggleFullscreen} 
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700'
              }`} 
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Right Section: Primary Export PDF Action & Far-Right Close Button */}
          <div className="flex items-center gap-2">
            {/* Primary Action: Export PDF */}
            <button 
              type="button" 
              onClick={() => window.print()} 
              className="px-4 py-2 rounded-xl bg-[#EFF7F0] hover:bg-[#122e22] text-white text-xs font-bold flex items-center gap-2 transition border border-emerald-600/60 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Export PDF</span>
            </button>

            <div className={`h-4 w-px mx-1 ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`}></div>

            {/* Far-Right Close Button */}
            <button 
              type="button" 
              onClick={onClose} 
              className={`p-2 rounded-xl border transition cursor-pointer shadow-xs ${
                isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-600 hover:text-slate-950'
              }`} 
              title="Close Booklet Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= MAIN WORKSPACE: SIDEBAR + SCROLLABLE CANVAS ================= */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          
          {/* LEFT SIDEBAR: Compact Document Navigator */}
          <div className={`lg:col-span-3 border-r flex flex-col h-full max-h-[84vh] overflow-hidden font-sans transition-colors duration-200 ${
            isDark ? 'bg-slate-950 border-slate-800/90 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}>
            
            {/* Sticky Top Header & Search Input */}
            <div className={`p-3 border-b shrink-0 space-y-2.5 ${
              isDark ? 'border-slate-800/90 bg-slate-950' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                  <h3 className={`text-[11px] font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Document Navigator
                  </h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${
                  isDark ? 'bg-slate-900 border-slate-800 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-[#064e2b]'
                }`}>
                  {totalPages} Pages
                </span>
              </div>

              {/* Search Input Bar */}
              <div className="relative">
                <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={sidebarQuery}
                  onChange={(e) => setSidebarQuery(e.target.value)}
                  placeholder="Search pages or proof title..."
                  className={`w-full pl-8 pr-7 py-1.5 border rounded-lg text-xs font-medium transition focus:outline-none ${
                    isDark 
                      ? 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-emerald-500/60' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                  }`}
                />
                {sidebarQuery && (
                  <button
                    type="button"
                    onClick={() => setSidebarQuery('')}
                    className={`absolute right-2 top-2 transition cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Navigator List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4 no-scrollbar">
              
              {/* Section 1: Institutional HR Dossier */}
              {hrSlides.length > 0 && (
                <div>
                  <div className={`flex items-center justify-between px-2 py-1 mb-1 text-[10px] font-bold uppercase tracking-wider ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      <FileSpreadsheet className={`w-3 h-3 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                      <span>Institutional Dossier</span>
                    </span>
                    <span className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>2 HR Pages</span>
                  </div>
                  <div className="space-y-1">
                    {hrSlides.map((slide) => {
                      const pageNum = slide.pageNum
                      const isSelected = currentPage === pageNum
                      return (
                        <button
                          key={slide.id}
                          type="button"
                          onClick={() => scrollToPage(pageNum)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2.5 group relative ${
                            isSelected
                              ? isDark
                                ? 'bg-[#122e22]/90 border border-emerald-500/50 text-white font-bold shadow-xs'
                                : 'bg-emerald-100/90 border border-emerald-600/60 text-[#064e2b] font-bold shadow-xs'
                              : isDark
                                ? 'bg-slate-900/40 hover:bg-slate-900 border border-transparent text-slate-300'
                                : 'bg-white hover:bg-slate-200/60 border border-slate-200/80 text-slate-800'
                          }`}
                        >
                          {/* Active Left Accent Bar */}
                          {isSelected && (
                            <span className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full shadow-xs ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
                          )}

                          {/* Page Number Tag */}
                          <span className={`text-[10px] font-extrabold font-mono px-1.5 py-0.5 rounded shrink-0 ${
                            isSelected
                              ? isDark
                                ? 'bg-emerald-500/20 text-[#245F42] border border-emerald-500/30'
                                : 'bg-emerald-200 text-[#064e2b] border border-emerald-400'
                              : isDark
                                ? 'bg-slate-800 text-slate-400 border border-slate-700/60'
                                : 'bg-slate-200 text-slate-700 border border-slate-300'
                          }`}>
                            P.{pageNum}
                          </span>

                          {/* Label & Subtitle */}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate leading-tight">
                              {slide.label}
                            </p>
                            <p className={`text-[10px] truncate mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                              {slide.subtitle}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Section 2: Attached Proof Documents */}
              {proofSlides.length > 0 && (
                <div>
                  <div className={`flex items-center justify-between px-2 py-1 mb-1 text-[10px] font-bold uppercase tracking-wider ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className={`w-3 h-3 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                      <span>Attached Proofs</span>
                    </span>
                    <span className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{proofSlides.length} Files</span>
                  </div>
                  <div className="space-y-1">
                    {proofSlides.map((slide) => {
                      const pageNum = slide.pageNum
                      const isSelected = currentPage === pageNum
                      return (
                        <button
                          key={slide.id}
                          type="button"
                          onClick={() => scrollToPage(pageNum)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2.5 group relative ${
                            isSelected
                              ? isDark
                                ? 'bg-[#122e22]/90 border border-emerald-500/50 text-white font-bold shadow-xs'
                                : 'bg-emerald-100/90 border border-emerald-600/60 text-[#064e2b] font-bold shadow-xs'
                              : isDark
                                ? 'bg-slate-900/40 hover:bg-slate-900 border border-transparent text-slate-300'
                                : 'bg-white hover:bg-slate-200/60 border border-slate-200/80 text-slate-800'
                          }`}
                        >
                          {/* Active Left Accent Bar */}
                          {isSelected && (
                            <span className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full shadow-xs ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
                          )}

                          {/* Page Number Tag */}
                          <span className={`text-[10px] font-extrabold font-mono px-1.5 py-0.5 rounded shrink-0 ${
                            isSelected
                              ? isDark
                                ? 'bg-emerald-500/20 text-[#245F42] border border-emerald-500/30'
                                : 'bg-emerald-200 text-[#064e2b] border border-emerald-400'
                              : isDark
                                ? 'bg-slate-800 text-slate-400 border border-slate-700/60'
                                : 'bg-slate-200 text-slate-700 border border-slate-300'
                          }`}>
                            P.{pageNum}
                          </span>

                          {/* Micro Category Tag */}
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border max-w-[65px] truncate shrink-0 ${
                            isDark ? 'bg-slate-800/80 border-slate-700/60 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          }`}>
                            {slide.badge}
                          </span>

                          {/* Proof Title */}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate leading-tight" title={slide.item?.title || slide.label}>
                              {slide.item?.title || slide.label}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Empty State when search returns no results */}
              {filteredSlides.length === 0 && (
                <div className={`text-center py-8 px-4 border border-dashed rounded-xl ${
                  isDark ? 'border-slate-800' : 'border-slate-300'
                }`}>
                  <Search className={`w-6 h-6 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                  <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No pages matched</p>
                  <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Try searching with another keyword</p>
                  <button
                    type="button"
                    onClick={() => setSidebarQuery('')}
                    className={`mt-2 text-[10px] font-bold hover:underline cursor-pointer ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}
                  >
                    Clear filter
                  </button>
                </div>
              )}

            </div>

            {/* Compact Footer Status */}
            <div className={`px-3 py-2 border-t shrink-0 flex items-center justify-between text-[10px] font-medium ${
              isDark ? 'border-slate-800/90 bg-slate-950 text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}>
              <span>NDMU Faculty Portfolio</span>
              <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Reverse Chrono</span>
            </div>

          </div>

          {/* RIGHT COLUMN: SCROLLABLE CANVAS VIEWPORT */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={`lg:col-span-9 overflow-y-auto px-4 py-6 transition-colors duration-200 ${
              isDark ? 'bg-slate-950' : 'bg-[#e7f0e6]'
            }`}
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
