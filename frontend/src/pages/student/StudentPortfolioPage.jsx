import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ExportPortfolioPreviewModal from './ExportPortfolioPreviewModal'
import EditStudentInfoModal from './EditStudentInfoModal'
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
  ExternalLink,
  ShieldCheck,
  Check,
  Share2,
  Download,
  Edit3,
  Sparkles,
  Clock,
  CreditCard
} from 'lucide-react'

export default function StudentPortfolioPage({ currentUser }) {
  const navigate = useNavigate()
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [showCopiedToast, setShowCopiedToast] = useState(false)

  // Student Profile State
  const [student, setStudent] = useState(currentUser || {
    full_name: 'Maria Santos',
    student_id: '2024-01234',
    program: 'BS Computer Science',
    year_level: '3rd Year',
    age: 21,
    location: 'Koronadal City, South Cotabato',
    email: 'student@ndmu.edu.ph',
    phone: '+63 912 345 6789',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    about_me: 'I am a dedicated and driven 3rd Year student enrolled in BS Computer Science at Notre Dame of Marbel University. With a strong passion for technology, community service, and academic excellence, I actively seek opportunities to grow both personally and professionally.'
  })

  // Experience & Involvement List State
  const [experiences, setExperiences] = useState([
    {
      id: 1,
      role: 'President',
      organization: 'Computer Society NDMU',
      period: 'Aug 2025 – Present',
      icon: Users
    },
    {
      id: 2,
      role: "Dean's Lister",
      organization: 'CEAC – Notre Dame of Marbel University',
      period: 'AY 2024–2025',
      icon: GraduationCap
    },
    {
      id: 3,
      role: 'Community Extension',
      organization: 'Koronadal City Barangay Program',
      period: 'Jan – Mar 2025',
      icon: Heart
    },
    {
      id: 4,
      role: 'Hackathon Finalist',
      organization: 'DICT RegTech Hackathon 2024',
      period: 'Oct 2024',
      icon: Trophy
    },
    {
      id: 5,
      role: 'Core Developer',
      organization: 'University Web Dev Team',
      period: 'Jun 2024 – Present',
      icon: BookOpen
    }
  ])

  // Skills & Competencies List State
  const [skills, setSkills] = useState([
    { name: 'Leadership', level: 3, label: 'Expert' },
    { name: 'Communication', level: 3, label: 'Expert' },
    { name: 'Technical Skills', level: 2, label: 'Proficient' },
    { name: 'Teamwork', level: 3, label: 'Expert' },
    { name: 'Problem Solving', level: 2, label: 'Proficient' },
    { name: 'Critical Thinking', level: 2, label: 'Proficient' },
    { name: 'Public Speaking', level: 2, label: 'Proficient' },
    { name: 'Time Management', level: 3, label: 'Expert' },
    { name: 'Research', level: 2, label: 'Proficient' },
    { name: 'Project Management', level: 1, label: 'Familiar' }
  ])

  // Save Callback from EditStudentInfoModal
  const handleSaveStudentProfile = (updatedProfile, updatedExperiences, updatedSkills) => {
    setStudent(updatedProfile)
    setExperiences(updatedExperiences.map(exp => ({ ...exp, icon: exp.icon || Users })))
    setSkills(updatedSkills)
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
    navigate('/student/achievements', { state: { selectedCategory: catName } })
  }

  // Featured Verified Achievements
  const featuredAchievements = [
    {
      id: 1,
      title: "Dean's Lister - First Semester AY 2025-2026",
      date: 'Dec 15, 2025',
      category: 'Academic',
      bannerBg: 'bg-[#2d8a4e]',
      emoji: '📚'
    },
    {
      id: 2,
      title: 'Student Council President',
      date: 'Jan 10, 2026',
      category: 'Leadership',
      bannerBg: 'bg-[#2d8a4e]',
      emoji: '👑'
    },
    {
      id: 3,
      title: 'Basketball Intramurals Champion',
      date: 'Feb 14, 2026',
      category: 'Sports',
      bannerBg: 'bg-[#2d8a4e]',
      emoji: '🏀'
    }
  ]

  // Supporting Evidence Items
  const evidenceItems = [
    { id: 1, title: 'Deans List Certificate', category: 'Academic', emoji: '📚' },
    { id: 2, title: 'Appointment Paper', category: 'Leadership', emoji: '👑' },
    { id: 3, title: 'Outreach Certificate', category: 'Community', emoji: '🤝' },
    { id: 4, title: 'Champion Trophy Cert', category: 'Sports', emoji: '🏀' },
    { id: 5, title: 'Research Abstract', category: 'Academic', emoji: '🔬' }
  ]

  return (
    <>
      <div className="space-y-6 font-sans pb-12">
        
        {/* Toast Alert */}
        {showCopiedToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Portfolio link copied to clipboard!</span>
          </div>
        )}

        {/* ================= HERO HEADER PROFILE BANNER (EXACT SPECIFICATION IMPLEMENTATION) ================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6 relative">
          
          {/* SVG Background Layer: Left-Oriented Green Curvy Banner Shape with Faded Campus Backdrop */}
          <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
            <svg viewBox="0 0 1200 240" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="studentHeroGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#143d2b" />
                  <stop offset="50%" stopColor="#1b4332" />
                  <stop offset="100%" stopColor="#0d281e" />
                </linearGradient>
              </defs>

              {/* Left Green Curvy Shape Background */}
              <path d="M 0,0 L 220,0 C 210,70 170,150 90,240 L 0,240 Z" fill="url(#studentHeroGreenGrad)" />
            </svg>



            {/* Campus Background Image Overlay clipped to Left Green Curvy Shape */}
            <div className="absolute top-0 left-0 w-[18%] h-full mix-blend-overlay opacity-30 pointer-events-none overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 40% 100%, 0 100%)' }}>
              <img
                src={campusBanner}
                alt="NDMU Campus Backdrop"
                width="1200"
                height="240"
                className="w-full h-full object-cover"
                decoding="async"
                loading="eager"
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
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden aspect-square">
                    <img
                      src={student.avatar_url}
                      alt={student.full_name}
                      width="144"
                      height="144"
                      className="w-full h-full object-cover rounded-full aspect-square"
                      fetchpriority="high"
                      decoding="async"
                      loading="eager"
                    />
                  </div>
                </div>



                {/* Student Details & Info Chips (In Reserved White Content Space) */}
                <div className="space-y-1.5 pt-1 sm:pt-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">{student.full_name}</h2>
                    <span className="w-5 h-5 rounded-full bg-[#2d8a4e] text-white inline-flex items-center justify-center text-xs shadow-xs font-bold" title="Verified Account">
                      ✓
                    </span>
                  </div>

                  <p className="text-xs font-extrabold text-[#2d8a4e]">{student.program || 'BS Computer Science'}</p>
                  <p className="text-xs text-slate-600 font-semibold">{student.year_level || '3rd Year Student'} • Notre Dame of Marbel University</p>
                  <p className="text-xs text-slate-500 font-medium">{student.location}</p>

                  {/* Compact Credential Chips Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px]">
                    <div className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/90 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs">
                      <GraduationCap className="w-3.5 h-3.5 text-[#2d8a4e]" />
                      <span>{student.program || 'BS Computer Science'}</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/90 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs">
                      <Clock className="w-3.5 h-3.5 text-[#2d8a4e]" />
                      <span>{student.year_level || '3rd Year'} ({student.age || 21} yrs)</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/90 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs">
                      <CreditCard className="w-3.5 h-3.5 text-[#2d8a4e]" />
                      <span>Student ID: {student.student_id || '2024-01234'}</span>
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
                    <span className="text-xl font-black text-[#1b4332] block leading-none">3</span>
                    <span className="text-[10px] font-bold text-slate-600 mt-1 block">Verified</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-3 text-center min-w-[84px] shadow-2xs">
                    <span className="text-xl font-black text-[#1b4332] block leading-none">5</span>
                    <span className="text-[10px] font-bold text-slate-600 mt-1 block">Trainings</span>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-3 text-center min-w-[84px] shadow-2xs">
                    <span className="text-xl font-black text-[#1b4332] block leading-none">2</span>
                    <span className="text-[10px] font-bold text-slate-600 mt-1 block">Awards</span>
                  </div>
                </div>

                {/* Lower Right Action Buttons: Share & Booklet View / Export */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSharePortfolio}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Share</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#1b4332] hover:bg-[#123124] text-white text-xs font-extrabold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Portfolio Booklet View</span>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                  </button>
                </div>

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
                {student.about_me}
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
                  <span>Featured Achievements</span>
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
                    title={`View ${item.category} Achievements`}
                  >
                    <span>{item.emoji}</span>
                  </button>
                ))}

                {/* View All Tile */}
                <button
                  type="button"
                  onClick={() => navigate('/student/achievements')}
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
                  className="text-[11px] font-bold text-[#2d8a4e] hover:underline"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Email</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{student.email}</p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Phone</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{student.phone}</p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Address</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{student.location}</p>
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
                  className="text-[11px] font-bold text-[#2d8a4e] hover:underline"
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
                <span>Achievements by Category</span>
              </h3>

              <div className="space-y-2">
                {[
                  { name: 'Academic', count: 2, icon: GraduationCap },
                  { name: 'Leadership', count: 1, icon: Users },
                  { name: 'Community', count: 1, icon: Heart },
                  { name: 'Sports', count: 1, icon: Award }
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
                        <div className="w-6 h-6 rounded-lg bg-[#2d8a4e] text-white flex items-center justify-center">
                          <IconC className="w-3.5 h-3.5" />
                        </div>
                        <span className="group-hover:text-[#2d8a4e] transition">{cat.name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white text-[#2d8a4e] font-black text-[11px] border border-emerald-200">
                        {cat.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* PORTFOLIO SUMMARY STATS CARD */}
            <div className="p-6 bg-[#1b4332] text-white rounded-3xl shadow-md border border-[#245233] space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">Portfolio Summary</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-[#133220]/90 border border-emerald-600/30 text-center">
                  <p className="text-2xl font-black text-white">5</p>
                  <p className="text-[10px] font-bold text-emerald-300 uppercase">Total</p>
                </div>

                <div className="p-3 rounded-2xl bg-[#133220]/90 border border-emerald-600/30 text-center">
                  <p className="text-2xl font-black text-white">3</p>
                  <p className="text-[10px] font-bold text-emerald-300 uppercase">Verified</p>
                </div>

                <div className="p-3 rounded-2xl bg-[#133220]/90 border border-emerald-600/30 text-center">
                  <p className="text-2xl font-black text-amber-300">1</p>
                  <p className="text-[10px] font-bold text-amber-200 uppercase">Pending</p>
                </div>

                <div className="p-3 rounded-2xl bg-[#133220]/90 border border-emerald-600/30 text-center">
                  <p className="text-2xl font-black text-amber-300">30</p>
                  <p className="text-[10px] font-bold text-emerald-300 uppercase">Points</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* EXPORT PORTFOLIO PREVIEW MODAL */}
      <ExportPortfolioPreviewModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        student={student}
      />

      {/* EDIT STUDENT INFO MODAL */}
      <EditStudentInfoModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        student={student}
        experiences={experiences}
        skills={skills}
        onSave={handleSaveStudentProfile}
      />

    </>
  )
}
