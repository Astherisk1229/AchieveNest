import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ChevronLeft, X } from 'lucide-react'
import { getSettingsRoute } from '../../utils/portalRoutes'
import portfolioService from '../../services/portfolioService'
import portfolioConfigurationService from '../../services/portfolioConfigurationService'
import { getSubcategorySchema } from '../../config/portfolioFormSchemaRegistry'
import { HELP_ROLE_LABELS, ROLE_HELP_TOPICS, SHARED_HELP_TOPICS, getPersonnelGroup, getRoleHelpTopics, getRoleTerms } from '../../config/helpGuideContent'
import { CANONICAL_ROLES } from '../../utils/roleContext'

const categoryTopic = { id: 'categories', title: 'Categories & Subcategories', summary: 'Browse the categories currently defined for this workflow.' }
const settingsTopic = { id: 'settings', title: 'Settings', summary: 'Open Settings for the current account.' }
const rowStyle = 'flex w-full items-start justify-between gap-4 rounded-lg px-3 py-3 text-left text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-slate-100 dark:hover:bg-emerald-950/40'
const headingStyle = 'text-base font-extrabold text-slate-950 dark:text-white'

function findCategoryPath(nodes, targetId, path = []) {
  for (const node of nodes) {
    const nextPath = [...path, node]
    if (node.id === targetId || node.code === targetId) return nextPath
    const nested = findCategoryPath(node.children || [], targetId, nextPath)
    if (nested) return nested
  }
  return null
}

function parseRequirements(value) {
  if (value && typeof value === 'object') return value
  if (typeof value === 'string') {
    try { return JSON.parse(value) } catch { return {} }
  }
  return {}
}

function formatPersonnelAreaTitle(area) {
  const sourceName = String(area?.name || '').trim()
  const sourceCode = String(area?.area_code || '').trim()
  const areaCode = sourceCode.replace(/^AREA[_\s-]?/i, '').match(/^[A-Z]$/i)?.[0]
  const nameWithoutPrefix = sourceName.replace(/^Area\s+[A-Z]\s*[:—-]?\s*/i, '').trim()
  if (areaCode) return `Area ${areaCode.toUpperCase()} — ${nameWithoutPrefix || sourceName}`
  return sourceName || 'Area'
}

function getStudentCategoryTree(categories) {
  return categories.map((category) => ({
    id: category.id,
    code: category.code,
    name: category.name,
    description: category.description || '',
    needsReview: !category.description,
    children: (category.subcategories || []).map((subcategory) => {
      const requirements = parseRequirements(subcategory.metadata_requirements)
      return {
        id: subcategory.id,
        code: subcategory.code,
        name: subcategory.name,
        description: subcategory.description || '',
        fields: [...(requirements.core_fields || []), ...(requirements.structured_fields || [])].map((field) => ({ label: field.label, required: field.required !== false })),
        formFields: (getSubcategorySchema(subcategory.code)?.fields || []).map((field) => ({ label: field.label, required: field.required !== false })),
        evidence: requirements.supporting_evidence_required === true ? 'A supporting evidence file is required. The form accepts PDF, JPEG, or PNG files up to 10 MiB.' : '',
        rules: [],
        needsReview: !subcategory.description && Object.keys(requirements).length === 0
      }
    })
  }))
}

function CategoryDetails({ item }) {
  const sections = []
  if (item.description) sections.push(['What is this / what belongs here', item.description])
  else sections.push(['What is this / what belongs here', 'The canonical system defines this name but does not provide an authoritative explanation of what belongs here. Please confirm this content with the responsible administrator.'])
  if (item.examples?.length) sections.push(['Examples from the form', item.examples.join(' · ')])
  if (item.fields?.length || item.formFields?.length) {
    const fields = item.fields?.length ? item.fields : item.formFields
    sections.push(['Information requested by the form', fields.map((field) => `${field.label}${field.required ? ' (required)' : ' (optional)'}`).join(' · ')])
  }
  if (item.evidence) sections.push(['Supporting evidence', typeof item.evidence === 'string' ? item.evidence : JSON.stringify(item.evidence)])
  if (item.rules?.length) sections.push(['Form rules', item.rules.join(' ')])
  if (!item.examples?.length && !item.evidence) sections.push(['Examples and evidence', 'The available source does not define examples or a specific evidence type for this entry. Follow the form requirements and ask the responsible office if unsure.'])
  return <div className="space-y-4">
    {sections.map(([title, body]) => <section key={title}><h4 className="text-xs font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">{title}</h4><p className="mt-1.5 text-sm leading-6 text-slate-700 dark:text-slate-200">{body}</p></section>)}
    {item.needsReview && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">More authoritative guidance for this item is not available in the current repository and needs administrator review.</p>}
  </div>
}

export default function HelpGuidePanel({ role, user, onClose, onBack, request, onRequestConsumed }) {
  const [stack, setStack] = useState([])
  const [studentCategories, setStudentCategories] = useState([])
  const [studentCategoriesState, setStudentCategoriesState] = useState('idle')
  const [personnelCriteriaTree, setPersonnelCriteriaTree] = useState([])
  const [personnelCriteriaState, setPersonnelCriteriaState] = useState('idle')
  const firstFocus = useRef(null)
  const backButtonRef = useRef(null)
  const headingRef = useRef(null)
  const hasNavigatedRef = useRef(false)
  const settingsPath = getSettingsRoute(user)
  const roleLabel = HELP_ROLE_LABELS[role] || 'Current role'
  const roleTopics = useMemo(() => getRoleHelpTopics(role), [role])
  const topics = useMemo(() => {
    if (role === CANONICAL_ROLES.HR_STAFF) return roleTopics
    if (role === CANONICAL_ROLES.PERSONNEL) return roleTopics
    const shared = SHARED_HELP_TOPICS.filter((item) => !['terms'].includes(item.id))
    const beforeCategories = shared.filter((item) => ['about'].includes(item.id))
    const middle = roleTopics
    const afterCategories = shared.filter((item) => ['notifications', 'faq', 'need-help'].includes(item.id))
    return [...beforeCategories, ...middle, ...(role === 'student' || role === 'personnel' ? [categoryTopic] : []), settingsTopic, ...afterCategories.filter((item) => item.id !== 'need-help'), getRoleTerms(role), ...afterCategories.filter((item) => item.id === 'need-help')]
  }, [role, roleTopics])

  const categoryTree = useMemo(() => role === 'student'
    ? getStudentCategoryTree(studentCategories)
    : role === CANONICAL_ROLES.PERSONNEL ? personnelCriteriaTree : [], [role, studentCategories, personnelCriteriaTree])

  useEffect(() => {
    firstFocus.current?.focus()
  }, [])

  useEffect(() => {
    if (!hasNavigatedRef.current) return
    if (stack.length > 0) backButtonRef.current?.focus()
    else headingRef.current?.focus()
  }, [stack])

  useEffect(() => {
    if (role !== 'student' || studentCategoriesState !== 'idle') return
    let active = true
    setStudentCategoriesState('loading')
    portfolioService.fetchCategories().then((items) => {
      if (!active) return
      setStudentCategories(Array.isArray(items) ? items : [])
      setStudentCategoriesState('ready')
    }).catch(() => { if (active) setStudentCategoriesState('error') })
    return () => { active = false }
  }, [role, studentCategoriesState])

  useEffect(() => {
    if (role !== CANONICAL_ROLES.PERSONNEL || personnelCriteriaState !== 'idle') return undefined
    let active = true
    setPersonnelCriteriaState('loading')
    portfolioConfigurationService.fetchWorkspaceConfiguration().then((response) => {
      if (!active) return
      const config = response?.data?.data || response?.data || response
      const areas = Array.isArray(config?.areas) ? config.areas : []
      const tree = areas
        .filter((area) => area.is_personnel_entry_allowed === true || area.entry_policy === 'personnel_entry_allowed')
        .map((area) => ({
          ...area,
          id: area.id || area.area_code,
          title: formatPersonnelAreaTitle(area),
          name: formatPersonnelAreaTitle(area),
          children: (area.categories || []).map((category) => ({
            ...category,
            id: category.id || category.category_code,
            title: category.category_code ? `${category.category_code} ${category.name}` : category.name,
            name: category.category_code ? `${category.category_code} ${category.name}` : category.name,
            children: (category.subcategories || []).map((subcategory) => ({
              ...subcategory,
              id: subcategory.id || subcategory.subcategory_code,
              title: subcategory.name,
              name: subcategory.name
            }))
          }))
        }))
      setPersonnelCriteriaTree(tree)
      setPersonnelCriteriaState('ready')
    }).catch(() => {
      if (active) setPersonnelCriteriaState('error')
    })
    return () => { active = false }
  }, [role, personnelCriteriaState])

  useEffect(() => {
    if (!request) return
    if (role === 'student' && request.categoryId && ['idle', 'loading'].includes(studentCategoriesState)) return
    let nextStack = []
    const topicId = request.topicId
    if (topicId === 'categories' || request.categoryId || request.subcategoryId) {
      nextStack = [{ type: 'categories', title: categoryTopic.title }]
      const categoryPath = request.categoryId ? findCategoryPath(categoryTree, request.categoryId) : null
      if (categoryPath) {
        categoryPath.forEach((item) => nextStack.push({ type: 'category', item, title: item.name }))
        const category = categoryPath[categoryPath.length - 1]
        const subcategoryPath = request.subcategoryId ? findCategoryPath(category.children || [], request.subcategoryId) : null
        if (subcategoryPath) subcategoryPath.forEach((item, index) => nextStack.push({ type: index === subcategoryPath.length - 1 ? 'detail' : 'category', item, title: item.name }))
      }
    } else {
      const match = [...topics, ...(ROLE_HELP_TOPICS[role] || [])].find((item) => item.id === topicId)
      if (match) nextStack = [{ type: 'topic', item: match, title: match.title }]
    }
    hasNavigatedRef.current = nextStack.length > 0
    setStack(nextStack)
    onRequestConsumed?.()
  }, [request, categoryTree, topics, role, studentCategoriesState, onRequestConsumed])

  const current = stack[stack.length - 1]
  const goBack = () => { hasNavigatedRef.current = true; setStack((value) => value.slice(0, -1)) }
  const openTopic = (item) => {
    if (item.id === 'settings') return
    hasNavigatedRef.current = true
    if (item.id === 'categories') setStack((value) => [...value, { type: 'categories', title: item.title }])
    else setStack((value) => [...value, { type: 'topic', item, title: item.title }])
  }

  const openCategoryItem = (item) => {
    hasNavigatedRef.current = true
    const type = item.children?.length ? 'category' : 'detail'
    setStack((value) => [...value, { type, item, title: item.name }])
  }

  const renderTopic = (item) => <div className="space-y-5">
    {item.summary && <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{item.summary}</p>}
    {item.sections?.map((section) => section.type === 'faq' ? <section key={section.type} className="space-y-2">
      {section.items.map(([question, answer]) => <details key={question} className="group rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-700">
        <summary className="cursor-pointer text-sm font-bold leading-5 text-emerald-950 marker:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-slate-100 dark:marker:text-emerald-300">{question}</summary>
        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{role === CANONICAL_ROLES.PERSONNEL && question === 'Who evaluates my portfolio?' ? whoEvaluatesAnswer : answer}</p>
      </details>)}
    </section> : <section key={section.title}>
      <h4 className="text-sm font-extrabold text-slate-950 dark:text-white">{section.title}</h4>
      {section.body && <p className="mt-1.5 text-sm leading-6 text-slate-700 dark:text-slate-200">{section.body}</p>}
      {section.items && <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-200">{section.items.map((line) => <li key={line}>{line}</li>)}</ol>}
    </section>)}
    {item.id === 'about' && <section><h4 className="text-sm font-extrabold text-slate-950 dark:text-white">What you use it for</h4><p className="mt-1.5 text-sm leading-6 text-slate-700 dark:text-slate-200">{role === 'student' ? 'Use AchieveNest to maintain student achievement records, provide supporting evidence, monitor review outcomes, and view your Portfolio.' : role === 'personnel' ? 'Use AchieveNest to maintain your profile and accomplishments, then participate in the personnel Portfolio and evaluation workflow.' : role === 'program_coordinator' ? 'Use AchieveNest to review student achievement submissions routed to your assigned academic program.' : role === 'organization_moderator' ? 'Use AchieveNest to manage the assigned organization’s events, attendance, and certificate actions.' : role === 'dean' ? 'Use AchieveNest to review personnel and annual-review work within your assigned college scope.' : role === 'hr_staff' ? 'Use AchieveNest to administer personnel records, ranking periods, and HR evaluation workflows.' : 'Use AchieveNest for OSAD student and organization setup, award, certificate, and governance workflows available to your role.'}</p></section>}
  </div>

  const isTeachingPersonnel = ['faculty', 'academic'].includes(getPersonnelGroup(user))
  const isNonTeachingPersonnel = ['non_teaching_faculty', 'non_academic'].includes(getPersonnelGroup(user))
  const whoEvaluatesAnswer = isTeachingPersonnel
    ? 'Your assigned College Dean performs the initial evaluation. After the Dean’s evaluation, your portfolio proceeds to HR for the applicable final review, deliberation, and finalization.'
    : isNonTeachingPersonnel
      ? 'HR evaluates your portfolio directly according to the applicable evaluation criteria and workflow.'
      : 'Your Personnel classification is not available in this session. Check your Profile or contact HR to confirm your evaluation route.'

  const renderPersonnelPortfolio = () => <div className="space-y-5 p-3">
    <section>
      <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">Adding Accomplishments</h3>
      <p className="mt-1.5 text-sm leading-6 text-slate-700 dark:text-slate-200">Add an accomplishment by choosing the correct Area, Category, and Subcategory, then provide the required information and supporting evidence.</p>
      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">Choose the category and subcategory that best describe what your accomplishment represents and the evidence you are submitting. Only accomplishments that satisfy the applicable evaluation period and ranking criteria will be considered for your portfolio.</p>
      <h4 className="mt-4 text-sm font-extrabold text-slate-950 dark:text-white">Where does my accomplishment belong?</h4>
      <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">Review the available Area, Category, and Subcategory options before adding your accomplishment. Select the criterion that most closely matches the accomplishment and its supporting evidence.</p>
      {personnelCriteriaState === 'loading' && <p role="status" className="mt-3 text-sm text-slate-600 dark:text-slate-300">Loading current ranking criteria…</p>}
      {personnelCriteriaState === 'error' && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">Current ranking criteria could not be loaded. Open the accomplishment form to see the available criteria.</p>}
      {personnelCriteriaState === 'ready' && personnelCriteriaTree.length === 0 && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">The current ranking configuration does not provide Personnel-selectable accomplishment categories.</p>}
      {personnelCriteriaTree.length > 0 && <div className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
        {personnelCriteriaTree.map((area) => <details key={area.id} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-bold text-emerald-950 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 dark:text-slate-100 dark:hover:bg-emerald-950/30"><span>{area.title}</span><span aria-hidden="true" className="text-slate-400 transition group-open:rotate-90">›</span></summary>
          <div className="border-t border-slate-100 bg-slate-50/70 p-2 dark:border-slate-800 dark:bg-slate-900/40">
            {area.description && <p className="px-2 py-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{area.description}</p>}
            {area.children.map((category) => <details key={category.id} className="group/category border-b border-slate-200 last:border-0 dark:border-slate-700">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-sm font-semibold text-slate-800 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-slate-100 dark:hover:bg-slate-800"><span>{category.title}</span><span aria-hidden="true" className="text-slate-400 transition group-open/category:rotate-90">›</span></summary>
              <div className="space-y-2 px-2 pb-3 pt-1">
                {category.description && <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">{category.description}</p>}
                <ul className="space-y-1.5 pl-3">
                  {category.children.map((subcategory) => <li key={subcategory.id} className="rounded-lg bg-white px-2.5 py-2 text-xs dark:bg-slate-800">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{subcategory.title}</span>
                    {subcategory.description && <span className="mt-1 block leading-5 text-slate-600 dark:text-slate-300">{subcategory.description}</span>}
                    {subcategory.proof_requirement_hint && <span className="mt-1 block text-slate-500 dark:text-slate-400">Evidence example: {subcategory.proof_requirement_hint}</span>}
                  </li>)}
                </ul>
              </div>
            </details>)}
          </div>
        </details>)}
      </div>}
      <section className="mt-4">
        <h4 className="text-sm font-extrabold text-slate-950 dark:text-white">Supporting Evidence</h4>
        <p className="mt-1.5 text-sm leading-6 text-slate-700 dark:text-slate-200">Include the supporting document required by the selected criterion and review the information before saving the accomplishment.</p>
        {isTeachingPersonnel && <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">If AchieveNest extracts information from the uploaded document, check the extracted details for accuracy before saving the accomplishment.</p>}
      </section>
    </section>
    <section className="border-t border-slate-200 pt-4 dark:border-slate-700">
      <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">Evaluation Process</h3>
      <div className="mt-2 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
        <p>Review your portfolio and supporting evidence before submitting it for evaluation.</p>
        <p>You may continue editing your portfolio while formal evaluation has not yet started. Once evaluation begins, editing is restricted so that the information being reviewed cannot be changed during evaluation.</p>
        <p>If your portfolio is returned for revision, review the evaluator’s comments, make the required changes, and submit it again.</p>
      </div>
      <h4 className="mt-4 text-sm font-extrabold text-slate-950 dark:text-white">Your Evaluation</h4>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-100" aria-label="Personnel evaluation workflow">
        {(isTeachingPersonnel ? ['Personnel', 'College Dean', 'HR', 'Finalized'] : isNonTeachingPersonnel ? ['Personnel', 'HR', 'Finalized'] : ['Confirm classification with HR']).map((step, index, steps) => <React.Fragment key={step}><span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800">{step}</span>{index < steps.length - 1 && <ArrowDown className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />}</React.Fragment>)}
      </div>
      {isTeachingPersonnel && <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">Your portfolio is first evaluated by your assigned College Dean. After the Dean’s evaluation, it proceeds to HR for the applicable final review, deliberation, and finalization.</p>}
      {isNonTeachingPersonnel && <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">Your portfolio is evaluated directly by HR according to the applicable evaluation criteria and workflow.</p>}
      <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">Once finalized, the completed evaluation is retained as part of your evaluation history.</p>
    </section>
  </div>

  return <section role="dialog" aria-modal="false" aria-label="Help & Guide" className="fixed right-3 top-[4.5rem] z-[60] flex max-h-[calc(100dvh-5.25rem)] w-[min(420px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-emerald-900/15 bg-white text-slate-900 shadow-[0_18px_50px_-20px_rgba(15,23,42,.42)] md:absolute md:right-0 md:top-full md:mt-2 md:max-h-[min(76vh,720px)] dark:border-slate-700 dark:bg-[#131e2e] dark:text-slate-100">
    <header className="shrink-0 border-b border-slate-200 px-4 py-3.5 dark:border-slate-700">
      <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0">{stack.length > 0 ? <button ref={backButtonRef} type="button" onClick={goBack} aria-label="Back to help topics" className="mb-1 inline-flex items-center rounded px-1 py-0.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40"><ChevronLeft className="h-3.5 w-3.5" aria-hidden="true"/>Help topics</button> : onBack ? <button type="button" onClick={onBack} aria-label="Back to account menu" className="mb-2 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-sm font-bold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40"><ChevronLeft className="h-4 w-4" aria-hidden="true"/><span>Back</span></button> : null}<h2 ref={headingRef} tabIndex={-1} className={`${headingStyle} focus:outline-none`}>{role === CANONICAL_ROLES.PERSONNEL && current?.item?.id === 'faq' ? 'Frequently Asked Questions' : current?.title || 'Help & Guide'}</h2>{role === CANONICAL_ROLES.PERSONNEL || role === CANONICAL_ROLES.HR_STAFF ? null : <p className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-300">{roleLabel}</p>}</div>
        </div>
        <button ref={firstFocus} type="button" onClick={onClose} aria-label="Close panel" title="Close" className="shrink-0 rounded-md p-2 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-emerald-300"><X className="h-4 w-4" aria-hidden="true" /></button>
      </div>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5 [scrollbar-color:#9fb6a7_transparent] [scrollbar-width:thin]">
      {!current && role === CANONICAL_ROLES.PERSONNEL && <p className="px-3 pb-2 pt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">Find guidance for using your Personnel workspace, adding accomplishments, and completing your personnel evaluation.</p>}
      {!current && <nav aria-label={`${roleLabel} help topics`}>
        {topics.map((item) => item.id === 'settings' ? <Link key={item.id} to={settingsPath} className={rowStyle} onClick={onClose}><span>{item.menuTitle || item.title}</span><span aria-hidden="true" className="text-slate-400">›</span></Link> : <button key={item.id} type="button" onClick={() => openTopic(item)} className={rowStyle}><span>{item.menuTitle || item.title}</span><span aria-hidden="true" className="text-slate-400">›</span></button>)}
      </nav>}
      {current?.type === 'topic' && (role === CANONICAL_ROLES.PERSONNEL && current.item.id === 'portfolio-evaluation' ? renderPersonnelPortfolio() : <div className="p-3">{renderTopic(current.item)}</div>)}
      {current?.type === 'categories' && <nav aria-label="Categories and subcategories">
        {role === 'student' && studentCategoriesState === 'loading' && <p role="status" className="px-3 py-4 text-sm text-slate-600 dark:text-slate-300">Loading current categories…</p>}
        {role === 'student' && studentCategoriesState === 'error' && <p role="alert" className="px-3 py-4 text-sm text-rose-800 dark:text-rose-200">Categories could not be loaded. Try again when your connection is available.</p>}
        {categoryTree.map((item) => <button key={item.id} type="button" onClick={() => openCategoryItem(item)} className={rowStyle}><span className="min-w-0"><span className="block">{item.name}</span>{item.needsReview && <span className="mt-1 block text-xs font-medium text-amber-800 dark:text-amber-200">Further explanation needs review</span>}</span>{item.children?.length > 0 && <span aria-hidden="true" className="text-slate-400">›</span>}</button>)}
        {!categoryTree.length && studentCategoriesState === 'ready' && <p className="px-3 py-4 text-sm text-slate-600 dark:text-slate-300">No active categories were returned by the category service.</p>}
        {!categoryTree.length && role === CANONICAL_ROLES.PERSONNEL && personnelCriteriaState === 'loading' && <p role="status" className="px-3 py-4 text-sm text-slate-600 dark:text-slate-300">Loading current ranking criteria…</p>}
        {!categoryTree.length && role === CANONICAL_ROLES.PERSONNEL && personnelCriteriaState === 'error' && <p role="alert" className="px-3 py-4 text-sm text-rose-800 dark:text-rose-200">Current ranking criteria could not be loaded. Open the accomplishment form to see the available criteria.</p>}
        {!categoryTree.length && role === CANONICAL_ROLES.PERSONNEL && personnelCriteriaState === 'ready' && <p className="px-3 py-4 text-sm leading-5 text-amber-900 dark:text-amber-100">The current ranking configuration does not provide Personnel-selectable accomplishment categories.</p>}
      </nav>}
      {current?.type === 'category' && <div className="p-3">
        {current.item.description && <p className="mb-3 text-sm leading-6 text-slate-700 dark:text-slate-200">{current.item.description}</p>}
        <nav aria-label={`${current.item.name} subcategories`}>
          {(current.item.children || []).map((item) => <button key={item.id} type="button" onClick={() => openCategoryItem(item)} className={rowStyle}><span className="min-w-0"><span className="block">{item.name}</span>{item.code && <span className="mt-0.5 block text-xs font-medium text-slate-500 dark:text-slate-400">{item.code}</span>}</span>{item.children?.length > 0 && <span aria-hidden="true" className="text-slate-400">›</span>}</button>)}
        </nav>
        {!(current.item.children || []).length && <CategoryDetails item={current.item} />}
      </div>}
      {current?.type === 'detail' && <div className="p-4"><CategoryDetails item={current.item} /></div>}
    </div>
    <footer className="shrink-0 border-t border-slate-200 px-4 py-2 text-[11px] leading-4 text-slate-500 dark:border-slate-700 dark:text-slate-400">Guide content follows the current AchieveNest workflow and canonical configuration.</footer>
  </section>
}
