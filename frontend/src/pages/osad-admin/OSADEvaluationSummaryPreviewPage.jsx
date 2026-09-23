import React, { useMemo } from 'react'
import { FileText } from 'lucide-react'
import EvaluationSummaryAwardSection from '../../components/osad/EvaluationSummaryAwardSection'
import OSADAwardPageShell from '../../components/osad/OSADAwardPageShell'
import EvaluationSummaryPreviewModel from '../../models/EvaluationSummaryPreviewModel'

const studentFields = [
  ['Student Name', 'name'],
  ['Student ID', 'studentId'],
  ['Program', 'program'],
  ['Award Cycle / Academic Year', 'awardCycle'],
  ['Generated On', 'generatedOn']
]

function DocumentPage({ children }) {
  return (
    <article
      className="mx-auto flex min-h-[297mm] w-[210mm] flex-col bg-white px-[17mm] py-[15mm] text-[12pt] leading-[1.35] text-slate-950 shadow-[0_12px_35px_rgba(15,23,42,0.12)]"
    >
      {children}
    </article>
  )
}

export default function OSADEvaluationSummaryPreviewPage({ onBack }) {
  const preview = useMemo(() => new EvaluationSummaryPreviewModel(), [])

  return (
    <OSADAwardPageShell
      title="Evaluation Summary Preview"
      description="Preview only — sample data is shown to demonstrate the Evaluation Summary format."
      icon={FileText}
      breadcrumbs={[
        { label: 'Awards & Criteria', onClick: onBack },
        { label: 'Evaluation Summary Preview' }
      ]}
    >
      <p role="note" className="mx-auto max-w-[210mm] text-sm leading-6 text-slate-600 dark:text-slate-300">
        Preview only — sample data is shown to demonstrate the Evaluation Summary format.
      </p>

      <div className="overflow-x-auto rounded-xl bg-slate-100 px-4 py-6 sm:px-8 sm:py-10 dark:bg-slate-950/40" aria-label="A4 evaluation summary preview">
        <div className="min-w-[210mm]">
          <DocumentPage>
            <header className="border-b-2 border-slate-900 pb-3 text-center">
              <p className="text-[9.5pt] font-semibold uppercase tracking-[0.12em] text-emerald-800">AchieveNest</p>
              <h2 className="mt-0.5 text-[17pt] font-bold tracking-[0.06em]">STUDENT EVALUATION SUMMARY</h2>
            </header>

            <dl className="mt-4 grid grid-cols-[175px_1fr] gap-x-3 gap-y-1 border-b border-slate-300 pb-4 text-[12pt] leading-[1.3]">
              {studentFields.map(([label, field]) => (
                <React.Fragment key={field}>
                  <dt className="font-semibold text-slate-600">{label}:</dt>
                  <dd className="font-medium text-slate-950">{preview.student[field]}</dd>
                </React.Fragment>
              ))}
            </dl>

            <div className="mt-6 space-y-8">
              {preview.awards.map((award) => (
                <EvaluationSummaryAwardSection key={award.id} award={award} />
              ))}
            </div>

            <footer className="mt-auto pt-8 text-center text-[9pt] leading-tight text-slate-500">
              Preview format — sample data only
            </footer>
          </DocumentPage>
        </div>
      </div>
    </OSADAwardPageShell>
  )
}
