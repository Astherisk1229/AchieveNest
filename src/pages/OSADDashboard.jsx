import React from 'react'
import MainLayout from '../layouts/MainLayout'
import { Trophy, BarChart3, QrCode } from 'lucide-react'

export default function OSADDashboard({ currentUser }) {
  const user = currentUser || { full_name: 'Director Marcus Vance', user_type: 'osad_staff' }

  return (
    <MainLayout>
      <div className="space-y-6 font-sans">
        <div className="bg-[#1b4332] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#245233]">
          <h1 className="text-2xl font-extrabold text-white">OSAD Administration & TOPSIS Engine</h1>
          <p className="text-xs text-emerald-200/80 mt-1">{user.full_name} • Araw ng Parangal Recognition & Live Event Scanner</p>
        </div>

        <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-2xs text-center text-slate-500 text-xs">
          <Trophy className="w-8 h-8 text-[#2d8a4e] mx-auto mb-2" />
          <p className="font-bold text-slate-800 text-sm">OSAD TOPSIS Ranking Engine & Scanner Gateway</p>
          <p className="mt-1 text-slate-400">Phase 6 Interface ready for Live Barcode Scanner, Multi-criteria Ranking, & Criteria Tuning</p>
        </div>
      </div>
    </MainLayout>
  )
}
