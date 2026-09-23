import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { getCurrentUser } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import { WORKSPACE_NAVIGATION } from '../../config/navigationCatalog'
import { getAuthorizedNavigationForSession, isNavigationItemActive } from '../../config/personnelRoleNavigation'
import { normalizeRoleContext } from '../../utils/roleContext'
import AdminOnboardingGuideWidget from '../common/AdminOnboardingGuideWidget'
import { BrandLockup } from '../brand'

const WORKFLOW_GROUP_LABELS = {
  overview: 'Overview', setup: 'Student & Institutional Setup', evaluation: 'Portfolio & Evaluation',
  credentials: 'Events & Certificates', governance: 'Governance & Reports'
}

function CollapsedTooltip({ label, children, enabled }) {
  const id = useId()
  const anchorRef = useRef(null)
  const [position, setPosition] = useState(null)
  const show = () => {
    if (!enabled || !anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    setPosition({ left: rect.right + 10, top: rect.top + rect.height / 2 })
  }
  const hide = () => setPosition(null)
  const trigger = React.cloneElement(children, enabled ? { 'aria-describedby': id } : {})
  return <div ref={anchorRef} className="relative" onMouseEnter={show} onMouseLeave={hide} onFocusCapture={show} onBlurCapture={hide}>
    {trigger}
    {enabled && position && createPortal(<span id={id} role="tooltip" style={{ left: position.left, top: position.top }} className="pointer-events-none fixed z-[100] -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg dark:bg-slate-100 dark:text-slate-950">{label}</span>, document.body)}
  </div>
}

export default function Sidebar({ currentUser, onCloseMobile, collapsed = false, onToggleCollapsed }) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user: authUser, activeRoleContext: authRoleContext } = useAuth() || {}
  const user = authUser || currentUser || getCurrentUser()
  const activeContext = normalizeRoleContext(authRoleContext || user?.active_role_context || user?.role)
  const workspace = WORKSPACE_NAVIGATION[activeContext] || WORKSPACE_NAVIGATION.personnel
  const WorkspaceIcon = workspace.icon
  const [searchTerm, setSearchTerm] = useState('')
  const searchRef = useRef(null)

  useEffect(() => { setSearchTerm('') }, [activeContext, collapsed])

  const navItems = useMemo(() => user ? getAuthorizedNavigationForSession({ ...user, active_role_context: activeContext, assigned_roles: user.assigned_roles || [activeContext] }) : [], [user, activeContext])
  const filteredNavItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return query ? navItems.filter(item => item.label.toLowerCase().includes(query)) : navItems
  }, [navItems, searchTerm])
  const activeTab = searchParams.get('tab') || 'overview'
  let previousGroup = null

  return <aside className={`flex h-screen flex-col border-r border-slate-200 bg-white font-sans text-slate-900 shadow-[2px_0_14px_rgba(15,23,42,.035)] transition-[width] duration-200 dark:border-slate-800 dark:bg-[#101a28] dark:text-slate-100 ${collapsed ? 'w-64 md:w-[72px]' : 'w-64'}`} aria-label="Application navigation">
    <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800">
      <Link to="/" onClick={onCloseMobile} className={`group flex min-w-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${collapsed ? 'md:mx-auto' : ''}`} aria-label="AchieveNest home">
        <span className="rounded-lg bg-white px-1.5 py-1 dark:bg-white"><span className={collapsed ? 'hidden md:block' : 'hidden'}><BrandLockup compact /></span><span className={collapsed ? 'md:hidden' : ''}><BrandLockup /></span></span>
      </Link>
      <button ref={searchRef} type="button" onClick={onCloseMobile} className="grid h-11 w-11 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 md:hidden dark:hover:bg-slate-800" aria-label="Close navigation drawer"><X className="h-5 w-5" /></button>
    </header>

    <div className={`shrink-0 px-3 pt-4 ${collapsed ? 'md:hidden' : ''}`}>
      <label className="relative block"><span className="sr-only">Search modules</span><Search className="pointer-events-none absolute left-3 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-500" /><input type="search" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Search modules..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-11 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400" />{searchTerm && <button type="button" onClick={() => setSearchTerm('')} className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-lg text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:hover:text-white" aria-label="Clear navigation search"><X className="h-4 w-4" /></button>}</label>
    </div>

    <div className="mx-3 mt-4 shrink-0">
      <CollapsedTooltip label={workspace.label} enabled={collapsed}><div tabIndex={collapsed ? 0 : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl bg-slate-50 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:bg-slate-900 dark:text-slate-100 ${collapsed ? 'px-3 md:justify-center md:px-0' : 'px-3'}`}>
        <WorkspaceIcon className="h-[19px] w-[19px] shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
        <div className={`min-w-0 ${collapsed ? 'md:hidden' : ''}`}><span className="block text-[10px] font-bold uppercase tracking-[.14em] text-slate-600 dark:text-slate-400">Workspace</span><span className="block truncate text-xs font-bold">{workspace.label}</span></div>
      </div></CollapsedTooltip>
    </div>

    <nav aria-label={`${workspace.label} modules`} className="mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-color:rgb(203_213_225)_transparent] [scrollbar-width:thin]">
      {filteredNavItems.length === 0 ? <p className={`px-2 py-6 text-center text-xs font-medium text-slate-600 dark:text-slate-400 ${collapsed ? 'md:hidden' : ''}`}>No modules found</p> : filteredNavItems.map(item => {
        const Icon = item.icon
        const active = isNavigationItemActive(item, location.pathname, activeTab)
        const showGroup = item.workflowFamily && item.workflowFamily !== previousGroup
        previousGroup = item.workflowFamily || previousGroup
        return <React.Fragment key={item.id || item.label}>
          {showGroup && <p className={`px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[.14em] text-slate-600 dark:text-slate-400 ${collapsed ? 'md:hidden' : ''}`}>{WORKFLOW_GROUP_LABELS[item.workflowFamily] || item.workflowFamily}</p>}
          <div className="my-0.5">
            <CollapsedTooltip label={item.label} enabled={collapsed}><Link to={item.path} onClick={onCloseMobile} aria-label={collapsed ? item.label : undefined} aria-current={active ? 'page' : undefined} className={`relative flex min-h-11 w-full items-center gap-3 rounded-[10px] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-950 ${collapsed ? 'px-3 md:justify-center md:px-0' : 'px-3'} ${active ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/55 dark:text-emerald-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white'}`}>
              {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-emerald-700 dark:bg-emerald-400" aria-hidden="true" />}
              <Icon className={`h-[19px] w-[19px] shrink-0 ${active ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} aria-hidden="true" />
              <span className={`min-w-0 leading-5 ${collapsed ? 'md:hidden' : ''}`}>{item.label}</span>
            </Link></CollapsedTooltip>
          </div>
        </React.Fragment>
      })}
    </nav>

    {workspace.showOnboardingGuide && <div className={`shrink-0 px-3 pb-2 ${collapsed ? 'md:hidden' : ''}`}><AdminOnboardingGuideWidget currentUser={user} activeRoleContext={activeContext} /></div>}
    <footer className="hidden shrink-0 border-t border-slate-100 p-3 md:block dark:border-slate-800">
      <button type="button" onClick={onToggleCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className={`flex min-h-11 w-full items-center rounded-[10px] text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white ${collapsed ? 'justify-center' : 'gap-2 px-3'}`}>
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
      </button>
    </footer>
  </aside>
}
