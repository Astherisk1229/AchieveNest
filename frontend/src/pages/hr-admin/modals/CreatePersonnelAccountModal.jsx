import React, { useState } from 'react'
import { X, UserPlus, Building2, CheckCircle2, ShieldCheck, Mail, User, Award, Briefcase } from 'lucide-react'
import HRModel from '../../../models/HRModel'

export default function CreatePersonnelAccountModal({ isOpen, onClose, onSave }) {
  const [employeeId, setEmployeeId] = useState(`EMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [college, setCollege] = useState(HRModel.COLLEGES[0])
  const [department, setDepartment] = useState('Department of Computer Studies')
  const [academicRank, setAcademicRank] = useState(HRModel.ACADEMIC_RANKS[3] || 'Assistant Professor I')
  const [employmentStatus, setEmploymentStatus] = useState(HRModel.EMPLOYMENT_STATUSES[0] || 'Full-Time Permanent')
  const [tenureYears, setTenureYears] = useState(1)
  const [successMsg, setSuccessMsg] = useState(null)

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!fullName || !email) return

    const newPersonnelData = {
      id: `emp_${Date.now()}`,
      employee_id: employeeId.trim(),
      full_name: fullName.trim(),
      email: email.trim(),
      college: college,
      department: department.trim(),
      academic_rank: academicRank,
      employment_status: employmentStatus,
      tenure_years: parseInt(tenureYears) || 1,
      verified_accomplishments_count: 0,
      assigned_roles: [],
      avatar_url: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150`
    }

    onSave(newPersonnelData)
    setSuccessMsg(`Successfully created Personnel account for ${fullName} (${employeeId}).`)
    setTimeout(() => {
      setSuccessMsg(null)
      setFullName('')
      setEmail('')
      onClose()
    }, 1800)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-[#1b4332] text-white flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-amber-300">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Create Personnel Account</h2>
              <h3 className="text-xs text-emerald-200/90 font-medium">Issue new institutional faculty or administrative staff access credentials</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer relative z-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toast */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Employee ID</label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-800 focus:outline-none focus:border-[#2d8a4e]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name & Honorifics</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Maria Clara Santos"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-[#2d8a4e]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Institutional Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="e.g. msantos@ndmu.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-[#2d8a4e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">College / Academic Unit</label>
              <select
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-none focus:border-[#2d8a4e] bg-white"
              >
                {HRModel.COLLEGES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Department</label>
              <input
                type="text"
                required
                placeholder="e.g. Department of Computer Studies"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-[#2d8a4e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Initial Academic Rank</label>
              <select
                value={academicRank}
                onChange={(e) => setAcademicRank(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-none focus:border-[#2d8a4e] bg-white"
              >
                {HRModel.ACADEMIC_RANKS.map((rank) => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Employment Status</label>
              <select
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-none focus:border-[#2d8a4e] bg-white"
              >
                {HRModel.EMPLOYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-1/2">
            <label className="font-bold text-slate-700 block mb-1">Tenure Years at NDMU</label>
            <input
              type="number"
              min="1"
              max="40"
              value={tenureYears}
              onChange={(e) => setTenureYears(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-[#2d8a4e]"
            />
          </div>

          <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Issue Account</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
