import React, { useState } from 'react'
import { X, Sparkles, ShieldCheck, Eye, Save, AlertCircle, Plus, Trash2 } from 'lucide-react'
import CertificateTemplateRenderer from '../../services/CertificateTemplateRenderer'
import { Button } from '../ui/button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useConfirmableClose } from '../../hooks/useConfirmableClose'

const INITIAL_TEMPLATE_STATE = {
  name: 'New OSAD Certificate Template',
  allowedContexts: ['event', 'award'],
  heading: 'OFFICIAL CERTIFICATE OF EXCELLENCE',
  recipientLeadIn: 'This certificate is proudly awarded to',
  body: 'In recognition of outstanding performance and contribution to {{event_title}} hosted by {{organization_name}} on {{event_date}}.',
  themeId: 'emerald_gold',
  borderStyle: 'classic_ornate',
  signatories: [
    { slotId: 'sig-1', title: 'OSAD Director', name: 'Director Marcus Vance' },
    { slotId: 'sig-2', title: 'Faculty Moderator', name: 'Prof. Grace Tan' }
  ]
}

export default function CertificateTemplateEditorModal({ isOpen, onClose, onPublish }) {
  const [name, setName] = useState(INITIAL_TEMPLATE_STATE.name)
  const [allowedContexts, setAllowedContexts] = useState(INITIAL_TEMPLATE_STATE.allowedContexts)
  const [heading, setHeading] = useState(INITIAL_TEMPLATE_STATE.heading)
  const [recipientLeadIn, setRecipientLeadIn] = useState(INITIAL_TEMPLATE_STATE.recipientLeadIn)
  const [body, setBody] = useState(INITIAL_TEMPLATE_STATE.body)
  const [themeId, setThemeId] = useState(INITIAL_TEMPLATE_STATE.themeId)
  const [borderStyle, setBorderStyle] = useState(INITIAL_TEMPLATE_STATE.borderStyle)
  const [signatories, setSignatories] = useState(INITIAL_TEMPLATE_STATE.signatories)

  const [activeTab, setActiveTab] = useState('content') // 'content' | 'layout' | 'signatories' | 'preview'
  const [error, setError] = useState('')

  const isDirty = () => {
    return (
      name !== INITIAL_TEMPLATE_STATE.name ||
      heading !== INITIAL_TEMPLATE_STATE.heading ||
      recipientLeadIn !== INITIAL_TEMPLATE_STATE.recipientLeadIn ||
      body !== INITIAL_TEMPLATE_STATE.body ||
      themeId !== INITIAL_TEMPLATE_STATE.themeId ||
      borderStyle !== INITIAL_TEMPLATE_STATE.borderStyle ||
      JSON.stringify(allowedContexts) !== JSON.stringify(INITIAL_TEMPLATE_STATE.allowedContexts) ||
      JSON.stringify(signatories) !== JSON.stringify(INITIAL_TEMPLATE_STATE.signatories)
    )
  }

  const handleReset = () => {
    setName(INITIAL_TEMPLATE_STATE.name)
    setAllowedContexts(INITIAL_TEMPLATE_STATE.allowedContexts)
    setHeading(INITIAL_TEMPLATE_STATE.heading)
    setRecipientLeadIn(INITIAL_TEMPLATE_STATE.recipientLeadIn)
    setBody(INITIAL_TEMPLATE_STATE.body)
    setThemeId(INITIAL_TEMPLATE_STATE.themeId)
    setBorderStyle(INITIAL_TEMPLATE_STATE.borderStyle)
    setSignatories(INITIAL_TEMPLATE_STATE.signatories)
    setActiveTab('content')
    setError('')
  }

  const { isConfirmOpen, requestClose, confirmDiscard, cancelDiscard } = useConfirmableClose({
    isOpen,
    isDirty,
    onClose,
    onDiscard: handleReset
  })

  if (!isOpen) return null

  const handleAddSignatory = () => {
    setSignatories([
      ...signatories,
      { slotId: `sig-${Date.now()}`, title: 'Official Signatory', name: 'Signatory Name' }
    ])
  }

  const handleRemoveSignatory = (idx) => {
    setSignatories(signatories.filter((_, i) => i !== idx))
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Template name is required.')
      return
    }
    if (!body.trim()) {
      setError('Certificate body text is required.')
      return
    }

    onPublish({
      familyData: {
        name,
        allowedContexts
      },
      versionData: {
        contentSchema: {
          heading,
          recipientLeadIn,
          body,
          footerNote: 'Notre Dame of Marbel University • Office of Student Affairs & Services'
        },
        layoutSchema: {
          themeId,
          borderStyle
        },
        signatorySlots: signatories
      }
    })
    handleReset()
    onClose()
  }

  const renderedBody = CertificateTemplateRenderer.renderBody(body, {
    recipient_name: 'MARIA CLARA SANTOS',
    event_title: 'Computer Society Tech Summit 2026',
    organization_name: 'Computer Society NDMU',
    event_date: 'February 20, 2026',
    academic_year: 'AY 2025-2026'
  })

  return (
    <>
      <div
        onClick={(e) => { if (e.target === e.currentTarget) requestClose() }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#131e2e] rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden font-sans"
        >
          
          {/* Modal Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#064e2b] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Create OSAD Certificate Template
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Design and publish official university certificate templates for Awards and Events.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close dialog"
              onClick={requestClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader: Editor Tabs */}
          <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex gap-6 bg-slate-50/30 dark:bg-slate-900/20 text-xs font-extrabold">
            {['content', 'layout', 'signatories'].map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`py-3 border-b-2 capitalize transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'border-[#064e2b] dark:border-emerald-400 text-[#064e2b] dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {tab} Settings
              </button>
            ))}
          </div>

          {/* Modal Body: Two-Column Editor & Live Render (5 cols form, 7 cols preview) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
            
            {/* Left Pane: Config Form (5 cols) */}
            <form onSubmit={handleSave} className="lg:col-span-5 p-6 space-y-4 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
              
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Template Global Identity */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Template Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#064e2b]"
                />
              </div>

              {/* Tab 1: Content Elements */}
              {activeTab === 'content' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Main Heading</label>
                    <input
                      type="text"
                      value={heading}
                      onChange={(e) => setHeading(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Recipient Lead-in Phrase</label>
                    <input
                      type="text"
                      value={recipientLeadIn}
                      onChange={(e) => setRecipientLeadIn(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Certificate Body</label>
                      <span className="text-[10px] text-emerald-600 font-mono">Supports tokens: {'{{event_title}}'}, {'{{organization_name}}'}</span>
                    </div>
                    <textarea
                      rows={4}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Layout & Aesthetics */}
              {activeTab === 'layout' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Theme Palette</label>
                    <select
                      value={themeId}
                      onChange={(e) => setThemeId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="emerald_gold">Marbel Emerald & Gold (NDMU Official)</option>
                      <option value="royal_navy">University Navy & Silver</option>
                      <option value="classic_black">Academic Black & Gold</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Border Style</label>
                    <select
                      value={borderStyle}
                      onChange={(e) => setBorderStyle(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="classic_ornate">Classic Ornate Dual Border</option>
                      <option value="modern_geometric">Modern Clean Geometric</option>
                      <option value="minimalist">Minimalist Subtle Inset</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Tab 3: Signatory Slots */}
              {activeTab === 'signatories' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Authorized Signatory Slots</label>
                    <button
                      type="button"
                      onClick={handleAddSignatory}
                      className="text-xs text-[#064e2b] dark:text-emerald-400 font-extrabold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Signatory
                    </button>
                  </div>

                  {signatories.map((sig, idx) => (
                    <div key={sig.slotId || idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                      <input
                        type="text"
                        value={sig.title}
                        onChange={(e) => {
                          const copy = [...signatories]
                          copy[idx].title = e.target.value
                          setSignatories(copy)
                        }}
                        placeholder="Title"
                        className="w-1/2 px-2 py-1 text-[11px] font-bold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={sig.name}
                        onChange={(e) => {
                          const copy = [...signatories]
                          copy[idx].name = e.target.value
                          setSignatories(copy)
                        }}
                        placeholder="Name"
                        className="w-1/2 px-2 py-1 text-[11px] font-bold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      {signatories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSignatory(idx)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={requestClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  className="flex-1 gap-2 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Publish Certificate Template</span>
                </Button>
              </div>
            </form>

            {/* Right Pane: Live Certificate Print-Accurate Preview (7 cols) */}
            <div className="lg:col-span-7 p-6 bg-slate-100 dark:bg-slate-950 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#064e2b] dark:text-emerald-400" />
                  <span>Sample Live Preview (Not Issued)</span>
                </span>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  WATERMARK PREVIEW
                </span>
              </div>

              {/* Rendered Certificate Card */}
              <div className="bg-white text-slate-900 rounded-2xl p-8 border-4 border-emerald-900 shadow-xl space-y-6 relative overflow-hidden font-serif">
                {/* Decorative Corner Ornaments */}
                <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-emerald-900" />
                <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-emerald-900" />
                <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-emerald-900" />
                <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-emerald-900" />

                <div className="text-center space-y-2">
                  <p className="text-[10px] tracking-widest uppercase font-sans font-bold text-slate-500">
                    Notre Dame of Marbel University • Koronadal City
                  </p>
                  <h3 className="text-xl font-bold tracking-tight text-emerald-950 uppercase">
                    {heading}
                  </h3>
                </div>

                <div className="text-center space-y-3 py-2">
                  <p className="text-xs italic text-slate-600 font-sans">{recipientLeadIn}</p>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-wide underline decoration-emerald-600 underline-offset-8">
                    MARIA CLARA SANTOS
                  </h2>
                  <p className="text-xs font-sans text-slate-700 max-w-md mx-auto leading-relaxed pt-2">
                    {renderedBody}
                  </p>
                </div>

                {/* Signatories Row */}
                <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-center font-sans">
                  {signatories.map(s => (
                    <div key={s.slotId} className="space-y-1">
                      <div className="border-b border-slate-400 w-3/4 mx-auto pb-1">
                        <span className="text-xs font-bold text-slate-900 block">{s.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">{s.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 text-center font-medium">
                Official certificate numbers e.g. <code className="font-mono text-slate-600 dark:text-slate-300">NDMU-CERT-2026-XXXXX</code> are assigned automatically upon issuance.
              </p>
            </div>

          </div>

        </div>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Discard Certificate Template Changes?"
        message="Are you sure you want to close? Your unsaved template design and signatory settings will be lost."
        confirmLabel="Discard Changes"
        cancelLabel="Continue Editing"
        onConfirm={confirmDiscard}
        onCancel={cancelDiscard}
      />
    </>
  )
}
