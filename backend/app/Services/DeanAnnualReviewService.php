<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;
use InvalidArgumentException;

/**
 * DeanAnnualReviewService
 *
 * Plan D1 — Dean Annual Review Input & Portfolio-Validation Eligibility.
 * Manages official Annual Review inputs, decision recording, and supersession by College Deans.
 */
class DeanAnnualReviewService
{
    protected BaseConnection $db;
    protected PersonnelEligibilityService $eligibilityService;

    public function __construct(?BaseConnection $db = null, ?PersonnelEligibilityService $eligibilityService = null)
    {
        $this->db = $db ?? db_connect();
        $this->eligibilityService = $eligibilityService ?? new PersonnelEligibilityService($this->db);
    }

    private function genUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
        );
    }

    /**
     * Resolves the active assigned College ID for a Dean.
     */
    public function getDeanAssignedCollege(string $deanProfileId): ?string
    {
        $assignment = $this->db->query(
            "SELECT college_id
             FROM dean_assignments
             WHERE personnel_profile_id = ?
               AND is_active = 1
             LIMIT 1",
            [$deanProfileId]
        )->getRowArray();

        return $assignment['college_id'] ?? null;
    }

    /**
     * Validates that caller is an authorized Dean for the target academic personnel.
     */
    public function validateDeanAuthorization(string $deanProfileId, string $personnelProfileId): array
    {
        $deanCollegeId = $this->getDeanAssignedCollege($deanProfileId);
        if ($deanCollegeId === null) {
            throw new RuntimeException('FORBIDDEN: Caller is not an active assigned College Dean.');
        }

        $personnel = $this->db->query(
            "SELECT p.id, p.full_name, p.institutional_id, p.institutional_email,
                    pp.personnel_group, pp.organizational_side, pp.faculty_engagement,
                    pp.employment_status, pp.position_title, pp.current_rank_title,
                    pp.college_id, pca.college_id AS affiliation_college_id,
                    c.name AS college_name, c.code AS college_code
             FROM profiles p
             JOIN personnel_profiles pp ON pp.profile_id = p.id
             LEFT JOIN personnel_college_affiliations pca ON pca.personnel_profile_id = p.id AND pca.is_active = 1
             LEFT JOIN colleges c ON c.id = COALESCE(pp.college_id, pca.college_id)
             WHERE p.id = ?
               AND p.status = 'active'",
            [$personnelProfileId]
        )->getRowArray();

        if ($personnel === null) {
            throw new RuntimeException('NOT_FOUND: Active personnel profile not found: ' . $personnelProfileId);
        }

        $effectiveSide = strtolower((string) ($personnel['organizational_side'] ?? 'academic'));
        if ($effectiveSide !== 'academic') {
            throw new RuntimeException('ANNUAL_REVIEW_NOT_APPLICABLE: Annual reviews and portfolio validation apply only to Academic personnel.');
        }

        $personnelCollegeId = $personnel['college_id'] ?? $personnel['affiliation_college_id'] ?? null;
        if ($personnelCollegeId !== $deanCollegeId) {
            throw new RuntimeException('FORBIDDEN: Personnel member does not belong to the Dean\'s assigned College.');
        }

        return [
            'dean_college_id' => $deanCollegeId,
            'personnel'       => $personnel,
        ];
    }

    /**
     * Records the initial effective Annual Review decision for a personnel member in an evaluation cycle.
     */
    public function recordReview(string $deanProfileId, array $payload): array
    {
        $personnelProfileId = (string) ($payload['personnel_profile_id'] ?? '');
        $evaluationCycleId = trim((string) ($payload['evaluation_cycle_id'] ?? '2025-2026'));
        $decision = strtolower(trim((string) ($payload['decision'] ?? '')));
        $decisionReason = trim((string) ($payload['decision_reason'] ?? ''));
        $evidenceDocId = $payload['evidence_document_id'] ?? null;
        $evidenceRef = $payload['evidence_reference'] ?? null;
        $reviewSummary = $payload['review_summary_payload'] ?? null;
        $reviewPeriodLabel = trim((string) ($payload['review_period_label'] ?? "AY {$evaluationCycleId} Annual Review"));

        if ($personnelProfileId === '' || $evaluationCycleId === '') {
            throw new InvalidArgumentException('VALIDATION_ERROR: personnel_profile_id and evaluation_cycle_id are required.');
        }

        if (! in_array($decision, ['cleared', 'not_cleared'], true)) {
            throw new InvalidArgumentException('VALIDATION_ERROR: decision must be either cleared or not_cleared.');
        }

        if ($decision === 'not_cleared' && $decisionReason === '') {
            throw new InvalidArgumentException('DECISION_REASON_REQUIRED: A specific reason is required when Subject to Portfolio Validation is No (not_cleared).');
        }

        $authContext = $this->validateDeanAuthorization($deanProfileId, $personnelProfileId);
        $collegeId = $authContext['dean_college_id'];

        // Check if effective review already exists
        $existing = $this->db->query(
            "SELECT id FROM personnel_annual_reviews
             WHERE personnel_profile_id = ?
               AND evaluation_cycle_id = ?
               AND superseded_at IS NULL
             LIMIT 1",
            [$personnelProfileId, $evaluationCycleId]
        )->getRowArray();

        if ($existing !== null) {
            throw new RuntimeException('ANNUAL_REVIEW_ALREADY_RECORDED: An effective annual review decision already exists for this personnel member and cycle.');
        }

        $id = $this->genUuid();
        $now = date('Y-m-d H:i:s');

        $summaryJson = is_array($reviewSummary) ? json_encode($reviewSummary) : ($reviewSummary ?: null);

        $this->db->table('personnel_annual_reviews')->insert([
            'id'                     => $id,
            'personnel_profile_id'   => $personnelProfileId,
            'evaluation_cycle_id'    => $evaluationCycleId,
            'college_id'             => $collegeId,
            'review_period_label'    => $reviewPeriodLabel,
            'decision'               => $decision,
            'decision_reason'        => $decision === 'not_cleared' ? $decisionReason : null,
            'evidence_document_id'   => $evidenceDocId,
            'evidence_reference'     => $evidenceRef,
            'review_summary_payload' => $summaryJson,
            'recorded_by_dean_id'    => $deanProfileId,
            'recorded_at'            => $now,
            'supersedes_review_id'   => null,
            'superseded_at'          => null,
            'superseded_by_dean_id'  => null,
            'created_at'             => $now,
            'updated_at'             => $now,
        ]);

        // Audit Event Logging
        $this->logAuditEvent('annual_review_recorded', $deanProfileId, [
            'review_id'              => $id,
            'personnel_profile_id'   => $personnelProfileId,
            'evaluation_cycle_id'    => $evaluationCycleId,
            'college_id'             => $collegeId,
            'decision'               => $decision,
            'decision_reason'        => $decisionReason,
            'recorded_at'            => $now,
        ]);

        $this->logAuditEvent(
            $decision === 'cleared' ? 'portfolio_validation_cleared' : 'portfolio_validation_not_cleared',
            $deanProfileId,
            [
                'review_id'            => $id,
                'personnel_profile_id' => $personnelProfileId,
                'evaluation_cycle_id'  => $evaluationCycleId,
                'decision'             => $decision,
            ]
        );

        return $this->getReviewById($id);
    }

    /**
     * Supersedes an existing effective review with a corrected successor review.
     */
    public function supersedeReview(string $reviewId, string $deanProfileId, array $payload): array
    {
        $existing = $this->db->query(
            "SELECT * FROM personnel_annual_reviews WHERE id = ? LIMIT 1",
            [$reviewId]
        )->getRowArray();

        if ($existing === null) {
            throw new RuntimeException('NOT_FOUND: Annual review record not found: ' . $reviewId);
        }

        if ($existing['superseded_at'] !== null) {
            throw new RuntimeException('INVALID_REVIEW_TRANSITION: Cannot supersede an annual review that has already been superseded.');
        }

        $personnelProfileId = $existing['personnel_profile_id'];
        $evaluationCycleId = $existing['evaluation_cycle_id'];

        $authContext = $this->validateDeanAuthorization($deanProfileId, $personnelProfileId);
        $collegeId = $authContext['dean_college_id'];

        $decision = strtolower(trim((string) ($payload['decision'] ?? $existing['decision'])));
        $decisionReason = trim((string) ($payload['decision_reason'] ?? $existing['decision_reason'] ?? ''));
        $evidenceDocId = $payload['evidence_document_id'] ?? $existing['evidence_document_id'];
        $evidenceRef = $payload['evidence_reference'] ?? $existing['evidence_reference'];
        $reviewSummary = $payload['review_summary_payload'] ?? $existing['review_summary_payload'];
        $reviewPeriodLabel = trim((string) ($payload['review_period_label'] ?? $existing['review_period_label']));

        if (! in_array($decision, ['cleared', 'not_cleared'], true)) {
            throw new InvalidArgumentException('VALIDATION_ERROR: decision must be either cleared or not_cleared.');
        }

        if ($decision === 'not_cleared' && $decisionReason === '') {
            throw new InvalidArgumentException('DECISION_REASON_REQUIRED: A specific reason is required when Subject to Portfolio Validation is No (not_cleared).');
        }

        $now = date('Y-m-d H:i:s');
        $newId = $this->genUuid();
        $summaryJson = is_array($reviewSummary) ? json_encode($reviewSummary) : ($reviewSummary ?: null);

        $this->db->transStart();

        // 1. Mark prior review as superseded
        $this->db->table('personnel_annual_reviews')
            ->where('id', $reviewId)
            ->update([
                'superseded_at'         => $now,
                'superseded_by_dean_id' => $deanProfileId,
                'updated_at'            => $now,
            ]);

        // 2. Insert new superseding review
        $this->db->table('personnel_annual_reviews')->insert([
            'id'                     => $newId,
            'personnel_profile_id'   => $personnelProfileId,
            'evaluation_cycle_id'    => $evaluationCycleId,
            'college_id'             => $collegeId,
            'review_period_label'    => $reviewPeriodLabel,
            'decision'               => $decision,
            'decision_reason'        => $decision === 'not_cleared' ? $decisionReason : null,
            'evidence_document_id'   => $evidenceDocId,
            'evidence_reference'     => $evidenceRef,
            'review_summary_payload' => $summaryJson,
            'recorded_by_dean_id'    => $deanProfileId,
            'recorded_at'            => $now,
            'supersedes_review_id'   => $reviewId,
            'superseded_at'          => null,
            'superseded_by_dean_id'  => null,
            'created_at'             => $now,
            'updated_at'             => $now,
        ]);

        $this->db->transComplete();

        if ($this->db->transStatus() === false) {
            throw new RuntimeException('DATABASE_ERROR: Failed to supersede annual review transactionally.');
        }

        // Audit Event Logging
        $this->logAuditEvent('annual_review_superseded', $deanProfileId, [
            'prior_review_id'      => $reviewId,
            'new_review_id'        => $newId,
            'personnel_profile_id' => $personnelProfileId,
            'evaluation_cycle_id'  => $evaluationCycleId,
            'prior_decision'       => $existing['decision'],
            'new_decision'         => $decision,
            'superseded_at'        => $now,
        ]);

        return $this->getReviewById($newId);
    }

    /**
     * Lists academic personnel in the Dean's assigned college with their annual review status.
     */
    public function listForDean(string $deanProfileId, array $filters = []): array
    {
        $deanCollegeId = $this->getDeanAssignedCollege($deanProfileId);
        if ($deanCollegeId === null) {
            throw new RuntimeException('FORBIDDEN: Caller is not an active assigned College Dean.');
        }

        $evaluationCycleId = trim((string) ($filters['evaluation_cycle_id'] ?? '2025-2026'));

        $query = $this->db->query(
            "SELECT p.id, p.full_name, p.institutional_id, p.institutional_email, p.avatar_url,
                    pp.personnel_group, pp.organizational_side, pp.faculty_engagement,
                    pp.employment_status, pp.position_title, pp.current_rank_title,
                    pp.qualification_summary, c.name AS college_name, c.code AS college_code
             FROM profiles p
             JOIN personnel_profiles pp ON pp.profile_id = p.id
             LEFT JOIN personnel_college_affiliations pca ON pca.personnel_profile_id = p.id AND pca.is_active = 1
             LEFT JOIN colleges c ON c.id = COALESCE(pp.college_id, pca.college_id)
             WHERE (pp.college_id = ? OR pca.college_id = ?)
               AND pp.organizational_side = 'academic'
               AND p.status = 'active'
             ORDER BY p.full_name ASC",
            [$deanCollegeId, $deanCollegeId]
        );

        $personnelRows = $query->getResultArray();
        $result = [];

        foreach ($personnelRows as $row) {
            $profileId = $row['id'];

            $effectiveReview = $this->db->query(
                "SELECT * FROM personnel_annual_reviews
                 WHERE personnel_profile_id = ?
                   AND evaluation_cycle_id = ?
                   AND superseded_at IS NULL
                 LIMIT 1",
                [$profileId, $evaluationCycleId]
            )->getRowArray();

            $supersededCount = $this->db->query(
                "SELECT COUNT(*) AS total FROM personnel_annual_reviews
                 WHERE personnel_profile_id = ?
                   AND evaluation_cycle_id = ?
                   AND superseded_at IS NOT NULL",
                [$profileId, $evaluationCycleId]
            )->getRowArray()['total'] ?? 0;

            $eligibility = $this->eligibilityService->evaluateEligibility($profileId, $evaluationCycleId);

            $result[] = [
                'personnel'            => $row,
                'evaluation_cycle_id'  => $evaluationCycleId,
                'annual_review'        => $effectiveReview,
                'superseded_count'     => (int) $supersededCount,
                'eligibility'          => $eligibility,
            ];
        }

        return [
            'evaluation_cycle_id' => $evaluationCycleId,
            'college_id'          => $deanCollegeId,
            'total_personnel'     => count($result),
            'personnel'           => $result,
        ];
    }

    /**
     * Gets a single review record by ID.
     */
    public function getReviewById(string $id): array
    {
        $review = $this->db->query(
            "SELECT * FROM personnel_annual_reviews WHERE id = ? LIMIT 1",
            [$id]
        )->getRowArray();

        if ($review === null) {
            throw new RuntimeException('NOT_FOUND: Annual review record not found: ' . $id);
        }

        if (! empty($review['review_summary_payload']) && is_string($review['review_summary_payload'])) {
            $decoded = json_decode($review['review_summary_payload'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $review['review_summary_payload'] = $decoded;
            }
        }

        return $review;
    }

    /**
     * Logs structured events into account_lifecycle_events.
     */
    private function logAuditEvent(string $eventType, string $performedBy, array $meta): void
    {
        try {
            $this->db->table('account_lifecycle_events')->insert([
                'id'           => $this->genUuid(),
                'account_id'   => $meta['personnel_profile_id'] ?? $performedBy,
                'event_type'   => $eventType,
                'performed_by' => $performedBy,
                'reason'       => json_encode($meta),
                'occurred_at'  => date('Y-m-d H:i:s'),
                'created_at'   => date('Y-m-d H:i:s'),
            ]);
        } catch (\Throwable $e) {
            // Non-blocking audit log failure
        }
    }
}
