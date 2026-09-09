import React, { useState } from 'react'
import {
  X,
  History,
  GitCommit,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Layers,
  ArrowLeftRight,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react'

/**
 * SubmissionVersionHistoryModal.jsx
 *
 * Plan C — Phase C4: Multi-Version Submission History & Snapshot Comparison Modal.
 * Displays all point-in-time immutable submission versions for the evaluation cycle,
 * allows inspecting previous snapshot line-items and feedback, and offers side-by-side
 * version comparison (e.g. Version 1 vs Version 2).
 */
export default function SubmissionVersionHistoryModal({
  isOpen,
  onClose,
  versions = [],
  currentWorkingItems = [],
  personnelName = 'Personnel Member'
}) {
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0)
  const [activeTab, setActiveTab] = useState('history') // 'history' | 'compare'
  const [compareV1Idx, setCompareV1Idx] = useState(0)
  const [compareV2Idx, setCompareV2Idx] = useState(Math.max(0, versions.length - 1))

  if (!isOpen) return null

  const selectedVersion = versions[selectedVersionIdx] || versions[0] || null

  // Helper to compare two versions
  const getComparisonData = () => {
    const v1 = versions[compareV1Idx] || null
    const v2 = versions[compareV2Idx] || null

    const v1Items = v1?.items || []
    const v2Items = v2?.items || []

    const v1IdMap = new Map(v1Items.map(i => [i.accomplishment_id || i.id, i]))
    const v2IdMap = new Map(v2Items.map(i => [i.accomplishment_id || i.id, i]))

    const added = []
    const removed = []
    const modified = []
    const unchanged = []

    v2Items.forEach(item2 => {
      const key = item2.accomplishment_id || item2.id
      const item1 = v1IdMap.get(key)
      if (!item1) {
        added.push(item2)
      } else {
        const p1 = Number(item1.scoring_payload?.claimed_points || 0)
        const p2 = Number(item2.scoring_payload?.claimed_points || 0)
        const f1 = item1.file_name || ''
        const f2 = item2.file_name || ''

        if (p1 !== p2 || f1 !== f2 || item1.evidence_title !== item2.evidence_title) {
          modified.push({ before: item1, after: item2 })
        } else {
          unchanged.push(item2)
        }
      }
    })

    v1Items.forEach(item1 => {
      const key = item1.accomplishment_id || item1.id
      if (!v2IdMap.has(key)) {
        removed.push(item1)
      }
    })

    return { v1, v2, added, removed, modified, unchanged }
  }

  const comparison = activeTab === 'compare' ? getComparisonData() : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Submission Version History</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                  {versions.length} {versions.length === 1 ? 'Version' : 'Versions'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Auditable immutable submission record for {personnelName} • AY 2025-2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Version Timeline</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('compare')}
                disabled={versions.length < 2}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40 ${
                  activeTab === 'compare'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Compare Versions</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {versions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <History className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
                No Official Submission Versions Recorded
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Submit your working portfolio draft to record Version 1 in the institutional evaluation repository.
              </p>
            </div>
          ) : activeTab === 'history' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Version Selector Timeline */}
              <div className="lg:col-span-4 space-y-3">
                <div className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Submission History ({versions.length})
                </div>

                <div className="space-y-2.5">
                  {versions.map((ver, idx) => {
                    const isSelected = idx === selectedVersionIdx
                    const statusStr = (ver.status || 'submitted').toLowerCase()
                    const isReturned = statusStr === 'returned_for_revision' || statusStr === 'returned_to_personnel'

                    return (
                      <button
                        key={ver.id || idx}
                        type="button"
                        onClick={() => setSelectedVersionIdx(idx)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900 dark:text-white">
                              Version {ver.version_number || (idx + 1)}
                            </span>
                            {ver.is_current && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-600 text-white">
                                Latest
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {ver.submitted_at ? new Date(ver.submitted_at).toLocaleDateString() : 'Draft'}
                            </span>
                            <span>•</span>
                            <span>{ver.items_count || (ver.items || []).length} items</span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 ${
                          isReturned
                            ? 'bg-rose-100 text-rose-800'
                            : statusStr === 'submitted'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {ver.status || 'submitted'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right Column: Selected Version Snapshot Detail */}
              <div className="lg:col-span-8 space-y-4">
                {selectedVersion && (
                  <>
                    {/* Version Header Card */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-900 dark:text-white">
                            Version {selectedVersion.version_number || (selectedVersionIdx + 1)} Point-in-Time Snapshot
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            ID: {(selectedVersion.id || '').substring(0, 8)}...
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Submitted on {selectedVersion.submitted_at ? new Date(selectedVersion.submitted_at).toLocaleString() : 'N/A'}
                        </div>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                        (selectedVersion.status || '').toLowerCase() === 'returned_for_revision'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedVersion.status}
                      </span>
                    </div>

                    {/* Return Feedback Banner if Returned */}
                    {selectedVersion.return_feedback && (
                      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-black text-rose-900 dark:text-rose-200">
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            <span>Version {selectedVersion.version_number} Return Feedback</span>
                          </div>
                          {selectedVersion.return_feedback.reviewer_name && (
                            <span className="text-[11px] font-semibold text-rose-700">
                              By {selectedVersion.return_feedback.reviewer_name}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-rose-950 dark:text-rose-100 bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-rose-200/70">
                          <div className="font-bold text-[10px] uppercase text-rose-700 mb-0.5">Reason</div>
                          {selectedVersion.return_feedback.reason}
                        </div>

                        {selectedVersion.return_feedback.required_corrections && (
                          <div className="text-xs text-rose-950 dark:text-rose-100 bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-rose-200/70">
                            <div className="font-bold text-[10px] uppercase text-rose-700 mb-0.5">Required Corrections</div>
                            {selectedVersion.return_feedback.required_corrections}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Snapshot Line Items */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                        Snapshot Line Items ({selectedVersion.items?.length || 0})
                      </div>

                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {(selectedVersion.items || []).map((item, iIdx) => (
                          <div
                            key={item.id || iIdx}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {item.criterion_code || 'A.1'}
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {item.evidence_title || item.criterion_title}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                <span>Proof: {item.file_name || 'No file'}</span>
                                <span>•</span>
                                <span>Claimed: {item.scoring_payload?.claimed_points || 0} pts</span>
                              </div>
                            </div>

                            {item.evaluator_remarks && (
                              <span className="px-2 py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-medium max-w-xs truncate" title={item.evaluator_remarks}>
                                {item.evaluator_remarks}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Compare Versions Tab */
            <div className="space-y-5">
              {/* Selectors */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Baseline (Older)</label>
                    <select
                      value={compareV1Idx}
                      onChange={(e) => setCompareV1Idx(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                    >
                      {versions.map((v, i) => (
                        <option key={v.id || i} value={i}>
                          Version {v.version_number || (i + 1)} ({v.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400 mt-4" />

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Target (Newer)</label>
                    <select
                      value={compareV2Idx}
                      onChange={(e) => setCompareV2Idx(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                    >
                      {versions.map((v, i) => (
                        <option key={v.id || i} value={i}>
                          Version {v.version_number || (i + 1)} ({v.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-extrabold">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                    +{comparison?.added.length || 0} Added
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">
                    ~{comparison?.modified.length || 0} Modified
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800">
                    -{comparison?.removed.length || 0} Removed
                  </span>
                </div>
              </div>

              {/* Comparison Results */}
              <div className="space-y-4">
                {/* Added Items */}
                {comparison?.added.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-extrabold uppercase text-emerald-700 tracking-wider">
                      Newly Added Items in Version {(versions[compareV2Idx]?.version_number || (compareV2Idx + 1))} ({comparison.added.length})
                    </div>
                    {comparison.added.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-bold text-emerald-950">{item.evidence_title || item.criterion_title}</div>
                          <div className="text-[11px] text-emerald-700">Proof: {item.file_name} • Claimed: {item.scoring_payload?.claimed_points || 0} pts</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-extrabold text-[10px]">NEW</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Modified Items */}
                {comparison?.modified.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-extrabold uppercase text-amber-700 tracking-wider">
                      Corrected / Modified Items ({comparison.modified.length})
                    </div>
                    {comparison.modified.map(({ before, after }, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1.5">
                        <div className="font-bold text-slate-900">{after.evidence_title || after.criterion_title}</div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 rounded bg-white/70 border border-amber-200/50">
                            <span className="font-bold text-slate-500">Version {versions[compareV1Idx]?.version_number}: </span>
                            <span>Proof: {before.file_name} • Claimed: {before.scoring_payload?.claimed_points || 0} pts</span>
                          </div>
                          <div className="p-2 rounded bg-white/70 border border-amber-200/50">
                            <span className="font-bold text-emerald-700">Version {versions[compareV2Idx]?.version_number}: </span>
                            <span>Proof: {after.file_name} • Claimed: {after.scoring_payload?.claimed_points || 0} pts</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Removed Items */}
                {comparison?.removed.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-extrabold uppercase text-rose-700 tracking-wider">
                      Removed Items from Version {(versions[compareV1Idx]?.version_number || (compareV1Idx + 1))} ({comparison.removed.length})
                    </div>
                    {comparison.removed.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-bold text-rose-950 line-through">{item.evidence_title || item.criterion_title}</div>
                          <div className="text-[11px] text-rose-700">Proof: {item.file_name}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-extrabold text-[10px]">REMOVED</span>
                      </div>
                    ))}
                  </div>
                )}

                {comparison?.added.length === 0 && comparison?.modified.length === 0 && comparison?.removed.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-500 font-medium">
                    No line-item differences found between Version {versions[compareV1Idx]?.version_number} and Version {versions[compareV2Idx]?.version_number}.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-500">
          <span>🔒 Immutable Historical Snapshot Record</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 font-extrabold text-slate-800 dark:text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
