import React from 'react'
import { Check } from 'lucide-react'

// Shared building blocks so the Faculty and Non-Teaching accomplishment modals
// look and behave the same (header stepper + numbered review cards).

export function StepChip({ number, label, state }) {
  const tone = state === 'active' ? 'bg-white text-emerald-950' : state === 'done' ? 'bg-emerald-800 text-white' : 'bg-white/5 text-emerald-100/70 ring-1 ring-inset ring-white/15'
  return <li className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${tone}`} aria-current={state === 'active' ? 'step' : undefined}>
    <span className="grid h-4 w-4 place-items-center rounded-full text-[10px] leading-none">{state === 'done' ? <Check className="h-3 w-3" aria-hidden="true" /> : number}</span>{label}
  </li>
}

export function CardHeading({ id, number, title, aside }) {
  return <div className="flex items-center justify-between gap-3"><h3 id={id} className="flex items-center gap-2 text-sm font-extrabold text-slate-950"><span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-900 text-[11px] font-bold text-white" aria-hidden="true">{number}</span>{title}</h3>{aside}</div>
}

export function StepProgress({ chipState }) {
  return <ol aria-label="Progress" className="hidden items-center gap-1.5 min-[820px]:flex"><StepChip number={1} label="Upload" state={chipState(1)} /><li aria-hidden="true" className="text-emerald-200/60">→</li><StepChip number={2} label="Review" state={chipState(2)} /><li aria-hidden="true" className="text-emerald-200/60">→</li><StepChip number={3} label="Save" state={chipState(3)} /></ol>
}
