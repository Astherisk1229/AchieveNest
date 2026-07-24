import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import DigitalBarcodeIDCard from '../components/student/DigitalBarcodeIDCard'
import { 
  Trophy, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Award, 
  FileText, 
  Star, 
  PlusCircle, 
  Calendar,
  ShieldCheck,
  ChevronRight,
  Filter,
  QrCode,
  Eye,
  BookOpen,
  Users,
  Heart
} from 'lucide-react'

export default function StudentDashboard({ currentUser }) {
  const navigate = useNavigate()
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)
  const [activeStatFilter, setActiveStatFilter] = useState('all') // 'all' | 'verified' | 'pending' | 'returned' | 'proofs'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All')

  const student = currentUser || {
    full_name: 'Maria Santos',
    student_id: '2024-01234',
    program: 'BS Information Technology',
    college: 'College of Information Technology',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  }

  // All Timeline Items Data
  const allTimelineItems = [
    {
      id: 1,
      title: "Dean's Lister - First Semester AY 2025-2026",
      description: 'Awarded for achieving a GPA of 1.25 and academic excellence across all core CS subjects.',
      date: 'Dec 15, 2025',
      status: 'Verified',
      statusType: 'verified',
      category: 'Academic',
      issuer: 'NDMU CITE / DOST Region XII',
      hasProof: true,
      icon: BookOpen
    },
    {
      id: 2,
      title: 'Student Council President',
      description: 'Elected as Supreme Student Council President representing 5,000+ NDMU undergraduate students.',
      date: 'Jan 10, 2026',
      status: 'Verified',
      statusType: 'verified',
      category: 'Leadership',
      issuer: 'NDMU OSAD / COMELEC',
      hasProof: true,
      icon: Users
    },
    {
      id: 3,
      title: 'Community Outreach Volunteer Lead',
      description: 'Spearheaded IT literacy workshops for 120+ high school students in Barangay Zone III.',
      date: 'Mar 20, 2025',
      status: 'Pending Review',
      statusType: 'pending',
      category: 'Community',
      issuer: 'Koronadal City LGU / NDMU CES',
      hasProof: false,
      icon: Heart
    },
    {
      id: 4,
      title: 'Basketball Intramurals Champion',
      description: 'Led CITE Wildcats Men Basketball Team to victory in NDMU University Intramurals 2026.',
      date: 'Feb 14, 2026',
      status: 'Verified',
      statusType: 'verified',
      category: 'Sports',
      issuer: 'NDMU Athletics Office',
      hasProof: true,
      icon: Trophy
    },
    {
      id: 5,
      title: 'Special Project Resubmission Required',
      description: 'Returned by Program Coordinator for missing high-resolution certificate attachment scan.',
      date: 'Jan 05, 2026',
      status: 'Returned',
      statusType: 'returned',
      category: 'Academic',
      issuer: 'NDMU CITE Department',
      hasProof: false,
      icon: RotateCcw
    }
  ]

  // 5 Interactive Stat Cards Header Configuration
  const stats = [
    { 
      key: 'all', 
      label: 'Total Records', 
      value: allTimelineItems.length, 
      icon: Trophy 
    },
    { 
      key: 'verified', 
      label: 'Verified', 
      value: allTimelineItems.filter(i => i.statusType === 'verified').length, 
      icon: CheckCircle2 
    },
    { 
      key: 'pending', 
      label: 'Pending Review', 
      value: allTimelineItems.filter(i => i.statusType === 'pending').length, 
      icon: Clock 
    },
    { 
      key: 'returned', 
      label: 'Returned', 
      value: allTimelineItems.filter(i => i.statusType === 'returned').length, 
      icon: RotateCcw 
    },
    { 
      key: 'proofs', 
      label: 'Total Proofs', 
      value: allTimelineItems.filter(i => i.hasProof).length, 
      icon: Award 
    }
  ]

  // Combined Filtering Logic for Timeline
  const filteredTimeline = allTimelineItems.filter(item => {
    // 1. Stat Filter
    let matchesStat = true
    if (activeStatFilter === 'verified') matchesStat = item.statusType === 'verified'
    if (activeStatFilter === 'pending') matchesStat = item.statusType === 'pending'
    if (activeStatFilter === 'returned') matchesStat = item.statusType === 'returned'
    if (activeStatFilter === 'proofs') matchesStat = item.hasProof === true

    // 2. Category Filter
    let matchesCategory = true
    if (selectedCategoryFilter !== 'All') matchesCategory = item.category === selectedCategoryFilter

    return matchesStat && matchesCategory
  })

  return (
    <MainLayout>
      <div className="space-y-8 font-sans pb-12">
        
        {/* ================= HERO HEADER BANNER (PROMINENT TYPOGRAPHY SIZE) ================= */}
        <div className="bg-[#1b4332] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#245233] relative overflow-hidden space-y-6">
          
          {/* Top Banner Row: Title + Context Badge + Digital Barcode Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shadow-md shrink-0 border border-emerald-400/40">
                <Award className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Student Achievement Portfolio
                  </h1>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold uppercase tracking-wider">
                    CONTEXT: STUDENT
                  </span>
                </div>
                <p className="text-sm font-semibold text-emerald-200/90">
                  {student.full_name} • {student.student_id} • {student.college}
                </p>
              </div>
            </div>

            {/* Digital ID Barcode Button */}
            <button
              type="button"
              onClick={() => setIsBarcodeModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#133220]/90 hover:bg-[#2d8a4e] border border-emerald-600/40 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 transition shadow-md cursor-pointer shrink-0 self-start md:self-auto"
            >
              <QrCode className="w-4 h-4 text-emerald-300" />
              <span>Digital ID Barcode</span>
            </button>
          </div>

          {/* 5 CLICKABLE INTERACTIVE STAT CARDS GRID (PROMINENT NUMBERS) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {stats.map((stat) => {
              const IconComponent = stat.icon
              const isSelected = activeStatFilter === stat.key

              return (
                <button
                  key={stat.key}
                  type="button"
                  onClick={() => setActiveStatFilter(stat.key)}
                  className={`p-4 sm:p-5 rounded-2xl space-y-2 text-left transition cursor-pointer transform hover:-translate-y-0.5 ${
                    isSelected 
                      ? 'bg-[#2d8a4e] border-2 border-amber-400 shadow-xl ring-2 ring-amber-400/30' 
                      : 'bg-[#0f2e1d]/90 hover:bg-[#153e28] border border-emerald-600/30'
                  }`}
                  title={`Filter by ${stat.label}`}
                >
                  <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold">
                    <IconComponent className={`w-4 h-4 ${isSelected ? 'text-amber-300' : 'text-emerald-400'}`} />
                    <span className="truncate">{stat.label}</span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-white">{stat.value}</p>
                </button>
              )
            })}
          </div>

        </div>

        {/* ================= QUICK ACTIONS (3 CARDS - VERTICAL LAYOUT LIKE PERSONNEL) ================= */}
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900">Quick Actions</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            
            {/* 1. Submit New Achievement Card */}
            <button
              type="button"
              onClick={() => navigate('/student/achievements', { state: { openSubmissionModal: true } })}
              className="p-6 sm:p-7 bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md hover:border-emerald-200 transition flex flex-col items-center justify-center text-center space-y-3 cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition border border-emerald-400/30">
                <Award className="w-7 h-7" />
              </div>
              <span className="text-sm font-extrabold text-slate-900 group-hover:text-[#2d8a4e] transition">
                Submit New Achievement
              </span>
            </button>

            {/* 2. View Portfolio Card */}
            <button
              type="button"
              onClick={() => navigate('/student/portfolio')}
              className="p-6 sm:p-7 bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md hover:border-emerald-200 transition flex flex-col items-center justify-center text-center space-y-3 cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition border border-emerald-400/30">
                <Eye className="w-7 h-7" />
              </div>
              <span className="text-sm font-extrabold text-slate-900 group-hover:text-[#2d8a4e] transition">
                View Portfolio
              </span>
            </button>

            {/* 3. View Achievements Card */}
            <button
              type="button"
              onClick={() => navigate('/student/achievements')}
              className="p-6 sm:p-7 bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md hover:border-emerald-200 transition flex flex-col items-center justify-center text-center space-y-3 cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition border border-emerald-400/30">
                <Star className="w-7 h-7" />
              </div>
              <span className="text-sm font-extrabold text-slate-900 group-hover:text-[#2d8a4e] transition">
                View Achievements
              </span>
            </button>

          </div>
        </div>

        {/* ================= ACCOMPLISHMENTS TIMELINE (PROMINENT FONT SIZE) ================= */}
        <div className="space-y-4">
          
          {/* Header & Record Counter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-extrabold text-slate-900">Accomplishments Timeline</h2>
            
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Showing {filteredTimeline.length} of {allTimelineItems.length} records</span>
            </div>
          </div>

          {/* Category Filter Pills Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['All', 'Academic', 'Leadership', 'Community', 'Sports'].map((cat) => {
              const isSelected = selectedCategoryFilter === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-4.5 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
                    isSelected 
                      ? 'bg-[#1b4332] text-white shadow-xs' 
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>

          {/* Timeline List Items */}
          {filteredTimeline.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 space-y-2">
              <p className="text-sm font-bold text-slate-700">No accomplishments found for the selected filter</p>
              <button 
                onClick={() => { setActiveStatFilter('all'); setSelectedCategoryFilter('All'); }}
                className="text-xs font-bold text-[#2d8a4e] hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredTimeline.map((item) => {
                const IconComp = item.icon
                return (
                  <div
                    key={item.id}
                    className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-100 shadow-xs hover:border-emerald-200 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
                  >
                    <div className="flex items-start gap-4.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <IconComp className="w-6 h-6" />
                      </div>

                      <div className="min-w-0 space-y-1.5">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">{item.title}</h3>
                        <p className="text-xs text-slate-600 font-medium line-clamp-1">{item.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                          <span className="text-slate-500 font-semibold flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> {item.date}
                          </span>
                          <span>•</span>
                          <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${
                            item.statusType === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.statusType === 'pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {item.status} ✓
                          </span>
                          <span>•</span>
                          <span className="text-slate-500 font-medium">{item.issuer}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Proof Pill & Category Badge */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      {item.hasProof && (
                        <button
                          type="button"
                          onClick={() => navigate('/student/achievements')}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-slate-600" />
                          <span>Proof</span>
                        </button>
                      )}

                      <span className="px-3.5 py-2 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-extrabold border border-emerald-200">
                        {item.category}
                      </span>
                    </div>

                  </div>
                )
              })}
            </div>
          )}

        </div>

      </div>

      {/* DIGITAL BARCODE ID MODAL */}
      <DigitalBarcodeIDCard
        user={student}
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
      />
    </MainLayout>
  )
}
