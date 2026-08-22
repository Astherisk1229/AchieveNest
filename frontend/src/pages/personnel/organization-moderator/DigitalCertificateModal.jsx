import React from 'react'
import { X, Award, Download, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react'
import SignatureVault, { DEFAULT_SIG_1_IMG, DEFAULT_SIG_2_IMG, parseSignatoryInfo } from '../../../utils/signatureVault'



export default function DigitalCertificateModal({ isOpen, onClose, activeEvent }) {
  if (!isOpen) return null

  const handleExportPDF = () => {
    alert(`Exporting official digital certificates for: ${activeEvent?.title || 'Computer Society Tech Summit 2026'}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-[#EFF7F0] border-b border-[#69A97C] text-[#17663B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E7F5EA] border border-[#B7DDC4] flex items-center justify-center text-[#17663B]">
              <Award className="w-5 h-5 text-[#17663B]" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#17663B]">Digital Certificate Preview & Issuance</h3>
              <p className="text-xs text-[#356148] font-medium">NDMU Official Event Verification System</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-[#356148] hover:bg-[#EAF4EC] hover:text-[#17663B] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
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
                <p className="text-xl font-bold text-[#064e2b] border-b border-amber-300 inline-block px-8 py-1">
                  MARIA SANTOS
                </p>
              </div>

              <p className="text-xs text-slate-700 max-w-md mx-auto leading-relaxed">
                For active participation in the event <span className="font-bold text-slate-900">{activeEvent?.title || 'Computer Society Tech Summit 2026'}</span> hosted by Computer Society NDMU on <span className="font-semibold">{activeEvent?.date || 'August 15, 2026'}</span>.
              </p>

              <div className="pt-6 grid grid-cols-3 items-center gap-4 border-t border-amber-200/60 mt-4">
                {(() => {
                  const sig1 = parseSignatoryInfo(activeEvent?.signatory_1 || 'Dr. Ana Reyes (Club Moderator)', 'Dr. Ana Reyes', 'Club Moderator')
                  const sig2 = parseSignatoryInfo(activeEvent?.signatory_2 || 'Prof. Juan Dela Cruz (OSAD Director)', 'Prof. Juan Dela Cruz', 'OSAD Director')

                  return (
                    <>
                      {/* Signatory 1 */}
                      <div className="flex flex-col items-center justify-end text-center relative">
                        <div className="h-9 flex items-end justify-center -mb-2 z-10 pointer-events-none">
                          <img
                            src={activeEvent?.signatory_1_img || SignatureVault.getSignatures().signatory_1_img || DEFAULT_SIG_1_IMG}
                            alt="Signatory 1"
                            className="h-9 max-w-[120px] object-contain"
                          />
                        </div>
                        <p className="font-extrabold text-slate-900 text-xs tracking-wide uppercase z-0 truncate max-w-full">
                          {sig1.name}
                        </p>
                        <div className="w-full border-t border-slate-700 my-0.5"></div>
                        <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider truncate max-w-full">
                          {sig1.title}
                        </p>
                      </div>

                      {/* Security Verification Badge */}
                      <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white border border-amber-200 shadow-2xs">
                        <QrCode className="w-7 h-7 text-slate-800 shrink-0" />
                        <div className="text-left text-[8.5px] leading-tight text-slate-500 font-mono">
                          <p className="font-bold text-slate-900">VERIFIED NDMU</p>
                          <p>ID: CERT-2026-8492</p>
                        </div>
                      </div>

                      {/* Signatory 2 */}
                      <div className="flex flex-col items-center justify-end text-center relative">
                        <div className="h-9 flex items-end justify-center -mb-2 z-10 pointer-events-none">
                          <img
                            src={activeEvent?.signatory_2_img || SignatureVault.getSignatures().signatory_2_img || DEFAULT_SIG_2_IMG}
                            alt="Signatory 2"
                            className="h-9 max-w-[120px] object-contain"
                          />
                        </div>
                        <p className="font-extrabold text-slate-900 text-xs tracking-wide uppercase z-0 truncate max-w-full">
                          {sig2.name}
                        </p>
                        <div className="w-full border-t border-slate-700 my-0.5"></div>
                        <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider truncate max-w-full">
                          {sig2.title}
                        </p>
                      </div>
                    </>
                  )
                })()}
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
              className="px-4 py-2 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 shrink-0"
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
