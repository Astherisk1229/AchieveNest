import React, { useState, useEffect } from 'react'
import {
  Award,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  ShieldCheck,
  RotateCcw,
  Save,
  Check,
  User,
  BookOpen,
  ArrowLeft,
  Info,
  Calendar,
  Layers
} from 'lucide-react'
import OSADPageHeader from '../../components/osad/OSADPageHeader'
import { OSADLoadingState, OSADErrorState } from '../../components/osad/OSADStateBlock'

export default function OSADStudentAwardReviewWorkspace({
  awardId,
  studentId,
  onBack,
  onFinalized
}) {
  const [loading, setLoading] = useState(true)
  const [workspace, setWorkspace] = useState(null)
  const [error, setError] = useState(null)
  const [expandedCriteria, setExpandedCriteria] = useState({})
  const [manualScores, setManualScores] = useState({})
  const [reviewNotes, setReviewNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    fetchReviewWorkspace()
  }, [awardId, studentId])

  const fetchReviewWorkspace = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch(`/api/v1/osad/awards/${awardId}/students/${studentId}/review`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        }
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setWorkspace(json.data)
        setReviewNotes(json.data.review_notes || '')
        const initialScores = {}
        if (Array.isArray(json.data.manual_panel_criteria)) {
          json.data.manual_panel_criteria.forEach(mc => {
            if (mc.current_score !== null && mc.current_score !== undefined) {
              initialScores[mc.criterion_id] = mc.current_score
            }
          })
        }
        setManualScores(initialScores)
      } else {
        setError(json.error?.message || 'Failed to load student review workspace.')
      }
    } catch (err) {
      setError(err.message || 'Network error loading review workspace.')
    } finally {
      setLoading(false)
    }
  }

  const toggleCriterion = (critId) => {
    setExpandedCriteria(prev => ({
      ...prev,
      [critId]: !prev[critId]
    }))
  }

  const handleManualScoreChange = (critId, value) => {
    setManualScores(prev => ({
      ...prev,
      [critId]: value
    }))
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    setFeedback(null)
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch(`/api/v1/osad/awards/${awardId}/students/${studentId}/manual-criteria`, {
        method: 'PATCH',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          manual_scores: manualScores,
          notes: reviewNotes,
          finalize: false
        })
      })
      const json = await res.json()
      if (res.ok) {
        setFeedback({ type: 'success', message: 'Review draft saved successfully.' })
        fetchReviewWorkspace()
      } else {
        setFeedback({ type: 'error', message: json.error?.message || 'Failed to save draft.' })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleFinalize = async () => {
    setSaving(true)
    setFeedback(null)
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch(`/api/v1/osad/awards/${awardId}/students/${studentId}/finalize`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          manual_scores: manualScores,
          notes: reviewNotes
        })
      })
      const json = await res.json()
      if (res.ok) {
        setFeedback({ type: 'success', message: 'Evaluation successfully finalized.' })
        fetchReviewWorkspace()
        if (typeof onFinalized === 'function') {
          onFinalized()
        }
      } else {
        setFeedback({ type: 'error', message: json.error?.message || 'Failed to finalize evaluation.' })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleRecalculate = async () => {
    setSaving(true)
    setFeedback(null)
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch(`/api/v1/osad/awards/${awardId}/students/${studentId}/recalculate`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        }
      })
      const json = await res.json()
      if (res.ok) {
        setFeedback({ type: 'success', message: 'Portfolio scores recalculated from verified evidence.' })
        fetchReviewWorkspace()
      } else {
        setFeedback({ type: 'error', message: json.error?.message || 'Recalculation failed.' })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <OSADLoadingState message="Loading Student Review Workspace..." />
      </div>
    )
  }

  if (error || !workspace) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <OSADErrorState
          title="Unable to Load Review Workspace"
          message={error || 'Workspace data is unavailable.'}
          onRetry={loadWorkspaceData}
          retryLabel="Retry Loading Workspace"
        />
      </div>
    )
  }

  const { award, student, evaluation_status, portfolio_scoring, manual_panel_criteria, all_relevant_records } = workspace

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Standardized Review Workspace Header */}
      <OSADPageHeader
        variant="detail"
        onBack={onBack}
        backLabel="Back to Students for Evaluation"
        breadcrumbs={[
          { label: 'Awards & Criteria', onClick: onBack },
          { label: award.code || 'Award', onClick: onBack },
          { label: student.full_name }
        ]}
        title={student.full_name}
        badge={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {student.student_id_number || student.id}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              evaluation_status === 'EVALUATED'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : evaluation_status === 'IN_PROGRESS'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              {evaluation_status.replace('_', ' ')}
            </span>
          </div>
        }
        description={`${student.program} • ${student.year_level} • ${student.college}`}
        secondaryActions={
          <>
            <button
              onClick={handleRecalculate}
              disabled={saving}
              className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              title="Recalculate portfolio score from verified evidence"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              Recalculate
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
            >
              <Save className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              Save Draft
            </button>
          </>
        }
        primaryAction={
          <button
            onClick={handleFinalize}
            disabled={saving || evaluation_status === 'EVALUATED'}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {evaluation_status === 'EVALUATED' ? 'Evaluation Finalized' : 'Finalize Review'}
          </button>
        }
      />

      {/* Award & Governance Metadata Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Award className="w-5 h-5 text-emerald-800" />
            <h2 className="text-lg font-bold text-emerald-950">{award.name}</h2>
            <span className="px-2 py-0.5 text-xs font-semibold bg-white text-emerald-900 border border-emerald-300 rounded-md">
              {award.code}
            </span>
            {award.governance && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-200 text-emerald-900">
                {award.governance.badge_text}
              </span>
            )}
          </div>
          {award.governance?.description && (
            <p className="text-xs text-emerald-800 mt-1 max-w-3xl">
              {award.governance.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-6 text-right flex-shrink-0 flex-wrap">
          <div>
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Portfolio Score</div>
            <div className="text-xl font-black text-emerald-950 font-mono">
              {portfolio_scoring.raw_portfolio_score.toFixed(2)}
              <span className="text-xs font-semibold text-emerald-700"> / {portfolio_scoring.computable_max_score.toFixed(2)} pts</span>
            </div>
          </div>

          <div className="pl-4 border-l border-emerald-300">
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Potential Score</div>
            <div className="text-xl font-black text-emerald-950 font-mono">
              {((portfolio_scoring.raw_portfolio_score / (portfolio_scoring.computable_max_score || 1)) * 100).toFixed(2)}%
            </div>
          </div>

          <div className="pl-4 border-l border-emerald-300">
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">80% Threshold Status</div>
            <div className="text-xs font-extrabold mt-0.5">
              {((portfolio_scoring.raw_portfolio_score / (portfolio_scoring.computable_max_score || 1)) * 100) >= 80 ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white font-bold inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Potential Candidate
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                  Below Threshold
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl text-sm font-medium border flex items-center gap-3 ${
          feedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : 'bg-red-50 text-red-900 border-red-200'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Two-Panel Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: Relevant Verified Evidence (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900">Relevant Verified Evidence</h3>
              </div>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                {all_relevant_records.length} records
              </span>
            </div>

            {all_relevant_records.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No relevant verified portfolio records found for this award rubric.
              </div>
            ) : (
              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                {all_relevant_records.map((rec, idx) => (
                  <div
                    key={rec.record_id || idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{rec.title}</h4>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex-shrink-0">
                        Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2.5 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 font-medium">Category:</span> {rec.category_code}
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Component:</span> {rec.matched_component_id || rec.subcategory_code}
                      </div>
                      {rec.structured_metadata?.event_level && (
                        <div>
                          <span className="text-slate-400 font-medium">Level:</span> {rec.structured_metadata.event_level}
                        </div>
                      )}
                      {rec.structured_metadata?.placement && (
                        <div>
                          <span className="text-slate-400 font-medium">Result:</span> {rec.structured_metadata.placement}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Award-Specific Evaluation Sheet (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Portfolio Computed Criteria */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold text-slate-900">Portfolio-Computable Criteria</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">Read-Only Automated Rubric</span>
            </div>

            <div className="space-y-3">
              {portfolio_scoring.criteria.map((crit) => {
                const isExpanded = !!expandedCriteria[crit.criterion_id]
                return (
                  <div
                    key={crit.criterion_id}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-white"
                  >
                    {/* Criterion Header Accordion */}
                    <button
                      type="button"
                      onClick={() => toggleCriterion(crit.criterion_id)}
                      aria-expanded={isExpanded}
                      className="w-full px-4 py-3.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{crit.criterion_name}</h4>
                          <span className="text-xs text-slate-500 font-mono">{crit.criterion_code}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-emerald-950">
                          {crit.earned_points.toFixed(2)}
                          <span className="text-xs font-semibold text-slate-500"> / {crit.max_points.toFixed(2)} pts</span>
                        </span>
                        <span className="text-xs text-emerald-700 font-semibold underline">
                          {isExpanded ? 'Hide Details' : 'View Breakdown'}
                        </span>
                      </div>
                    </button>

                    {/* Expanded Breakdown */}
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                        {crit.components && crit.components.length > 0 ? (
                          <div className="space-y-3">
                            {crit.components.map((comp, cIdx) => (
                              <div key={cIdx} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                                  <span>{comp.component_name}</span>
                                  <span className="text-emerald-900 font-extrabold">
                                    {comp.earned_points.toFixed(2)} / {comp.max_points.toFixed(2)} pts
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1">
                                  Rule Type: <span className="font-mono">{comp.rule_type}</span>
                                </div>

                                {comp.evidence_trace && comp.evidence_trace.length > 0 && (
                                  <div className="mt-2 space-y-1.5 border-t border-slate-200 pt-2">
                                    {comp.evidence_trace.map((tr, tIdx) => (
                                      <div key={tIdx} className="flex items-center justify-between text-[11px]">
                                        <span className="text-slate-700 truncate max-w-[280px]">
                                          • {tr.title}
                                        </span>
                                        <span className={`font-semibold ${tr.is_selected ? 'text-emerald-700' : 'text-slate-400'}`}>
                                          {tr.is_selected ? `+${tr.contribution_points} pts` : 'Qualified (Superseded)'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500">No detailed component breakdown available.</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 2: Non-Computable / Panel Criteria */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-700" />
                <h3 className="font-bold text-slate-900">Panel & Institutional Criteria</h3>
              </div>
              <span className="text-xs font-semibold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Manual Entry Controlled
              </span>
            </div>

            {manual_panel_criteria.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                This award is evaluated 100% through verified portfolio evidence. No manual panel criteria required.
              </div>
            ) : (
              <div className="space-y-4">
                {manual_panel_criteria.map((mc) => (
                  <div
                    key={mc.criterion_id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{mc.criterion_name}</h4>
                        <p className="text-xs text-slate-500">Official Maximum: {mc.official_max_points} pts</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <label htmlFor={`score-${mc.criterion_id}`} className="sr-only">
                          Score for {mc.criterion_name}
                        </label>
                        <input
                          id={`score-${mc.criterion_id}`}
                          type="number"
                          min="0"
                          max={mc.official_max_points}
                          step="0.5"
                          value={manualScores[mc.criterion_id] !== undefined ? manualScores[mc.criterion_id] : ''}
                          onChange={(e) => handleManualScoreChange(mc.criterion_id, e.target.value)}
                          placeholder="0.00"
                          disabled={evaluation_status === 'EVALUATED'}
                          className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-right font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none disabled:bg-slate-200"
                        />
                        <span className="text-xs font-bold text-slate-500">/ {mc.official_max_points}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Reviewer Notes */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Committee & Review Notes</h3>
            <textarea
              rows="3"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              disabled={evaluation_status === 'EVALUATED'}
              placeholder="Enter institutional notes, committee remarks, or verification notes for this student..."
              className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none disabled:bg-slate-100"
            />
          </div>

        </div>

      </div>
    </div>
  )
}
