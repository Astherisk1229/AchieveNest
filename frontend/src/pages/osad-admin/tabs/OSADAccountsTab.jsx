import React, { useState } from 'react'
import {
  Users,
  Search,
  Filter,
  UserCheck,
  Building2,
  ChevronDown,
  ShieldCheck,
  Edit,
  Eye,
  CheckCircle2,
  X,
  Award,
  FileText,
  Lock,
  KeyRound,
  RefreshCw,
  Copy
} from 'lucide-react'

export default function OSADAccountsTab({
  userSearchTerm,
  setUserSearchTerm,
  selectedCollege,
  setSelectedCollege,
  selectedSort,
  setSelectedSort,
  getUsers,
  getStudentPortfolios,
  resetStudentPassword,
  getPasswordResetRequests,
  approvePasswordResetRequest,
  showToast
}) {
  const [isCollegeDropdownOpen, setIsCollegeDropdownOpen] = useState(false)
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [requestStatusFilter, setRequestStatusFilter] = useState('all') // 'all' | 'pending' | 'approved'
  const [viewingStudent, setViewingStudent] = useState(null)
  const [resetPasswordStudent, setResetPasswordStudent] = useState(null)
  const [tempPasswordInput, setTempPasswordInput] = useState('NDMU-Student2026!')
  const [copiedNotification, setCopiedNotification] = useState(false)
  const [activeAccountTab, setActiveAccountTab] = useState('directory') // 'directory' | 'requests'
  const [resetRequests, setResetRequests] = useState(() => getPasswordResetRequests ? getPasswordResetRequests() : [])

  // Sync reset requests on custom event
  React.useEffect(() => {
    const handleSyncRequests = () => {
      if (getPasswordResetRequests) {
        setResetRequests([...getPasswordResetRequests()])
      }
    }
    window.addEventListener('achievenest_reset_request_submitted', handleSyncRequests)
    return () => window.removeEventListener('achievenest_reset_request_submitted', handleSyncRequests)
  }, [getPasswordResetRequests])

  const pendingRequests = resetRequests.filter(r => r.status === 'pending')

  const filteredRequests = resetRequests.filter(req => {
    const term = userSearchTerm.toLowerCase().trim()
    const matchTerm = !term || (
      (req.student_name && req.student_name.toLowerCase().includes(term)) ||
      (req.user_email && req.user_email.toLowerCase().includes(term)) ||
      (req.student_id && req.student_id.toLowerCase().includes(term)) ||
      (req.remarks && req.remarks.toLowerCase().includes(term))
    )
    const matchStatus = requestStatusFilter === 'all' || req.status === requestStatusFilter
    return matchTerm && matchStatus
  })

  const usersList = getUsers('student', userSearchTerm, selectedCollege, selectedSort)

  const handleGenerateRandomPassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    setTempPasswordInput(`NDMU-Std${randomNum}!`)
  }

  const handleConfirmResetPassword = (e) => {
    e.preventDefault()
    if (!resetPasswordStudent) return

    if (resetStudentPassword) {
      resetStudentPassword(resetPasswordStudent.id || resetPasswordStudent.student_id, tempPasswordInput)
    }

    if (showToast) {
      showToast(`Successfully reset credentials for student [${resetPasswordStudent.full_name}]`)
    }

    setResetPasswordStudent(null)
  }

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPasswordInput)
    setCopiedNotification(true)
    setTimeout(() => setCopiedNotification(false), 2000)
  }

  const studentPortfolioItems = viewingStudent && getStudentPortfolios
    ? (getStudentPortfolios(viewingStudent.full_name)[0]?.portfolio_items || [
        {
          id: 'p-1',
          title: `1st Place — National ${viewingStudent.program?.includes('Computer') ? 'Hackathon & AI Challenge' : 'Academic Summit'} 2026`,
          category: 'National Competition',
          points: 120,
          date: '2026-02-14',
          status: 'OSAD Verified',
          proof_url: '#'
        },
        {
          id: 'p-2',
          title: 'NDMU Supreme Student Council Executive Leadership Service',
          category: 'Student Leadership',
          points: 100,
          date: '2026-01-20',
          status: 'OSAD Verified',
          proof_url: '#'
        },
        {
          id: 'p-3',
          title: 'Community Outreach & Extension Volunteer Accreditation',
          category: 'Community Extension',
          points: 80,
          date: '2025-11-18',
          status: 'OSAD Verified',
          proof_url: '#'
        }
      ])
    : []

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#2d8a4e] dark:text-emerald-400" />
              Student Account Governance &amp; Portfolios
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Manage student accounts, review password reset requests, inspect portfolios, and monitor credit points.
            </p>
          </div>

          {/* Sub-Tab Navigation */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setActiveAccountTab('directory')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                activeAccountTab === 'directory'
                  ? 'bg-[#1b4332] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Student Directory
            </button>

            <button
              type="button"
              onClick={() => setActiveAccountTab('requests')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                activeAccountTab === 'requests'
                  ? 'bg-[#1b4332] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Requests</span>
              {pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              placeholder={
                activeAccountTab === 'directory'
                  ? 'Search by student name or student ID...'
                  : 'Search reset requests by name, ID, or email...'
              }
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-[#2d8a4e]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeAccountTab === 'directory' ? (
              <>
                {/* College Filter */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCollegeDropdownOpen(!isCollegeDropdownOpen)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer"
                  >
                    <span>College: {selectedCollege.toUpperCase()}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  {isCollegeDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-40 rounded-xl bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 shadow-xl z-20 p-1">
                      {['all', 'CEAC', 'CBA', 'CAS', 'CED'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setSelectedCollege(c); setIsCollegeDropdownOpen(false); }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-[#2d8a4e]"
                        >
                          {c.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort Order */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Sort: {selectedSort}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  {isSortDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-36 rounded-xl bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 shadow-xl z-20 p-1">
                      {['name', 'id', 'points'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { setSelectedSort(s); setIsSortDropdownOpen(false); }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-[#2d8a4e]"
                        >
                          {s.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Reset Requests Status Filter */
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5 text-amber-500" />
                  <span>Status: {requestStatusFilter.toUpperCase()}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {isStatusDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 shadow-xl z-20 p-1">
                    {[
                      { key: 'all', label: 'All Statuses' },
                      { key: 'pending', label: 'Pending Only' },
                      { key: 'approved', label: 'Approved Only' }
                    ].map(st => (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => { setRequestStatusFilter(st.key); setIsStatusDropdownOpen(false); }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-700"
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Directory View */}
      {activeAccountTab === 'directory' && (
        <div className="rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-extrabold uppercase tracking-wider">
                  <th className="p-4">Student Details</th>
                  <th className="p-4">College &amp; Program</th>
                  <th className="p-4">Role Context</th>
                  <th className="p-4">Points &amp; Proofs</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">
                      No student accounts found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  usersList.map((user) => (
                    <tr key={user.id || user.student_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#2d8a4e] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {user.full_name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white">{user.full_name}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{user.student_id || user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold">{user.college || 'CEAC'}</p>
                        <p className="text-[11px] text-slate-500">{user.program || 'BS Computer Science'}</p>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-100 dark:border-emerald-800/50">
                          Student
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-[#2d8a4e]">{user.total_points || 30} pts</p>
                        <p className="text-[11px] text-slate-500">{user.verified_count || 3} verified proofs</p>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingStudent(user)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 text-[11px] font-extrabold hover:bg-emerald-100 flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Portfolio</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setResetPasswordStudent(user)
                              const randomNum = Math.floor(1000 + Math.random() * 9000)
                              setTempPasswordInput(`NDMU-Std${randomNum}!`)
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-slate-700 dark:text-slate-200 hover:text-amber-700 border border-slate-200 dark:border-slate-700 text-[11px] font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                            <span>Reset Password</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Reset Requests Inbox View */}
      {activeAccountTab === 'requests' && (
        <div className="rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs space-y-4 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                Student Password Reset Request Inbox
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Review locked-out student reset requests submitted from the login screen and issue temporary credentials.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-xs font-extrabold">
              {pendingRequests.length} Pending Requests
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No password reset requests found matching your filter criteria.
              </div>
            ) : (
              filteredRequests.map((req) => (
                <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 flex items-center justify-center shrink-0 font-bold">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-xs text-slate-900 dark:text-white">{req.student_name || 'Student Account'}</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          req.status === 'approved' 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-[#2d8a4e] dark:text-emerald-400' 
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{req.user_email} • ID: {req.student_id || 'N/A'}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5">"{req.remarks || 'Locked out of account.'}"</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {req.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => {
                          const targetStudent = usersList.find(u => u.email?.toLowerCase() === req.user_email?.toLowerCase()) || {
                            full_name: req.student_name || 'Student',
                            student_id: req.student_id || '2023-0000',
                            email: req.user_email,
                            program: req.program || 'NDMU Student'
                          }
                          setResetPasswordStudent(targetStudent)
                          const randomNum = Math.floor(1000 + Math.random() * 9000)
                          setTempPasswordInput(`NDMU-Std${randomNum}!`)
                          if (approvePasswordResetRequest) {
                            approvePasswordResetRequest(req.id, `NDMU-Std${randomNum}!`)
                            setResetRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r))
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#1b4332] hover:bg-[#2d8a4e] text-white font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Fulfill &amp; Issue Passcode</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approved &amp; Issued</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* OSAD Student Portfolio Inspector Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131e2e] rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
            
            {/* Modal Header */}
            <div className="p-6 bg-[#1b4332] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2d8a4e] text-white flex items-center justify-center font-extrabold text-sm shrink-0 border border-emerald-400/30">
                  {viewingStudent.full_name?.charAt(0) || 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white">{viewingStudent.full_name}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-extrabold uppercase">
                      STUDENT PORTFOLIO
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/90 font-medium">
                    ID: {viewingStudent.student_id || '202310492'} • {viewingStudent.college || 'CEAC'} — {viewingStudent.program || 'BS Computer Science'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              
              {/* Portfolio Security Scope Notice */}
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2d8a4e] shrink-0" />
                  <span>OSAD Student Governance Access — Restricted strictly to Student Portfolios.</span>
                </div>
                <span className="font-extrabold text-[#2d8a4e]">{viewingStudent.total_points || 320} Total Points</span>
              </div>

              {/* Portfolio Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#2d8a4e]" />
                  Verified Achievements &amp; Extracurricular Records
                </h4>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                  {studentPortfolioItems.map((item, idx) => (
                    <div key={item.id || idx} className="p-4 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-[#2d8a4e] dark:text-emerald-400 font-extrabold text-[10px]">
                            {item.category}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">{item.date}</span>
                        </div>
                        <p className="font-extrabold text-xs text-slate-900 dark:text-white">{item.title}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#2d8a4e]" />
                          +{item.points} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Faculty personnel portfolios remain hidden per OSAD access boundaries.
              </span>

              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-extrabold text-xs transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

      {/* OSAD Reset Student Password Modal */}
      {resetPasswordStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131e2e] rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
            
            {/* Modal Header */}
            <div className="p-6 bg-[#1b4332] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-extrabold text-sm shrink-0 border border-amber-400/30">
                  <KeyRound className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Reset Student Password</h3>
                  <p className="text-xs text-emerald-200/90 font-medium">OSAD Administrative Credential Reset</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setResetPasswordStudent(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleConfirmResetPassword} className="p-6 space-y-4">
              
              {/* Target Student Profile Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2d8a4e] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {resetPasswordStudent.full_name?.charAt(0) || 'S'}
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white">{resetPasswordStudent.full_name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    ID: {resetPasswordStudent.student_id || '202310492'} • {resetPasswordStudent.program || 'BS Computer Science'}
                  </p>
                  <p className="text-[11px] text-[#2d8a4e] font-semibold">{resetPasswordStudent.email || 'student@ndmu.edu.ph'}</p>
                </div>
              </div>

              {/* Password Input & Generator */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>New Temporary Password</span>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[#2d8a4e] hover:underline text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate Random</span>
                  </button>
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={tempPasswordInput}
                    onChange={(e) => setTempPasswordInput(e.target.value)}
                    required
                    className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#2d8a4e]"
                  />

                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition"
                  >
                    <Copy className="w-3 h-3 text-slate-500" />
                    <span>{copiedNotification ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                The student will be prompted to change this temporary password upon their next login attempt.
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-extrabold hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1b4332] hover:bg-[#2d8a4e] text-white text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                  <span>Confirm Password Reset</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}

