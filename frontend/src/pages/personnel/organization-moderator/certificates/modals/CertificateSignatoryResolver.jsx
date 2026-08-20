/**
 * CertificateSignatoryResolver.jsx
 * Step 4 of Certificate Issuance Modal.
 * Displays fixed/selectable approved signatory slots.
 * Strictly blocks arbitrary file upload or signature cropping.
 */

import React from 'react'
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react'

export default function CertificateSignatoryResolver({ template, approvedSignatories = [], resolvedSignatories = {}, setResolvedSignatories }) {
  const { signatorySlots = [] } = template || {}

  const handleSignatoryChange = (slotId, signatoryId) => {
    const selectedAsset = approvedSignatories.find(s => s.id === signatoryId)
    if (selectedAsset) {
      setResolvedSignatories({
        ...resolvedSignatories,
        [slotId]: selectedAsset
      })
    }
  }

  return (
    <div className="space-y-4 font-sans">
      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
        <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong>Signatory Governance Policy:</strong> Signatories must be pre-uploaded and approved by OSAD. Custom image uploads or position modifications are prohibited during issuance.
        </span>
      </div>

      <div className="space-y-3">
        {signatorySlots.map(slot => {
          const availableForSlot = approvedSignatories.filter(s => s.role === slot.defaultRole || s.status === 'approved')
          const currentResolved = resolvedSignatories[slot.id] || availableForSlot[0]

          return (
            <div
              key={slot.id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                    Required Signatory Slot
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {slot.title}
                  </h4>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approved Asset Resolved
                </span>
              </div>

              {/* Signatory Selection Dropdown */}
              <div className="flex items-center gap-3 pt-1">
                <select
                  value={currentResolved?.id || ''}
                  onChange={(e) => handleSignatoryChange(slot.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold focus:outline-none focus:border-emerald-500"
                >
                  {availableForSlot.map(sig => (
                    <option key={sig.id} value={sig.id}>
                      {sig.name} — {sig.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resolved Asset Preview Card */}
              {currentResolved && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                    <img src={currentResolved.assetUrl} alt={currentResolved.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">{currentResolved.name}</p>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{currentResolved.title}</p>
                  </div>
                </div>
              )}

            </div>
          )
        })}
      </div>

    </div>
  )
}
