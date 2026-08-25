import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ExportPortfolioPreviewModal from '../student/modals/ExportPortfolioPreviewModal'
import EditBasicInfoModal from './modals/EditBasicInfoModal'
import PersonnelPortfolioBookletModal from './PersonnelPortfolioBookletModal'
import campusBanner from '../../assets/ndmu_campus_banner.png'

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
import { getCurrentUser } from '../../services/authService'
import { usePersonnelPortfolio } from '../../hooks/usePersonnelPortfolio'

export default function PersonnelPortfolioPage({ currentUser }) {
  const navigate = useNavigate()
  const activeUser = currentUser || getCurrentUser()
  const activeRoleContext = activeUser?.active_role_context || 'personnel'

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
    <>
      <div className="space-y-6 font-sans">

        {/* ================= 1. PAGE TITLE HEADER (DARK MODE COMPATIBLE) ================= */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Personnel Portfolio</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Faculty Profile Showcase • Present your portfolio using Canva-Style Booklet Viewer with 1 Page per Accomplishment.
          </p>
        </div>

        {/* Copy Toast Alert */}
        {showCopiedToast && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-[#245F42] text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Portfolio link copied to clipboard!</span>
          </div>
        )}

        {/* ================= 2. HERO PROFILE BANNER (COMPACT & SLEEK) ================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6 relative">

          {/* SVG Background Layer */}
          <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
            <svg viewBox="0 0 1200 180" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="heroGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#143d2b" />
                  <stop offset="50%" stopColor="#064e2b" />
                  <stop offset="100%" stopColor="#0d281e" />
                </linearGradient>
              </defs>
              <path d="M 0,0 L 180,0 C 160,50 130,110 45,180 L 0,180 Z" fill="url(#heroGreenGrad)" />
            </svg>

            <div className="absolute top-0 left-0 w-[14%] h-full mix-blend-overlay opacity-30 pointer-events-none overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 25% 100%, 0 100%)' }}>
              <img
                src={campusBanner}
                alt="NDMU Campus Backdrop"
                width="1200"
                height="180"
                className="w-full h-full object-cover"
                decoding="async"
                loading="eager"
              />
            </div>
          </div>

          {/* Banner Body */}
          <div className="relative z-20 p-5 sm:p-6 space-y-4">

            {/* Top Brand & Motto Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-950/90 border border-amber-300/50 flex items-center justify-center text-amber-300 text-xs shadow-md shrink-0">
                  🔰
                </div>
                <div className="leading-tight">
                  <span className="text-xs font-black tracking-tight text-white block">AchieveNest</span>
                  <span className="text-[8px] font-bold text-[#245F42] tracking-widest uppercase block">NDMU</span>
                </div>
              </div>

              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide font-serif italic hidden sm:block">
                Character, Competence and Culture in harmony
              </div>
            </div>

            {/* Main Info & Metrics Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pt-1">

              {/* Avatar + Faculty Info */}
              <div className="flex items-center gap-5 sm:gap-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 border-white dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 overflow-hidden shrink-0 aspect-square">
                  <img
                    src={personnel.avatar_url}
                    alt={personnel.full_name}
                    width="96"
                    height="96"
                    className="w-full h-full object-cover rounded-full aspect-square"
                    fetchpriority="high"
                    decoding="async"
                    loading="eager"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{personnel.full_name}</h2>
                    <span className="w-4 h-4 rounded-full bg-[#16834a] text-white inline-flex items-center justify-center text-[10px] shadow-xs font-bold" title="Verified Account">
                      ✓
                    </span>
                  </div>

                  <p className="text-xs font-extrabold text-[#16834a] dark:text-emerald-400">Associate Professor • {personnel.department || 'College of IT'}</p>

                  {/* Compact Credential Chips Row */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                    <span className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#16834a] dark:text-emerald-400" />
                      {personnel.department || 'College of Information Technology'}
                    </span>

                    <span className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-[#16834a] dark:text-emerald-400" />
                      ID: {personnel.employee_id || 'EMP-2021-0842'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Portfolio Actions */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {/* Action: Portfolio Booklet View */}
                <button
                  type="button"
                  onClick={() => setIsCanvaModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#245F42] hover:bg-[#1B4731] text-white text-xs font-extrabold flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Portfolio Booklet View</span>
                  <Sparkles className="w-3 h-3 text-amber-300" />
                </button>

                {/* Action 1: Edit Profile */}
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-[#DCE6DF] dark:border-slate-700 text-[#183B2A] dark:text-slate-200 hover:bg-[#F1F7F2] dark:hover:bg-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#159552]" />
                  <span>Edit Profile</span>
                </button>

                {/* Action 2: Manage Portfolio Draft */}
                <button
                  type="button"
                  onClick={() => navigate('/personnel/portfolio/edit')}
                  className="px-4 py-2 rounded-xl bg-[#159552] hover:bg-[#117A43] active:scale-[0.99] text-white text-xs font-extrabold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>Manage Portfolio Draft</span>
                </button>

                {/* Action 3: Share */}
                <button
                  type="button"
                  onClick={handleShareProfile}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-[#DCE6DF] dark:border-slate-700 text-[#183B2A] dark:text-slate-200 hover:bg-[#F1F7F2] dark:hover:bg-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#159552]" />
                  <span>Share</span>
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* ================= 3. TWO COLUMN MAIN CONTENT GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN: ABOUT ME, TIMELINE & FEATURED ACCOMPLISHMENTS */}
          <div className="lg:col-span-8 space-y-6">

            {/* ABOUT ME CARD */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                  <Users className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
                  <span>About Me</span>
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {personnel.about_me}
              </p>
            </div>

            {/* EXPERIENCE & ACADEMIC INVOLVEMENT TIMELINE CARD */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
                  <span>Experience & Involvement</span>
                </h3>
              </div>

              <div className="space-y-3 pt-1">
                {experiences.map((exp) => {
                  const Icon = exp.icon
                  return (
                    <div key={exp.id} className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                      <div className="w-9 h-9 rounded-xl bg-[#16834a] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{exp.role}</h4>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{exp.period}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{exp.organization}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* FEATURED ACCOMPLISHMENTS GRID */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                  <Trophy className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
                  <span>Featured Accomplishments</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{verifiedAccomplishments.length} verified</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {verifiedAccomplishments.map((item) => {
                  const ItemIcon = item.icon
                  return (
                    <div key={item.id} className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#064e2b] dark:text-[#245F42] text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                            {item.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#245F42] text-[10px] font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Verified</span>
                          </span>
                        </div>

                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-2">{item.title}</h4>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
                        <span>{item.date}</span>
                        <ItemIcon className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
                      </div>
                    </div>
                  )
                })}
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: CONTACT INFO, SKILLS & ACCOMPLISHMENTS BY CATEGORY */}
          <div className="lg:col-span-4 space-y-6">

            {/* CONTACT INFORMATION CARD */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                  <Mail className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
                  <span>Contact Information</span>
                </h3>
              </div>

              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">EMAIL</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{personnel.email}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">PHONE</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{personnel.phone}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">LOCATION</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{personnel.location}</span>
                </div>
              </div>
            </div>

            {/* KEY SKILLS & COMPETENCIES CARD */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                  <Star className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
                  <span>Key Competencies</span>
                </h3>
              </div>

              <div className="space-y-3 pt-1">
                {skills.map((skill, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{skill.name}</span>
                      <span className="font-extrabold text-[#16834a] dark:text-emerald-400 text-[10px]">{skill.label}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-[#16834a] dark:bg-emerald-500 rounded-full" style={{ width: `${(skill.level / 3) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Edit Basic Info Modal */}
      {isEditModalOpen && (
        <EditBasicInfoModal
          user={personnel}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Portfolio Booklet View Presenter Modal */}
      <PersonnelPortfolioBookletModal
        isOpen={isCanvaModalOpen}
        onClose={() => setIsCanvaModalOpen(false)}
        portfolio={portfolio}
        user={personnel}
      />
    </>
  )
}
