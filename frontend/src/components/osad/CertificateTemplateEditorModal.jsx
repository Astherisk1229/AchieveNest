import React, { useState } from 'react'
import { X, Sparkles, ShieldCheck, Eye, Save, AlertCircle, Plus, Trash2 } from 'lucide-react'
import CertificateTemplateRenderer from '../../services/CertificateTemplateRenderer'

export default function CertificateTemplateEditorModal({ isOpen, onClose, onPublish }) {
  const [name, setName] = useState('New OSAD Certificate Template')
  const [allowedContexts, setAllowedContexts] = useState(['event', 'award'])
  const [heading, setHeading] = useState('OFFICIAL CERTIFICATE OF EXCELLENCE')
  const [recipientLeadIn, setRecipientLeadIn] = useState('This certificate is proudly awarded to')
  const [body, setBody] = useState('In recognition of outstanding performance and contribution to {{event_title}} hosted by {{organization_name}} on {{event_date}}.')
  const [themeId, setThemeId] = useState('emerald_gold')
  const [borderStyle, setBorderStyle] = useState('classic_ornate')
  
  const [signatories, setSignatories] = useState([
    { slotId: 'sig-1', title: 'OSAD Director', name: 'Director Marcus Vance' },
    { slotId: 'sig-2', title: 'Faculty Moderator', name: 'Prof. Grace Tan' }
  ])

  const [activeTab, setActiveTab] = useState('content') // 'content' | 'layout' | 'signatories' | 'preview'
  const [error, setError] = useState('')

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#131e2e] rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden font-sans">
        
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
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split Pane (Editor Form vs Live Preview) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          
          {/* Left Pane: Configuration Form (5 cols) */}
          <form onSubmit={handleSave} className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Template Family Title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Certificate of Leadership & Merit"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-[#064e2b]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Allowed Usage Contexts</label>
              <div className="flex gap-4 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowedContexts.includes('event')}
                    onChange={(e) => {
                      if (e.target.checked) setAllowedContexts([...allowedContexts, 'event'])
                      else setAllowedContexts(allowedContexts.filter(c => c !== 'event'))
                    }}
                    className="accent-[#064e2b]"
                  />
                  <span>Organization Events</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowedContexts.includes('award')}
                    onChange={(e) => {
                      if (e.target.checked) setAllowedContexts([...allowedContexts, 'award'])
                      else setAllowedContexts(allowedContexts.filter(c => c !== 'award'))
                    }}
                    className="accent-[#064e2b]"
                  />
                  <span>OSAD Award Categories</span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Certificate Heading</label>
              <input
                type="text"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-[#064e2b]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Recipient Lead-In Text</label>
              <input
                type="text"
                value={recipientLeadIn}
                onChange={(e) => setRecipientLeadIn(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-[#064e2b]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Body Text (with Placeholders)</label>
                <span className="text-[10px] text-slate-400 font-bold">Use {"{{event_title}}"}, {"{{organization_name}}"}</span>
              </div>
              <textarea
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-[#064e2b]"
              />
            </div>

            {/* Signatory Slots Configuration */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Signatory Slots</label>
                <button
                  type="button"
                  onClick={handleAddSignatory}
                  className="text-[10px] font-extrabold text-[#064e2b] dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Signatory</span>
                </button>
              </div>

              {signatories.map((sig, idx) => (
                <div key={sig.slotId} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
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

            <div className="pt-4 flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#064e2b] hover:bg-[#143326] text-white font-extrabold text-xs transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Publish Certificate Template</span>
              </button>
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
  )
}
