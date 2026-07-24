import React from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
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
  ChevronRight
} from 'lucide-react'

export default function StudentDashboard({ currentUser }) {
  const navigate = useNavigate()

  const student = currentUser || {
    full_name: 'Maria Santos',
    student_id: '2024-01234',
    program: 'BS Computer Science',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  }

  // 5 Summary Metrics
  const stats = [
    { label: 'Total Achievements', value: 5, icon: Trophy },
    { label: 'Verified', value: 3, icon: CheckCircle2 },
    { label: 'Pending', value: 1, icon: Clock },
    { label: 'Returned', value: 1, icon: RotateCcw },
    { label: 'Total Certificates', value: 3, icon: Award }
  ]

  // Timeline Items matching screenshot
  const timelineItems = [
    {
      id: 1,
      title: "Dean's Lister - First Semester AY 2025-2026",
      date: 'Dec 15, 2025',
      status: 'Verified',
      statusType: 'verified',
      category: 'Academic',
      icon: Award
    },
    {
      id: 2,
      title: 'Student Council President',
      date: 'Jan 10, 2026',
      status: 'Verified',
      statusType: 'verified',
      category: 'Leadership',
      icon: Trophy
    },
    {
      id: 3,
      title: 'Community Outreach Volunteer',
      date: 'Mar 20, 2025',
      status: 'Pending',
      statusType: 'pending',
      category: 'Community',
      icon: FileText
    },
    {
      id: 4,
      title: 'Basketball Intramurals Champion',
      date: 'Feb 14, 2026',
      status: 'Verified',
      statusType: 'verified',
      category: 'Sports',
      icon: Star
    },
    {
      id: 5,
      title: 'Best Research Paper Award',
      date: 'Oct 10, 2025',
      status: 'Verified',
      statusType: 'verified',
      category: 'Academic',
      icon: Award
    }
  ]

  return (
    <MainLayout>
      <div className="space-y-8 font-sans pb-12">
        
        {/* ================= HERO HEADER BANNER (FOREST GREEN) ================= */}
        <div className="bg-[#1b4332] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#245233] space-y-6">
          
          {/* Top Banner Title & Student Details */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shadow-md shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Student Achievement Portfolio
                </h1>
                <p className="text-xs text-emerald-200/90 font-medium mt-0.5">
                  {student.full_name} • {student.student_id}
                </p>
              </div>
            </div>

            {/* University Crest Small Logo */}
            <div className="w-10 h-10 rounded-2xl bg-white p-1 flex items-center justify-center shadow-md shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#1b4332]" />
            </div>
          </div>

          {/* 5 Stat Cards Grid inside Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {stats.map((stat, idx) => {
              const IconComponent = stat.icon
              return (
                <div 
                  key={idx} 
                  className="bg-[#133220]/90 border border-emerald-600/30 p-4 rounded-2xl space-y-2 backdrop-blur-xs"
                >
                  <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-bold">
                    <IconComponent className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="truncate">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                </div>
              )
            })}
          </div>

        </div>

        {/* ================= QUICK ACTIONS (3 CARDS - BROWSE EVENTS REMOVED) ================= */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">Quick Actions</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* 1. Submit New Achievement Card */}
            <button
              type="button"
              onClick={() => navigate('/student/achievements', { state: { openSubmissionModal: true } })}
              className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md hover:border-emerald-200 transition flex items-center gap-4 text-left cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#eef7f0] text-[#2d8a4e] border border-[#cbe6d2] flex items-center justify-center shrink-0 group-hover:bg-[#2d8a4e] group-hover:text-white transition">
                <Trophy className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-[#2d8a4e] transition">
                Submit New Achievement
              </span>
            </button>

            {/* 2. View Portfolio Card */}
            <button
              type="button"
              onClick={() => navigate('/student/portfolio')}
              className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md hover:border-emerald-200 transition flex items-center gap-4 text-left cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#eef7f0] text-[#2d8a4e] border border-[#cbe6d2] flex items-center justify-center shrink-0 group-hover:bg-[#2d8a4e] group-hover:text-white transition">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-[#2d8a4e] transition">
                View Portfolio
              </span>
            </button>

            {/* 3. My Certificates Card */}
            <button
              type="button"
              onClick={() => navigate('/student/achievements')}
              className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md hover:border-emerald-200 transition flex items-center gap-4 text-left cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#eef7f0] text-[#2d8a4e] border border-[#cbe6d2] flex items-center justify-center shrink-0 group-hover:bg-[#2d8a4e] group-hover:text-white transition">
                <Star className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-[#2d8a4e] transition">
                My Certificates
              </span>
            </button>

          </div>
        </div>

        {/* ================= ACHIEVEMENTS TIMELINE ================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Achievements Timeline</h2>
            <button
              type="button"
              onClick={() => navigate('/student/achievements')}
              className="text-xs font-bold text-[#2d8a4e] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {timelineItems.map((item) => {
              const IconComp = item.icon
              return (
                <div
                  key={item.id}
                  className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-emerald-200 transition flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center shrink-0">
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <h3 className="text-xs font-bold text-slate-900 truncate">{item.title}</h3>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {item.date}
                        </span>
                        <span>•</span>
                        <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          item.statusType === 'verified'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold border border-emerald-100 shrink-0">
                    {item.category}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </MainLayout>
  )
}
