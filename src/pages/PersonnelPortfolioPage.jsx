import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import ExportPortfolioPreviewModal from '../components/student/ExportPortfolioPreviewModal'
import EditBasicInfoModal from '../components/personnel/EditBasicInfoModal'
import PersonnelPortfolioCanvaView from '../components/personnel/PersonnelPortfolioCanvaView'
import { 
  Trophy, 
  CheckCircle2, 
  Award, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  Mail, 
  Phone, 
  Users, 
  BookOpen, 
  Heart, 
  Star, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  Check,
  Share2,
  Download,
  Edit3,
  Building2,
  Sparkles,
  ExternalLink,
  Paperclip,
  Clock,
  CreditCard
} from 'lucide-react'
import { getCurrentUser } from '../services/authService'
import { usePersonnelPortfolio } from '../hooks/usePersonnelPortfolio'

export default function PersonnelPortfolioPage({ currentUser }) {
  const navigate = useNavigate()
  const activeUser = currentUser || getCurrentUser()
  const activeRoleContext = activeUser?.active_role_context || 'personnel'

  React.useEffect(() => {
    if (['organization_moderator', 'program_coordinator', 'department_secretary'].includes(activeRoleContext)) {
      navigate('/personnel/dashboard', { replace: true })
    }
  }, [activeRoleContext, navigate])

  const { portfolio } = usePersonnelPortfolio(activeUser?.employee_id || 'EMP-2021-0842')

  // Modals & Toast State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCanvaModalOpen, setIsCanvaModalOpen] = useState(false)
  const [showCopiedToast, setShowCopiedToast] = useState(false)

  // Personnel Profile State
  const [personnel, setPersonnel] = useState(activeUser || {
    full_name: 'Dr. Maria Santos',
    student_id: 'EMP-2021-0842',
    employee_id: 'EMP-2021-0842',
    program: 'Department of Computer Studies',
    department: 'Department of Computer Studies',
    designation: 'Associate Professor & Research Coordinator',
    year_level: '8 Years Service',
    age: 38,
    location: 'Koronadal City, South Cotabato',
    email: 'faculty@ndmu.edu.ph',
    phone: '+63 917 845 2910',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    about_me: 'I am a dedicated Associate Professor and Research Coordinator at Notre Dame of Marbel University with over 8 years of experience in computer science education, AI research, and institutional extension services. Passionate about leveraging technology for community development and student mentorship.'
  })

  // Experience & Academic Involvement Timeline State
  const [experiences, setExperiences] = useState([
    {
      id: 1,
      role: 'Research Coordinator',
      organization: 'College of Information Technology Education (CITE)',
      period: 'Aug 2024 – Present',
      icon: BookOpen
    },
    {
      id: 2,
      role: 'Associate Professor',
      organization: 'Department of Computer Studies – NDMU',
      period: 'AY 2022–Present',
      icon: GraduationCap
    },
    {
      id: 3,
      role: 'LGU Digital Extension Lead',
      organization: 'Koronadal City Governance IT Extension',
      period: 'Jan – Dec 2025',
      icon: Heart
    },
    {
      id: 4,
      role: 'CHED Curriculum Committee Member',
      organization: 'Commission on Higher Education Region XII',
      period: 'AY 2024–2025',
      icon: ShieldCheck
    },
    {
      id: 5,
      role: 'IEEE Senior Member',
      organization: 'IEEE Philippine Section',
      period: 'Jun 2021 – Present',
      icon: Award
    }
  ])

  // Skills State
  const [skills, setSkills] = useState([
    { name: 'Artificial Intelligence', level: 3, label: 'Expert' },
    { name: 'Data Analytics', level: 3, label: 'Expert' },
    { name: 'Community Extension', level: 3, label: 'Expert' },
    { name: 'Cloud Architecture', level: 2, label: 'Proficient' },
    { name: 'Faculty Mentorship', level: 3, label: 'Expert' }
  ])

  // Verified Accomplishments State
  const [verifiedAccomplishments] = useState([
    {
      id: 1,
      title: 'Machine Learning Frameworks in Education Analytics',
      category: 'Research & Publications',
      date: 'Apr 15, 2026',
      icon: BookOpen,
      status: 'Verified'
    },
    {
      id: 2,
      title: 'NDMU Outstanding Research Faculty of the Year',
      category: 'Institutional Awards',
      date: 'Jan 10, 2026',
      icon: Award,
      status: 'Verified'
    },
    {
      id: 3,
      title: 'CHED Regional Training on AI Curriculum',
      category: 'Seminars & Workshops',
      date: 'Mar 20, 2026',
      icon: Users,
      status: 'Verified'
    }
  ])

  // Share Profile Handler
  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href)
    setShowCopiedToast(true)
    setTimeout(() => setShowCopiedToast(false), 3000)
  }

  // Save Profile Handler
  const handleSaveProfile = (updatedData) => {
    setPersonnel(prev => ({
      ...prev,
      ...updatedData
    }))
  }

  // Redirect to Achievements with filtered category
  const handleCategoryClick = (categoryName) => {
    navigate('/personnel/achievements', { state: { selectedCategory: categoryName } })
  }

  return (
    <MainLayout>
      <div className="space-y-6 font-sans">
        
        {/* ================= 1. PAGE TITLE HEADER ================= */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Personnel Portfolio</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Faculty Profile Showcase • Present your portfolio using Canva-Style Booklet Viewer with 1 Page per Accomplishment.
          </p>
        </div>

        {/* Copy Toast Alert */}
        {showCopiedToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Portfolio link copied to clipboard!</span>
          </div>
        )}

        {/* ================= 2. HERO PROFILE BANNER (EXACT SPECIFICATION IMPLEMENTATION) ================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6 relative">
          
          {/* SVG Background Layer: Left-Oriented Green Curvy Banner Shape with Faded Campus Backdrop */}
          <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
            <svg viewBox="0 0 1200 240" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="heroGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#143d2b" />
                  <stop offset="50%" stopColor="#1b4332" />
                  <stop offset="100%" stopColor="#0d281e" />
                </linearGradient>
                <pattern id="latticePattern" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M0 24L24 0M0 0l24 24" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.08" />
                </pattern>
                <clipPath id="leftGreenCurveClip">
                  <path d="M 0,0 L 220,0 C 210,70 170,150 90,240 L 0,240 Z" />
                </clipPath>
              </defs>
              
              {/* Left Green Curvy Shape Background (Matches Exact User Drawn Curve Line) */}
              <path d="M 0,0 L 220,0 C 210,70 170,150 90,240 L 0,240 Z" fill="url(#heroGreenGrad)" />
              <path d="M 0,0 L 220,0 C 210,70 170,150 90,240 L 0,240 Z" fill="url(#latticePattern)" />
            </svg>

            {/* Campus Background Image Overlay clipped to Left Green Curvy Shape */}
            <div className="absolute top-0 left-0 w-[18%] h-full mix-blend-overlay opacity-30 pointer-events-none overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 40% 100%, 0 100%)' }}>
              <img
                src="/assets/ndmu_campus_banner-Cf5FMJ9w.png"
                alt="NDMU Campus Backdrop"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Banner Header Body: Left Brand Logo & Right University Motto */}
          <div className="relative z-10 px-6 pt-5 sm:px-8 sm:pt-6 flex items-center justify-between">
            {/* NDMU Brand Logo & Seal (Left on Green Shape) */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-950/90 border border-amber-300/50 flex items-center justify-center text-amber-300 text-sm shadow-md shrink-0">
                🔰
              </div>
              <div className="leading-tight">
                <span className="text-sm font-black tracking-tight text-white block">AchieveNest</span>
                <span className="text-[9px] font-bold text-emerald-200 tracking-widest uppercase block">NDMU</span>
              </div>
            </div>

            {/* Motto Right (On Reserved White Area) */}
            <div className="text-xs font-semibold text-slate-400 tracking-wide font-serif italic hidden sm:block">
              Veritas • Caritas • Excellentia
            </div>
          </div>

          {/* White Reserved Content Area with Overlapping Avatar & Details */}
          <div className="px-6 pb-6 pt-6 sm:px-8 sm:pb-8 relative z-20">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              
              {/* Left Column: Avatar Overlapping 1/3 Green & 2/3 White + Reserved White Details */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                
                {/* Circular Profile Avatar (1/3 overlaps green curvy shape on left, 2/3 on white) */}
                <div className="relative shrink-0 z-30 sm:-mb-1">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden">
                    <img
                      src={personnel.avatar_url}
                      alt={personnel.full_name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                </div>

                {/* Faculty Details & Info Chips (In Reserved White Content Space) */}
                <div className="space-y-1.5 pt-1 sm:pt-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">{personnel.full_name}</h2>
                    <span className="w-5 h-5 rounded-full bg-[#2d8a4e] text-white inline-flex items-center justify-center text-xs shadow-xs font-bold" title="Verified Account">
                      ✓
                    </span>
                  </div>

                  <p className="text-xs font-extrabold text-[#2d8a4e]">Associate Professor</p>
                  <p className="text-xs text-slate-600 font-semibold">{personnel.department || 'College of Information Technology'}</p>
                  <p className="text-xs text-slate-500 font-medium">Notre Dame of Marbel University</p>

                  {/* Compact Credential Chips Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px]">
                    <div className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/90 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2d8a4e]" />
                      <span>Ph.D. in Information Technology</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/90 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs">
                      <Clock className="w-3.5 h-3.5 text-[#2d8a4e]" />
                      <span>10+ Years of Service</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/90 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs">
                      <CreditCard className="w-3.5 h-3.5 text-[#2d8a4e]" />
                      <span>Faculty ID: 2025-001</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Far-Right Column: Edit Profile (Top), 4 Stat Cards (Middle), Share & Export Buttons (Bottom) */}
              <div className="flex flex-col items-start lg:items-end justify-between gap-4 shrink-0 pt-2 lg:pt-0">
                
                {/* Upper Right Action Button: Edit Profile */}
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[#1b4332] text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#2d8a4e]" />
                  <span>Edit Profile</span>
                </button>

                {/* 4 Summary Stat Cards Row */}
                <div className="flex items-center gap-2.5">
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-3 text-center min-w-[84px] shadow-2xs">
                    <span className="text-xl font-black text-[#1b4332] block leading-none">5</span>
                    <span className="text-[10px] font-bold text-slate-600 mt-1 block">Achievements</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-3 text-center min-w-[84px] shadow-2xs">
                    <span className="text-xl font-black text-[#1b4332] block leading-none">8</span>
                    <span className="text-[10px] font-bold text-slate-600 mt-1 block">Publications</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-3 text-center min-w-[84px] shadow-2xs">
                    <span className="text-xl font-black text-[#1b4332] block leading-none">12</span>
                    <span className="text-[10px] font-bold text-slate-600 mt-1 block">Trainings</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-3 text-center min-w-[84px] shadow-2xs">
                    <span className="text-xl font-black text-[#1b4332] block leading-none">3</span>
                    <span className="text-[10px] font-bold text-slate-600 mt-1 block">Awards</span>
                  </div>
                </div>

                {/* Lower Right Action Buttons: Share & Export Portfolio */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShareProfile}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Share</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#1b4332] hover:bg-[#123124] text-white text-xs font-extrabold flex items-center gap-1.5 transition shadow-md cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Portfolio</span>
                    <Download className="w-3 h-3 text-emerald-300" />
                  </button>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* ================= 3. TWO COLUMN MAIN CONTENT GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN (8/12 width): ABOUT ME, TIMELINE & FEATURED ACCOMPLISHMENTS */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* ABOUT ME CARD */}
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                  <Users className="w-4 h-4 text-[#2d8a4e]" />
                  <span>About Me</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-[11px] font-bold text-[#2d8a4e] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {personnel.about_me}
              </p>
            </div>

            {/* EXPERIENCE & ACADEMIC INVOLVEMENT TIMELINE CARD */}
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-[#2d8a4e]" />
                  <span>Experience & Involvement</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-[11px] font-bold text-[#2d8a4e] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {experiences.map((exp) => {
                  const Icon = exp.icon
                  return (
                    <div key={exp.id} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-3.5 transition hover:bg-slate-50">
                      <div className="w-9 h-9 rounded-xl bg-[#2d8a4e] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{exp.role}</h4>
                          <span className="text-[10px] font-bold text-slate-400">{exp.period}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{exp.organization}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* FEATURED ACCOMPLISHMENTS GRID */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                  <Trophy className="w-4 h-4 text-[#2d8a4e]" />
                  <span>Featured Accomplishments</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-400">{verifiedAccomplishments.length} verified</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {verifiedAccomplishments.map((item) => {
                  const ItemIcon = item.icon
                  return (
                    <div key={item.id} className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1b4332] text-[10px] font-bold border border-emerald-100">
                            {item.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        </div>

                        <h4 className="text-xs font-extrabold text-slate-900 line-clamp-2">{item.title}</h4>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-semibold">
                        <span>{item.date}</span>
                        <ItemIcon className="w-4 h-4 text-[#2d8a4e]" />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* CARD BUTTON TO REDIRECT PERSONNEL TO ALL ACHIEVEMENTS SECTION */}
              <button
                type="button"
                onClick={() => navigate('/personnel/achievements')}
                className="w-full p-4 rounded-3xl bg-emerald-50/70 hover:bg-emerald-100/80 border-2 border-dashed border-[#2d8a4e]/40 hover:border-[#2d8a4e] flex items-center justify-between text-xs font-bold text-slate-800 transition cursor-pointer group shadow-2xs mt-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#1b4332] text-amber-300 flex items-center justify-center font-extrabold shadow-sm group-hover:scale-105 transition-transform">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#2d8a4e] transition">View All Logged Achievements</h4>
                    <p className="text-xs text-slate-500 font-medium">Browse, search, filter, and manage your complete accomplishment records vault</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[#2d8a4e] font-extrabold text-xs group-hover:translate-x-1 transition-transform shrink-0 pl-2">
                  <span>Open Achievements Vault</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN (4/12 width): CONTACT INFO, SKILLS & ACCOMPLISHMENTS BY CATEGORY */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* CONTACT INFORMATION CARD */}
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                  <Mail className="w-4 h-4 text-[#2d8a4e]" />
                  <span>Contact Information</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-[11px] font-bold text-[#2d8a4e] hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Email</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{personnel.email}</p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Phone</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{personnel.phone}</p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Address</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{personnel.location}</p>
                </div>
              </div>
            </div>

            {/* SKILLS & COMPETENCIES CARD */}
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                  <Star className="w-4 h-4 text-[#2d8a4e]" />
                  <span>Skills & Competencies</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-[11px] font-bold text-[#2d8a4e] hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-2">
                {skills.map((skill, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="flex items-center gap-0.5 text-[9px]">
                        <span className={skill.level >= 1 ? 'text-[#2d8a4e]' : 'text-slate-300'}>●</span>
                        <span className={skill.level >= 2 ? 'text-[#2d8a4e]' : 'text-slate-300'}>●</span>
                        <span className={skill.level >= 3 ? 'text-[#2d8a4e]' : 'text-slate-300'}>●</span>
                      </span>
                      <span>{skill.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{skill.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ACHIEVEMENTS BY CATEGORY CARD */}
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <Trophy className="w-4 h-4 text-[#2d8a4e]" />
                <span>Accomplishments by Category</span>
              </h3>

              <div className="space-y-2">
                {[
                  { name: 'Research & Publications', count: 2, icon: BookOpen },
                  { name: 'Seminars & Workshops', count: 1, icon: Users },
                  { name: 'Extension Services', count: 1, icon: Heart },
                  { name: 'Institutional Awards', count: 1, icon: Award }
                ].map((cat) => {
                  const IconC = cat.icon
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => handleCategoryClick(cat.name)}
                      className="w-full p-2.5 rounded-2xl bg-emerald-50/60 hover:bg-[#eef7f0] border border-emerald-100 flex items-center justify-between text-xs font-bold text-slate-800 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <IconC className="w-4 h-4 text-[#2d8a4e]" />
                        <span className="group-hover:text-[#2d8a4e] transition">{cat.name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-[#2d8a4e] text-[10px] font-extrabold shadow-2xs">
                        {cat.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

          </div>

        </div>

        {/* MODALS */}
        <EditBasicInfoModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentInfo={personnel}
          onSave={handleSaveProfile}
        />

        <ExportPortfolioPreviewModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          student={personnel}
          skills={skills}
          experiences={experiences}
        />

        {/* CANVA PORTFOLIO BOOKLET VIEWER MODAL (1 PAGE PER ACCOMPLISHMENT) */}
        <PersonnelPortfolioCanvaView
          isOpen={isCanvaModalOpen}
          onClose={() => setIsCanvaModalOpen(false)}
          portfolio={portfolio}
          user={personnel}
        />

        {/* FLOATING PERSISTENT PORTFOLIO BOOKLET BUTTON (LOWER RIGHT CORNER) */}
        <button
          type="button"
          onClick={() => setIsCanvaModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-5 py-3.5 rounded-full bg-[#1b4332] hover:bg-[#123124] text-amber-300 border-2 border-amber-300/40 shadow-2xl hover:shadow-emerald-900/50 font-extrabold text-xs flex items-center gap-2.5 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group"
          title="Open Canva-Style Portfolio Booklet View"
        >
          <div className="w-7 h-7 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-300 shrink-0 group-hover:rotate-12 transition">
            <BookOpen className="w-4 h-4 text-amber-300" />
          </div>
          <span className="tracking-wide">Portfolio Booklet View</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        </button>

      </div>
    </MainLayout>
  )
}
