import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import DigitalBarcodeIDCard from '../components/student/DigitalBarcodeIDCard'
import EditBasicInfoModal from '../components/personnel/EditBasicInfoModal'
import PersonnelSubmissionModal from '../components/personnel/PersonnelSubmissionModal'
import CoordinatorDashboardView from '../components/coordinator/CoordinatorDashboardView'
import { 
  Award, 
  Upload, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  FileText, 
  Star, 
  QrCode, 
  Filter,
  BookOpen,
  Users,
  Building2,
  ShieldCheck,
  Edit3,
  GraduationCap,
  ChevronRight,
  FolderKanban,
  FileCheck2
} from 'lucide-react'

import { getCurrentUser } from '../services/authService'

export default function PersonnelDashboard({ currentUser: propUser }) {
  const navigate = useNavigate()
  const [currentUserState, setCurrentUserState] = useState(propUser || getCurrentUser())

  React.useEffect(() => {
    const user = propUser || getCurrentUser()
    if (user) {
      setCurrentUserState(user)
    }
  }, [propUser])

  React.useEffect(() => {
    const syncUser = () => {
      const u = getCurrentUser()
      if (u) setCurrentUserState({ ...u })
    }
    window.addEventListener('storage', syncUser)
    return () => window.removeEventListener('storage', syncUser)
  }, [])

  const handleRoleChange = (newRoleContext, updatedUser) => {
    const updated = updatedUser || updateUserRoleContext(newRoleContext)
    setCurrentUserState({ ...updated })
  }

  const currentUser = propUser || currentUserState || getCurrentUser()
  const activeRoleContext = currentUser?.active_role_context || 'personnel'



  // Current user / profile state for Personnel View
  const [profile, setProfile] = useState({
    full_name: currentUserState?.full_name || 'Dr. Maria Santos',
    student_id: currentUserState?.employee_id || 'EMP-2021-0842',
    employee_id: currentUserState?.employee_id || 'EMP-2021-0842',
    user_type: 'personnel',
    designation: 'Associate Professor & Research Coordinator',
    department: 'College of Information Technology',
    educational_attainment: 'Ph.D. in Computer Science',
    contact_number: '+63 917 845 2910',
    email: currentUserState?.email || 'maria.santos@ndmu.edu.ph',
    specialization: 'Artificial Intelligence, Educational Technology, Data Analytics',
    years_of_service: '8 Years'
  })

  // Modals state
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false)
  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false)
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)

  // Active filters
  const [activeFilter, setActiveFilter] = useState('All')

  // Accomplishments list state
  const [accomplishments, setAccomplishments] = useState([
    {
      id: 1,
      title: 'Machine Learning Frameworks in Higher Education Analytics',
      date: 'Jan 15, 2026',
      status: 'Verified',
      statusLabel: 'HR Verified',
      category: 'Research & Publications',
      academic_year: 'AY 2025-2026',
      issuer: 'IEEE Access Journal (Scopus Indexed)',
      description: 'Peer-reviewed research article on predictive student performance modeling using deep learning algorithms.',
      icon: BookOpen,
      iconColor: 'text-[#2d8a4e] bg-[#eef7f0] border-[#cbe6d2]',
      attached_file_name: 'ieee_access_publication_santos.pdf'
    },
    {
      id: 2,
      title: 'CHED Regional Training on AI Curriculum Integration',
      date: 'Dec 04, 2025',
      status: 'Endorsed',
      statusLabel: 'Dept Endorsed',
      category: 'Seminars & Workshops',
      academic_year: 'AY 2025-2026',
      issuer: 'Commission on Higher Education (CHED IX)',
      description: 'Completed 40-hour intensive faculty development seminar on embedding generative AI tools into IT curricula.',
      icon: Users,
      iconColor: 'text-amber-700 bg-amber-50 border-amber-200',
      attached_file_name: 'ched_ai_training_cert.pdf'
    },
    {
      id: 3,
      title: 'Barangay Smart Literacy Outreach Program',
      date: 'Nov 20, 2025',
      status: 'Verified',
      statusLabel: 'HR Verified',
      category: 'Extension Services',
      academic_year: 'AY 2024-2025',
      issuer: 'NDMU Extension & Community Involvement Office',
      description: 'Lead proponent for digital literacy training program for barangay officials in Koronadal City.',
      icon: Building2,
      iconColor: 'text-[#2d8a4e] bg-[#eef7f0] border-[#cbe6d2]',
      attached_file_name: 'community_extension_report.pdf'
    },
    {
      id: 4,
      title: 'NDMU Outstanding Faculty Researcher of the Year',
      date: 'Feb 10, 2025',
      status: 'Verified',
      statusLabel: 'HR Verified',
      category: 'Institutional Awards',
      academic_year: 'AY 2024-2025',
      issuer: 'Notre Dame of Marbel University',
      description: 'University-wide recognition for high research publication output and Scopus citation index.',
      icon: Award,
      iconColor: 'text-[#2d8a4e] bg-[#eef7f0] border-[#cbe6d2]',
      attached_file_name: 'outstanding_researcher_award.pdf'
    },
    {
      id: 5,
      title: 'AWS Certified Solutions Architect - Associate',
      date: 'Jan 28, 2026',
      status: 'Pending',
      statusLabel: 'Pending Review',
      category: 'Certifications & Licenses',
      academic_year: 'AY 2025-2026',
      issuer: 'Amazon Web Services (AWS)',
      description: 'Industry certification validating cloud architecture design, security, and enterprise deployment capabilities.',
      icon: ShieldCheck,
      iconColor: 'text-slate-600 bg-slate-100 border-slate-200',
      attached_file_name: 'aws_solutions_architect_certificate.pdf'
    }
  ])

  // Save handler for profile edit
  const handleSaveBasicInfo = (updatedData) => {
    setProfile(prev => ({
      ...prev,
      ...updatedData,
      student_id: updatedData.employee_id || prev.student_id
    }))
  }

  // Add new accomplishment
  const handleAddNewAccomplishment = (newEntry) => {
    setAccomplishments([
      {
        ...newEntry,
        statusLabel: newEntry.status === 'Pending' ? 'Pending Review' : newEntry.status,
        icon: Award,
        iconColor: 'text-amber-700 bg-amber-50 border-amber-200'
      },
      ...accomplishments
    ])
  }

  // Category card click logic
  const handleCategoryCardClick = (catName) => {
    setActiveFilter(catName)
    const timelineEl = document.getElementById('achievements-timeline')
    if (timelineEl) {
      timelineEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Filtered List
  const filteredAccomplishments = accomplishments.filter(item => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Verified') return item.status === 'Verified'
    if (activeFilter === 'Pending') return item.status === 'Pending'
    if (activeFilter === 'Endorsed') return item.status === 'Endorsed'
    if (activeFilter === 'Certificates') return item.status === 'Verified'
    return item.category === activeFilter
  })

  // Counts for Stats Row
  const totalCount = accomplishments.length
  const verifiedCount = accomplishments.filter(a => a.status === 'Verified').length
  const pendingCount = accomplishments.filter(a => a.status === 'Pending').length
  const endorsedCount = accomplishments.filter(a => a.status === 'Endorsed').length
  const certificatesCount = verifiedCount

  return (
    <MainLayout onRoleChange={handleRoleChange}>
      {activeRoleContext === 'program_coordinator' ? (
        <CoordinatorDashboardView currentUser={currentUser} />
      ) : (
        <div className="space-y-8 font-sans">
        
        {/* ================= HERO SUMMARY BANNER ================= */}
        <div className="bg-[#1b4332] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#245233] relative overflow-hidden">
          
          {/* Top Banner Row */}
          <div className="flex items-start justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] border border-emerald-400/30 flex items-center justify-center text-white shadow-lg shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">Personnel Professional Portfolio</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 uppercase">
                    CONTEXT: PERSONNEL
                  </span>
                </div>
                <p className="text-xs text-emerald-200/80 font-medium mt-0.5">
                  {profile.full_name} • {profile.employee_id} • {profile.department}
                </p>
              </div>
            </div>

            {/* Clickable NDMU Digital Barcode ID Badge */}
            <button
              type="button"
              onClick={() => setIsBarcodeOpen(true)}
              className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 transition text-xs font-bold shadow-md group shrink-0"
              title="Click to expand Faculty Digital ID Barcode"
            >
              <QrCode className="w-4 h-4 text-amber-300 group-hover:scale-110 transition" />
              <span className="hidden sm:inline">Digital ID Barcode</span>
            </button>
          </div>

          {/* 5 Stats Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 relative z-10">
            
            <button
              type="button"
              onClick={() => setActiveFilter('All')}
              className={`p-4 rounded-2xl border text-left transition ${
                activeFilter === 'All'
                  ? 'bg-[#2d8a4e] border-amber-400 shadow-md ring-2 ring-amber-400/50'
                  : 'bg-[#133220]/90 border-emerald-600/30 hover:bg-[#183d28]'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                <FolderKanban className="w-4 h-4 text-emerald-300" />
                <span>Total Records</span>
              </div>
              <p className="text-3xl font-black text-white">{totalCount}</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('Verified')}
              className={`p-4 rounded-2xl border text-left transition ${
                activeFilter === 'Verified'
                  ? 'bg-[#2d8a4e] border-amber-400 shadow-md ring-2 ring-amber-400/50'
                  : 'bg-[#133220]/90 border-emerald-600/30 hover:bg-[#183d28]'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>HR Verified</span>
              </div>
              <p className="text-3xl font-black text-white">{verifiedCount}</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('Pending')}
              className={`p-4 rounded-2xl border text-left transition ${
                activeFilter === 'Pending'
                  ? 'bg-[#2d8a4e] border-amber-400 shadow-md ring-2 ring-amber-400/50'
                  : 'bg-[#133220]/90 border-emerald-600/30 hover:bg-[#183d28]'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                <Clock className="w-4 h-4 text-amber-300" />
                <span>Pending Review</span>
              </div>
              <p className="text-3xl font-black text-white">{pendingCount}</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('Endorsed')}
              className={`p-4 rounded-2xl border text-left transition ${
                activeFilter === 'Endorsed'
                  ? 'bg-[#2d8a4e] border-amber-400 shadow-md ring-2 ring-amber-400/50'
                  : 'bg-[#133220]/90 border-emerald-600/30 hover:bg-[#183d28]'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                <RotateCcw className="w-4 h-4 text-emerald-300" />
                <span>Dept. Endorsed</span>
              </div>
              <p className="text-3xl font-black text-white">{endorsedCount}</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('Certificates')}
              className={`p-4 rounded-2xl border text-left transition ${
                activeFilter === 'Certificates'
                  ? 'bg-[#2d8a4e] border-amber-400 shadow-md ring-2 ring-amber-400/50'
                  : 'bg-[#133220]/90 border-emerald-600/30 hover:bg-[#183d28]'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                <Award className="w-4 h-4 text-amber-300" />
                <span>Total Proofs</span>
              </div>
              <p className="text-3xl font-black text-white">{certificatesCount}</p>
            </button>

          </div>

        </div>

        {/* ================= QUICK ACTIONS SECTION ================= */}
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-3">Quick Actions</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Card 1: Submit New Accomplishment */}
            <button
              type="button"
              onClick={() => navigate('/personnel/achievements', { state: { openSubmissionModal: true } })}
              className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-[#2d8a4e] shadow-2xs hover:shadow-md transition text-center flex flex-col items-center justify-center gap-3 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-[#2d8a4e] transition">
                Submit New Accomplishment
              </span>
            </button>

            {/* Card 2: Edit Basic Information */}
            <button
              type="button"
              onClick={() => setIsEditInfoOpen(true)}
              className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-[#2d8a4e] shadow-2xs hover:shadow-md transition text-center flex flex-col items-center justify-center gap-3 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition">
                <Edit3 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-[#2d8a4e] transition">
                Edit Basic Information
              </span>
            </button>

            {/* Card 3: My Verified Proofs */}
            <button
              type="button"
              onClick={() => navigate('/personnel/achievements')}
              className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-[#2d8a4e] shadow-2xs hover:shadow-md transition text-center flex flex-col items-center justify-center gap-3 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition">
                <Star className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-[#2d8a4e] transition">
                My Verified Proofs
              </span>
            </button>

          </div>
        </div>

        {/* ================= ACHIEVEMENTS TIMELINE SECTION ================= */}
        <div id="achievements-timeline" className="scroll-mt-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>Accomplishments Timeline</span>
              {activeFilter !== 'All' && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#eef7f0] text-[#1e5831] border border-[#cbe6d2]">
                  Filtered: {activeFilter}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Filter className="w-3.5 h-3.5" />
              <span>Showing {filteredAccomplishments.length} of {accomplishments.length} records</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 scrollbar-none">
            {['All', 'Research & Publications', 'Seminars & Workshops', 'Extension Services', 'Institutional Awards', 'Certifications & Licenses'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  activeFilter === cat
                    ? 'bg-[#1b4332] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Timeline Card Items */}
          <div className="space-y-3">
            {filteredAccomplishments.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-slate-100 text-center text-slate-400 text-xs">
                No accomplishment entries found under "{activeFilter}" category filter.
              </div>
            ) : (
              filteredAccomplishments.map((item) => {
                const IconComponent = item.icon || Award
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${item.iconColor || 'text-[#2d8a4e] bg-[#eef7f0] border-[#cbe6d2]'}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">{item.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400 font-medium">📅 {item.date}</span>
                          <span className="text-slate-300">•</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.status === 'Verified'
                                ? 'bg-[#eef7f0] text-[#1e5831] border border-[#cbe6d2]'
                                : item.status === 'Endorsed'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {item.statusLabel || item.status}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] text-slate-500 font-medium">{item.issuer}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => alert(`Viewing attached proof: ${item.attached_file_name}`)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#eef7f0] hover:text-[#2d8a4e] border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-[#2d8a4e]" />
                        <span>Proof</span>
                      </button>
                      <span className="text-xs font-semibold px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                        {item.category}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

        </div>

      </div>
      )}

      {/* MODALS */}
      <DigitalBarcodeIDCard
        user={profile}
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
      />

      <EditBasicInfoModal
        isOpen={isEditInfoOpen}
        onClose={() => setIsEditInfoOpen(false)}
        currentInfo={profile}
        onSave={handleSaveBasicInfo}
      />

      <PersonnelSubmissionModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSubmitAccomplishment={handleAddNewAccomplishment}
      />
    </MainLayout>
  )
}
