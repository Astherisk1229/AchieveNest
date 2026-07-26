import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import ExportPortfolioPreviewModal from '../components/student/ExportPortfolioPreviewModal'
import EditBasicInfoModal from '../components/personnel/EditBasicInfoModal'
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
  Building2
} from 'lucide-react'
import { getCurrentUser } from '../services/authService'

export default function PersonnelPortfolioPage({ currentUser }) {
  const navigate = useNavigate()
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [showCopiedToast, setShowCopiedToast] = useState(false)

  // Personnel Profile State
  const [personnel, setPersonnel] = useState(currentUser || getCurrentUser() || {
    full_name: 'Dr. Maria Santos',
    student_id: 'EMP-2021-0842', // map to student_id field name for modal parity
    employee_id: 'EMP-2021-0842',
    program: 'Department of Computer Studies',
    department: 'Department of Computer Studies',
    designation: 'Associate Professor & Research Coordinator',
    year_level: '8 Years Service',
    age: 38,
    location: 'Koronadal City, South Cotabato',
    email: 'maria.santos@ndmu.edu.ph',
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

  // Skills & Core Competencies List State
  const [skills, setSkills] = useState([
    { name: 'Artificial Intelligence', level: 3, label: 'Expert' },
    { name: 'Data Analytics', level: 3, label: 'Expert' },
    { name: 'Academic Publishing', level: 3, label: 'Expert' },
    { name: 'Curriculum Development', level: 3, label: 'Expert' },
    { name: 'Grant Writing', level: 2, label: 'Proficient' },
    { name: 'Community Extension', level: 3, label: 'Expert' },
    { name: 'Cloud Architecture', level: 2, label: 'Proficient' },
    { name: 'Faculty Mentorship', level: 3, label: 'Expert' }
  ])

  // Featured Verified Accomplishments
  const featuredAchievements = [
    {
      id: 1,
      title: 'Machine Learning Frameworks in Education Analytics',
      date: 'Apr 15, 2026',
      category: 'Research & Publications',
      bannerBg: 'bg-[#2d8a4e]',
      emoji: '📄'
    },
    {
      id: 2,
      title: 'NDMU Outstanding Research Faculty of the Year',
      date: 'Jan 10, 2026',
      category: 'Institutional Awards',
      bannerBg: 'bg-[#2d8a4e]',
      emoji: '🏆'
    },
    {
      id: 3,
      title: 'CHED Regional Training on AI Curriculum',
      date: 'Mar 20, 2026',
      category: 'Seminars & Workshops',
      bannerBg: 'bg-[#2d8a4e]',
      emoji: '👥'
    }
  ]

  // Supporting Evidence Items
  const evidenceItems = [
    { id: 1, title: 'IEEE Journal Reprint', category: 'Research & Publications', emoji: '📄' },
    { id: 2, title: 'Outstanding Faculty Award Cert', category: 'Institutional Awards', emoji: '🏆' },
    { id: 3, title: 'LGU Extension MOU Certificate', category: 'Extension Services', emoji: '🤝' },
    { id: 4, title: 'CHED Keynote Speaker Cert', category: 'Seminars & Workshops', emoji: '👥' },
    { id: 5, title: 'AWS Cloud Certificate', category: 'Certifications & Licenses', emoji: '☁️' }
  ]

  // Save Callback from EditBasicInfoModal
  const handleSaveProfile = (updatedInfo) => {
    setPersonnel(prev => ({
      ...prev,
      ...updatedInfo,
      student_id: updatedInfo.employee_id || prev.employee_id
    }))
  }

  // Copy portfolio link
  const handleSharePortfolio = () => {
    const shareUrl = window.location.href
    navigator.clipboard.writeText(shareUrl)
    setShowCopiedToast(true)
    setTimeout(() => setShowCopiedToast(false), 3000)
  }

  // Navigate to Achievements catalog pre-filtered by category
  const handleCategoryClick = (catName) => {
    navigate('/personnel/achievements', { state: { selectedCategory: catName } })
  }

  return (
    <MainLayout>
      <div className="space-y-6 font-sans pb-12">
        
        {/* ================= TOP ACTION BAR: EDIT PROFILE, SHARE & EXPORT PORTFOLIO ================= */}
        <div className="flex items-center justify-end gap-3 relative">
          
          {showCopiedToast && (
            <div className="px-3.5 py-1.5 rounded-xl bg-[#2d8a4e] text-white text-xs font-bold shadow-md animate-in fade-in duration-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-200" />
              <span>Portfolio link copied to clipboard!</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 shadow-2xs hover:shadow-xs transition cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-[#2d8a4e]" />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            onClick={handleSharePortfolio}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 shadow-2xs hover:shadow-xs transition cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            <span>Share</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-4.5 py-2.5 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Portfolio</span>
          </button>

        </div>

        {/* ================= HERO HEADER PROFILE BANNER ================= */}
        <div className="bg-[#1b4332] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#245233] relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            
            {/* Left Avatar & Core Bio */}
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-emerald-500/40 p-1 bg-white overflow-hidden shadow-2xl">
                  <img
                    src={personnel.avatar_url}
                    alt={personnel.full_name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#2d8a4e] border-2 border-white flex items-center justify-center text-white shadow-md">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{personnel.full_name}</h1>
                <p className="text-xs text-emerald-200/90 font-medium tracking-wide">Emp ID: {personnel.employee_id}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-100/80 font-medium pt-1">
                  <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-emerald-300" /> {personnel.program}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-emerald-300" /> {personnel.year_level}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-300" /> {personnel.location}</span>
                </div>
              </div>
            </div>

            {/* Right 3 Stat Pills */}
            <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
              
              <div className="px-5 py-3 rounded-2xl bg-[#133220]/90 border border-emerald-600/30 text-center min-w-[75px] shadow-sm">
                <p className="text-2xl font-black text-white">5</p>
                <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Total</p>
              </div>

              <div className="px-5 py-3 rounded-2xl bg-[#133220]/90 border border-emerald-600/30 text-center min-w-[75px] shadow-sm">
                <p className="text-2xl font-black text-white">3</p>
                <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Verified</p>
              </div>

              <div className="px-5 py-3 rounded-2xl bg-[#133220]/90 border border-emerald-600/30 text-center min-w-[75px] shadow-sm">
                <p className="text-2xl font-black text-amber-300">45</p>
                <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Points</p>
              </div>

            </div>

          </div>

        </div>

        {/* ================= MAIN 2-COLUMN LAYOUT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ================= LEFT 2 COLUMNS: MAIN PORTFOLIO CONTENT ================= */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* ABOUT ME CARD */}
            <div className="p-6 sm:p-7 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#eef7f0] border border-[#cbe6d2] text-[#2d8a4e] flex items-center justify-center">
                    👤
                  </span>
                  <span>About Me</span>
                </h2>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-xs font-bold text-[#2d8a4e] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {personnel.about_me}
              </p>
            </div>

            {/* EXPERIENCE & INVOLVEMENT TIMELINE CARD */}
            <div className="p-6 sm:p-7 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#eef7f0] border border-[#cbe6d2] text-[#2d8a4e] flex items-center justify-center">
                    🏛️
                  </span>
                  <span>Experience & Involvement</span>
                </h2>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-xs font-bold text-[#2d8a4e] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {experiences.map((exp) => {
                  const IconComp = exp.icon || Users
                  return (
                    <div key={exp.id} className="relative flex items-start justify-between gap-4 group">
                      
                      {/* Timeline Dot Icon */}
                      <div className="absolute -left-6 top-0.5 w-7 h-7 rounded-full bg-[#2d8a4e] text-white flex items-center justify-center shadow-md ring-4 ring-white shrink-0">
                        <IconComp className="w-3.5 h-3.5" />
                      </div>

                      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 flex-1 hover:border-emerald-200 transition">
                        <h3 className="text-sm font-bold text-slate-900">{exp.role}</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{exp.organization}</p>
                      </div>

                      <span className="text-[11px] font-semibold text-slate-400 shrink-0 pt-2">
                        {exp.period}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* FEATURED ACHIEVEMENTS SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#eef7f0] border border-[#cbe6d2] text-[#2d8a4e] flex items-center justify-center">
                    🏆
                  </span>
                  <span>Featured Accomplishments</span>
                </h2>
                <span className="text-xs font-bold text-slate-400">3 verified</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {featuredAchievements.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl bg-white border border-slate-100 shadow-xs overflow-hidden hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="h-32 bg-[#2d8a4e] flex items-center justify-center text-4xl relative">
                      <span>{item.emoji}</span>
                      <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-white/90 text-[#1e5831] text-[10px] font-extrabold border border-white">
                        Verified
                      </span>
                    </div>
                    <div className="p-4 space-y-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {item.category}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h3>
                      <p className="text-[11px] text-slate-400 font-medium">📅 {item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SUPPORTING EVIDENCE GALLERY */}
            <div className="p-6 sm:p-7 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#eef7f0] border border-[#cbe6d2] text-[#2d8a4e] flex items-center justify-center">
                  📄
                </span>
                <span>Supporting Evidence</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {evidenceItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleCategoryClick(item.category)}
                    className="h-28 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center text-3xl shadow-xs hover:scale-105 transition cursor-pointer"
                    title={`View ${item.category} Accomplishments`}
                  >
                    <span>{item.emoji}</span>
                  </button>
                ))}

                {/* View All Tile */}
                <button
                  type="button"
                  onClick={() => navigate('/personnel/achievements')}
                  className="h-28 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#2d8a4e] flex flex-col items-center justify-center gap-1 hover:bg-emerald-100 transition cursor-pointer"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span className="text-[11px] font-bold">View All</span>
                </button>
              </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: SIDEBAR WIDGETS ================= */}
          <div className="space-y-6">
            
            {/* CONTACT INFORMATION CARD */}
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
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
                  <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{personnel.email}</p>
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
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
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
                      {/* 3 Dot Level Indicator */}
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

            {/* ACHIEVEMENTS BY CATEGORY CARD (INTERACTIVE REDIRECT) */}
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
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

      </div>
    </MainLayout>
  )
}
