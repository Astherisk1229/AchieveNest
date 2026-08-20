/**
 * avatar.jsx
 * Premium Avatar Component System for AchieveNest.
 * Includes Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount.
 */

import React, { useState, createContext, useContext } from 'react'

const AvatarContext = createContext({
  hasImageLoaded: false,
  setHasImageLoaded: () => {},
  hasImageError: false,
  setHasImageError: () => {},
  size: 'default'
})

export function Avatar({ size = 'default', className = '', children, ...props }) {
  const [hasImageLoaded, setHasImageLoaded] = useState(false)
  const [hasImageError, setHasImageError] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    default: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl'
  }

  return (
    <AvatarContext.Provider
      value={{
        hasImageLoaded,
        setHasImageLoaded,
        hasImageError,
        setHasImageError,
        size
      }}
    >
      <div
        className={`relative inline-flex items-center justify-center shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold select-none ${
          sizeClasses[size] || sizeClasses.default
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    </AvatarContext.Provider>
  )
}

export function AvatarImage({ src, alt = '', className = '', ...props }) {
  const { setHasImageLoaded, setHasImageError, hasImageError } = useContext(AvatarContext)

  if (!src || hasImageError) return null

  return (
    <img
      src={src}
      alt={alt}
      onLoad={() => setHasImageLoaded(true)}
      onError={() => setHasImageError(true)}
      className={`w-full h-full object-cover rounded-full ${className}`}
      {...props}
    />
  )
}

export function AvatarFallback({ children, className = '', ...props }) {
  const { hasImageLoaded, hasImageError } = useContext(AvatarContext)

  // Show fallback if image has not loaded or has errored
  if (hasImageLoaded && !hasImageError) return null

  return (
    <div
      className={`w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-600 to-[#1b4332] text-white font-extrabold shadow-inner ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function AvatarBadge({ children, className = '', ...props }) {
  return (
    <span
      className={`absolute bottom-0 right-0 z-10 flex items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-950 text-white text-[10px] font-bold p-0.5 bg-emerald-500 min-w-3 min-h-3 ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

export function AvatarGroup({ children, className = '', ...props }) {
  return (
    <div className={`flex items-center -space-x-3 overflow-hidden ${className}`} {...props}>
      {children}
    </div>
  )
}

export function AvatarGroupCount({ children, className = '', ...props }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full bg-slate-200 dark:bg-slate-800 ring-2 ring-white dark:ring-slate-950 text-slate-700 dark:text-slate-300 font-extrabold text-xs px-2.5 py-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
