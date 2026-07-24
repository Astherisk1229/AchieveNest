import React, { useState } from 'react'
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Check, 
  Plus, 
  Trash2, 
  Star, 
  Briefcase, 
  FileText, 
  GraduationCap, 
  Shield, 
  Save,
  Building2,
  Calendar
} from 'lucide-react'

export default function EditStudentInfoModal({ 
  isOpen, 
  onClose, 
  student, 
  experiences: initialExperiences, 
  skills: initialSkills, 
  onSave 
}) {
  const [activeTab, setActiveTab] = useState('bio') // 'bio' | 'skills' | 'experience'

  // Tab 1 Form State
  const [avatarUrl, setAvatarUrl] = useState(student?.avatar_url || '')
  const [aboutMe, setAboutMe] = useState(
    student?.about_me || 
    'I am a dedicated and driven 3rd Year student enrolled in BS Computer Science at Notre Dame of Marbel University. With a strong passion for technology, community service, and academic excellence, I actively seek opportunities to grow both personally and professionally.'
  )
  const [phone, setPhone] = useState(student?.phone || '+63 912 345 6789')
  const [email, setEmail] = useState(student?.email || 'student@ndmu.edu.ph')
  const [location, setLocation] = useState(student?.location || 'Koronadal City, South Cotabato')

  // Tab 2 Skills State
  const [skills, setSkills] = useState(
    initialSkills || [
      { name: 'Leadership', level: 3, label: 'Expert' },
      { name: 'Communication', level: 3, label: 'Expert' },
      { name: 'Technical Skills', level: 2, label: 'Proficient' },
      { name: 'Teamwork', level: 3, label: 'Expert' },
      { name: 'Problem Solving', level: 2, label: 'Proficient' }
    ]
  )
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillLevel, setNewSkillLevel] = useState(2)

  // Tab 3 Experiences State
  const [experiences, setExperiences] = useState(
    initialExperiences || [
      { id: 1, role: 'President', organization: 'Computer Society NDMU', period: 'Aug 2025 – Present' },
      { id: 2, role: "Dean's Lister", organization: 'CEAC – Notre Dame of Marbel University', period: 'AY 2024–2025' },
      { id: 3, role: 'Community Extension', organization: 'Koronadal City Barangay Program', period: 'Jan – Mar 2025' }
    ]
  )
  const [newRole, setNewRole] = useState('')
  const [newOrg, setNewOrg] = useState('')
  const [newPeriod, setNewPeriod] = useState('')

  if (!isOpen) return null

  // Skill Management Helpers
  const handleAddSkill = (e) => {
    e.preventDefault()
    if (!newSkillName.trim()) return
    const levelLabelMap = { 1: 'Familiar', 2: 'Proficient', 3: 'Expert' }
    setSkills([
      ...skills,
      { name: newSkillName.trim(), level: newSkillLevel, label: levelLabelMap[newSkillLevel] }
    ])
    setNewSkillName('')
    setNewSkillLevel(2)
  }

  const handleRemoveSkill = (skillIndex) => {
    setSkills(skills.filter((_, idx) => idx !== skillIndex))
  }

  const handleUpdateSkillLevel = (skillIndex, newLevel) => {
    const levelLabelMap = { 1: 'Familiar', 2: 'Proficient', 3: 'Expert' }
    const updated = [...skills]
    updated[skillIndex] = {
      ...updated[skillIndex],
      level: newLevel,
      label: levelLabelMap[newLevel]
    }
    setSkills(updated)
  }

  // Experience Management Helpers
  const handleAddExperience = (e) => {
    e.preventDefault()
    if (!newRole.trim() || !newOrg.trim()) return
    setExperiences([
      ...experiences,
      {
        id: Date.now(),
        role: newRole.trim(),
        organization: newOrg.trim(),
        period: newPeriod.trim() || 'Present'
      }
    ])
    setNewRole('')
    setNewOrg('')
    setNewPeriod('')
  }

  const handleRemoveExperience = (expId) => {
    setExperiences(experiences.filter(exp => exp.id !== expId))
  }

  // Final Form Submission
  const handleFormSubmit = (e) => {
    e.preventDefault()
    const updatedProfile = {
      ...student,
      avatar_url: avatarUrl,
      about_me: aboutMe,
      phone,
      email,
      location
    }
    if (onSave) {
      onSave(updatedProfile, experiences, skills)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 shrink-0">
          <div className="p-3 rounded-2xl bg-[#eef7f0] border border-[#cbe6d2] text-[#2d8a4e] shadow-2xs">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Edit Student Profile Information</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Update personal narrative, contact details, skills, and involvement timeline
            </p>
          </div>
        </div>

        {/* Modal Tabs Row */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 shrink-0 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('bio')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'bio'
                ? 'bg-[#2d8a4e] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Bio & Contact</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'skills'
                ? 'bg-[#2d8a4e] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Skills Manager</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('experience')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'experience'
                ? 'bg-[#2d8a4e] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Experience Timeline</span>
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto pr-1 space-y-5 my-1 text-xs">
          
          {/* ================= TAB 1: BIO & CONTACT DETAILS ================= */}
          {activeTab === 'bio' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Protected System Information Box */}
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-[#1e5831] uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#2d8a4e]" />
                    <span>Protected Registrar System Records (Read-Only)</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#1e5831] border border-emerald-200">
                    Verified Student
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1 font-semibold text-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Full Name</span>
                    <span>{student?.full_name || 'Maria Santos'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Student ID</span>
                    <span>{student?.student_id || '2024-01234'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Degree Program</span>
                    <span>{student?.program || 'BS Computer Science'}</span>
                  </div>
                </div>
              </div>

              {/* Avatar Preview & URL */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">Profile Picture Avatar URL</label>
                <div className="flex items-center gap-3">
                  <img
                    src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt="Avatar Preview"
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-[#2d8a4e] shrink-0"
                  />
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#2d8a4e] transition"
                  />
                </div>
              </div>

              {/* About Me Narrative */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">About Me Statement</label>
                <textarea
                  rows="4"
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  placeholder="Write a brief background statement about your academic goals..."
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#2d8a4e] transition leading-relaxed"
                ></textarea>
              </div>

              {/* Contact Information Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#2d8a4e]" />
                    <span>University Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#2d8a4e] transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#2d8a4e]" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#2d8a4e] transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#2d8a4e]" />
                  <span>Present Address / Location</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#2d8a4e] transition"
                />
              </div>

            </div>
          )}

          {/* ================= TAB 2: SKILLS MANAGER ================= */}
          {activeTab === 'skills' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Add New Skill Form Box */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
                <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Plus className="w-4 h-4 text-[#2d8a4e]" />
                  <span>Add New Skill or Competency</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Python Programming, Public Speaking..."
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    className="sm:col-span-6 p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#2d8a4e]"
                  />

                  <select
                    value={newSkillLevel}
                    onChange={(e) => setNewSkillLevel(Number(e.target.value))}
                    className="sm:col-span-4 p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-[#2d8a4e]"
                  >
                    <option value={1}>1 Dot - Familiar</option>
                    <option value={2}>2 Dots - Proficient</option>
                    <option value={3}>3 Dots - Expert</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="sm:col-span-2 py-2.5 px-3 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Skills List */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 text-xs">Current Skills & Competencies ({skills.length})</h4>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {skills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-emerald-200 transition"
                    >
                      <span className="font-bold text-slate-900 text-xs">{skill.name}</span>

                      <div className="flex items-center gap-3">
                        {/* 3-Dot Level Selector Buttons */}
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                          {[1, 2, 3].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => handleUpdateSkillLevel(idx, lvl)}
                              className={`w-3.5 h-3.5 rounded-full transition cursor-pointer ${
                                lvl <= skill.level ? 'bg-[#2d8a4e]' : 'bg-slate-300'
                              }`}
                              title={`Set level ${lvl}`}
                            />
                          ))}
                          <span className="text-[10px] font-bold text-slate-500 ml-1">{skill.label}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Remove skill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 3: EXPERIENCE TIMELINE ================= */}
          {activeTab === 'experience' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Add New Experience Box */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
                <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Plus className="w-4 h-4 text-[#2d8a4e]" />
                  <span>Add New Position or Involvement Entry</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="Role (e.g. Vice President, Volunteer)"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="sm:col-span-4 p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#2d8a4e]"
                  />

                  <input
                    type="text"
                    placeholder="Organization / Office (e.g. NDMU CITE)"
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                    className="sm:col-span-5 p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#2d8a4e]"
                  />

                  <input
                    type="text"
                    placeholder="Period (e.g. AY 2025-2026)"
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    className="sm:col-span-3 p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#2d8a4e]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddExperience}
                    className="py-2 px-4 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Position</span>
                  </button>
                </div>
              </div>

              {/* Experience Entries List */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 text-xs">Experience Timeline Entries ({experiences.length})</h4>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {experiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-emerald-200 transition"
                    >
                      <div className="space-y-0.5">
                        <h5 className="font-extrabold text-slate-900 text-xs">{exp.role}</h5>
                        <p className="text-[11px] text-slate-500 font-medium">{exp.organization}</p>
                        <span className="text-[10px] text-emerald-700 font-bold">{exp.period}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                        title="Remove experience"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Action Buttons Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs flex items-center gap-2 transition shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes ✓</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
