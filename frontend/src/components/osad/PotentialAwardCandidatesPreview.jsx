import React, { useMemo } from 'react'
import { Award, ChevronRight, UserCheck } from 'lucide-react'
import AwardPortfolioReviewService from '../../services/AwardPortfolioReviewService'

export default function PotentialAwardCandidatesPreview({
  awardCategories = [],
  users = [],
  awardees = [],
  candidateDecisions = [],
  onViewAll
}) {
  const potentialCandidates = useMemo(() => {
    const defaultCategories = awardCategories && awardCategories.length > 0 ? awardCategories : []

    const activeDecisions = Array.isArray(candidateDecisions) && candidateDecisions.length > 0
      ? candidateDecisions
      : (Array.isArray(awardees) ? awardees : [])

    const allCandidates = []

    defaultCategories.forEach(cat => {
      const candidates = AwardPortfolioReviewService.calculateStage1Review({
        category: cat,
        users,
        candidateDecisions: activeDecisions
      })

      const qualified = candidates.filter(
        c => c.potentialCandidateStatus === 'POTENTIAL_CANDIDATE' || c.eligibilityStatus === 'qualified' || (c.stage1_score || c.score || 0) >= (cat.min_points || 40)
      )

      allCandidates.push(...qualified)
    })

    // Deduplicate or sort by highest Stage 1 score descending
    allCandidates.sort((a, b) => (b.stage1_score || b.score || 0) - (a.stage1_score || a.score || 0))

    return allCandidates.slice(0, 5)
  }, [awardCategories, users, awardees, candidateDecisions])

  return (
    <div className="bg-white dark:bg-[#131E2E] rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Potential Award Candidates
          </h3>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-[#16834a] dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {potentialCandidates.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs font-normal">
            No students currently meeting Stage 1 award threshold.
          </div>
        ) : (
          potentialCandidates.map((cand) => (
            <div
              key={`${cand.categoryId}-${cand.student_id || cand.studentId}`}
              className="p-3 bg-white dark:bg-[#131E2E] hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition flex items-center justify-between gap-3"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {cand.student_name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {cand.program}
                  </span>
                </div>
                <p className="text-xs text-[#16834a] dark:text-emerald-400 font-medium truncate">
                  {cand.award_title}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {cand.stage1_score ?? cand.score}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal"> / 100</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-300 text-xs font-medium border border-emerald-200/80 dark:border-emerald-800/50">
                  Eligible for Interview
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
