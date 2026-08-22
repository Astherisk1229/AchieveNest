import React, { useState } from 'react'
import { GraduationCap, X, Plus } from 'lucide-react'

export default function CreateProgramModal({ isOpen, onClose, onSubmit, departments = [] }) {
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [degreeLevel, setDegreeLevel] = useState('Undergraduate')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim() || !name.trim()) {
      setError('Program code and degree title are required.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const selectedDept = departments.find(d => d.id === departmentId) || departments[0]

    try {
      await onSubmit({
        department_id: selectedDept?.id || 'dept_cs',
        department_code: selectedDept?.code || 'CS',
        college_id: selectedDept?.college_id || 'col_ceac',
        college_code: selectedDept?.college_code || 'CEAC',
        code: code.trim(),
        name: name.trim(),
        degree_level: degreeLevel
      })
      setCode('')
      setName('')
      setIsSubmitting(false)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create degree program.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#131e2e] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl font-sans">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
            <span>Create Degree Program under Department</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs font-medium">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Parent Department</label>
            <select
              value={departmentId}
              onChange={e => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#69A97C]"
            >
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.code} — {dept.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Program Code</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="e.g. BSCS"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:border-[#69A97C]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Degree Program Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Bachelor of Science in Computer Science"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#69A97C]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Degree Level</label>
            <select
              value={degreeLevel}
              onChange={e => setDegreeLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#69A97C]"
            >
              <option value="Undergraduate">Undergraduate</option>
              <option value="Master's">Master's Degree</option>
              <option value="Doctoral">Doctoral Degree</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-[#176B43] hover:bg-[#125536] text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer disabled:bg-[#E5ECE7] disabled:text-[#7A8B80] disabled:cursor-not-allowed transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Create Program</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
