import React, { useState } from 'react'
import { FileSpreadsheet, Images, CheckCircle2, AlertCircle } from 'lucide-react'

export default function FacultyPortfolioPane({
  submission,
  evidenceItems = [],
  selectedEvidence,
  onSelectEvidence
}) {
  // View mode: 'form_matrix' (Formal HR Form Pages 1-2) | 'attached_proofs' (Reverse Chronological Proof Attachments Pages 3+)
  const [viewMode, setViewMode] = useState('form_matrix')

  // Reverse chronological sorting for attached proof certificates
  const sortedProofItems = [...evidenceItems].sort((a, b) => {
    const dateA = new Date(a.submittedDate || '2026-08-01')
    const dateB = new Date(b.submittedDate || '2026-08-01')
    return dateB - dateA
  })

  const areaAItems = evidenceItems.filter(i => i.categoryArea === 'areaA')
  const areaBItems = evidenceItems.filter(i => i.categoryArea === 'areaB')
  const areaCItems = evidenceItems.filter(i => i.categoryArea === 'areaC')

  return (
    <div className="h-full flex flex-col font-sans overflow-hidden bg-slate-100 dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800">
      {/* Top Header & View Mode Switcher */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131e2e] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={submission.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={submission.faculty_name}
            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
          />
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
              {submission.faculty_name}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {submission.department} · {submission.employee_id}
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('form_matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'form_matrix'
                ? 'bg-[#176B43] text-white shadow-2xs dark:bg-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Formal HR Form</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('attached_proofs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'attached_proofs'
                ? 'bg-[#176B43] text-white shadow-2xs dark:bg-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Images className="w-3.5 h-3.5" />
            <span>Attached Proofs ({sortedProofItems.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: FORMAL HR FORM MATRIX (Pages 1-2) - 100% STATIONARY, NO SHIFT */}
      {viewMode === 'form_matrix' && (
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-serif">
          {/* Formal HR Header */}
          <div className="text-center space-y-1 mb-6">
            <h2 className="text-xl font-bold tracking-wide uppercase font-serif text-slate-900 dark:text-white">
              FACULTY DEVELOPMENT PROGRAM
            </h2>
            <p className="text-sm font-medium font-serif italic text-slate-700 dark:text-slate-300">
              Portfolio
            </p>

            <div className="pt-4 grid grid-cols-2 text-left text-xs font-serif text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-800">
              <div>
                <p><span className="font-semibold">Name:</span> {submission.faculty_name}</p>
                <p><span className="font-semibold">School Year:</span> 2023-2024</p>
              </div>
              <div>
                <p><span className="font-semibold">Status:</span> Full-Time - Permanent</p>
                <p><span className="font-semibold">Rank:</span> {submission.academic_rank || 'Associate Professor I'}</p>
              </div>
            </div>
          </div>

          {/* Main Formal HR Table */}
          <div className="border-2 border-slate-900 dark:border-slate-600 text-xs font-serif overflow-hidden shadow-xs">
            {/* SECTION A */}
            <div className="bg-[#0f2537] text-white font-bold p-2 text-sm uppercase tracking-wider border-b border-slate-900">
              A. PROFESSIONAL DEVELOPMENT
            </div>

            {/* A.1 Education */}
            <div className="bg-[#183a54] text-white font-bold p-1.5 pl-3 text-xs border-b border-slate-900">
              1. EDUCATION
            </div>
            <table className="w-full border-collapse border-b border-slate-900 text-slate-900 dark:text-slate-100">
              <thead>
                <tr className="bg-[#e3f2fd] dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-serif italic border-b border-slate-900">
                  <th className="p-2 border-r border-slate-900 w-1/5">Date(s)</th>
                  <th className="p-2 border-r border-slate-900 w-2/5">Course/Degree</th>
                  <th className="p-2 border-r border-slate-900 w-1/4">School/University</th>
                  <th className="p-2">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 dark:divide-slate-800 font-sans text-xs">
                {areaAItems.filter(i => i.criterionKey === 'degrees').map(item => {
                  const isSelected = selectedEvidence?.id === item.id
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectEvidence(item)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#EFF7F0]/15 dark:bg-emerald-950/60 font-bold border-l-4 border-[#69A97C]'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <td className="p-2 border-r border-slate-900 font-mono text-[11px]">{item.submittedDate || '2018–2022'}</td>
                      <td className="p-2 border-r border-slate-900 font-extrabold">{item.title}</td>
                      <td className="p-2 border-r border-slate-900">NDMU / Accredited Institution</td>
                      <td className="p-2 font-bold text-[#064e2b] dark:text-emerald-400">{item.awardedPoints || item.eligiblePoints} pts</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* A.2 Professional Organizations */}
            <div className="bg-[#183a54] text-white font-bold p-1.5 pl-3 text-xs border-b border-slate-900">
              2. ACTIVE MEMBERSHIP TO PROFESSIONAL ORGANIZATIONS
            </div>
            <table className="w-full border-collapse border-b border-slate-900 text-slate-900 dark:text-slate-100">
              <thead>
                <tr className="bg-[#e3f2fd] dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-serif italic border-b border-slate-900">
                  <th className="p-2 border-r border-slate-900 w-1/5">Date(s)</th>
                  <th className="p-2 border-r border-slate-900 w-2/5">Organization</th>
                  <th className="p-2 border-r border-slate-900 w-1/4">Conducted or Organized by</th>
                  <th className="p-2">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 dark:divide-slate-800 font-sans text-xs">
                {areaAItems.filter(i => i.criterionKey === 'memberships').map(item => {
                  const isSelected = selectedEvidence?.id === item.id
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectEvidence(item)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#EFF7F0]/15 dark:bg-emerald-950/60 font-bold border-l-4 border-[#69A97C]'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <td className="p-2 border-r border-slate-900 font-mono text-[11px]">{item.submittedDate || '2023–Present'}</td>
                      <td className="p-2 border-r border-slate-900 font-extrabold">{item.title}</td>
                      <td className="p-2 border-r border-slate-900">International Chapter</td>
                      <td className="p-2 font-bold text-[#064e2b] dark:text-emerald-400">{item.awardedPoints || item.eligiblePoints} pts</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* A.3 Seminars & Trainings */}
            <div className="bg-[#183a54] text-white font-bold p-1.5 pl-3 text-xs border-b border-slate-900">
              3. ATTENDANCE TO SEMINAR-WORKSHOP/TRAININGS
            </div>
            <table className="w-full border-collapse border-b border-slate-900 text-slate-900 dark:text-slate-100">
              <thead>
                <tr className="bg-[#e3f2fd] dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-serif italic border-b border-slate-900">
                  <th className="p-2 border-r border-slate-900 w-1/5">Date(s)</th>
                  <th className="p-2 border-r border-slate-900 w-2/5">Title</th>
                  <th className="p-2 border-r border-slate-900 w-1/4">Conducted or Organized by</th>
                  <th className="p-2">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 dark:divide-slate-800 font-sans text-xs">
                {areaAItems.filter(i => i.criterionKey === 'seminars').map(item => {
                  const isSelected = selectedEvidence?.id === item.id
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectEvidence(item)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#EFF7F0]/15 dark:bg-emerald-950/60 font-bold border-l-4 border-[#69A97C]'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <td className="p-2 border-r border-slate-900 font-mono text-[11px]">{item.submittedDate || 'Aug 2023'}</td>
                      <td className="p-2 border-r border-slate-900 font-extrabold">{item.title}</td>
                      <td className="p-2 border-r border-slate-900">CHED / DLSU</td>
                      <td className="p-2 font-bold text-[#064e2b] dark:text-emerald-400">{item.awardedPoints || item.eligiblePoints} pts</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* SECTION B */}
            <div className="bg-[#0f2537] text-white font-bold p-2 text-sm uppercase tracking-wider border-b border-slate-900">
              B. PRODUCTIVITY AND CREATIVE WORK
            </div>

            {/* B.1 Guest Lecturer */}
            <div className="bg-[#183a54] text-white font-bold p-1.5 pl-3 text-xs border-b border-slate-900">
              1. INVITED AS GUEST LECTURER/CONSULTANT/JUDGE/RESOURCE PERSON
            </div>
            <table className="w-full border-collapse border-b border-slate-900 text-slate-900 dark:text-slate-100">
              <thead>
                <tr className="bg-[#e3f2fd] dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-serif italic border-b border-slate-900">
                  <th className="p-2 border-r border-slate-900 w-1/5">Date(s)</th>
                  <th className="p-2 border-r border-slate-900 w-2/5">Activity</th>
                  <th className="p-2 border-r border-slate-900 w-1/4">Conducted or Organized by</th>
                  <th className="p-2">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 dark:divide-slate-800 font-sans text-xs">
                {areaBItems.filter(i => i.criterionKey === 'lectures').map(item => {
                  const isSelected = selectedEvidence?.id === item.id
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectEvidence(item)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#EFF7F0]/15 dark:bg-emerald-950/60 font-bold border-l-4 border-[#69A97C]'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <td className="p-2 border-r border-slate-900 font-mono text-[11px]">{item.submittedDate || 'Nov 2023'}</td>
                      <td className="p-2 border-r border-slate-900 font-extrabold">{item.title}</td>
                      <td className="p-2 border-r border-slate-900">DepEd Region XII</td>
                      <td className="p-2 font-bold text-[#064e2b] dark:text-emerald-400">{item.awardedPoints || item.eligiblePoints} pts</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* B.2 Publications */}
            <div className="bg-[#183a54] text-white font-bold p-1.5 pl-3 text-xs border-b border-slate-900">
              2. PUBLICATION (scholarly paper/article/research output/book)
            </div>
            <table className="w-full border-collapse border-b border-slate-900 text-slate-900 dark:text-slate-100">
              <thead>
                <tr className="bg-[#e3f2fd] dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-serif italic border-b border-slate-900">
                  <th className="p-2 border-r border-slate-900 w-1/5">Date(s)</th>
                  <th className="p-2 border-r border-slate-900 w-2/5">Publications</th>
                  <th className="p-2 border-r border-slate-900 w-1/4">Granted by</th>
                  <th className="p-2">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 dark:divide-slate-800 font-sans text-xs">
                {areaBItems.filter(i => i.criterionKey === 'publications').map(item => {
                  const isSelected = selectedEvidence?.id === item.id
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectEvidence(item)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#EFF7F0]/15 dark:bg-emerald-950/60 font-bold border-l-4 border-[#69A97C]'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <td className="p-2 border-r border-slate-900 font-mono text-[11px]">{item.submittedDate || 'Jan 2024'}</td>
                      <td className="p-2 border-r border-slate-900 font-extrabold">{item.title}</td>
                      <td className="p-2 border-r border-slate-900">IEEE Society</td>
                      <td className="p-2 font-bold text-[#064e2b] dark:text-emerald-400">{item.awardedPoints || item.eligiblePoints} pts</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* SECTION C */}
            <div className="bg-[#0f2537] text-white font-bold p-2 text-sm uppercase tracking-wider border-b border-slate-900">
              C. SERVICE AND LEADERSHIP
            </div>

            {/* C.1 Extra-Curricular */}
            <div className="bg-[#183a54] text-white font-bold p-1.5 pl-3 text-xs border-b border-slate-900">
              1. INVOLVEMENT IN EXTRA-CURRICULAR ACTIVITIES/RECOGNIZED SCHOOL ORGS.
            </div>
            <table className="w-full border-collapse text-slate-900 dark:text-slate-100">
              <thead>
                <tr className="bg-[#e3f2fd] dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-serif italic border-b border-slate-900">
                  <th className="p-2 border-r border-slate-900 w-1/5">Date(s)</th>
                  <th className="p-2 border-r border-slate-900 w-2/5">Activity / Club</th>
                  <th className="p-2 border-r border-slate-900 w-1/4">Organized by</th>
                  <th className="p-2">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 dark:divide-slate-800 font-sans text-xs">
                {areaCItems.map(item => {
                  const isSelected = selectedEvidence?.id === item.id
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectEvidence(item)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#EFF7F0]/15 dark:bg-emerald-950/60 font-bold border-l-4 border-[#69A97C]'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <td className="p-2 border-r border-slate-900 font-mono text-[11px]">{item.submittedDate || 'SY 2023-2024'}</td>
                      <td className="p-2 border-r border-slate-900 font-extrabold">{item.title}</td>
                      <td className="p-2 border-r border-slate-900">NDMU OSAD</td>
                      <td className="p-2 font-bold text-[#064e2b] dark:text-emerald-400">{item.awardedPoints || item.eligiblePoints} pts</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Signature Line Block */}
          <div className="pt-8 flex justify-end">
            <div className="text-center space-y-1 font-serif">
              <p className="border-b-2 border-slate-800 px-8 pb-1 font-bold text-sm">{submission.faculty_name}</p>
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Signature over Printed Name</p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: ATTACHED PROOFS IN REVERSE CHRONOLOGICAL ORDER (Pages 3+) */}
      {viewMode === 'attached_proofs' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="p-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-extrabold flex items-center justify-between">
            <span>📷 Pages 3+: Attached Proof Certificates (Reverse Chronological Order)</span>
            <span className="text-[10px] bg-[#176B43] text-white px-2 py-0.5 rounded-full font-black">
              {sortedProofItems.length} Proof Attachments
            </span>
          </div>

          {sortedProofItems.map((item, idx) => {
            const isSelected = selectedEvidence?.id === item.id
            return (
              <div
                key={item.id}
                onClick={() => onSelectEvidence(item)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#EFF7F0]/10 dark:bg-emerald-950/40 border-[#69A97C] dark:border-emerald-600 shadow-sm border-l-4'
                    : 'bg-white dark:bg-[#131e2e] border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center shrink-0 font-mono">
                    #{idx + 1}
                  </span>
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">{item.title}</h5>
                    <p className="text-[11px] text-slate-500 font-medium">{item.criterionTitle}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Date: {item.submittedDate || 'Aug 2026'}</p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1 text-[10px] font-extrabold">
                  {item.verificationStatus === 'verified' && (
                    <span className="px-2 py-0.5 rounded-full bg-[#EFF7F0]/10 text-[#064e2b] dark:text-emerald-400 border border-[#69A97C]/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified (+{item.awardedPoints} pts)
                    </span>
                  )}
                  {item.verificationStatus === 'rejected' && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Rejected
                    </span>
                  )}
                  {(!item.verificationStatus || item.verificationStatus === 'pending') && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
