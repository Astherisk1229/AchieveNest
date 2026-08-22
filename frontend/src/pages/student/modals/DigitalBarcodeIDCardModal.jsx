import React, { useState } from 'react'
import { X, QrCode, Shield, Sparkles, Scan, CheckCircle2, Download } from 'lucide-react'

export default function DigitalBarcodeIDCardModal({ user, isOpen, onClose }) {
  const student = user || {
    full_name: 'Maria Santos',
    student_id: '2024-01234',
    program: 'BS Information Technology',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  }

  if (!isOpen) return null

  const barcodeValue = student.student_id || '2024-01234'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#16834a] bg-[#eef7f0] px-3 py-1 rounded-full border border-[#cbe6d2]">
            Digital Campus Pass
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-2">NDMU Digital Barcode ID</h3>
          <p className="text-xs text-slate-500">Official Campus Event Attendance & Scan Card</p>
        </div>

        {/* Digital ID Card Preview */}
        <div className="rounded-2xl bg-gradient-to-br from-[#12361e] via-[#064e2b] to-[#0d2816] text-white p-6 shadow-xl border border-[#A9C6B1] relative overflow-hidden space-y-6">
          
          {/* Card Top Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="#0f4625" stroke="#f59e0b" strokeWidth="4"/>
                  <circle cx="50" cy="50" r="28" fill="#ffffff" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">Notre Dame of Marbel University</p>
                <p className="text-[9px] text-emerald-200/70 uppercase tracking-widest font-mono">Student Identification</p>
              </div>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase">
              VALID
            </span>
          </div>

          {/* Student Info Row */}
          <div className="flex items-center gap-4 pt-2">
            <img
              src={student.avatar_url}
              alt={student.full_name}
              className="w-16 h-16 rounded-xl object-cover border-2 border-amber-400/60 shadow-md shrink-0"
            />
            <div>
              <h4 className="text-base font-extrabold text-white leading-tight">{student.full_name}</h4>
              <p className="text-xs text-emerald-200 font-medium mt-0.5">{student.program}</p>
              <p className="text-xs font-mono font-bold text-amber-300 mt-1">ID: {barcodeValue}</p>
            </div>
          </div>

          {/* Code 128 High-Contrast Barcode Render Area */}
          <div className="bg-white p-4 rounded-xl text-center shadow-inner text-slate-900 space-y-1">
            <div className="h-14 w-full flex items-center justify-center gap-1">
              {[4, 2, 6, 2, 4, 8, 2, 4, 6, 2, 4, 2, 6, 4, 2, 8, 4, 2, 6, 2, 4, 6, 2, 8, 4, 2, 6, 4].map((width, idx) => (
                <div
                  key={idx}
                  className="h-full bg-slate-900"
                  style={{ width: `${width}px` }}
                ></div>
              ))}
            </div>
            <p className="font-mono font-extrabold text-xs tracking-widest text-slate-900">{barcodeValue}</p>
          </div>

          <div className="flex items-center justify-between text-[10px] text-emerald-200/70 border-t border-emerald-800/60 pt-3">
            <span>Scan at OSAD Event Scanners</span>
            <span className="font-mono text-amber-300 font-bold">AY 2025-2026</span>
          </div>

        </div>

        {/* Modal Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
          >
            Close Card
          </button>
        </div>

      </div>
    </div>
  )
}
