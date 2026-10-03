import React from 'react'

const years = ['2','4','6','8','10','12','14','16','18','20+']
const points = ['1','2','3','4','5','6','7','8','9','10']
const th = 'border border-slate-300 bg-slate-100 px-3 py-2 text-left text-xs font-extrabold uppercase tracking-wide text-slate-700'
const td = 'border border-slate-300 px-3 py-2.5 align-top text-sm'

function ScrollTable({ label, children }) {
  return <div className="mt-3 overflow-x-auto rounded-xl border border-slate-300" tabIndex="0" role="region" aria-label={label}>{children}</div>
}

function Value({ value, editable, label, onChange }) {
  if (!editable) return <span className="tabular-nums">{Number(value)}</span>
  return <input aria-label={label} type="number" min="0" step="0.01" value={value} onChange={event => onChange(Number(event.target.value))} className="w-24 rounded-lg border border-slate-400 px-2 py-1.5 text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-700" />
}

function YearsOfServiceTable({ category, editable, updateItem }) {
  const values = category.options?.filter(option => option.option_group_code === 'YEARS') || []
  const labels = values.length ? values.map(option => option.label) : years
  return <ScrollTable label="Years of service progression"><table className="min-w-[760px] w-full border-collapse"><tbody><tr><th className={`${th} sticky left-0 z-10 min-w-40`}>Years of Service</th>{labels.map(value => <th key={value} className={`${th} text-center`}>{value}</th>)}<th className={`${th} text-center`}>Maximum</th></tr><tr><th className={`${th} sticky left-0 z-10`}>Point Value</th>{(values.length ? values : points.map((value,index)=>({id:`fallback-${index}`,points:value}))).map(option => <td key={option.id} className={`${td} text-center font-bold tabular-nums`}><Value value={option.points} editable={editable && values.length > 0} label={`${option.label || ''} years points`} onChange={value => updateItem('option',option.id,'points',value)}/></td>)}<td className={`${td} text-center font-black`}>{Number(category.max_points)}</td></tr></tbody></table></ScrollTable>
}

function MatrixTable({ category, editable, updateItem }) {
  const preferred = category.renderer_key === 'GUEST_LECTURER_MATRIX' ? ['SPONSOR','EXTENT','PARTICIPANTS','ROLE'] : category.renderer_key === 'PUBLICATION_MATRIX' ? ['SCOPE','TYPE'] : category.renderer_key === 'RECOGNITION_MATRIX' ? ['NOMINEE','AWARDEE'] : ['MATERIAL_TYPE']
  const available = new Set((category.options || []).map(option => option.option_group_code))
  const groups = preferred.filter(group => available.has(group))
  const label = { SPONSOR:'Type of Sponsoring Organization', EXTENT:'Extent of Talk', PARTICIPANTS:'Participants', ROLE:'Role', SCOPE:'Location / Scope', TYPE:'Type of Publication', NOMINEE:'Nominee', AWARDEE:'Awardee', MATERIAL_TYPE:'Type of Instructional Material' }
  const lead = category.renderer_key === 'PUBLICATION_MATRIX' ? 'Publication / Title' : category.renderer_key === 'RECOGNITION_MATRIX' ? 'Award / Recognition Title' : category.renderer_key === 'INSTRUCTIONAL_MATERIALS' ? 'Description / Title' : 'Activity / Title'
  return <ScrollTable label={`${category.name} grouped scoring matrix`}><table className="min-w-max w-full border-collapse"><thead><tr><th rowSpan="2" className={`${th} sticky left-0 z-10 min-w-44`}>{lead}</th>{groups.map(group => <th key={group} colSpan={category.options.filter(option => option.option_group_code === group).length} scope="colgroup" className={`${th} text-center`}>{label[group] || group}</th>)}<th rowSpan="2" className={`${th} text-right`}>Criterion Max</th></tr><tr>{groups.flatMap(group => category.options.filter(option => option.option_group_code === group).map(option => <th key={option.id} scope="col" className={`${th} min-w-24 text-center`}>{option.label}</th>))}</tr></thead><tbody><tr><th scope="row" className={`${td} sticky left-0 z-10 h-14 bg-white text-left font-semibold`}>Required record</th>{groups.flatMap(group => category.options.filter(option => option.option_group_code === group).map(option => <td key={option.id} className={`${td} text-center font-bold`}><Value value={option.points} editable={editable} label={`${label[group] || group} ${option.label} points`} onChange={value => updateItem('option',option.id,'points',value)}/></td>))}<td className={`${td} text-right font-black`}>{Number(category.max_points)}</td></tr></tbody></table></ScrollTable>
}

function EngagementTable({ category, editable, updateItem }) {
  const rule=category.options?.find(option=>option.option_code==='POINTS_PER_ENGAGEMENT'), pointsValue=rule?.points ?? category.subcategories?.[0]?.default_points ?? 5
  return <ScrollTable label="Eligible engagement calculation"><table className="min-w-[700px] w-full border-collapse"><thead><tr><th className={`${th} sticky left-0 z-10`}>Eligible Engagement</th><th className={th}>Point Value per Engagement</th><th className={`${th} text-right`}>Maximum</th><th className={th}>Calculation</th></tr></thead><tbody><tr><th scope="row" className={`${td} sticky left-0 z-10 bg-white text-left font-bold`}>Judge / Lecturer / Resource Person</th><td className={td}><Value value={pointsValue} editable={editable && Boolean(rule)} label="Points per eligible engagement" onChange={value=>updateItem('option',rule.id,'points',value)}/> points each</td><td className={`${td} text-right font-black`}>{Number(category.max_points)}</td><td className={td}>{rule?.label || `Eligible engagements × ${pointsValue} points, capped at ${Number(category.max_points)}.`}</td></tr></tbody></table></ScrollTable>
}

function SharedCapTable({ category, editable, updateItem }) {
  return <ScrollTable label={`${category.name} shared-cap criteria`}><table className="min-w-[760px] w-full border-collapse"><thead><tr><th className={`${th} sticky left-0 z-10`}>Subcategory</th><th className={th}>Required Record / Evidence</th><th className={`${th} text-right`}>Subcategory Maximum</th><th className={`${th} text-right`}>Shared Category Cap</th></tr></thead><tbody>{category.subcategories.map(item => <tr key={item.id}><th scope="row" className={`${td} sticky left-0 z-10 bg-white text-left font-bold`}>{item.name}</th><td className={`${td} text-slate-600`}>{item.description || 'Supporting institutional evidence'}</td><td className={`${td} text-right`}><Value value={item.default_points} editable={editable} label={`${item.name} maximum`} onChange={value => updateItem('subcategory', item.id, 'default_points', value)} /></td><td className={`${td} text-right font-black tabular-nums`}>{Number(category.max_points)}</td></tr>)}</tbody></table></ScrollTable>
}

function ManualCriterionTable({ category, editable, updateItem, weighted = false }) {
  const weight=category.options?.find(option=>option.option_group_code==='WEIGHT')?.label
  return <ScrollTable label={`${category.name} manual criteria`}><table className="min-w-[700px] w-full border-collapse"><thead><tr><th className={`${th} sticky left-0 z-10`}>Criterion</th>{weighted && <th className={th}>Weight / %</th>}<th className={th}>Detailed Breakdown in Source</th><th className={`${th} text-right`}>Maximum</th><th className={th}>System Note</th></tr></thead><tbody><tr><th scope="row" className={`${td} sticky left-0 z-10 bg-white text-left font-bold`}>{category.name}</th>{weighted && <td className={td}>{weight || (category.category_code === 'A.1' ? '.50' : category.category_code === 'A.2' ? '.10' : '.30')}</td>}<td className={`${td} text-slate-600`}>{category.description || 'No lower-level point breakdown is provided in the official source.'}</td><td className={`${td} text-right`}><Value value={category.max_points} editable={editable} label={`${category.name} maximum`} onChange={value => updateItem('category', category.id, 'max_points', value)} /></td><td className={td}><strong>Scoring Mode: MANUAL</strong><br/><span className="text-slate-600">Evaluator score and evidence review required.</span></td></tr></tbody></table></ScrollTable>
}

function SeminarLevelTable({ category, editable, updateItem }) {
  const labels = ['In-House','City / Provincial','Regional','National','International']
  const levels=category.options?.filter(option=>option.option_group_code==='LEVEL') || []
  return <ScrollTable label="Seminar workshop and training levels"><table className="min-w-[920px] w-full border-collapse"><thead><tr><th colSpan="3" scope="colgroup" className={`${th} sticky left-0 z-10`}>Activity Information</th><th colSpan="5" scope="colgroup" className={`${th} text-center`}>Equivalent Points by Level</th><th rowSpan="2" className={`${th} text-right`}>Maximum</th></tr><tr><th className={`${th} sticky left-0 z-10`}>Seminar / Training</th><th className={th}>Venue</th><th className={th}>Date</th>{labels.map(label => <th key={label} className={`${th} text-center`}>{label}</th>)}</tr></thead><tbody><tr><th scope="row" className={`${td} sticky left-0 z-10 bg-white text-left font-bold`}>Required record</th><td className={`${td} text-slate-500`}>Required record</td><td className={`${td} text-slate-500`}>Required record</td>{labels.map((label,index) => { const item=levels[index] || category.subcategories[index]; const value=item?.points ?? item?.default_points; return <td key={label} className={`${td} text-center font-bold`}>{item ? <Value value={value} editable={editable} label={`${label} points`} onChange={next => updateItem(levels[index]?'option':'subcategory', item.id, levels[index]?'points':'default_points', next)} /> : '—'}</td>})}<td className={`${td} text-right font-black`}>{Number(category.max_points)}</td></tr></tbody></table></ScrollTable>
}

function OfficialBreakdownTable({ category, editable, updateItem }) {
  const rows = [...(category.subcategories || []), ...(category.criteria || [])]
  return <ScrollTable label={`${category.name} official scoring breakdown`}><table className="min-w-[760px] w-full border-collapse"><thead><tr><th className={`${th} sticky left-0 z-10`}>Criterion</th><th className={th}>Official Qualification / Rule</th><th className={`${th} text-right`}>Point Value</th><th className={`${th} text-right`}>Criterion Maximum</th></tr></thead><tbody>{rows.map(item => { const isSub=Boolean(item.subcategory_code); const value=isSub?item.default_points:item.max_points_per_entry; return <tr key={item.id}><th scope="row" className={`${td} sticky left-0 z-10 bg-white text-left font-bold`}>{item.name}</th><td className={`${td} text-slate-600`}>{item.description || item.formula_key || 'Official source rule'}</td><td className={`${td} text-right`}><Value value={value} editable={editable} label={`${item.name} points`} onChange={next => updateItem(isSub?'subcategory':'criterion', item.id, isSub?'default_points':'max_points_per_entry', next)} /></td><td className={`${td} text-right font-black`}>{Number(category.max_points)}</td></tr>})}</tbody></table></ScrollTable>
}

function Category({ category, group, editable, updateItem }) {
  const yearsCategory = /years of service|service credit/i.test(category.name)
  const shared = category.scoring_mode === 'CATEGORY_CAP' || /involvement|school activities|community involvement/i.test(category.name)
  const weighted = category.renderer_key === 'WEIGHTED_MANUAL' || (group === 'NON_TEACHING_FACULTY' && category.category_code.startsWith('A.'))
  const manual = Number(category.requires_manual_hr_rule) === 1
  const matrix = ['GUEST_LECTURER_MATRIX','PUBLICATION_MATRIX','RECOGNITION_MATRIX','INSTRUCTIONAL_MATERIALS'].includes(category.renderer_key)
  return <article id={`criteria-${category.category_code.replaceAll('.','-')}`} className="break-inside-avoid"><div className="flex flex-wrap items-end justify-between gap-2"><div><h4 className="font-black">{category.category_code} {category.name.replace(new RegExp(`^${category.category_code}\\s*`), '')}</h4><p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{manual ? 'Manual evaluator scoring' : shared ? 'Automatic aggregation with shared cap' : category.scoring_mode === 'FORMULA' ? 'Automatic formula' : 'Official scoring table'}</p></div><span className="text-sm font-bold tabular-nums">Maximum {Number(category.max_points)}</span></div>{yearsCategory ? <YearsOfServiceTable category={category} editable={editable} updateItem={updateItem}/> : matrix ? <MatrixTable category={category} editable={editable} updateItem={updateItem}/> : category.renderer_key === 'ENGAGEMENT' ? <EngagementTable category={category} editable={editable} updateItem={updateItem}/> : manual ? <ManualCriterionTable category={category} editable={editable} updateItem={updateItem} weighted={weighted}/> : category.category_code === 'A.3' && group === 'FACULTY' ? <SeminarLevelTable category={category} editable={editable} updateItem={updateItem}/> : shared ? <SharedCapTable category={category} editable={editable} updateItem={updateItem}/> : <OfficialBreakdownTable category={category} editable={editable} updateItem={updateItem}/>}</article>
}

function Renderer({ tree, editable = false, updateItem = () => {} }) {
  return <div className="space-y-10">{tree.areas.map(area => <section key={area.id} id={`area-${area.area_code}`} className="scroll-mt-32"><div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-emerald-900 pb-2"><h3 className="text-lg font-black">{area.name}</h3><span className="text-sm font-bold tabular-nums">Area Maximum: {Number(area.max_points)}</span></div><div className="mt-6 space-y-8">{area.categories.map(category => <Category key={category.id} category={category} group={tree.sheet.applies_to} editable={editable} updateItem={updateItem}/>)}</div></section>)}</div>
}

export function FacultyCriteriaRenderer(props) { return <Renderer {...props}/> }
export function NonTeachingFacultyCriteriaRenderer(props) { return <Renderer {...props}/> }
export default function CriteriaSheetRenderer(props) { return props.tree.sheet.applies_to === 'FACULTY' ? <FacultyCriteriaRenderer {...props}/> : <NonTeachingFacultyCriteriaRenderer {...props}/> }
