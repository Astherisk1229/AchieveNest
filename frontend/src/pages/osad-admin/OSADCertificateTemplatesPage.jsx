import React, { useState } from 'react'
import { Sparkles, Plus, Search, Eye, Power, CheckCircle2, FileSpreadsheet, Tag } from 'lucide-react'
import { useCertificateTemplates } from '../../hooks/useCertificateTemplates'
import CertificateTemplateEditorModal from '../../components/osad/CertificateTemplateEditorModal'

export default function OSADCertificateTemplatesPage() {
  const { templateFamilies, publishedTemplates, createTemplate, toggleStatus } = useCertificateTemplates('all')
  const [contextFilter, setContextFilter] = useState('all') // 'all' | 'event' | 'award'
  const [searchTerm, setSearchTerm] = useState('')
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  const filteredFamilies = templateFamilies.filter(fam => {
    const matchContext = contextFilter === 'all' || fam.allowedContexts.includes(contextFilter)
    const q = searchTerm.toLowerCase().trim()
    const matchSearch = !q || fam.name.toLowerCase().includes(q) || fam.code.toLowerCase().includes(q)
    return matchContext && matchSearch
  })

  const handlePublishNewTemplate = ({ familyData, versionData }) => {
    createTemplate(familyData, versionData, 'Director Marcus Vance')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#1b4332] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              OSAD Certificate Template Studio
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Centralized OSAD template registry for Awards and Organization Moderator Events.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditorOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143326] text-white font-extrabold text-xs transition shadow-md flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Certificate Template</span>
        </button>
      </div>

      {/* Metric Cards & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Template Families</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{templateFamilies.length}</span>
          </div>
          <Tag className="w-6 h-6 text-[#1b4332] dark:text-emerald-400" />
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Active Published Templates</span>
            <span className="text-xl font-black text-[#1b4332] dark:text-emerald-400">{templateFamilies.filter(f => f.status === 'active').length}</span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Active Consumers</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">Awards & Events</span>
          </div>
          <FileSpreadsheet className="w-6 h-6 text-slate-400" />
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-[#131e2e] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setContextFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${contextFilter === 'all' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
          >
            All Contexts
          </button>
          <button
            type="button"
            onClick={() => setContextFilter('event')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${contextFilter === 'event' ? 'bg-white dark:bg-slate-800 text-[#1b4332] dark:text-emerald-400 shadow-2xs' : 'text-slate-500'}`}
          >
            Organization Events
          </button>
          <button
            type="button"
            onClick={() => setContextFilter('award')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${contextFilter === 'award' ? 'bg-white dark:bg-slate-800 text-[#1b4332] dark:text-emerald-400 shadow-2xs' : 'text-slate-500'}`}
          >
            Award Categories
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-[#1b4332]"
          />
        </div>
      </div>

      {/* Template Family Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFamilies.map(fam => {
          const published = publishedTemplates.find(p => p.familyId === fam.id)
          return (
            <div
              key={fam.id}
              className={`bg-white dark:bg-[#131e2e] rounded-3xl p-6 border shadow-md space-y-4 flex flex-col justify-between transition ${
                fam.status === 'retired' ? 'border-slate-200 opacity-60' : 'border-slate-200/80 dark:border-slate-800 hover:shadow-lg'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-[#1b4332] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-black">
                    {fam.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${fam.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {fam.status}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">{fam.name}</h3>

                <div className="flex flex-wrap gap-1.5">
                  {fam.allowedContexts.map(c => (
                    <span key={c} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-extrabold capitalize">
                      {c === 'event' ? 'Organization Events' : 'Award Categories'}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                {published && published.contentSchema && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2">
                    "{published.contentSchema.heading}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => toggleStatus(fam.id)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{fam.status === 'active' ? 'Retire Template' : 'Reactivate'}</span>
                  </button>

                  <span className="text-[10px] font-bold text-slate-400">
                    Version v{published ? published.versionNumber : 1}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Template Editor Modal */}
      <CertificateTemplateEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onPublish={handlePublishNewTemplate}
      />
    </div>
  )
}
