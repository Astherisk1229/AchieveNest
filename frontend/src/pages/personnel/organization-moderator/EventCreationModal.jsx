import React, { useState, useEffect } from 'react'
import { X, Calendar, MapPin, Clock, Layers, Sparkles, Eye, ShieldCheck, CheckCircle2, ChevronRight, ChevronLeft, Building2, User, Upload, Image } from 'lucide-react'
import OrganizationController from '../../../controllers/OrganizationController'
import CertificateTemplateController from '../../../controllers/CertificateTemplateController'
import SignatureVault, { parseSignatoryInfo } from '../../../utils/signatureVault'


export default function EventCreationModal({ isOpen, onClose, onCreateEvent, onUpdateEvent, editingEvent }) {
  const [activeStep, setActiveStep] = useState(1)

  const defaultVault = SignatureVault.getSignatures()

  const [formData, setFormData] = useState({
    title: '',
    category: 'Workshop',
    date: '',
    time: '9:00 AM - 5:00 PM',
    venue: '',
    capacity: 100,
    banner_type: 'laptop',
    description: '',
    target_audience: 'All NDMU Students & Faculty',
    attendance_start_time: '08:30',
    attendance_end_time: '09:30',
    osad_template_id: 'OSAD-TPL-03',
    signatory_1: defaultVault.signatory_1,
    signatory_2: defaultVault.signatory_2,
    signatory_1_img: defaultVault.signatory_1_img,
    signatory_2_img: defaultVault.signatory_2_img
  })

  // Smart Auto-Matching template result
  const autoMatch = OrganizationController.autoMatchOSADTemplate(formData.category, formData.title)

  useEffect(() => {
    const vault = SignatureVault.getSignatures()

    if (editingEvent) {
      setFormData({
        title: editingEvent.title || '',
        category: editingEvent.category || 'Workshop',
        date: editingEvent.date || '',
        time: editingEvent.time || '9:00 AM - 5:00 PM',
        venue: editingEvent.venue || '',
        capacity: editingEvent.capacity || 100,
        banner_type: editingEvent.banner_type || 'laptop',
        description: editingEvent.description || '',
        target_audience: editingEvent.target_audience || 'All NDMU Students & Faculty',
        attendance_start_time: editingEvent.attendance_start_time || '08:30',
        attendance_end_time: editingEvent.attendance_end_time || '09:30',
        osad_template_id: editingEvent.osad_template_id || OrganizationController.autoMatchOSADTemplate(editingEvent.category || 'Workshop', editingEvent.title || '').id,
        signatory_1: editingEvent.signatory_1 || vault.signatory_1,
        signatory_2: editingEvent.signatory_2 || vault.signatory_2,
        signatory_1_img: editingEvent.signatory_1_img || vault.signatory_1_img,
        signatory_2_img: editingEvent.signatory_2_img || vault.signatory_2_img
      })
    } else {
      setFormData({
        title: '',
        category: 'Workshop',
        date: '',
        time: '9:00 AM - 5:00 PM',
        venue: '',
        capacity: 100,
        banner_type: 'laptop',
        description: '',
        target_audience: 'All NDMU Students & Faculty',
        attendance_start_time: '08:30',
        attendance_end_time: '09:30',
        osad_template_id: OrganizationController.autoMatchOSADTemplate('Workshop', '').id,
        signatory_1: vault.signatory_1,
        signatory_2: vault.signatory_2,
        signatory_1_img: vault.signatory_1_img,
        signatory_2_img: vault.signatory_2_img
      })
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


  // Automatically sync osad_template_id when user changes Category if user hasn't manually selected a template
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
  }

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title || !formData.date || !formData.venue) {
      alert('Please fill out all required fields in Step 1.')
      setActiveStep(1)
      return
    }

    const payload = {
      ...formData,
      osad_template_id: formData.osad_template_id || autoMatch.id
    }

    if (editingEvent && onUpdateEvent) {
      onUpdateEvent(editingEvent.id, payload)
    } else if (onCreateEvent) {
      onCreateEvent({
        ...payload,
        status: 'Upcoming',
        participants_count: 0
      })
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-[#EFF7F0] border-b border-[#69A97C] text-[#17663B] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E7F5EA] border border-[#B7DDC4] flex items-center justify-center text-[#17663B]">
              <Calendar className="w-5 h-5 text-[#17663B]" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#17663B]">
                {editingEvent ? 'Edit Organization Event' : 'Create New Organization Event'}
              </h3>
              <p className="text-xs text-[#356148] font-medium">
                Set up event details, venue, dates, and certificate parameters for student verification.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#356148] hover:bg-[#EAF4EC] hover:text-[#17663B] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Step Wizard Navigation Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          <button
            onClick={() => setActiveStep(1)}
            className={`flex items-center gap-2 text-xs font-bold transition cursor-pointer ${
              activeStep === 1 ? 'text-[#16834a]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              activeStep === 1 ? 'bg-[#16834a] text-white' : 'bg-slate-200 text-slate-600'
            }`}>1</span>
            <span>1. Essentials</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          <button
            onClick={() => setActiveStep(2)}
            className={`flex items-center gap-2 text-xs font-bold transition cursor-pointer ${
              activeStep === 2 ? 'text-[#16834a]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              activeStep === 2 ? 'bg-[#16834a] text-white' : 'bg-slate-200 text-slate-600'
            }`}>2</span>
            <span>2. Attendance Schedule</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          <button
            onClick={() => setActiveStep(3)}
            className={`flex items-center gap-2 text-xs font-bold transition cursor-pointer ${
              activeStep === 3 ? 'text-[#16834a]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              activeStep === 3 ? 'bg-[#16834a] text-white' : 'bg-slate-200 text-slate-600'
            }`}>3</span>
            <span>3. OSAD Certificate & Live Side Preview</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-800 font-sans">
          
          {/* STEP 1: ESSENTIALS */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Society Tech Summit 2026"
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#16834a] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Event Category
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
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    3D Graphic Icon Style
                  </label>
                  <select
                    value={formData.banner_type}
                    onChange={(e) => setFormData({ ...formData, banner_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#16834a] font-medium"
                  >
                    <option value="laptop">💻 Tech Laptop</option>
                    <option value="target">🎯 Target Bullseye</option>
                    <option value="soccer">⚽ Sports Soccer</option>
                    <option value="sprout">🌱 Environment Sprout</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#16834a] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Time Window
                  </label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="9:00 AM - 5:00 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#16834a] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Venue Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NDMU Convention Center"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#16834a] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Audience Scope
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. All NDMU Students & Faculty"
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#16834a] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Event Description & Objectives
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe event objectives, key topics, and participant takeaways..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#16834a] font-medium"
                />
              </div>

            </div>
          )}

          {/* STEP 2: ATTENDANCE SCHEDULE */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#16834a]">
                  <Clock className="w-4 h-4" />
                  <span>Student Officer Scanner Window Locks</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Set the exact check-in window. Scanner links remain locked to Student Officers before start time to prevent premature check-ins.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Attendance Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.attendance_start_time}
                    onChange={(e) => setFormData({ ...formData, attendance_start_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-[#16834a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Attendance End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.attendance_end_time}
                    onChange={(e) => setFormData({ ...formData, attendance_end_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-[#16834a]"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-emerald-400 font-sans font-extrabold">
                  <span>OFFICER SCANNER ACCESS URL</span>
                  <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">Auto-Generated</span>
                </div>
                <p className="text-slate-300 truncate">
                  {window.location.origin}/scanner/{editingEvent ? editingEvent.id : 'evt-new'}
                </p>
              </div>

            </div>
          )}

          {/* STEP 3: OSAD CERTIFICATE & SIDE-BY-SIDE LIVE PREVIEW */}
          {activeStep === 3 && (
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
                    {CertificateTemplateController.getPublishedTemplates('event').map(tpl => (
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
                      Held on <span className="font-bold text-slate-800">{formData.date || '2026-08-15'}</span> at <span className="font-bold text-slate-800">{formData.venue || 'NDMU Convention Center'}</span>.
                    </p>
                  </div>

                  {/* Rendered Digital Signatures (Signature over printed name format) */}
                  <div className="pt-4 grid grid-cols-2 gap-6 border-t border-amber-900/20 max-w-md mx-auto relative z-10 text-[10px]">
                    {(() => {
                      const sig1 = parseSignatoryInfo(formData.signatory_1, 'Dr. Ana Reyes', 'Club Moderator')
                      const sig2 = parseSignatoryInfo(formData.signatory_2, 'Prof. Juan Dela Cruz', 'OSAD Director')

                      return (
                        <>
                          {/* Signatory 1 */}
                          <div className="flex flex-col items-center justify-end text-center relative">
                            {/* Floating Signature Graphic */}
                            <div className="h-9 flex items-end justify-center -mb-2 z-10 pointer-events-none">
                              {formData.signatory_1_img ? (
                                <img src={formData.signatory_1_img} alt="Signatory 1" className="h-9 max-w-[130px] object-contain" />
                              ) : (
                                <span className="font-serif italic text-emerald-800 font-bold text-xs">A. Reyes</span>
                              )}
                            </div>
                            {/* Printed Name */}
                            <p className="font-extrabold text-slate-900 text-[11px] tracking-wide uppercase z-0 truncate max-w-full">
                              {sig1.name}
                            </p>
                            {/* Signature Line */}
                            <div className="w-full border-t border-slate-700 my-0.5"></div>
                            {/* Official Position / Title */}
                            <p className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wider truncate max-w-full">
                              {sig1.title}
                            </p>
                          </div>

                          {/* Signatory 2 */}
                          <div className="flex flex-col items-center justify-end text-center relative">
                            {/* Floating Signature Graphic */}
                            <div className="h-9 flex items-end justify-center -mb-2 z-10 pointer-events-none">
                              {formData.signatory_2_img ? (
                                <img src={formData.signatory_2_img} alt="Signatory 2" className="h-9 max-w-[130px] object-contain" />
                              ) : (
                                <span className="font-serif italic text-amber-900 font-bold text-xs">J. Dela Cruz</span>
                              )}
                            </div>
                            {/* Printed Name */}
                            <p className="font-extrabold text-slate-900 text-[11px] tracking-wide uppercase z-0 truncate max-w-full">
                              {sig2.name}
                            </p>
                            {/* Signature Line */}
                            <div className="w-full border-t border-slate-700 my-0.5"></div>
                            {/* Official Position / Title */}
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

            {activeStep < 3 ? (
              <button
                type="button"
                onClick={() => setActiveStep(prev => prev + 1)}
                className="px-5 py-2.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{editingEvent ? 'Save Changes' : 'Publish & Create Event'}</span>
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  )
}

