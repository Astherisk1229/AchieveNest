import React from 'react'
import { achievenestHorizontalLogo, achievenestMark, achievenestStackedLogo } from '../../assets/brand'
import { BRAND } from '../../config/brand'

const VARIANTS = Object.freeze({
  horizontal: achievenestHorizontalLogo,
  stacked: achievenestStackedLogo,
  mark: achievenestMark,
})

const SIZES = Object.freeze({
  compact: 'h-8 w-auto max-w-full',
  sidebar: 'h-10 w-auto max-w-[164px]',
  auth: 'h-16 w-auto max-w-full sm:h-[72px]',
  document: 'h-12 w-auto max-w-full',
  splash: 'h-20 w-auto max-w-full',
})

export default function AchieveNestLogo({ variant = 'horizontal', size = 'sidebar', decorative = false, className = '' }) {
  const source = VARIANTS[variant]
  if (!source) throw new Error(`Unsupported AchieveNest logo variant: ${variant}`)
  const sizeClass = SIZES[size]
  if (!sizeClass) throw new Error(`Unsupported AchieveNest logo size: ${size}`)

  return <img src={source} alt={decorative ? '' : BRAND.productName} aria-hidden={decorative || undefined} draggable="false" className={`block shrink-0 object-contain ${sizeClass} ${className}`} />
}
