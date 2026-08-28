import React, { useState } from 'react'
import { formatPersonnelPlacement } from '../../utils/personnelPlacement'
import { useNavigate } from 'react-router-dom'
import EditBasicInfoModal from './modals/EditBasicInfoModal'
import RankingCriteriaModel from '../../models/RankingCriteriaModel.js'
import SecurityController from '../../controllers/SecurityController.js'
import OcrScanController from '../../controllers/OcrScanController.js'
import { usePersonnelPortfolio } from '../../hooks/usePersonnelPortfolio'
import { getCurrentUser } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import campusBanner from '../../assets/ndmu_campus_banner.png'
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
  Search,
  RefreshCw,
  UploadCloud,
  Scan,
  Share2,
  User
} from 'lucide-react'

export default function PersonnelPortfolioEditPage({ currentUser: propUser }) {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const activeUser = propUser || authUser || getCurrentUser() || {
    full_name: 'Dr. Maria Santos',
    employee_id: 'EMP-2021-0842',
    personnel_classification: 'academic', college_name: 'College of Information Technology', program_affiliations: [{ code: 'BSIT' }],
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

  // Category Tailored Fields State for Portfolio Edit Modal
  const [degreeLevel, setDegreeLevel] = useState('Ph.D. Degree Holder')
  const [institution, setInstitution] = useState('')
  const [orgPosition, setOrgPosition] = useState('Member')
  const [organizerVenue, setOrganizerVenue] = useState('')
  const [speakerRole, setSpeakerRole] = useState('Keynote Speaker')
  const [publisherIssn, setPublisherIssn] = useState('')
  const [itemDateAchieved, setItemDateAchieved] = useState('2023 - 2024')

  // OCR Scan States for Add/Edit Modal
  const [isModalScanning, setIsModalScanning] = useState(false)
  const [modalOcrResult, setModalOcrResult] = useState(null)
  const [modalOcrBadges, setModalOcrBadges] = useState({})
  const [modalFileObj, setModalFileObj] = useState(null)

  const handleModalFileScan = async (file) => {
    if (!file) return
    setModalFormError('')
    const validation = await SecurityController.validateFileUpload(file)
    if (!validation.isValid) {
      setModalFormError(validation.error)
      return
    }
    const cleanFile = new File([file], SecurityController.sanitizeFilename(file.name), { type: file.type })
    setModalFileObj(cleanFile)
    setItemProofName(cleanFile.name)

    setIsModalScanning(true)
    try {
      const response = await OcrScanController.processDocumentScan(cleanFile)
      setIsModalScanning(false)
      if (response.success && response.result) {
        const res = response.result
        setModalOcrResult(res)
        const fields = res.extractedFields

        const newBadges = {}
        if (res.detectedCategory) {
          const targetArea = ['A', 'B', 'C'].includes(activeArea) ? activeArea : 'A'
          const hierarchy = RankingCriteriaModel.CATEGORIES_HIERARCHY[targetArea]
          const availableCats = hierarchy ? Object.keys(hierarchy.categories) : []
          const matched = availableCats.find(c => c.toLowerCase().includes(res.detectedCategory.toLowerCase().substring(0, 3)))
          if (matched) {
            setItemCategory(matched)
            newBadges.category = true
          }
        }

        if (fields.title) {
          setItemTitle(fields.title)
          newBadges.title = true
        }
        if (fields.scopeLevel) {
          setItemScope(fields.scopeLevel.includes('House') || fields.scopeLevel.includes('Local') ? 'Local' : fields.scopeLevel)
          newBadges.scope = true
        }

        setModalOcrBadges(newBadges)
      }
    } catch (err) {
      setIsModalScanning(false)
      setModalFormError('Failed to scan document with OCR.')
    }
  }

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
    setModalOcrResult(null)
    setModalOcrBadges({})
    setModalFileObj(null)
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
      showToast('Portfolio draft submitted to HR for verification!')
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
    <>
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

        {/* ================= 1. PAGE TOP SUMMARY & PORTFOLIO DOSSIER BANNER ================= */}
        <div className="bg-[#EFF7F0] p-4 sm:p-5 rounded-3xl shadow-xs border border-[#69A97C] space-y-4">

          {/* Top Bar Actions & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDE7DF] pb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#E7F3E9] text-[#17663B] border border-[#69A97C]">
                Personnel Dossier Workbench
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${portfolio?.status === 'HR_APPROVED' ? 'bg-[#E7F5EA] text-[#17663B] border border-[#BBDCC3]' :
                  portfolio?.status === 'SUBMITTED_TO_DEP_SEC' ? 'bg-[#FFF8E7] text-[#B65F00] border border-[#E7A51D]' :
                    portfolio?.status === 'ENDORSED_TO_HR' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-[#FFF8E7] text-[#B65F00] border border-[#E7A51D]'
                }`}>
                STATUS: {portfolio?.status || 'DRAFT'}
              </span>
              <span className="text-xs font-bold text-[#245F42] hidden md:inline">
                Evaluation Dossier • AY 2025-2026
              </span>
            </div>

            {/* Three Primary Portfolio Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Action 1: Edit Profile */}
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F1F7F2] text-[#183B2A] font-extrabold text-xs border border-[#DCE6DF] flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <User className="w-3.5 h-3.5 text-[#159552]" />
                <span>Edit Profile</span>
              </button>

              {/* Action 2: Manage Portfolio Draft */}
              {isEditable && (
                <button
                  type="button"
                  onClick={handleSubmitPortfolio}
                  className="px-4 py-1.5 rounded-xl bg-[#159552] hover:bg-[#117A43] text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>Manage Portfolio Draft</span>
                </button>
              )}

              {/* Action 3: Share */}
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href)
                  }
                  showToast('Portfolio link copied to clipboard!')
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F1F7F2] text-[#183B2A] font-extrabold text-xs border border-[#DCE6DF] flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5 text-[#159552]" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Rebalanced Workflow Cards (No tenure / duplicate counters) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Attached Proof Certificates Card */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#D9E5DC] space-y-1">
              <div className="text-[10px] font-extrabold text-[#245F42] uppercase tracking-wider">
                Document Attachments
              </div>
              <div className="text-xl font-black text-[#102A43]">
                {[...(portfolio?.area_a_items || []), ...(portfolio?.area_b_items || []), ...(portfolio?.area_c_items || [])].filter(i => i.proof_file_name).length} <span className="text-xs font-semibold text-[#64748B]">Proof PDFs Attached</span>
              </div>
              <div className="text-[10px] font-medium text-[#245F42]">
                Verified scanned proof documents in Areas A, B & C
              </div>
            </div>

            {/* Submission Status Card */}
            <div className={`p-3.5 rounded-2xl border space-y-1 ${portfolio?.status === 'HR_APPROVED' ? 'bg-[#E7F5EA] border-[#BBDCC3]' : 'bg-[#FFF8E7] border-[#E7A51D]'
              }`}>
              <div className={`text-[10px] font-extrabold uppercase tracking-wider ${portfolio?.status === 'HR_APPROVED' ? 'text-[#17663B]' : 'text-[#B65F00]'
                }`}>
                Submission Status
              </div>
              <div className={`text-xl font-black truncate ${portfolio?.status === 'HR_APPROVED' ? 'text-[#17663B]' : 'text-[#B65F00]'
                }`}>
                {portfolio?.status || 'DRAFT'}
              </div>
              <div className={`text-[10px] font-medium ${portfolio?.status === 'HR_APPROVED' ? 'text-[#17663B]' : 'text-[#B65F00]'
                }`}>
                Formal Faculty Dossier State
              </div>
            </div>
          </div>
        </div>

        {/* ================= 2. FACULTY COMPACT MINI BANNER ================= */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#D9E5DC] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <img
              src={activeUser.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"}
              alt={activeUser.full_name}
              className="w-10 h-10 rounded-xl object-cover border border-[#D9E5DC] shrink-0"
            />
            <div>
              <h2 className="text-sm font-extrabold text-[#17663B] dark:text-white leading-tight">
                {activeUser.full_name} <span className="text-xs font-normal text-[#245F42]">• {activeUser.academic_rank || 'Associate Professor'}</span>
              </h2>
              <p className="text-xs text-[#245F42] font-medium">
                {formatPersonnelPlacement(activeUser)} • ID: {activeUser.employee_id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditProfileOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F1F7F2] text-[#183B2A] border border-[#DCE6DF] text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
          >
            <User className="w-3.5 h-3.5 text-[#159552]" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* ================= 3. WORKSPACE CATEGORY TABS ================= */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-3 scrollbar-none">
          <button
            type="button"
            role="tab"
            aria-selected={activeArea === 'A'}
            onClick={() => { setActiveArea('A'); setCategoryFilter('ALL'); setScopeFilter('ALL'); }}
            className={`portfolio-area-tab px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shrink-0 cursor-pointer ${activeArea === 'A' ? 'is-active' : ''}`}
          >
            <GraduationCap className="w-4 h-4 area-tab-icon" />
            <span>Area A: Prof. Development</span>
            <span className="area-tab-count px-2 py-0.5 rounded-full text-[10px]">
              {(portfolio?.area_a_items?.length || 3)} Entries
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeArea === 'B'}
            onClick={() => { setActiveArea('B'); setCategoryFilter('ALL'); setScopeFilter('ALL'); }}
            className={`portfolio-area-tab px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shrink-0 cursor-pointer ${activeArea === 'B' ? 'is-active' : ''}`}
          >
            <BookOpen className="w-4 h-4 area-tab-icon" />
            <span>Area B: Productivity</span>
            <span className="area-tab-count px-2 py-0.5 rounded-full text-[10px]">
              {(portfolio?.area_b_items?.length || 5)} Entries
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeArea === 'C'}
            onClick={() => { setActiveArea('C'); setCategoryFilter('ALL'); setScopeFilter('ALL'); }}
            className={`portfolio-area-tab px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shrink-0 cursor-pointer ${activeArea === 'C' ? 'is-active' : ''}`}
          >
            <Heart className="w-4 h-4 area-tab-icon" />
            <span>Area C: Service & Leadership</span>
            <span className="area-tab-count px-2 py-0.5 rounded-full text-[10px]">
              {(portfolio?.area_c_items?.length || 2)} Entries
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
                  className="px-4 py-2 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer"
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
                    className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${!hasProof
                        ? 'border-rose-300 bg-rose-50/40 dark:bg-rose-950/20'
                        : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-emerald-300'
                      }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-[#064e2b] dark:text-[#245F42] border border-emerald-200 dark:border-emerald-800">
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

                    {/* Interactive Actions for Personnel */}
                    <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200/60 dark:border-slate-800">

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
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full flex flex-col max-h-[90vh] shadow-2xl animate-fade-in overflow-hidden">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  {editingItem ? 'Edit Accomplishment' : 'Add Accomplishment'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Record an achievement in your personnel portfolio draft.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSaveItemSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {modalFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {modalFormError}
                </div>
              )}

              {/* 01 UPLOAD DOCUMENT SECTION */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">01</span>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Upload Document</h4>
                </div>

                {!modalFileObj && !itemProofName ? (
                  /* Empty Upload Panel */
                  <div className="relative border border-dashed border-emerald-300 dark:border-emerald-700/80 hover:border-[#16834a] rounded-xl p-5 text-center transition bg-[#f4fbf6] dark:bg-emerald-950/10 cursor-pointer group">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files[0]) handleModalFileScan(e.target.files[0])
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[#16834a] shadow-2xs">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Upload certificate / document</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Drag & drop or click to browse files (PDF, PNG, JPG)</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Selected File Card */
                  <div className="p-3.5 rounded-xl bg-[#f4fbf6] dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#16834a] text-white flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {itemProofName || modalFileObj?.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {modalFileObj ? `${(modalFileObj.size / (1024 * 1024)).toFixed(2)} MB` : 'Attached Documentary Proof'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setModalFileObj(null)
                        setItemProofName('')
                        setModalOcrResult(null)
                        setModalOcrBadges({})
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* OCR Processing Indicator */}
                {isModalScanning && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-300 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-[#16834a] animate-spin shrink-0" />
                    <span>Extracting document information...</span>
                  </div>
                )}

                {/* OCR Success Message */}
                {modalOcrResult && !isModalScanning && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-900 dark:text-[#245F42] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Information extracted from document ({modalOcrResult.detectedCategory})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 02 ACCOMPLISHMENT DETAILS SECTION */}
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">02</span>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Accomplishment Details</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Field */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Main Category (Area {activeArea})</span>
                      {modalOcrBadges.category && (
                        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          Auto-filled
                        </span>
                      )}
                    </label>
                    <select
                      value={itemCategory}
                      onChange={(e) => {
                        handleMainCategoryChange(e.target.value)
                        setModalOcrBadges(prev => ({ ...prev, category: false }))
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a]"
                    >
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dates Field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Date(s) / Inclusive Dates</span>
                      {modalOcrBadges.date && (
                        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          Auto-filled
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={itemDateAchieved}
                      onChange={(e) => { setItemDateAchieved(e.target.value); setModalOcrBadges(prev => ({ ...prev, date: false })) }}
                      placeholder="e.g. 2023 - 2024 or Oct 15, 2023"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a]"
                      required
                    />
                  </div>

                  {/* Geographic Scope */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Geographic Scope</span>
                      {modalOcrBadges.scope && (
                        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          Auto-filled
                        </span>
                      )}
                    </label>
                    <select
                      value={itemScope}
                      onChange={(e) => {
                        setItemScope(e.target.value)
                        setModalOcrBadges(prev => ({ ...prev, scope: false }))
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a]"
                    >
                      <option value="Local">Local / Institutional</option>
                      <option value="Regional">Regional (Region XII)</option>
                      <option value="National">National</option>
                      <option value="International">International</option>
                    </select>
                  </div>

                  {/* Subcategory Fields */}
                  {itemCategory.startsWith('A.1') && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>Course / Degree</span>
                          {modalOcrBadges.title && <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Auto-filled</span>}
                        </label>
                        <input
                          type="text"
                          value={itemTitle}
                          onChange={(e) => { setItemTitle(e.target.value); setModalOcrBadges(prev => ({ ...prev, title: false })) }}
                          placeholder="e.g. Ph.D. in Computer Science / MA in Education"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>School / University</span>
                          {modalOcrBadges.issuer && <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Auto-filled</span>}
                        </label>
                        <input
                          type="text"
                          value={institution}
                          onChange={(e) => { setInstitution(e.target.value); setModalOcrBadges(prev => ({ ...prev, issuer: false })) }}
                          placeholder="e.g. Ateneo de Manila University / NDMU"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a]"
                          required
                        />
                      </div>
                    </>
                  )}

                  {itemCategory.startsWith('A.2') && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>Organization</span>
                          {modalOcrBadges.title && <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Auto-filled</span>}
                        </label>
                        <input
                          type="text"
                          value={itemTitle}
                          onChange={(e) => { setItemTitle(e.target.value); setModalOcrBadges(prev => ({ ...prev, title: false })) }}
                          placeholder="e.g. Philippine Computer Society (PCS) / PSITE"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>Conducted or Organized by</span>
                          {modalOcrBadges.issuer && <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Auto-filled</span>}
                        </label>
                        <input
                          type="text"
                          value={organizerVenue}
                          onChange={(e) => { setOrganizerVenue(e.target.value); setModalOcrBadges(prev => ({ ...prev, issuer: false })) }}
                          placeholder="e.g. National Board / Local Chapter"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a]"
                          required
                        />
                      </div>
                    </>
                  )}

                  {itemCategory.startsWith('A.3') && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>Title</span>
                          {modalOcrBadges.title && <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Auto-filled</span>}
                        </label>
                        <input
                          type="text"
                          value={itemTitle}
                          onChange={(e) => { setItemTitle(e.target.value); setModalOcrBadges(prev => ({ ...prev, title: false })) }}
                          placeholder="e.g. National AI & Cloud Computing Faculty Development Workshop"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>Conducted or Organized by</span>
                          {modalOcrBadges.issuer && <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Auto-filled</span>}
                        </label>
                        <input
                          type="text"
                          value={organizerVenue}
                          onChange={(e) => { setOrganizerVenue(e.target.value); setModalOcrBadges(prev => ({ ...prev, issuer: false })) }}
                          placeholder="e.g. CHED Region XII / NDMU Campus"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a]"
                          required
                        />
                      </div>
                    </>
                  )}

                  {itemCategory.startsWith('B.1') && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>Activity</span>
                          {modalOcrBadges.title && <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Auto-filled</span>}
                        </label>
                        <input
                          type="text"
                          value={itemTitle}
                          onChange={(e) => { setItemTitle(e.target.value); setModalOcrBadges(prev => ({ ...prev, title: false })) }}
                          placeholder="e.g. Keynote Address on Educational Data Mining"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>Conducted or Organized by</span>
                          {modalOcrBadges.issuer && <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Auto-filled</span>}
                        </label>
                        <input
                          type="text"
                          value={organizerVenue}
                          onChange={(e) => { setOrganizerVenue(e.target.value); setModalOcrBadges(prev => ({ ...prev, issuer: false })) }}
                          placeholder="e.g. DOST Region XII / MSU"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a]"
                          required
                        />
                      </div>
                    </>
                  )}

                  {(itemCategory.startsWith('B.2') || itemCategory.startsWith('B.3') || itemCategory.startsWith('B.4') || itemCategory.startsWith('B.5') || itemCategory.startsWith('B.6')) && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>
                            {itemCategory.startsWith('B.2') ? 'Publications' :
                              itemCategory.startsWith('B.3') ? 'Research' :
                                itemCategory.startsWith('B.4') ? 'Recognition / Awards' :
                                  itemCategory.startsWith('B.5') ? 'Materials' : 'Creative Work'}
                          </span>
                          {modalOcrBadges.title && <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Auto-filled</span>}
                        </label>
                        <input
                          type="text"
                          value={itemTitle}
                          onChange={(e) => { setItemTitle(e.target.value); setModalOcrBadges(prev => ({ ...prev, title: false })) }}
                          placeholder="e.g. Title of Work, Research, Award, Material, or Creative Work"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>Granted by</span>
                          {modalOcrBadges.issuer && <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Auto-filled</span>}
                        </label>
                        <input
                          type="text"
                          value={publisherIssn}
                          onChange={(e) => { setPublisherIssn(e.target.value); setModalOcrBadges(prev => ({ ...prev, issuer: false })) }}
                          placeholder="e.g. IEEE Access / NDMU Research Office / Conferring Body"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a]"
                          required
                        />
                      </div>
                    </>
                  )}

                  {itemCategory.startsWith('C') && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>{itemCategory.includes('Moderator') ? 'Clubs / Organizations' : 'Activity'}</span>
                          {modalOcrBadges.title && <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Auto-filled</span>}
                        </label>
                        <input
                          type="text"
                          value={itemTitle}
                          onChange={(e) => { setItemTitle(e.target.value); setModalOcrBadges(prev => ({ ...prev, title: false })) }}
                          placeholder="e.g. Junior Philippine Computer Society / Outreach Activity"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>Conducted / Organized by</span>
                          {modalOcrBadges.issuer && <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Auto-filled</span>}
                        </label>
                        <input
                          type="text"
                          value={organizerVenue}
                          onChange={(e) => { setOrganizerVenue(e.target.value); setModalOcrBadges(prev => ({ ...prev, issuer: false })) }}
                          placeholder="e.g. OSAD / Parish Pastoral Council / Local Government Unit"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a]"
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* Remarks Field (Full width on 2-col) */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Remarks / Additional Details
                    </label>
                    <input
                      type="text"
                      value={itemSubCategory}
                      onChange={(e) => setItemSubCategory(e.target.value)}
                      placeholder="e.g. Full-time Permanent / Officer / Volume 12 Issue 3"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a]"
                    />
                  </div>

                  {/* Documentary Proof File Attachment */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Documentary Proof File Attachment (.pdf / .png)
                    </label>
                    <input
                      type="text"
                      value={itemProofName}
                      onChange={(e) => setItemProofName(e.target.value)}
                      placeholder="e.g. certificate_proof_document.pdf"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a]"
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Modal Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-slate-900 pt-3 pb-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-extrabold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#16834a] hover:bg-[#236e3e] active:scale-[0.99] text-white font-extrabold text-xs shadow-md transition cursor-pointer"
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
    </>
  )
}
