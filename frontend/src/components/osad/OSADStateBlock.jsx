/**
 * OSADStateBlock.jsx
 * Standardized, accessible, and responsive state blocks for OSAD views:
 * - OSADLoadingState (loading / in-progress async fetch with role="status")
 * - OSADEmptyState (true empty dataset with context-specific explanation and permission-safe CTA)
 * - OSADSearchEmptyState (0 results from search/filters with reset/clear action)
 * - OSADErrorState (API / network failure with role="alert" and safe retry)
 * - OSADPermissionState (401/403 or unauthorized access with safe navigation)
 */

import React from 'react'
import {
  RotateCcw,
  Search,
  AlertCircle,
  ShieldAlert,
  Inbox,
  ArrowLeft,
  RefreshCw,
  Plus
} from 'lucide-react'

/**
 * OSADLoadingState
 * Renders an accessible loading skeleton or spinner block
 */
export function OSADLoadingState({
  message = 'Loading data...',
  subMessage = 'Please wait while we retrieve the latest information.',
  variant = 'spinner', // 'spinner' | 'skeleton' | 'card'
  className = ''
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`p-10 text-center rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 font-sans ${className}`}
    >
      {variant === 'spinner' ? (
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-9 h-9 border-3 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{message}</p>
            {subMessage && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">{subMessage}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-w-xl mx-auto animate-pulse">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4 mx-auto" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-1/2 mx-auto" />
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          </div>
          <span className="sr-only">{message}</span>
        </div>
      )}
    </div>
  )
}

/**
 * OSADEmptyState
 * Renders an empty dataset state when zero canonical records exist
 */
export function OSADEmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are currently no records in this dataset.',
  actionLabel = null,
  onAction = null,
  actionIcon: ActionIcon = Plus,
  className = ''
}) {
  return (
    <div
      className={`p-10 text-center rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 font-sans max-w-3xl mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto shadow-2xs">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto font-normal">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAction}
            className="px-4 py-2 rounded-xl bg-[#16834a] hover:bg-[#126b3c] text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <ActionIcon className="w-3.5 h-3.5" />
            <span>{actionLabel}</span>
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * OSADSearchEmptyState
 * Renders a state when a query or filter yields 0 matches
 */
export function OSADSearchEmptyState({
  title = 'No matching results',
  description = 'No records match your current search query or active filter criteria.',
  onReset = null,
  resetLabel = 'Reset Filters & Search',
  className = ''
}) {
  return (
    <div
      className={`p-10 text-center rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 font-sans max-w-3xl mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/50 flex items-center justify-center mx-auto shadow-2xs">
        <Search className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto font-normal">
          {description}
        </p>
      </div>
      {onReset && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>{resetLabel}</span>
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * OSADErrorState
 * Renders an API failure / network error block with role="alert" and safe retry
 */
export function OSADErrorState({
  title = 'Unable to Load Data',
  message = 'An unexpected error occurred while communicating with the server.',
  onRetry = null,
  retryLabel = 'Retry Request',
  className = ''
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`p-8 text-center rounded-2xl bg-white dark:bg-[#131e2e] border border-rose-200 dark:border-rose-900/60 shadow-2xs space-y-3 font-sans max-w-3xl mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center mx-auto shadow-2xs">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto font-medium">
          {message}
        </p>
      </div>
      {onRetry && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>{retryLabel}</span>
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * OSADPermissionState
 * Renders a permission denied / unauthorized access notice with safe recovery
 */
export function OSADPermissionState({
  title = 'Access Restricted',
  message = 'You do not have permission to view or manage this section.',
  onBack = null,
  backLabel = 'Go Back',
  className = ''
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`p-10 text-center rounded-2xl bg-white dark:bg-[#131e2e] border border-amber-200 dark:border-amber-900/60 shadow-2xs space-y-3 font-sans max-w-3xl mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center mx-auto shadow-2xs">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto font-normal">
          {message}
        </p>
      </div>
      {onBack && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backLabel}</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default {
  OSADLoadingState,
  OSADEmptyState,
  OSADSearchEmptyState,
  OSADErrorState,
  OSADPermissionState
}
