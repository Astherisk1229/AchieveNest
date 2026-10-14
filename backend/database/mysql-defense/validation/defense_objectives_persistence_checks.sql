-- AchieveNest defense objectives: read-only MySQL persistence checks
-- Database: achievenest_local
-- Run only after completing the UI/API test cases.
-- Replace the values below with the exact marker and accounts used by the panel.

USE achievenest_local;

SET @marker = 'DEFENSE-REPLACE-ME';
SET @student_email = 'student-test@ndmu.edu.ph';
SET @personnel_email = 'personnel-test@ndmu.edu.ph';

SELECT DATABASE() AS active_database, NOW(6) AS checked_at, VERSION() AS mysql_version;

-- 1. Confirm that the expected authoritative tables exist.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN (
    'student_portfolio_records', 'student_portfolio_evidence',
    'student_portfolio_verification_events', 'events', 'attendance_sessions',
    'attendance_records', 'certificate_template_families',
    'certificate_template_versions', 'certificate_issuance_batches',
    'issued_certificates', 'student_award_evaluations',
    'student_award_criterion_scores', 'student_award_score_evidence',
    'award_evaluation_summary_reports', 'personnel_accomplishments',
    'personnel_accomplishment_evidence', 'personnel_qualification_reviews',
    'personnel_evaluations', 'personnel_evaluation_items',
    'personnel_evaluation_events', 'personnel_evaluation_reports',
    'audit_logs', 'notifications'
  )
ORDER BY table_name;

-- 2. Student achievement plus evidence and complete verification history.
SELECT
  spr.id, p.email, spr.title, spr.status, spr.submitted_at, spr.verified_at,
  spr.created_at, spr.updated_at,
  COUNT(DISTINCT spe.id) AS evidence_rows,
  COUNT(DISTINCT spve.id) AS verification_event_rows
FROM student_portfolio_records spr
JOIN profiles p ON p.id = spr.student_profile_id
LEFT JOIN student_portfolio_evidence spe
  ON spe.portfolio_record_id = spr.id AND spe.status <> 'deleted'
LEFT JOIN student_portfolio_verification_events spve
  ON spve.portfolio_record_id = spr.id
WHERE (spr.title LIKE CONCAT('%', @marker, '%') OR p.email = @student_email)
GROUP BY spr.id, p.email, spr.title, spr.status, spr.submitted_at,
         spr.verified_at, spr.created_at, spr.updated_at
ORDER BY spr.created_at DESC;

SELECT
  spve.portfolio_record_id, spve.action, spve.previous_status,
  spve.new_status, actor.email AS actor_email, spve.remarks, spve.occurred_at
FROM student_portfolio_verification_events spve
JOIN student_portfolio_records spr ON spr.id = spve.portfolio_record_id
LEFT JOIN profiles actor ON actor.id = spve.actor_profile_id
WHERE spr.title LIKE CONCAT('%', @marker, '%')
ORDER BY spve.portfolio_record_id, spve.occurred_at, spve.id;

-- 3. Events, attendance sessions, and exactly-once participant check-in.
SELECT
  e.id AS event_id, e.title, e.status AS event_status,
  ats.id AS session_id, ats.session_name, ats.status AS session_status,
  ar.id AS attendance_id, attendee.email AS attendee_email,
  scanner.email AS scanned_by_email, ar.checked_in_at, ar.verification_method
FROM events e
LEFT JOIN attendance_sessions ats ON ats.event_id = e.id
LEFT JOIN attendance_records ar ON ar.session_id = ats.id
LEFT JOIN profiles attendee ON attendee.id = ar.attendee_profile_id
LEFT JOIN profiles scanner ON scanner.id = ar.scanned_by
WHERE e.title LIKE CONCAT('%', @marker, '%')
ORDER BY e.created_at DESC, ats.created_at, ar.checked_in_at;

SELECT session_id, attendee_profile_id, COUNT(*) AS duplicate_count
FROM attendance_records
GROUP BY session_id, attendee_profile_id
HAVING COUNT(*) > 1;

-- 4. Certificate issuance and current lifecycle state.
SELECT
  ic.id, ic.certificate_code, recipient.email AS recipient_email,
  ic.status, ic.issued_at, ic.revoked_at, ic.revocation_reason,
  cib.id AS batch_id, cib.batch_name, cib.status AS batch_status,
  e.title AS event_title, ctf.name AS template_name, ctv.version_number
FROM issued_certificates ic
JOIN profiles recipient ON recipient.id = ic.recipient_profile_id
JOIN certificate_issuance_batches cib ON cib.id = ic.batch_id
LEFT JOIN events e ON e.id = cib.event_id
JOIN certificate_template_versions ctv ON ctv.id = cib.template_version_id
JOIN certificate_template_families ctf ON ctf.id = ctv.family_id
WHERE recipient.email = @student_email
   OR cib.batch_name LIKE CONCAT('%', @marker, '%')
   OR e.title LIKE CONCAT('%', @marker, '%')
ORDER BY ic.issued_at DESC;

-- 5. OSAD criteria-based evaluation, criterion totals, and evidence lineage.
SELECT
  sae.id AS evaluation_id, student.email AS student_email,
  ad.code AS award_code, ad.name AS award_name, ac.code AS cycle_code,
  sae.status, sae.raw_score, sae.max_computable_score,
  sae.potential_score, sae.qualifies_portfolio_based, sae.evaluated_at,
  COUNT(DISTINCT sacs.id) AS criterion_score_rows,
  COUNT(DISTINCT sase.id) AS linked_verified_evidence_rows
FROM student_award_evaluations sae
JOIN profiles student ON student.id = sae.student_profile_id
JOIN award_definitions ad ON ad.id = sae.award_definition_id
JOIN award_cycles ac ON ac.id = sae.cycle_id
LEFT JOIN student_award_criterion_scores sacs ON sacs.evaluation_id = sae.id
LEFT JOIN student_award_score_evidence sase ON sase.criterion_score_id = sacs.id
WHERE student.email = @student_email OR ac.name LIKE CONCAT('%', @marker, '%')
GROUP BY sae.id, student.email, ad.code, ad.name, ac.code, sae.status,
         sae.raw_score, sae.max_computable_score, sae.potential_score,
         sae.qualifies_portfolio_based, sae.evaluated_at
ORDER BY sae.created_at DESC;

SELECT
  sae.id AS evaluation_id, pc.code AS category_code,
  spr.id AS portfolio_record_id, spr.title, spr.status AS achievement_status,
  sase.points_effect, sase.basis_snapshot
FROM student_award_score_evidence sase
JOIN student_award_criterion_scores sacs ON sacs.id = sase.criterion_score_id
JOIN student_award_evaluations sae ON sae.id = sacs.evaluation_id
JOIN student_portfolio_records spr ON spr.id = sase.portfolio_record_id
JOIN portfolio_categories pc ON pc.id = spr.category_id
JOIN profiles student ON student.id = sae.student_profile_id
WHERE student.email = @student_email
ORDER BY sae.created_at DESC, spr.created_at DESC;

-- This must return zero rows: unverified records must not contribute to scores.
SELECT sase.id, sase.portfolio_record_id, spr.status
FROM student_award_score_evidence sase
JOIN student_portfolio_records spr ON spr.id = sase.portfolio_record_id
WHERE spr.status <> 'verified';

-- 6. Personnel accomplishment, evidence, evaluation details, events, and report.
SELECT
  pa.id, owner.email AS personnel_email, pa.domain, pa.title,
  pa.claimed_points, pa.status, pa.created_at, pa.updated_at,
  COUNT(DISTINCT pae.id) AS evidence_rows
FROM personnel_accomplishments pa
JOIN profiles owner ON owner.id = pa.personnel_profile_id
LEFT JOIN personnel_accomplishment_evidence pae
  ON pae.accomplishment_id = pa.id AND pae.status <> 'deleted'
WHERE pa.title LIKE CONCAT('%', @marker, '%') OR owner.email = @personnel_email
GROUP BY pa.id, owner.email, pa.domain, pa.title, pa.claimed_points,
         pa.status, pa.created_at, pa.updated_at
ORDER BY pa.created_at DESC;

SELECT
  pe.id AS evaluation_id, owner.email AS personnel_email,
  evaluator.email AS evaluator_email, pe.academic_year, pe.semester,
  pe.score_professional_development, pe.score_productivity_creative_work,
  pe.score_service_leadership, pe.total_score, pe.passing_status,
  pe.status, pe.finalized_at,
  COUNT(DISTINCT pei.id) AS item_rows,
  COUNT(DISTINCT peev.id) AS lifecycle_event_rows,
  COUNT(DISTINCT per.id) AS report_rows
FROM personnel_evaluations pe
JOIN profiles owner ON owner.id = pe.personnel_profile_id
JOIN profiles evaluator ON evaluator.id = pe.evaluator_profile_id
LEFT JOIN personnel_evaluation_items pei ON pei.evaluation_id = pe.id
LEFT JOIN personnel_evaluation_events peev ON peev.evaluation_id = pe.id
LEFT JOIN personnel_evaluation_reports per ON per.evaluation_id = pe.id
WHERE owner.email = @personnel_email
GROUP BY pe.id, owner.email, evaluator.email, pe.academic_year, pe.semester,
         pe.score_professional_development, pe.score_productivity_creative_work,
         pe.score_service_leadership, pe.total_score, pe.passing_status,
         pe.status, pe.finalized_at
ORDER BY pe.created_at DESC;

-- 7. Referential-integrity checks. Every count should be zero.
SELECT 'student_evidence_orphans' AS check_name, COUNT(*) AS invalid_rows
FROM student_portfolio_evidence x
LEFT JOIN student_portfolio_records p ON p.id = x.portfolio_record_id
WHERE p.id IS NULL
UNION ALL
SELECT 'verification_event_orphans', COUNT(*)
FROM student_portfolio_verification_events x
LEFT JOIN student_portfolio_records p ON p.id = x.portfolio_record_id
WHERE p.id IS NULL
UNION ALL
SELECT 'attendance_orphans', COUNT(*)
FROM attendance_records x
LEFT JOIN attendance_sessions s ON s.id = x.session_id
WHERE s.id IS NULL
UNION ALL
SELECT 'certificate_batch_orphans', COUNT(*)
FROM issued_certificates x
LEFT JOIN certificate_issuance_batches b ON b.id = x.batch_id
WHERE b.id IS NULL
UNION ALL
SELECT 'personnel_evidence_orphans', COUNT(*)
FROM personnel_accomplishment_evidence x
LEFT JOIN personnel_accomplishments a ON a.id = x.accomplishment_id
WHERE a.id IS NULL
UNION ALL
SELECT 'evaluation_item_orphans', COUNT(*)
FROM personnel_evaluation_items x
LEFT JOIN personnel_evaluations e ON e.id = x.evaluation_id
WHERE e.id IS NULL
UNION ALL
SELECT 'score_evidence_orphans', COUNT(*)
FROM student_award_score_evidence x
LEFT JOIN student_portfolio_records p ON p.id = x.portfolio_record_id
WHERE p.id IS NULL;

-- 8. Show constraints that enforce persistence integrity.
SELECT
  tc.table_name, tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.constraint_schema = DATABASE()
  AND tc.table_name IN (
    'student_portfolio_records', 'student_portfolio_evidence',
    'student_portfolio_verification_events', 'events', 'attendance_sessions',
    'attendance_records', 'issued_certificates', 'personnel_accomplishments',
    'personnel_evaluations', 'personnel_evaluation_items',
    'student_award_evaluations', 'student_award_criterion_scores',
    'student_award_score_evidence'
  )
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
