<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;

/**
 * PersonnelEligibilityService
 *
 * Plan D1 — Portfolio-Validation & Ranking Eligibility.
 * Produces an explainable, read-only eligibility DTO.
 * Has no scoring formula and makes no writes to Plan C records.
 */
class PersonnelEligibilityService
{
    protected BaseConnection $db;

    public function __construct(?BaseConnection $db = null)
    {
        $this->db = $db ?? db_connect();
    }

    /**
     * Evaluates portfolio-validation eligibility and ranking readiness for a personnel profile and evaluation cycle.
     */
    public function evaluateEligibility(string $personnelProfileId, string $evaluationCycleId = '2025-2026'): array
    {
        $personnel = $this->db->query(
            "SELECT p.id, p.full_name, p.status AS account_status,
                    pp.personnel_group, pp.organizational_side, pp.faculty_engagement,
                    pp.employment_status, pp.position_title, pp.current_rank_title,
                    pp.college_id
             FROM profiles p
             JOIN personnel_profiles pp ON pp.profile_id = p.id
             WHERE p.id = ?",
            [$personnelProfileId]
        )->getRowArray();

        if ($personnel === null) {
            return [
                'evaluation_cycle_id' => $evaluationCycleId,
                'personnel_profile_id' => $personnelProfileId,
                'portfolio_validation' => [
                    'eligible'     => false,
                    'decision'     => 'pending',
                    'review_id'    => null,
                    'recorded_at'  => null,
                    'reason_codes' => ['PERSONNEL_NOT_FOUND'],
                ],
                'ranking_readiness' => [
                    'eligible'     => false,
                    'reason_codes' => ['PERSONNEL_NOT_FOUND'],
                ],
            ];
        }

        $group = strtolower((string) ($personnel['personnel_group'] ?? 'faculty'));
        $side = strtolower((string) ($personnel['organizational_side'] ?? 'academic'));
        $engagement = strtolower((string) ($personnel['faculty_engagement'] ?? 'full_time_faculty'));
        $status = strtolower((string) ($personnel['employment_status'] ?? 'permanent'));
        $accountActive = strtolower((string) ($personnel['account_status'] ?? 'active')) === 'active';

        // Fetch effective Annual Review
        $effectiveReview = $this->db->query(
            "SELECT * FROM personnel_annual_reviews
             WHERE personnel_profile_id = ?
               AND evaluation_cycle_id = ?
               AND superseded_at IS NULL
             LIMIT 1",
            [$personnelProfileId, $evaluationCycleId]
        )->getRowArray();

        // 1. Evaluate Portfolio-Validation Eligibility
        $pvEligible = false;
        $pvDecision = 'pending';
        $pvReviewId = null;
        $pvRecordedAt = null;
        $pvReasonCodes = [];

        if ($side !== 'academic') {
            $pvReasonCodes[] = 'NOT_ACADEMIC_PERSONNEL';
        }

        if ($effectiveReview === null) {
            $pvDecision = 'pending';
            if ($side === 'academic') {
                $pvReasonCodes[] = 'ANNUAL_REVIEW_PENDING';
            }
        } else {
            $pvDecision = $effectiveReview['decision'];
            $pvReviewId = $effectiveReview['id'];
            $pvRecordedAt = $effectiveReview['recorded_at'];

            if ($effectiveReview['decision'] === 'cleared' && $side === 'academic') {
                $pvEligible = true;
            } elseif ($effectiveReview['decision'] === 'not_cleared') {
                $pvReasonCodes[] = 'ANNUAL_REVIEW_NOT_CLEARED';
            }
        }

        // 2. Evaluate Ranking Readiness
        $rrReasonCodes = [];

        if (! $accountActive) {
            $rrReasonCodes[] = 'ACCOUNT_INACTIVE';
        }

        if ($side !== 'academic') {
            $rrReasonCodes[] = 'NOT_ACADEMIC_PERSONNEL';
        }

        if ($group !== 'faculty') {
            $rrReasonCodes[] = 'UNSUPPORTED_PERSONNEL_GROUP_FOR_RANKING';
        }

        if ($engagement === 'part_time_faculty') {
            $rrReasonCodes[] = 'PART_TIME_FACULTY';
        }

        if ($effectiveReview === null) {
            if ($side === 'academic') {
                $rrReasonCodes[] = 'ANNUAL_REVIEW_PENDING';
            }
        } elseif ($effectiveReview['decision'] !== 'cleared') {
            $rrReasonCodes[] = 'ANNUAL_REVIEW_NOT_CLEARED';
        }

        // Check if Plan C evaluation root already exists for this cycle
        $existingRoot = $this->db->query(
            "SELECT id FROM personnel_evaluation_roots
             WHERE personnel_profile_id = ?
               AND (evaluation_cycle_id = ? OR academic_year = ?)
             LIMIT 1",
            [$personnelProfileId, $evaluationCycleId, $evaluationCycleId]
        )->getRowArray();

        if ($existingRoot !== null) {
            $rrReasonCodes[] = 'EVALUATION_ALREADY_EXISTS_FOR_CYCLE';
        }

        $rankingReady = (count($rrReasonCodes) === 0);

        return [
            'evaluation_cycle_id'  => $evaluationCycleId,
            'personnel_profile_id' => $personnelProfileId,
            'master_data' => [
                'personnel_group'     => $group,
                'organizational_side' => $side,
                'faculty_engagement'  => $engagement,
                'employment_status'   => $status,
                'position_title'      => $personnel['position_title'] ?? 'Personnel',
                'current_rank_title'  => $personnel['current_rank_title'] ?? null,
            ],
            'portfolio_validation' => [
                'eligible'        => $pvEligible,
                'decision'        => $pvDecision,
                'review_id'       => $pvReviewId,
                'recorded_at'     => $pvRecordedAt,
                'decision_reason' => $effectiveReview['decision_reason'] ?? null,
                'reason_codes'    => array_values(array_unique($pvReasonCodes)),
            ],
            'ranking_readiness' => [
                'eligible'     => $rankingReady,
                'reason_codes' => array_values(array_unique($rrReasonCodes)),
            ],
        ];
    }
}
