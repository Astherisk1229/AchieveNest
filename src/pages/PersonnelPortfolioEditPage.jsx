import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import PersonnelPortfolioCanvaView from '../components/personnel/PersonnelPortfolioCanvaView'
import EditBasicInfoModal from '../components/personnel/EditBasicInfoModal'
import RankingCriteriaModel from '../models/RankingCriteriaModel.js'
import { usePersonnelPortfolio } from '../hooks/usePersonnelPortfolio'
import { getCurrentUser } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import campusBanner from '../assets/ndmu_campus_banner.png'
import { 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  Paperclip, 
  ShieldCheck, 
  Eye, 
  AlertCircle,
  GraduationCap,
  BookOpen,
  Heart,
  Upload,
  Clock,
  CreditCard,
  AlertTriangle,
  Filter,
  Search
} from 'lucide-react'

export default function PersonnelPortfolioEditPage({ currentUser: propUser }) {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const activeUser = propUser || authUser || getCurrentUser() || {
    full_name: 'Dr. Maria Santos',
    employee_id: 'EMP-2021-0842',
    department: 'College of Information Technology',
    active_role_context: 'personnel'
  }

  const {
    portfolio,
    totals,
    error,
    addItem,
    removeItem,
    updateItem,
    submitToDepSec,
    autoPopulateFromVault
  } = usePersonnelPortfolio(activeUser.employee_id || 'EMP-2021-0842')

  // Active Workspace Tab ('A' | 'B' | 'C' | 'INFO')
  const [activeArea, setActiveArea] = useState('A')

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [scopeFilter, setScopeFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals State
  const [isCanvaViewOpen, setIsCanvaViewOpen] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  // Feedback Toast & Error State
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [submitError, setSubmitError] = useState('')

  // Form Fields State
  const [itemCategory, setItemCategory] = useState('')
  const [itemSubCategory, setItemSubCategory] = useState('')
  const [itemTitle, setItemTitle] = useState('')
  const [itemScope, setItemScope] = useState('Local')
  const [itemPoints, setItemPoints] = useState('5')
  const [itemProofName, setItemProofName] = useState('')
  const [modalFormError, setModalFormError] = useState('')

  const isEditable = portfolio?.status === 'DRAFT' || portfolio?.status === 'RETURNED_TO_PERSONNEL'

  const showToast = (msg) => {
    setFeedbackMessage(msg)
    setTimeout(() => setFeedbackMessage(''), 3500)
  }

  // Open Add Item Modal for targeted area
  const handleOpenAddModal = (areaKey = activeArea) => {
    const targetArea = ['A', 'B', 'C'].includes(areaKey) ? areaKey : 'A'
    const hierarchy = RankingCriteriaModel.CATEGORIES_HIERARCHY[targetArea]
    const mainCats = hierarchy ? Object.keys(hierarchy.categories) : []
    const firstCat = mainCats[0] || ''
    const firstSub = hierarchy?.categories[firstCat]?.subCategories[0] || { name: '', defaultPoints: 5 }

    setEditingItem(null)
    setItemCategory(firstCat)
    setItemSubCategory(firstSub.name)
    setItemTitle('')
    setItemScope('Local')
    setItemPoints(String(firstSub.defaultPoints))
    setItemProofName('')
    setModalFormError('')
    setIsAddModalOpen(true)
  }

  // Open Edit Item Modal
  const handleOpenEditModal = (item) => {
    setEditingItem(item)
    setItemCategory(item.category || '')
    setItemSubCategory('')
    setItemTitle(item.title || '')
    setItemScope(item.scope_level || 'Local')
    setItemPoints(String(item.claimed_points || 5))
    setItemProofName(item.proof_file_name || '')
    setModalFormError('')
    setIsAddModalOpen(true)
  }

  const handleMainCategoryChange = (catName) => {
    setItemCategory(catName)
    const targetArea = ['A', 'B', 'C'].includes(activeArea) ? activeArea : 'A'
    const hierarchy = RankingCriteriaModel.CATEGORIES_HIERARCHY[targetArea]
    const firstSub = hierarchy?.categories[catName]?.subCategories[0] || { name: '', defaultPoints: 5 }
    setItemSubCategory(firstSub.name)
    setItemPoints(String(firstSub.defaultPoints))
  }

  const handleSaveItemSubmit = (e) => {
    e.preventDefault()
    if (!itemTitle.trim()) {
      setModalFormError('Please enter an accomplishment title.')
      return
    }

    const targetArea = ['A', 'B', 'C'].includes(activeArea) ? activeArea : 'A'
    const fullCategoryLabel = itemSubCategory ? `${itemCategory} • ${itemSubCategory}` : itemCategory

    if (editingItem) {
      const ok = updateItem(targetArea, editingItem.id, {
        category: fullCategoryLabel,
        title: itemTitle.trim(),
        scope_level: itemScope,
        claimed_points: Number(itemPoints) || 0,
        proof_file_name: itemProofName.trim()
      })
      if (ok) {
        showToast(`Updated "${itemTitle.trim()}" successfully!`)
        setIsAddModalOpen(false)
      }
    } else {
      const ok = addItem(targetArea, {
        category: fullCategoryLabel,
        title: itemTitle.trim(),
        scope_level: itemScope,
        claimed_points: Number(itemPoints) || 0,
        proof_file_name: itemProofName.trim()
      })
      if (ok) {
        showToast(`Added "${itemTitle.trim()}" to Area ${targetArea}!`)
        setIsAddModalOpen(false)
      }
    }
  }

  const handleRemoveLineItem = (itemId, itemTitleStr) => {
    if (window.confirm(`Are you sure you want to remove "${itemTitleStr}" from your portfolio draft?`)) {
      const targetArea = ['A', 'B', 'C'].includes(activeArea) ? activeArea : 'A'
      const ok = removeItem(targetArea, itemId)
      if (ok) {
        showToast(`Removed "${itemTitleStr}".`)
      }
    }
  }

  const handleAutoPopulate = () => {
    const res = autoPopulateFromVault()
    if (res.success) {
      showToast('Vault Sync: Accomplishments imported from repository into portfolio draft!')
    }
  }

  // Pre-submission validation: Check for missing proof attachments across all areas
  const handleSubmitPortfolio = () => {
    setSubmitError('')
    
    const allItems = [
      ...(portfolio?.area_a_items || []),
      ...(portfolio?.area_b_items || []),
      ...(portfolio?.area_c_items || [])
    ]

    const missingProofItems = allItems.filter(i => !i.proof_file_name || !i.proof_file_name.trim())

    if (missingProofItems.length > 0) {
      setSubmitError(`Validation Error: ${missingProofItems.length} accomplishment record(s) are missing documentary proof attachments. Please upload proof before submitting to DepSec.`)
      return
    }

    const res = submitToDepSec()
    if (res.success) {
      showToast('Portfolio draft endorsed to Department Secretary for verification!')
    } else {
      setSubmitError(res.message || 'Submission failed.')
    }
  }

  // Active Area Items Array
  const getActiveAreaItems = () => {
    if (!portfolio) return []
    if (activeArea === 'A') return portfolio.area_a_items || []
    if (activeArea === 'B') return portfolio.area_b_items || []
    if (activeArea === 'C') return portfolio.area_c_items || []
    return []
  }

  const rawAreaItems = getActiveAreaItems()

  // Filtered Area Items
  const currentAreaItems = rawAreaItems.filter(item => {
    const matchesCat = categoryFilter === 'ALL' || item.category?.toLowerCase().includes(categoryFilter.toLowerCase())
    const matchesScope = scopeFilter === 'ALL' || item.scope_level === scopeFilter
    const matchesSearch = !searchQuery || item.title?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesScope && matchesSearch
  })

  // Calculated Area Point Caps & Percentages
  const areaAPts = totals?.areaA?.accepted || totals?.areaA?.claimed || 0
  const areaBPts = totals?.areaB?.accepted || totals?.areaB?.claimed || 0
  const areaCPts = totals?.areaC?.accepted || totals?.areaC?.claimed || 0

  const areaAPct = Math.min(100, (areaAPts / 70) * 100)
  const areaBPct = Math.min(100, (areaBPts / 50) * 100)
  const areaCPct = Math.min(100, (areaCPts / 40) * 100)

  const isAMaxed = areaAPts >= 70
  const isBMaxed = areaBPts >= 50
  const isCMaxed = areaCPts >= 40

  // Categories for active dropdown
  const currentHierarchy = ['A', 'B', 'C'].includes(activeArea) ? RankingCriteriaModel.CATEGORIES_HIERARCHY[activeArea] : null
  const availableCategories = currentHierarchy ? Object.keys(currentHierarchy.categories) : []

  return (
    <MainLayout title="Edit Portfolio Workspace">
      <div className="max-w-7xl mx-auto space-y-6 font-sans">

        {/* Feedback Alert Toast */}
        {feedbackMessage && (
          <div className="p-4 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-between shadow-xl animate-fade-in z-50">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {feedbackMessage}
            </span>
            <button type="button" onClick={() => setFeedbackMessage('')} className="text-white/80 hover:text-white font-bold">✕</button>
          </div>
        )}

        {submitError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 font-bold text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* ================= 1. PAGE TOP SCOREBOARD & NDMU CEILINGS LEDGER ================= */}
        <div className="bg-[#1b4332] text-white p-4 sm:p-5 rounded-3xl shadow-xl border border-emerald-800/90 space-y-4">
          
          {/* Top Bar Actions & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/80 pb-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Audit Workbench
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                portfolio?.status === 'HR_APPROVED' ? 'bg-emerald-500 text-slate-950' :
                portfolio?.status === 'SUBMITTED_TO_DEP_SEC' ? 'bg-amber-400 text-slate-950' :
                portfolio?.status === 'ENDORSED_TO_HR' ? 'bg-blue-400 text-slate-950' : 'bg-slate-700 text-white'
              }`}>
                STATUS: {portfolio?.status || 'DRAFT'}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-200 hidden md:inline">
                Capped Total: {totals?.grandCappedTotal || 0} / 160 PTS
              </span>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCanvaViewOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs border border-white/20 flex items-center gap-1.5 transition cursor-pointer backdrop-blur-xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                <span>Preview Booklet</span>
              </button>

              {isEditable && (
                <button
                  type="button"
                  onClick={handleSubmitPortfolio}
                  className="px-4 py-1.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Submit to DepSec</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 Point Ceilings Ledger Cards with Live Progress Bars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Area A Ceiling */}
            <div className="p-3 rounded-2xl bg-white/10 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-emerald-200">
                <span>Area A: Dev</span>
                <span className={isAMaxed ? "text-amber-300 font-extrabold" : "text-emerald-300"}>
                  {isAMaxed ? 'MAX CAP (70)' : '70 Max'}
                </span>
              </div>
              <div className="text-lg font-black">{areaAPts} <span className="text-xs font-normal text-white/70">/ 70 pts</span></div>
              <div className="w-full h-1.5 rounded-full bg-black/30 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${isAMaxed ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${areaAPct}%` }} />
              </div>
            </div>

            {/* Area B Ceiling */}
            <div className="p-3 rounded-2xl bg-white/10 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-emerald-200">
                <span>Area B: Research</span>
                <span className={isBMaxed ? "text-amber-300 font-extrabold" : "text-emerald-300"}>
                  {isBMaxed ? 'MAX CAP (50)' : '50 Max'}
                </span>
              </div>
              <div className="text-lg font-black">{areaBPts} <span className="text-xs font-normal text-white/70">/ 50 pts</span></div>
              <div className="w-full h-1.5 rounded-full bg-black/30 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${isBMaxed ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${areaBPct}%` }} />
              </div>
            </div>

            {/* Area C Ceiling */}
            <div className="p-3 rounded-2xl bg-white/10 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-emerald-200">
                <span>Area C: Service</span>
                <span className={isCMaxed ? "text-amber-300 font-extrabold" : "text-emerald-300"}>
                  {isCMaxed ? 'MAX CAP (40)' : '40 Max'}
                </span>
              </div>
              <div className="text-lg font-black">{areaCPts} <span className="text-xs font-normal text-white/70">/ 40 pts</span></div>
              <div className="w-full h-1.5 rounded-full bg-black/30 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${isCMaxed ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${areaCPct}%` }} />
              </div>
            </div>

            {/* Grand Capped Total */}
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/30 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-amber-200">
                <span>Grand Capped Total</span>
                <span>160 Max</span>
              </div>
              <div className="text-lg font-black text-amber-300">{totals?.grandCappedTotal || 0} <span className="text-xs font-normal text-amber-200/80">/ 160 pts</span></div>
              <div className="w-full h-1.5 rounded-full bg-black/30 overflow-hidden">
                <div className="h-full bg-amber-300 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, ((totals?.grandCappedTotal || 0) / 160) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* ================= 2. FACULTY COMPACT MINI BANNER ================= */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <img
              src={activeUser.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"}
              alt={activeUser.full_name}
              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
            />
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                {activeUser.full_name} <span className="text-xs font-normal text-slate-500">• {activeUser.academic_rank || 'Associate Professor'}</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {activeUser.department || 'College of Information Technology'} • ID: {activeUser.employee_id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditProfileOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#2d8a4e]" />
            <span>Edit Bio & Info</span>
          </button>
        </div>

        {/* ================= 3. WORKSPACE CATEGORY TABS ================= */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-3 scrollbar-none">
          <button
            type="button"
            onClick={() => { setActiveArea('A'); setCategoryFilter('ALL'); setScopeFilter('ALL'); }}
            className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeArea === 'A'
                ? 'bg-[#1b4332] text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-amber-300" />
            <span>Area A: Prof. Development</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeArea === 'A' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
              {areaAPts} / 70 pts
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveArea('B'); setCategoryFilter('ALL'); setScopeFilter('ALL'); }}
            className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeArea === 'B'
                ? 'bg-[#1b4332] text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span>Area B: Productivity</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              isBMaxed ? 'bg-amber-400 text-slate-950' : activeArea === 'B' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {areaBPts} / 50 pts {isBMaxed ? '• MAX' : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveArea('C'); setCategoryFilter('ALL'); setScopeFilter('ALL'); }}
            className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeArea === 'C'
                ? 'bg-[#1b4332] text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Heart className="w-4 h-4 text-amber-300" />
            <span>Area C: Service & Leadership</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeArea === 'C' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
              {areaCPts} / 40 pts
            </span>
          </button>
        </div>

        {/* ================= 4. ACTIVE TAB CONTENT WORKBENCH ================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-5">
          
          {/* Section Toolbar & Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {activeArea === 'A' && 'Area A: Professional Development'}
                  {activeArea === 'B' && 'Area B: Productivity & Creative Work'}
                  {activeArea === 'C' && 'Area C: Service & Leadership'}
                </h3>
                {((activeArea === 'A' && isAMaxed) || (activeArea === 'B' && isBMaxed) || (activeArea === 'C' && isCMaxed)) && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 uppercase">
                    MAX CAP REACHED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {activeArea === 'A' && 'Educational degrees, certifications, memberships, and seminars (Ceiling: 70 Max Points).'}
                {activeArea === 'B' && 'Publications, Scopus journal articles, keynote lectures, research grants (Ceiling: 50 Max Points).'}
                {activeArea === 'C' && 'Committee leadership, faculty adviserships, and extension projects (Ceiling: 40 Max Points).'}
              </p>
            </div>

            {/* Section Actions: Import from Vault & Add Item */}
            {isEditable && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAutoPopulate}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Import Vault Entries</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddModal(activeArea)}
                  className="px-4 py-2 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Item to Area {activeArea}</span>
                </button>
              </div>
            )}
          </div>

          {/* Filtering Control Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Geographic Scopes</option>
                <option value="Local">Local / Institutional</option>
                <option value="Regional">Regional</option>
                <option value="National">National</option>
                <option value="International">International</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search accomplishments..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Line-Item Dense Cards List */}
          {currentAreaItems.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                No accomplishment line-items matching filter criteria
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                Click "+ Add Item to Area {activeArea}" or adjust filter selection to review logged entries.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentAreaItems.map((item) => {
                const hasProof = Boolean(item.proof_file_name && item.proof_file_name.trim().length > 0)
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      !hasProof 
                        ? 'border-rose-300 bg-rose-50/40 dark:bg-rose-950/20' 
                        : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-emerald-300'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-[#1e5831] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {item.category || `Category ${activeArea}`}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-slate-200 text-slate-700">
                          Scope: {item.scope_level || 'Local'}
                        </span>

                        {/* Proof Completeness Alert Badges */}
                        {hasProof ? (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Proof Attached</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Missing Proof PDF!</span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                          {hasProof ? item.proof_file_name : 'No Proof Attached'}
                        </span>
                      </div>
                    </div>

                    {/* Right Claimed & Verified Points (Personnel POV) & Interactive Actions */}
                    <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200/60 dark:border-slate-800">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 font-extrabold uppercase">NDMU Points</div>
                        <div className="text-base font-black text-[#2d8a4e]">
                          +{item.claimed_points} pts
                        </div>
                        {item.verified_points !== undefined && (
                          <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-end gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verified: +{item.verified_points} pts</span>
                          </div>
                        )}
                      </div>

                      {isEditable && (
                        <div className="flex items-center gap-1.5">
                          {!hasProof && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1 transition cursor-pointer shadow-xs"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Proof</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(item.id, item.title)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                            title="Remove Line-Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Line-Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#2d8a4e]" />
                {editingItem ? `Edit Item (Area ${activeArea})` : `Add Item to Area ${activeArea}`}
              </h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            {modalFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {modalFormError}
              </div>
            )}

            <form onSubmit={handleSaveItemSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Main Category (Area {activeArea})
                </label>
                <select
                  value={itemCategory}
                  onChange={(e) => handleMainCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#2d8a4e]"
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Accomplishment Title
                </label>
                <input
                  type="text"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="e.g. Ph.D. in Computer Science or CHED Regional Workshop"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#2d8a4e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Geographic Scope
                  </label>
                  <select
                    value={itemScope}
                    onChange={(e) => setItemScope(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#2d8a4e]"
                  >
                    <option value="Local">Local / Institutional</option>
                    <option value="Regional">Regional (Region XII)</option>
                    <option value="National">National</option>
                    <option value="International">International</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    NDMU Standard Points
                  </label>
                  <div className="w-full px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/40 text-[#1b4332] dark:text-emerald-300 text-xs font-extrabold flex items-center justify-between">
                    <span>Auto-Derived</span>
                    <span className="text-sm font-black">+{itemPoints} pts</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Documentary Proof File Attachment (.pdf / .png)
                </label>
                <input
                  type="text"
                  value={itemProofName}
                  onChange={(e) => setItemProofName(e.target.value)}
                  placeholder="e.g. certificate_proof_document.pdf"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#2d8a4e]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-extrabold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Add to Portfolio Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Basic Info Modal */}
      {isEditProfileOpen && (
        <EditBasicInfoModal
          user={activeUser}
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          onSave={() => {
            showToast('Profile basic information updated successfully!')
            setIsEditProfileOpen(false)
          }}
        />
      )}

      {/* Canva Booklet View Presenter Modal */}
      <PersonnelPortfolioCanvaView
        isOpen={isCanvaViewOpen}
        onClose={() => setIsCanvaViewOpen(false)}
        portfolio={portfolio}
        user={activeUser}
      />
    </MainLayout>
  )
}
