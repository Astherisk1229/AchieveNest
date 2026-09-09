-- ============================================================================
-- AchieveNest — Campus Journalism Award Foundation
-- Phase 1 Validation Queries & Test Case Assertions (TC-1 through TC-8)
-- ============================================================================

-- TC-1: Award Hierarchy Exists & Authority Status is OFFICIAL
SELECT 
    id, 
    code, 
    name, 
    authority_status, 
    source_fidelity_status, 
    candidate_threshold_percent, 
    graduating_only, 
    status
FROM award_definitions
WHERE id = '50000001-0000-0000-0000-000000000023';
-- Expected: 1 row returned, name='Campus Journalism Award', code='CAMPUS_JOURNALISM_AWARD', status='active', authority_status='OFFICIAL', source_fidelity_status='VERIFIED', threshold=80.00, graduating_only=1.

-- TC-2: Official Rubric (100.00 Total) and Publication Rules Exactness
SELECT 
    c.code AS criterion_code,
    c.name AS criterion_name,
    c.weight,
    c.max_points AS criterion_max_points,
    c.is_portfolio_computable,
    comp.code AS component_code,
    comp.name AS component_name,
    comp.max_points AS component_max_points,
    r.code AS rule_code,
    r.rule_type,
    r.points AS rule_points,
    r.max_points AS rule_max_points,
    r.rule_config
FROM award_criteria c
LEFT JOIN award_criterion_components comp ON comp.criterion_id = c.id
LEFT JOIN award_scoring_rules r ON r.criterion_component_id = comp.id
WHERE c.award_definition_id = '50000001-0000-0000-0000-000000000023'
ORDER BY c.sort_order ASC, comp.sort_order ASC;
-- Expected Assertions:
-- 1. Rubric Total SUM(weight) = 100.00.
-- 2. Computable Criteria SUM(max_points) WHERE is_portfolio_computable = 1 = 70.00.
-- 3. Non-computable Criteria (Character=20, Interview=10) = 30.00.
-- 4. Publication Subcriteria:
--    - News Item (COMP_JOURN_NEWS): 2 pts/item, max 10.00.
--    - Literary (COMP_JOURN_LITERARY): 2 pts/item, max 10.00.
--    - Column (COMP_JOURN_COLUMN): 4 pts/item, max 20.00.
--    - Editorial (COMP_JOURN_EDITORIAL): 4 pts/item, max 20.00.
--    - Sum of Publication Components = 60.00 pts.

-- TC-3: Leadership Rules Are Exact (Max 5.00)
SELECT 
    r.code, 
    r.name, 
    r.rule_type, 
    r.max_points, 
    r.rule_config
FROM award_scoring_rules r
WHERE r.code = 'RULE_JOURN_LEAD_ROLE';
-- Expected: max_points = 5.00, rule_config contains officer=3.0, member=2.0, contributor=2.0.

-- TC-4: Recognition Rules Are Exact (Max 5.00, Seminars = 0.0)
SELECT 
    r.code, 
    r.name, 
    r.rule_type, 
    r.max_points, 
    r.rule_config
FROM award_scoring_rules r
WHERE r.code = 'RULE_JOURN_LEAD_AWARDS';
-- Expected: max_points = 5.00, rule_config contains award_international=3.0, award_national=3.0, award_local=2.0, seminar=0.0.

-- TC-5: Evidence Cardinality Invariant (1 Achievement -> N Files = 1 Scoreable Unit)
SELECT 
    spr.id AS achievement_id,
    spr.title AS achievement_title,
    spr.status AS verification_status,
    COUNT(spe.id) AS attached_evidence_file_count
FROM student_portfolio_records spr
LEFT JOIN student_portfolio_evidence spe ON spe.portfolio_record_id = spr.id
WHERE spr.category_id = '2b09cd61-7a23-4466-be58-889398e8f201'
GROUP BY spr.id, spr.title, spr.status;
-- Expected Assertion: Multiple evidence files grouped under 1 achievement_id resolve to 1 single qualifying record in candidate generation.

-- TC-6: Deterministic Seed Replay Invariance Check
SELECT 
    COUNT(*) AS total_campus_journalism_awards,
    (SELECT COUNT(*) FROM award_criteria WHERE award_definition_id = '50000001-0000-0000-0000-000000000023') AS criteria_count,
    (SELECT COUNT(*) FROM award_criterion_components WHERE criterion_id IN (SELECT id FROM award_criteria WHERE award_definition_id = '50000001-0000-0000-0000-000000000023')) AS component_count,
    (SELECT COUNT(*) FROM award_evidence_mapping_rules WHERE criterion_id IN (SELECT id FROM award_criteria WHERE award_definition_id = '50000001-0000-0000-0000-000000000023')) AS mapping_count,
    (SELECT COUNT(*) FROM award_scoring_rules WHERE criterion_id IN (SELECT id FROM award_criteria WHERE award_definition_id = '50000001-0000-0000-0000-000000000023')) AS scoring_rule_count
FROM award_definitions
WHERE id = '50000001-0000-0000-0000-000000000023';
-- Expected: total_awards=1, criteria_count=4, component_count=6, mapping_count=8, scoring_rule_count=6.

-- TC-7: Existing Data Preservation (Baseline Awards Regression Invariance)
SELECT 
    ad.code, 
    ad.name, 
    ad.source_fidelity_status, 
    COUNT(ac.id) AS criteria_count,
    SUM(CASE WHEN ac.is_portfolio_computable = 1 THEN ac.max_points ELSE 0 END) AS computable_max_points
FROM award_definitions ad
LEFT JOIN award_criteria ac ON ac.award_definition_id = ad.id
WHERE ad.code IN ('NOTRE_DAME_AWARD', 'SMC_AWARD', 'LEADERSHIP_AWARD')
GROUP BY ad.code, ad.name, ad.source_fidelity_status
ORDER BY ad.code;
-- Expected:
-- NOTRE_DAME_AWARD: VERIFIED, criteria_count=5, computable_max=50.00
-- SMC_AWARD: VERIFIED, criteria_count=5, computable_max=60.00
-- LEADERSHIP_AWARD: VERIFIED, criteria_count=5, computable_max=50.00
