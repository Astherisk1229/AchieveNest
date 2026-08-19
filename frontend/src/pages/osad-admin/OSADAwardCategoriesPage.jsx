import React from 'react'
import { Award, Plus } from 'lucide-react'

export default function OSADAwardCategoriesPage({ awardCategories, setIsAddAwardOpen }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Award Categories and Criteria
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Define eligibility criteria, score weights, minimum qualifying points, and certificate templates.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddAwardOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Award Category</span>
        </button>
      </div>

      {/* Award Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {awardCategories.map(cat => (
          <div key={cat.id} className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4 flex flex-col justify-between hover:shadow-lg transition duration-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[10px] font-extrabold">
                  {cat.category_type}
                </span>
                <span className="text-[10px] text-[#2d8a4e] dark:text-emerald-400 font-extrabold">{cat.weight_multiplier} Score Weight</span>
              </div>

              <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">{cat.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{cat.description}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <span>Minimum Qualifying Points:</span>
                <span className="text-[#2d8a4e] dark:text-emerald-400 font-extrabold">{cat.min_points} Verified Points</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <span>Certificate Template:</span>
                <span className="text-slate-900 dark:text-white truncate max-w-[150px]">{cat.attached_template_name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
