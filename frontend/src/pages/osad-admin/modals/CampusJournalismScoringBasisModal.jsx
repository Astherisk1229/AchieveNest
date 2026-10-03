import React, { useState } from 'react'
import {
  Trophy,
  Award,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronRight,
  FileText,
  ShieldCheck,
  Info,
  Calendar,
  ExternalLink,
  BookOpen,
  Users,
  Star,
  Sparkles
} from 'lucide-react'

export default function CampusJournalismScoringBasisModal({ isOpen, onClose, scoringBasis, student }) {
  const [expandedSections, setExpandedSections] = useState({
    CRIT_JOURN_PUB: true,
    CRIT_JOURN_LEAD: true,
    COMP_JOURN_NEWS: true,
    COMP_JOURN_LITERARY: false,
    COMP_JOURN_COLUMN: false,
    COMP_JOURN_EDITORIAL: false,
    COMP_JOURN_LEAD_ROLE: true,
    COMP_JOURN_LEAD_AWARDS: true,
  })

  if (!isOpen || !scoringBasis) return null

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const rawScore = parseFloat(scoringBasis.raw_score || 0).toFixed(2)
  const rawMax = parseFloat(scoringBasis.raw_max || 70).toFixed(2)
  const potentialScore = parseFloat(scoringBasis.potential_score || 0).toFixed(2)
  const isCandidate = scoringBasis.result === 'POTENTIAL_CANDIDATE'
  const sections = scoringBasis.sections || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#eef7f0] text-[#16834a] border border-[#cbe6d2] flex items-center justify-center shrink-0 shadow-2xs">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#eef7f0] text-[#064e2b] text-[10px] font-black uppercase tracking-wider border border-[#cbe6d2]">
                  Campus Journalism Award
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                  Potential Campus Journalism Award Candidate — Portfolio-Based
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                {student?.student_name || scoringBasis.student_name || 'Candidate Scoring Basis'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {student?.program_name || 'Academic Program'} • ID: {student?.institutional_id || 'STU-2024'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/30">
          
          {/* Key Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Portfolio Raw Score
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-slate-900">{rawScore}</span>
                <span className="text-xs font-bold text-slate-400">/ {rawMax} max</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Computable Rubric Total
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Portfolio Potential Score
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className={`text-2xl font-black ${isCandidate ? 'text-[#16834a]' : 'text-amber-600'}`}>
                  {potentialScore}%
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Threshold: 80.00% (56/70)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Candidate Result
              </span>
              <div className="mt-1.5">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold ${
                  isCandidate ? 'bg-[#eef7f0] text-[#064e2b] border border-[#cbe6d2]' : 'bg-slate-100 text-slate-600'
                }`}>
                  {isCandidate ? <CheckCircle2 className="w-3.5 h-3.5 text-[#16834a]" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                  {isCandidate ? 'Potential Candidate' : 'Below Threshold'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                Portfolio Discovery Output
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Evaluation Basis
              </span>
              <div className="flex items-baseline gap-1 mt-1 text-xs font-bold text-slate-800">
                <span>Verified Evidence</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                70 Pts Portfolio Computable
              </span>
            </div>
          </div>

          {/* Expandable Scoring Accordion */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#16834a]" />
              Computable Criteria Breakdown (70.00 Points Maximum)
            </h3>

            {sections.map((section) => (
              <div key={section.criterion_code} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.criterion_code)}
                  className="w-full p-4 flex items-center justify-between bg-slate-50/80 hover:bg-slate-100/80 transition text-left"
                  aria-expanded={expandedSections[section.criterion_code]}
                >
                  <div className="flex items-center gap-3">
                    {expandedSections[section.criterion_code] ? (
                      <ChevronDown className="w-5 h-5 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    )}
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">{section.label}</h4>
                      <span className="text-[11px] text-slate-500 font-medium">Criterion Maximum: {section.max_score} pts</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {section.cap_applied && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                        Cap Applied
                      </span>
                    )}
                    <span className="text-base font-black text-[#16834a]">
                      {parseFloat(section.score).toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ {section.max_score}</span>
                    </span>
                  </div>
                </button>

                {/* Section Content */}
                {expandedSections[section.criterion_code] && (
                  <div className="p-4 space-y-4 border-t border-slate-100">
                    {section.components.map((comp) => (
                      <div key={comp.component_code} className="rounded-xl border border-slate-200/90 overflow-hidden bg-slate-50/40">
                        {/* Component Header */}
                        <button
                          onClick={() => toggleSection(comp.component_code)}
                          className="w-full p-3.5 flex items-center justify-between hover:bg-slate-100/60 transition text-left"
                          aria-expanded={expandedSections[comp.component_code]}
                        >
                          <div className="flex items-center gap-2.5">
                            {expandedSections[comp.component_code] ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                            <div>
                              <span className="text-xs font-bold text-slate-800">{comp.label}</span>
                              <p className="text-[11px] text-slate-500">{comp.rule_summary}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-900">
                              {parseFloat(comp.score).toFixed(2)} / {parseFloat(comp.max_score).toFixed(2)} pts
                            </span>
                          </div>
                        </button>

                        {/* Component Evidence List */}
                        {expandedSections[comp.component_code] && (
                          <div className="p-3.5 bg-white border-t border-slate-200/80 space-y-2.5">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-medium">
                              <span>Qualifying Records: <strong>{comp.qualifying_count}</strong></span>
                              <span>Contributing Records: <strong>{comp.contributing_count}</strong></span>
                              <span>Uncapped Points: <strong>{comp.uncapped_points} pts</strong></span>
                            </div>

                            {comp.records.length === 0 ? (
                              <div className="py-3 text-center text-xs text-slate-400 italic">
                                No verified evidence submitted for this component.
                              </div>
                            ) : (
                              <div className="overflow-x-auto rounded-lg border border-slate-100">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                    <tr>
                                      <th className="py-2 px-3">Title / Work</th>
                                      <th className="py-2 px-3">Outlet / Body</th>
                                      <th className="py-2 px-3">Date / Period</th>
                                      <th className="py-2 px-3">Status</th>
                                      <th className="py-2 px-3">Contribution</th>
                                      <th className="py-2 px-3 text-right">Points</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {comp.records.map((rec) => (
                                      <tr key={rec.record_id} className="hover:bg-slate-50/50">
                                        <td className="py-2.5 px-3 font-semibold text-slate-800 max-w-[200px] truncate" title={rec.title}>
                                          {rec.title}
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-600">
                                          {rec.publication_outlet || rec.conferring_body || 'The NDMU Herald'}
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                          {rec.publication_date || rec.period || rec.date || 'N/A'}
                                        </td>
                                        <td className="py-2.5 px-3">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#eef7f0] text-[#064e2b]">
                                            Verified
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-3">
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                            rec.contribution_status === 'COUNTED'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : rec.contribution_status === 'CAP_REACHED'
                                              ? 'bg-amber-100 text-amber-800'
                                              : 'bg-slate-100 text-slate-600'
                                          }`}>
                                            {rec.contribution_status}
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-black text-slate-900">
                                          +{parseFloat(rec.points_awarded).toFixed(1)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* OSAD Human-Evaluated Official Criteria Notice */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              OSAD Human-Evaluated Rubric Criteria (30.00 Points Non-Computable)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 bg-white/80 rounded-xl border border-amber-200/50">
                <span className="font-bold text-slate-800 block">Moral Character / Conduct</span>
                <span className="text-[11px] text-slate-500">20.00 Points Maximum • Not automatically scored by AchieveNest</span>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-amber-200/50">
                <span className="font-bold text-slate-800 block">Panel Interview / Deliberation</span>
                <span className="text-[11px] text-slate-500">10.00 Points Maximum • Not automatically scored by AchieveNest</span>
              </div>
            </div>
            <p className="text-[11px] text-amber-800 pt-1 leading-relaxed">
              <strong>Quality of Publication Clarification:</strong> Official OSAD rubrics evaluate publication quality through committee review. AchieveNest provides candidate discovery based strictly on verified publication evidence and leadership records.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Calculated: {scoringBasis.calculated_at || 'Just now'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
          >
            Close Basis Breakdown
          </button>
        </div>

      </div>
    </div>
  )
}
