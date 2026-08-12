import React, { useState, useRef, useEffect } from 'react'
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
  onPreviewCertificates,
  onExportCSV,
  onArchiveEvent
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHiddenByScroll, setIsHiddenByScroll] = useState(false)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  const updateMenuPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const headerHeight = 70 // Height of top stationary header bar
      const menuWidth = 224 // w-56 in px

      // Check if trigger button is overlapped by top header or scrolled off screen
      const isOverlapped = rect.top < headerHeight || rect.bottom < headerHeight || rect.top > window.innerHeight

      if (isOverlapped) {
        setIsHiddenByScroll(true)
      } else {
        setIsHiddenByScroll(false)
        let left = rect.right - menuWidth
        if (left < 16) left = 16 // Prevent overflow off left screen edge

        setMenuPos({
          top: rect.bottom + 6,
          left: left
        })
      }
    }
  }

  const handleToggle = (e) => {
    e.stopPropagation()
    if (!isOpen) {
      updateMenuPosition()
    }
    setIsOpen(!isOpen)
  }

  // Handle outside clicks, scrolling, and window resizing
  useEffect(() => {
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

    // Initial position update on open
    updateMenuPosition()

    document.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
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
            top: `${menuPos.top}px`,
            left: `${menuPos.left}px`,
            display: isHiddenByScroll ? 'none' : 'block',
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
            className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-emerald-50 hover:text-[#2d8a4e] font-bold flex items-center gap-2.5 transition cursor-pointer"
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
            className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-emerald-50 hover:text-[#2d8a4e] font-bold flex items-center gap-2.5 transition cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-[#2d8a4e] shrink-0" />
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
              className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-emerald-50 hover:text-[#2d8a4e] font-bold flex items-center gap-2.5 transition cursor-pointer"
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
            className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-emerald-50 hover:text-[#2d8a4e] font-bold flex items-center gap-2.5 transition cursor-pointer"
          >
            <Edit className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Edit Event Details</span>
          </button>

          {/* Option 5: Preview Certificates & Auto-Dispatch Status */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              if (onPreviewCertificates) onPreviewCertificates(event)
            }}
            className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-emerald-50 hover:text-[#2d8a4e] font-bold flex items-center gap-2.5 transition cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Certificate & Auto-Dispatch</span>
          </button>

          {/* Option 6: Export Attendance CSV */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              if (onExportCSV) onExportCSV(event)
            }}
            className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-emerald-50 hover:text-[#2d8a4e] font-bold flex items-center gap-2.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Export Attendance CSV</span>
          </button>

          <div className="my-1 border-t border-slate-100"></div>

          {/* Option 7: Archive Event */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              if (onArchiveEvent) onArchiveEvent(event?.id)
            }}
            className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2.5 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Archive Event</span>
          </button>

        </div>,
        document.body
      )}

    </div>
  )
}
