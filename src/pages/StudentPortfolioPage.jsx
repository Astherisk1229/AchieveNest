import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import ExportPortfolioPreviewModal from '../components/student/ExportPortfolioPreviewModal'
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
  Download
} from 'lucide-react'

export default function StudentPortfolioPage({ currentUser }) {
  const navigate = useNavigate()
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [showCopiedToast, setShowCopiedToast] = useState(false)

  const student = currentUser || {
    full_name: 'Maria Santos',
    student_id: '2024-01234',
    program: 'BS Computer Science',
    year_level: '3rd Year',
    age: 21,
    location: 'Koronadal City, South Cotabato',
    email: 'student@ndmu.edu.ph',
    phone: '+63 912 345 6789',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
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

  // Experience & Involvement List
  const experiences = [
    {
      id: 1,
      role: 'President',
      organization: 'Computer Society NDMU',
      period: 'Aug 2025 – Present',
      icon: Users,
      color: 'bg-emerald-600 text-white border-emerald-400'
    },
    {
      id: 2,
      role: "Dean's Lister",
      organization: 'CEAC – Notre Dame of Marbel University',
      period: 'AY 2024–2025',
      icon: GraduationCap,
      color: 'bg-emerald-600 text-white border-emerald-400'
    },
    {
      id: 3,
      role: 'Community Extension',
      organization: 'Koronadal City Barangay Program',
      period: 'Jan – Mar 2025',
      icon: Heart,
      color: 'bg-emerald-600 text-white border-emerald-400'
    },
    {
      id: 4,
      role: 'Hackathon Finalist',
      organization: 'DICT RegTech Hackathon 2024',
      period: 'Oct 2024',
      icon: Trophy,
      color: 'bg-emerald-600 text-white border-emerald-400'
    },
    {
      id: 5,
      role: 'Core Developer',
      organization: 'University Web Dev Team',
      period: 'Jun 2024 – Present',
      icon: BookOpen,
      color: 'bg-emerald-600 text-white border-emerald-400'
    }
  ]

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

  // Skills & Competencies with proficiency dot levels
  const skills = [
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
  ]

  return (
    <MainLayout>
      <div className="space-y-6 font-sans pb-12">
        
        {/* ================= TOP ACTION BAR: SHARE & EXPORT PORTFOLIO ================= */}
        <div className="flex items-center justify-end gap-3 relative">
          
          {showCopiedToast && (
            <div className="px-3.5 py-1.5 rounded-xl bg-[#2d8a4e] text-white text-xs font-bold shadow-md animate-in fade-in duration-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-200" />
              <span>Portfolio link copied to clipboard!</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSharePortfolio}
            className="px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 shadow-2xs hover:shadow-xs transition cursor-pointer"
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
                    src={student.avatar_url}
                    alt={student.full_name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#2d8a4e] border-2 border-white flex items-center justify-center text-white shadow-md">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{student.full_name}</h1>
                <p className="text-xs text-emerald-200/90 font-medium tracking-wide">{student.student_id}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-100/80 font-medium pt-1">
                  <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-emerald-300" /> {student.program}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-emerald-300" /> {student.year_level} - {student.age} yrs</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-300" /> {student.location}</span>
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
                <p className="text-2xl font-black text-amber-300">30</p>
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
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#eef7f0] border border-[#cbe6d2] text-[#2d8a4e] flex items-center justify-center">
                  👤
                </span>
                <span>About Me</span>
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                I am a dedicated and driven 3rd Year student enrolled in <strong className="text-slate-900 font-bold">BS Computer Science</strong> at Notre Dame of Marbel University. With a strong passion for technology, community service, and academic excellence, I actively seek opportunities to grow both personally and professionally. My involvement in student organizations and various competitions has equipped me with leadership, communication, and technical problem-solving skills that I continue to develop.
              </p>
            </div>

            {/* EXPERIENCE & INVOLVEMENT TIMELINE CARD */}
            <div className="p-6 sm:p-7 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#eef7f0] border border-[#cbe6d2] text-[#2d8a4e] flex items-center justify-center">
                  🏛️
                </span>
                <span>Experience & Involvement</span>
              </h2>

              <div className="relative pl-6 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {experiences.map((exp) => {
                  const IconComp = exp.icon
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
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#2d8a4e]" />
                <span>Contact Information</span>
              </h3>

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
    </MainLayout>
  )
}
