import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import DigitalBarcodeIDCardModal from './modals/DigitalBarcodeIDCardModal'
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from '../../components/ui/avatar'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  Trophy,
  CheckCircle2,
  Clock,
  RotateCcw,
  Award,
  FileText,
  Star,
  Sparkles,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Filter,
  QrCode,
  Eye,
  BookOpen,
  Users,
  Heart,
  FileCheck2,
  Check
} from 'lucide-react'

export default function StudentDashboardPage({ currentUser }) {
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
        issuer: 'NDMU BSCS Academic Program',
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
    <>
      <div className="space-y-6 font-sans pb-12">

        {/* ================= HERO SUMMARY BANNER ================= */}
        <div className="bg-[#DCEBDD] dark:bg-[#DCEBDD] text-[#123D2A] p-6 sm:p-7 rounded-2xl border border-[#A9C6B1] dark:border-emerald-900/60 relative overflow-hidden shadow-xs">

          {/* Top Banner Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
            <div className="flex items-center gap-4">
              <Avatar size="lg" className="border-2 border-[#176B43]/40 shadow-md">
                <AvatarImage src={student.avatar_url} alt={student.full_name} />
                <AvatarFallback className="bg-[#176B43] text-white">
                  {student.full_name ? student.full_name.split(' ').map(n => n[0]).join('') : 'MS'}
                </AvatarFallback>
                <AvatarBadge className="student-profile-verification-badge" title="Verified Student Profile">
                  <Check />
                </AvatarBadge>
              </Avatar>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123D2A] dark:text-white tracking-tight">
                    Student Achievement Portfolio
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#176B43]/15 text-[#176B43] dark:text-emerald-200 border border-[#176B43]/30 text-[10px] font-extrabold uppercase tracking-wider">
                    STUDENT PORTAL
                  </span>
                </div>
                <p className="text-xs text-[#3F6B52] dark:text-emerald-200/90 font-medium">
                  {student.full_name} • {student.student_id} • {student.college}
                </p>
              </div>
            </div>

            {/* Digital ID Barcode Button */}
            <button
              type="button"
              onClick={() => setIsBarcodeModalOpen(true)}
              className="p-3 rounded-xl bg-[#176B43] hover:bg-[#125536] border border-[#176B43] text-white flex items-center gap-2 transition text-xs font-extrabold shadow-2xs group shrink-0 self-start sm:self-auto cursor-pointer"
              title="Click to expand Student Digital ID Barcode"
            >
              <QrCode className="w-4 h-4 text-white group-hover:scale-105 transition" />
              <span className="hidden sm:inline">Digital ID Barcode</span>
            </button>
          </div>

          {/* 5 CLICKABLE INTERACTIVE BENTO STAT CARDS (Uniform CSS Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative z-10">
            {stats.map((stat) => {
              const IconComponent = stat.icon
              const isSelected = activeStatFilter === stat.key

              return (
                <button
                  key={stat.key}
                  type="button"
                  onClick={() => setActiveStatFilter(stat.key)}
                  className="w-full h-full flex flex-col text-left cursor-pointer transition-all duration-150"
                  title={`Filter by ${stat.label}`}
                >
                  <Card className={`w-full h-full flex flex-col justify-between p-4 border transition-all duration-200 min-h-[92px] ${
                    isSelected
                      ? 'bg-[#238B57] text-white border-[#A9C6B1] shadow-md ring-2 ring-[#238B57]/40'
                      : 'bg-[#F8FBF7] text-[#123D2A] border-[#A9C6B1] hover:border-[#176B43] hover:bg-white'
                  }`}>
                    <div className="flex items-center gap-1.5 text-xs font-extrabold mb-1.5 whitespace-nowrap">
                      <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#16834A]'}`} />
                      <span className={isSelected ? 'text-white' : 'text-[#3F6B52]'}>{stat.label}</span>
                    </div>
                    <p className={`text-2xl font-extrabold tracking-tight mt-auto ${isSelected ? 'text-white' : 'text-[#123D2A]'}`}>{stat.value}</p>
                  </Card>
                </button>
              )
            })}
          </div>

        </div>

        {/* ================= QUICK ACTIONS ================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-[#123D2A] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#16834a] dark:text-emerald-400" />
              Quick Actions
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Card 1: Submit New Achievement */}
            <Link to="/student/achievements" state={{ openSubmissionModal: true }} className="w-full h-full flex flex-col group">
              <Card className="w-full h-full flex flex-col justify-between p-5 border border-[#dde3dd] dark:border-slate-800 bg-white dark:bg-[#131e2e] hover:border-[#16834a] dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all duration-200 min-h-[140px]">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#eef4eb] dark:bg-emerald-950/50 text-[#16834a] dark:text-emerald-400 border border-[#dde3dd] dark:border-emerald-800/50 flex items-center justify-center font-bold shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#16834a] dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="flex flex-col justify-end mt-4 space-y-0.5 min-h-[48px]">
                  <h3 className="font-extrabold text-xs sm:text-sm text-[#123D2A] dark:text-white group-hover:text-[#16834a] dark:group-hover:text-emerald-400 transition">Submit New Achievement</h3>
                  <p className="text-xs text-[#3F6B52] dark:text-slate-400 font-medium leading-snug">Upload certificates &amp; submit proofs for verification</p>
                </div>
              </Card>
            </Link>

            {/* Card 2: View Portfolio */}
            <Link to="/student/portfolio" className="w-full h-full flex flex-col group">
              <Card className="w-full h-full flex flex-col justify-between p-5 border border-[#dde3dd] dark:border-slate-800 bg-white dark:bg-[#131e2e] hover:border-[#16834a] dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all duration-200 min-h-[140px]">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#eef4eb] dark:bg-emerald-950/50 text-[#16834a] dark:text-emerald-400 border border-[#dde3dd] dark:border-emerald-800/50 flex items-center justify-center font-bold shrink-0">
                    <Eye className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#16834a] dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="flex flex-col justify-end mt-4 space-y-0.5 min-h-[48px]">
                  <h3 className="font-extrabold text-xs sm:text-sm text-[#123D2A] dark:text-white group-hover:text-[#16834a] dark:group-hover:text-emerald-400 transition">View Portfolio</h3>
                  <p className="text-xs text-[#3F6B52] dark:text-slate-400 font-medium leading-snug">Explore your verified academic &amp; extracurricular ledger</p>
                </div>
              </Card>
            </Link>

            {/* Card 3: View Achievements */}
            <Link to="/student/achievements" className="w-full h-full flex flex-col group">
              <Card className="w-full h-full flex flex-col justify-between p-5 border border-[#dde3dd] dark:border-slate-800 bg-white dark:bg-[#131e2e] hover:border-[#16834a] dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all duration-200 min-h-[140px]">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#eef4eb] dark:bg-emerald-950/50 text-[#16834a] dark:text-emerald-400 border border-[#dde3dd] dark:border-emerald-800/50 flex items-center justify-center font-bold shrink-0">
                    <Star className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#16834a] dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="flex flex-col justify-end mt-4 space-y-0.5 min-h-[48px]">
                  <h3 className="font-extrabold text-xs sm:text-sm text-[#123D2A] dark:text-white group-hover:text-[#16834a] dark:group-hover:text-emerald-400 transition">View Achievements</h3>
                  <p className="text-xs text-[#3F6B52] dark:text-slate-400 font-medium leading-snug">Inspect detailed status history &amp; feedback notes</p>
                </div>
              </Card>
            </Link>

          </div>
        </div>

        {/* ================= ACCOMPLISHMENTS TIMELINE SECTION ================= */}
        <div id="achievements-timeline" className="scroll-mt-6 space-y-3">

          {/* Header & Record Counter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-extrabold text-[#123D2A] dark:text-white uppercase tracking-wider">
                Accomplishments Timeline
              </h2>
              {activeStatFilter !== 'all' && (
                <Badge variant="success">
                  Filtered: {stats.find(s => s.key === activeStatFilter)?.label}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#3F6B52] dark:text-slate-400 font-bold uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-[#16834a] dark:text-emerald-400" />
              <span>Showing {filteredTimeline.length} of {allTimelineItems.length} records</span>
            </div>
          </div>

          {/* Category Filter Pills Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {['All', 'Academic', 'Leadership', 'Community', 'Sports'].map((cat) => {
              const isSelected = selectedCategoryFilter === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap shrink-0 cursor-pointer ${isSelected
                      ? 'bg-[#DCEBDD] dark:bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-[#131e2e] border border-[#dde3dd] dark:border-slate-800 text-[#123D2A] dark:text-slate-300 hover:bg-[#eef4eb] dark:hover:bg-slate-800/80'
                    }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>

          {/* Timeline Card Items */}
          {filteredTimeline.length === 0 ? (
            <Card className="p-8 text-center text-[#3F6B52] text-xs space-y-2">
              <p className="font-medium">No accomplishment entries found under the selected category filter.</p>
              <button
                onClick={() => { setActiveStatFilter('all'); setSelectedCategoryFilter('All'); }}
                className="text-xs font-extrabold text-[#16834a] dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Reset All Filters
              </button>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTimeline.map((item) => {
                const IconComp = item.icon
                return (
                  <Card
                    key={item.id}
                    className="p-4 border-[#dde3dd] hover:border-slate-300 dark:hover:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-[#eef4eb] dark:bg-emerald-950/50 text-[#16834a] dark:text-emerald-400 border border-[#dde3dd] dark:border-emerald-800/50 flex items-center justify-center shrink-0 font-bold">
                        <IconComp className="w-5 h-5" />
                      </div>

                      <div className="space-y-0.5">
                        <h3 className="text-xs sm:text-sm font-extrabold text-[#123D2A] dark:text-white leading-tight">{item.title}</h3>
                        <p className="text-xs text-[#3F6B52] dark:text-slate-400 font-medium line-clamp-1">{item.description}</p>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[11px] text-[#3F6B52] font-semibold">📅 {item.date}</span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <Badge variant={
                            item.statusType === 'verified' ? 'success' : item.statusType === 'pending' ? 'warning' : 'destructive'
                          }>
                            {item.status}
                          </Badge>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-[11px] text-[#3F6B52] dark:text-slate-400 font-medium">{item.issuer}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Proof Pill & Category Badge */}
                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                      {item.hasProof && (
                        <Link
                          to="/student/achievements"
                          className="px-3 py-1.5 rounded-xl bg-[#f7f8f6] dark:bg-slate-800 hover:bg-[#eef4eb] dark:hover:bg-emerald-950/60 text-[#123D2A] dark:text-slate-200 hover:text-[#16834a] dark:hover:text-emerald-300 border border-[#dde3dd] dark:border-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 text-[#16834a] dark:text-emerald-400" />
                          <span>Proof</span>
                        </Link>
                      )}

                      <Badge variant="outline" className="normal-case font-bold">
                        {item.category}
                      </Badge>
                    </div>

                  </Card>
                )
              })}
            </div>
          )}

        </div>

      </div>

      {/* DIGITAL BARCODE ID MODAL */}
      <DigitalBarcodeIDCardModal
        user={student}
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
      />
    </>
  )
}
