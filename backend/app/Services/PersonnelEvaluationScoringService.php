<?php

namespace App\Services;

use Config\Database;
use RuntimeException;

/**
 * PersonnelEvaluationScoringService
 *
 * Authoritative backend scoring engine for NDMU Personnel Evaluation Scales (Plan F — Phase F4).
 * Enforces server-side calculation, criterion validation, cap hierarchy, evaluator judgment preservation,
 * and complete mathematical explainability under canonical rule version NDMU-PERSONNEL-RATING-V2.
 */
class PersonnelEvaluationScoringService
{
    public const CANONICAL_RULE_VERSION = 'NDMU-PERSONNEL-RATING-V2';

    public const SCALE_ADMINISTRATORS = 'ADMINISTRATORS_RANKING_SCALE';
    public const SCALE_NON_TEACHING = 'NON_TEACHING_PERSONNEL_RANKING_SCALE';

    public const SCALE_CONFIGS = [
        self::SCALE_ADMINISTRATORS => [
            'total_max' => 160.0,
            'passing_score' => 120.0,
            'area_caps' => [
                'A' => 70.0,
                'B' => 50.0,
                'C' => 40.0,
            ],
            'sub_ceilings' => [
                'A.1_UNITS' => 10.0,
                'A.3_SEMINARS' => 20.0,
                'B.3_RESEARCH' => 40.0,
                'B.6_CREATIVE' => 20.0,
                'C.1_EXTRA_CURRICULAR' => 30.0,
                'C.2_COMMUNITY' => 30.0,
                'C.3_SERVICE_YEARS' => 10.0,
            ],
        ],
        self::SCALE_NON_TEACHING => [
            'total_max' => 150.0,
            'passing_score' => 75.0,
            'area_caps' => [
                'A' => 90.0, // Evaluation-only total weight
                'B' => 60.0, // Category allocation
            ],
            'sub_ceilings' => [
                'B.1_ACTIVITIES' => 30.0,
                'B.2_COMMUNITY' => 30.0,
                'B.3_YEARS' => 10.0,
                'B.4_INVITED' => 30.0,
                'B.5_AWARDS' => 30.0,
            ],
        ],
    ];

    protected EvaluationScaleResolver $resolver;

    public function __construct(?EvaluationScaleResolver $resolver = null)
    {
        $this->resolver = $resolver ?? new EvaluationScaleResolver();
    }

    /**
     * Validates that the requested rule version matches the canonical freeze.
     */
    public function validateRuleVersion(string $ruleVersion): void
    {
        if (trim($ruleVersion) !== self::CANONICAL_RULE_VERSION) {
            throw new RuntimeException("Invalid or unsupported rule version [{$ruleVersion}]. Authoritative version is [" . self::CANONICAL_RULE_VERSION . "].", 422);
        }
    }

    /**
     * Validates compatibility of area and criterion for the assigned scale.
     */
    public function validateScaleCriterionCompatibility(string $scaleCode, string $areaCode, string $categoryName): void
    {
        $area = strtoupper(trim($areaCode));
        $cat = strtolower(trim($categoryName));

        if ($scaleCode === self::SCALE_NON_TEACHING) {
            if ($area === 'A') {
                throw new RuntimeException("Portfolio Area [A: Performance and Personal Indicators] is an evaluation-only section and does not permit personnel accomplishment mutations.", 409);
            }
            if ($area === 'C') {
                throw new RuntimeException("Invalid Area [C] for Non-Teaching Personnel Ranking Scale.", 422);
            }
            if (str_contains($cat, 'publication') || str_contains($cat, 'instructional material') || str_contains($cat, 'creative work')) {
                throw new RuntimeException("Invalid criterion [{$categoryName}] for Non-Teaching Personnel Ranking Scale.", 422);
            }
        } elseif ($scaleCode === self::SCALE_ADMINISTRATORS) {
            if (!in_array($area, ['A', 'B', 'C'], true)) {
                throw new RuntimeException("Invalid Area [{$area}] for Administrators Ranking Scale.", 422);
            }
        } else {
            throw new RuntimeException("Unknown or unassigned evaluation scale code [{$scaleCode}].", 422);
        }
    }

    /**
     * Scores a single evaluation item deterministically, enforcing validation, caps, and explainability.
     * Client-supplied final points/scores are strictly ignored and recalculated.
     *
     * @param array $context [
     *   'scale_code' => string,
     *   'rule_version' => string,
     *   'area_code' => string,
     *   'category' => string,
     *   'sub_category' => string,
     *   'scope' => string,
     *   'entry' => array,
     *   'evidence_reference' => string|null
     * ]
     * @return array Authoritative scoring payload
     */
    public function scoreEvaluationItem(array $context): array
    {
        $scaleCode = $context['scale_code'] ?? self::SCALE_ADMINISTRATORS;
        $ruleVersion = $context['rule_version'] ?? self::CANONICAL_RULE_VERSION;
        $areaCode = strtoupper(trim($context['area_code'] ?? 'A'));
        $category = trim($context['category'] ?? '');
        $subcategory = trim($context['sub_category'] ?? '');
        $scope = trim($context['scope'] ?? '');
        $entry = $context['entry'] ?? [];
        $evidenceRef = $context['evidence_reference'] ?? ($entry['proof_file_name'] ?? $entry['proof'] ?? null);

        // 1. Validate Rule Version
        $this->validateRuleVersion($ruleVersion);

        // 2. Validate Scale & Criterion Compatibility
        $this->validateScaleCriterionCompatibility($scaleCode, $areaCode, $category);

        // 3. Validate Required Title
        $title = trim($entry['title'] ?? $entry['activity_title'] ?? $entry['event_title'] ?? $entry['award_title'] ?? $entry['publication_title'] ?? $entry['research_title'] ?? '');
        if ($title === '') {
            throw new RuntimeException("Accomplishment title/description is required for evaluation scoring.", 422);
        }

        // 4. Calculate Deterministic Rule
        $calculated = $this->calculateDeterministicRule($scaleCode, $areaCode, $category, $subcategory, $scope, $entry);

        // 5. Validate Evidence Requirement
        if (!empty($calculated['evidence_required']) && empty($evidenceRef)) {
            throw new RuntimeException("Verification evidence proof attachment is required for [{$category}].", 422);
        }

        // 6. Apply Criterion / Subcategory Cap
        $rawPoints = (float)$calculated['raw_points'];
        $criterionCap = isset($calculated['criterion_cap']) ? (float)$calculated['criterion_cap'] : null;
        $cappedPoints = $this->applyCriterionCap($rawPoints, $criterionCap);

        // 7. Determine Evaluator Judgment Status
        $isJudgmentRequired = !empty($calculated['evaluator_judgment_required']);
        $scoringStatus = $isJudgmentRequired ? 'awaiting_evaluator' : 'calculated';
        $acceptedPoints = $isJudgmentRequired ? null : $cappedPoints;

        // 8. Build Full Scoring Explanation
        $explanation = $this->buildScoringExplanation([
            'scale_code' => $scaleCode,
            'area_code' => $areaCode,
            'category' => $category,
            'sub_category' => $subcategory,
            'scope' => $scope,
            'raw_points' => $rawPoints,
            'criterion_cap' => $criterionCap,
            'capped_points' => $cappedPoints,
            'is_judgment' => $isJudgmentRequired,
            'trace' => $calculated,
        ]);

        return [
            'scale_code' => $scaleCode,
            'rule_version' => $ruleVersion,
            'area_code' => $areaCode,
            'category' => $category,
            'sub_category' => $subcategory,
            'scope' => $scope,
            'raw_points' => $rawPoints,
            'criterion_cap' => $criterionCap,
            'criterion_capped_points' => $cappedPoints,
            'scoring_status' => $scoringStatus,
            'evaluator_judgment_required' => $isJudgmentRequired,
            'accepted_points' => $acceptedPoints,
            'evidence_reference' => $evidenceRef,
            'explanation' => $explanation,
            'point_trace' => [
                'rule_applied' => $calculated['rule_applied'],
                'source_ref' => $calculated['source_ref'],
                'formula_key' => $calculated['formula_key'],
                'factors' => $calculated['factors'] ?? null,
                'capped' => ($criterionCap !== null && $rawPoints > $criterionCap),
            ],
            'calculated_at' => gmdate('Y-m-d\TH:i:s\Z'),
        ];
    }

    /**
     * Executes the exact deterministic rule logic according to frozen Phase F0/F2/F3 specs.
     */
    public function calculateDeterministicRule(string $scaleCode, string $areaCode, string $category, string $subcategory, string $scope, array $entry): array
    {
        $cat = strtolower($category);
        $sub = strtolower($subcategory);
        $sc  = strtolower($scope);

        // =========================================================================
        // NON-TEACHING SCALE RULES
        // =========================================================================
        if ($scaleCode === self::SCALE_NON_TEACHING) {
            // B.1 School Activities
            if (str_contains($cat, 'school activities') || str_contains($cat, 'b.1') || str_contains($cat, 'b1')) {
                if (str_contains($sub, 'moderator') || str_contains($sub, 'officer')) {
                    $pts = 30.0; $lbl = 'Moderator or Officer of Clubs (30 pts)';
                } elseif (str_contains($sub, 'trainer') || str_contains($sub, 'coach') || str_contains($sub, 'committee') || str_contains($sub, 'working')) {
                    $pts = 20.0; $lbl = 'Trainer/Coach or Working Committee (20 pts)';
                } else {
                    $pts = 10.0; $lbl = 'Rendered Service in School Activities (10 pts)';
                }
                return [
                    'raw_points' => $pts,
                    'criterion_cap' => 30.0,
                    'rule_applied' => $lbl,
                    'source_ref' => 'Table B.1 (School Activities)',
                    'formula_key' => 'NT_ACT_SCHEDULE',
                    'evidence_required' => true,
                ];
            }

            // B.2 Community Involvement
            if (str_contains($cat, 'community') || str_contains($cat, 'church') || str_contains($cat, 'b.2') || str_contains($cat, 'b2')) {
                if (str_contains($sub, 'church')) {
                    $pts = 25.0; $lbl = 'Active Involvement in Church Activities (25 pts)';
                } elseif (str_contains($sub, 'civic') || str_contains($sub, 'community')) {
                    $pts = 25.0; $lbl = 'Active Involvement in Community/Civic Activities (25 pts)';
                } else {
                    $pts = 5.0; $lbl = 'Support to Charity and Community Projects (5 pts)';
                }
                return [
                    'raw_points' => $pts,
                    'criterion_cap' => 30.0,
                    'rule_applied' => $lbl,
                    'source_ref' => 'Table B.2 (Community Involvement)',
                    'formula_key' => 'NT_COMM_SCHEDULE',
                    'evidence_required' => true,
                ];
            }

            // B.3 Years at NDMU
            if (str_contains($cat, 'years at ndmu') || str_contains($cat, 'service credit') || str_contains($cat, 'b.3') || str_contains($cat, 'b3')) {
                $years = max(0, (int)($entry['years_of_service'] ?? $entry['years'] ?? 0));
                $pts = (float)(floor($years / 2) * 1.0);
                return [
                    'raw_points' => $pts,
                    'criterion_cap' => 10.0,
                    'rule_applied' => "Number of Years at NDMU: {$years} completed years = {$pts} pts (Max 10)",
                    'source_ref' => 'Table B.3 (Years at NDMU)',
                    'formula_key' => 'NT_SRV_CREDIT_SERVER_DERIVED',
                    'server_derived' => true,
                    'evidence_required' => false,
                ];
            }

            // B.4 Invited as Judge, Lecturer, Resource Person
            if (str_contains($cat, 'invited') || str_contains($cat, 'judge') || str_contains($cat, 'lecturer') || str_contains($cat, 'resource person') || str_contains($cat, 'b.4') || str_contains($cat, 'b4')) {
                $count = max(1, (int)($entry['invitation_count'] ?? $entry['count'] ?? 1));
                $pts = (float)($count * 5.0);
                return [
                    'raw_points' => $pts,
                    'criterion_cap' => 30.0,
                    'rule_applied' => "Invited as Judge, Lecturer, Resource Person: {$count} invitation(s) × 5 pts = {$pts} pts (Max 30)",
                    'source_ref' => 'Table B.4 (Invitations)',
                    'formula_key' => 'NT_INVITED_PER_ITEM',
                    'evidence_required' => true,
                ];
            }

            // B.5 Recognition / Meritorious Award
            if (str_contains($cat, 'recognition') || str_contains($cat, 'meritorious award') || str_contains($cat, 'b.5') || str_contains($cat, 'b5')) {
                return [
                    'raw_points' => 30.0,
                    'criterion_cap' => 30.0,
                    'evaluator_judgment_required' => true,
                    'rule_applied' => 'Evaluator Judgment Required (Maximum 30.0 pts)',
                    'source_ref' => 'Table B.5 (Recognition / Meritorious Award)',
                    'formula_key' => 'NT_AWARD_JUDGMENT_MAX_30',
                    'evidence_required' => true,
                ];
            }
        }

        // =========================================================================
        // ADMINISTRATORS SCALE RULES
        // =========================================================================

        // Area A
        if ($areaCode === 'A') {
            // A.1 Degree/s
            if (str_contains($cat, 'degree') || str_contains($sub, 'ph.d.') || str_contains($sub, 'ma degree') || str_contains($cat, 'a.1')) {
                if (str_contains($sub, 'ph.d. degree holder') || str_contains($sub, 'doctor') || $sub === 'phd_degree') {
                    return [
                        'raw_points' => 40.0,
                        'criterion_cap' => null,
                        'rule_applied' => 'Ph.D. Degree Holder (40 pts)',
                        'source_ref' => 'Table A.1, Row 1',
                        'formula_key' => 'DEGREE_PHD',
                        'evidence_required' => true,
                    ];
                }
                if (str_contains($sub, 'ma degree holder') || str_contains($sub, 'master') || $sub === 'ma_degree') {
                    return [
                        'raw_points' => 20.0,
                        'criterion_cap' => null,
                        'rule_applied' => 'Master\'s Degree Holder (20 pts)',
                        'source_ref' => 'Table A.1, Row 3',
                        'formula_key' => 'DEGREE_MA',
                        'evidence_required' => true,
                    ];
                }
                if (str_contains($sub, 'ph.d. units') || str_contains($sub, 'doctoral units') || $sub === 'phd_units') {
                    $units = max(0, (int)($entry['units_completed'] ?? $entry['units_earned'] ?? $entry['units'] ?? 0));
                    $pts = (float)(floor($units / 3) * 2.0);
                    return [
                        'raw_points' => $pts,
                        'criterion_cap' => 10.0,
                        'rule_applied' => "Ph.D. Units: {$units} units = " . floor($units / 3) . " groups of 3 × 2 pts = {$pts} pts (Max 10)",
                        'source_ref' => 'Table A.1, Row 2',
                        'formula_key' => 'DEGREE_PHD_UNITS',
                        'evidence_required' => true,
                    ];
                }
                if (str_contains($sub, 'ma units') || str_contains($sub, 'master units') || $sub === 'ma_units') {
                    $units = max(0, (int)($entry['units_completed'] ?? $entry['units_earned'] ?? $entry['units'] ?? 0));
                    $pts = (float)(floor($units / 3) * 1.0);
                    return [
                        'raw_points' => $pts,
                        'criterion_cap' => 10.0,
                        'rule_applied' => "MA Units: {$units} units = " . floor($units / 3) . " groups of 3 × 1 pt = {$pts} pts (Max 10)",
                        'source_ref' => 'Table A.1, Row 4',
                        'formula_key' => 'DEGREE_MA_UNITS',
                        'evidence_required' => true,
                    ];
                }
            }

            // A.2 Professional Orgs
            if (str_contains($cat, 'membership') || str_contains($cat, 'prof org') || str_contains($cat, 'a.2')) {
                $isOfficer = str_contains($sub, 'officer') || str_contains($sub, 'board') || !empty($entry['officer_position']);
                if ($isOfficer) {
                    if (empty($entry['officer_position']) && empty($entry['role']) && !str_contains($sub, 'officer')) {
                        throw new RuntimeException("Officer position title is required for active professional organization officer points.", 422);
                    }
                    return [
                        'raw_points' => 10.0,
                        'criterion_cap' => null,
                        'rule_applied' => 'Officer / Board Position (10 pts per office held)',
                        'source_ref' => 'Table A.2, Row 2',
                        'formula_key' => 'MEMBERSHIP_OFFICER',
                        'evidence_required' => true,
                    ];
                }
                return [
                    'raw_points' => 5.0,
                    'criterion_cap' => null,
                    'rule_applied' => 'Regular Active Member (5 pts per membership)',
                    'source_ref' => 'Table A.2, Row 1',
                    'formula_key' => 'MEMBERSHIP_REGULAR',
                    'evidence_required' => true,
                ];
            }

            // A.3 Seminars / Trainings
            if (str_contains($cat, 'seminar') || str_contains($cat, 'training') || str_contains($cat, 'a.3')) {
                if (str_contains($sc, 'international') || str_contains($sub, 'international')) {
                    $pts = 10.0; $lbl = 'International Level (10 pts)';
                } elseif (str_contains($sc, 'national') || str_contains($sub, 'national')) {
                    $pts = 8.0; $lbl = 'National Level (8 pts)';
                } elseif (str_contains($sc, 'regional') || str_contains($sub, 'regional')) {
                    $pts = 6.0; $lbl = 'Regional Level (6 pts)';
                } elseif (str_contains($sc, 'provincial') || str_contains($sc, 'city') || str_contains($sub, 'provincial')) {
                    $pts = 4.0; $lbl = 'City / Provincial Level (4 pts)';
                } else {
                    $pts = 3.0; $lbl = 'In-House / Institutional Level (3 pts)';
                }
                return [
                    'raw_points' => $pts,
                    'criterion_cap' => 20.0,
                    'rule_applied' => $lbl,
                    'source_ref' => 'Table A.3',
                    'formula_key' => 'SEMINAR_SCHEDULE',
                    'evidence_required' => true,
                ];
            }
        }

        // Area B
        if ($areaCode === 'B') {
            // B.1 Speaker / Consultant (4-Factor Sum)
            if (str_contains($cat, 'guest lecturer') || str_contains($cat, 'consultant') || str_contains($cat, 'judge') || str_contains($cat, 'b.1')) {
                $org = strtolower(trim($entry['sponsoring_organization'] ?? $entry['org_type'] ?? 'ndmu'));
                $orgPts = (str_contains($org, 'external') || str_contains($org, 'other')) ? 2.0 : 1.0;

                $extent = strtolower(trim($entry['extent_of_talk'] ?? $entry['extent'] ?? '1_hour'));
                if (str_contains($extent, 'more') || str_contains($extent, 'series')) $extPts = 5.0;
                elseif (str_contains($extent, '2_day') || str_contains($extent, '2 day')) $extPts = 4.0;
                elseif (str_contains($extent, '1_day') || str_contains($extent, 'full day') || str_contains($extent, '1 day')) $extPts = 3.0;
                elseif (str_contains($extent, 'half')) $extPts = 2.0;
                else $extPts = 1.0;

                $reach = strtolower(trim($entry['participant_reach'] ?? $entry['reach'] ?? $scope));
                if (str_contains($reach, 'international')) $reachPts = 4.0;
                elseif (str_contains($reach, 'national')) $reachPts = 3.0;
                elseif (str_contains($reach, 'regional')) $reachPts = 2.0;
                else $reachPts = 1.0;

                $role = strtolower(trim($entry['role'] ?? $entry['activity_role'] ?? $subcategory));
                if (str_contains($role, 'judge')) $rolePts = 3.0;
                else $rolePts = 5.0; // Reactor, Resource Person, Facilitator, Consultant, Speaker, Organizer

                $total = $orgPts + $extPts + $reachPts + $rolePts;
                return [
                    'raw_points' => $total,
                    'criterion_cap' => null,
                    'factors' => [
                        'sponsoring_org_pts' => $orgPts,
                        'extent_pts' => $extPts,
                        'reach_pts' => $reachPts,
                        'role_pts' => $rolePts,
                    ],
                    'rule_applied' => "4-Factor Additive Sum: Org({$orgPts}) + Extent({$extPts}) + Reach({$reachPts}) + Role({$rolePts}) = {$total} pts",
                    'source_ref' => 'Table B.1 (4-Factor Formula)',
                    'formula_key' => 'LECTURER_4FACTOR_SUM',
                    'evidence_required' => true,
                ];
            }

            // B.2 Publication (2-Factor Sum: Scope + Publication Type)
            if (str_contains($cat, 'publication') || str_contains($cat, 'b.2')) {
                $locScope = strtolower(trim($entry['location_scope'] ?? $entry['publication_scope'] ?? $scope));
                if (str_contains($locScope, 'international')) $scopePts = 8.0;
                elseif (str_contains($locScope, 'national')) $scopePts = 6.0;
                elseif (str_contains($locScope, 'regional')) $scopePts = 4.0;
                else $scopePts = 3.0;

                $pType = strtolower(trim($entry['publication_type'] ?? $subcategory));
                if (str_contains($pType, 'book') || str_contains($pType, 'research_output') || str_contains($pType, 'research output')) $typePts = 10.0;
                elseif (str_contains($pType, 'scholarly') || str_contains($pType, 'monograph')) $typePts = 8.0;
                elseif (str_contains($pType, 'article') || str_contains($pType, 'compilation')) $typePts = 5.0;
                elseif (str_contains($pType, 'reviews') || str_contains($pType, 'review')) $typePts = 4.0;
                elseif (str_contains($pType, 'commentary')) $typePts = 2.0;
                else $typePts = 5.0;

                $total = $scopePts + $typePts;
                return [
                    'raw_points' => $total,
                    'criterion_cap' => null,
                    'factors' => [
                        'scope_pts' => $scopePts,
                        'type_pts' => $typePts,
                    ],
                    'rule_applied' => "Publication Sum: Scope({$scopePts}) + Type({$typePts}) = {$total} pts",
                    'source_ref' => 'Table B.2 (Scope + Type Formula)',
                    'formula_key' => 'PUB_SCOPE_TYPE_SUM',
                    'evidence_required' => true,
                ];
            }

            // B.3 Conduct of Research
            if (str_contains($cat, 'research') || str_contains($cat, 'b.3')) {
                return [
                    'raw_points' => 40.0,
                    'criterion_cap' => 40.0,
                    'evaluator_judgment_required' => true,
                    'rule_applied' => 'Evaluator Judgment Required (Maximum 40.0 pts)',
                    'source_ref' => 'Table B.3 (Evaluator Judgment)',
                    'formula_key' => 'RES_JUDGMENT_MAX_40',
                    'evidence_required' => true,
                ];
            }

            // B.4 Recognition & Awards (Matrix Lookup)
            if (str_contains($cat, 'award') || str_contains($cat, 'recognition') || str_contains($cat, 'b.4')) {
                $status = strtolower(trim($entry['recognition_status'] ?? (str_contains($subcategory, 'nominee') ? 'nominee' : 'awardee')));
                $scKey = strtolower(trim($entry['scope'] ?? $entry['award_scope'] ?? $scope));
                $isNominee = str_contains($status, 'nominee');

                if ($isNominee) {
                    if (str_contains($scKey, 'international') || str_contains($scKey, 'national')) $pts = 20.0;
                    elseif (str_contains($scKey, 'regional') || str_contains($scKey, 'provincial')) $pts = 15.0;
                    else $pts = 5.0;
                } else { // Awardee
                    if (str_contains($scKey, 'international') || str_contains($scKey, 'national')) $pts = 40.0;
                    elseif (str_contains($scKey, 'regional') || str_contains($scKey, 'provincial')) $pts = 30.0;
                    else $pts = 10.0;
                }

                $statusLabel = $isNominee ? 'Nominee' : 'Awardee';
                return [
                    'raw_points' => $pts,
                    'criterion_cap' => 40.0,
                    'rule_applied' => "{$statusLabel} ({$scKey}) = {$pts} pts",
                    'source_ref' => 'Table B.4 (Awards Matrix)',
                    'formula_key' => 'AWARD_MATRIX',
                    'evidence_required' => true,
                ];
            }

            // B.5 Instructional Materials
            if (str_contains($cat, 'instructional material') || str_contains($cat, 'materials') || str_contains($cat, 'b.5')) {
                $mType = strtolower(trim($entry['material_type'] ?? $subcategory));
                if (str_contains($mType, 'workbook') || str_contains($mType, 'others') || str_contains($mType, 'lecture')) {
                    $pts = 20.0; $lbl = 'Others (Bound Workbook, Exercises, Lectures) (20 pts)';
                } else {
                    $pts = 10.0; $lbl = 'Audio-Visual Aids / Modules / Reviewers (Bound) (10 pts)';
                }
                return [
                    'raw_points' => $pts,
                    'criterion_cap' => 20.0,
                    'rule_applied' => $lbl,
                    'source_ref' => 'Table B.5',
                    'formula_key' => 'MAT_SCHEDULE',
                    'evidence_required' => true,
                ];
            }

            // B.6 Creative Work
            if (str_contains($cat, 'creative work') || str_contains($cat, 'b.6')) {
                return [
                    'raw_points' => 20.0,
                    'criterion_cap' => 20.0,
                    'evaluator_judgment_required' => true,
                    'rule_applied' => 'Evaluator Judgment Required (Maximum 20.0 pts)',
                    'source_ref' => 'Table B.6 (Evaluator Judgment)',
                    'formula_key' => 'CREATIVE_JUDGMENT_MAX_20',
                    'evidence_required' => true,
                ];
            }
        }

        // Area C
        if ($areaCode === 'C') {
            // C.1 Extra-Curricular
            if (str_contains($cat, 'extra-curricular') || str_contains($cat, 'activity') || str_contains($cat, 'c.1')) {
                if (str_contains($sub, 'rendered') || str_contains($sub, 'intramural')) {
                    $pts = 10.0; $lbl = 'Rendered Service during intramurals, etc. (10 pts)';
                } else {
                    $pts = 20.0; $lbl = 'Moderator / Coach / Working Committee (20 pts)';
                }
                return [
                    'raw_points' => $pts,
                    'criterion_cap' => 30.0,
                    'rule_applied' => $lbl,
                    'source_ref' => 'Table C.1',
                    'formula_key' => 'ACT_SCHEDULE',
                    'evidence_required' => true,
                ];
            }

            // C.2 Community Involvement
            if (str_contains($cat, 'community') || str_contains($cat, 'church') || str_contains($cat, 'c.2')) {
                if (str_contains($sub, 'charity') || str_contains($sub, 'project')) {
                    $pts = 5.0; $lbl = 'Support to charity and community projects (5 pts)';
                } else {
                    $pts = 25.0; $lbl = 'Active involvement in church / civic activities (25 pts)';
                }
                return [
                    'raw_points' => $pts,
                    'criterion_cap' => 30.0,
                    'rule_applied' => $lbl,
                    'source_ref' => 'Table C.2',
                    'formula_key' => 'COMM_SCHEDULE',
                    'evidence_required' => true,
                ];
            }

            // C.3 Years of Service
            if (str_contains($cat, 'service credit') || str_contains($cat, 'years of service') || str_contains($cat, 'c.3')) {
                $years = max(0, (int)($entry['years_of_service'] ?? $entry['years'] ?? 0));
                $pts = (float)(floor($years / 2) * 1.0);
                return [
                    'raw_points' => $pts,
                    'criterion_cap' => 10.0,
                    'rule_applied' => "Years of Service at NDMU: {$years} completed years = {$pts} pts (Max 10)",
                    'source_ref' => 'Table C.3',
                    'formula_key' => 'SRV_CREDIT_SERVER_DERIVED',
                    'server_derived' => true,
                    'evidence_required' => false,
                ];
            }
        }

        // Generic fallback
        $pts = (float)($entry['points'] ?? 5.0);
        return [
            'raw_points' => $pts,
            'criterion_cap' => null,
            'rule_applied' => 'Configured Standard Points',
            'source_ref' => 'Official Ranking Scale Manual',
            'formula_key' => 'STANDARD_POINT',
            'evidence_required' => true,
        ];
    }

    /**
     * Applies criterion/subcategory maximum ceiling.
     */
    public function applyCriterionCap(float $rawPoints, ?float $cap): float
    {
        if ($cap !== null && $rawPoints > $cap) {
            return (float)$cap;
        }
        return $rawPoints;
    }

    /**
     * Aggregates items in an Area, applies Area maximum ceiling, and calculates area contributions.
     *
     * @param array $scoredItems List of scored item payloads
     * @param float $areaCap Area maximum points
     * @return array
     */
    public function applyAreaCap(array $scoredItems, float $areaCap): array
    {
        $rawAreaSum = 0.0;
        $unresolvedCount = 0;

        foreach ($scoredItems as $item) {
            if (!empty($item['evaluator_judgment_required']) && ($item['accepted_points'] === null)) {
                $unresolvedCount++;
            } else {
                $rawAreaSum += (float)($item['accepted_points'] ?? $item['criterion_capped_points'] ?? 0.0);
            }
        }

        $cappedAreaTotal = min($areaCap, $rawAreaSum);
        $overflow = max(0.0, $rawAreaSum - $cappedAreaTotal);

        return [
            'raw_area_sum' => $rawAreaSum,
            'capped_area_total' => $cappedAreaTotal,
            'area_cap' => $areaCap,
            'overflow' => $overflow,
            'is_area_capped' => ($rawAreaSum > $areaCap),
            'unresolved_judgment_items_count' => $unresolvedCount,
            'items_count' => count($scoredItems),
        ];
    }

    /**
     * Computes the complete evaluation totals across all areas with strict cap enforcement.
     *
     * @param string $scaleCode
     * @param array $itemsByArea ['A' => [...], 'B' => [...], 'C' => [...]]
     * @return array
     */
    public function calculateEvaluationTotals(string $scaleCode, array $itemsByArea): array
    {
        $scaleConfig = self::SCALE_CONFIGS[$scaleCode] ?? self::SCALE_CONFIGS[self::SCALE_ADMINISTRATORS];
        $areaCaps = $scaleConfig['area_caps'];
        $scaleMax = $scaleConfig['total_max'];
        $passingScore = $scaleConfig['passing_score'];

        $areaResults = [];
        $totalCappedPoints = 0.0;
        $totalRawPoints = 0.0;
        $totalUnresolvedCount = 0;

        foreach ($areaCaps as $areaKey => $cap) {
            $areaItems = $itemsByArea[$areaKey] ?? [];
            $areaRes = $this->applyAreaCap($areaItems, $cap);
            $areaResults[$areaKey] = $areaRes;

            $totalRawPoints += $areaRes['raw_area_sum'];
            $totalCappedPoints += $areaRes['capped_area_total'];
            $totalUnresolvedCount += $areaRes['unresolved_judgment_items_count'];
        }

        $finalGrandTotal = min($scaleMax, $totalCappedPoints);
        $isPassing = ($finalGrandTotal >= $passingScore);
        $evaluationStatus = ($totalUnresolvedCount > 0) ? 'provisional_pending_evaluator' : 'completed_scored';

        return [
            'scale_code' => $scaleCode,
            'rule_version' => self::CANONICAL_RULE_VERSION,
            'total_max_points' => $scaleMax,
            'passing_score' => $passingScore,
            'raw_total_points' => $totalRawPoints,
            'capped_total_points' => $finalGrandTotal,
            'is_passing' => $isPassing,
            'evaluation_status' => $evaluationStatus,
            'has_unresolved_judgment_items' => ($totalUnresolvedCount > 0),
            'unresolved_judgment_items_count' => $totalUnresolvedCount,
            'areas' => $areaResults,
            'calculated_at' => gmdate('Y-m-d\TH:i:s\Z'),
        ];
    }

    /**
     * Validates that an authorized evaluator accepted value does not exceed the criterion maximum.
     */
    public function validateEvaluatorAcceptedValue(string $scaleCode, string $criterionCode, ?float $acceptedValue): void
    {
        if ($acceptedValue === null) {
            return; // Unresolved state is valid
        }

        if ($acceptedValue < 0.0) {
            throw new RuntimeException("Evaluator accepted score cannot be negative.", 422);
        }

        $max = 40.0;
        if ($criterionCode === 'B.6' || str_contains(strtolower($criterionCode), 'creative')) {
            $max = 20.0;
        } elseif ($criterionCode === 'B.5' || str_contains(strtolower($criterionCode), 'award') || str_contains(strtolower($criterionCode), 'meritorious')) {
            $max = 30.0;
        }

        if ($acceptedValue > $max) {
            throw new RuntimeException("Evaluator accepted score [{$acceptedValue}] exceeds maximum configured ceiling [{$max}] for criterion [{$criterionCode}].", 422);
        }
    }

    /**
     * Generates a concise, mathematically clear scoring explanation from verified factors.
     */
    public function buildScoringExplanation(array $params): string
    {
        $trace = $params['trace'] ?? [];
        $raw = $params['raw_points'] ?? 0.0;
        $cap = $params['criterion_cap'] ?? null;
        $capped = $params['capped_points'] ?? $raw;
        $isJudgment = !empty($params['is_judgment']);

        if ($isJudgment) {
            return "Evaluator judgment required (Maximum accepted score: {$cap} pts). Points pending official evaluator deliberation.";
        }

        if ($cap !== null && $raw > $cap) {
            return "{$trace['rule_applied']}. Raw score of {$raw} pts capped at criterion maximum of {$cap} pts.";
        }

        return "{$trace['rule_applied']} (Earned: {$capped} pts).";
    }
}
