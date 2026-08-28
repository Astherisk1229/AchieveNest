import React, { useState } from 'react'
import { 
  X, 
  Download, 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Info, 
  Edit3, 
  BookOpen, 
  Briefcase, 
  ShieldCheck, 
  Sparkles,
  Calendar,
  Building,
  Award
} from 'lucide-react'

/**
 * AchievementPreviewModal.jsx
 * Dual-pane document viewer and NDMU rating allocation details modal for Personnel.
 */
export default function AchievementPreviewModal({
  isOpen,
  achievement,
  onClose,
  onEdit,
  onDownload,
  onResubmit
}) {
  const [zoomLevel, setZoomLevel] = useState(100)
  const [rotation, setRotation] = useState(0)

  if (!isOpen || !achievement) return null

  const isEditable = achievement.canEdit ? achievement.canEdit() : achievement.status !== 'Verified'
  const isReturned = achievement.status === 'Returned'

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 20, 200))
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 20, 60))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        
        {/* Modal Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E7F3E9] border border-[#cbe6d2] text-[#16834a] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#16834a] bg-[#E7F3E9] px-2 py-0.5 rounded border border-[#cbe6d2]">
                  {achievement.ndmu_area || 'Area B: Productivity & Creative Work'}
                </span>
                <span className="text-xs font-semibold text-slate-400">• {achievement.category}</span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900 truncate max-w-lg mt-0.5">
                {achievement.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Dual Pane (60% Left PDF Viewport / 40% Right Details) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 overflow-hidden">
          
          {/* LEFT PANE: DOCUMENT VIEWPORT (3/5 Width) */}
          <div className="lg:col-span-3 bg-slate-900/95 flex flex-col justify-between p-4 relative overflow-hidden">
            
            {/* Viewport Toolbar */}
            <div className="flex items-center justify-between bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-2xl text-slate-300 text-xs border border-slate-700/60 z-10">
              <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1.5 truncate max-w-[200px]">
                <FileText className="w-3.5 h-3.5" />
                {achievement.attached_file_name || 'proof_document.pdf'}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono w-10 text-center text-slate-400">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-slate-700 my-auto mx-1" />
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Simulated High-Fidelity PDF / Document Viewport */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-in-out'
                }}
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-slate-200 text-slate-800 space-y-6 select-none"
              >
                <div className="text-center space-y-2 border-b border-slate-100 pb-6">
                  <div className="w-12 h-12 rounded-full bg-[#E7F3E9] border border-[#cbe6d2] text-[#16834a] mx-auto flex items-center justify-center font-bold">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-black tracking-widest uppercase text-emerald-800">
                    Notre Dame of Marbel University
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Official Accomplishment Proof Document</p>
                </div>

                <div className="space-y-3 text-left">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Title</p>
                    <p className="text-xs font-extrabold text-slate-900 mt-0.5">{achievement.title}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Issuer / Journal</p>
                      <p className="text-[11px] font-semibold text-slate-700 truncate">{achievement.location}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Conferred Date</p>
                      <p className="text-[11px] font-semibold text-slate-700">{achievement.date}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-dashed border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>REF: {achievement.id}</span>
                  <span className="text-emerald-700 font-bold">VERIFIED DIGITAL STAMP</span>
                </div>
              </div>
            </div>

            {/* Bottom Viewport Bar */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-2 pt-2 border-t border-slate-800">
              <span>Preview Mode: High Resolution Vector View</span>
              <button
                type="button"
                onClick={() => onDownload(achievement)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Attachment</span>
              </button>
            </div>

          </div>

          {/* RIGHT PANE: METADATA & RATING SHEET ALLOCATION (2/5 Width) */}
          <div className="lg:col-span-2 p-6 flex flex-col justify-between overflow-y-auto space-y-6 bg-white">
            
            <div className="space-y-5">
              
              {/* Category & Status Badges */}
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-[#E7F3E9] border border-[#cbe6d2] text-[#16834a] text-xs font-extrabold">
                  {achievement.category}
                </span>

                {achievement.status === 'Verified' && (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified
                  </span>
                )}
                {achievement.status === 'Pending Review' && (
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review
                  </span>
                )}
                {achievement.status === 'Returned' && (
                  <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-extrabold flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" /> Returned
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-snug">{achievement.title}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {achievement.description || 'No detailed description provided.'}
                </p>
              </div>

              {/* Returned Evaluator Remarks Box (if applicable) */}
              {isReturned && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                  <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
                    <Info className="w-4 h-4 text-rose-600" />
                    <span>Evaluator Feedback (HR)</span>
                  </div>
                  <p className="text-xs text-rose-700 font-medium leading-relaxed">
                    "{achievement.return_remarks || 'Please upload clear legible proof document with official signature.'}"
                  </p>
                </div>
              )}

              {/* Portfolio Linkage Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-[#16834a]" />
                    <span>Annual Rating Portfolio</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {achievement.portfolio_status || 'Available for Portfolio'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  {achievement.portfolio_name || 'AY 2025-2026 Personnel Ranking Portfolio'}
                </p>
              </div>

              {/* Details Key-Value List */}
              <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" /> Issuing Entity / Venue
                  </span>
                  <span className="font-bold text-slate-800">{achievement.location}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Conferred Date
                  </span>
                  <span className="font-bold text-slate-800">{achievement.date}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Scope / Level
                  </span>
                  <span className="font-bold text-slate-800">{achievement.scope_level || 'Institutional'}</span>
                </div>
              </div>

            </div>

            {/* Bottom Action Footer */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              
              {isReturned && (
                <button
                  type="button"
                  onClick={() => { onResubmit(achievement); onClose() }}
                  className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Re-submit with Corrections</span>
                </button>
              )}

              {isEditable && !isReturned && (
                <button
                  type="button"
                  onClick={() => { onEdit(achievement); onClose() }}
                  className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Accomplishment Details</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onDownload(achievement)}
                className="w-full py-3 rounded-2xl bg-[#E7F3E9] hover:bg-[#e2f2e5] border border-[#cbe6d2] text-[#064e2b] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Proof Document</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
