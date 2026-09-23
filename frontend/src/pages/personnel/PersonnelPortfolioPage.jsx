import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ExportPortfolioPreviewModal from '../student/modals/ExportPortfolioPreviewModal'
import EditBasicInfoModal from './modals/EditBasicInfoModal'
import PersonnelPortfolioBookletModal from './PersonnelPortfolioBookletModal'
import PersonnelPortfolioGallery from './PersonnelPortfolioGallery'
import campusBanner from '../../assets/ndmu_campus_banner.png'
import { AchieveNestLogo } from '../../components/brand'

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
  CreditCard,
  User
} from 'lucide-react'
import { getCurrentUser } from '../../services/authService'
import { usePersonnelPortfolio } from '../../hooks/usePersonnelPortfolio'
import { formatPersonnelPlacement } from '../../utils/personnelPlacement'
import PersonnelProfilePhotoService from '../../services/PersonnelProfilePhotoService'

export default function PersonnelPortfolioPage({ currentUser }) {
  const navigate = useNavigate()
  const activeUser = currentUser || getCurrentUser()
  const activeRoleContext = activeUser?.active_role_context || 'personnel'

  const {
    portfolio,
    latestSubmission,
    submissionHistory
  } = usePersonnelPortfolio(activeUser?.employee_id || 'EMP-2021-0842')

  // Modals & Toast State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCanvaModalOpen, setIsCanvaModalOpen] = useState(false)
  const [showCopiedToast, setShowCopiedToast] = useState(false)
  const [selectedSnapshot, setSelectedSnapshot] = useState(null)

  // Personnel Profile State
  const [personnel, setPersonnel] = useState(activeUser || {
    full_name: 'Dr. Maria Santos',
    student_id: 'EMP-2021-0842',
    employee_id: 'EMP-2021-0842',
    personnel_classification: 'academic',
    college_name: 'College of Engineering, Architecture, and Computing',
    program_affiliations: [{ code: 'BSCS', name: 'BS Computer Science' }],
    designation: 'Associate Professor & Research Coordinator',
    year_level: '8 Years Service',
    age: 38,
    location: 'Koronadal City, South Cotabato',
    email: 'faculty@ndmu.edu.ph',
    phone: '+63 917 845 2910',
    avatar_url: null,
    about_me: 'Dedicated faculty member and researcher at Notre Dame of Marbel University.'
  })

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

  const initials = PersonnelProfilePhotoService.getInitials(personnel.full_name)

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
              <div className="rounded-lg bg-white px-2 py-1"><AchieveNestLogo variant="horizontal" size="compact" /></div>

              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide font-serif italic hidden sm:block">
                Character, Competence and Culture in harmony
              </div>
            </div>

            {/* Main Info & Metrics Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pt-1">

              {/* Avatar + Faculty Info */}
              <div className="flex items-center gap-5 sm:gap-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 border-white dark:border-slate-800 shadow-md bg-emerald-950 text-emerald-100 overflow-hidden shrink-0 aspect-square flex items-center justify-center font-black text-xl">
                  {personnel.avatar_url ? (
                    <img
                      src={personnel.avatar_url}
                      alt={personnel.full_name}
                      width="96"
                      height="96"
                      className="w-full h-full object-cover rounded-full aspect-square"
                      fetchPriority="high"
                      decoding="async"
                      loading="eager"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{personnel.full_name}</h2>
                    <span className="w-4 h-4 rounded-full bg-[#16834a] text-white inline-flex items-center justify-center text-[10px] shadow-xs font-bold" title="Verified Account">
                      ✓
                    </span>
                  </div>

                  <p className="text-xs font-extrabold text-[#16834a] dark:text-emerald-400">Associate Professor • {formatPersonnelPlacement(personnel)}</p>

                  {/* Compact Credential Chips Row */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                    <span className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#16834a] dark:text-emerald-400" />
                      {formatPersonnelPlacement(personnel)}
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
                  onClick={() => {
                    setSelectedSnapshot(latestSubmission || portfolio)
                    setIsCanvaModalOpen(true)
                  }}
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

        {/* ================= 3. ACADEMIC-YEAR PORTFOLIO GALLERY (PACKAGE C) ================= */}
        <PersonnelPortfolioGallery
          portfolio={portfolio}
          latestSubmission={latestSubmission}
          submissionHistory={submissionHistory}
          onOpenBooklet={(card) => {
            setSelectedSnapshot(card?.raw_snapshot || portfolio)
            setIsCanvaModalOpen(true)
          }}
          onOpenFeedback={(card) => {
            setSelectedSnapshot(card?.raw_snapshot || portfolio)
            setIsCanvaModalOpen(true)
          }}
        />

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
        portfolio={selectedSnapshot || portfolio}
        user={personnel}
      />
    </>
  )
}
