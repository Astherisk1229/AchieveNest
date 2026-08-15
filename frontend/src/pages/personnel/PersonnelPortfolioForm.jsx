import React, { useState } from 'react'
import { Plus, Trash2, FileText, CheckCircle2, Award, BookOpen, Users, Upload, Paperclip, GraduationCap, Sparkles } from 'lucide-react'
import PortfolioSummaryCard from './PortfolioSummaryCard'
import PersonnelPortfolioCanvaPage from './PersonnelPortfolioCanvaPage'
import RankingCriteriaModel from '../../models/RankingCriteriaModel.js'

export default function PersonnelPortfolioForm({
  portfolio,
  totals,
  error,
  user,
  onAddItem,
  onRemoveItem,
  onUpdateServiceYears,
  onSubmitToDepSec
}) {
  const [displayMode, setDisplayMode] = useState('canva') // 'canva' | 'table'
  const [activeTab, setActiveTab] = useState('A') // 'A' | 'B' | 'C'
  const [showAddModal, setShowAddModal] = useState(false)

  // Add Item Modal Form State
  const [itemCategory, setItemCategory] = useState('')
  const [itemSubCategory, setItemSubCategory] = useState('')
  const [itemTitle, setItemTitle] = useState('')
  const [itemScope, setItemScope] = useState('Local')
  const [itemPoints, setItemPoints] = useState('')
  const [itemProofName, setItemProofName] = useState('')
  const [modalError, setModalError] = useState('')

  if (!portfolio) return null

  const isEditable = portfolio.status === 'DRAFT' || portfolio.status === 'RETURNED_TO_PERSONNEL'

  const hierarchyData = RankingCriteriaModel.CATEGORIES_HIERARCHY[activeTab]
  const mainCategories = Object.keys(hierarchyData.categories)

  const handleOpenAddModal = (defaultCategory = '') => {
    const mainCat = defaultCategory || mainCategories[0]
    const subCatObj = hierarchyData.categories[mainCat]?.subCategories[0] || { name: '', defaultPoints: 5 }

    setItemCategory(mainCat)
    setItemSubCategory(subCatObj.name)
    setItemTitle('')
    setItemScope('Local')
    setItemPoints(String(subCatObj.defaultPoints))
    setItemProofName('')
    setModalError('')
    setShowAddModal(true)
  }

  const handleMainCategoryChange = (catName) => {
    setItemCategory(catName)
    const firstSub = hierarchyData.categories[catName]?.subCategories[0] || { name: '', defaultPoints: 5 }
    setItemSubCategory(firstSub.name)
    setItemPoints(String(firstSub.defaultPoints))
  }

  const handleSubCategoryChange = (subName) => {
    setItemSubCategory(subName)
    const subObj = hierarchyData.categories[itemCategory]?.subCategories.find(s => s.name === subName)
    if (subObj) {
      setItemPoints(String(subObj.defaultPoints))
    }
  }

  const handleSaveItem = (e) => {
    e.preventDefault()
    if (!itemTitle.trim()) {
      setModalError('Please enter an accomplishment title.')
      return
    }
    if (!itemProofName.trim()) {
      setModalError('Proof document attachment is required for ranking entries.')
      return
    }

    const fullCategoryLabel = itemSubCategory ? `${itemCategory} • ${itemSubCategory}` : itemCategory

    const success = onAddItem(activeTab, {
      category: fullCategoryLabel,
      title: itemTitle.trim(),
      scope_level: itemScope,
      claimed_points: Number(itemPoints) || 0,
      proof_file_name: itemProofName.trim()
    })

    if (success) {
      setShowAddModal(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Summary Card */}
      <PortfolioSummaryCard
        portfolio={portfolio}
        totals={totals}
        onSubmitToDepSec={onSubmitToDepSec}
        error={error}
      />

      {/* ================= DUAL-VIEW MODE SWITCHER CONTROL BAR ================= */}
      <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Portfolio Presentation Mode:</span>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setDisplayMode('table')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              displayMode === 'table'
                ? 'bg-white text-[#1b4332] shadow-2xs font-black border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📊 Rating Sheet Table View</span>
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode('canva')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              displayMode === 'canva'
                ? 'bg-[#1b4332] text-amber-300 shadow-2xs font-black border border-emerald-900'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>🎨 Canva Booklet View</span>
          </button>
        </div>
      </div>

      {/* RENDER CANVA BOOKLET VIEW IF SELECTED */}
      {displayMode === 'canva' ? (
        <PersonnelPortfolioCanvaPage portfolio={portfolio} user={user} />
      ) : (
        /* STANDARD RATING SHEET TABLE VIEW */
        <>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-2xl px-4 pt-3 gap-2">
        <button
          onClick={() => setActiveTab('A')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'A'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Area A: Professional Development
        </button>
        <button
          onClick={() => setActiveTab('B')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'B'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Area B: Productivity & Creative Work
        </button>
        <button
          onClick={() => setActiveTab('C')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'C'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" /> Area C: Service & Leadership
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-b-2xl p-6 border border-t-0 border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Add Entry Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {activeTab === 'A' && 'Section A: Professional Development (Max 70 Pts)'}
              {activeTab === 'B' && 'Section B: Productivity & Creative Work (Max 50 Pts)'}
              {activeTab === 'C' && 'Section C: Service & Leadership (Max 40 Pts)'}
            </h3>
            <p className="text-xs text-slate-500">
              NDMU Rating Sheet verification entries & supporting proof attachments.
            </p>
          </div>

          {isEditable && (
            <button
              onClick={() => handleOpenAddModal()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 transition-all shadow"
            >
              <Plus className="w-4 h-4" /> Add Accomplishment
            </button>
          )}
        </div>

        {/* NDMU Years of Service Input for Area C */}
        {activeTab === 'C' && (
          <div className="mb-6 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">NDMU Service Credit</h4>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">1 point awarded for every 2 full years of service (Max 10 pts).</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Full Years at NDMU:</label>
              <input
                type="number"
                min="0"
                max="50"
                disabled={!isEditable}
                value={portfolio.years_of_service}
                onChange={(e) => onUpdateServiceYears(e.target.value)}
                className="w-20 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-center text-slate-900 dark:text-white"
              />
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                = {totals?.serviceYearsPts || 0} Pts
              </span>
            </div>
          </div>
        )}

        {/* Line Items Table */}
        {(() => {
          const currentItems = activeTab === 'A' ? portfolio.area_a_items : activeTab === 'B' ? portfolio.area_b_items : portfolio.area_c_items

          if (currentItems.length === 0) {
            return (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-500">No accomplishments logged in this section yet.</p>
                {isEditable && (
                  <button
                    onClick={() => handleOpenAddModal()}
                    className="mt-3 text-xs text-emerald-600 font-semibold hover:underline"
                  >
                    + Click here to add entry
                  </button>
                )}
              </div>
            )
          }

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Title & Description</th>
                    <th className="py-3 px-3">Scope / Tier</th>
                    <th className="py-3 px-3">Attached Proof</th>
                    <th className="py-3 px-3 text-right">Claimed Points</th>
                    {isEditable && <th className="py-3 px-3 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {currentItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        {item.category}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-white max-w-xs">
                        {item.title}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          {item.scope_level}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[150px]">{item.proof_file_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {item.claimed_points} pts
                      </td>
                      {isEditable && (
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => onRemoveItem(activeTab, item.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                            title="Remove Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })()}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Add Accomplishment to Area {activeTab}
            </h3>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-medium border border-rose-200">
                {modalError}
              </div>
            )}

            {/* Required Proof Hint Banner */}
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-[#2d8a4e] shrink-0" />
              <span><strong>Required Proof:</strong> {RankingCriteriaModel.getRequiredProofType(activeTab, itemCategory, itemSubCategory)}</span>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Main Category (NDMU Sheet)</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => handleMainCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {mainCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Sub-Category / Type</label>
                  <select
                    value={itemSubCategory}
                    onChange={(e) => handleSubCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {hierarchyData.categories[itemCategory]?.subCategories.map((sub) => (
                      <option key={sub.name} value={sub.name}>{sub.name} ({sub.defaultPoints} pts)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Accomplishment Title / Details</label>
                <input
                  type="text"
                  placeholder="e.g. Master of Arts in Education / IEEE Journal Publication"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Scope / Level</label>
                  <select
                    value={itemScope}
                    onChange={(e) => setItemScope(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="In-house">In-house (NDMU)</option>
                    <option value="Local">Local</option>
                    <option value="City/Provincial">City / Provincial</option>
                    <option value="Regional">Regional</option>
                    <option value="National">National</option>
                    <option value="International">International</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Claimed Points</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={itemPoints}
                    onChange={(e) => setItemPoints(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Attached Proof Document Name</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Diploma_Copy.pdf or Certificate_2025.png"
                    value={itemProofName}
                    onChange={(e) => setItemProofName(e.target.value)}
                    className="w-full px-3 py-2 pl-8 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <Paperclip className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
