import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import campusBanner from '../../../assets/ndmu_campus_banner.png'
import { useVerification } from '../../../hooks/useVerification'
import { useStudentRoster } from '../../../hooks/useStudentRoster'
import CoordinatorMetricsSidebar from './CoordinatorMetricsSidebar'
import { AchieveNestLogo } from '../../../components/brand'
import { CoordinatorDecisionActions } from './CoordinatorReviewParts'
import CoordinatorSubmissionReview from './CoordinatorSubmissionReview'
import { formatDateRange } from '../../../utils/achievementDates'
import {
  Shield,
  Clock,
  CheckCircle2,
  RotateCcw,
  FileText,
  Check,
  X,
  Search,
  Users,
  Award,
  Eye,
  GraduationCap,
  Activity,
  ChevronRight,
  ArrowLeft,
  Mail,
  CreditCard
} from 'lucide-react'




export default function CoordinatorDashboardPage({ currentUser }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const user = currentUser || {}
  const programScope = user.program_scope || user.academic_program_name || 'your assigned program'

  // The coordinator has two active views: verification and student roster.
  let activeTabParam = null
  try {
    activeTabParam = searchParams ? searchParams.get('tab') : null
  } catch (e) {
    activeTabParam = null
  }

  // Dashboard Overview is now part of the verification workspace. Legacy
  // overview URLs therefore land on the combined workspace as well.
  const activeTab = activeTabParam === 'students' ? 'students' : 'workspace'

  useEffect(() => {
    if (activeTabParam === 'workspace' || activeTabParam === 'students') return
    setSearchParams(previous => {
      const next = new URLSearchParams(previous)
      next.set('tab', 'workspace')
      return next
    }, { replace: true })
  }, [activeTabParam, setSearchParams])

  // Custom MVC Bridge Hooks
  const {
    allSubmissions,
    filteredSubmissions,
    pendingCount,
    verifiedCount,
    returnedCount,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    handleApprove: handleApproveHook,
    handleReturn: handleReturnHook,
    handleReject: handleRejectHook,
    loadRecordDetail
  } = useVerification()

  const {
    studentRoster,
    filteredStudents,
    searchQuery: rosterSearchQuery,
    setSearchQuery: setRosterSearchQuery,
    yearFilter,
    setYearFilter,
    courseFilter,
    setCourseFilter,
    loading: rosterLoading,
    error: rosterError,
    reload: reloadRoster
  } = useStudentRoster()

  const [selectedReviewItem, setSelectedReviewItem] = useState(null)
  const [selectedStudentDossier, setSelectedStudentDossier] = useState(null)
  const [dossierActiveTab, setDossierActiveTab] = useState('all') // 'all' | 'verified' | 'pending' | 'returned'
  const [dossierCategoryFilter, setDossierCategoryFilter] = useState('All')

  const [selectedWorkspaceItem, setSelectedWorkspaceItem] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  // Verification Workspace Filter States
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [sortBy, setSortBy] = useState('Newest')



  // Notification deep link: /personnel/dashboard?tab=workspace&record=<id> selects that submission.
  const linkedRecordId = searchParams ? searchParams.get('record') : null
  useEffect(() => {
    if (!linkedRecordId) return
    const linked = (allSubmissions || []).find(item => item.id === linkedRecordId)
    if (linked) {
      setStatusFilter('All')
      setSelectedWorkspaceItem(linked)
      // Consume the link so a later refresh or decision does not re-select it.
      setSearchParams({ tab: 'workspace' }, { replace: true })
    }
  }, [linkedRecordId, allSubmissions, setStatusFilter, setSearchParams])

  const triggerToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  // Decisions go through CoordinatorDecisionActions; this only reports the outcome.
  const handleDecisionDone = (action, result) => {
    const messages = {
      approve: 'Achievement approved and verified.',
      return: 'Submission returned to the student with your remarks.',
      reject: 'Submission rejected with your remarks.'
    }
    const scoringDeferred = action === 'approve' && result?.scoring_status === 'DEFERRED'
    triggerToast(scoringDeferred
      ? 'Approved, but score calculation is pending. Contact OSAD for follow-up if it does not update.'
      : (messages[action] || 'Decision recorded.'))
    setStatusFilter('Pending')
    setSelectedReviewItem(null)
    setSelectedWorkspaceItem(null)
  }

  // Recent activity click: jump to the Verification Workspace with that submission selected.
  // The linkedRecordId effect above selects the record and clears the param.
  const openInWorkspace = (recordId) => {
    setSelectedReviewItem(null)
    setSearchParams({ tab: 'workspace', record: recordId })
  }

  // Recent activity is derived from the real, program-scoped queue (status=all), newest first.
  const activityStyles = {
    Pending: { title: 'Awaiting review', icon: Clock, badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
    Returned: { title: 'Returned for revision', icon: RotateCcw, badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
    Verified: { title: 'Verified', icon: CheckCircle2, badgeColor: 'bg-emerald-50 text-[#064e2b] border-emerald-200' },
    Rejected: { title: 'Rejected', icon: X, badgeColor: 'bg-rose-50 text-rose-800 border-rose-200' }
  }
  const recentActivity = [...(allSubmissions || [])]
    .sort((a, b) => new Date(b.updated_at || b.submitted_at || 0) - new Date(a.updated_at || a.submitted_at || 0))
    .slice(0, 6)
    .map(item => {
      const style = activityStyles[item.status] || activityStyles.Pending
      return {
        id: item.id,
        title: style.title,
        label: item.status,
        icon: style.icon,
        badgeColor: style.badgeColor,
        detail: `"${item.title || 'Untitled'}" by ${item.student_name || 'Unknown student'}`,
        timestamp: item.updated_at || item.submitted_at || ''
      }
    })

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-[#16834a] text-white text-xs font-bold shadow-xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#245F42]" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 text-[#245F42] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= TAB 2: VERIFICATION WORKSPACE (Master-Detail) ================= */}
      {activeTab === 'workspace' && (() => {
        // Category options come from the queue itself so every option matches real submissions.
        const categoryOptions = [...new Set((allSubmissions || []).map(item => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b))
        const finalSubmissions = (filteredSubmissions || []).filter(item => {
          if (categoryFilter !== 'All Categories' && item.category !== categoryFilter) return false
          return true
        }).sort((a, b) => {
          if (sortBy === 'Newest') return new Date(b.date || 0) - new Date(a.date || 0)
          if (sortBy === 'Oldest') return new Date(a.date || 0) - new Date(b.date || 0)
          if (sortBy === 'Name') return (a.student_name || '').localeCompare(b.student_name || '')
          if (sortBy === 'Title') return (a.title || '').localeCompare(b.title || '')
          return 0
        })

        const workspaceItem = finalSubmissions.find(item => item.id === selectedWorkspaceItem?.id) || finalSubmissions[0] || null

        return (

          <div className="space-y-4 animate-in fade-in duration-150">

            <section className="rounded-2xl border border-[#B9D8C1] bg-[#EFF7F0] px-5 py-4 shadow-xs dark:border-[#374B3F] dark:bg-[#1D2A23]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-lg font-extrabold text-[#145C39] dark:text-[#E6EFE9]">Verification Workspace</h1>
                  <p className="mt-1 text-xs font-medium text-[#356148] dark:text-[#B1C0B6]">
                    Review student achievement submissions for your assigned program.
                  </p>
                  <p className="mt-2 text-xs font-bold text-[#145C39] dark:text-[#E6EFE9]">Program scope: {programScope}</p>
                </div>
                <span className="w-fit shrink-0 rounded-full bg-[#176B43] px-3 py-1.5 text-[11px] font-bold text-white">
                  Program Coordinator
                </span>
              </div>
            </section>

            <CoordinatorMetricsSidebar
              pendingCount={pendingCount}
              verifiedCount={verifiedCount}
              returnedCount={returnedCount}
            />

            <div className="space-y-3">

              {/* Queue search and filters */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-700 dark:bg-[#131e2e]">
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-[minmax(220px,1fr)_minmax(170px,220px)_minmax(190px,230px)]">
                  <div className="relative min-w-0">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by title, student name, or Student ID..."
                      aria-label="Search submissions by title, student name, or student ID"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#16834a] focus:bg-white focus:ring-2 focus:ring-[#16834a]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400"
                    />
                  </div>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    aria-label="Filter submissions by category"
                    className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="All Categories">All Categories</option>
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort submissions"
                    className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="Newest">Sort: Newest First</option>
                    <option value="Oldest">Sort: Oldest First</option>
                    <option value="Name">Sort: Student Name A-Z</option>
                    <option value="Title">Sort: Title A-Z</option>
                  </select>

                </div>

                <div className="mt-3 border-t border-slate-100 pt-2.5 dark:border-slate-700">
                  <div className="flex max-w-full items-center gap-1 overflow-x-auto" role="group" aria-label="Filter submissions by status">
                    {[
                      ['All', allSubmissions.length],
                      ['Pending', allSubmissions.filter(s => s.status === 'Pending').length],
                      ['Returned', allSubmissions.filter(s => s.status === 'Returned').length],
                      ['Verified', allSubmissions.filter(s => s.status === 'Verified').length],
                      ['Rejected', allSubmissions.filter(s => s.status === 'Rejected').length]
                    ].map(([label, count]) => {
                      const isSelected = statusFilter === label
                      return (
                        <button
                          key={label}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setStatusFilter(label)}
                          className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border-b-2 px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16834a] focus-visible:ring-offset-1 ${isSelected
                            ? 'border-[#176B43] bg-emerald-50 text-[#145C39] dark:bg-emerald-950/40 dark:text-emerald-200'
                            : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                          }`}
                        >
                          <span>{label}</span>
                          <span className={`tabular-nums ${isSelected ? 'text-[#145C39] dark:text-emerald-200' : 'text-slate-500 dark:text-slate-400'}`}>{count}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

              </div>
            </div>



            {/* === MASTER-DETAIL REVIEW AREA === */}
            <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(18rem,0.78fr)_minmax(0,2fr)]">

              {/* Queue grows with its results and scrolls only when it gets long. */}
              <section aria-label="Submission queue" className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs xl:max-h-[min(90vh,920px)]">
                
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-slate-50 px-4 py-3">
                  <span className="text-sm font-bold text-slate-900">Submission queue</span>
                  <span className="text-xs font-semibold tabular-nums text-slate-500">
                    {finalSubmissions.length} {finalSubmissions.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
                  {finalSubmissions.length === 0 ? (
                    <div className="space-y-1 px-5 py-8 text-center">
                      <p className="text-sm font-semibold text-slate-700">No matching submissions</p>
                      <p className="text-xs text-slate-500">Adjust the search or filters to see other submissions.</p>
                    </div>
                  ) : (
                    finalSubmissions.map(item => {
                      const isActive = workspaceItem?.id === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedWorkspaceItem(item)}
                          aria-current={isActive ? 'true' : undefined}
                          className={`flex w-full items-start justify-between gap-3 border-l-2 px-4 py-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#16834a] ${
                            isActive
                              ? 'border-[#16834a] bg-[#f2f9f4]'
                              : 'border-transparent hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {/* Avatar Badge */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 mt-0.5 transition ${
                              isActive
                                ? 'bg-[#176B43] text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {(item.student_name || '?').charAt(0)}
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <p className={`text-xs leading-snug truncate ${isActive ? 'font-extrabold text-[#064e2b]' : 'font-bold text-slate-800'}`}>
                                {item.title}
                              </p>
                              <p className="text-[11px] text-slate-500 font-medium truncate">
                                {item.student_name} • <span className="font-mono text-slate-400">{item.student_id}</span>
                              </p>
                              
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                {/* Status Pill */}
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  item.status === 'Verified' ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : item.status === 'Returned' ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : item.status === 'Rejected' ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                  {item.status}
                                </span>

                                {/* Category Tag */}
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/70">
                                  {item.category}
                                </span>

                                {/* Docs Count */}
                                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                  <FileText className="w-3 h-3 text-slate-400" />
                                  {item.docs_count} doc{item.docs_count !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          {isActive && (
                            <Check aria-label="Selected submission" className="mt-1 h-4 w-4 shrink-0 text-[#16834a]" />
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </section>



              {/* RIGHT: Inspection & Verification Panel (Independently Scrollable Right Detail Panel) */}
              <div className="flex min-h-0 min-w-0 flex-col xl:h-[min(90vh,920px)]">

                {!workspaceItem ? (
                  <div className="flex min-h-[18rem] flex-col items-center justify-center space-y-3 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs xl:h-full">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-extrabold text-slate-700">No Submission Selected</p>
                    <p className="text-xs text-slate-500 font-medium">Click on a submission from the queue to begin review.</p>
                  </div>
                ) : (
                  <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs xl:h-full">

                    {/* Student Profile Header (Clean & Uncluttered - Fixed Top of Right Card) */}
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-4 shrink-0">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                          {(workspaceItem.student_name || '?').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-slate-900 leading-snug truncate">{workspaceItem.student_name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">Student ID: {workspaceItem.student_id}</p>
                          {workspaceItem.program && (
                            <p className="text-[11px] text-[#16834a] font-bold mt-0.5 truncate">{workspaceItem.program}</p>
                          )}
                        </div>
                      </div>

                      {/* Status Pill Badge */}
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-extrabold tracking-wide uppercase border shrink-0 ${
                        workspaceItem.status === 'Verified' ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : workspaceItem.status === 'Returned' ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : workspaceItem.status === 'Rejected' ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {workspaceItem.status}
                      </span>
                    </div>

                    {/* Student Detail Content Body (SCROLLS INSIDE RIGHT CARD) */}
                    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">

                      <CoordinatorSubmissionReview item={workspaceItem} loadRecordDetail={loadRecordDetail} />
                    </div>
                    {/* Decision Dock: Approve / Return / Reject (remarks required to return or reject) */}
                    <CoordinatorDecisionActions
                      item={workspaceItem}
                      onApprove={handleApproveHook}
                      onReturn={handleReturnHook}
                      onReject={handleRejectHook}
                      onDone={handleDecisionDone}
                    />

                  </div>
                )}
              </div>

            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2 text-[#16834a]">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">Recent Verification Activity</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Latest submission updates in {programScope}</p>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {recentActivity.length === 0 ? (
                  <p className="text-xs text-slate-500">No submissions from your program yet.</p>
                ) : recentActivity.map(act => {
                  const ActIcon = act.icon
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => openInWorkspace(act.id)}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-emerald-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <span className="rounded-lg border border-slate-200 bg-white p-2 text-[#16834a]">
                        <ActIcon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{act.title}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${act.badgeColor}`}>{act.label}</span>
                        </span>
                        <span className="mt-1 block text-xs text-slate-600">{act.detail}</span>
                        <span className="mt-1 block text-[10px] font-semibold text-slate-400">{act.timestamp}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            <details className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
              <summary className="cursor-pointer text-sm font-bold text-slate-800">Coordinator Guidelines</summary>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-relaxed text-slate-600">
                <li>Review pending student submissions within 24 to 48 hours.</li>
                <li>Check that proof documents are clear and support the submitted information.</li>
                <li>Confirm the achievement scope matches the supporting documents.</li>
                <li>Include clear, constructive remarks when returning or rejecting an entry.</li>
              </ul>
            </details>
          </div>
        )
      })()}

      {/* ================= TAB 3: STUDENTS ROSTER & PORTFOLIO INSPECTOR ================= */}
      {activeTab === 'students' && (
        selectedStudentDossier ? (
          (() => {
            // Filter submissions for this specific student
            const dossierStudentId = String(selectedStudentDossier.student_id ?? '').replace(/-/g, '').trim()
            const studentSubmissions = dossierStudentId
              ? allSubmissions.filter(s => String(s.student_id ?? '').replace(/-/g, '').trim() === dossierStudentId)
              : []

            const studentVerified = studentSubmissions.filter(s => s.status === 'Verified')
            const studentPending = studentSubmissions.filter(s => s.status === 'Pending')
            const studentReturned = studentSubmissions.filter(s => s.status === 'Returned')

            // Apply active tab & category filtering
            let activeList = dossierActiveTab === 'all' ? studentSubmissions
              : dossierActiveTab === 'verified' ? studentVerified
              : dossierActiveTab === 'pending' ? studentPending
              : studentReturned

            if (dossierCategoryFilter !== 'All') {
              activeList = activeList.filter(s => s.category.toLowerCase() === dossierCategoryFilter.toLowerCase())
            }

            return (
              <div className="space-y-6 animate-in fade-in duration-200 font-sans pb-12">
                
                {/* Top Navigation & Action Header */}
                <div className="w-full mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedStudentDossier(null)}
                    className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-50 transition shadow-2xs flex items-center gap-2 cursor-pointer w-fit"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#16834a]" />
                    <span>Back to Students</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 hidden md:inline">
                      Program Coordinator • Inspecting Student Portfolio
                    </span>
                  </div>
                </div>

                {/* Main Portfolio Container */}
                <div className="w-full space-y-6">

                  {/* HERO PROFILE BANNER CARD */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                    
                    {/* SVG Background Layer */}
                    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
                      <svg viewBox="0 0 1200 240" preserveAspectRatio="none" className="w-full h-full">
                        <defs>
                          <linearGradient id="coordinatorHeroGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#143d2b" />
                            <stop offset="50%" stopColor="#064e2b" />
                            <stop offset="100%" stopColor="#0d281e" />
                          </linearGradient>
                        </defs>
                        <path d="M 0,0 L 220,0 C 210,70 170,150 90,240 L 0,240 Z" fill="url(#coordinatorHeroGreenGrad)" />
                      </svg>

                      <div className="absolute top-0 left-0 w-[18%] h-full mix-blend-overlay opacity-30 pointer-events-none overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 40% 100%, 0 100%)' }}>
                        <img
                          src={campusBanner}
                          alt="NDMU Campus Backdrop"
                          width="1200"
                          height="240"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Banner Header Body */}
                    <div className="relative z-10 px-6 pt-5 sm:px-8 sm:pt-6 flex items-center justify-between">
                      <div className="rounded-lg bg-white px-2 py-1"><AchieveNestLogo variant="horizontal" size="compact" /></div>

                      <div className="text-xs font-semibold text-slate-400 tracking-wide font-serif italic hidden sm:block">
                        Character, Competence, and Culture in harmony
                      </div>
                    </div>

                    {/* White Reserved Content Area with Overlapping Avatar & Details */}
                    <div className="px-6 pb-6 pt-6 sm:px-8 sm:pb-8 relative z-20">
                      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        
                        <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                          
                          {/* Circular Profile Avatar */}
                          <div className="relative shrink-0 z-30 sm:-mb-1">
                            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden aspect-square">
                              {selectedStudentDossier.avatar_url ? (
                                <img
                                  src={selectedStudentDossier.avatar_url}
                                  alt={selectedStudentDossier.full_name}
                                  className="w-full h-full object-cover rounded-full aspect-square"
                                />
                              ) : (
                                <div className="w-full h-full bg-[#16834a] text-white font-black text-3xl flex items-center justify-center">
                                  {selectedStudentDossier.full_name.charAt(0)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Student Details & Info Chips */}
                          <div className="space-y-1.5 pt-1 sm:pt-0">
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                              {selectedStudentDossier.full_name}
                            </h2>

                            <p className="text-xs font-extrabold text-[#16834a]">{selectedStudentDossier.program || '—'}</p>
                            <p className="text-xs text-slate-600 font-semibold">{selectedStudentDossier.year_level || 'Year level not recorded'} • Notre Dame of Marbel University</p>

                            <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px]">
                              <div className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/90 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs">
                                <GraduationCap className="w-3.5 h-3.5 text-[#16834a]" />
                                <span>{selectedStudentDossier.program}</span>
                              </div>

                              <div className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/90 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs">
                                <Clock className="w-3.5 h-3.5 text-[#16834a]" />
                                <span>{selectedStudentDossier.year_level}</span>
                              </div>

                              <div className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/90 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs">
                                <CreditCard className="w-3.5 h-3.5 text-[#16834a]" />
                                <span>Student ID: {selectedStudentDossier.student_id}</span>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Far-Right Column: 4 Stat Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center min-w-[90px]">
                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Submissions</p>
                            <p className="text-2xl font-black text-slate-900">{studentSubmissions.length}</p>
                          </div>
                          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center min-w-[90px]">
                            <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Verified</p>
                            <p className="text-2xl font-black text-emerald-800">{studentVerified.length}</p>
                          </div>
                          <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-center min-w-[90px]">
                            <p className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">Pending</p>
                            <p className="text-2xl font-black text-blue-800">{studentPending.length}</p>
                          </div>
                          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-center min-w-[90px]">
                            <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Returned</p>
                            <p className="text-2xl font-black text-amber-800">{studentReturned.length}</p>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* MAIN TWO-COLUMN LAYOUT */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 space-y-6">

                      {/* Student Accomplishment Record Section */}
                      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16834a] flex items-center justify-center">
                              <Award className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-base font-extrabold text-slate-900">Student Accomplishment Record</h3>
                              <p className="text-xs text-slate-500 font-medium">Verified, pending, and returned student submissions</p>
                            </div>
                          </div>

                          {/* Category Dropdown Filter */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">Category:</span>
                            <select
                              value={dossierCategoryFilter}
                              onChange={(e) => setDossierCategoryFilter(e.target.value)}
                              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-extrabold text-slate-800 outline-none focus:border-[#16834a] cursor-pointer"
                            >
                              <option value="All">All Categories</option>
                              <option value="Academic">Academic</option>
                              <option value="Leadership">Leadership</option>
                              <option value="Community">Community</option>
                              <option value="Athletics">Athletics</option>
                              <option value="Recognition">Recognition</option>
                            </select>
                          </div>
                        </div>

                        {/* 4 Status Filter Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          <button
                            type="button"
                            onClick={() => setDossierActiveTab('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                              dossierActiveTab === 'all'
                                ? 'bg-[#176B43] text-white border-[#176B43] shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            All Submissions ({studentSubmissions.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setDossierActiveTab('verified')}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                              dossierActiveTab === 'verified'
                                ? 'bg-[#16834a] text-white border-[#16834a] shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            Verified ({studentVerified.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setDossierActiveTab('pending')}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                              dossierActiveTab === 'pending'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            Pending Review ({studentPending.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setDossierActiveTab('returned')}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                              dossierActiveTab === 'returned'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            Returned ({studentReturned.length})
                          </button>
                        </div>

                        {/* Active Submissions List Cards */}
                        <div className="space-y-4">
                          {activeList.length === 0 ? (
                            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                              <Award className="w-8 h-8 text-slate-400 mx-auto" />
                              <p className="text-xs font-bold text-slate-600">No {dossierActiveTab === 'all' ? '' : dossierActiveTab} accomplishments found</p>
                              <p className="text-[11px] text-slate-400">Try changing the status tab or category filter above.</p>
                            </div>
                          ) : (
                            activeList.map(item => (
                              <div
                                key={item.id}
                                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4 hover:border-emerald-300 transition"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <span className="text-[10px] font-extrabold text-[#16834a] uppercase tracking-wider">Achievement Entry</span>
                                    <h4 className="text-base font-extrabold text-slate-900 leading-snug">{item.title}</h4>
                                  </div>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                    item.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : item.status === 'Returned' ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}>
                                    {item.status.toUpperCase()}
                                  </span>
                                </div>

                                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Category</p>
                                    <p className="font-bold text-slate-800">{[item.category, item.subcategory_name].filter(Boolean).join(' › ')}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Activity date</p>
                                    <p className="font-bold text-slate-800">{formatDateRange(item.start_date || item.occurrence_date, item.end_date) || 'Not provided'}</p>
                                  </div>
                                </div>

                                {(item.event_name || item.issuer) && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    {item.event_name && (
                                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Event / Competition Name</p>
                                        <p className="font-extrabold text-slate-800">{item.event_name}</p>
                                      </div>
                                    )}
                                    {item.issuer && (
                                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Issuing Organization</p>
                                        <p className="font-extrabold text-slate-800">{item.issuer}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {item.description && (
                                  <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Description</p>
                                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-xs font-medium text-emerald-950">
                                      {item.description}
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-2 pt-1 border-t border-slate-100">
                                  <p className="text-xs font-extrabold text-slate-800">Attached Proof Documents</p>
                                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2.5">
                                      <FileText className="w-4 h-4 text-[#16834a]" />
                                      <span className="font-extrabold text-slate-800">{item.attached_file_name}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedReviewItem(item)}
                                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition"
                                    >
                                      View Document
                                    </button>
                                  </div>
                                </div>

                                {item.status === 'Returned' && item.return_remarks && (
                                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 space-y-1">
                                    <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Coordinator Revision Remarks</p>
                                    <p className="text-xs text-amber-950 font-medium">{item.return_remarks}</p>
                                  </div>
                                )}

                                {item.status === 'Pending' && (
                                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedReviewItem(item)}
                                      className="px-4 py-1.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
                                    >
                                      Review &amp; Decide
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                      </div>

                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="lg:col-span-1 space-y-6">

                      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16834a] flex items-center justify-center">
                            <Mail className="w-4 h-4" />
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900">Contact Information</h3>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Email</p>
                            <div className="p-3 rounded-2xl bg-[#E7F3E9]/70 border border-[#cbe6d2] font-semibold text-slate-800">
                              {selectedStudentDossier.email}
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              </div>
            )
          })()
        ) : (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Top Header Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#16834a] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 leading-tight">Students</h2>
                  <p className="text-xs text-slate-500 font-medium">{filteredStudents.length} students in your program</p>
                </div>
              </div>

              {/* Toolbar: Search + Year Dropdown + Course Dropdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                
                {/* Search Bar */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={rosterSearchQuery}
                    onChange={(e) => setRosterSearchQuery(e.target.value)}
                    placeholder="Search by name, ID, or email..."
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
                  />
                </div>

                {/* Year Level Filter Dropdown */}
                <div className="relative">
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
                  >
                    <option value="All Years">All Years</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>

                {/* Course Filter Dropdown */}
                <div className="relative">
                  <select
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
                  >
                    <option value="All Courses">All Programs</option>
                    {[...new Set(studentRoster.map(student => student.program).filter(Boolean))].map(program => <option key={program} value={program}>{program}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>

              </div>

            </div>

            {/* Simplified High-Readability Student Data Table */}
            {rosterLoading ? (
              <div role="status" className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-600 text-sm font-semibold">
                Loading students…
              </div>
            ) : rosterError ? (
              <div role="alert" className="p-8 text-center bg-white rounded-3xl border border-rose-200">
                <p className="text-sm font-bold text-rose-800">Students could not be loaded.</p>
                <p className="mt-1 text-xs text-slate-600">{rosterError}</p>
                <button type="button" onClick={reloadRoster} className="mt-4 min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
                  Try Again
                </button>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {studentRoster.length === 0 ? 'No students in your program yet' : 'No students match these filters'}
                </p>
                <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                  {studentRoster.length === 0
                    ? 'Students assigned to your program will appear here.'
                    : 'Try another name, student ID, email, year level, or program.'}
                </p>
                {studentRoster.length > 0 && (rosterSearchQuery || yearFilter !== 'All Years' || courseFilter !== 'All Courses') && (
                  <button
                    type="button"
                    onClick={() => {
                      setRosterSearchQuery('')
                      setYearFilter('All Years')
                      setCourseFilter('All Courses')
                    }}
                    className="mt-4 rounded-lg px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Program</th>
                        <th className="py-3 px-4">Year Level</th>
                        <th className="py-3 px-4 text-center">Achievements</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {filteredStudents.map(std => (
                        <tr
                          key={std.id}
                          className="group transition-colors hover:bg-slate-50 focus-within:bg-emerald-50/40"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {std.avatar_url ? <img
                                src={std.avatar_url}
                                alt=""
                                className="w-9 h-9 rounded-full border border-slate-200 object-cover shrink-0"
                              /> : <span aria-hidden="true" className="grid w-9 h-9 shrink-0 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-xs font-extrabold text-emerald-800">{std.full_name.split(/\s+/).map(part => part[0]).slice(0, 2).join('')}</span>}
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => setSelectedStudentDossier(std)}
                                  className="rounded text-left text-sm font-bold leading-tight text-slate-900 transition hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                                >
                                  {std.full_name}
                                </button>
                                <p className="mt-1 text-[11px] text-slate-500">
                                  <span className="font-mono">{std.student_id}</span>
                                  <span className="mx-1.5 text-slate-300">•</span>
                                  <span>{std.email}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <p className="font-extrabold text-slate-800 text-xs leading-tight">{std.program}</p>
                          </td>

                          <td className="py-3 px-4">
                            <p className="font-extrabold text-slate-800 text-xs leading-tight">{std.year_level}</p>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex min-w-[150px] flex-col items-center gap-1.5">
                              <span className="text-base font-bold tabular-nums text-slate-900">{std.achievements_count}</span>
                              <div className="flex flex-wrap justify-center gap-1.5">
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> {std.verified_count} verified
                                </span>
                                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                  {std.pending_count} pending
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentDossier(std)}
                              className="mx-auto inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[#176B43] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#145C39] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16834a] focus-visible:ring-offset-2 active:bg-[#104b30]"
                            >
                              <Eye className="h-4 w-4 text-white" aria-hidden="true" />
                              <span>View Portfolio</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* REVIEW & DECISION MODAL */}
      {selectedReviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-[96rem] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
            <button
              type="button"
              onClick={() => setSelectedReviewItem(null)}
              aria-label="Close review"
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 p-6 pb-4 shrink-0">
              <div className="p-3 rounded-2xl bg-[#E7F3E9] text-[#16834a] border border-[#cbe6d2]">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Review Student Submission</h3>
                <p className="text-xs text-slate-500">{programScope} verification</p>
              </div>
            </div>

            <div className="space-y-4 text-xs overflow-y-auto px-6 pb-4 min-h-0 flex-1">
              <CoordinatorSubmissionReview item={selectedReviewItem} loadRecordDetail={loadRecordDetail} />
            </div>

            <CoordinatorDecisionActions
              item={selectedReviewItem}
              onApprove={handleApproveHook}
              onReturn={handleReturnHook}
              onReject={handleRejectHook}
              onDone={handleDecisionDone}
            />
          </div>
        </div>
      )}

    </div>
  )
}
