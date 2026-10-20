import React from 'react'
import { ChevronRight } from 'lucide-react'
import OSADPageHeader from './OSADPageHeader'

export default function OSADAwardPageShell({
  title,
  description,
  icon,
  badge,
  breadcrumbs = [],
  actions,
  embedded = false,
  children
}) {
  const PageContainer = embedded ? 'div' : 'main'
  return (
    <PageContainer className={`mx-auto max-w-7xl space-y-5 font-sans${embedded ? '' : ' pb-16'}`} aria-labelledby="osad-award-page-title">
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="overflow-x-auto">
          <ol className="flex min-w-max items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            {breadcrumbs.map((item, index) => (
              <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                {index > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
                {item.onClick ? (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="inline-flex min-h-12 items-center rounded-md px-3 py-2 font-medium hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined} className="px-2 py-2 font-medium text-slate-700 dark:text-slate-200">
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div id="osad-award-page-title">
        <OSADPageHeader
          title={title}
          description={description}
          icon={icon}
          badge={badge}
          secondaryActions={actions}
        />
      </div>

      {children}
    </PageContainer>
  )
}
