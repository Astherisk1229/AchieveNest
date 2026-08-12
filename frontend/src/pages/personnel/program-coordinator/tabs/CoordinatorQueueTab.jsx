import React, { useState } from 'react'
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
  FileCheck2
} from 'lucide-react'

export default function CoordinatorQueueTab({ pendingSubmissions, onVerify, onReturn }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const items = (pendingSubmissions || [
    { id: 1, student_name: 'Maria Santos', student_id: '2024-01234', title: "Dean's Lister - First Sem AY 2025-2026", category: 'Academic', date: '2 hours ago', status: 'PENDING' },
    { id: 2, student_name: 'Juan Dela Cruz', student_id: '2023-05678', title: 'National Hackathon 1st Place', category: 'Recognition', date: '5 hours ago', status: 'PENDING' },
    { id: 3, student_name: 'Ana Reyes', student_id: '2022-09912', title: 'Community Outreach Organizer', category: 'Community', date: '1 day ago', status: 'PENDING' }
  ]).filter(item => {
    const matchesSearch = item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || item.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-2xs">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#2d8a4e] dark:text-emerald-400" />
          Program Coordinator Verification Queue
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Review student accomplishment submissions, verify attached proof documents, or return for revision.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student or submission title..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-[#2d8a4e]"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'Academic', 'Recognition', 'Community'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#1b4332] text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions List Table */}
      <div className="rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-extrabold uppercase tracking-wider">
                <th className="p-4">Student</th>
                <th className="p-4">Submission Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Submitted Date</th>
                <th className="p-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    No pending submissions found in verification queue.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      <p>{item.student_name}</p>
                      <p className="text-[11px] text-slate-400 font-normal">{item.student_id}</p>
                    </td>
                    <td className="p-4 font-extrabold text-[#2d8a4e]">{item.title}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-100 dark:border-emerald-800/50">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{item.date}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onVerify && onVerify(item.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#1b4332] hover:bg-[#2d8a4e] text-white text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onReturn && onReturn(item.id)}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-[11px] font-extrabold hover:bg-amber-100 transition cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Return</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
