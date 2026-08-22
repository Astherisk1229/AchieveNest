/**
 * CertificateRecipientReview.jsx
 * Step 2 of Certificate Issuance Modal.
 * Displays eligible attendees (verified attendance) vs excluded attendees with exclusion breakdowns.
 */

import React, { useState } from 'react'
import { CheckCircle2, XCircle, Search, Filter, AlertCircle, ShieldCheck } from 'lucide-react'

export default function CertificateRecipientReview({ eligibilityData, selectedRecipients, setSelectedRecipients }) {
  const [activeTab, setActiveTab] = useState('eligible') // 'eligible' | 'excluded'
  const [searchTerm, setSearchTerm] = useState('')

  const { students = [], eligibleCount = 0, excludedCount = 0 } = eligibilityData || {}

  const filteredStudents = students.filter(s => {
    const isTabMatch = activeTab === 'eligible' ? s.isEligible : !s.isEligible
    if (!isTabMatch) return false
    if (!searchTerm.trim()) return true
    return s.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) || s.studentId.includes(searchTerm)
  })

  const toggleRecipientSelect = (studentId) => {
    if (selectedRecipients.includes(studentId)) {
      setSelectedRecipients(selectedRecipients.filter(id => id !== studentId))
    } else {
      setSelectedRecipients([...selectedRecipients, studentId])
    }
  }

  const selectAllEligible = () => {
    const eligibleIds = students.filter(s => s.isEligible).map(s => s.id)
    setSelectedRecipients(eligibleIds)
  }

  return (
    <div className="space-y-4 font-sans">
      
      {/* Top Eligibility Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('eligible')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
            activeTab === 'eligible'
              ? 'bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-700 shadow-xs'
              : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-emerald-800 dark:text-[#245F42] uppercase tracking-wider block">
              Eligible Attendees
            </span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">
              {eligibleCount} Students
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('excluded')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
            activeTab === 'excluded'
              ? 'bg-amber-50/80 border-amber-300 dark:bg-amber-950/60 dark:border-amber-700 shadow-xs'
              : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
              Excluded / Ineligible
            </span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">
              {excludedCount} Records
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search recipient by student name or ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {activeTab === 'eligible' && (
          <button
            type="button"
            onClick={selectAllEligible}
            className="px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 text-emerald-900 dark:text-[#245F42] text-xs font-extrabold transition shrink-0 cursor-pointer"
          >
            Select All ({eligibleCount})
          </button>
        )}
      </div>

      {/* Recipient Roster List */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
        {filteredStudents.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No recipients found matching your filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredStudents.map(student => {
              const isSelected = selectedRecipients.includes(student.id)
              return (
                <div
                  key={student.id}
                  onClick={() => student.isEligible && toggleRecipientSelect(student.id)}
                  className={`p-3 text-xs flex items-center justify-between transition ${
                    student.isEligible ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'opacity-70 bg-slate-50/50 dark:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {student.isEligible && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    )}
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white">
                        {student.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {student.studentId} • {student.program}
                      </p>
                    </div>
                  </div>

                  {student.isEligible ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-[#245F42] font-extrabold text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified Attendance
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {student.exclusionReason}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
