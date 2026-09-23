import React, { useState, useMemo, useEffect, useRef } from 'react'
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
  Copy,
  MoreVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserPlus,
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  Mail,
  User
} from 'lucide-react'
import { formatLastNameFirst } from '../../utils/nameFormatter'
import { Button } from '../../components/ui/button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useConfirmableClose } from '../../hooks/useConfirmableClose'
import OSADPageHeader from '../../components/osad/OSADPageHeader'
import AddStudentAccountModal from './modals/AddStudentAccountModal'
import { STUDENT_YEAR_LEVELS, STUDENT_SEX_OPTIONS, formatStudentSexDisplay } from '../../contracts/studentAccountContract'
import { resolveStudentAccountStatus, STUDENT_ACCOUNT_STATUSES } from '../../contracts/studentStatusContract'
import { provisioningService } from '../../services/provisioningService'

const YEAR_LEVELS = ['all', ...STUDENT_YEAR_LEVELS]
const SEX_OPTIONS = ['all', ...STUDENT_SEX_OPTIONS]
const STATUS_OPTIONS = ['all', 'active', 'suspended', 'archived']
const PAGE_SIZE = 25

export default function OSADStudentAccountsPage({
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
  showToast,
  colleges = [],
  degreePrograms = []
}) {
  const [serverStudents, setServerStudents] = useState([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [studentsError, setStudentsError] = useState(null)
  const [refreshFailedAfterCreate, setRefreshFailedAfterCreate] = useState(false)
  const [lastCreatedStudent, setLastCreatedStudent] = useState(null)
  const [createdExclusionNotice, setCreatedExclusionNotice] = useState(null)
  const fetchSequenceRef = useRef(0)

  const [activeRowMenu, setActiveRowMenu] = useState(null)
  const [selectedYearLevel, setSelectedYearLevel] = useState('all')
  const [selectedSex, setSelectedSex] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedProgram, setSelectedProgram] = useState('all')
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [sortDirection, setSortDirection] = useState('asc') // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1)
  const [requestStatusFilter, setRequestStatusFilter] = useState('all') // 'all' | 'pending' | 'approved'
  const [viewingStudent, setViewingStudent] = useState(null)
  const [resetPasswordStudent, setResetPasswordStudent] = useState(null)
  const [tempPasswordInput, setTempPasswordInput] = useState('NDMU-Student2026!')
  const [copiedNotification, setCopiedNotification] = useState(false)
  const [activeAccountTab, setActiveAccountTab] = useState('directory') // 'directory' | 'requests'
  const [resetRequests, setResetRequests] = useState(() => getPasswordResetRequests ? getPasswordResetRequests() : [])
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [userSearchTerm, selectedCollege, selectedProgram, selectedYearLevel, selectedSex, selectedStatus])

  // Check if newly created student is hidden by active search/filters
  const evaluateCreatedStudentExclusion = (created) => {
    if (!created) return
    const term = (userSearchTerm || '').trim().toLowerCase()
    const matchesSearch = !term || (
      (created.full_name && created.full_name.toLowerCase().includes(term)) ||
      (created.first_name && created.first_name.toLowerCase().includes(term)) ||
      (created.last_name && created.last_name.toLowerCase().includes(term)) ||
      (created.institutional_id && created.institutional_id.includes(term)) ||
      (created.student_id && created.student_id.includes(term)) ||
      (created.email && created.email.toLowerCase().includes(term))
    )

    const matchesCollege = !selectedCollege || selectedCollege === 'all' || (
      (created.college && created.college.toUpperCase() === selectedCollege.toUpperCase()) ||
      (created.college_code && created.college_code.toUpperCase() === selectedCollege.toUpperCase())
    )

    const matchesProgram = !selectedProgram || selectedProgram === 'all' || (
      (created.program && created.program.toLowerCase().includes(selectedProgram.toLowerCase())) ||
      (created.program_name && created.program_name.toLowerCase().includes(selectedProgram.toLowerCase())) ||
      (created.program_code && created.program_code.toLowerCase().includes(selectedProgram.toLowerCase())) ||
      (created.academic_program_id && created.academic_program_id === selectedProgram)
    )

    const matchesYear = !selectedYearLevel || selectedYearLevel === 'all' || (
      created.year_level === selectedYearLevel
    )

    const matchesSex = !selectedSex || selectedSex === 'all' || (
      created.sex === selectedSex
    )

    const matchesStatus = !selectedStatus || selectedStatus === 'all' || (
      (created.status || 'active').toLowerCase() === selectedStatus.toLowerCase()
    )

    if (!matchesSearch || !matchesCollege || !matchesProgram || !matchesYear || !matchesSex || !matchesStatus) {
      setCreatedExclusionNotice({
        student: created,
        reason: !matchesSearch ? 'search' : 'filters'
      })
    } else {
      setCreatedExclusionNotice(null)
    }
  }

  // Authoritative Server List Fetch
  const fetchStudentAccounts = async (isPostCreate = false, newlyCreated = null) => {
    const seq = ++fetchSequenceRef.current
    setIsLoadingStudents(true)
    setStudentsError(null)
    if (isPostCreate) {
      setRefreshFailedAfterCreate(false)
    }

    try {
      const result = await provisioningService.fetchStudents()
      // Stale response protection
      if (seq !== fetchSequenceRef.current) return

      const list = Array.isArray(result) ? result : (result?.students || [])
      setServerStudents(list)
      setIsLoadingStudents(false)
      setRefreshFailedAfterCreate(false)

      if (isPostCreate && newlyCreated) {
        evaluateCreatedStudentExclusion(newlyCreated)
      }
    } catch (err) {
      if (seq !== fetchSequenceRef.current) return
      setIsLoadingStudents(false)
      setStudentsError(err.message || 'Failed to fetch student accounts from server.')
      if (isPostCreate) {
        setRefreshFailedAfterCreate(true)
      }
    }
  }

  // Initial Load from Authoritative Server
  useEffect(() => {
    fetchStudentAccounts()
  }, [])

  // Portfolio Inspector Escape Handler
  useEffect(() => {
    if (!viewingStudent) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setViewingStudent(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewingStudent])

  // Action Menu Click Outside & Escape Handler
  useEffect(() => {
    if (!activeRowMenu) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveRowMenu(null)
    }
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-row-menu]')) {
        setActiveRowMenu(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('click', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('click', handleClickOutside)
    }
  }, [activeRowMenu])

  const pendingRequests = useMemo(() => {
    return resetRequests.filter(r => r.status === 'pending')
  }, [resetRequests])

  // Reset Password Confirmation Close Hook
  const resetPasswordConfirmClose = useConfirmableClose({
    isOpen: Boolean(resetPasswordStudent),
    isDirty: () => tempPasswordInput !== 'NDMU-Student2026!',
    onClose: () => {
      setResetPasswordStudent(null)
      setTempPasswordInput('NDMU-Student2026!')
    }
  })

  // Filtered Programs based on selected college
  const availablePrograms = useMemo(() => {
    if (!degreePrograms || degreePrograms.length === 0) return []
    if (!selectedCollege || selectedCollege === 'all') return degreePrograms
    return degreePrograms.filter(p => {
      const pCol = p.college_code || p.college || (colleges.find(c => c.id === p.college_id)?.code)
      return pCol && pCol.toUpperCase() === selectedCollege.toUpperCase()
    })
  }, [degreePrograms, colleges, selectedCollege])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedCollege && selectedCollege !== 'all') count++
    if (selectedProgram && selectedProgram !== 'all') count++
    if (selectedYearLevel && selectedYearLevel !== 'all') count++
    if (selectedSex && selectedSex !== 'all') count++
    if (selectedStatus && selectedStatus !== 'all') count++
    return count
  }, [selectedCollege, selectedProgram, selectedYearLevel, selectedSex, selectedStatus])

  const handleClearAllFilters = () => {
    if (setSelectedCollege) setSelectedCollege('all')
    setSelectedProgram('all')
    setSelectedYearLevel('all')
    setSelectedSex('all')
    setSelectedStatus('all')
    if (setUserSearchTerm) setUserSearchTerm('')
    setCreatedExclusionNotice(null)
    setCurrentPage(1)
  }

  // Base list selection: Server-backed list is the authoritative primary source of truth.
  const rawUsersList = useMemo(() => {
    if (serverStudents.length > 0) {
      return serverStudents
    }
    if (getUsers) {
      return getUsers('student', userSearchTerm, selectedCollege, selectedSort) || []
    }
    return []
  }, [serverStudents, getUsers, userSearchTerm, selectedCollege, selectedSort])

  // Enhanced combined filtering with AND semantics
  const filteredUsersList = useMemo(() => {
    let list = rawUsersList.filter(u => {
      // Search term filter
      if (userSearchTerm && userSearchTerm.trim() !== '') {
        const term = userSearchTerm.trim().toLowerCase()
        const matchSearch = (
          (u.full_name && u.full_name.toLowerCase().includes(term)) ||
          (u.institutional_id && u.institutional_id.includes(term)) ||
          (u.student_id && u.student_id.includes(term)) ||
          (u.email && u.email.toLowerCase().includes(term)) ||
          (u.program && u.program.toLowerCase().includes(term)) ||
          (u.program_name && u.program_name.toLowerCase().includes(term)) ||
          (u.program_code && u.program_code.toLowerCase().includes(term))
        )
        if (!matchSearch) return false
      }

      // College filter
      if (selectedCollege && selectedCollege !== 'all') {
        const uCol = (u.college || u.college_code || '').toUpperCase()
        if (uCol !== selectedCollege.toUpperCase()) return false
      }

      // Program filter
      if (selectedProgram !== 'all') {
        const progMatch = (u.program && u.program.toLowerCase().includes(selectedProgram.toLowerCase())) ||
          (u.program_name && u.program_name.toLowerCase().includes(selectedProgram.toLowerCase())) ||
          (u.program_code && u.program_code.toLowerCase().includes(selectedProgram.toLowerCase())) ||
          (u.academic_program_id && u.academic_program_id === selectedProgram)
        if (!progMatch) return false
      }

      // Year level filter
      if (selectedYearLevel !== 'all') {
        if (u.year_level !== selectedYearLevel) return false
      }

      // Sex filter
      if (selectedSex !== 'all') {
        if (u.sex !== selectedSex) return false
      }

      // Status filter
      if (selectedStatus !== 'all') {
        const uStatus = (u.status || 'active').toLowerCase()
        if (uStatus !== selectedStatus.toLowerCase()) return false
      }
      return true
    })

    // Sorting
    list = [...list].sort((a, b) => {
      if (selectedSort === 'id') {
        const idA = String(a.student_id || a.institutional_id || '')
        const idB = String(b.student_id || b.institutional_id || '')
        return idA.localeCompare(idB)
      }
      // Default: sort by Name
      const nameA = String(a.last_name || a.full_name || '')
      const nameB = String(b.last_name || b.full_name || '')
      return nameA.localeCompare(nameB)
    })

    if (sortDirection === 'desc') {
      list = [...list].reverse()
    }
    return list
  }, [rawUsersList, userSearchTerm, selectedCollege, selectedProgram, selectedYearLevel, selectedSex, selectedStatus, selectedSort, sortDirection])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredUsersList.length / PAGE_SIZE))
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  const paginatedUsersList = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredUsersList.slice(start, start + PAGE_SIZE)
  }, [filteredUsersList, currentPage])

  const handleSortColumnClick = (colKey) => {
    if (selectedSort === colKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      if (setSelectedSort) setSelectedSort(colKey)
      setSortDirection('asc')
    }
  }

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
    setTempPasswordInput('NDMU-Student2026!')
    // Refetch server state
    fetchStudentAccounts()
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

  const filteredRequests = resetRequests.filter(req => {
    const term = (userSearchTerm || '').toLowerCase().trim()
    const matchTerm = !term || (
      (req.student_name && req.student_name.toLowerCase().includes(term)) ||
      (req.user_email && req.user_email.toLowerCase().includes(term)) ||
      (req.student_id && req.student_id.toLowerCase().includes(term)) ||
      (req.remarks && req.remarks.toLowerCase().includes(term))
    )
    const matchStatus = requestStatusFilter === 'all' || req.status === requestStatusFilter
    return matchTerm && matchStatus
  })

  // Determine empty state classification
  const isTrueEmpty = rawUsersList.length === 0 && !isLoadingStudents && !studentsError && activeFilterCount === 0 && (!userSearchTerm || userSearchTerm.trim() === '')
  const isSearchEmpty = Boolean(userSearchTerm && userSearchTerm.trim() !== '' && filteredUsersList.length === 0 && activeFilterCount === 0)
  const isFilteredEmpty = Boolean(filteredUsersList.length === 0 && (activeFilterCount > 0 || (userSearchTerm && userSearchTerm.trim() !== '')) && !isTrueEmpty)

  return (
    <div className="space-y-5 font-sans">
      {/* Standardized Page Header */}
      <OSADPageHeader
        title="Student Accounts Directory"
        description="Manage student accounts, academic program placements, sex attributes, and credential requests."
        icon={Users}
        primaryAction={
          <button
            type="button"
            onClick={() => setIsAddStudentOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#1B4D3E] hover:bg-[#143B30] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student Account</span>
          </button>
        }
      />

      {/* Post-Commit Refresh Failure Notice */}
      {refreshFailedAfterCreate && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Notice:</strong> Student account was created successfully, but the Student Accounts list could not refresh.
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fetchStudentAccounts(true, lastCreatedStudent)}
            className="border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-bold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            <span>Retry List</span>
          </Button>
        </div>
      )}

      {/* Active Filter Exclusion Notice */}
      {createdExclusionNotice && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Account for <strong>[{createdExclusionNotice.student.institutional_id}] {createdExclusionNotice.student.full_name || `${createdExclusionNotice.student.first_name} ${createdExclusionNotice.student.last_name}`}</strong> was created successfully, but is currently hidden by active {createdExclusionNotice.reason}.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setViewingStudent(createdExclusionNotice.student)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 hover:bg-blue-50 text-blue-800 dark:text-blue-200 font-bold text-[11px] transition cursor-pointer"
            >
              View Created Student
            </button>
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition cursor-pointer"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={() => setCreatedExclusionNotice(null)}
              className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Toolbar: Sub-Tabs + Search & Filter */}
      <div className="bg-white dark:bg-[#131E2E] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Sub-Tab Navigation */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveAccountTab('directory')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeAccountTab === 'directory'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Student Directory ({filteredUsersList.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveAccountTab('requests')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeAccountTab === 'requests'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Password Reset Requests</span>
              {pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder={
                  activeAccountTab === 'directory'
                    ? 'Search by name, student ID, email, program...'
                    : 'Search reset requests by name, ID, email...'
                }
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#16834a]"
              />
              {userSearchTerm && (
                <button
                  type="button"
                  onClick={() => setUserSearchTerm('')}
                  aria-label="Clear search"
                  className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2.5 top-2.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {activeAccountTab === 'directory' && (
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  isFilterPanelOpen || activeFilterCount > 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-[#16834a] text-[#16834a] dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#16834a] text-white text-[10px] font-extrabold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Expandable Advanced Filters Panel */}
        {activeAccountTab === 'directory' && (isFilterPanelOpen || activeFilterCount > 0) && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
            {/* College Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">College:</span>
              <select
                value={selectedCollege}
                onChange={(e) => {
                  if (setSelectedCollege) setSelectedCollege(e.target.value)
                  setSelectedProgram('all')
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-[#16834a] cursor-pointer"
              >
                <option value="all">All Colleges</option>
                {['CEAC', 'CBA', 'CAS', 'CED'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Academic Program Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Program:</span>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-[#16834a] cursor-pointer max-w-xs"
              >
                <option value="all">All Programs</option>
                {availablePrograms.map(p => (
                  <option key={p.id} value={p.name}>[{p.code}] {p.name}</option>
                ))}
              </select>
            </div>

            {/* Year Level Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Year Level:</span>
              <select
                value={selectedYearLevel}
                onChange={(e) => setSelectedYearLevel(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-[#16834a] cursor-pointer"
              >
                {YEAR_LEVELS.map(yl => (
                  <option key={yl} value={yl}>{yl === 'all' ? 'All Year Levels' : yl}</option>
                ))}
              </select>
            </div>

            {/* Sex Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Sex:</span>
              <select
                value={selectedSex}
                onChange={(e) => setSelectedSex(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-[#16834a] cursor-pointer"
              >
                {SEX_OPTIONS.map(s => (
                  <option key={s} value={s}>{s === 'all' ? 'All Sexes' : s}</option>
                ))}
              </select>
            </div>

            {/* Account Status Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-[#16834a] cursor-pointer"
              >
                {STATUS_OPTIONS.map(st => (
                  <option key={st} value={st}>{st === 'all' ? 'All Statuses' : st.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Clear All Button */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition ml-auto"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        )}

        {/* Active Filter Chips / Badges Bar */}
        {activeAccountTab === 'directory' && (activeFilterCount > 0 || (userSearchTerm && userSearchTerm.trim() !== '')) && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-400">Active Filters:</span>
            {userSearchTerm && userSearchTerm.trim() !== '' && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[#16834a] dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                Search: "{userSearchTerm}"
                <button type="button" onClick={() => setUserSearchTerm('')} className="hover:text-emerald-800 cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedCollege && selectedCollege !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[#16834a] dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                College: {selectedCollege}
                <button type="button" onClick={() => setSelectedCollege && setSelectedCollege('all')} className="hover:text-emerald-800 cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedProgram && selectedProgram !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[#16834a] dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                Program: {selectedProgram}
                <button type="button" onClick={() => setSelectedProgram('all')} className="hover:text-emerald-800 cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedYearLevel && selectedYearLevel !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[#16834a] dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                Year: {selectedYearLevel}
                <button type="button" onClick={() => setSelectedYearLevel('all')} className="hover:text-emerald-800 cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedSex && selectedSex !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[#16834a] dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                Sex: {selectedSex}
                <button type="button" onClick={() => setSelectedSex('all')} className="hover:text-emerald-800 cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedStatus && selectedStatus !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[#16834a] dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                Status: {selectedStatus.toUpperCase()}
                <button type="button" onClick={() => setSelectedStatus('all')} className="hover:text-emerald-800 cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer ml-1"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Directory View — Frozen 4-Column Responsive Table */}
      {activeAccountTab === 'directory' && (
        <div className="rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
          {/* Error Banner with Retry */}
          {studentsError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200">
              <span>{studentsError}</span>
              <button
                type="button"
                onClick={() => fetchStudentAccounts()}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer transition"
              >
                Retry
              </button>
            </div>
          )}

          {/* Desktop & Laptop 4-Column Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold select-none">
                  {/* Column 1: Student */}
                  <th className="p-4 w-72">
                    <button
                      type="button"
                      onClick={() => handleSortColumnClick('name')}
                      className="flex items-center gap-1.5 hover:text-[#16834a] transition cursor-pointer group"
                      title="Click to sort by Name"
                    >
                      <span>Student</span>
                      {selectedSort === 'name' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#16834a]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#16834a]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100" />
                      )}
                    </button>
                  </th>

                  {/* Column 2: Academic Placement */}
                  <th className="p-4">
                    <span>Academic Placement</span>
                  </th>

                  {/* Column 3: Account Status */}
                  <th className="p-4 w-44">
                    <span>Account Status</span>
                  </th>

                  {/* Column 4: Actions */}
                  <th className="p-4 pr-6 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                {isLoadingStudents && filteredUsersList.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-slate-400 space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 text-[#16834a] animate-spin" />
                        <span className="font-semibold text-slate-600 dark:text-slate-300 text-sm">
                          Loading student accounts...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : isTrueEmpty ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-slate-400 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                          No student accounts have been created yet.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Get started by provisioning the first student account.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddStudentOpen(true)}
                        className="px-4 py-2 rounded-xl bg-[#1B4D3E] hover:bg-[#143B30] text-white font-bold text-xs shadow-xs transition cursor-pointer"
                      >
                        Add Student Account
                      </button>
                    </td>
                  </tr>
                ) : isSearchEmpty ? (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-slate-400 space-y-2">
                      <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">
                        No student accounts found matching "{userSearchTerm}".
                      </p>
                      <button
                        type="button"
                        onClick={() => setUserSearchTerm('')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#16834a] dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 transition cursor-pointer"
                      >
                        Clear Search
                      </button>
                    </td>
                  </tr>
                ) : isFilteredEmpty ? (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-slate-400 space-y-2">
                      <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">
                        No student accounts match your active search and filter criteria.
                      </p>
                      <button
                        type="button"
                        onClick={handleClearAllFilters}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#16834a] dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 transition cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedUsersList.map((user) => {
                    const statusObj = resolveStudentAccountStatus(user.status, user.must_change_password)
                    const collegeColor = user.college_color || '#16834A'
                    const collegeCode = user.college || user.college_code || 'CEAC'

                    return (
                      <tr
                        key={user.id || user.student_id || user.institutional_id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                      >
                        {/* Column 1: Student (Name + ID) */}
                        <td className="p-4">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {formatLastNameFirst(user.full_name)}
                          </p>
                          <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {user.student_id || user.institutional_id || '—'}
                          </p>
                        </td>

                        {/* Column 2: Academic Placement (Program + Year & College Badge) */}
                        <td className="p-4">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {user.program || user.program_name || 'No active enrollment'}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {user.year_level || '1st Year'}
                            </span>
                            <span>•</span>
                            <span
                              style={{ backgroundColor: collegeColor }}
                              className="px-2 py-0.5 rounded-md text-white text-[10px] font-extrabold shadow-2xs"
                            >
                              {collegeCode}
                            </span>
                          </div>
                        </td>

                        {/* Column 3: Account Status */}
                        <td className="p-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] ${statusObj.badgeClass}`}>
                            {statusObj.label}
                          </span>
                        </td>

                        {/* Column 4: Actions */}
                        <td className="p-4 pr-6 text-right" data-row-menu>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setViewingStudent(user)
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-[#16834a] dark:text-emerald-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>

                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                aria-label={`More actions for ${user.full_name}`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveRowMenu(activeRowMenu === (user.id || user.student_id || user.institutional_id) ? null : (user.id || user.student_id || user.institutional_id))}
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {activeRowMenu === (user.id || user.student_id || user.institutional_id) && (
                                <div className="absolute right-0 mt-1 w-48 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 shadow-xl z-30 p-1.5 animate-in fade-in zoom-in-95 duration-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setViewingStudent(user)
                                      setActiveRowMenu(null)
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-[#16834a] flex items-center gap-2 transition cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4 text-[#16834a]" />
                                    <span>View Portfolio</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setResetPasswordStudent(user)
                                      const randomNum = Math.floor(1000 + Math.random() * 9000)
                                      setTempPasswordInput(`NDMU-Std${randomNum}!`)
                                      setActiveRowMenu(null)
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/60 hover:text-amber-700 flex items-center gap-2 transition cursor-pointer"
                                  >
                                    <KeyRound className="w-4 h-4 text-amber-600" />
                                    <span>Reset Password</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stack View */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {isLoadingStudents && filteredUsersList.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <RefreshCw className="w-5 h-5 text-[#16834a] animate-spin mx-auto mb-2" />
                <p className="font-semibold text-xs text-slate-600 dark:text-slate-300">Loading student accounts...</p>
              </div>
            ) : isTrueEmpty ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">
                  No student accounts have been created yet.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#1B4D3E] text-white font-bold text-xs"
                >
                  Add Student Account
                </button>
              </div>
            ) : isFilteredEmpty || isSearchEmpty ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">
                  No student accounts match your filter criteria.
                </p>
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#16834a] font-bold text-xs"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              paginatedUsersList.map((user) => {
                const statusObj = resolveStudentAccountStatus(user.status, user.must_change_password)
                const collegeColor = user.college_color || '#16834A'
                const collegeCode = user.college || user.college_code || 'CEAC'

                return (
                  <div key={user.id || user.student_id || user.institutional_id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {formatLastNameFirst(user.full_name)}
                        </h4>
                        <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {user.student_id || user.institutional_id || '—'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          style={{ backgroundColor: collegeColor }}
                          className="px-2 py-0.5 rounded-md text-white text-[10px] font-extrabold"
                        >
                          {collegeCode}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusObj.badgeClass}`}>
                          {statusObj.label}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Program</span>
                        <span>{user.program || user.program_name || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Year Level &amp; Sex</span>
                        <span>{user.year_level || '—'} • {formatStudentSexDisplay(user.sex, '—')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setViewingStudent(user)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-[#16834a] dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResetPasswordStudent(user)
                          const randomNum = Math.floor(1000 + Math.random() * 9000)
                          setTempPasswordInput(`NDMU-Std${randomNum}!`)
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Reset PWD</span>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Table Footer with Pagination & Result Count */}
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="font-semibold">
              Showing <span className="font-bold text-slate-900 dark:text-white">{filteredUsersList.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}</span> to{' '}
              <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * PAGE_SIZE, filteredUsersList.length)}</span> of{' '}
              <span className="font-bold text-slate-900 dark:text-white">{filteredUsersList.length}</span> matching students
              {rawUsersList.length > filteredUsersList.length && (
                <span className="text-slate-400 ml-1">({rawUsersList.length} total)</span>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 font-bold cursor-pointer transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <span className="px-2 font-bold text-slate-800 dark:text-slate-200">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 font-bold cursor-pointer transition"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Reset Requests Inbox View */}
      {activeAccountTab === 'requests' && (
        <div className="rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs space-y-4 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Password Reset Requests Inbox</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review and process student password reset requests.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium">Filter:</span>
              <select
                value={requestStatusFilter}
                onChange={(e) => setRequestStatusFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-white cursor-pointer"
              >
                <option value="all">All Requests</option>
                <option value="pending">Pending Only</option>
                <option value="approved">Approved Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No password reset requests found matching your filter criteria.
              </div>
            ) : (
              filteredRequests.map(req => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {req.student_name}
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        [{req.student_id}]
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        req.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {req.user_email} • Requested: {req.created_at || 'Recently'}
                    </p>
                    {req.remarks && (
                      <p className="text-[11px] text-slate-500 italic">
                        "{req.remarks}"
                      </p>
                    )}
                  </div>

                  {req.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (approvePasswordResetRequest) approvePasswordResetRequest(req.id)
                        if (showToast) showToast(`Approved reset request for ${req.student_name}`)
                        setResetRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r))
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
                    >
                      Approve &amp; Send PWD
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Comprehensive Student Details & Portfolio Inspector Modal */}
      {viewingStudent && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingStudent(null)
          }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-[#131e2e] rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 font-sans max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-[#EFF7F0] dark:bg-[#162720] border-b border-[#69A97C]/50 dark:border-emerald-800/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: viewingStudent.college_color || '#176B43' }}
                  className="w-11 h-11 rounded-xl text-white flex items-center justify-center font-extrabold text-base shadow-sm"
                >
                  {viewingStudent.full_name?.charAt(0) || 'S'}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#17663B] dark:text-white">
                    {formatLastNameFirst(viewingStudent.full_name)}
                  </h3>
                  <p className="text-xs text-[#245F42] dark:text-emerald-400 font-medium">
                    ID: {viewingStudent.student_id || viewingStudent.institutional_id} • {viewingStudent.college || viewingStudent.college_code || 'CEAC'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close details modal"
                onClick={() => setViewingStudent(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Institutional & Demographic Details Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                  <User className="w-4 h-4 text-[#16834a]" />
                  <span>Student Information &amp; Enrollment</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Institutional Email</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{viewingStudent.email || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Academic Program</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{viewingStudent.program || viewingStudent.program_name || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Year Level &amp; Sex</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{viewingStudent.year_level || '—'} • {formatStudentSexDisplay(viewingStudent.sex, '—')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Enrollment Status</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[#17663B] dark:text-emerald-300 font-bold inline-block mt-0.5">
                      {viewingStudent.enrollment_status ? viewingStudent.enrollment_status.charAt(0).toUpperCase() + viewingStudent.enrollment_status.slice(1) : 'Enrolled'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Account Lifecycle</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold inline-block mt-0.5">
                      {(viewingStudent.status || 'ACTIVE').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Password State</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold inline-block mt-0.5 ${
                      viewingStudent.must_change_password
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {viewingStudent.must_change_password ? 'Pending First Login' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Portfolio Accomplishments Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white">Verified Portfolio Accomplishments</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] font-extrabold">
                    {studentPortfolioItems.length} Records
                  </span>
                </div>

                <div className="space-y-2.5">
                  {studentPortfolioItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{item.title}</span>
                        <span className="font-extrabold text-[#16834a] text-xs">+{item.points} pts</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>{item.date}</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-medium">{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetPasswordStudent && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) resetPasswordConfirmClose.requestClose()
          }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-[#131e2e] rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 font-sans">
            <div className="p-6 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-extrabold text-sm">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-amber-900 dark:text-amber-200">
                    Reset Password
                  </h3>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    {resetPasswordStudent.full_name} [{resetPasswordStudent.student_id || resetPasswordStudent.institutional_id}]
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close reset password modal"
                onClick={resetPasswordConfirmClose.requestClose}
                className="w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 flex items-center justify-center text-amber-900 dark:text-amber-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmResetPassword} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Generated Temporary Password
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempPasswordInput}
                    onChange={(e) => setTempPasswordInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    title="Generate new temporary password"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    title="Copy temporary password"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copiedNotification && (
                  <p className="text-[10px] text-emerald-600 font-bold">Password copied to clipboard!</p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <p>• The student will be required to change this temporary password upon next login.</p>
                <p>• Password reset event will be logged in the system audit trail.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetPasswordConfirmClose.requestClose}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 font-bold">
                  Confirm Reset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discard Confirmation Dialog */}
      <ConfirmDialog
        open={resetPasswordConfirmClose.isConfirmOpen}
        title="Discard Password Reset?"
        message="Are you sure you want to close? The generated temporary password will be discarded."
        confirmLabel="Discard Changes"
        cancelLabel="Continue Editing"
        onConfirm={resetPasswordConfirmClose.confirmDiscard}
        onCancel={resetPasswordConfirmClose.cancelDiscard}
      />

      {/* Add Student Account Modal */}
      <AddStudentAccountModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        colleges={colleges}
        degreePrograms={degreePrograms}
        onSubmit={async (payload) => {
          const res = await provisioningService.provisionManualStudent(payload)
          setLastCreatedStudent(res?.data || payload)
          if (showToast) {
            showToast(`Successfully provisioned student account [${payload.institutional_id}] ${payload.first_name} ${payload.last_name}`)
          }
          // Trigger authoritative server refetch
          await fetchStudentAccounts(true, res?.data || payload)
          return res
        }}
      />
    </div>
  )
}
