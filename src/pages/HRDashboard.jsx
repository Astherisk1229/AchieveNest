import React from 'react'
import MainLayout from '../layouts/MainLayout'
import { Building2, ShieldCheck, Users } from 'lucide-react'

export default function HRDashboard({ currentUser }) {
  const user = currentUser || { full_name: 'HR Administrator', user_type: 'hr_staff' }

  return (
    <MainLayout>
      <div className="space-y-6 font-sans">
        <div className="bg-[#1b4332] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#245233]">
          <h1 className="text-2xl font-extrabold text-white">HR Office Management Portal</h1>
          <p className="text-xs text-emerald-200/80 mt-1">{user.full_name} • Personnel Role Assignments & Verification</p>
        </div>

        <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-2xs text-center text-slate-500 text-xs">
          <Building2 className="w-8 h-8 text-[#2d8a4e] mx-auto mb-2" />
          <p className="font-bold text-slate-800 text-sm">HR Office Endorsement & Staff Designation Portal</p>
          <p className="mt-1 text-slate-400">Phase 5 Interface ready for Department Secretary assignment and Faculty Institutional Recognition</p>
        </div>
      </div>
    </MainLayout>
  )
}
