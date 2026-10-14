/**
 * DigitalCertificatesWorkspace.jsx
 * Attendance certificate workspace for the Organization Moderator portal.
 * Records are added to student portfolios automatically after a session closes.
 */

import React from 'react'
import { Sparkles } from 'lucide-react'
import AutomaticAttendanceCertificatesPanel from '../../../../components/certificates/AutomaticAttendanceCertificatesPanel'

export default function DigitalCertificatesWorkspace() {
  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      <div className="relative overflow-hidden rounded-3xl border border-[#69A97C] bg-[#EFF7F0] p-6 text-[#17663B] shadow-xl sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-[#16834a] text-white shadow-lg">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#17663B]">Attendance Certificates</h1>
              <p className="text-xs font-bold uppercase tracking-wider text-[#245F42]/80">Automatic Student Portfolio Records</p>
              <p className="pt-0.5 text-xs font-medium text-[#245F42]">Verified attendees receive a Certificate of Participation after their attendance session closes.</p>
            </div>
          </div>
        </div>
      </div>

      <AutomaticAttendanceCertificatesPanel />
    </div>
  )
}
