import React from 'react'
import AchieveNestLogo from './AchieveNestLogo'
import { BRAND } from '../../config/brand'

export default function BrandLockup({ compact = false, subtitle = BRAND.portalLabel, className = '' }) {
  if (compact) return <span className={`inline-flex items-center justify-center ${className}`}><AchieveNestLogo variant="mark" size="compact" /></span>
  return <span className={`inline-flex min-w-0 flex-col items-start ${className}`}><AchieveNestLogo variant="horizontal" size="sidebar" /><span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[.14em] text-emerald-800 dark:text-emerald-300">{subtitle}</span></span>
}
