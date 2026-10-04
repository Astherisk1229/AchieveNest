/**
 * DigitalCertificatesWorkspace.jsx
 * Digital Certificates workspace for the Organization Moderator portal.
 * History and counts come from the backend (GET /certificates), scoped to the moderator's organizations.
 */

import React, { useState } from 'react'
import { Sparkles } from 'lucide-react'
import IssueCertificatesModal from './modals/IssueCertificatesModal'
import IssuedCertificatesPanel from '../../../../components/certificates/IssuedCertificatesPanel'

export default function DigitalCertificatesWorkspace({ events = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const closeModal = () => {
    setIsModalOpen(false)
    // The modal may have issued certificates; reload the real history.
    setRefreshKey((key) => key + 1)
  }

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      <div className="relative overflow-hidden rounded-3xl border border-[#69A97C] bg-[#EFF7F0] p-6 text-[#17663B] shadow-xl sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-[#16834a] text-white shadow-lg">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#17663B]">Digital Certificate Hub</h1>
              <p className="text-xs font-bold uppercase tracking-wider text-[#245F42]/80">Official OSAD Accredited Event Credentials</p>
              <p className="pt-0.5 text-xs font-medium text-[#245F42]">Review backend-authoritative certificate eligibility and readiness</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-xs font-extrabold text-[#064e2b] shadow-lg transition hover:bg-emerald-50"
          >
            <Sparkles className="h-4 w-4 text-[#16834a]" />
            <span>Review Certificate Readiness</span>
          </button>
        </div>
      </div>

      <IssuedCertificatesPanel eventsCount={events.length} refreshKey={refreshKey} />

      <IssueCertificatesModal isOpen={isModalOpen} onClose={closeModal} events={events} />
    </div>
  )
}
