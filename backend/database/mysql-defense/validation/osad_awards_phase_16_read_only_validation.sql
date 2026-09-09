-- AchieveNest Phase 16 — read-only cross-Award integrity validation
-- This package performs SELECT statements only. It is safe for the protected WAMP database.

SELECT id, code, name, authority_status, source_fidelity_status, graduating_only,
       gender_restriction, candidate_threshold_percent
FROM award_definitions
WHERE status = 'active' AND is_catalog_visible = 1
ORDER BY id;

SELECT authority_status, COUNT(*) AS award_count
FROM award_definitions
WHERE status = 'active' AND is_catalog_visible = 1
GROUP BY authority_status;

SELECT ad.code,
       (SELECT COUNT(*) FROM award_criteria c WHERE c.award_definition_id = ad.id) AS criteria_count,
       (SELECT COUNT(*) FROM award_criterion_components cc JOIN award_criteria c ON c.id=cc.criterion_id WHERE c.award_definition_id=ad.id) AS component_count,
       (SELECT COUNT(*) FROM award_evidence_mapping_rules mr JOIN award_criteria c ON c.id=mr.criterion_id WHERE c.award_definition_id=ad.id AND mr.is_active=1) AS mapping_count,
       (SELECT COUNT(*) FROM award_scoring_rules sr JOIN award_criteria c ON c.id=sr.criterion_id WHERE c.award_definition_id=ad.id AND sr.is_active=1) AS scoring_rule_count,
       (SELECT SUM(c.max_points) FROM award_criteria c WHERE c.award_definition_id=ad.id AND c.is_portfolio_computable=1) AS computable_max
FROM award_definitions ad
WHERE ad.status='active' AND ad.is_catalog_visible=1
ORDER BY ad.id;

SELECT 'criteria_orphan' issue, COUNT(*) count FROM award_criteria c LEFT JOIN award_definitions a ON a.id=c.award_definition_id WHERE a.id IS NULL
UNION ALL SELECT 'component_orphan', COUNT(*) FROM award_criterion_components x LEFT JOIN award_criteria c ON c.id=x.criterion_id WHERE c.id IS NULL
UNION ALL SELECT 'rule_orphan', COUNT(*) FROM award_scoring_rules r LEFT JOIN award_criteria c ON c.id=r.criterion_id WHERE c.id IS NULL
UNION ALL SELECT 'mapping_orphan', COUNT(*) FROM award_evidence_mapping_rules r LEFT JOIN award_criteria c ON c.id=r.criterion_id LEFT JOIN portfolio_categories p ON p.id=r.portfolio_category_id WHERE c.id IS NULL OR p.id IS NULL
UNION ALL SELECT 'evaluation_orphan', COUNT(*) FROM student_award_evaluations e LEFT JOIN award_definitions a ON a.id=e.award_definition_id LEFT JOIN award_cycles c ON c.id=e.cycle_id WHERE a.id IS NULL OR c.id IS NULL
UNION ALL SELECT 'candidate_orphan', COUNT(*) FROM award_interview_eligibilities i LEFT JOIN award_definitions a ON a.id=i.award_definition_id LEFT JOIN award_cycles c ON c.id=i.cycle_id LEFT JOIN profiles p ON p.id=i.student_profile_id WHERE a.id IS NULL OR c.id IS NULL OR p.id IS NULL;

SELECT scoring_model_version_id, criterion_id, COALESCE(criterion_component_id,''),
       portfolio_category_id, COALESCE(portfolio_subcategory_id,''), rule_code, COUNT(*) duplicate_count
FROM award_evidence_mapping_rules
WHERE is_active=1
GROUP BY 1,2,3,4,5,6
HAVING COUNT(*) > 1;

SELECT pc.code portfolio_category, ad.code award, c.code criterion,
       COALESCE(cc.code, '(criterion-level)') component, mr.authority_status,
       CASE WHEN mr.portfolio_subcategory_id IS NULL THEN 'Mapped' ELSE 'Conditional' END mapping_state,
       mr.rule_code mapping_condition
FROM award_evidence_mapping_rules mr
JOIN award_criteria c ON c.id=mr.criterion_id
JOIN award_definitions ad ON ad.id=c.award_definition_id
JOIN portfolio_categories pc ON pc.id=mr.portfolio_category_id
LEFT JOIN award_criterion_components cc ON cc.id=mr.criterion_component_id
WHERE mr.is_active=1 AND ad.status='active' AND ad.is_catalog_visible=1
ORDER BY pc.sort_order, ad.id, c.sort_order, mr.priority;

SELECT se.portfolio_record_id, e.student_profile_id, e.cycle_id, ad.code award,
       c.code criterion, se.scoring_rule_id, se.points_effect, se.basis_snapshot
FROM student_award_score_evidence se
JOIN student_award_criterion_scores cs ON cs.id=se.criterion_score_id
JOIN student_award_evaluations e ON e.id=cs.evaluation_id
JOIN award_definitions ad ON ad.id=e.award_definition_id
JOIN award_criteria c ON c.id=cs.criterion_id
WHERE se.portfolio_record_id IN (
  SELECT se2.portfolio_record_id FROM student_award_score_evidence se2
  JOIN student_award_criterion_scores cs2 ON cs2.id=se2.criterion_score_id
  JOIN student_award_evaluations e2 ON e2.id=cs2.evaluation_id
  GROUP BY se2.portfolio_record_id HAVING COUNT(DISTINCT e2.award_definition_id)>1
)
ORDER BY se.portfolio_record_id, ad.id, c.sort_order;
