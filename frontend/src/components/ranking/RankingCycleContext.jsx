import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

const stages = [['overview','Overview'],['annual-reviews','Annual Reviews'],['submissions','Submissions'],['evaluations','Evaluations'],['results','Results']]

export default function RankingCycleContext({ cycle, track, trackKey }) {
  const base = `/hr/ranking-cycles/${encodeURIComponent(cycle.id)}`
  return <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 px-4 pt-4 text-sm text-slate-500 sm:px-6"><Link className="hover:text-emerald-800" to="/hr/ranking-cycles">Ranking Cycles</Link><ChevronRight className="h-4 w-4"/><span className="font-semibold text-slate-800 dark:text-slate-200">{cycle.cycle_name}</span>{track && <><ChevronRight className="h-4 w-4"/><span>{track.personnel_group === 'FACULTY' ? 'Faculty' : 'Non-Teaching Faculty'}</span></>}</nav>
    <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{cycle.cycle_name}</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">AY {cycle.academic_year}{track ? ` · ${track.period_name}` : ' · Cycle overview'}</p></div>{track && <div className="flex gap-2"><NavLink to={`${base}/faculty/overview`} className={`rounded-lg px-3 py-2 text-sm font-bold ${trackKey==='faculty'?'bg-emerald-800 text-white':'border border-slate-300 dark:border-slate-700'}`}>Faculty</NavLink><NavLink to={`${base}/non-teaching-faculty/overview`} className={`rounded-lg px-3 py-2 text-sm font-bold ${trackKey==='non-teaching-faculty'?'bg-emerald-800 text-white':'border border-slate-300 dark:border-slate-700'}`}>Non-Teaching Faculty</NavLink></div>}</div>
    {track && <nav aria-label="Ranking track stages" className="flex overflow-x-auto px-4 sm:px-6">{stages.map(([key,label])=><NavLink key={key} to={`${base}/${trackKey}/${key}`} className={({isActive})=>`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold ${isActive?'border-emerald-700 text-emerald-800 dark:text-emerald-300':'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>{label}</NavLink>)}</nav>}
  </div>
}
