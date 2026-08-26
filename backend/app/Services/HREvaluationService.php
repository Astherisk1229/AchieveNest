<?php

namespace App\Services;

/**
 * HREvaluationService
 *
 * Authoritative backend scoring engine.
 *
 * =============================================================================
 * SCORING RULE TRACEABILITY MATRIX
 * Source: NDMU Rating Sheet / Administrators Ranking Scale (confirmed 2026-08-26)
 * =============================================================================
 *
 * Criterion          | Code | Source Confidence           | Scoring Mode
 * -------------------|------|-----------------------------|-------------------
 * Educational Degrees| A.1  | CONFIRMED (NDMU Rating Sheet)| QUANTITY_DERIVED
 * Memberships        | A.2  | CONFIRMED (NDMU Rating Sheet)| SINGLE_CATEGORY
 * Seminars/Trainings | A.3  | CONFIRMED (NDMU Rating Sheet)| SINGLE_CATEGORY
 * Guest Lecturer     | B.1  | STRUCTURALLY_IMPLIED         | MULTI_FACTOR
 * Publications       | B.2  | STRUCTURALLY_IMPLIED         | MATRIX_LOOKUP
 * Conduct of Research| B.3  | UNDEFINED                    | MANUAL_BOUNDED *
 * Awards/Recognition | B.4  | CONFIRMED (NDMU Rating Sheet)| MATRIX_LOOKUP
 * Instructional Mat. | B.5  | CONFIRMED (NDMU Rating Sheet)| SINGLE_CATEGORY
 * Creative Work      | B.6  | UNDEFINED                    | MANUAL_BOUNDED *
 * Extracurricular    | C.1  | UNDEFINED                    | MANUAL_BOUNDED *
 * Community Service  | C.2  | UNDEFINED                    | MANUAL_BOUNDED *
 * Years of Service   | C.3  | CONFIRMED (NDMU Rating Sheet)| AUTOMATIC_DERIVED
 *
 * * UNDEFINED rules are MANUAL_BOUNDED only:
 *   - No automatic promotion or rank recommendation is generated.
 *   - Points require evaluator justification (min 10 chars).
 *   - They are bounded by maxPoints but not formula-calculated.
 *
 * IMPORTANT: Do not add CONFIRMED status to any rule without
 * tracing it to an approved NDMU source document.
 *
 * rank_recommendation is permanently null — deferred per confirmed HR decision.
 * =============================================================================
 */
class HREvaluationService
{
    public const AREA_A_MAX = 70.0;
    public const AREA_B_MAX = 50.0;
    public const AREA_C_MAX = 40.0;
    public const GRAND_TOTAL_MAX = 160.0;

    /**
     * Rating rules dictionary V2 with source-of-truth classifications
     */
    public static function getRatingRules(): array
    {
        return [
            'areaA' => [
                'title'     => 'Area A: Professional Development',
                'maxPoints' => self::AREA_A_MAX,
                'criteria'  => [
                    'degrees' => [
                        'code'             => 'A.1',
                        'title'            => 'Educational Degrees',
                        'maxPoints'        => 40.0,
                        'scoringMode'      => 'QUANTITY_DERIVED',
                        'sourceConfidence' => 'EXPLICIT',
                    ],
                    'memberships' => [
                        'code'             => 'A.2',
                        'title'            => 'Active Membership to Professional Organizations',
                        'maxPoints'        => 10.0,
                        'scoringMode'      => 'SINGLE_CATEGORY',
                        'sourceConfidence' => 'EXPLICIT',
                    ],
                    'seminars' => [
                        'code'             => 'A.3',
                        'title'            => 'Seminars / Trainings',
                        'maxPoints'        => 20.0,
                        'scoringMode'      => 'SINGLE_CATEGORY',
                        'sourceConfidence' => 'EXPLICIT',
                    ],
                ],
            ],
            'areaB' => [
                'title'      => 'Area B: Productivity and Creative Work',
                'sectionCap' => self::AREA_B_MAX,
                'criteria'   => [
                    'lectures' => [
                        'code'             => 'B.1',
                        'title'            => 'Guest Lecturer / Consultant / Judge / Resource Person',
                        'maxPoints'        => 40.0,
                        'scoringMode'      => 'MULTI_FACTOR',
                        'sourceConfidence' => 'STRUCTURALLY_IMPLIED',
                    ],
                    'publications' => [
                        'code'             => 'B.2',
                        'title'            => 'Publication of Scholarly Paper / Article / Research Output / Book',
                        'maxPoints'        => 40.0,
                        'scoringMode'      => 'MATRIX_LOOKUP',
                        'sourceConfidence' => 'STRUCTURALLY_IMPLIED',
                    ],
                    'research' => [
                        'code'             => 'B.3',
                        'title'            => 'Conduct of Research',
                        'maxPoints'        => 40.0,
                        'scoringMode'      => 'MANUAL_BOUNDED',
                        'sourceConfidence' => 'UNDEFINED',
                    ],
                    'awards' => [
                        'code'             => 'B.4',
                        'title'            => 'Professional Recognition or Awards',
                        'maxPoints'        => 40.0,
                        'scoringMode'      => 'MATRIX_LOOKUP',
                        'sourceConfidence' => 'EXPLICIT',
                    ],
                    'instructional' => [
                        'code'             => 'B.5',
                        'title'            => 'Production of Instructional Materials',
                        'maxPoints'        => 40.0,
                        'scoringMode'      => 'SINGLE_CATEGORY',
                        'sourceConfidence' => 'EXPLICIT',
                    ],
                    'creative' => [
                        'code'             => 'B.6',
                        'title'            => 'Creative Work',
                        'maxPoints'        => 20.0,
                        'scoringMode'      => 'MANUAL_BOUNDED',
                        'sourceConfidence' => 'UNDEFINED',
                    ],
                ],
            ],
            'areaC' => [
                'title'     => 'Area C: Service and Leadership',
                'maxPoints' => self::AREA_C_MAX,
                'criteria'  => [
                    'c1_extracurricular' => [
                        'code'             => 'C.1',
                        'title'            => 'Involvement in Extra-Curricular Activities',
                        'maxPoints'        => 30.0,
                        'scoringMode'      => 'MANUAL_BOUNDED',
                        'sourceConfidence' => 'UNDEFINED',
                    ],
                    'c2_community' => [
                        'code'             => 'C.2',
                        'title'            => 'Community Involvement',
                        'maxPoints'        => 30.0,
                        'scoringMode'      => 'MANUAL_BOUNDED',
                        'sourceConfidence' => 'UNDEFINED',
                    ],
                    'c3_tenure' => [
                        'code'             => 'C.3',
                        'title'            => 'Years of Service at NDMU',
                        'maxPoints'        => 10.0,
                        'scoringMode'      => 'AUTOMATIC_DERIVED',
                        'sourceConfidence' => 'EXPLICIT',
                    ],
                ],
            ],
        ];
    }

    /**
     * Authoritative V2 Item Score Evaluator adhering to explicit NDMU Rating Sheet values
     */
    public static function evaluateItemScore(string $criterionCode, string $scoringMode, array $payload): float
    {
        switch ($criterionCode) {
            case 'A.1':
                $type = $payload['type'] ?? 'degree';
                if ($type === 'degree' || $payload['qualificationType'] === 'phd' || $payload['qualificationType'] === 'masters') {
                    $degree = $payload['degree'] ?? $payload['qualificationType'] ?? '';
                    if ($degree === 'phd') return 40.0;
                    if ($degree === 'masters') return 20.0;
                    return 0.0;
                }
                
                // Units earned formulas from V2 rating sheet:
                // Ph.D. Units: 2 points per 3 completed units (Max 10) -> floor(units / 3) * 2
                // MA Units: 1 point per 3 completed units (Max 10) -> floor(units / 3) * 1
                $units = (int) ($payload['units'] ?? $payload['verifiedUnits'] ?? 0);
                $prog = $payload['programLevel'] ?? $payload['qualificationType'] ?? 'phd';
                if ($prog === 'phd' || $prog === 'phd_units') {
                    return (float) min(10.0, max(0.0, floor($units / 3) * 2));
                }
                return (float) min(10.0, max(0.0, floor($units / 3)));

            case 'A.2':
                // Member = 5 pts, Officer = 10 pts
                $role = $payload['role'] ?? 'member';
                return $role === 'officer' ? 10.0 : 5.0;

            case 'A.3':
                // In-house = 3, City/Provincial = 4, Regional = 6, National = 8, International = 10
                $level = $payload['level'] ?? 'in_house';
                return match ($level) {
                    'international'    => 10.0,
                    'national'         => 8.0,
                    'regional'         => 6.0,
                    'city_provincial'  => 4.0,
                    default            => 3.0, // in-house
                };

            case 'B.1':
                // Sponsoring Org: NDMU = 1, External = 2
                $orgPts = match ($payload['sponsoringOrg'] ?? '') {
                    'external' => 2.0,
                    default    => 1.0, // NDMU
                };
                // Extent: 1 hr = 1, Half day = 2, 1 day = 3, 2 days = 4, >2 days = 5
                $extentPts = match ($payload['extentOfTalk'] ?? '') {
                    'more_than_2_days' => 5.0,
                    '2_days'           => 4.0,
                    '1_day'            => 3.0,
                    'half_day'         => 2.0,
                    default            => 1.0, // 1 hour
                };
                // Participants: Local = 1, Regional = 2, National = 3, International = 4
                $scopePts = match ($payload['participantsScope'] ?? '') {
                    'international' => 4.0,
                    'national'      => 3.0,
                    'regional'      => 2.0,
                    default         => 1.0, // local
                };
                // Role: Judge = 3, Reactor/Keynote/Facilitator/Consultant/Speaker/Organizer = 5
                $rolePts = match ($payload['role'] ?? '') {
                    'judge' => 3.0,
                    default => 5.0,
                };
                return min(40.0, $orgPts + $extentPts + $scopePts + $rolePts);

            case 'B.2':
                // Scope: Local = 3, Regional = 4, National = 6, International = 8
                $scopePts = match ($payload['publicationScope'] ?? $payload['scope'] ?? 'local') {
                    'international' => 8.0,
                    'national'      => 6.0,
                    'regional'      => 4.0,
                    default         => 3.0, // local
                };
                // Type: Commentary 2, Reviews 4, Compilation 5, Article 5, Scholarly Paper 8, Monograph 8, Research Output 10, Book 10
                $typePts = match ($payload['publicationType'] ?? 'article') {
                    'book', 'research_output' => 10.0,
                    'scholarly_paper', 'monograph' => 8.0,
                    'compilation', 'article' => 5.0,
                    'reviews' => 4.0,
                    'commentary' => 2.0,
                    default => 5.0,
                };
                return min(40.0, $scopePts + $typePts);

            case 'B.4':
                // Nominee: Local 5, Prov/Reg 15, National 20, International 20
                // Awardee: Local 10, Prov/Reg 30, National 40, International 40
                $status = $payload['recognitionStatus'] ?? 'nominee';
                $scope = $payload['awardScope'] ?? $payload['scope'] ?? 'local';
                if ($status === 'awardee') {
                    return match ($scope) {
                        'international', 'national' => 40.0,
                        'provincial_regional', 'regional' => 30.0,
                        default => 10.0,
                    };
                }
                return match ($scope) {
                    'international', 'national' => 20.0,
                    'provincial_regional', 'regional' => 15.0,
                    default => 5.0,
                };

            case 'B.5':
                // Audio-Visual Aids = 10, Modules = 10, Reviewers (Bound) = 10, Bound Workbook/Notes = 20
                $matType = $payload['materialType'] ?? 'modules';
                return match ($matType) {
                    'workbook_notes', 'textbook' => 20.0,
                    'audio_visual', 'modules', 'reviewers' => 10.0,
                    default => 10.0,
                };

            case 'B.3':
                // Bounded Manual 0 - 40
                $manualPts = (float) ($payload['manualPoints'] ?? $payload['points'] ?? 0.0);
                return min(40.0, max(0.0, $manualPts));

            case 'B.6':
                // Bounded Manual 0 - 20
                $manualPts = (float) ($payload['manualPoints'] ?? $payload['points'] ?? 0.0);
                return min(20.0, max(0.0, $manualPts));

            case 'C.1':
            case 'C.1.1':
            case 'C.1.2':
            case 'C.1.3':
            case 'C.1.4':
                // Subcriteria max 20 each, bounded manual
                $manualPts = (float) ($payload['manualPoints'] ?? $payload['points'] ?? 0.0);
                return min(20.0, max(0.0, $manualPts));

            case 'C.2':
            case 'C.2.1':
            case 'C.2.2':
                // C.2.1, C.2.2 max 25 each
                $manualPts = (float) ($payload['manualPoints'] ?? $payload['points'] ?? 0.0);
                return min(25.0, max(0.0, $manualPts));

            case 'C.2.3':
                // C.2.3 max 5
                $manualPts = (float) ($payload['manualPoints'] ?? $payload['points'] ?? 0.0);
                return min(5.0, max(0.0, $manualPts));

            default:
                return (float) max(0.0, (float) ($payload['manualPoints'] ?? $payload['points'] ?? 0.0));
        }
    }

    /**
     * Recalculates total scores for an evaluation based on verified/rated items & service years.
     * Enforces individual subcriterion caps, area caps, and grand total cap of 160.
     */
    public static function recalculateTotals(array $items, int $tenureYears = 0): array
    {
        $areaA = ['degrees' => 0.0, 'memberships' => 0.0, 'seminars' => 0.0, 'total' => 0.0];
        $areaBRaw = [
            'lectures'      => 0.0,
            'publications'  => 0.0,
            'research'      => 0.0,
            'awards'        => 0.0,
            'instructional' => 0.0,
            'creative'      => 0.0,
            'total'         => 0.0,
        ];
        $areaCRaw = [
            'c1_raw'    => 0.0,
            'c2_raw'    => 0.0,
            'c1_awarded'=> 0.0,
            'c2_awarded'=> 0.0,
            'tenure'    => min(10.0, (float) floor(max(0, $tenureYears) / 2)),
            'total'     => 0.0,
        ];

        foreach ($items as $item) {
            if (($item['verification_status'] ?? '') !== 'verified' || ($item['rating_status'] ?? '') !== 'rated') {
                continue;
            }

            $pts = (float) ($item['awarded_points'] ?? 0.0);
            $area = $item['category_area'] ?? '';
            $key = $item['criterion_key'] ?? '';
            $code = $item['criterion_code'] ?? '';

            if ($area === 'areaA') {
                if ($key === 'degrees' || $code === 'A.1') $areaA['degrees'] += $pts;
                elseif ($key === 'memberships' || $code === 'A.2') $areaA['memberships'] += $pts;
                elseif ($key === 'seminars' || $code === 'A.3') $areaA['seminars'] += $pts;
            } elseif ($area === 'areaB') {
                if ($key === 'lectures' || $code === 'B.1') $areaBRaw['lectures'] += $pts;
                elseif ($key === 'publications' || $code === 'B.2') $areaBRaw['publications'] += $pts;
                elseif ($key === 'research' || $code === 'B.3') $areaBRaw['research'] += $pts;
                elseif ($key === 'awards' || $code === 'B.4') $areaBRaw['awards'] += $pts;
                elseif ($key === 'instructional' || $code === 'B.5') $areaBRaw['instructional'] += $pts;
                elseif ($key === 'creative' || $code === 'B.6') $areaBRaw['creative'] += $pts;
            } elseif ($area === 'areaC') {
                if (str_starts_with($code, 'C.1') || str_starts_with($key, 'c1_') || $key === 'extracurricular') {
                    $areaCRaw['c1_raw'] += $pts;
                } elseif (str_starts_with($code, 'C.2') || str_starts_with($key, 'c2_') || $key === 'community') {
                    $areaCRaw['c2_raw'] += $pts;
                }
            }
        }

        // Apply Subcriterion & Area A Caps
        $areaA['degrees'] = min(40.0, $areaA['degrees']);
        $areaA['memberships'] = min(10.0, $areaA['memberships']);
        $areaA['seminars'] = min(20.0, $areaA['seminars']);
        $areaA['total'] = min(self::AREA_A_MAX, $areaA['degrees'] + $areaA['memberships'] + $areaA['seminars']);

        // Apply Individual Maxima for Area B Subcriteria before Area Cap
        $areaBRaw['lectures'] = min(40.0, $areaBRaw['lectures']);
        $areaBRaw['publications'] = min(40.0, $areaBRaw['publications']);
        $areaBRaw['research'] = min(40.0, $areaBRaw['research']);
        $areaBRaw['awards'] = min(40.0, $areaBRaw['awards']);
        $areaBRaw['instructional'] = min(40.0, $areaBRaw['instructional']);
        $areaBRaw['creative'] = min(20.0, $areaBRaw['creative']);

        $areaBRaw['total'] = $areaBRaw['lectures'] + $areaBRaw['publications'] + $areaBRaw['research'] +
                             $areaBRaw['awards'] + $areaBRaw['instructional'] + $areaBRaw['creative'];
        $areaBAwarded = min(self::AREA_B_MAX, $areaBRaw['total']);

        // Apply Area C Subarea Caps (C.1 max 30, C.2 max 30, C.3 max 10) & Area Cap (40)
        $areaCRaw['c1_awarded'] = min(30.0, $areaCRaw['c1_raw']);
        $areaCRaw['c2_awarded'] = min(30.0, $areaCRaw['c2_raw']);
        $areaCRaw['total'] = min(self::AREA_C_MAX, $areaCRaw['c1_awarded'] + $areaCRaw['c2_awarded'] + $areaCRaw['tenure']);

        $grandTotalAwarded = min(self::GRAND_TOTAL_MAX, $areaA['total'] + $areaBAwarded + $areaCRaw['total']);

        return [
            'areaA'             => $areaA,
            'areaB'             => array_merge($areaBRaw, ['rawTotal' => $areaBRaw['total'], 'awardedTotal' => $areaBAwarded, 'total' => $areaBAwarded]),
            'areaC'             => array_merge($areaCRaw, ['extracurricular' => $areaCRaw['c1_awarded'], 'community' => $areaCRaw['c2_awarded']]),
            'areaA_score'       => $areaA['total'],
            'areaB_score'       => $areaBAwarded,
            'areaC_score'       => $areaCRaw['total'],
            'rawGrandTotal'     => $areaA['total'] + $areaBRaw['total'] + ($areaCRaw['c1_raw'] + $areaCRaw['c2_raw'] + $areaCRaw['tenure']),
            'grandTotalAwarded' => $grandTotalAwarded,
            'total_score'       => $grandTotalAwarded,
        ];
    }
}
