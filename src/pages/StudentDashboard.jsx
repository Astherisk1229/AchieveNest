import React, { useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import DigitalBarcodeIDCard from '../components/student/DigitalBarcodeIDCard'
import AchievementSubmissionModal from '../components/student/AchievementSubmissionModal'
import { 
  Trophy, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Award, 
  FileText, 
  Star,
  QrCode,
  Filter
} from 'lucide-react'

export default function StudentDashboard({ currentUser }) {
  const user = currentUser || { full_name: 'Maria Santos', student_id: '2024-01234', program: 'BS Information Technology' }

  // Modals state
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false)
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')

  // Achievements State
  const [achievements, setAchievements] = useState([
    {
      id: 1,
      title: "Dean's Lister - First Semester AY 2025-2026",
      date: 'Dec 15, 2025',
      status: 'Verified',
      category: 'Academic',
      icon: Trophy,
      iconColor: 'text-[#2d8a4e] bg-[#eef7f0] border-[#cbe6d2]'
    },
    {
      id: 2,
      title: 'Student Council President',
      date: 'Jan 10, 2026',
      status: 'Verified',
      category: 'Leadership',
      icon: Trophy,
      iconColor: 'text-[#2d8a4e] bg-[#eef7f0] border-[#cbe6d2]'
    },
    {
      id: 3,
      title: 'Community Outreach Volunteer',
      date: 'Mar 20, 2026',
      status: 'Pending',
      category: 'Community',
      icon: FileText,
      iconColor: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      id: 4,
      title: 'Basketball Intramurals Champion',
      date: 'Feb 14, 2026',
      status: 'Verified',
      category: 'Sports',
      icon: Star,
      iconColor: 'text-[#2d8a4e] bg-[#eef7f0] border-[#cbe6d2]'
    },
    {
      id: 5,
      title: 'Best Research Paper Award',
      date: 'Nov 05, 2025',
      status: 'Returned',
      category: 'Academic',
      icon: Trophy,
      iconColor: 'text-rose-600 bg-rose-50 border-rose-200'
    }
  ])

  const handleAddNewAchievement = (newEntry) => {
    setAchievements([newEntry, ...achievements])
  }

  // Filtered Achievements
  const filteredAchievements = achievements.filter(item => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Verified') return item.status === 'Verified'
    if (activeFilter === 'Pending') return item.status === 'Pending'
    if (activeFilter === 'Returned') return item.status === 'Returned'
    if (activeFilter === 'Certificates') return item.status === 'Verified'
    return true
  })

  // Quick Stats Counts
  const totalCount = achievements.length
  const verifiedCount = achievements.filter(a => a.status === 'Verified').length
  const pendingCount = achievements.filter(a => a.status === 'Pending').length
  const returnedCount = achievements.filter(a => a.status === 'Returned').length
  const certificatesCount = verifiedCount

  return (
    <MainLayout>
      <div className="space-y-8 font-sans">
        
        {/* ================= HERO SUMMARY BANNER ================= */}
        <div className="bg-[#1b4332] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#245233] relative overflow-hidden">
          
          {/* Top Banner Row */}
          <div className="flex items-start justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] border border-emerald-400/30 flex items-center justify-center text-white shadow-lg shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Student Achievement Portfolio</h1>
                <p className="text-xs text-emerald-200/80 font-medium mt-0.5">
                  {user.full_name} • {user.student_id || '2024-01234'}
                </p>
              </div>
            </div>

            {/* Clickable NDMU Digital Barcode ID Badge */}
            <button
              type="button"
              onClick={() => setIsBarcodeOpen(true)}
              className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 transition text-xs font-bold shadow-md group"
              title="Click to expand Digital Student ID Barcode"
            >
              <QrCode className="w-4 h-4 text-amber-300 group-hover:scale-110 transition" />
              <span className="hidden sm:inline">Digital ID Barcode</span>
            </button>
          </div>

          {/* 5 Stats Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 relative z-10">
            
            <button
              onClick={() => setActiveFilter('All')}
              className={`p-4 rounded-2xl border text-left transition ${
                activeFilter === 'All'
                  ? 'bg-[#2d8a4e] border-amber-400 shadow-md ring-2 ring-amber-400/50'
                  : 'bg-[#133220]/90 border-emerald-600/30 hover:bg-[#183d28]'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                <Trophy className="w-4 h-4 text-emerald-300" />
                <span>Total Achievements</span>
              </div>
              <p className="text-3xl font-black text-white">{totalCount}</p>
            </button>

            <button
              onClick={() => setActiveFilter('Verified')}
              className={`p-4 rounded-2xl border text-left transition ${
                activeFilter === 'Verified'
                  ? 'bg-[#2d8a4e] border-amber-400 shadow-md ring-2 ring-amber-400/50'
                  : 'bg-[#133220]/90 border-emerald-600/30 hover:bg-[#183d28]'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified</span>
              </div>
              <p className="text-3xl font-black text-white">{verifiedCount}</p>
            </button>

            <button
              onClick={() => setActiveFilter('Pending')}
              className={`p-4 rounded-2xl border text-left transition ${
                activeFilter === 'Pending'
                  ? 'bg-[#2d8a4e] border-amber-400 shadow-md ring-2 ring-amber-400/50'
                  : 'bg-[#133220]/90 border-emerald-600/30 hover:bg-[#183d28]'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                <Clock className="w-4 h-4 text-amber-300" />
                <span>Pending</span>
              </div>
              <p className="text-3xl font-black text-white">{pendingCount}</p>
            </button>

            <button
              onClick={() => setActiveFilter('Returned')}
              className={`p-4 rounded-2xl border text-left transition ${
                activeFilter === 'Returned'
                  ? 'bg-[#2d8a4e] border-amber-400 shadow-md ring-2 ring-amber-400/50'
                  : 'bg-[#133220]/90 border-emerald-600/30 hover:bg-[#183d28]'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                <RotateCcw className="w-4 h-4 text-emerald-300" />
                <span>Returned</span>
              </div>
              <p className="text-3xl font-black text-white">{returnedCount}</p>
            </button>

            <button
              onClick={() => setActiveFilter('Certificates')}
              className={`p-4 rounded-2xl border text-left transition ${
                activeFilter === 'Certificates'
                  ? 'bg-[#2d8a4e] border-amber-400 shadow-md ring-2 ring-amber-400/50'
                  : 'bg-[#133220]/90 border-emerald-600/30 hover:bg-[#183d28]'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                <Award className="w-4 h-4 text-amber-300" />
                <span>Total Certificates</span>
              </div>
              <p className="text-3xl font-black text-white">{certificatesCount}</p>
            </button>

          </div>

        </div>

        {/* ================= QUICK ACTIONS SECTION (3 CARDS) ================= */}
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-3">Quick Actions</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Card 1: Submit New Achievement (Navigates to Achievements Page & Opens Modal) */}
            <button
              type="button"
              onClick={() => navigate('/student/achievements', { state: { openSubmissionModal: true } })}
              className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-[#2d8a4e] shadow-xs hover:shadow-md transition text-center flex flex-col items-center justify-center gap-3 group"
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
              onClick={() => setActiveFilter('All')}
              className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-[#2d8a4e] shadow-xs hover:shadow-md transition text-center flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-[#2d8a4e] transition">
                View Portfolio
              </span>
            </button>

            {/* Card 3: My Certificates */}
            <button
              type="button"
              onClick={() => setActiveFilter('Certificates')}
              className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-[#2d8a4e] shadow-xs hover:shadow-md transition text-center flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition">
                <Star className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-[#2d8a4e] transition">
                My Certificates
              </span>
            </button>

          </div>
        </div>

        {/* ================= ACHIEVEMENTS TIMELINE SECTION ================= */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>Achievements Timeline</span>
              {activeFilter !== 'All' && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#eef7f0] text-[#1e5831] border border-[#cbe6d2]">
                  Filtered: {activeFilter}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Filter className="w-3.5 h-3.5" />
              <span>Showing {filteredAchievements.length} of {achievements.length} records</span>
            </div>
          </div>

          <div className="space-y-3">
            {filteredAchievements.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-slate-100 text-center text-slate-400 text-xs">
                No achievement entries found under "{activeFilter}" category filter.
              </div>
            ) : (
              filteredAchievements.map((item) => {
                const IconComponent = item.icon || Trophy
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:shadow-sm transition flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${item.iconColor || 'text-[#2d8a4e] bg-[#eef7f0] border-[#cbe6d2]'}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">{item.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400 font-medium">📅 {item.date}</span>
                          <span className="text-slate-300">•</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.status === 'Verified'
                                ? 'bg-[#eef7f0] text-[#1e5831] border border-[#cbe6d2]'
                                : item.status === 'Pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-semibold px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                      {item.category}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

      {/* Digital Barcode ID Card Modal */}
      <DigitalBarcodeIDCard
        user={user}
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
      />

      {/* Submit Achievement Entry Modal */}
      <AchievementSubmissionModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSubmitAchievement={handleAddNewAchievement}
      />
    </MainLayout>
  )
}
