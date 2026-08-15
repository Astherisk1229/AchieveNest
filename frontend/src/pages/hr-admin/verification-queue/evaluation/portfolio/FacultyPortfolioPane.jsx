import React, { useState } from 'react'
import { FileText, CheckCircle2, ChevronDown, ChevronRight, Eye, ShieldCheck, AlertCircle } from 'lucide-react'
import EvidenceDocumentViewer from './EvidenceDocumentViewer'

export default function FacultyPortfolioPane({
  submission,
  evidenceItems = [],
  selectedEvidence,
  onSelectEvidence
}) {
  const [activeArea, setActiveArea] = useState('areaA') // 'areaA' | 'areaB' | 'areaC'

  const areaAItems = evidenceItems.filter(i => i.categoryArea === 'areaA')
  const areaBItems = evidenceItems.filter(i => i.categoryArea === 'areaB')
  const areaCItems = evidenceItems.filter(i => i.categoryArea === 'areaC')

  return (
    <div className="h-full flex flex-col font-sans overflow-hidden bg-slate-50/50 dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800">
      {/* Faculty Identity Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131e2e] space-y-3 shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={submission.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={submission.faculty_name}
            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
          />
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {submission.faculty_name}
            </h3>
            <p className="text-xs text-slate-500 font-medium">{submission.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                {submission.employee_id}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#1b4332]/10 text-[#1b4332] dark:text-emerald-400 font-extrabold text-[10px]">
                {submission.department} ({submission.college})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Document Viewer (if active) */}
      {selectedEvidence && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-950 shrink-0">
          <EvidenceDocumentViewer item={selectedEvidence} onClose={() => onSelectEvidence(null)} />
        </div>
      )}

      {/* Area Accordion Tabs */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131e2e] flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setActiveArea('areaA')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
            activeArea === 'areaA'
              ? 'bg-[#1b4332] text-white shadow-2xs dark:bg-emerald-600'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <span>Area A: Prof Dev</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">{areaAItems.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveArea('areaB')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
            activeArea === 'areaB'
              ? 'bg-[#1b4332] text-white shadow-2xs dark:bg-emerald-600'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <span>Area B: Productivity</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">{areaBItems.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveArea('areaC')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
            activeArea === 'areaC'
              ? 'bg-[#1b4332] text-white shadow-2xs dark:bg-emerald-600'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <span>Area C: Service</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">{areaCItems.length}</span>
        </button>
      </div>

      {/* Evidence Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeArea === 'areaA' && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Area A: Professional Development Evidence</h4>
            {areaAItems.map(item => (
              <EvidenceCard key={item.id} item={item} isSelected={selectedEvidence?.id === item.id} onSelect={() => onSelectEvidence(item)} />
            ))}
          </div>
        )}

        {activeArea === 'areaB' && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Area B: Productivity &amp; Creative Work Evidence</h4>
            {areaBItems.map(item => (
              <EvidenceCard key={item.id} item={item} isSelected={selectedEvidence?.id === item.id} onSelect={() => onSelectEvidence(item)} />
            ))}
          </div>
        )}

        {activeArea === 'areaC' && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Area C: Service &amp; Leadership Evidence</h4>
            {areaCItems.map(item => (
              <EvidenceCard key={item.id} item={item} isSelected={selectedEvidence?.id === item.id} onSelect={() => onSelectEvidence(item)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EvidenceCard({ item, isSelected, onSelect }) {
  const isVerified = item.verificationStatus === 'verified'
  const isRejected = item.verificationStatus === 'rejected'

  return (
    <div
      onClick={onSelect}
      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
        isSelected
          ? 'bg-[#1b4332]/10 dark:bg-emerald-950/40 border-[#1b4332] dark:border-emerald-600 shadow-sm'
          : 'bg-white dark:bg-[#131e2e] border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
      }`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#1b4332] dark:text-emerald-400 shrink-0" />
          <h5 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">{item.title}</h5>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{item.criterionTitle}</p>
        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
          Potential: {item.eligiblePoints} pts
        </span>
      </div>

      <div className="shrink-0 flex items-center gap-1 text-[10px] font-extrabold">
        {isVerified && (
          <span className="px-2 py-0.5 rounded-full bg-[#1b4332]/10 text-[#1b4332] dark:text-emerald-400 border border-[#1b4332]/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Verified ({item.awardedPoints} pts)
          </span>
        )}
        {isRejected && (
          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Rejected
          </span>
        )}
        {!isVerified && !isRejected && (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200">
            Pending
          </span>
        )}
      </div>
    </div>
  )
}
