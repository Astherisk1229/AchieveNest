import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  UserPlus,
  Crown,
  GraduationCap,
  ClipboardCheck,
  Users,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react'

export default function InstitutionalWorkflowGuideBar({ currentStep = 1, activeAdmin = 'hr' }) {
  const navigate = useNavigate()

  const steps = [
    {
      step: 1,
      title: 'Depts & Programs',
      desc: 'Academic Units',
      authority: 'HR / OSAD',
      icon: Building2,
      path: '/osad/dashboard?tab=departments'
    },
    {
      step: 2,
      title: 'Onboard Faculty',
      desc: 'Personnel Accounts',
      authority: 'HR Admin',
      icon: UserPlus,
      path: '/hr/dashboard?tab=personnel'
    },
    {
      step: 3,
      title: 'Assign Deans',
      desc: 'College Leadership',
      authority: 'HR Admin',
      icon: Crown,
      path: '/osad/dashboard?tab=departments'
    },
    {
      step: 4,
      title: 'Assign Coordinators',
      desc: 'Degree Programs',
      authority: 'HR Admin',
      icon: GraduationCap,
      path: '/osad/dashboard?tab=departments'
    },
    {
      step: 5,
      title: 'Assign Dept Secs',
      desc: 'Portfolio Evaluators',
      authority: 'HR Admin',
      icon: ClipboardCheck,
      path: '/hr/dashboard?tab=personnel'
    },
    {
      step: 6,
      title: 'Import Students',
      desc: 'Student Directory',
      authority: 'OSAD Admin',
      icon: Users,
      path: '/osad/dashboard?tab=accounts'
    },
    {
      step: 7,
      title: 'Orgs & Clubs',
      desc: 'Student Leadership',
      authority: 'OSAD Admin',
      icon: ShieldAlert,
      path: '/osad/dashboard?tab=organizations'
    },
    {
      step: 8,
      title: 'Assign Moderators',
      desc: 'Faculty Advisors',
      authority: 'OSAD Admin',
      icon: ShieldCheck,
      path: '/osad/dashboard?tab=organizations'
    }
  ]

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs font-sans space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2d8a4e] animate-pulse"></span>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span>Seamless Institutional Governance &amp; Setup Flow</span>
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-bold">
          Step {currentStep} of 8 • Integrated HR &amp; OSAD Workflow
        </span>
      </div>

      {/* Stepper Scroll Container */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {steps.map((s, idx) => {
          const Icon = s.icon
          const isActive = currentStep === s.step
          const isDone = s.step < currentStep

          return (
            <React.Fragment key={s.step}>
              <button
                type="button"
                onClick={() => navigate(s.path)}
                className={`p-2.5 rounded-xl border text-left transition shrink-0 cursor-pointer flex items-center gap-2.5 ${
                  isActive
                    ? 'bg-[#1b4332] text-white border-[#2d8a4e] shadow-md ring-2 ring-emerald-500/30'
                    : isDone
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100/50'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
                title={`Step ${s.step}: ${s.title} (${s.authority})`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950'
                    : isDone
                    ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black opacity-75">#{s.step}</span>
                    <span className="text-xs font-black whitespace-nowrap">{s.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                      s.authority.includes('HR')
                        ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300'
                        : 'bg-emerald-400/20 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {s.authority}
                    </span>
                  </div>
                </div>
              </button>

              {idx < steps.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
