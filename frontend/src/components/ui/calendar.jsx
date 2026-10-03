/**
 * calendar.jsx
 * Accessible shadcn-style Calendar Component for AchieveNest.
 */

import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function parseDateString(val) {
  if (!val) return null
  if (val instanceof Date && !isNaN(val)) {
    return new Date(val.getFullYear(), val.getMonth(), val.getDate())
  }
  const str = String(val).trim()
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }
  return null
}

function formatDateString(d) {
  if (!d || !(d instanceof Date) || isNaN(d)) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function Calendar({
  selected,
  onSelect,
  disabled,
  minDate,
  maxDate,
  className = ''
}) {
  const selectedDate = useMemo(() => parseDateString(selected), [selected])
  const parsedMin = useMemo(() => parseDateString(minDate), [minDate])
  const parsedMax = useMemo(() => parseDateString(maxDate), [maxDate])

  const [currentMonth, setCurrentMonth] = useState(() => {
    return selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  })

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  // Generate days in calendar grid (42 days: 6 weeks)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days = []

    // Previous month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i)
      days.push({ date: d, isCurrentMonth: false })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      days.push({ date: d, isCurrentMonth: true })
    }

    // Next month padding to fill complete weeks (35 or 42 cells)
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({ date: d, isCurrentMonth: false })
    }

    return days
  }, [year, month])

  const todayStr = formatDateString(new Date())

  const isDayDisabled = (d) => {
    if (disabled && typeof disabled === 'function') {
      if (disabled(d)) return true
    }
    if (parsedMin && d < parsedMin) return true
    if (parsedMax && d > parsedMax) return true
    return false
  }

  return (
    <div className={`p-2 select-none w-64 ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-1 mb-3">
        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
          {MONTH_NAMES[month]} {year}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Next month"
            className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {WEEKDAY_NAMES.map((wd) => (
          <div key={wd} className="text-[11px] font-bold text-slate-400 py-0.5">
            {wd}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(({ date, isCurrentMonth }, idx) => {
          const dateStr = formatDateString(date)
          const isSelected = selectedDate ? formatDateString(selectedDate) === dateStr : false
          const isToday = dateStr === todayStr
          const isDisabled = isDayDisabled(date)

          return (
            <button
              key={`${dateStr}-${idx}`}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled && onSelect) {
                  onSelect(dateStr)
                }
              }}
              className={`h-8 w-8 text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#16834A] text-white font-bold shadow-xs hover:bg-[#136e3e]'
                  : isDisabled
                  ? 'opacity-20 text-slate-400 cursor-not-allowed'
                  : isCurrentMonth
                  ? 'text-slate-800 dark:text-slate-200 hover:bg-emerald-50 hover:text-[#16834A] dark:hover:bg-slate-800'
                  : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50'
              } ${isToday && !isSelected ? 'border border-[#16834A]/50 font-bold text-[#16834A]' : ''}`}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
