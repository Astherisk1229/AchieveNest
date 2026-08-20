/**
 * dialog.jsx
 * shadcn-style Dialog / Modal Component System.
 */

import React, { createContext, useContext } from 'react'
import { X } from 'lucide-react'

const DialogContext = createContext({
  isOpen: false,
  onClose: () => {}
})

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null

  const handleClose = () => {
    if (onOpenChange) onOpenChange(false)
  }

  return (
    <DialogContext.Provider value={{ isOpen: open, onClose: handleClose }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
        {children}
      </div>
    </DialogContext.Provider>
  )
}

export function DialogContent({ className = '', children, ...props }) {
  const { onClose } = useContext(DialogContext)

  return (
    <div
      className={`relative bg-white dark:bg-[#131e2e] w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-6 space-y-4 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 ${className}`}
      {...props}
    >
      {children}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        aria-label="Close dialog"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function DialogHeader({ className = '', children, ...props }) {
  return (
    <div className={`space-y-1 text-left ${className}`} {...props}>
      {children}
    </div>
  )
}

export function DialogTitle({ className = '', children, ...props }) {
  return (
    <h2 className={`text-lg font-extrabold tracking-tight text-slate-900 dark:text-white ${className}`} {...props}>
      {children}
    </h2>
  )
}

export function DialogDescription({ className = '', children, ...props }) {
  return (
    <p className={`text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  )
}

export function DialogFooter({ className = '', children, ...props }) {
  return (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 ${className}`} {...props}>
      {children}
    </div>
  )
}
