<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;
use Throwable;

/**
 * AwardScoringService
 *
 * Authoritative Award-Specific Scoring Engine & Evidence Traceability for AchieveNest OSAD Award Evaluation.
 * Converts Phase 4's award-specific relevant Verified evidence into deterministic criterion scores,
 * award raw portfolio scores, and criterion-to-evidence traceability for all 15 authoritative awards.
 *
 * Invariant: Does not calculate Potential Candidate status, apply 80% candidate threshold, or rank students.
 */
class AwardScoringService
{
    protected $db = null;
    protected AwardEligibilityService $eligibilityService;
    protected AwardEvidenceMappingService $mappingService;

    // Sports Result Matrix
    protected const SPORTS_AWARDS_MATRIX = [
        'PRISAA NATIONAL' => ['GOLD' => 7.0, 'SILVER' => 5.0, 'BRONZE' => 3.0],
        'PRISAA REGIONAL' => ['GOLD' => 5.0, 'SILVER' => 3.0, 'BRONZE' => 2.0],
        'PRISAA LOCAL'    => ['GOLD' => 3.0, 'SILVER' => 2.0, 'BRONZE' => 1.0],
        'NDEA'            => ['GOLD' => 4.0, 'SILVER' => 4.0, 'BRONZE' => 2.0],
        'INTRAMS'         => ['GOLD' => 2.0, 'SILVER' => 1.0, 'BRONZE' => 1.0],
    ];

    // Socio-Cultural Result Matrix
    protected const SOCIO_AWARDS_MATRIX = [
        'NATIONAL'         => ['GOLD' => 7.0, 'CHAMPION' => 7.0, '1ST' => 7.0, 'SILVER' => 5.0, '2ND' => 5.0, 'BRONZE' => 3.0, '3RD' => 3.0],
        'REGIONAL'         => ['GOLD' => 5.0, 'CHAMPION' => 5.0, '1ST' => 5.0, 'SILVER' => 3.0, '2ND' => 3.0, 'BRONZE' => 2.0, '3RD' => 2.0],
        'LOCAL'            => ['GOLD' => 3.0, 'CHAMPION' => 3.0, '1ST' => 3.0, 'SILVER' => 2.0, '2ND' => 2.0, 'BRONZE' => 1.0, '3RD' => 1.0],
        'NDEA'             => ['GOLD' => 4.0, 'CHAMPION' => 4.0, '1ST' => 4.0, 'SILVER' => 3.0, '2ND' => 3.0, 'BRONZE' => 2.0, '3RD' => 2.0],
        'UNIVERSITY-LEVEL' => ['GOLD' => 2.0, 'CHAMPION' => 2.0, '1ST' => 2.0, 'SILVER' => 1.0, '2ND' => 1.0, 'BRONZE' => 1.0, '3RD' => 1.0],
    ];

    public function __construct(
        $db = null,
        ?AwardEligibilityService $eligibilityService = null,
        ?AwardEvidenceMappingService $mappingService = null
    ) {
        if ($db !== null) {
            $this->db = $db;
        } elseif (function_exists('db_connect')) {
            $this->db = db_connect();
        }
        $this->eligibilityService = $eligibilityService ?? new AwardEligibilityService($this->db);
        $this->mappingService = $mappingService ?? new AwardEvidenceMappingService($this->db, $this->eligibilityService);
    }

    /**
     * Scores an eligible student for a selected award based on Phase 4 mapped Verified evidence.
     *
     * @param array|object $award Award definition entity
     * @param array|object $student Student profile entity
     * @param array|null $records Pre-loaded portfolio records (optional)
     * @return array Complete scoring and traceability result
     */
    public function scoreStudentForAward($award, $student, ?array $records = null): array
    {
        $awardArr = is_object($award) ? (array) $award : $award;
        $studentArr = is_object($student) ? (array) $student : $student;

        // 1. Get Phase 4 Evidence Mapping Package
        $evidencePackage = $this->mappingService->mapStudentEvidenceForAward($awardArr, $studentArr, $records);

        if (! $evidencePackage['is_award_level_eligible']) {
            return [
                'award_id'               => $awardArr['id'] ?? null,
                'award_code'             => $awardArr['code'] ?? null,
                'student_id'             => $studentArr['id'] ?? null,
                'is_eligible'            => false,
                'raw_portfolio_score'    => 0.0,
                'computable_max_score'   => (float) ($awardArr['computable_max_score'] ?? 0.0),
                'criteria_scores'        => [],
                'evidence_traceability'  => [],
                'diagnostics'            => ['Student failed Phase 3 award-level eligibility gates.'],
            ];
        }

        $awardCode = strtoupper(trim((string) ($awardArr['code'] ?? '')));
        $criteria = $evidencePackage['criteria'] ?? [];

        // 2. Score Award Criteria based on Rubric
        $criteriaScores = [];
        $totalRawScore = 0.0;
        $totalMaxComputable = 0.0;
        $allEvidenceTrace = [];

        foreach ($criteria as $crit) {
            $critScoreResult = $this->scoreCriterion($awardCode, $crit);
            $criteriaScores[] = $critScoreResult;
            $totalRawScore += $critScoreResult['earned_points'];
            $totalMaxComputable += $critScoreResult['max_points'];

            foreach ($critScoreResult['evidence_trace'] as $trace) {
                $allEvidenceTrace[] = $trace;
            }
        }

        // Cap award raw score to computable maximum
        $awardCap = $this->getAwardComputableCap($awardCode, $totalMaxComputable);
        $finalRawScore = min($totalRawScore, $awardCap);

        return [
            'award_id'               => $awardArr['id'] ?? null,
            'award_code'             => $awardCode,
            'award_name'             => $awardArr['name'] ?? '',
            'student_id'             => $studentArr['id'] ?? null,
            'student_name'           => $studentArr['full_name'] ?? $studentArr['student_name'] ?? '',
            'is_eligible'            => true,
            'raw_portfolio_score'    => round($finalRawScore, 2),
            'computable_max_score'   => round($awardCap, 2),
            'scoring_version'        => $awardArr['active_scoring_version'] ?? '1.0',
            'criteria_scores'        => $criteriaScores,
            'evidence_traceability'  => $allEvidenceTrace,
            'scoring_status'         => 'SCORED',
        ];
    }

    /**
     * Scores a single criterion using exact component rules and caps.
     */
    public function scoreCriterion(string $awardCode, array $crit): array
    {
        $critCode = strtoupper(trim((string) ($crit['criterion_code'] ?? '')));
        $critMax = (float) ($crit['max_points'] ?? 0.0);
        $evidenceList = $crit['evidence'] ?? [];

        $components = [];
        $critEarnedTotal = 0.0;
        $critTrace = [];

        // Award 1: Notre Dame Award
        if ($awardCode === 'NOTRE_DAME_AWARD') {
            if (str_contains($critCode, 'LEADERSHIP')) {
                // A1 Leadership Involvement (Highest Only, max 10)
                $a1Result = $this->evaluateHighestOnlyLeadership($evidenceList, 10.0, [
                    'SSG_UNIVERSITY_GOVERNMENT'  => 10.0,
                    'COLLEGIATE_COLLEGE_COUNCIL' => 8.0,
                    'CLUB_ORGANIZATION'          => 6.0,
                    'YEAR_LEVEL_LEADERSHIP'      => 4.0,
                ]);

                // A2 Awards/Citations/Seminars (Accumulate, cap 10)
                $a2Result = $this->evaluateAccumulateAwardsSeminars($evidenceList, 10.0, 5.0, 2.0, 2.0);

                $components[] = $a1Result;
                $components[] = $a2Result;
            } elseif (str_contains($critCode, 'CHURCH')) {
                // B1 Church Ministry (Schedule: 1=2, 2=4, 3=6, 4=8, 5+=10)
                $b1Result = $this->evaluateChurchMinistrySchedule($evidenceList, 10.0);

                // B2 Initiated Activities (Accumulate roles: 2, 3, 4, 5; cap 10)
                $b2Result = $this->evaluateInitiatedChurchActivities($evidenceList, 10.0);

                $components[] = $b1Result;
                $components[] = $b2Result;
            } elseif (str_contains($critCode, 'CITATION')) {
                // C Non-Academic Citations (2 per citation, cap 10)
                $cResult = $this->evaluatePerRecordCapped($evidenceList, 2.0, 10.0, 'Non-Academic Citations');
                $components[] = $cResult;
            }
        }
        // Award 2: Saint Marcellin Champagnat Award
        elseif ($awardCode === 'SMC_AWARD') {
            if (str_contains($critCode, 'LEADERSHIP') || str_contains($critCode, 'LEAD')) {
                $a1Result = $this->evaluateHighestOnlyLeadership($evidenceList, 10.0, [
                    'SSG_UNIVERSITY_GOVERNMENT'  => 10.0,
                    'COLLEGIATE_COLLEGE_COUNCIL' => 8.0,
                    'CLUB_ORGANIZATION'          => 6.0,
                    'YEAR_LEVEL_LEADERSHIP'      => 4.0,
                ]);
                $a2Result = $this->evaluateAccumulateAwardsSeminars($evidenceList, 10.0, 5.0, 2.0, 2.0);
                $components[] = $a1Result;
                $components[] = $a2Result;
            } elseif (str_contains($critCode, 'COMMUNITY') || str_contains($critCode, 'CHURCH')) {
                $involvementEv = array_filter($evidenceList, fn($ev) => ! str_contains(strtoupper((string) (($ev['structured_metadata'] ?? [])['role'] ?? '')), 'INITIAT') && ! str_contains(strtoupper((string) (($ev['structured_metadata'] ?? [])['role'] ?? '')), 'HEAD'));
                $initiatedEv = array_filter($evidenceList, fn($ev) => str_contains(strtoupper((string) (($ev['structured_metadata'] ?? [])['role'] ?? '')), 'INITIAT') || str_contains(strtoupper((string) (($ev['structured_metadata'] ?? [])['role'] ?? '')), 'HEAD') || str_contains(strtoupper((string) (($ev['structured_metadata'] ?? [])['role'] ?? '')), 'LEAD'));

                $b1Result = $this->evaluateFixedPresenceTriple($evidenceList, 15.0, 5.0, 5.0, 5.0);
                $b2Result = $this->evaluateInitiatedActivitiesFixed($initiatedEv, 15.0, 10.0, 5.0);

                $components[] = $b1Result;
                $components[] = $b2Result;
            } elseif (str_contains($critCode, 'CITATION')) {
                $cResult = $this->evaluatePerRecordCapped($evidenceList, 2.0, 10.0, 'Non-Academic Citations');
                $components[] = $cResult;
            }
        }
        // Award 3: Leadership Award
        elseif ($awardCode === 'LEADERSHIP_AWARD') {
            if (str_contains($critCode, 'LEAD_CAMPUS_LEAD') || str_contains($critCode, 'LEADERSHIP') || str_contains($critCode, 'LEAD_GOV')) {
                $a1Result = $this->evaluateHighestOnlyLeadership($evidenceList, 10.0, [
                    'SSG_UNIVERSITY_GOVERNMENT'  => 10.0,
                    'COLLEGIATE_COLLEGE_COUNCIL' => 8.0,
                    'CLUB_ORGANIZATION'          => 6.0,
                    'YEAR_LEVEL_LEADERSHIP'      => 4.0,
                ]);
                $a2Result = $this->evaluateAccumulateAwardsSeminars($evidenceList, 10.0, 5.0, 3.0, 2.0);
                $a3Result = $this->evaluateHighestOnlyCivic($evidenceList, 10.0);

                $components[] = $a1Result;
                $components[] = $a2Result;
                $components[] = $a3Result;
            } elseif (str_contains($critCode, 'COMMUNITY') || str_contains($critCode, 'LEAD_COMM')) {
                $b1Result = $this->evaluateFixedPresenceTriple($evidenceList, 10.0, 4.0, 3.0, 3.0);
                $b2Result = $this->evaluateInitiatedActivitiesFixed($evidenceList, 10.0, 6.0, 4.0);

                $components[] = $b1Result;
                $components[] = $b2Result;
            }
        }
        // Award 4: Campus Journalism Award
        elseif ($awardCode === 'CAMPUS_JOURNALISM_AWARD') {
            if (str_contains($critCode, 'PUB')) {
                $newsResult = $this->evaluateJournalismPubType($evidenceList, 'COMP_JOURN_NEWS', 2.0, 10.0, 'News Item');
                $litResult = $this->evaluateJournalismPubType($evidenceList, 'COMP_JOURN_LITERARY', 2.0, 10.0, 'Literary Piece');
                $colResult = $this->evaluateJournalismPubType($evidenceList, 'COMP_JOURN_COLUMN', 4.0, 20.0, 'Column');
                $editResult = $this->evaluateJournalismPubType($evidenceList, 'COMP_JOURN_EDITORIAL', 4.0, 20.0, 'Editorial');

                $components[] = $newsResult;
                $components[] = $litResult;
                $components[] = $colResult;
                $components[] = $editResult;
            } elseif (str_contains($critCode, 'LEAD')) {
                $leadResult = $this->evaluateJournalismLeadershipRoles($evidenceList, 5.0);
                $awardsResult = $this->evaluateJournalismAwards($evidenceList, 5.0);

                $components[] = $leadResult;
                $components[] = $awardsResult;
            }
        }
        // Awards 5, 6, 12, 13: Sports Family Awards
        elseif (str_contains($awardCode, 'SPORTS') || str_contains($awardCode, 'ATHLETE')) {
            if (str_contains($critCode, 'SKILL') || str_contains($critCode, 'SKILLS')) {
                $compResult = $this->evaluateSportsSkillsFixed($evidenceList, 20.0);
                $components[] = $compResult;
            } elseif (str_contains($critCode, 'MEET') || str_contains($critCode, 'PARTICIPATION')) {
                $partResult = $this->evaluateSportsParticipation($evidenceList, 20.0);
                $components[] = $partResult;
            } elseif (str_contains($critCode, 'AWARD') || str_contains($critCode, 'PLACEMENT')) {
                $awardsResult = $this->evaluateSportsAwardsMatrix($evidenceList, 15.0);
                $components[] = $awardsResult;
            }
        }
        // Awards 7, 8, 14, 15: Socio-Cultural Family Awards
        elseif (str_contains($awardCode, 'SOCIO') || str_contains($awardCode, 'CULT') || str_contains($awardCode, 'PERFORMER')) {
            if (str_contains($critCode, 'SKILL') || str_contains($critCode, 'SKILLS')) {
                $compResult = $this->evaluateSocioCulturalSkillsFixed($evidenceList, 20.0);
                $components[] = $compResult;
            } elseif (str_contains($critCode, 'MEET') || str_contains($critCode, 'PARTICIPATION')) {
                $partResult = $this->evaluateSocioCulturalParticipation($evidenceList, 20.0);
                $components[] = $partResult;
            } elseif (str_contains($critCode, 'AWARD') || str_contains($critCode, 'PLACEMENT')) {
                $awardsResult = $this->evaluateSocioCulturalAwardsMatrix($evidenceList, 15.0);
                $components[] = $awardsResult;
            }
        }
        // Award 9: Outstanding Student Leader of the Year
        elseif ($awardCode === 'STUDENT_LEADER_OF_THE_YEAR') {
            if (str_contains($critCode, 'LEADERSHIP') || str_contains($critCode, 'LEAD_GOV')) {
                $a1Result = $this->evaluateDistinctCategoryLeadership($evidenceList, 30.0);
                $a2Result = $this->evaluateAccumulateAwardsSeminars($evidenceList, 10.0, 4.0, 2.0, 2.0);

                $components[] = $a1Result;
                $components[] = $a2Result;
            } elseif (str_contains($critCode, 'COMMUNITY') || str_contains($critCode, 'LEAD_COMM')) {
                $bResult = $this->evaluateFixedPresenceTriple($evidenceList, 10.0, 4.0, 3.0, 3.0);
                $components[] = $bResult;
            }
        }
        // Award 10: Outstanding Member of the Year
        elseif ($awardCode === 'MEMBER_OF_THE_YEAR') {
            if (str_contains($critCode, 'MEMBERSHIP') || str_contains($critCode, 'MEMBERSHIP_QUALITY') || str_contains($critCode, 'INVOLVEMENT') || str_contains($critCode, 'PARTICIPATION')) {
                $involvementEv = array_filter($evidenceList, fn($ev) => empty(($ev['structured_metadata'] ?? [])['contribution_type']));
                $contribEv = array_filter($evidenceList, fn($ev) => ! empty(($ev['structured_metadata'] ?? [])['contribution_type']));

                $aResult = $this->evaluateMemberInvolvement($involvementEv, 20.0);
                $bResult = $this->evaluateMemberContribution($contribEv, 10.0);

                $components[] = $aResult;
                $components[] = $bResult;
            } elseif (str_contains($critCode, 'LEADERSHIP') || str_contains($critCode, 'LEAD')) {
                $c1Result = $this->evaluateHighestOnlyLeadership($evidenceList, 5.0, ['SSG_UNIVERSITY_GOVERNMENT' => 3.0, 'COLLEGIATE_COLLEGE_COUNCIL' => 3.0, 'CLUB_ORGANIZATION' => 2.0]);
                $c2Result = $this->evaluateAccumulateAwardsSeminars($evidenceList, 5.0, 3.0, 2.0, 0.0);
                $components[] = $c1Result;
                $components[] = $c2Result;
            }
        }
        // Award 11: Outstanding Volunteer of the Year
        elseif ($awardCode === 'VOLUNTEER_OF_THE_YEAR') {
            if (str_contains($critCode, 'VOLUNTEERISM') || str_contains($critCode, 'VOL_DIRECT') || str_contains($critCode, 'VOLUNTEER')) {
                $commEv = array_filter($evidenceList, fn($ev) => ($ev['category_code'] ?? '') === 'COMMUNITY_SERVICE_VOLUNTEERISM' || ($ev['category_code'] ?? '') === 'CHURCH_MINISTRY_INVOLVEMENT');
                $citationEv = array_filter($evidenceList, fn($ev) => ($ev['category_code'] ?? '') === 'CITATION_RECOGNITION');

                $a1Result = $this->evaluateFixedPresenceTriple($commEv, 15.0, 5.0, 5.0, 5.0);
                $a2Result = $this->evaluateFixedPresenceTriple($commEv, 15.0, 5.0, 5.0, 5.0);
                $a3Result = $this->evaluatePerRecordCapped($citationEv, 2.0, 10.0, 'Volunteer Citations');

                $components[] = $a1Result;
                $components[] = $a2Result;
                $components[] = $a3Result;
            } elseif (str_contains($critCode, 'LEADERSHIP') || str_contains($critCode, 'VOL_LEAD')) {
                $b1Result = $this->evaluateHighestOnlyLeadership($evidenceList, 5.0, ['SSG_UNIVERSITY_GOVERNMENT' => 3.0, 'COLLEGIATE_COLLEGE_COUNCIL' => 3.0, 'CLUB_ORGANIZATION' => 2.0]);
                $b2Result = $this->evaluateAccumulateAwardsSeminars($evidenceList, 5.0, 3.0, 2.0, 0.0);
                $components[] = $b1Result;
                $components[] = $b2Result;
            }
        }

        // Aggregate component points into criterion earned points
        foreach ($components as $comp) {
            $critEarnedTotal += $comp['earned_points'];
            foreach ($comp['evidence_trace'] as $trace) {
                $critTrace[] = array_merge($trace, [
                    'criterion_id'   => $crit['criterion_id'] ?? '',
                    'criterion_code' => $critCode,
                ]);
            }
        }

        $cappedCritEarned = min($critEarnedTotal, $critMax);

        return [
            'criterion_id'    => $crit['criterion_id'] ?? '',
            'criterion_code'  => $critCode,
            'criterion_name'  => $crit['criterion_name'] ?? '',
            'earned_points'   => round($cappedCritEarned, 2),
            'max_points'      => round($critMax, 2),
            'components'      => $components,
            'evidence_trace'  => $critTrace,
        ];
    }

    /**
     * Rule: Highest Applicable Only.
     */
    protected function evaluateHighestOnlyLeadership(array $evidenceList, float $cap, array $levelPoints): array
    {
        $highestPoints = 0.0;
        $selectedTrace = [];
        $qualifyingRecords = [];

        foreach ($evidenceList as $ev) {
            if (($ev['category_code'] ?? '') !== 'LEADERSHIP_POSITION') {
                continue;
            }
            $subCode = $ev['subcategory_code'] ?? '';
            $points = $levelPoints[$subCode] ?? 4.0;
            $qualifyingRecords[] = [
                'record_id' => $ev['record_id'],
                'points'    => $points,
                'title'     => $ev['title'] ?? '',
            ];

            if ($points > $highestPoints) {
                $highestPoints = $points;
            }
        }

        $earned = min($highestPoints, $cap);
        $selected = false;

        foreach ($qualifyingRecords as $q) {
            $isSelected = (! $selected && $q['points'] === $highestPoints && $highestPoints > 0);
            if ($isSelected) {
                $selected = true;
            }

            $selectedTrace[] = [
                'record_id'           => $q['record_id'],
                'title'               => $q['title'],
                'component_name'      => 'Leadership Involvement (Highest Only)',
                'rule_type'           => 'HIGHEST_APPLICABLE_ONLY',
                'base_points'         => $q['points'],
                'contribution_points' => $isSelected ? $earned : 0.0,
                'is_selected'         => $isSelected,
            ];
        }

        return [
            'component_code' => 'COMP_LEADERSHIP_INVOLVEMENT',
            'component_name' => 'Leadership Involvement',
            'rule_type'      => 'HIGHEST_APPLICABLE_ONLY',
            'earned_points'  => round($earned, 2),
            'max_points'     => $cap,
            'evidence_trace' => $selectedTrace,
        ];
    }

    /**
     * Rule: Distinct Category Accumulation (Student Leader of the Year: SSG 12, College 8, Club 6, Year 4; cap 30).
     */
    protected function evaluateDistinctCategoryLeadership(array $evidenceList, float $cap): array
    {
        $categoryPoints = [
            'SSG_UNIVERSITY_GOVERNMENT'  => 12.0,
            'COLLEGIATE_COLLEGE_COUNCIL' => 8.0,
            'CLUB_ORGANIZATION'          => 6.0,
            'YEAR_LEVEL_LEADERSHIP'      => 4.0,
        ];

        $seenCategories = [];
        $totalEarned = 0.0;
        $trace = [];

        foreach ($evidenceList as $ev) {
            if (($ev['category_code'] ?? '') !== 'LEADERSHIP_POSITION') {
                continue;
            }
            $subCode = $ev['subcategory_code'] ?? '';
            $points = $categoryPoints[$subCode] ?? 4.0;

            if (! isset($seenCategories[$subCode])) {
                $seenCategories[$subCode] = true;
                $totalEarned += $points;
                $trace[] = [
                    'record_id'           => $ev['record_id'],
                    'title'               => $ev['title'] ?? '',
                    'component_name'      => 'Distinct Category Leadership',
                    'rule_type'           => 'DISTINCT_CATEGORY_ACCUMULATION',
                    'base_points'         => $points,
                    'contribution_points' => $points,
                    'is_selected'         => true,
                ];
            } else {
                $trace[] = [
                    'record_id'           => $ev['record_id'],
                    'title'               => $ev['title'] ?? '',
                    'component_name'      => 'Distinct Category Leadership',
                    'rule_type'           => 'DISTINCT_CATEGORY_ACCUMULATION',
                    'base_points'         => $points,
                    'contribution_points' => 0.0,
                    'is_selected'         => false,
                    'note'                => 'Duplicate category already satisfied',
                ];
            }
        }

        $earned = min($totalEarned, $cap);

        return [
            'component_code' => 'COMP_DISTINCT_LEADERSHIP',
            'component_name' => 'Leadership Involvement (Distinct Category)',
            'rule_type'      => 'DISTINCT_CATEGORY_ACCUMULATION',
            'earned_points'  => round($earned, 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Rule: Accumulate Awards/Citations/Seminars with Cap.
     */
    protected function evaluateAccumulateAwardsSeminars(
        array $evidenceList,
        float $cap,
        float $natAwardPoints,
        float $localAwardPoints,
        float $seminarPoints
    ): array {
        $totalEarned = 0.0;
        $trace = [];

        foreach ($evidenceList as $ev) {
            $catCode = $ev['category_code'] ?? '';
            $meta = $ev['structured_metadata'] ?? [];
            $points = 0.0;
            $ruleName = '';

            if ($catCode === 'CITATION_RECOGNITION') {
                $scope = strtoupper(trim((string) ($meta['scope'] ?? 'LOCAL')));
                if ($scope === 'INTERNATIONAL' || $scope === 'NATIONAL') {
                    $points = $natAwardPoints;
                    $ruleName = 'National/International Award';
                } else {
                    $points = $localAwardPoints;
                    $ruleName = 'Local Award/Citation';
                }
            } elseif ($catCode === 'SEMINAR_TRAINING') {
                $points = $seminarPoints;
                $ruleName = 'Leadership Seminar/Training';
            }

            if ($points > 0.0) {
                $totalEarned += $points;
                $trace[] = [
                    'record_id'           => $ev['record_id'],
                    'title'               => $ev['title'] ?? '',
                    'component_name'      => $ruleName,
                    'rule_type'           => 'ACCUMULATE_WITH_CAP',
                    'base_points'         => $points,
                    'contribution_points' => $points,
                    'is_selected'         => true,
                ];
            }
        }

        $earned = min($totalEarned, $cap);

        return [
            'component_code' => 'COMP_AWARDS_CITATIONS_SEMINARS',
            'component_name' => 'Awards, Citations and Seminars',
            'rule_type'      => 'ACCUMULATE_WITH_CAP',
            'earned_points'  => round($earned, 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Rule: Highest Only Civic Involvement (Barangay 10, Municipal 8, Provincial 8, National 8).
     */
    protected function evaluateHighestOnlyCivic(array $evidenceList, float $cap): array
    {
        $highestPoints = 0.0;
        $trace = [];

        foreach ($evidenceList as $ev) {
            if (($ev['category_code'] ?? '') !== 'COMMUNITY_SERVICE_VOLUNTEERISM') {
                continue;
            }
            $meta = $ev['structured_metadata'] ?? [];
            $level = strtoupper(trim((string) ($meta['civic_level'] ?? $meta['scope'] ?? 'BARANGAY')));
            $points = ($level === 'BARANGAY') ? 10.0 : 8.0;

            if ($points > $highestPoints) {
                $highestPoints = $points;
            }

            $trace[] = [
                'record_id'           => $ev['record_id'],
                'title'               => $ev['title'] ?? '',
                'component_name'      => 'Civic Involvement',
                'rule_type'           => 'HIGHEST_APPLICABLE_ONLY',
                'base_points'         => $points,
                'contribution_points' => $points,
                'is_selected'         => true,
            ];
        }

        $earned = min($highestPoints, $cap);

        return [
            'component_code' => 'COMP_CIVIC_INVOLVEMENT',
            'component_name' => 'Civic Involvement',
            'rule_type'      => 'HIGHEST_APPLICABLE_ONLY',
            'earned_points'  => round($earned, 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Rule: Fixed Presence (School, Community, Church).
     */
    protected function evaluateFixedPresenceTriple(array $evidenceList, float $cap, float $schoolPts, float $commPts, float $churchPts): array
    {
        $hasSchool = false;
        $hasComm = false;
        $hasChurch = false;
        $trace = [];

        foreach ($evidenceList as $ev) {
            $subCode = strtoupper(trim((string) ($ev['subcategory_code'] ?? '')));
            $meta = $ev['structured_metadata'] ?? [];
            $type = strtoupper(trim((string) ($meta['involvement_type'] ?? $subCode)));

            if (str_contains($type, 'SCHOOL') || str_contains($subCode, 'UNIVERSITY')) {
                $hasSchool = true;
            } elseif (str_contains($type, 'COMMUNITY')) {
                $hasComm = true;
            } elseif (str_contains($type, 'CHURCH') || str_contains($type, 'PARISH') || str_contains($subCode, 'MINISTRY')) {
                $hasChurch = true;
            }

            $trace[] = [
                'record_id'           => $ev['record_id'],
                'title'               => $ev['title'] ?? '',
                'component_name'      => 'Fixed Presence Involvement',
                'rule_type'           => 'FIXED_PRESENCE',
                'base_points'         => 0.0,
                'contribution_points' => 0.0,
                'is_selected'         => true,
            ];
        }

        $earned = 0.0;
        if ($hasSchool) $earned += $schoolPts;
        if ($hasComm) $earned += $commPts;
        if ($hasChurch) $earned += $churchPts;

        return [
            'component_code' => 'COMP_FIXED_INVOLVEMENT',
            'component_name' => 'Community / Church Involvement',
            'rule_type'      => 'FIXED_PRESENCE',
            'earned_points'  => round(min($earned, $cap), 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Rule: Fixed Presence Initiated Activities.
     */
    protected function evaluateInitiatedActivitiesFixed(array $evidenceList, float $cap, float $schoolPts, float $commPts): array
    {
        $hasSchool = false;
        $hasComm = false;
        $trace = [];

        foreach ($evidenceList as $ev) {
            $meta = $ev['structured_metadata'] ?? [];
            $role = strtoupper(trim((string) ($meta['role'] ?? 'LEAD')));
            $scope = strtoupper(trim((string) ($meta['scope'] ?? 'SCHOOL')));

            if (str_contains($scope, 'SCHOOL')) {
                $hasSchool = true;
            } else {
                $hasComm = true;
            }

            $trace[] = [
                'record_id'           => $ev['record_id'],
                'title'               => $ev['title'] ?? '',
                'component_name'      => 'Initiated Activity',
                'rule_type'           => 'FIXED_PRESENCE',
                'base_points'         => 0.0,
                'contribution_points' => 0.0,
                'is_selected'         => true,
            ];
        }

        $earned = 0.0;
        if ($hasSchool) $earned += $schoolPts;
        if ($hasComm) $earned += $commPts;

        return [
            'component_code' => 'COMP_INITIATED_ACTIVITIES',
            'component_name' => 'Initiated Activities',
            'rule_type'      => 'FIXED_PRESENCE',
            'earned_points'  => round(min($earned, $cap), 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Rule: Church Ministry Schedule (1=2, 2=4, 3=6, 4=8, 5+=10).
     */
    protected function evaluateChurchMinistrySchedule(array $evidenceList, float $cap): array
    {
        $count = count($evidenceList);
        $points = min($count * 2.0, 10.0);
        $trace = [];

        foreach ($evidenceList as $ev) {
            $trace[] = [
                'record_id'           => $ev['record_id'],
                'title'               => $ev['title'] ?? '',
                'component_name'      => 'Church Ministry Involvement',
                'rule_type'           => 'COUNT_PER_RECORD_CAPPED',
                'base_points'         => 2.0,
                'contribution_points' => 2.0,
                'is_selected'         => true,
            ];
        }

        return [
            'component_code' => 'COMP_CHURCH_MINISTRY_SCHEDULE',
            'component_name' => 'Church Ministry Involvement',
            'rule_type'      => 'COUNT_PER_RECORD_CAPPED',
            'earned_points'  => round(min($points, $cap), 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Rule: Initiated Church Activities (Organizer 2, Facilitator 3, Activity Head 4, Initiator 5; cap 10).
     */
    protected function evaluateInitiatedChurchActivities(array $evidenceList, float $cap): array
    {
        $totalEarned = 0.0;
        $trace = [];

        foreach ($evidenceList as $ev) {
            $meta = $ev['structured_metadata'] ?? [];
            $role = strtoupper(trim((string) ($meta['role'] ?? 'ORGANIZER')));
            $points = 2.0;

            if (str_contains($role, 'INITIATOR') || str_contains($role, 'PRINCIPAL')) {
                $points = 5.0;
            } elseif (str_contains($role, 'HEAD') || str_contains($role, 'LEADER')) {
                $points = 4.0;
            } elseif (str_contains($role, 'FACILITATOR') || str_contains($role, 'COORDINATOR')) {
                $points = 3.0;
            }

            $totalEarned += $points;
            $trace[] = [
                'record_id'           => $ev['record_id'],
                'title'               => $ev['title'] ?? '',
                'component_name'      => 'Initiated Church Activity',
                'rule_type'           => 'ACCUMULATE_WITH_CAP',
                'base_points'         => $points,
                'contribution_points' => $points,
                'is_selected'         => true,
            ];
        }

        return [
            'component_code' => 'COMP_INITIATED_CHURCH_ACTIVITIES',
            'component_name' => 'Initiated Church Activities',
            'rule_type'      => 'ACCUMULATE_WITH_CAP',
            'earned_points'  => round(min($totalEarned, $cap), 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Rule: Per-Record Capped (e.g. Citations).
     */
    protected function evaluatePerRecordCapped(array $evidenceList, float $pointsPerRecord, float $cap, string $name): array
    {
        $count = count($evidenceList);
        $totalEarned = $count * $pointsPerRecord;
        $earned = min($totalEarned, $cap);
        $trace = [];

        foreach ($evidenceList as $ev) {
            $trace[] = [
                'record_id'           => $ev['record_id'],
                'title'               => $ev['title'] ?? '',
                'component_name'      => $name,
                'rule_type'           => 'COUNT_PER_RECORD_CAPPED',
                'base_points'         => $pointsPerRecord,
                'contribution_points' => $pointsPerRecord,
                'is_selected'         => true,
            ];
        }

        return [
            'component_code' => 'COMP_PER_RECORD_CAPPED',
            'component_name' => $name,
            'rule_type'      => 'COUNT_PER_RECORD_CAPPED',
            'earned_points'  => round($earned, 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Campus Journalism: Publication Types (News, Literary, Column, Editorial).
     */
    protected function evaluateJournalismPubType(array $evidenceList, string $targetCompId, float $pointsPerItem, float $cap, string $name): array
    {
        $filtered = array_filter($evidenceList, fn($ev) => ($ev['matched_component_id'] ?? '') === $targetCompId);
        $count = count($filtered);
        $total = $count * $pointsPerItem;
        $earned = min($total, $cap);
        $trace = [];

        foreach ($filtered as $ev) {
            $trace[] = [
                'record_id'           => $ev['record_id'],
                'title'               => $ev['title'] ?? '',
                'component_name'      => "Journalism: {$name}",
                'rule_type'           => 'COUNT_PER_RECORD_CAPPED',
                'base_points'         => $pointsPerItem,
                'contribution_points' => $pointsPerItem,
                'is_selected'         => true,
            ];
        }

        return [
            'component_code' => $targetCompId,
            'component_name' => $name,
            'rule_type'      => 'COUNT_PER_RECORD_CAPPED',
            'earned_points'  => round($earned, 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Campus Journalism: Leadership Roles (Officer 3, Contributor 2; cap 5).
     */
    protected function evaluateJournalismLeadershipRoles(array $evidenceList, float $cap): array
    {
        $filtered = array_filter($evidenceList, fn($ev) => ($ev['matched_component_id'] ?? '') === 'COMP_JOURN_LEAD_ROLE');
        $total = 0.0;
        $trace = [];

        foreach ($filtered as $ev) {
            $meta = $ev['structured_metadata'] ?? [];
            $role = strtoupper(trim((string) ($meta['role'] ?? 'OFFICER')));
            $pts = str_contains($role, 'OFFICER') || str_contains($role, 'EDITOR') ? 3.0 : 2.0;
            $total += $pts;

            $trace[] = [
                'record_id'           => $ev['record_id'],
                'title'               => $ev['title'] ?? '',
                'component_name'      => 'Journalism Leadership Role',
                'rule_type'           => 'ACCUMULATE_WITH_CAP',
                'base_points'         => $pts,
                'contribution_points' => $pts,
                'is_selected'         => true,
            ];
        }

        return [
            'component_code' => 'COMP_JOURN_LEAD_ROLE',
            'component_name' => 'Journalism Leadership Involvement',
            'rule_type'      => 'ACCUMULATE_WITH_CAP',
            'earned_points'  => round(min($total, $cap), 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Campus Journalism: Awards/Citations (National 3, Local 2; cap 5).
     */
    protected function evaluateJournalismAwards(array $evidenceList, float $cap): array
    {
        $filtered = array_filter($evidenceList, fn($ev) => ($ev['matched_component_id'] ?? '') === 'COMP_JOURN_LEAD_AWARDS');
        $total = 0.0;
        $trace = [];

        foreach ($filtered as $ev) {
            $meta = $ev['structured_metadata'] ?? [];
            $scope = strtoupper(trim((string) ($meta['scope'] ?? 'LOCAL')));
            $pts = ($scope === 'NATIONAL' || $scope === 'INTERNATIONAL') ? 3.0 : 2.0;
            $total += $pts;

            $trace[] = [
                'record_id'           => $ev['record_id'],
                'title'               => $ev['title'] ?? '',
                'component_name'      => 'Journalism Award/Citation',
                'rule_type'           => 'ACCUMULATE_WITH_CAP',
                'base_points'         => $pts,
                'contribution_points' => $pts,
                'is_selected'         => true,
            ];
        }

        return [
            'component_code' => 'COMP_JOURN_LEAD_AWARDS',
            'component_name' => 'Journalism Awards and Citations',
            'rule_type'      => 'ACCUMULATE_WITH_CAP',
            'earned_points'  => round(min($total, $cap), 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Sports: Skills Fixed Presence (Individual 10, Team 10; max 20).
     */
    protected function evaluateSportsSkillsFixed(array $evidenceList, float $cap): array
    {
        $hasInd = false;
        $hasTeam = false;
        $trace = [];

        foreach ($evidenceList as $ev) {
            $meta = $ev['structured_metadata'] ?? [];
            $compType = strtoupper(trim((string) ($meta['competition_type'] ?? 'INDIVIDUAL')));

            if (str_contains($compType, 'TEAM')) {
                $hasTeam = true;
            } else {
                $hasInd = true;
            }

            $trace[] = [
                'record_id'           => $ev['record_id'],
                'title'               => $ev['title'] ?? '',
                'component_name'      => 'Sports Skills Evidence',
                'rule_type'           => 'FIXED_PRESENCE',
                'base_points'         => 10.0,
                'contribution_points' => 10.0,
                'is_selected'         => true,
            ];
        }

        $earned = 0.0;
        if ($hasInd) $earned += 10.0;
        if ($hasTeam) $earned += 10.0;

        return [
            'component_code' => 'COMP_SPORTS_SKILLS',
            'component_name' => 'Sports Skills Evidence',
            'rule_type'      => 'FIXED_PRESENCE',
            'earned_points'  => round(min($earned, $cap), 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Sports: Participation (National 7, Regional 5, Local 2, NDEA 4, INTRAMS 2; cap 20).
     */
    protected function evaluateSportsParticipation(array $evidenceList, float $cap): array
    {
        $schedule = [
            'PRISAA NATIONAL' => 7.0,
            'PRISAA REGIONAL' => 5.0,
            'PRISAA LOCAL'    => 2.0,
            'NDEA'            => 4.0,
            'INTRAMS'         => 2.0,
        ];

        $total = 0.0;
        $trace = [];

        foreach ($evidenceList as $ev) {
            $meta = $ev['structured_metadata'] ?? [];
            $level = strtoupper(trim((string) ($meta['event_level'] ?? 'PRISAA LOCAL')));
            $pts = $schedule[$level] ?? 2.0;
            $total += $pts;

            $trace[] = [
                'record_id'           => $ev['record_id'],
                'title'               => $ev['title'] ?? '',
                'component_name'      => "Sports Participation: {$level}",
                'rule_type'           => 'ACCUMULATE_WITH_CAP',
                'base_points'         => $pts,
                'contribution_points' => $pts,
                'is_selected'         => true,
            ];
        }

        return [
            'component_code' => 'COMP_SPORTS_PARTICIPATION',
            'component_name' => 'Participation in Athletic Meets',
            'rule_type'      => 'ACCUMULATE_WITH_CAP',
            'earned_points'  => round(min($total, $cap), 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Sports: Awards Received Matrix Lookup (cap 15).
     */
    protected function evaluateSportsAwardsMatrix(array $evidenceList, float $cap): array
    {
        $total = 0.0;
        $trace = [];

        foreach ($evidenceList as $ev) {
            $meta = $ev['structured_metadata'] ?? [];
            $level = strtoupper(trim((string) ($meta['event_level'] ?? 'PRISAA LOCAL')));
            $result = strtoupper(trim((string) ($meta['placement'] ?? $meta['result'] ?? 'BRONZE')));

            $pts = self::SPORTS_AWARDS_MATRIX[$level][$result] ?? 1.0;
            $total += $pts;

            $trace[] = [
                'record_id'           => $ev['record_id'],
                'title'               => $ev['title'] ?? '',
                'component_name'      => "Sports Award: {$level} {$result}",
                'rule_type'           => 'LEVEL_RESULT_MATRIX',
                'base_points'         => $pts,
                'contribution_points' => $pts,
                'is_selected'         => true,
            ];
        }

        return [
            'component_code' => 'COMP_SPORTS_AWARDS_MATRIX',
            'component_name' => 'Sports Awards and Placements',
            'rule_type'      => 'LEVEL_RESULT_MATRIX',
            'earned_points'  => round(min($total, $cap), 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Socio-Cultural: Skills Fixed Presence (Individual 10, Group 10; max 20).
     */
    protected function evaluateSocioCulturalSkillsFixed(array $evidenceList, float $cap): array
    {
        $hasInd = false;
        $hasGroup = false;
        $trace = [];

        foreach ($evidenceList as $ev) {
            $meta = $ev['structured_metadata'] ?? [];
            $perfType = strtoupper(trim((string) ($meta['performance_type'] ?? 'INDIVIDUAL')));

            if (str_contains($perfType, 'GROUP') || str_contains($perfType, 'ENSEMBLE')) {
                $hasGroup = true;
            } else {
                $hasInd = true;
            }

            $trace[] = [
                'record_id'           => $ev['record_id'],
                'title'               => $ev['title'] ?? '',
                'component_name'      => 'Socio-Cultural Skills Evidence',
                'rule_type'           => 'FIXED_PRESENCE',
                'base_points'         => 10.0,
                'contribution_points' => 10.0,
                'is_selected'         => true,
            ];
        }

        $earned = 0.0;
        if ($hasInd) $earned += 10.0;
        if ($hasGroup) $earned += 10.0;

        return [
            'component_code' => 'COMP_SOCIO_SKILLS',
            'component_name' => 'Socio-Cultural Skills Evidence',
            'rule_type'      => 'FIXED_PRESENCE',
            'earned_points'  => round(min($earned, $cap), 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Socio-Cultural: Participation (National 7, Regional 5, Local 2, NDEA 4, University 2; cap 20).
     */
    protected function evaluateSocioCulturalParticipation(array $evidenceList, float $cap): array
    {
        $schedule = [
            'NATIONAL'         => 7.0,
            'REGIONAL'         => 5.0,
            'LOCAL'            => 2.0,
            'NDEA'             => 4.0,
            'UNIVERSITY-LEVEL' => 2.0,
        ];

        $total = 0.0;
        $trace = [];

        foreach ($evidenceList as $ev) {
            $meta = $ev['structured_metadata'] ?? [];
            $level = strtoupper(trim((string) ($meta['event_level'] ?? 'LOCAL')));
            $pts = $schedule[$level] ?? 2.0;
            $total += $pts;

            $trace[] = [
                'record_id'           => $ev['record_id'],
                'title'               => $ev['title'] ?? '',
                'component_name'      => "Cultural Participation: {$level}",
                'rule_type'           => 'ACCUMULATE_WITH_CAP',
                'base_points'         => $pts,
                'contribution_points' => $pts,
                'is_selected'         => true,
            ];
        }

        return [
            'component_code' => 'COMP_SOCIO_PARTICIPATION',
            'component_name' => 'Participation in Meets / Showcases',
            'rule_type'      => 'ACCUMULATE_WITH_CAP',
            'earned_points'  => round(min($total, $cap), 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Socio-Cultural: Awards Received Matrix Lookup (cap 15).
     */
    protected function evaluateSocioCulturalAwardsMatrix(array $evidenceList, float $cap): array
    {
        $total = 0.0;
        $trace = [];

        foreach ($evidenceList as $ev) {
            $meta = $ev['structured_metadata'] ?? [];
            $level = strtoupper(trim((string) ($meta['event_level'] ?? 'LOCAL')));
            $result = strtoupper(trim((string) ($meta['placement'] ?? $meta['result'] ?? 'BRONZE')));

            $pts = self::SOCIO_AWARDS_MATRIX[$level][$result] ?? 1.0;
            $total += $pts;

            $trace[] = [
                'record_id'           => $ev['record_id'],
                'title'               => $ev['title'] ?? '',
                'component_name'      => "Cultural Award: {$level} {$result}",
                'rule_type'           => 'LEVEL_RESULT_MATRIX',
                'base_points'         => $pts,
                'contribution_points' => $pts,
                'is_selected'         => true,
            ];
        }

        return [
            'component_code' => 'COMP_SOCIO_AWARDS_MATRIX',
            'component_name' => 'Cultural Awards and Recognitions',
            'rule_type'      => 'LEVEL_RESULT_MATRIX',
            'earned_points'  => round(min($total, $cap), 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Member Award: Involvement (Activity 2, Outreach 3, Co-curricular 3, Committee 4, Sustained 5; cap 20).
     */
    protected function evaluateMemberInvolvement(array $evidenceList, float $cap): array
    {
        $total = 0.0;
        $trace = [];

        foreach ($evidenceList as $ev) {
            $meta = $ev['structured_metadata'] ?? [];
            $type = strtoupper(trim((string) ($meta['participation_type'] ?? 'ACTIVITY')));

            $pts = 2.0;
            if (str_contains($type, 'SUSTAINED')) {
                $pts = 5.0;
            } elseif (str_contains($type, 'COMMITTEE')) {
                $pts = 4.0;
            } elseif (str_contains($type, 'OUTREACH') || str_contains($type, 'CO-CURRICULAR')) {
                $pts = 3.0;
            }

            $total += $pts;
            $trace[] = [
                'record_id'           => $ev['record_id'],
                'title'               => $ev['title'] ?? '',
                'component_name'      => 'Organization Involvement',
                'rule_type'           => 'ACCUMULATE_WITH_CAP',
                'base_points'         => $pts,
                'contribution_points' => $pts,
                'is_selected'         => true,
            ];
        }

        return [
            'component_code' => 'COMP_MEMBER_INVOLVEMENT',
            'component_name' => 'Membership Involvement & Participation',
            'rule_type'      => 'ACCUMULATE_WITH_CAP',
            'earned_points'  => round(min($total, $cap), 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Member Award: Contribution (Contributor 2, Committee 3, Facilitator 4, Major 5; cap 10).
     */
    protected function evaluateMemberContribution(array $evidenceList, float $cap): array
    {
        $total = 0.0;
        $trace = [];

        foreach ($evidenceList as $ev) {
            $meta = $ev['structured_metadata'] ?? [];
            $type = strtoupper(trim((string) ($meta['contribution_type'] ?? 'CONTRIBUTOR')));

            $pts = 2.0;
            if (str_contains($type, 'MAJOR')) {
                $pts = 5.0;
            } elseif (str_contains($type, 'FACILITATOR') || str_contains($type, 'ORGANIZER')) {
                $pts = 4.0;
            } elseif (str_contains($type, 'COMMITTEE')) {
                $pts = 3.0;
            }

            $total += $pts;
            $trace[] = [
                'record_id'           => $ev['record_id'],
                'title'               => $ev['title'] ?? '',
                'component_name'      => 'Important Contribution',
                'rule_type'           => 'ACCUMULATE_WITH_CAP',
                'base_points'         => $pts,
                'contribution_points' => $pts,
                'is_selected'         => true,
            ];
        }

        return [
            'component_code' => 'COMP_MEMBER_CONTRIBUTION',
            'component_name' => 'Important Contribution',
            'rule_type'      => 'ACCUMULATE_WITH_CAP',
            'earned_points'  => round(min($total, $cap), 2),
            'max_points'     => $cap,
            'evidence_trace' => $trace,
        ];
    }

    /**
     * Helper to get authoritative computable maximum for an award.
     */
    protected function getAwardComputableCap(string $awardCode, float $fallback): float
    {
        $caps = [
            'NOTRE_DAME_AWARD'             => 50.0,
            'SMC_AWARD'                    => 60.0,
            'LEADERSHIP_AWARD'             => 50.0,
            'CAMPUS_JOURNALISM_AWARD'      => 70.0,
            'SPORTS_AWARD_FEMALE'          => 55.0,
            'SPORTS_AWARD_MALE'            => 55.0,
            'SOCIO_CULTURAL_AWARD_FEMALE'  => 55.0,
            'SOCIO_CULTURAL_AWARD_MALE'    => 55.0,
            'STUDENT_LEADER_OF_THE_YEAR'   => 50.0,
            'MEMBER_OF_THE_YEAR'           => 40.0,
            'VOLUNTEER_OF_THE_YEAR'        => 50.0,
            'ATHLETE_OF_THE_YEAR_FEMALE'   => 55.0,
            'ATHLETE_OF_THE_YEAR_MALE'     => 55.0,
            'PERFORMER_OF_THE_YEAR_FEMALE' => 55.0,
            'PERFORMER_OF_THE_YEAR_MALE'   => 55.0,
        ];

        return $caps[$awardCode] ?? $fallback;
    }
}
