import React, { useMemo } from 'react'
import { AlertTriangle, Eye, Minus, Plus, QrCode, ScanLine } from 'lucide-react'
import CertificateTemplateRenderer from '../../../services/CertificateTemplateRenderer'

const fontMap = {
  Georgia: 'Georgia, serif', Arial: 'Arial, sans-serif', Garamond: 'Garamond, Georgia, serif',
  Cambria: 'Cambria, Georgia, serif', Helvetica: 'Helvetica, Arial, sans-serif'
}

function paperBackground(preset) {
  if (preset === 'classic_ivory') return '#fffaf0'
  if (preset === 'recognition_gold') return '#fffbeb'
  return '#ffffff'
}

function Frame({ layout }) {
  if (layout.frame_style === 'none') return null
  const double = layout.frame_style === 'double' || layout.frame_style === 'formal'
  return <div aria-hidden="true" className="pointer-events-none absolute inset-3" style={{ border: `2px solid ${layout.border_color}` }}>
    {double && <div className="absolute inset-1.5 border" style={{ borderColor: layout.secondary_color }} />}
    {layout.corner_treatment !== 'none' && <><i className="absolute -left-1 -top-1 h-5 w-5 border-l-2 border-t-2" style={{ borderColor: layout.secondary_color }} /><i className="absolute -right-1 -top-1 h-5 w-5 border-r-2 border-t-2" style={{ borderColor: layout.secondary_color }} /><i className="absolute -bottom-1 -left-1 h-5 w-5 border-b-2 border-l-2" style={{ borderColor: layout.secondary_color }} /><i className="absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2" style={{ borderColor: layout.secondary_color }} /></>}
  </div>
}

export default function CertificateStudioPreview({ draft, scenarioData, scenario, setScenario, zoom, setZoom, showGuides, setShowGuides, issues, reviewMode = false }) {
  const layout = draft.layout_schema
  const content = draft.content_schema
  const rendered = useMemo(() => Object.fromEntries(Object.entries(content).map(([key, value]) => [key, CertificateTemplateRenderer.renderBody(value, scenarioData)])), [content, scenarioData])
  const signatureCount = scenarioData.studio_signatory_count || draft.signatory_slots.length
  const visibleSlots = Array.from({ length: Math.max(signatureCount, 1) }, (_, index) => draft.signatory_slots[index] || { role_code: `PREVIEW_${index}`, display_label: index === 0 ? 'OSAD Director' : 'Approved Signatory' })
  const ratioClass = layout.orientation === 'portrait' ? 'aspect-[1/1.414]' : 'aspect-[1.414/1]'
  const paddingClass = layout.margin_preset === 'compact' ? 'p-[5%]' : layout.margin_preset === 'spacious' ? 'p-[9%]' : 'p-[7%]'
  const previewWidth = zoom === 'fit' ? '100%' : `${zoom}%`
  const secondaryHeading = rendered.secondary_heading && !rendered.heading?.toUpperCase().includes(rendered.secondary_heading.toUpperCase()) ? rendered.secondary_heading : ''
  const denseContent = [rendered.heading, secondaryHeading, rendered.body, rendered.role_line, rendered.activity_details, rendered.closing_statement].join(' ').length > 360
  const longRecipient = CertificateTemplateRenderer.renderBody('{{recipient_name}}', scenarioData).length > 28

  return (
    <section className="flex min-h-[34rem] min-w-0 flex-1 flex-col bg-[#e8ebed] dark:bg-[#09111b] md:h-[calc(100vh-10rem)]" aria-label="Live certificate preview">
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-slate-300/80 bg-slate-100 px-3 py-2 dark:border-slate-800 dark:bg-[#101a28]">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200"><Eye className="h-3.5 w-3.5" />Live Preview <span className="hidden text-[10px] font-medium text-slate-500 lg:inline">Synthetic data · no official identity</span></div>
        <div className="flex flex-wrap items-center gap-2">
          {!reviewMode && <details className="relative"><summary className="flex h-8 cursor-pointer list-none items-center rounded-md px-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800">Test Preview</summary><div className="absolute right-0 top-9 z-30 min-w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">{[['standard','Standard'],['long_recipient','Long Recipient Name'],['long_activity','Long Activity Title'],['long_organizer','Long Organizer Name'],['recognition','Recognition Winner'],['one_signatory','One Signer'],['two_signatories','Two Signers'],['three_signatories','Three Signers']].map(([id,label])=><button key={id} type="button" onClick={()=>setScenario(id)} className={`block w-full rounded-lg px-2.5 py-2 text-left text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 ${scenario===id?'bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200':'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{label}</button>)}</div></details>}
          {!reviewMode && <button type="button" aria-pressed={showGuides} onClick={() => setShowGuides(value => !value)} className={`h-8 rounded-md px-2 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 ${showGuides ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'}`}><ScanLine className="mr-1 inline h-3.5 w-3.5" />Guides</button>}
          <span className="hidden h-4 w-px bg-slate-300 dark:bg-slate-700 sm:block"/>
          <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => setZoom(value => value === 'fit' ? 75 : Math.max(50, value - 25))} className="grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800"><Minus className="h-3.5 w-3.5" /></button>
          <span className="w-9 text-center text-[11px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">{zoom==='fit'?'80%':`${zoom}%`}</span>
          <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => setZoom(value => value === 'fit' ? 100 : Math.min(100, value + 25))} className="grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800"><Plus className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={() => setZoom('fit')} className="h-8 rounded-md px-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800">Fit</button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto p-2 sm:p-3 lg:p-4">
        <div className="mx-auto transition-[width] duration-200" style={{ width: previewWidth, maxWidth: layout.orientation === 'portrait' ? 680 : 1100, minWidth: zoom === 'fit' ? 280 : 420 }}>
          <article className={`relative isolate bg-white text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.18)] ${ratioClass} ${paddingClass}`} style={{ backgroundColor: paperBackground(layout.background_preset), color: layout.title_color }}>
            <Frame layout={layout} />
            {layout.show_watermark && <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 grid place-items-center"><div className="grid h-[34%] aspect-square translate-y-[2%] place-items-center rounded-full border-[3px] text-[min(6vw,3.5rem)] font-bold" style={{ borderColor: `${layout.primary_color}12`, color: `${layout.primary_color}0c` }}>NDMU</div></div>}
            {showGuides && !reviewMode && <div aria-hidden="true" className="pointer-events-none absolute inset-[5%] z-20 border border-dashed border-sky-500/55"><span className="absolute left-1 top-1 text-[7px] font-bold text-sky-700">PRINT</span><div className="absolute inset-x-[12%] top-[27%] h-[31%] border border-dashed border-fuchsia-500/45" /><div className="absolute inset-x-[8%] bottom-[7%] h-[20%] border border-dashed border-emerald-500/45" /></div>}

            <div className={`relative z-10 grid h-full min-h-0 text-center ${denseContent ? 'grid-rows-[auto_auto_minmax(0,1fr)_auto_auto] gap-[clamp(3px,.55vw,7px)]' : 'grid-rows-[auto_auto_minmax(0,1fr)_auto_auto] gap-[clamp(5px,.8vw,11px)]'}`}>
              <header className="shrink-0">
                {layout.show_logo && <div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full text-[10px] font-black text-white" style={{ backgroundColor: layout.primary_color }}>NDMU</div>}
                <p className="text-[clamp(7px,1vw,11px)] font-bold uppercase tracking-[0.16em]">Notre Dame of Marbel University</p>
                <p className="mt-1 text-[clamp(6px,.8vw,9px)] uppercase tracking-[0.13em] text-slate-500">Office of Student Affairs & Services</p>
              </header>

              <section className={`mx-auto w-full max-w-[86%] ${denseContent ? 'space-y-0.5' : 'space-y-1.5'}`} aria-label="Certificate title and recipient">
                {rendered.optional_prefix && <p className="text-[clamp(7px,.8vw,10px)] uppercase tracking-[0.12em]">{rendered.optional_prefix}</p>}
                <h2 className="font-bold uppercase leading-none tracking-[0.08em]" style={{ fontFamily: fontMap[layout.title_font], color: layout.title_color, fontSize: layout.title_size === 'large' ? 'clamp(18px,3.3vw,42px)' : 'clamp(15px,2.7vw,34px)' }}>{rendered.heading}</h2>
                {secondaryHeading && <p className="font-semibold uppercase tracking-[0.22em]" style={{ color: layout.secondary_color, fontFamily: fontMap[layout.title_font], fontSize: 'clamp(10px,1.5vw,18px)' }}>{secondaryHeading}</p>}
                <p className={`${denseContent ? 'pt-0.5' : 'pt-1.5'} text-[clamp(7px,.9vw,11px)] text-slate-500`}>{rendered.recipient_lead_in}</p>
                <p className={`${layout.recipient_underline ? 'border-b pb-1' : ''} mx-auto max-w-[92%] break-words leading-tight`} style={{ borderColor: layout.divider_color, color: layout.recipient_color, fontFamily: fontMap[layout.recipient_font], fontWeight: layout.recipient_weight === 'bold' ? 800 : 600, textTransform: layout.recipient_case === 'uppercase' ? 'uppercase' : 'none', fontSize: longRecipient ? 'clamp(14px,2.55vw,30px)' : layout.recipient_size === 'large' ? 'clamp(19px,3.25vw,40px)' : 'clamp(15px,2.5vw,30px)' }}>{CertificateTemplateRenderer.renderBody('{{recipient_name}}', scenarioData)}</p>
                {rendered.recipient_subtitle && <p className="text-[clamp(7px,.9vw,11px)] text-slate-500">{rendered.recipient_subtitle}</p>}
              </section>

              <main className={`mx-auto flex min-h-0 w-full max-w-[78%] flex-col items-center justify-center overflow-y-auto [scrollbar-width:none] ${denseContent ? 'gap-0.5' : layout.composition === 'compact' ? 'gap-1' : 'gap-1.5'}`}>
                <p className={`mx-auto max-w-[68ch] text-slate-600 ${denseContent ? 'text-[clamp(6px,.82vw,10px)] leading-snug' : 'text-[clamp(7px,1vw,12px)] leading-relaxed'}`} style={{ fontFamily: fontMap[layout.body_font] }}>{rendered.body}</p>
                {layout.show_role_block && <p className="font-bold tracking-[0.14em]" style={{ color: layout.role_accent ? layout.secondary_color : layout.primary_color, textTransform: layout.role_case === 'uppercase' ? 'uppercase' : 'none', fontSize: layout.role_size === 'large' ? 'clamp(12px,1.7vw,20px)' : 'clamp(10px,1.35vw,16px)' }}>{rendered.role_line}</p>}
                {layout.show_activity_details && <p className={`break-words text-slate-600 ${denseContent ? 'text-[clamp(6px,.78vw,9px)] leading-snug' : 'text-[clamp(7px,.9vw,11px)]'}`}>{rendered.activity_details}</p>}
                <p className={`${denseContent ? 'text-[clamp(6px,.78vw,9px)]' : 'text-[clamp(7px,.9vw,11px)]'} text-slate-600`}>{rendered.closing_statement}</p>
              </main>

              <section className={`mx-auto grid w-full max-w-[84%] items-end gap-[clamp(6px,1vw,16px)] ${layout.signatory_arrangement === 'stacked' ? 'grid-cols-1' : visibleSlots.length >= 3 ? 'grid-cols-3' : visibleSlots.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`} aria-label="Signatories">
                {visibleSlots.map((slot, index) => <div key={`${slot.role_code}-${index}`} className={`${index > 0 && !layout.show_secondary_signatory ? 'hidden' : ''} min-w-0 text-center`}><div className="mx-auto w-full max-w-36 border-b border-slate-500 pb-1 text-[clamp(6px,.75vw,9px)] font-semibold leading-tight">Approved signatory</div><p className="mx-auto mt-1 max-w-36 break-words text-[clamp(6px,.7vw,8px)] font-bold uppercase leading-tight text-slate-600">{slot.display_label}</p></div>)}
              </section>

              <footer className="grid min-h-[clamp(24px,4.5vw,48px)] grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-t border-slate-200/70 pt-[clamp(3px,.55vw,7px)] text-left">
                {layout.show_footer ? <p className="min-w-0 break-words text-[clamp(5px,.65vw,8px)] leading-tight text-slate-500" style={{ fontFamily: fontMap[layout.footer_font] }}>{layout.show_certificate_number ? rendered.footer_note : 'Official NDMU certificate preview'}</p> : <span />}
                {layout.show_qr && <div className="flex shrink-0 items-end gap-1.5"><QrCode className="h-[clamp(24px,3.2vw,36px)] w-[clamp(24px,3.2vw,36px)] text-slate-900" /><div className="max-w-24 text-[clamp(5px,.62vw,7px)] leading-tight text-slate-600"><p className="font-bold">{layout.qr_caption}</p>{layout.show_verification_text && <p>Official verification</p>}</div></div>}
              </footer>
            </div>
          </article>
        </div>
      </div>

      {!reviewMode && <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-300/80 bg-slate-100 px-3 py-2 dark:border-slate-800 dark:bg-[#101a28]">
        <div aria-live="polite" className={`flex items-center gap-1.5 text-xs font-semibold ${issues.length ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'}`}>{issues.length ? <><AlertTriangle className="h-4 w-4" />{issues.length} layout {issues.length === 1 ? 'issue' : 'issues'} detected</> : 'Preview fits the selected scenario'}</div>
        <p className="text-[10px] text-slate-500">A4 {layout.orientation} · {zoom==='fit'?'Fit width':`${zoom}%`}</p>
      </div>}
    </section>
  )
}
