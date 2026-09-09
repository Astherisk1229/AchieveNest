import React from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'

/**
 * OSADPageHeader
 * Standardized header component for all OSAD pages and detail views.
 * 
 * Supports:
 * - Single semantic <h1>
 * - Semantic <nav aria-label="Breadcrumb">
 * - Back button integration
 * - Optional icon container
 * - Optional badge / metadata tag
 * - Optional explanatory description
 * - Primary action & secondary action slots
 * - Responsive flex/stack layout
 */
export default function OSADPageHeader({
  title,
  description,
  icon: Icon,
  badge,
  eyebrow,
  breadcrumbs,
  onBack,
  backLabel = 'Back',
  primaryAction,
  secondaryActions,
  children,
  variant = 'default', // 'default' | 'detail' | 'workspace' | 'compact'
  className = ''
}) {
  const isDetail = variant === 'detail' || Boolean(breadcrumbs) || Boolean(onBack)

  return (
    <header
      className={`bg-white dark:bg-[#131e2e] ${
        isDetail ? 'p-5 sm:p-6 rounded-2xl sm:rounded-3xl border-b sm:border border-slate-200/80 dark:border-slate-800' : 'p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800'
      } shadow-xs sm:shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans ${className}`}
    >
      <div className="space-y-1.5 flex-1 min-w-0">
        {/* Eyebrow / Breadcrumbs */}
        {(breadcrumbs || onBack || eyebrow) && (
          <div className="flex items-center gap-2 flex-wrap">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label={backLabel}
                title={backLabel}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs transition cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {breadcrumbs && Array.isArray(breadcrumbs) && breadcrumbs.length > 0 ? (
              <nav aria-label="Breadcrumb">
                <ol className="flex items-center gap-1.5 text-xs flex-wrap">
                  {breadcrumbs.map((crumb, idx) => {
                    const isLast = idx === breadcrumbs.length - 1
                    return (
                      <li key={crumb.label || idx} className="flex items-center gap-1.5">
                        {crumb.onClick || crumb.href ? (
                          <button
                            type="button"
                            onClick={crumb.onClick}
                            className="font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                          >
                            {crumb.label}
                          </button>
                        ) : (
                          <span
                            className={
                              isLast
                                ? 'font-bold text-slate-900 dark:text-white'
                                : 'font-medium text-slate-500 dark:text-slate-400'
                            }
                            aria-current={isLast ? 'page' : undefined}
                          >
                            {crumb.label}
                          </span>
                        )}
                        {!isLast && (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                        )}
                      </li>
                    )
                  })}
                </ol>
              </nav>
            ) : typeof breadcrumbs === 'object' && breadcrumbs !== null ? (
              <nav aria-label="Breadcrumb">{breadcrumbs}</nav>
            ) : null}

            {eyebrow && typeof eyebrow === 'string' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-[#16834a] dark:text-emerald-400 text-xs font-semibold border border-emerald-200/60 dark:border-emerald-800/40">
                {eyebrow}
              </span>
            ) : eyebrow ? (
              eyebrow
            ) : null}
          </div>
        )}

        {/* Title + Icon + Badge Line */}
        <div className="flex items-center gap-3 flex-wrap">
          {Icon && (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </div>
          )}

          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight break-words">
              {title}
            </h1>

            {badge && typeof badge === 'string' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-[#16834a] dark:text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider border border-emerald-200/60 dark:border-emerald-800/50">
                {badge}
              </span>
            ) : badge ? (
              badge
            ) : null}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </div>

      {/* Action Zone: Primary + Secondary / Controls */}
      {(primaryAction || secondaryActions || children) && (
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto shrink-0">
          {secondaryActions}
          {children}
          {primaryAction}
        </div>
      )}
    </header>
  )
}
