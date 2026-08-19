import React, { useState, useEffect } from 'react'
import { KeyRound, X, RefreshCw, Copy, Check } from 'lucide-react'

/**
 * ResetPersonnelPasswordModal Component
 * HR Administrative Credential Reset modal for personnel accounts, matching NDMU AchieveNest design.
 */
export default function ResetPersonnelPasswordModal({
  isOpen,
  personnel,
  onClose,
  onConfirmReset
}) {
  const [tempPassword, setTempPassword] = useState('NDMU-Faculty2026!')
  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      handleGenerateRandom()
      setCopied(false)
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen || !personnel) return null

  const handleGenerateRandom = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#'
    let pass = 'NDMU-'
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setTempPassword(pass)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (onConfirmReset) {
        await Promise.resolve(onConfirmReset(personnel, tempPassword))
      }
      setIsSubmitting(false)
      onClose()
    } catch (err) {
      console.error('Password reset failed:', err)
      setIsSubmitting(false)
    }
  }

  const initial = personnel.full_name?.charAt(0) || 'P'
  const deptOrCollege = personnel.department || personnel.college || 'CEAC - College of Engineering, Architecture, and Computing'
  const empId = personnel.employee_id || 'EMP-2026-1042'
  const email = personnel.email || 'faculty@ndmu.edu.ph'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150 font-sans">
          {/* Modal Header */}
          <div className="p-6 bg-[#1b4332] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-extrabold text-sm shrink-0 border border-amber-400/30">
                <KeyRound className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Reset Personnel Password</h3>
                <p className="text-xs text-emerald-200/90 font-medium">HR Administrative Credential Reset</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Target Personnel Profile Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              {personnel.avatar_url ? (
                <img
                  src={personnel.avatar_url}
                  alt={personnel.full_name}
                  className="w-10 h-10 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#1b4332] dark:bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{personnel.full_name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  ID: {empId} • {deptOrCollege}
                </p>
                <p className="text-[11px] text-[#2d8a4e] dark:text-emerald-400 font-semibold truncate">{email}</p>
              </div>
            </div>

            {/* Password Input & Generator */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>New Temporary Password</span>
                <button
                  type="button"
                  onClick={handleGenerateRandom}
                  className="text-[#2d8a4e] dark:text-emerald-400 hover:underline text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate Random</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#2d8a4e]"
                />

                <button
                  type="button"
                  onClick={handleCopy}
                  className="absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Security Notice Callout */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
              The personnel member will be prompted to change this temporary password upon their next login attempt.
            </div>

            {/* Submit Buttons Footer */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143326] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 transition cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-amber-300" />
                <span>{isSubmitting ? 'Resetting Password...' : 'Confirm Password Reset'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
