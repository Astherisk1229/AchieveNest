import React, { useState, useEffect } from 'react'
import { X, Building2, Calendar, Check } from 'lucide-react'

export default function EditAssignmentModal({
  personnel,
  isOpen,
  onClose,
  onSave
}) {
  const [selectedCollege, setSelectedCollege] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('2026-08-15')

  const collegeDeptMap = {
    'CEAC': ['Department of Computer Studies', 'Department of Engineering', 'Department of Physical Sciences'],
    'CBA': ['Department of Business Management'],
    'CAS': ['Department of Arts & Humanities'],
  }

  useEffect(() => {
    if (personnel) {
      const col = personnel.college && personnel.college.startsWith('CEAC') ? 'CEAC' :
                  personnel.college && personnel.college.startsWith('CBA') ? 'CBA' :
                  personnel.college && personnel.college.startsWith('CAS') ? 'CAS' : 'CEAC'
      setSelectedCollege(col)
      setSelectedDept(personnel.department || (collegeDeptMap[col] ? collegeDeptMap[col][0] : ''))
    }
  }, [personnel])

  const handleCollegeChange = (col) => {
    setSelectedCollege(col)
    const validDepts = collegeDeptMap[col] || []
    setSelectedDept(validDepts[0] || '')
  }

  if (!isOpen || !personnel) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSave) {
      const updatedCollegeFull = selectedCollege === 'CEAC' ? 'CEAC - College of Engineering, Architecture, and Computing' :
                                selectedCollege === 'CBA' ? 'CBA - College of Business Administration' :
                                'CAS - College of Arts and Sciences'
      onSave(personnel.id, {
        college: updatedCollegeFull,
        department: selectedDept,
        effectiveDate
      })
    }
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-black text-[#064e2b] dark:text-emerald-400 uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>Edit Organizational Assignment</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Target Faculty Details */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
            <img src={personnel.avatar_url} alt={personnel.full_name} className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">{personnel.full_name}</p>
              <p className="font-mono text-[10px] font-bold text-slate-500">{personnel.employee_id}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* College Selection */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                College Assignment
              </label>
              <select
                value={selectedCollege}
                onChange={(e) => handleCollegeChange(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#69A97C]"
              >
                <option value="CEAC">CEAC - Engineering &amp; Computing</option>
                <option value="CBA">CBA - Business Administration</option>
                <option value="CAS">CAS - Arts &amp; Sciences</option>
              </select>
            </div>

            {/* Department Selection (College Dependent) */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                Department Assignment
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#69A97C]"
              >
                {(collegeDeptMap[selectedCollege] || []).map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Effective Date */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Effective Date</span>
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#69A97C]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#EFF7F0] hover:bg-[#143326] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Assignment</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
