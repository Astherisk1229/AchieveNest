import React from 'react'
import { X, Award, Download, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react'

export default function DigitalCertificateModal({ isOpen, onClose, activeEvent }) {
  if (!isOpen) return null

  const handleExportPDF = () => {
    alert(`Exporting official digital certificates for: ${activeEvent?.title || 'Computer Society Tech Summit 2026'}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-[#1b4332] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg">Digital Certificate Preview & Issuance</h3>
              <p className="text-xs text-emerald-200/80">NDMU Official Event Verification System</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Certificate Graphic Card Preview */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          <div className="p-8 rounded-3xl bg-amber-50/50 border-4 border-double border-amber-300 text-center relative overflow-hidden shadow-inner">
            
            {/* Background Crest Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <Award className="w-64 h-64 text-amber-900" />
            </div>

            <div className="relative z-10 space-y-3">
              <p className="text-xs uppercase font-extrabold tracking-widest text-amber-800">
                Notre Dame of Marbel University
              </p>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                CERTIFICATE OF PARTICIPATION
              </h2>
              <p className="text-xs text-slate-600 italic">This official digital certificate is Conferred upon</p>
              
              <div className="py-2">
                <p className="text-xl font-bold text-[#1b4332] border-b border-amber-300 inline-block px-8 py-1">
                  MARIA SANTOS
                </p>
              </div>

              <p className="text-xs text-slate-700 max-w-md mx-auto leading-relaxed">
                For active participation in the event <span className="font-bold text-slate-900">{activeEvent?.title || 'Computer Society Tech Summit 2026'}</span> hosted by Computer Society NDMU on <span className="font-semibold">{activeEvent?.date || 'August 15, 2026'}</span>.
              </p>

              <div className="pt-6 flex items-center justify-around border-t border-amber-200/60 mt-4">
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-900">Dr. Ana Reyes</p>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Organization Moderator</p>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-amber-200 shadow-sm">
                  <QrCode className="w-8 h-8 text-slate-800" />
                  <div className="text-left text-[9px] leading-tight text-slate-500 font-mono">
                    <p className="font-bold text-slate-900">VERIFIED NDMU</p>
                    <p>ID: CERT-2026-8492</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between text-slate-800">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">Automated Bulk Issuance Ready</p>
                <p className="text-[11px] text-slate-500">150 verified attendee certificates generated automatically</p>
              </div>
            </div>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Issue All Certificates</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition"
          >
            Close
          </button>
          <button
            onClick={handleExportPDF}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-md flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Sample PDF</span>
          </button>
        </div>

      </div>
    </div>
  )
}
