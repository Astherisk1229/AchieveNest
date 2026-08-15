import React, { useState } from 'react'
import { X, UserPlus, Check, ChevronRight, ChevronLeft, ShieldCheck, Building2, User, Award } from 'lucide-react'

export default function OnboardPersonnelModal({
  isOpen,
  onClose,
  onSubmit
}) {
  const [step, setStep] = useState(1)

  // Step 1: Personal Info
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')

  // Step 2: Employment Info
  const [employeeId, setEmployeeId] = useState(`EMP-2026-${Math.floor(1000 + Math.random() * 9000)}`)
  const [academicRank, setAcademicRank] = useState('Assistant Professor I')
  const [employmentStatus, setEmploymentStatus] = useState('Full-Time Permanent')
  const [tenureYears, setTenureYears] = useState('1')

  // Step 3: Organizational Assignment
  const [college, setCollege] = useState('CEAC')
  const [department, setDepartment] = useState('Department of Computer Studies')

  // Step 4: Account & Role
  const [userType, setUserType] = useState('personnel')
  const [tempPassword, setTempPassword] = useState('NDMU-Pass2026!')

  const collegeDeptMap = {
    'CEAC': ['Department of Computer Studies', 'Department of Engineering', 'Department of Physical Sciences'],
    'CBA': ['Department of Business Management'],
    'CAS': ['Department of Arts & Humanities'],
  }

  const handleCollegeChange = (col) => {
    setCollege(col)
    const validDepts = collegeDeptMap[col] || []
    setDepartment(validDepts[0] || '')
  }

  if (!isOpen) return null

  const handleFinalSubmit = (e) => {
    e.preventDefault()
    const fullCollegeName = college === 'CEAC' ? 'CEAC - College of Engineering, Architecture, and Computing' :
                           college === 'CBA' ? 'CBA - College of Business Administration' :
                           'CAS - College of Arts and Sciences'

    if (onSubmit) {
      onSubmit({
        full_name: fullName,
        email,
        employee_id: employeeId,
        academic_rank: academicRank,
        employment_status: employmentStatus,
        tenure_years: parseInt(tenureYears, 10) || 1,
        college: fullCollegeName,
        department,
        user_type: userType,
        tempPassword
      })
    }
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 font-sans">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-black text-[#1b4332] dark:text-emerald-400 uppercase tracking-wider">
              <UserPlus className="w-4 h-4" />
              <span>Onboard Personnel (Step {step} of 5)</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s <= step ? 'bg-[#1b4332] dark:bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>

          {/* Form Step Content */}
          <form onSubmit={step === 5 ? handleFinalSubmit : (e) => { e.preventDefault(); setStep(prev => prev + 1); }}>
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  <User className="w-4 h-4 text-[#1b4332] dark:text-emerald-400" />
                  <span>Step 1: Personal Information</span>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Ana Reyes"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:border-[#1b4332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Institutional Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. areyes@ndmu.edu.ph"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:border-[#1b4332]"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  <Award className="w-4 h-4 text-[#1b4332] dark:text-emerald-400" />
                  <span>Step 2: Employment Information</span>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs font-bold focus:outline-none focus:border-[#1b4332]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Academic Rank</label>
                    <select
                      value={academicRank}
                      onChange={e => setAcademicRank(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:border-[#1b4332]"
                    >
                      <option value="Instructor I">Instructor I</option>
                      <option value="Instructor II">Instructor II</option>
                      <option value="Instructor III">Instructor III</option>
                      <option value="Assistant Professor I">Assistant Professor I</option>
                      <option value="Assistant Professor II">Assistant Professor II</option>
                      <option value="Associate Professor I">Associate Professor I</option>
                      <option value="Associate Professor II">Associate Professor II</option>
                      <option value="Full Professor I">Full Professor I</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Employment Status</label>
                    <select
                      value={employmentStatus}
                      onChange={e => setEmploymentStatus(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:border-[#1b4332]"
                    >
                      <option value="Full-Time Permanent">Full-Time Permanent</option>
                      <option value="Full-Time Probationary">Full-Time Probationary</option>
                      <option value="Part-Time Lecturer">Part-Time Lecturer</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  <Building2 className="w-4 h-4 text-[#1b4332] dark:text-emerald-400" />
                  <span>Step 3: Organizational Assignment</span>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">College</label>
                  <select
                    value={college}
                    onChange={e => handleCollegeChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:border-[#1b4332]"
                  >
                    <option value="CEAC">CEAC - Engineering &amp; Computing</option>
                    <option value="CBA">CBA - Business Administration</option>
                    <option value="CAS">CAS - Arts &amp; Sciences</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:border-[#1b4332]"
                  >
                    {(collegeDeptMap[college] || []).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-[#1b4332] dark:text-emerald-400" />
                  <span>Step 4: Account &amp; Role Access</span>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Account Role</label>
                  <select
                    value={userType}
                    onChange={e => setUserType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:border-[#1b4332]"
                  >
                    <option value="personnel">Faculty / Academic Personnel</option>
                    <option value="program_coordinator">Program Coordinator</option>
                    <option value="department_secretary">Department Secretary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Temporary Password</label>
                  <input
                    type="text"
                    value={tempPassword}
                    onChange={e => setTempPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs font-bold focus:outline-none focus:border-[#1b4332]"
                  />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  <Check className="w-4 h-4 text-[#1b4332] dark:text-emerald-400" />
                  <span>Step 5: Review &amp; Confirm Account Onboarding</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <p><strong className="text-slate-500">Name:</strong> {fullName}</p>
                  <p><strong className="text-slate-500">Email:</strong> {email}</p>
                  <p><strong className="text-slate-500">Employee ID:</strong> {employeeId}</p>
                  <p><strong className="text-slate-500">College:</strong> {college}</p>
                  <p><strong className="text-slate-500">Department:</strong> {department}</p>
                  <p><strong className="text-slate-500">Academic Rank:</strong> {academicRank}</p>
                  <p><strong className="text-slate-500">Status:</strong> {employmentStatus}</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-5">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(prev => prev - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-600 hover:bg-slate-100 flex items-center gap-1 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : <div />}

              {step < 5 ? (
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1b4332] hover:bg-[#143326] text-white text-xs font-extrabold flex items-center gap-1 transition cursor-pointer ml-auto"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143326] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer ml-auto"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Account Onboarding</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
