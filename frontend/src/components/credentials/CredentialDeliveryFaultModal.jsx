import React from 'react'
import { AlertCircle, RefreshCw, X } from 'lucide-react'
import { Button } from '../ui/button'

export default function CredentialDeliveryFaultModal({
  isOpen,
  fault,
  onRefreshAndClose
}) {
  if (!isOpen || !fault) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9998]"
        aria-hidden="true"
      />

      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delivery-fault-title"
        aria-describedby="delivery-fault-desc"
      >
        <div className="bg-white dark:bg-[#131e2e] border border-rose-200 dark:border-rose-900/50 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-slate-900 dark:text-slate-100">
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                Action Required
              </span>
              <h2 id="delivery-fault-title" className="text-lg font-black mt-1 text-rose-900 dark:text-rose-300">
                Credential Presentation Fault
              </h2>
            </div>
          </div>

          <div
            id="delivery-fault-desc"
            className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2"
          >
            <p className="font-bold text-slate-800 dark:text-slate-200">
              The account was created, but its temporary credential could not be safely displayed.
            </p>
            <p className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900/30">
              <strong>Do not create the account again.</strong> Refresh the account list, verify the new record, and use the authorized Reset Temporary Password process to issue a new one-time credential.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button
              type="button"
              variant="default"
              onClick={onRefreshAndClose}
              className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Account List</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
