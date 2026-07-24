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
  Heart,
  FileCheck2
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

  // 5 Interactive Stat Cards Header Configuration (Exact Personnel Specs)
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
        
        {/* ================= HERO SUMMARY BANNER (EXACT PERSONNEL SPECS) ================= */}
        <div className="bg-[#1b4332] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#245233] relative overflow-hidden">
          
          {/* Top Banner Row */}
          <div className="flex items-start justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] border border-emerald-400/30 flex items-center justify-center text-white shadow-lg shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">
                    Student Achievement Portfolio
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 uppercase">
                    CONTEXT: STUDENT
                  </span>
                </div>
                <p className="text-xs text-emerald-200/80 font-medium mt-0.5">
                  {student.full_name} • {student.student_id} • {student.college}
                </p>
              </div>
            </div>

            {/* Digital ID Barcode Button */}
            <button
              type="button"
              onClick={() => setIsBarcodeModalOpen(true)}
              className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 transition text-xs font-bold shadow-md group shrink-0"
              title="Click to expand Student Digital ID Barcode"
            >
              <QrCode className="w-4 h-4 text-amber-300 group-hover:scale-110 transition" />
              <span className="hidden sm:inline">Digital ID Barcode</span>
            </button>
          </div>

          {/* 5 CLICKABLE INTERACTIVE STAT CARDS GRID (EXACT PERSONNEL SPECS: text-3xl) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 relative z-10">
            {stats.map((stat) => {
              const IconComponent = stat.icon
              const isSelected = activeStatFilter === stat.key

              return (
                <button
                  key={stat.key}
                  type="button"
                  onClick={() => setActiveStatFilter(stat.key)}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                    isSelected 
                      ? 'bg-[#2d8a4e] border-amber-400 shadow-md ring-2 ring-amber-400/50' 
                      : 'bg-[#133220]/90 border-emerald-600/30 hover:bg-[#183d28]'
                  }`}
                  title={`Filter by ${stat.label}`}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                    <IconComponent className={`w-4 h-4 ${isSelected ? 'text-amber-300' : 'text-emerald-400'}`} />
                    <span className="truncate">{stat.label}</span>
                  </div>
                  <p className="text-3xl font-black text-white">{stat.value}</p>
                </button>
              )
            })}
          </div>

        </div>

        {/* ================= QUICK ACTIONS SECTION (EXACT PERSONNEL SPECS) ================= */}
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-3">Quick Actions</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Card 1: Submit New Achievement */}
            <button
              type="button"
              onClick={() => navigate('/student/achievements', { state: { openSubmissionModal: true } })}
              className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-[#2d8a4e] shadow-2xs hover:shadow-md transition text-center flex flex-col items-center justify-center gap-3 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-[#2d8a4e] transition">
                Submit New Achievement
              </span>
            </button>

            {/* Card 2: View Portfolio */}
            <button
              type="button"
              onClick={() => navigate('/student/portfolio')}
              className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-[#2d8a4e] shadow-2xs hover:shadow-md transition text-center flex flex-col items-center justify-center gap-3 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition">
                <Eye className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-[#2d8a4e] transition">
                View Portfolio
              </span>
            </button>

            {/* Card 3: View Achievements */}
            <button
              type="button"
              onClick={() => navigate('/student/achievements')}
              className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-[#2d8a4e] shadow-2xs hover:shadow-md transition text-center flex flex-col items-center justify-center gap-3 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition">
                <Star className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-[#2d8a4e] transition">
                View Achievements
              </span>
            </button>

          </div>
        </div>

        {/* ================= ACCOMPLISHMENTS TIMELINE SECTION (EXACT PERSONNEL SPECS) ================= */}
        <div id="achievements-timeline" className="scroll-mt-6">
          
          {/* Header & Record Counter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>Accomplishments Timeline</span>
              {activeStatFilter !== 'all' && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#eef7f0] text-[#1e5831] border border-[#cbe6d2]">
                  Filtered: {stats.find(s => s.key === activeStatFilter)?.label}
                </span>
              )}
            </h2>
            
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Showing {filteredTimeline.length} of {allTimelineItems.length} records</span>
            </div>
          </div>

          {/* Category Filter Pills Row (Exact Personnel Specs: px-3.5 py-1.5 rounded-xl) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 scrollbar-none">
            {['All', 'Academic', 'Leadership', 'Community', 'Sports'].map((cat) => {
              const isSelected = selectedCategoryFilter === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected 
                      ? 'bg-[#1b4332] text-white shadow-sm' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>

          {/* Timeline Card Items (Exact Personnel Specs) */}
          {filteredTimeline.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-100 text-center text-slate-400 text-xs space-y-2">
              <p>No accomplishment entries found under the selected category filter.</p>
              <button 
                onClick={() => { setActiveStatFilter('all'); setSelectedCategoryFilter('All'); }}
                className="text-xs font-bold text-[#2d8a4e] hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTimeline.map((item) => {
                const IconComp = item.icon
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 text-[#2d8a4e] bg-[#eef7f0] border-[#cbe6d2]">
                        <IconComp className="w-5 h-5" />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">{item.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400 font-medium">📅 {item.date}</span>
                          <span className="text-slate-300">•</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.statusType === 'verified'
                              ? 'bg-[#eef7f0] text-[#1e5831] border border-[#cbe6d2]'
                              : item.statusType === 'pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {item.status} ✓
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] text-slate-500 font-medium">{item.issuer}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Proof Pill & Category Badge */}
                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                      {item.hasProof && (
                        <button
                          type="button"
                          onClick={() => navigate('/student/achievements')}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#eef7f0] hover:text-[#2d8a4e] border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 text-[#2d8a4e]" />
                          <span>Proof</span>
                        </button>
                      )}

                      <span className="text-xs font-semibold px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
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
