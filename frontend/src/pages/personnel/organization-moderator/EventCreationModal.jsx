import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  X,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Upload,
  RefreshCw,
  AlertCircle,
  Check
} from 'lucide-react'
import OrganizationController from '../../../controllers/OrganizationController'
import SignatureVault, { parseSignatoryInfo } from '../../../utils/signatureVault'
import eventService from '../../../services/eventService'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { Calendar } from '../../../components/ui/calendar'
import {
  calculateDuration,
  format12HourTime,
  formatDateHeading,
  formatDateToYMD,
  formatScheduleDuration,
  getNextDayDate,
  getSmartDefaultEndTime,
  parseDateString,
  parseTo24Hour,
  validateSchedule
} from '../../../lib/eventSchedule'

const OSAD_TEMPLATES = [
  { code: 'OSAD-TPL-01', name: 'Official NDMU Certificate of Participation' },
  { code: 'OSAD-TPL-02', name: 'Certificate of Leadership & Merit' },
  { code: 'OSAD-TPL-03', name: 'Certificate of Workshop Completion' },
  { code: 'OSAD-TPL-04', name: 'Excellence & Special Distinction Award' },
  { code: 'OSAD-TPL-05', name: 'NDMU Sports & Athletics Accreditation Certificate' }
]

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30', '00:00', '00:30', '01:00', '01:30',
  '02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30'
]

function TimePicker({ value, onChange, placeholder = 'Select time', className = '', id }) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(() => format12HourTime(value))

  useEffect(() => {
    setInputValue(format12HourTime(value))
  }, [value])

  const handleInputChange = (e) => {
    const text = e.target.value
    setInputValue(text)
    try {
      const parsed = parseTo24Hour(text, null)
      if (parsed) {
        onChange(parsed)
      }
    } catch {
      // Typing in progress
    }
  }

  const handleInputBlur = () => {
    try {
      const parsed = parseTo24Hour(inputValue, null)
      if (parsed) {
        onChange(parsed)
        setInputValue(format12HourTime(parsed))
      } else {
        setInputValue(format12HourTime(value))
      }
    } catch {
      setInputValue(format12HourTime(value))
    }
  }

  const handleSelectOption = (time24) => {
    onChange(time24)
    setInputValue(format12HourTime(time24))
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={`relative flex items-center ${className}`}>
          <Clock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            id={id}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onClick={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full pl-9 pr-7 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white hover:border-slate-300 focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a] transition"
          />
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-3 rotate-90 pointer-events-none" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1.5 max-h-56 overflow-y-auto">
        <div className="space-y-0.5">
          {TIME_OPTIONS.map((time24) => {
            const label = format12HourTime(time24)
            const isSelected = value === time24
            return (
              <button
                key={time24}
                type="button"
                onClick={() => handleSelectOption(time24)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-emerald-50 text-[#16834a] font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#16834a]" />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function DatePickerField({ value, onChange, placeholder = 'Select date', disabledBefore, id, error }) {
  const [open, setOpen] = useState(false)
  const selectedDate = useMemo(() => parseDateString(value), [value])

  const handleSelect = (d) => {
    if (!d) return
    const ymd = typeof d === 'string' ? d : formatDateToYMD(d)
    onChange(ymd)
    setOpen(false)
  }

  const disabledMatcher = disabledBefore
    ? (d) => {
        const threshold = parseDateString(disabledBefore)
        if (!threshold) return false
        const tZero = new Date(threshold.getFullYear(), threshold.getMonth(), threshold.getDate()).getTime()
        const dZero = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
        return dZero < tZero
      }
    : undefined

  const displayDate = value ? formatDateHeading(value) : ''

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-medium bg-white hover:border-slate-300 focus:outline-none focus:border-[#16834a] focus:ring-1 focus:ring-[#16834a] transition text-left cursor-pointer ${
            error ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
          }`}
        >
          <span className="flex items-center gap-2.5 truncate">
            <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
            <span className={displayDate ? 'text-slate-900 font-medium' : 'text-slate-400'}>
              {displayDate || placeholder}
            </span>
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-90 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={disabledMatcher}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export default function EventCreationModal({ isOpen, onClose, onCreateEvent, onUpdateEvent, editingEvent }) {
  const [activeStep, setActiveStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [endScheduleTouched, setEndScheduleTouched] = useState(false)

  // Canonical Venues state
  const [venues, setVenues] = useState([])
  const [venuesLoading, setVenuesLoading] = useState(false)
  const [venuesError, setVenuesError] = useState(null)

  const defaultVault = SignatureVault.getSignatures()

  const [formData, setFormData] = useState({
    title: '',
    category: 'Workshop',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    venue_id: '',
    historicalVenue: '',
    description: '',
    osad_template_id: 'OSAD-TPL-03',
    signatory_1: defaultVault.signatory_1,
    signatory_2: defaultVault.signatory_2,
    signatory_1_img: defaultVault.signatory_1_img,
    signatory_2_img: defaultVault.signatory_2_img
  })

  // Load canonical venues from backend
  const loadVenues = useCallback(async () => {
    setVenuesLoading(true)
    setVenuesError(null)
    try {
      const rows = await eventService.listVenues()
      setVenues(Array.isArray(rows) ? rows : [])
    } catch (err) {
      console.error('Failed to load canonical event venues:', err)
      setVenuesError('Unable to load official venues. Please try again.')
    } finally {
      setVenuesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadVenues()
    }
  }, [isOpen, loadVenues])

  // Smart Auto-Matching template result
  const autoMatch = OrganizationController.autoMatchOSADTemplate(formData.category, formData.title)

  useEffect(() => {
    const vault = SignatureVault.getSignatures()
    setFieldErrors({})
    setSubmitError(null)

    if (editingEvent) {
      const initialStartDate = editingEvent.startDate
        || (editingEvent.start_time ? String(editingEvent.start_time).slice(0, 10) : (editingEvent.date || ''))
      const initialStartTime = editingEvent.startTime
        || (editingEvent.start_time ? parseTo24Hour(editingEvent.start_time) : '09:00')
      const initialEndDate = editingEvent.endDate
        || (editingEvent.end_time ? String(editingEvent.end_time).slice(0, 10) : initialStartDate)
      const initialEndTime = editingEvent.endTime
        || (editingEvent.end_time ? parseTo24Hour(editingEvent.end_time) : '11:00')

      setFormData({
        title: editingEvent.title || '',
        category: editingEvent.category || editingEvent.event_type || 'Workshop',
        startDate: initialStartDate,
        startTime: initialStartTime,
        endDate: initialEndDate,
        endTime: initialEndTime,
        venue_id: editingEvent.venue_id || '',
        historicalVenue: (!editingEvent.venue_id && editingEvent.venue) ? editingEvent.venue : '',
        description: editingEvent.description || '',
        attendance_start_time: editingEvent.attendance_start_time || '08:30',
        attendance_end_time: editingEvent.attendance_end_time || '09:30',
        osad_template_id: editingEvent.osad_template_id || OrganizationController.autoMatchOSADTemplate(editingEvent.category || 'Workshop', editingEvent.title || '').id,
        signatory_1: editingEvent.signatory_1 || vault.signatory_1,
        signatory_2: editingEvent.signatory_2 || vault.signatory_2,
        signatory_1_img: editingEvent.signatory_1_img || vault.signatory_1_img,
        signatory_2_img: editingEvent.signatory_2_img || vault.signatory_2_img
      })
      setEndScheduleTouched(true)
    } else {
      setFormData({
        title: '',
        category: 'Workshop',
        startDate: '',
        startTime: '09:00',
        endDate: '',
        endTime: '10:00',
        venue_id: '',
        historicalVenue: '',
        description: '',
        attendance_start_time: '08:30',
        attendance_end_time: '09:30',
        osad_template_id: OrganizationController.autoMatchOSADTemplate('Workshop', '').id,
        signatory_1: vault.signatory_1,
        signatory_2: vault.signatory_2,
        signatory_1_img: vault.signatory_1_img,
        signatory_2_img: vault.signatory_2_img
      })
      setEndScheduleTouched(false)
    }
    setActiveStep(1)
  }, [editingEvent, isOpen])

  const handleSigImageUpload = (sigKey, file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUri = e.target.result
      const updatedData = { ...formData, [sigKey]: dataUri }
      setFormData(updatedData)
      SignatureVault.saveSignatures({
        [sigKey]: dataUri
      })
    }
    reader.readAsDataURL(file)
  }

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value
    const matched = OrganizationController.autoMatchOSADTemplate(newCategory, formData.title)
    setFormData(prev => ({
      ...prev,
      category: newCategory,
      osad_template_id: matched.id
    }))
  }

  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    const matched = OrganizationController.autoMatchOSADTemplate(formData.category, newTitle)
    setFormData(prev => ({
      ...prev,
      title: newTitle,
      osad_template_id: matched.id
    }))
    if (fieldErrors.title) {
      setFieldErrors(prev => ({ ...prev, title: null }))
    }
  }

  const scheduleDuration = useMemo(() => {
    return calculateDuration(formData.startDate, formData.startTime, formData.endDate, formData.endTime)
  }, [formData.startDate, formData.startTime, formData.endDate, formData.endTime])

  const durationSummaryText = useMemo(() => {
    return formatScheduleDuration(formData.startDate, formData.startTime, formData.endDate, formData.endTime)
  }, [formData.startDate, formData.startTime, formData.endDate, formData.endTime])

  const handleStartDateSelect = (selectedDate) => {
    const ymd = formatDateToYMD(selectedDate)
    if (!ymd) return

    setFormData(prev => {
      let nextEndDate = prev.endDate
      let nextEndTime = prev.endTime

      if (!prev.endDate || !endScheduleTouched) {
        const smart = getSmartDefaultEndTime(ymd, prev.startTime)
        nextEndDate = smart.endDate
        nextEndTime = smart.endTime
      }

      return {
        ...prev,
        startDate: ymd,
        endDate: nextEndDate,
        endTime: nextEndTime
      }
    })

    if (fieldErrors.startDate || fieldErrors.schedule) {
      setFieldErrors(prev => ({ ...prev, startDate: null, schedule: null }))
    }
  }

  const handleStartTimeChange = (newStartTime) => {
    setFormData(prev => {
      let nextEndDate = prev.endDate
      let nextEndTime = prev.endTime

      if (!endScheduleTouched && prev.startDate) {
        const smart = getSmartDefaultEndTime(prev.startDate, newStartTime)
        nextEndDate = smart.endDate
        nextEndTime = smart.endTime
      }

      return {
        ...prev,
        startTime: newStartTime,
        endDate: nextEndDate,
        endTime: nextEndTime
      }
    })

    if (fieldErrors.startTime || fieldErrors.schedule) {
      setFieldErrors(prev => ({ ...prev, startTime: null, schedule: null }))
    }
  }

  const handleEndDateSelect = (selectedDate) => {
    const ymd = formatDateToYMD(selectedDate)
    if (!ymd) return

    setEndScheduleTouched(true)
    setFormData(prev => ({
      ...prev,
      endDate: ymd
    }))

    if (fieldErrors.endDate || fieldErrors.schedule) {
      setFieldErrors(prev => ({ ...prev, endDate: null, schedule: null }))
    }
  }

  const handleEndTimeChange = (newEndTime) => {
    setEndScheduleTouched(true)
    setFormData(prev => ({
      ...prev,
      endTime: newEndTime
    }))

    if (fieldErrors.endTime || fieldErrors.schedule) {
      setFieldErrors(prev => ({ ...prev, endTime: null, schedule: null }))
    }
  }

  const handleSetNextDay = () => {
    if (!formData.startDate) return
    const nextDay = getNextDayDate(formData.startDate)
    setEndScheduleTouched(true)
    setFormData(prev => ({
      ...prev,
      endDate: nextDay
    }))
    if (fieldErrors.schedule) {
      setFieldErrors(prev => ({ ...prev, schedule: null }))
    }
  }

  const validateStep1 = () => {
    const errors = {}

    if (!formData.title.trim()) {
      errors.title = 'Event title is required.'
    }

    if (!formData.startDate) {
      errors.startDate = 'Select an event start date.'
    }

    if (!formData.startTime) {
      errors.startTime = 'Select a start time.'
    }

    if (!formData.endDate) {
      errors.endDate = 'Select an event end date.'
    }

    if (!formData.endTime) {
      errors.endTime = 'Select an end time.'
    }

    if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
      const dur = calculateDuration(formData.startDate, formData.startTime, formData.endDate, formData.endTime)
      if (!dur.isValid) {
        errors.schedule = dur.error
      }
    }

    // For new events, venue_id is required
    if (!editingEvent && !formData.venue_id) {
      errors.venue_id = 'Select an official venue.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNextStep = () => {
    if (activeStep === 1) {
      if (!validateStep1()) {
        return
      }
    }
    setActiveStep(prev => prev + 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Defensive submission guard: Event creation is strictly allowed only on the final step (Step 2: Certificate)
    if (activeStep !== 2) {
      if (activeStep === 1) {
        if (validateStep1()) {
          setActiveStep(2)
        }
      }
      return
    }

    if (isSubmitting) return

    if (!validateStep1()) {
      setActiveStep(1)
      return
    }

    setSubmitError(null)

    const payload = {
      title: formData.title.trim(),
      category: formData.category,
      startDate: formData.startDate,
      startTime: formData.startTime,
      endDate: formData.endDate,
      endTime: formData.endTime,
      date: formData.startDate, // backwards compatibility
      description: formData.description.trim() || null,
      osad_template_id: formData.osad_template_id || autoMatch.id
    }

    // Include venue_id if selected
    if (formData.venue_id) {
      payload.venue_id = formData.venue_id
    }

    setIsSubmitting(true)

    try {
      if (editingEvent && onUpdateEvent) {
        await onUpdateEvent(editingEvent.id, payload)
      } else if (onCreateEvent) {
        await onCreateEvent(payload)
      }

      onClose()
    } catch (error) {
      let message = error?.error?.message ?? error?.message ?? 'Unable to save the Event. Please try again.'

      // Map backend error codes to user-friendly messages
      const errorCode = error?.error?.code ?? error?.code
      if (errorCode === 'INVALID_VENUE') {
        message = 'The selected venue was not found. Please refresh the venue list and select an active venue.'
      } else if (errorCode === 'INACTIVE_VENUE') {
        message = 'The selected venue is currently inactive. Please choose another venue.'
      } else if (errorCode === 'VENUE_CONFLICT') {
        message = 'The selected venue is already booked during this time window.'
      }

      console.error('Unable to persist canonical Event.', error)
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  // Find currently selected venue name for preview
  const selectedVenueObj = venues.find(v => v.id === formData.venue_id)
  const displayVenueName = selectedVenueObj ? selectedVenueObj.name : (formData.historicalVenue || 'Not selected')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-[#EFF7F0] border-b border-[#69A97C] text-[#17663B] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E7F5EA] border border-[#B7DDC4] flex items-center justify-center text-[#17663B]">
              <CalendarIcon className="w-5 h-5 text-[#17663B]" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#17663B]">
                {editingEvent ? 'Edit Organization Event' : 'Create New Organization Event'}
              </h3>
              <p className="text-xs text-[#356148] font-medium">
                Set up event details, official venue, and schedule for student verification.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#356148] hover:bg-[#EAF4EC] hover:text-[#17663B] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Step Wizard Navigation Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`flex items-center gap-2 text-xs font-bold transition cursor-pointer ${
              activeStep === 1 ? 'text-[#16834a]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              activeStep === 1 ? 'bg-[#16834a] text-white' : 'bg-slate-200 text-slate-600'
            }`}>1</span>
            <span>1. Event Details</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          <button
            type="button"
            onClick={() => {
              if (activeStep === 1 && !validateStep1()) return
              setActiveStep(2)
            }}
            className={`flex items-center gap-2 text-xs font-bold transition cursor-pointer ${
              activeStep === 2 ? 'text-[#16834a]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              activeStep === 2 ? 'bg-[#16834a] text-white' : 'bg-slate-200 text-slate-600'
            }`}>2</span>
            <span>2. Certificate</span>
          </button>
        </div>

        {/* Submit Error Banner */}
        {submitError && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800 font-sans">
          
          {/* STEP 1: EVENT DETAILS */}
          {activeStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Section A: Event Details */}
              <div className="space-y-3.5">
                <div className="border-b border-slate-100 pb-1.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Event Details
                  </h4>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Society Tech Summit 2026"
                    value={formData.title}
                    onChange={handleTitleChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-[#16834a] font-medium ${
                      fieldErrors.title ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  />
                  {fieldErrors.title && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={handleCategoryChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#16834a] font-medium"
                  >
                    <option value="Summit">Summit / Conference</option>
                    <option value="Workshop">Workshop / Skills Training</option>
                    <option value="Leadership">Leadership & Merit</option>
                    <option value="Sports">Sports & Athletics</option>
                    <option value="Community Service">Community Service</option>
                    <option value="Assembly">General Assembly</option>
                    <option value="Institutional">Institutional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Description & Objectives
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe event objectives, key topics, and participant takeaways..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#16834a] font-medium"
                  />
                </div>
              </div>

              {/* Section B: Schedule */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#16834a]" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Schedule
                    </h4>
                  </div>
                </div>

                <div className="space-y-3.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
                  {/* Starts Row */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Starts *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-7">
                        <DatePickerField
                          id="event-start-date"
                          value={formData.startDate}
                          onChange={handleStartDateSelect}
                          placeholder="Select start date"
                          error={fieldErrors.startDate}
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <TimePicker
                          id="event-start-time"
                          value={formData.startTime}
                          onChange={handleStartTimeChange}
                          placeholder="Start time"
                        />
                      </div>
                    </div>
                    {fieldErrors.startDate && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.startDate}</p>
                    )}
                  </div>

                  {/* Ends Row */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Ends *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-7">
                        <DatePickerField
                          id="event-end-date"
                          value={formData.endDate}
                          onChange={handleEndDateSelect}
                          placeholder="Select end date"
                          disabledBefore={formData.startDate}
                          error={fieldErrors.endDate}
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <TimePicker
                          id="event-end-time"
                          value={formData.endTime}
                          onChange={handleEndTimeChange}
                          placeholder="End time"
                        />
                      </div>
                    </div>
                    {fieldErrors.endDate && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.endDate}</p>
                    )}
                  </div>

                  {/* Duration summary & inline validation feedback */}
                  <div className="pt-1">
                    {scheduleDuration.isValid && durationSummaryText && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span id="schedule-duration-summary">{durationSummaryText}</span>
                      </div>
                    )}

                    {(!scheduleDuration.isValid || fieldErrors.schedule) && (formData.startDate && formData.startTime && formData.endDate && formData.endTime) && (
                      <div className="space-y-1.5" id="schedule-error-container">
                        <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span id="schedule-error-message">{fieldErrors.schedule || scheduleDuration.error}</span>
                        </p>
                        {scheduleDuration.canSetNextDay && (
                          <div className="flex items-center gap-2 pl-5">
                            <span className="text-xs text-slate-500">Does this event end the next day?</span>
                            <button
                              id="btn-set-next-day"
                              type="button"
                              onClick={handleSetNextDay}
                              className="text-xs font-bold text-[#16834a] hover:underline cursor-pointer"
                            >
                              Set end date to next day
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section C: Location */}
              <div className="space-y-3.5">
                <div className="border-b border-slate-100 pb-1.5 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#16834a]" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Location
                  </h4>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Official Venue *
                    </label>
                    {venuesLoading && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading venues...
                      </span>
                    )}
                  </div>

                  {venuesError ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                      <span>{venuesError}</span>
                      <button
                        type="button"
                        onClick={loadVenues}
                        className="font-bold text-[#16834a] hover:underline cursor-pointer"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formData.venue_id}
                      onChange={(e) => {
                        const val = e.target.value
                        setFormData(prev => ({ ...prev, venue_id: val }))
                        if (fieldErrors.venue_id) setFieldErrors(prev => ({ ...prev, venue_id: null }))
                      }}
                      disabled={venuesLoading}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-[#16834a] font-medium ${
                        fieldErrors.venue_id ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                      }`}
                    >
                      {formData.historicalVenue && !formData.venue_id ? (
                        <option value="">-- Keep historical venue ({formData.historicalVenue}) --</option>
                      ) : (
                        <option value="">-- Select an official venue --</option>
                      )}
                      {venues.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {fieldErrors.venue_id && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.venue_id}</p>
                  )}

                  {formData.historicalVenue && !formData.venue_id && (
                    <p className="text-[11px] text-slate-500 mt-1.5 font-medium italic">
                      Current venue: <span className="font-bold text-slate-700">{formData.historicalVenue}</span> (Historical venue — select an official venue above to upgrade).
                    </p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: OSAD CERTIFICATE & SIDE-BY-SIDE LIVE PREVIEW */}
          {activeStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
              
              {/* Left Column: Form Inputs (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Smart Auto-Matching Template Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#064e2b] to-slate-900 text-white space-y-2.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#245F42] border border-emerald-400/30 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      ⚡ Smart Auto-Matched OSAD Template
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-white">{autoMatch.name}</h4>
                    <p className="text-[11px] text-[#245F42]/80 mt-0.5">{autoMatch.description}</p>
                  </div>

                  <div className="text-[10px] text-[#245F42]/90 font-mono bg-emerald-950/60 p-2 rounded-xl border border-emerald-800/40">
                    {autoMatch.reason}
                  </div>
                </div>

                {/* Template Selector Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    OSAD Certificate Template
                  </label>
                  <select
                    value={formData.osad_template_id}
                    onChange={(e) => setFormData({ ...formData, osad_template_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#16834a] font-medium"
                  >
                    {OSAD_TEMPLATES.map(tpl => (
                      <option key={tpl.code} value={tpl.code}>
                        [{tpl.code}] {tpl.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Signatory Inputs & Digital Signature Upload */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Primary Signatory Name & Title
                    </label>
                    <input
                      type="text"
                      value={formData.signatory_1}
                      onChange={(e) => setFormData({ ...formData, signatory_1: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    />
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-[#16834a] border border-slate-200 text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Signature PNG</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSigImageUpload('signatory_1_img', e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium italic">Saved in Vault</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Secondary Signatory Name & Title
                    </label>
                    <input
                      type="text"
                      value={formData.signatory_2}
                      onChange={(e) => setFormData({ ...formData, signatory_2: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    />
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-[#16834a] border border-slate-200 text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Signature PNG</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSigImageUpload('signatory_2_img', e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium italic">Saved in Vault</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Instant Live Certificate Preview Card (7 cols) */}
              <div className="lg:col-span-7 space-y-2 sticky top-0">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#16834a]" />
                    Instant Real-Time Certificate Preview
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Live Synced
                  </span>
                </div>

                {/* Embedded Certificate Rendered Card */}
                <div className="p-6 bg-amber-50/30 text-center space-y-4 relative overflow-hidden border-4 border-double border-amber-800/30 rounded-2xl shadow-sm">
                  
                  {/* Watermark Seal */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                    <div className="w-60 h-60 rounded-full border-8 border-slate-900 flex items-center justify-center">
                      <span className="text-3xl font-extrabold font-serif">NDMU</span>
                    </div>
                  </div>

                  {/* Certificate Header */}
                  <div className="space-y-1 relative z-10">
                    <p className="text-[10px] font-extrabold tracking-widest uppercase text-amber-900">NOTRE DAME OF MARBEL UNIVERSITY</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Office of Student Affairs & Services (OSAD)</p>
                    <h2 className="text-lg font-serif font-extrabold text-slate-900 pt-1 tracking-wide">
                      {formData.osad_template_id === 'OSAD-TPL-03' ? 'CERTIFICATE OF WORKSHOP COMPLETION' :
                       formData.osad_template_id === 'OSAD-TPL-02' ? 'CERTIFICATE OF LEADERSHIP & MERIT' :
                       formData.osad_template_id === 'OSAD-TPL-04' ? 'EXCELLENCE & SPECIAL DISTINCTION AWARD' :
                       formData.osad_template_id === 'OSAD-TPL-05' ? 'SPORTS & ATHLETICS ACCREDITATION CERTIFICATE' :
                       'CERTIFICATE OF PARTICIPATION'}
                    </h2>
                  </div>

                  <div className="space-y-1 relative z-10">
                    <p className="text-[10px] text-slate-500 italic">This official digital certificate is proudly presented to</p>
                    <h3 className="text-base font-extrabold text-[#16834a] underline decoration-amber-500 decoration-2 underline-offset-4">
                      [STUDENT PARTICIPANT FULL NAME]
                    </h3>
                  </div>

                  <div className="max-w-xs mx-auto space-y-1 relative z-10 text-[11px] text-slate-700 leading-snug">
                    <p>
                      For active attendance and successful completion of:
                    </p>
                    <p className="font-extrabold text-slate-900 text-xs">{formData.title || 'Computer Society Tech Summit 2026'}</p>
                    <p className="text-slate-500 text-[10px]">
                      Held on <span className="font-bold text-slate-800">{formData.startDate || formData.date || '2026-08-15'}</span> at <span className="font-bold text-slate-800">{displayVenueName}</span>.
                    </p>
                  </div>

                  {/* Rendered Digital Signatures */}
                  <div className="pt-4 grid grid-cols-2 gap-6 border-t border-amber-900/20 max-w-md mx-auto relative z-10 text-[10px]">
                    {(() => {
                      const sig1 = parseSignatoryInfo(formData.signatory_1, 'Dr. Ana Reyes', 'Club Moderator')
                      const sig2 = parseSignatoryInfo(formData.signatory_2, 'Prof. Juan Dela Cruz', 'OSAD Director')

                      return (
                        <>
                          <div className="flex flex-col items-center justify-end text-center relative">
                            <div className="h-9 flex items-end justify-center -mb-2 z-10 pointer-events-none">
                              {formData.signatory_1_img ? (
                                <img src={formData.signatory_1_img} alt="Signatory 1" className="h-9 max-w-[130px] object-contain" />
                              ) : (
                                <span className="font-serif italic text-emerald-800 font-bold text-xs">A. Reyes</span>
                              )}
                            </div>
                            <p className="font-extrabold text-slate-900 text-[11px] tracking-wide uppercase z-0 truncate max-w-full">
                              {sig1.name}
                            </p>
                            <div className="w-full border-t border-slate-700 my-0.5"></div>
                            <p className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wider truncate max-w-full">
                              {sig1.title}
                            </p>
                          </div>

                          <div className="flex flex-col items-center justify-end text-center relative">
                            <div className="h-9 flex items-end justify-center -mb-2 z-10 pointer-events-none">
                              {formData.signatory_2_img ? (
                                <img src={formData.signatory_2_img} alt="Signatory 2" className="h-9 max-w-[130px] object-contain" />
                              ) : (
                                <span className="font-serif italic text-amber-900 font-bold text-xs">J. Dela Cruz</span>
                              )}
                            </div>
                            <p className="font-extrabold text-slate-900 text-[11px] tracking-wide uppercase z-0 truncate max-w-full">
                              {sig2.name}
                            </p>
                            <div className="w-full border-t border-slate-700 my-0.5"></div>
                            <p className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wider truncate max-w-full">
                              {sig2.title}
                            </p>
                          </div>
                        </>
                      )
                    })()}
                  </div>

                  <div className="text-[9px] font-mono text-slate-400 pt-1">
                    Verification Code: NDMU-OSAD-2026-X8921 • OSAD Seal Verified
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* Modal Action Controls Footer */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100 shrink-0">
            {activeStep > 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep(prev => prev - 1)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            )}

            {activeStep < 2 ? (
              <button
                key="wizard-next-step-button"
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleNextStep()
                }}
                className="px-5 py-2.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                key="wizard-submit-event-button"
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? (editingEvent ? 'Saving changes...' : 'Creating event...')
                    : (editingEvent ? 'Save Changes' : 'Publish & Create Event')}
                </span>
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  )
}
