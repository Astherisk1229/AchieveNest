# Report Generation Audit Evidence

- **Event Keys**: `evaluation_print_generated`, `summary_generated`
- **Display Labels**: "Evaluation Summary Document Printed", "Official Summary Report Generated"
- **Actor**: `HR` / `Personnel` / `Dean`
- **Captured Fields**: `evaluation_id`, `metadata: { report_type: "ranking_summary_slip", template_version: "v2.1" }`, `occurred_at`.
- **Constraint**: Audits actual generation/print execution only; simple page loads and dashboard visits are ignored.
