# Report Generation Audit (Plan H2)

## Findings
- Rating sheet PDF generation (`PersonnelEvaluationPrintService`) assembles the canonical 4-page ranking summary.
- Currently, PDF generation is client-triggered and rendered on demand without writing a persistent event to `personnel_evaluation_events`.
- Plan J Phase J1/J5 will define `report_summary_generated` as an optional audit event for institutional compliance tracking.
