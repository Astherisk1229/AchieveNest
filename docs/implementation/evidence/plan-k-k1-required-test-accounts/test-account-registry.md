# Canonical Test Persona & Account Registry

| Persona | Synthetic ID | Display Name | Synthetic Email | Group | Side | Faculty Status | Placement | Expected Route | Ranking Eligible |
|---|---|---|---|---|---|---|---|---|---|
| **P1** | `K1-P1-FAC-001` | Dr. Katherine First | `k1.p1.faculty@ndmu.edu.ph` | `faculty` | `academic` | `full_time_faculty` | College 1 (CBA) | Dean | YES |
| **P2** | `K1-P2-PT-002` | Prof. Paul Second | `k1.p2.parttime@ndmu.edu.ph` | `faculty` | `academic` | `part_time_faculty` | College 1 (CBA) | Dean | **NO (BLOCKED)** |
| **P3** | `K1-P3-NTFA-003` | Arthur Third | `k1.p3.ntf.academic@ndmu.edu.ph` | `non_teaching_faculty` | `academic` | `full_time_faculty` | College 2 (CTE) | Dean (CTE) | YES |
| **P4** | `K1-P4-NTFNA-004` | Nora Fourth | `k1.p4.ntf.nonacademic@ndmu.edu.ph` | `non_teaching_faculty` | `non_academic` | `full_time_faculty` | Unit: Registrar | HR | YES (No Rank Rule) |
| **P5** | `K1-P5-DEAN-005` | Dean David Fifth | `k1.p5.dean@ndmu.edu.ph` | `faculty` | `academic` | `full_time_faculty` | College 1 (CBA) | HR (Self-eval) | Reviewer (CBA) |
| **P6** | `K1-P6-HR-006` | Helen Sixth | `k1.p6.hr@ndmu.edu.ph` | `non_teaching_faculty` | `non_academic` | `full_time_faculty` | Unit: Finance | HR | Reviewer (Inst.) |
| **P7** | `K1-P7-VP-007` | Dr. Vincent Seventh | `k1.p7.vp@ndmu.edu.ph` | `faculty` | `academic` | `full_time_faculty` | College 1 (CBA) | HR | N/A |
| **P-SEC** | `K1-PSEC-008` | Sara Secretary | `k1.psec.secretary@ndmu.edu.ph` | `non_teaching_faculty` | `academic` | `full_time_faculty` | College 1 (CBA) | Dean | **NOT EVALUATOR** |
| **P-LEG-S** | `K1-PLEG-SUPP-009` | Leo Legacy | `k1.pleg.supported@ndmu.edu.ph` | `non_teaching_personnel` | `non_academic` | `full_time_faculty` | Unit: Registrar | HR | Supported Mapping |
| **P-LEG-A** | `K1-PLEG-AMB-010` | Alex Ambiguous | `k1.pleg.ambiguous@ndmu.edu.ph` | `non_teaching_personnel` | Unresolved | `full_time_faculty` | Unassigned | Unresolved | Ambiguous Mapping |
