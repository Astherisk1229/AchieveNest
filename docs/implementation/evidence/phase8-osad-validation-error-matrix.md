# Phase 8 Evidence: OSAD Form & Modal Validation Error Matrix

| Modal / Form Name | Trigger Input | Validation Rule | Inline Error Display | Submission Lock |
| :--- | :--- | :--- | :--- | :--- |
| **Create College Modal** | Code, Name, Dean | Code non-empty (2-6 chars), Name non-empty | Red border + inline helper text | Submit button disabled/loading |
| **Create Program Modal** | College ID, Code, Name | College selected, Code 2-8 chars, Name non-empty | Red border + inline helper text | Submit button disabled/loading |
| **Create Organization Modal** | Code, Name, Scope, Category | Valid scope enum, category enum, non-empty text | In-modal alert / field error | Submit button disabled/loading |
| **Add Student Account Modal** | Student ID, Email, Name, Program | Valid NDMU student ID format, valid email | Inline input status indicator | Submit button disabled/loading |
| **Password Reset Approval Modal** | Temporary Password | Min 8 chars, 1 uppercase, 1 symbol | Dynamic complexity indicator | Complete button disabled until valid |
| **Certificate Template Editor** | Name, Schema Heading, Body | Required metadata fields, valid JSON placeholders | Field-level error messages | Publish button disabled until valid |
| **Award Review Panel Scoring** | Criteria Scores | Numeric within [0, MaxPoints] rubric | Inline numeric clamp & warning | Finalize button disabled until all criteria scored |
