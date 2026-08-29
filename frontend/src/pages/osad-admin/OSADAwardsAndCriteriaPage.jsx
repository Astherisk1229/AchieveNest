import React, { useState, useEffect } from 'react'
import { Trophy, Award, ChevronDown, ChevronUp, ShieldCheck, CheckCircle2, RefreshCw, Layers, Percent, Star } from 'lucide-react'
import { fetchAwards } from '../../services/awardAdminService'

export default function OSADAwardsAndCriteriaPage() {
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedAwardId, setExpandedAwardId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function loadAwards() {
      setLoading(true)
      try {
        const data = await fetchAwards()
        if (Array.isArray(data)) {
          setAwards(data)
        }
      } catch (err) {
        console.warn('Failed to load active award definitions:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAwards()
  }, [])

  const filteredAwards = awards.filter((a) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (a.name || '').toLowerCase().includes(term) ||
      (a.code || '').toLowerCase().includes(term) ||
      (a.description || '').toLowerCase().includes(term)
    )
  })

  const toggleExpand = (id) => {
    setExpandedAwardId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#16834a] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Awards & Evaluation Criteria
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-[#16834a] dark:text-emerald-400 text-[10px] font-black uppercase">
                15 Authoritative Awards
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Authoritative institutional award definitions, criteria weights, and candidate qualification threshold (80.00%).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search award or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a] w-56"
          />
        </div>
      </div>

      {/* Awards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#16834a]" />
          <span>Loading authoritative award definitions...</span>
        </div>
      ) : filteredAwards.length === 0 ? (
        <div className="p-12 bg-white dark:bg-[#131e2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 text-xs font-semibold">
          No award definitions match your search query.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAwards.map((award, index) => {
            const isExpanded = expandedAwardId === award.id
            const criteria = award.criteria || []
            const threshold = parseFloat(award.candidate_threshold_percent || '80.00').toFixed(2)

            return (
              <div
                key={award.id}
                className="bg-white dark:bg-[#131e2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Award Summary Row */}
                <div
                  onClick={() => toggleExpand(award.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                          {award.name}
                        </h3>
                        <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300">
                          {award.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {award.description || 'Institutional award evaluated against verified student portfolio achievements.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Candidate Threshold</span>
                      <span className="text-xs font-black text-[#16834a] dark:text-emerald-400">
                        {threshold}% Potential Score
                      </span>
                    </div>

                    <div className="text-right pl-3 border-l border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Criteria</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {criteria.length} {criteria.length === 1 ? 'Criterion' : 'Criteria'}
                      </span>
                    </div>

                    <button
                      type="button"
                      aria-label="Toggle criteria"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Criteria Breakdown */}
                {isExpanded && (
                  <div className="bg-slate-50/70 dark:bg-slate-900/50 p-5 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                      <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#16834a]" />
                        Evaluation Criteria Breakdown
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Sum of weights = 100%
                      </span>
                    </div>

                    {criteria.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium py-2">
                        No individual criteria assigned.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {criteria.map((crit) => (
                          <div
                            key={crit.id || crit.code}
                            className="bg-white dark:bg-[#131e2e] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-mono text-[10px] font-bold text-slate-400 truncate">
                                  {crit.code}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/70 text-[#16834a] dark:text-emerald-400 text-[10px] font-black">
                                  {crit.weight_percentage ? `${crit.weight_percentage}% Weight` : `${crit.max_points} Max Pts`}
                                </span>
                              </div>
                              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug">
                                {crit.name}
                              </h4>
                              {crit.description && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                                  {crit.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-500">
                              <span>Max Points:</span>
                              <span className="text-slate-900 dark:text-white font-extrabold">
                                {crit.max_points} Pts
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
