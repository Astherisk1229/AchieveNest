/**
 * CertificateIssuancePreview.jsx
 * Step 5 of Certificate Issuance Modal.
 * High-fidelity rendered certificate preview with student name, template styling, QR verification barcode, and signatory blocks.
 */

import React from 'react'
import { QrCode, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function CertificateIssuancePreview({ template, selectedEvent, sampleRecipient, resolvedSignatories = {} }) {
  const sampleStudentName = sampleRecipient?.name || 'Alex Rivera'
  const sampleStudentId = sampleRecipient?.studentId || '2022-0142'
  const sampleSerial = `NDMU-CS-2026-${Math.floor(10000 + Math.random() * 90000)}`

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500">
          Previewing sample certificate for recipient: <strong className="text-slate-900 dark:text-white">{sampleStudentName} ({sampleStudentId})</strong>
        </span>
        <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          High-Fidelity Document Rendering
        </span>
      </div>

      {/* Rendered Certificate Sheet */}
      <div className="p-8 bg-amber-50/40 text-center space-y-6 relative overflow-hidden border-4 border-double border-amber-800/30 rounded-3xl shadow-lg dark:bg-slate-900 dark:border-amber-700/40">
        
        {/* Background Watermark Seal */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <div className="w-64 h-64 rounded-full border-8 border-slate-900 flex items-center justify-center">
            <span className="text-4xl font-extrabold font-serif">NDMU</span>
          </div>
        </div>

        {/* Certificate Header */}
        <div className="space-y-1 relative z-10">
          <p className="text-[11px] font-extrabold tracking-widest uppercase text-amber-900 dark:text-amber-400">NOTRE DAME OF MARBEL UNIVERSITY</p>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Office of Student Affairs & Services (OSAD)</p>
          <h2 className="text-xl font-serif font-extrabold text-slate-900 dark:text-white pt-2 tracking-wide">
            {template?.title || 'CERTIFICATE OF WORKSHOP COMPLETION'}
          </h2>
          <p className="text-[10px] font-extrabold text-amber-800/80 uppercase tracking-widest pt-0.5">
            {template?.code || 'OSAD-TPL-03'} • OFFICIAL VERIFIED CREDENTIAL
          </p>
        </div>

        {/* Recipient Lead-In & Name */}
        <div className="space-y-2 relative z-10 py-2">
          <p className="text-xs italic text-slate-600 dark:text-slate-400">This certificate is proudly awarded to</p>
          <h3 className="text-2xl font-serif font-black text-emerald-950 dark:text-emerald-300 underline decoration-amber-500/50 underline-offset-8">
            {sampleStudentName}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto pt-2 leading-relaxed">
            In recognition of active participation, attendance, and successful completion of the official student organization activity titled <strong className="text-slate-900 dark:text-white">{selectedEvent?.title || 'Computer Society Tech Summit 2026'}</strong> hosted at Notre Dame of Marbel University.
          </p>
        </div>

        {/* Footer: Signatories & Verification QR Barcode */}
        <div className="pt-6 border-t border-amber-800/20 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          
          {/* Signatories List */}
          <div className="flex items-center gap-6 justify-center sm:justify-start">
            {Object.values(resolvedSignatories).map((sig, idx) => (
              <div key={idx} className="text-center space-y-1">
                <div className="w-16 h-8 mx-auto overflow-hidden">
                  <img src={sig.assetUrl} alt={sig.name} className="w-full h-full object-contain" />
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white border-t border-slate-400 pt-0.5">{sig.name}</p>
                <p className="text-[9px] text-slate-500">{sig.title}</p>
              </div>
            ))}
          </div>

          {/* QR Code & Serial Verification Block */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-left shrink-0 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Serial Verification</span>
              <span className="text-[10px] font-extrabold text-slate-900 dark:text-white block font-mono">{sampleSerial}</span>
              <span className="text-[8px] text-emerald-600 font-bold block">Verified by AchieveNest</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
