import React from 'react'
import { Trophy, Award, ArrowRight } from 'lucide-react'

export function CategoryOverviewCards({ summaries = [], onSelectCategory }) {
  if (!summaries || summaries.length === 0) {
    return (
      <div className="p-8 bg-white dark:bg-[#131E2E] rounded-xl border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 text-xs font-normal">
        No active Award Categories found.
      </div>
    )
  }

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-[#16834a] dark:text-emerald-400" />
          <span>Award Category Overview ({summaries.length})</span>
        </h3>
        <span className="text-xs text-slate-400">Independent category criteria & Stage 1 scores</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaries.map((cat) => {
          const leader = cat.highestCandidate || cat.leader

          return (
            <div
              key={cat.categoryId}
              className="bg-white dark:bg-[#131E2E] rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div className="space-y-3">
                {/* Category Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center justify-center font-bold shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {cat.categoryTitle}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {cat.description || 'Institutional award category evaluation'}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium shrink-0">
                    Min {cat.minPoints} pts
                  </span>
                </div>

                {/* Leader Preview */}
                {leader ? (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        ⭐ Highest Stage 1 Score (#1)
                      </span>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white mt-0.5">
                        {leader.student_name}
                      </h5>
                      <p className="text-xs text-slate-500">
                        {leader.program} • {leader.college}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-[#16834a] dark:text-emerald-400">
                        {cat.highestScore}
                      </span>
                      <span className="text-xs text-slate-400 font-normal"> / 100</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-slate-400 text-xs font-normal">
                    No potential candidates surfaced yet.
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-500 font-normal">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{cat.potentialCandidateCount ?? cat.qualifiedCount ?? 0} Potential</span>
                  <span>•</span>
                  <span>{cat.advancedCount ?? cat.confirmedCount ?? 0} Advanced</span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectCategory && onSelectCategory(cat.categoryTitle)}
                  className="px-3 py-1.5 rounded-lg bg-[#1B4D3E] hover:bg-[#143B30] text-white text-xs font-semibold transition cursor-pointer shadow-xs flex items-center gap-1"
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
