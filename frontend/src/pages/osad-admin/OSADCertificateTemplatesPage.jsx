import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock3, FileClock, FilePenLine, History, LoaderCircle, Plus, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { useCertificateTemplates } from '../../hooks/useCertificateTemplates'
import { Button } from '../../components/ui/button'
import OSADPageHeader from '../../components/osad/OSADPageHeader'
import { OSADEmptyState, OSADErrorState, OSADLoadingState, OSADSearchEmptyState } from '../../components/osad/OSADStateBlock'

const statusStyle = {
  PUBLISHED: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  DRAFT: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  SUPERSEDED: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
}

function errorMessage(error) {
  return error?.error?.message || error?.message || 'The governed certificate templates could not be loaded.'
}

export default function OSADCertificateTemplatesPage() {
  const templates = useCertificateTemplates()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [purposeFilter, setPurposeFilter] = useState('ALL')
  const [historyFamilyId, setHistoryFamilyId] = useState(null)
  const [isMutating, setIsMutating] = useState(false)
  const [actionError, setActionError] = useState('')
  const [success, setSuccess] = useState('')

  const filteredFamilies = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return templates.templateFamilies.filter(family => {
      const purposeMatches = purposeFilter === 'ALL' || family.certificate_purpose === purposeFilter
      const searchMatches = !query || [family.name, family.code, family.certificate_purpose].some(value => String(value).toLowerCase().includes(query))
      return purposeMatches && searchMatches
    })
  }, [purposeFilter, searchTerm, templates.templateFamilies])

  const run = async (operation) => {
    setIsMutating(true)
    setActionError('')
    try { return await operation() } catch (error) { setActionError(errorMessage(error)); throw error } finally { setIsMutating(false) }
  }

  const openDraft = async (family) => {
    setSuccess('')
    try {
      let draft = family.draft_version
      if (!draft) {
        draft = await run(() => templates.createDraft(family.id, {
          source_version_id: family.current_published_version?.id,
          change_summary: `New draft from published v${family.current_published_version?.version_number || 1}`
        }))
      }
      navigate(`/osad/certificate-templates/${encodeURIComponent(family.id)}/versions/${encodeURIComponent(draft.id)}/edit`)
    } catch { /* surfaced in the page alert */ }
  }

  if (templates.isLoading && templates.templateFamilies.length === 0) return <OSADLoadingState message="Loading governed certificate templates…" />
  if (templates.error && templates.templateFamilies.length === 0) return <OSADErrorState title="Unable to load certificate templates" description={errorMessage(templates.error)} onRetry={() => templates.refresh().catch(() => {})} />

  return (
    <div className="space-y-6 font-sans">
      <OSADPageHeader
        title="Certificate Template Governance"
        description="Create, validate, and publish immutable certificate versions for Organization Moderator issuance."
        icon={Sparkles}
      />

      {success && <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-extrabold">Publication complete</p><p className="mt-0.5">{success}</p></div></div>}
      {actionError && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-extrabold">Governed action blocked</p><p className="mt-0.5">{actionError}</p></div></div>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#131e2e]" aria-labelledby="template-registry-heading">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between sm:p-5">
          <div><h2 id="template-registry-heading" className="text-base font-extrabold text-slate-950 dark:text-white">Purpose families</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">One current published default per approved purpose.</p></div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <label className="relative block sm:w-64"><span className="sr-only">Search templates</span><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Search templates" className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-950 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
            <label><span className="sr-only">Filter by purpose</span><select value={purposeFilter} onChange={event => setPurposeFilter(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><option value="ALL">All purposes</option>{['PARTICIPATION', 'COMPLETION', 'APPRECIATION', 'RECOGNITION'].map(purpose => <option key={purpose}>{purpose}</option>)}</select></label>
          </div>
        </div>

        {templates.templateFamilies.length === 0 ? <OSADEmptyState icon={Sparkles} title="Governed templates are not available" description="Complete the certificate-governance rollout before authoring template versions." /> : filteredFamilies.length === 0 ? <OSADSearchEmptyState title="No matching template family" description="Try a different purpose or search term." onReset={() => { setPurposeFilter('ALL'); setSearchTerm('') }} resetLabel="Clear filters" /> : <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {filteredFamilies.map(family => {
            const published = family.current_published_version
            const draft = family.draft_version
            const showingHistory = historyFamilyId === family.id
            return <article key={family.id} className="p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-extrabold text-slate-950 dark:text-white">{family.name}</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{family.certificate_purpose}</span>{draft && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle.DRAFT}`}>Draft v{draft.version_number}</span>}</div><p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">{family.code}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-300"><span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />Published v{published?.version_number || '—'}</span><span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{published?.governance?.published_at ? new Date(published.governance.published_at).toLocaleString() : 'Publication date unavailable'}</span></div></div>
                <div className="flex flex-wrap gap-2 lg:justify-end"><Button variant="outline" onClick={() => setHistoryFamilyId(showingHistory ? null : family.id)} className="gap-2"><History className="h-4 w-4" />Version history</Button><Button disabled={isMutating} onClick={() => openDraft(family)} className="gap-2">{isMutating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : draft ? <FilePenLine className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{draft ? 'Edit draft' : 'Create new version'}</Button></div>
              </div>
              {showingHistory && <div className="mt-4 overflow-x-auto rounded-xl bg-slate-50 dark:bg-slate-900"><table className="w-full min-w-[42rem] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400"><th className="px-4 py-3">Version</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Published</th><th className="px-4 py-3">Change summary</th></tr></thead><tbody>{family.versions.map(version => <tr key={version.id} className="border-b border-slate-200 last:border-0 dark:border-slate-800"><td className="px-4 py-3 font-bold text-slate-900 dark:text-white">v{version.version_number}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[version.status]}`}>{version.status[0] + version.status.slice(1).toLowerCase()}</span></td><td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(version.created_at).toLocaleString()}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-300">{version.governance?.published_at ? new Date(version.governance.published_at).toLocaleString() : '—'}</td><td className="max-w-xs px-4 py-3 text-slate-600 dark:text-slate-300">{version.governance?.change_summary || (version.status === 'PUBLISHED' ? 'Published governed baseline' : '—')}</td></tr>)}</tbody></table></div>}
            </article>
          })}
        </div>}
      </section>

      <div className="flex items-start gap-3 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300"><FileClock className="mt-0.5 h-5 w-5 shrink-0" /><p>Published and superseded versions are read-only. Editing always creates or resumes a draft, and Organization Moderators receive only the current compatible published version.</p></div>

    </div>
  )
}
