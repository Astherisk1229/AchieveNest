import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Eye, Edit3, KeyRound, Award } from 'lucide-react'

export default function PersonnelActionsMenu({
  isOpen,
  onClose,
  triggerRef,
  personnel,
  handleSelect,
  onEditAssignment,
  onPromoteRank,
  onResetPassword
}) {
  const menuRef = useRef(null)
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, visibility: 'hidden' })

  const updatePosition = () => {
    if (!triggerRef?.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const menuWidth = 208 // w-52 in px
    const menuHeight = 180 // Approximate menu height in px
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Calculate vertical position (flip up if insufficient room below)
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    let top = rect.bottom + 6

    if (spaceBelow < menuHeight + 12 && spaceAbove > spaceBelow) {
      top = rect.top - menuHeight - 6
    }

    // Calculate horizontal position (right aligned to trigger button)
    let left = rect.right - menuWidth

    // Clamp horizontally within 12px viewport margins
    if (left < 12) left = 12
    if (left + menuWidth > viewportWidth - 12) left = viewportWidth - menuWidth - 12

    setMenuStyle({
      top: `${Math.max(12, top)}px`,
      left: `${left}px`,
      visibility: 'visible'
    })
  }

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleOutsideClick = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        onClose()
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        triggerRef.current?.focus()
      }
    }

    const handleScrollOrResize = () => {
      onClose()
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [isOpen, onClose, triggerRef])

  if (!isOpen || !personnel) return null

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={`Actions for ${personnel.full_name || 'personnel'}`}
      style={{
        position: 'fixed',
        top: menuStyle.top,
        left: menuStyle.left,
        visibility: menuStyle.visibility,
        zIndex: 9999
      }}
      className="w-52 rounded-2xl bg-white dark:bg-[#182638] border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-left divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150 font-sans text-xs select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1">
        {typeof handleSelect === 'function' && (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onClose()
              handleSelect(personnel)
            }}
            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[#1b4332] dark:text-emerald-400 shrink-0" />
            <span>View personnel profile</span>
          </button>
        )}

        {typeof onEditAssignment === 'function' && (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onClose()
              onEditAssignment(personnel)
            }}
            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
            <span>Edit assignment</span>
          </button>
        )}
      </div>

      <div className="py-1">
        {typeof onPromoteRank === 'function' && (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onClose()
              onPromoteRank(personnel)
            }}
            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
          >
            <Award className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
            <span>Record rank change</span>
          </button>
        )}

        {typeof onResetPassword === 'function' && (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onClose()
              onResetPassword(personnel)
            }}
            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
            <span>Reset password</span>
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}
