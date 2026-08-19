import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight, Info, ChevronDown, Check } from 'lucide-react'

export default function CustomDatePicker({
  id = 'employmentStartDate',
  value = '',
  onChange,
  label = 'Employment Start Date',
  helperText = null,
  minDate = '1970-01-01',
  maxDate,
  required = false,
  error = null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMonthListOpen, setIsMonthListOpen] = useState(false)
  const [isYearListOpen, setIsYearListOpen] = useState(false)
  const [portalTarget, setPortalTarget] = useState(null)

  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    placement: 'bottom-start',
    maxHeight: undefined,
    visibility: 'hidden'
  })

  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)
  const monthTriggerRef = useRef(null)
  const yearTriggerRef = useRef(null)
  const yearListRef = useRef(null)
  const selectedYearItemRef = useRef(null)

  // SSR-safe portal target resolution
  useEffect(() => {
    setPortalTarget(document.getElementById('overlay-root') || document.body)
  }, [])

  // Default maxDate to +1 year from today if not specified
  const today = new Date()
  const defaultMaxDate = maxDate || new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0]

  // Parse initial selected date or default to view date
  const parsedValueDate = value ? new Date(value + 'T00:00:00') : today
  const [viewDate, setViewDate] = useState(parsedValueDate)

  // Sync viewDate when value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00')
      if (!isNaN(d.getTime())) {
        setViewDate(d)
      }
    }
  }, [value])

  // --- TWO-PASS REAL MEASUREMENT & STRICT WINDOW BOUNDARY CLAMPING ---
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !popoverRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const popoverHeight = popoverRef.current.offsetHeight || 260
    const popoverWidth = popoverRef.current.offsetWidth || 320

    const windowHeight = window.innerHeight
    const windowWidth = window.innerWidth

    const GAP = 8
    const PADDING = 12

    const spaceBelow = windowHeight - triggerRect.bottom - GAP
    const spaceAbove = triggerRect.top - GAP

    // Flip decision: If space below is less than popoverHeight, flip to top if space above is larger
    const side = (spaceBelow < popoverHeight && spaceAbove > spaceBelow) ? 'top' : 'bottom'

    let calculatedTop = side === 'bottom'
      ? triggerRect.bottom + GAP
      : triggerRect.top - popoverHeight - GAP

    // HARD CLAMP: Guarantee popover NEVER exits top or bottom of browser window
    calculatedTop = Math.max(PADDING, Math.min(calculatedTop, windowHeight - popoverHeight - PADDING))

    // Horizontal placement start-aligned with trigger, clamped inside window boundary
    let calculatedLeft = triggerRect.left
    calculatedLeft = Math.max(PADDING, Math.min(calculatedLeft, windowWidth - popoverWidth - PADDING))

    setPosition({
      top: calculatedTop,
      left: calculatedLeft,
      placement: side === 'bottom' ? 'bottom-start' : 'top-start',
      visibility: 'visible'
    })
  }, [])

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition()
    }
  }, [isOpen, viewDate, updatePosition])

  // --- CAPTURE-PHASE EXTERNAL SCROLL DISMISSAL ---
  useEffect(() => {
    if (!isOpen) return

    const handleScroll = (event) => {
      const path = event.composedPath ? event.composedPath() : []
      const isInternal = [popoverRef.current, containerRef.current].filter(Boolean).some(el => path.includes(el))

      if (isInternal) return

      // External scroll -> close complete datepicker stack cleanly
      setIsOpen(false)
      setIsMonthListOpen(false)
      setIsYearListOpen(false)
    }

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    window.addEventListener('resize', updatePosition, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true })
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, updatePosition])

  // --- LAYERED KEYBOARD & OUTSIDE CLICK DISMISSAL ---
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return

      // Layer 1: Close nested Month or Year Listbox first
      if (isYearListOpen) {
        event.preventDefault()
        event.stopPropagation()
        setIsYearListOpen(false)
        if (yearTriggerRef.current) yearTriggerRef.current.focus()
        return
      }

      if (isMonthListOpen) {
        event.preventDefault()
        event.stopPropagation()
        setIsMonthListOpen(false)
        if (monthTriggerRef.current) monthTriggerRef.current.focus()
        return
      }

      // Layer 2: Close Calendar Popover & restore focus to main date trigger
      event.preventDefault()
      event.stopPropagation()
      setIsOpen(false)
      if (triggerRef.current) triggerRef.current.focus()
    }

    const handleClickOutside = (event) => {
      const path = event.composedPath ? event.composedPath() : []
      const isInside = [popoverRef.current, containerRef.current].filter(Boolean).some(el => path.includes(el))

      if (!isInside) {
        setIsOpen(false)
        setIsMonthListOpen(false)
        setIsYearListOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('mousedown', handleClickOutside, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('mousedown', handleClickOutside, true)
    }
  }, [isOpen, isMonthListOpen, isYearListOpen])

  // Scroll selected year into view when year listbox opens
  useLayoutEffect(() => {
    if (isYearListOpen && selectedYearItemRef.current && yearListRef.current) {
      const optionTop = selectedYearItemRef.current.offsetTop
      const optionHeight = selectedYearItemRef.current.offsetHeight
      const listboxHeight = yearListRef.current.clientHeight
      yearListRef.current.scrollTop = optionTop - listboxHeight / 2 + optionHeight / 2
    }
  }, [isYearListOpen])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Calendar Day Calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1))
  }

  const handleSelectYear = (selectedY) => {
    setViewDate(new Date(selectedY, month, 1))
    setIsYearListOpen(false)
  }

  const handleSelectMonth = (selectedM) => {
    setViewDate(new Date(year, selectedM, 1))
    setIsMonthListOpen(false)
  }

  const formatDateString = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    return `${y}-${mm}-${dd}`
  }

  const handleSelectDay = (d) => {
    const dateStr = formatDateString(year, month, d)
    if (isDisabled(dateStr)) return
    if (onChange) onChange(dateStr)
    setIsOpen(false)
  }

  const handleSelectToday = () => {
    const y = today.getFullYear()
    const m = today.getMonth()
    const d = today.getDate()
    const dateStr = formatDateString(y, m, d)
    if (isDisabled(dateStr)) return
    if (onChange) onChange(dateStr)
    setViewDate(today)
    setIsOpen(false)
  }

  const isDisabled = (dateStr) => {
    if (minDate && dateStr < minDate) return true
    if (defaultMaxDate && dateStr > defaultMaxDate) return true
    return false
  }

  // Format readable label string (e.g. "August 19, 2026")
  const getFormattedDisplayDate = () => {
    if (!value) return 'Select Date'
    const d = new Date(value + 'T00:00:00')
    if (isNaN(d.getTime())) return value
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  // Check if selected date is a weekend
  const isWeekend = () => {
    if (!value) return false
    const d = new Date(value + 'T00:00:00')
    const dayOfWeek = d.getDay()
    return dayOfWeek === 0 || dayOfWeek === 6 // 0 = Sunday, 6 = Saturday
  }

  // Generate Calendar Grid Cells
  const calendarCells = []

  // Prev Month Days Padding
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const pDay = daysInPrevMonth - i
    calendarCells.push(
      <div key={`prev-${pDay}`} className="h-8.5 w-8.5 mx-auto flex items-center justify-center text-slate-300 dark:text-slate-700 text-xs font-medium cursor-not-allowed">
        {pDay}
      </div>
    )
  }

  // Current Month Days
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDateStr = formatDateString(year, month, d)
    const isSelected = value === cellDateStr
    const isTodayCell = formatDateString(today.getFullYear(), today.getMonth(), today.getDate()) === cellDateStr
    const disabled = isDisabled(cellDateStr)

    calendarCells.push(
      <button
        key={`curr-${d}`}
        type="button"
        disabled={disabled}
        onClick={() => handleSelectDay(d)}
        className={`h-8.5 w-8.5 mx-auto rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
          isSelected
            ? 'bg-[#1b4332] text-white shadow-md'
            : isTodayCell
            ? 'border-2 border-[#1b4332] dark:border-emerald-400 text-slate-900 dark:text-white font-black'
            : disabled
            ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-40'
            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        {d}
      </button>
    )
  }

  // Year options list derived from minDate & maxDate bounds
  const minYear = minDate ? parseInt(minDate.split('-')[0], 10) : 1970
  const maxYear = parseInt(defaultMaxDate.split('-')[0], 10)
  const yearsList = []
  for (let y = maxYear; y >= minYear; y--) {
    yearsList.push(y)
  }

  return (
    <div className="relative font-sans" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Input Trigger Button */}
      <button
        id={id}
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-invalid={Boolean(error)}
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
          error ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 focus:border-[#1b4332]'
        }`}
      >
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold">
          <Calendar className="w-4 h-4 text-[#1b4332] dark:text-emerald-400 shrink-0" />
          <span>{getFormattedDisplayDate()}</span>
        </div>
        <span className="text-[11px] font-mono font-normal text-slate-400">{value || 'Optional'}</span>
      </button>

      {/* Helper Text / Error Message */}
      {error ? (
        <p className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
          <Info className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-normal">
          {helperText}
        </p>
      ) : isWeekend() ? (
        <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Note: Selected start date falls on a weekend.</span>
        </p>
      ) : null}

      {/* React Portaled Calendar Popover Modal (fixed z-50 viewport overlay) */}
      {isOpen && portalTarget ? createPortal(
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Choose Employment Start Date"
          data-placement={position.placement}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            visibility: position.visibility,
            zIndex: 9999
          }}
          className="w-[320px] max-w-[calc(100vw-24px)] p-3 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150 font-sans text-slate-900 dark:text-slate-100"
        >
          {/* Header Controls: Custom Bounded Month & Year Selectors */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 gap-1 relative">
            <div className="flex items-center gap-1 flex-1">
              {/* Custom Month Selector Trigger */}
              <div className="relative">
                <button
                  ref={monthTriggerRef}
                  type="button"
                  aria-expanded={isMonthListOpen}
                  onClick={() => {
                    setIsMonthListOpen(prev => !prev)
                    setIsYearListOpen(false)
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <span>{monthsList[month]}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Bounded Custom Month Listbox */}
                {isMonthListOpen && (
                  <div className="absolute left-0 top-full mt-1 z-30 w-36 max-h-52 overflow-y-auto overscroll-contain rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1 space-y-0.5 animate-in fade-in duration-100">
                    {monthsList.map((m, idx) => (
                      <button
                        key={m}
                        type="button"
                        aria-selected={idx === month}
                        onClick={() => handleSelectMonth(idx)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                          idx === month
                            ? 'bg-[#1b4332]/10 dark:bg-emerald-950/50 text-[#1b4332] dark:text-emerald-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{m}</span>
                        {idx === month && <Check className="w-3 h-3 text-[#1b4332] dark:text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Year Selector Trigger */}
              <div className="relative">
                <button
                  ref={yearTriggerRef}
                  type="button"
                  aria-expanded={isYearListOpen}
                  onClick={() => {
                    setIsYearListOpen(prev => !prev)
                    setIsMonthListOpen(false)
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <span>{year}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Bounded Custom Year Listbox (Auto-scrolls selected year into view) */}
                {isYearListOpen && (
                  <div
                    ref={yearListRef}
                    className="absolute left-0 top-full mt-1 z-30 w-28 max-h-52 overflow-y-auto overscroll-contain rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1 space-y-0.5 animate-in fade-in duration-100"
                  >
                    {yearsList.map(y => {
                      const isSelectedYear = y === year
                      return (
                        <button
                          key={y}
                          ref={isSelectedYear ? selectedYearItemRef : null}
                          type="button"
                          aria-selected={isSelectedYear}
                          onClick={() => handleSelectYear(y)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-between transition cursor-pointer ${
                            isSelectedYear
                              ? 'bg-[#1b4332]/10 dark:bg-emerald-950/50 text-[#1b4332] dark:text-emerald-400 font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>{y}</span>
                          {isSelectedYear && <Check className="w-3 h-3 text-[#1b4332] dark:text-emerald-400" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1 my-2 text-center text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells}
          </div>

          {/* Streamlined Compact Footer */}
          <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[#1b4332] dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Select Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>,
        portalTarget
      ) : null}
    </div>
  )
}
