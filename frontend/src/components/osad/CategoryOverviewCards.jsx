import React from 'react'
import { Trophy, Award, ArrowRight } from 'lucide-react'

export function CategoryOverviewCards({ summaries = [], onSelectCategory }) {
  if (!summaries || summaries.length === 0) {
    return (
      <div className="p-8 bg-white dark:bg-[#131e2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 text-xs font-medium">
        No active Award Categories found.
      </div>
    )
  }

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-[#16834a]" />
          <span>Award Category Stage 1 Overview ({summaries.length})</span>
        </h3>
        <span className="text-[11px] font-bold text-slate-400">Independent category criteria & Stage 1 scores</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {summaries.map((cat) => {
          const leader = cat.highestCandidate || cat.leader

          return (
            <div
              key={cat.categoryId}
              className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md transition"
            >
              <div className="space-y-3">
                
                {/* Category Header Strip */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center font-bold shrink-0">
                      <Award className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {cat.categoryTitle}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                        {cat.description || 'Institutional award category evaluation'}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black shrink-0">
                    Min {cat.minPoints} pts
                  </span>
                </div>

                {/* Leader Preview */}
                {leader ? (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <span>⭐</span> Highest Stage 1 Score (#1)
                      </span>
                      <h5 className="font-extrabold text-xs text-slate-900 dark:text-white mt-0.5">
                        {leader.student_name}
                      </h5>
                      <p className="text-[11px] text-slate-500 font-semibold">
                        {leader.program} • {leader.college}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-[#16834a] dark:text-emerald-400">
                        {cat.highestScore} <span className="text-xs text-slate-400 font-medium">/ 100</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 text-xs font-medium">
                    No potential candidates surfaced yet.
                  </div>
                )}

              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-500 font-bold">
                  <span>{cat.potentialCandidateCount ?? cat.qualifiedCount ?? 0} Potential Candidates</span>
                  <span>•</span>
                  <span>{cat.advancedCount ?? cat.confirmedCount ?? 0} Advanced to Interview</span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectCategory && onSelectCategory(cat.categoryTitle)}
                  className="px-3 py-1.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white text-xs font-extrabold transition cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <span>Review Candidates</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryOverviewCards
