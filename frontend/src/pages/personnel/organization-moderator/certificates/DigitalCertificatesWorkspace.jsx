/**
 * DigitalCertificatesWorkspace.jsx
 * Complete Digital Certificates Workspace & Issuance Hub for Organization Moderator Portal.
 */

import React, { useState, useEffect } from 'react'
import { Sparkles, ShieldCheck, QrCode, Award, Search, Filter, Plus, CheckCircle2, AlertTriangle, Eye, RotateCcw, Lock } from 'lucide-react'
import CertificateIssuanceController from '../../../../controllers/CertificateIssuanceController'
import IssueCertificatesModal from './modals/IssueCertificatesModal'

export default function DigitalCertificatesWorkspace({ events = [] }) {
  const [history, setHistory] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBatchDetails, setSelectedBatchDetails] = useState(null)

  useEffect(() => {
    const data = CertificateIssuanceController.getIssuanceHistory()
    setHistory(data)
  }, [])

  const handleIssuanceComplete = (newBatch) => {
    const updated = CertificateIssuanceController.getIssuanceHistory()
    setHistory(updated)
  }

  const filteredHistory = history.filter(b => {
    if (!searchTerm.trim()) return true
    return b.eventTitle.toLowerCase().includes(searchTerm.toLowerCase().trim()) || b.templateTitle.toLowerCase().includes(searchTerm.toLowerCase().trim()) || b.templateCode.toLowerCase().includes(searchTerm.toLowerCase().trim())
  })

  const totalIssued = history.reduce((acc, b) => acc + (b.recipientCount || 0), 0)

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      
      {/* Top Hero Banner */}
      <div className="bg-[#1b4332] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#245233] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#2d8a4e] border border-emerald-400/30 flex items-center justify-center text-white shadow-lg shrink-0">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Digital Certificate Hub
              </h1>
              <p className="text-xs font-bold text-emerald-200/80 uppercase tracking-wider">
                Official OSAD Accredited Event Credentials
              </p>
              <p className="text-xs text-emerald-200/90 font-medium pt-0.5">
                Bulk Issue & Transmit Verifiable Digital Certificates to Event Attendees
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-white hover:bg-emerald-50 border border-emerald-300 text-[#1b4332] font-extrabold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shrink-0"
          >
            <Sparkles className="w-4 h-4 text-[#2d8a4e]" />
            <span>Issue Certificates</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Certificates Issued</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalIssued}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">Active Batches</span>
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">{history.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-1">
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">Ready for Issuance</span>
          <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">{events.length} Events</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Verification Status</span>
          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 pt-1 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            100% Verified
          </p>
        </div>
      </div>

      {/* Issuance History & Filter Table Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Issuance History & Batches
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review completed certificate batches, recipient counts, and serial verification records.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search batches by event or template..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                <th className="p-3.5">Batch ID</th>
                <th className="p-3.5">Event Title</th>
                <th className="p-3.5">OSAD Template</th>
                <th className="p-3.5">Recipients</th>
                <th className="p-3.5">Issued By</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredHistory.map(batch => (
                <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                    {batch.id}
                  </td>
                  <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">
                    {batch.eventTitle}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px]">
                      {batch.templateCode} ({batch.templateVersion})
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                    {batch.recipientCount} Students
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">
                    {batch.issuedBy}
                  </td>
                  <td className="p-3.5 text-slate-500">
                    {new Date(batch.issuedAt).toLocaleDateString()}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Stepper Modal */}
      <IssueCertificatesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        events={events}
        onIssuanceComplete={handleIssuanceComplete}
      />

    </div>
  )
}
