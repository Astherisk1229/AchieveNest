# Plan 04 Phase 9 — End-to-End Regression Matrix
## Full Multi-Tier Validation from Student Form Entry to Award Mapping

| ID | Scenario | Category / Subcategory | Layer | Expected Behavior | Actual Behavior | Status |
|---|---|---|---|---|---|---|
| E2E-01 | Create Leadership Record | `Leadership Position` / `Supreme Student Government` | Frontend -> API -> DB | Renders leadership fields; persists JSON metadata | Direct structured JSON persisted | **PASS** |
| E2E-02 | Create Org Member Record | `Organization Membership` / `Academic Organization` | Frontend -> API -> DB | Factual membership fields rendered and persisted | Saved with schema_version 1.0 | **PASS** |
| E2E-03 | Create Community Service | `Community Service` / `Institutional Outreach` | Frontend -> API -> DB | Renders service hours and initiated flag | Sanitized metadata persisted | **PASS** |
| E2E-04 | Create Church Ministry | `Church / Ministry` / `Liturgical Ministry` | Frontend -> API -> DB | Captures ministry context and role | Saved with draft/submit support | **PASS** |
| E2E-05 | Create Seminar Record | `Seminar / Training` / `Leadership Development` | Frontend -> API -> DB | Retains category under Seminar / Training | Saved as Seminar credit | **PASS** |
| E2E-06 | Create Sports Record | `Sports` / `Basketball` | Frontend -> API -> DB | Captures event level, placement | Persists controlled placement | **PASS** |
| E2E-07 | Create Socio-Cultural Record | `Socio-Cultural` / `Dance Troupe` | Frontend -> API -> DB | Captures performance type, event level | Persists structured metadata | **PASS** |
| E2E-08 | Create Journalism Record | `Campus Journalism` / `News Writing` | Frontend -> API -> DB | Captures publication type and status | Persists publication metadata | **PASS** |
| E2E-09 | Create Citation Record | `Citation / Recognition` / `Academic Honor` | Frontend -> API -> DB | Pure factual recognition entry | No award selection targets | **PASS** |
| E2E-10 | Discard Confirmation | Category / Subcategory switch | Frontend React | Prompts user before clearing dirty details | Discard modal displayed | **PASS** |
| E2E-11 | Draft vs Submit | All Categories | Controller & DB | Draft sets draft; Submit sets submitted | Correct status & timestamps | **PASS** |
| E2E-12 | Award Mapping Integration | 15 Institutional Awards | Backend Scoring | Consumes verified structured keys directly | 0 free-text dependencies | **PASS** |
