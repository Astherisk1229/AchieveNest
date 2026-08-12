import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import DigitalBarcodeIDCard from '../components/student/DigitalBarcodeIDCard'
import EditBasicInfoModal from '../components/personnel/EditBasicInfoModal'
import PersonnelSubmissionModal from '../components/personnel/PersonnelSubmissionModal'
import CoordinatorDashboardView from '../components/coordinator/CoordinatorDashboardView'
import OrgModeratorDashboardView from '../components/organization/OrgModeratorDashboardView'
import DepSecDashboardView from '../components/depsec/DepSecDashboardView'

import { 
  Award, 
  BookOpen, 
  CheckCircle2, 
  FileText, 
  Plus, 
  QrCode, 
  ShieldCheck, 
  Filter, 
  FileCheck2,
  Share2,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Users,
  Building2,
  Edit3
} from 'lucide-react'

import { getCurrentUser } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { usePersonnelPortfolio } from '../hooks/usePersonnelPortfolio'

export default function PersonnelDashboard({ currentUser: propUser, onRoleChange }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeTabParam = searchParams.get('tab')
  const { user: authUser, activeRoleContext: authRoleContext } = useAuth() || {}
  const currentUser = propUser || authUser || getCurrentUser()
  const activeRoleContext = currentUser?.active_role_context || authRoleContext || 'personnel'

  const { portfolio, totals } = usePersonnelPortfolio(currentUser?.employee_id || 'EMP-2021-0842')

  // Modals state
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false)
  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false)
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')

  // User Profile
  const [profile, setProfile] = useState({
    full_name: currentUser?.full_name || 'Dr. Maria Santos',
    student_id: currentUser?.employee_id || 'EMP-2021-0842',
    employee_id: currentUser?.employee_id || 'EMP-2021-0842',
    program: currentUser?.department || 'Department of Computer Studies',
    department: currentUser?.department || 'Department of Computer Studies',
    academic_rank: currentUser?.academic_rank || 'Associate Professor & Research Coordinator',
    year_level: '8 Years Service',
    age: 38,
    location: 'Koronadal City, South Cotabato',
    email: currentUser?.email || 'faculty@ndmu.edu.ph',
    phone: '+63 917 845 2910',
    avatar_url: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    qr_code_id: `NDMU-FAC-${currentUser?.employee_id || '2021-0842'}`
  })

  useEffect(() => {
    if (currentUser) {
      setProfile(prev => ({
        ...prev,
        full_name: currentUser.full_name || prev.full_name,
        employee_id: currentUser.employee_id || prev.employee_id,
        department: currentUser.department || prev.department,
        email: currentUser.email || prev.email,
        avatar_url: currentUser.avatar_url || prev.avatar_url
      }))
    }
  }, [currentUser])

  const handleRoleChange = (newRole, updatedUser) => {
    if (onRoleChange) onRoleChange(newRole, updatedUser)
  }

  // Accomplishments Mock / State
  const [accomplishments, setAccomplishments] = useState([
    {
      id: 1,
      title: 'Machine Learning Frameworks in Education Analytics',
      date: 'Apr 15, 2026',
      status: 'Verified',
      statusLabel: 'HR Verified',
      category: 'Research & Publications',
      academic_year: 'AY 2025-2026',
      issuer: 'IEEE Access Journal (Scopus Indexed)',
      description: 'Lead author on peer-reviewed Scopus research paper detailing automated evaluation metrics for student submission code bases.',
      icon: BookOpen,
      iconColor: 'text-[#2d8a4e] bg-[#eef7f0] border-[#cbe6d2]',
      attached_file_name: 'ieee_paper_scopus_santos_2026.pdf'
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

  const handleSaveBasicInfo = (updatedData) => {
    setProfile(prev => ({
      ...prev,
      ...updatedData,
      student_id: updatedData.employee_id || prev.student_id
    }))
  }

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

  const filteredAccomplishments = accomplishments.filter(item => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Degrees & Orgs') return item.category.includes('Degree') || item.category.includes('Membership') || item.category.includes('A.1') || item.category.includes('A.2')
    if (activeFilter === 'Seminars & Trainings') return item.category.includes('Seminar') || item.category.includes('Training') || item.category.includes('A.3')
    if (activeFilter === 'Lectures & Publications') return item.category.includes('Lecturer') || item.category.includes('Publication') || item.category.includes('B.1') || item.category.includes('B.2')
    if (activeFilter === 'Research & Awards') return item.category.includes('Research') || item.category.includes('Award') || item.category.includes('Recognition') || item.category.includes('B.3') || item.category.includes('B.4')
    if (activeFilter === 'Instructional Materials') return item.category.includes('Instructional') || item.category.includes('Material') || item.category.includes('B.5')
    if (activeFilter === 'Service & Community') return item.category.includes('Service') || item.category.includes('Community') || item.category.includes('Involvement') || item.category.includes('C.1') || item.category.includes('C.2')
    return item.category === activeFilter
  })

  return (
    <div key={activeRoleContext + '_' + (activeTabParam || 'overview')}>
      {activeRoleContext === 'program_coordinator' && activeTabParam !== 'faculty_view' ? (
        <CoordinatorDashboardView key={activeTabParam || 'overview'} currentUser={currentUser} />
      ) : activeRoleContext === 'organization_moderator' && activeTabParam !== 'faculty_view' ? (
        <OrgModeratorDashboardView key={activeTabParam || 'overview'} currentUser={currentUser} />
      ) : activeRoleContext === 'department_secretary' && activeTabParam !== 'faculty_view' ? (
        <DepSecDashboardView key={activeTabParam || 'overview'} currentUser={currentUser} />
      ) : (
        <div className="space-y-8 font-sans">
        
        {/* ================= HERO SUMMARY BANNER ================= */}
        <div className="bg-[#1b4332] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#245233] relative overflow-hidden">
          
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

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 relative z-10">
            <Link
              to="/personnel/portfolio/edit"
              className="p-4 rounded-2xl border text-left transition bg-[#2d8a4e] border-amber-400 shadow-md ring-2 ring-amber-400/50 hover:bg-[#257542] cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                <Award className="w-4 h-4 text-amber-300" />
                <span>Total Achievements</span>
              </div>
              <p className="text-3xl font-black text-white">{accomplishments.length} <span className="text-xs font-normal text-emerald-200">Records</span></p>
            </Link>

            <Link
              to="/personnel/portfolio/edit"
              className="p-4 rounded-2xl border text-left transition bg-[#133220]/90 border-emerald-600/30 hover:bg-[#183d28] cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Verified Records</span>
              </div>
              <p className="text-3xl font-black text-white">{accomplishments.filter(a => a.status === 'Verified' || a.status === 'HR Verified').length} <span className="text-xs font-normal text-emerald-300/80">Items</span></p>
            </Link>

            <Link
              to="/personnel/portfolio/edit"
              className="p-4 rounded-2xl border text-left transition bg-[#133220]/90 border-emerald-600/30 hover:bg-[#183d28] cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span>Pending Review</span>
              </div>
              <p className="text-3xl font-black text-white">{accomplishments.filter(a => a.status === 'Pending Review' || a.status === 'Pending').length} <span className="text-xs font-normal text-emerald-300/80">Items</span></p>
            </Link>

            <Link
              to="/personnel/portfolio"
              className="p-4 rounded-2xl border text-left transition bg-[#133220]/90 border-emerald-600/30 hover:bg-[#183d28] cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Attached Proofs</span>
              </div>
              <p className="text-3xl font-black text-white">{accomplishments.filter(a => a.proof_file || a.attached_file_name).length} <span className="text-xs font-normal text-emerald-300/80">Files</span></p>
            </Link>

            <Link
              to="/personnel/portfolio"
              className="p-4 rounded-2xl border text-left transition bg-[#133220]/90 border-emerald-600/30 hover:bg-[#183d28] cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>Portfolio Status</span>
              </div>
              <p className="text-sm font-extrabold text-amber-300 line-clamp-1">
                {portfolio?.status === 'SUBMITTED_TO_DEP_SEC' ? 'Submitted to Sec' :
                 portfolio?.status === 'ENDORSED_TO_HR' ? 'Dept Endorsed' :
                 portfolio?.status === 'HR_APPROVED' ? 'HR Approved' : 'Draft Portfolio'}
              </p>
            </Link>

          </div>
        </div>

        {/* ================= QUICK ACTIONS SECTION (DARK MODE FIX) ================= */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/personnel/portfolio/edit"
              state={{ openSubmissionModal: true }}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2d8a4e] shadow-2xs hover:shadow-md transition text-center flex flex-col items-center justify-center gap-3 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-[#2d8a4e] dark:group-hover:text-emerald-400 transition">
                Add Achievement
              </span>
            </Link>

            <Link
              to="/personnel/portfolio/edit"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2d8a4e] shadow-2xs hover:shadow-md transition text-center flex flex-col items-center justify-center gap-3 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-[#2d8a4e] dark:group-hover:text-emerald-400 transition">
                Edit Portfolio
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setIsEditInfoOpen(true)}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2d8a4e] shadow-2xs hover:shadow-md transition text-center flex flex-col items-center justify-center gap-3 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition">
                <Edit3 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-[#2d8a4e] dark:group-hover:text-emerald-400 transition">
                Edit Basic Information
              </span>
            </button>
          </div>
        </div>

        {/* ================= ACHIEVEMENTS TIMELINE SECTION (DARK MODE FIX) ================= */}
        <div id="achievements-timeline" className="scroll-mt-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>Accomplishments Timeline</span>
              {activeFilter !== 'All' && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#eef7f0] dark:bg-emerald-950/60 text-[#1e5831] dark:text-emerald-300 border border-[#cbe6d2] dark:border-emerald-800">
                  Filtered: {activeFilter}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Filter className="w-3.5 h-3.5" />
              <span>Showing {filteredAccomplishments.length} of {accomplishments.length} records</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 scrollbar-none">
            {[
              'All',
              'Degrees & Orgs',
              'Seminars & Trainings',
              'Lectures & Publications',
              'Research & Awards',
              'Instructional Materials',
              'Service & Community'
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  activeFilter === cat
                    ? 'bg-[#1b4332] text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Timeline Card Items */}
          <div className="space-y-3">
            {filteredAccomplishments.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs">
                No accomplishment entries found under "{activeFilter}" category filter.
              </div>
            ) : (
              filteredAccomplishments.map((item) => {
                const IconComponent = item.icon || Award
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${item.iconColor || 'text-[#2d8a4e] bg-[#eef7f0] border-[#cbe6d2]'}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{item.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">📅 {item.date}</span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.status === 'Verified'
                                ? 'bg-[#eef7f0] dark:bg-emerald-950/60 text-[#1e5831] dark:text-emerald-300 border border-[#cbe6d2] dark:border-emerald-800'
                                : item.status === 'Endorsed'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {item.statusLabel || item.status}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{item.issuer}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => alert(`Viewing attached proof: ${item.attached_file_name}`)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-[#2d8a4e] dark:text-emerald-400" />
                        <span>Proof</span>
                      </button>
                      <span className="text-xs font-semibold px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 shrink-0">
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
    </div>
  )
}
