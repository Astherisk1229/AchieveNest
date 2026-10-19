import React, { useState, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  MoreVertical,
  Eye,
  QrCode,
  Edit,
  Award,
  FileSpreadsheet,
  Trash2,
  Camera
} from 'lucide-react'

export default function EventCardOptionsMenu({
  event,
  onViewDetails,
  onMonitorAttendance,
  onLaunchScanner,
  onEditEvent,
  onViewCertificates,
  onExportCSV,
  onCancelEvent
}) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const [menuPos, setMenuPos] = useState(null)

  const updateMenuPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuWidth = 224 // w-56 in px
      const margin = 8
      // scrollHeight stays stable after the menu is constrained to the viewport.
      const menuHeight = menuRef.current?.scrollHeight || 380
      const roomBelow = Math.max(0, window.innerHeight - rect.bottom - margin)
      const roomAbove = Math.max(0, rect.top - margin)
      const openAbove = roomBelow < menuHeight && roomAbove > roomBelow
      const availableHeight = Math.max(120, openAbove ? roomAbove : roomBelow)
      const maxHeight = Math.min(menuHeight, availableHeight)
      const left = Math.max(margin, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - margin))
      const top = openAbove
        ? Math.max(margin, rect.top - maxHeight - 6)
        : Math.min(rect.bottom + 6, window.innerHeight - maxHeight - margin)

      setMenuPos({ top, left, maxHeight })
    }
  }

  const handleToggle = (e) => {
    e.stopPropagation()
    if (!isOpen) {
      // Position before mounting the portal so it never flashes at (0, 0) or
      // renders with a zero-height viewport constraint.
      updateMenuPosition()
      setIsOpen(true)
      return
    }
    setIsOpen(false)
  }

  // Handle outside clicks, scrolling, and window resizing
  useLayoutEffect(() => {
    if (!isOpen) return

    const handleOutsideClick = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }

    const handleScrollOrResize = () => {
      updateMenuPosition()
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    // Initial position update on open
    updateMenuPosition()

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
  }, [isOpen])

  return (
    <div className="inline-block" onClick={(e) => e.stopPropagation()}>
      
      {/* 3-Dots Options Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="p-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 transition cursor-pointer shadow-xs z-10"
        title="Event Options & Actions"
        aria-label="Event Options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Render Dropdown via Portal to Body to prevent card clipping & handle fixed header overlap */}
      {isOpen && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${menuPos?.top ?? 8}px`,
            left: `${menuPos?.left ?? 8}px`,
            width: '224px',
            maxHeight: `${menuPos?.maxHeight ?? Math.max(120, window.innerHeight - 16)}px`,
            overflowY: 'auto',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            zIndex: 9999
          }}
          className="w-56 rounded-2xl bg-white border border-slate-200/90 shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-150 font-sans text-xs select-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Quick Event Actions</p>
            <p className="font-bold text-slate-800 truncate text-[11px] mt-0.5">{event?.title}</p>
          </div>

          {/* Option 1: Preview / View Event Details */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              if (onViewDetails) onViewDetails(event)
            }}
            className="w-full px-3.5 py-2 text-left text-emerald-950 hover:bg-emerald-50 hover:text-[#16834a] font-bold flex items-center gap-2.5 transition cursor-pointer"
          >
            <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Preview Event Details</span>
          </button>

          {/* Option 2: Monitor Attendance Session */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              if (onMonitorAttendance) onMonitorAttendance(event?.id)
            }}
            className="w-full px-3.5 py-2 text-left text-emerald-950 hover:bg-emerald-50 hover:text-[#16834a] font-bold flex items-center gap-2.5 transition cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-[#16834a] shrink-0" />
            <span>Monitor Live Attendance</span>
          </button>

          {/* Option 3: Launch Officer QR Scanner */}
          {onLaunchScanner && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onLaunchScanner(event)
              }}
              className="w-full px-3.5 py-2 text-left text-emerald-950 hover:bg-emerald-50 hover:text-[#16834a] font-bold flex items-center gap-2.5 transition cursor-pointer"
            >
              <Camera className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Launch QR Scanner</span>
            </button>
          )}

          {/* Option 4: Edit Event Details */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              if (onEditEvent) onEditEvent(event)
            }}
            className="w-full px-3.5 py-2 text-left text-emerald-950 hover:bg-emerald-50 hover:text-[#16834a] font-bold flex items-center gap-2.5 transition cursor-pointer"
          >
            <Edit className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Edit Event Details</span>
          </button>

          {/* Option 5: View automatic attendance certificates */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              if (onViewCertificates) onViewCertificates(event)
            }}
            className="w-full px-3.5 py-2 text-left text-emerald-950 hover:bg-emerald-50 hover:text-[#16834a] font-bold flex items-center gap-2.5 transition cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-600 shrink-0" />
            <span>View Attendance Certificates</span>
          </button>

          {/* Option 6: Export Attendance CSV */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              if (onExportCSV) onExportCSV(event)
            }}
              className="w-full px-3.5 py-2 text-left text-emerald-950 hover:bg-emerald-50 hover:text-[#16834a] font-bold flex items-center gap-2.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Export Attendance CSV</span>
          </button>

          <div className="my-1 border-t border-slate-100"></div>

          {/* Option 7: Cancel Event */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              if (onCancelEvent) onCancelEvent(event?.id)
            }}
            className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2.5 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Cancel Event</span>
          </button>

        </div>,
        document.body
      )}

    </div>
  )
}
