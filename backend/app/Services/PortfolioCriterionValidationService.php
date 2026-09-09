<?php

namespace App\Services;

use Config\Database;
use RuntimeException;

class PortfolioCriterionValidationService
{
    protected EvaluationScaleResolver $resolver;

    public function __construct(?EvaluationScaleResolver $resolver = null)
    {
        $this->resolver = $resolver ?? new EvaluationScaleResolver();
    }

    /**
     * Validates an accomplishment entry against the assigned scale and returns verified point trace.
     *
     * @param string $personnelProfileId
     * @param array $entry
     * @param string $evaluationCycleId
     * @return array
     * @throws RuntimeException
     */
    public function validateAndTracePoints(string $personnelProfileId, array $entry, string $evaluationCycleId = '2025-2026'): array
    {
        $resolved = $this->resolver->resolveForPersonnel($personnelProfileId, $evaluationCycleId);
        $scale = $resolved['scale'];
        $version = $resolved['version'];

        $areaCode = strtoupper(trim($entry['area_code'] ?? 'A'));
        $db = Database::connect();

        // 1. Verify area exists and check entry policy
        $area = $db->table('evaluation_scale_areas')
            ->where('scale_version_id', $version['id'])
            ->where('area_code', $areaCode)
            ->get()
            ->getRowArray();

        if (!$area) {
            throw new RuntimeException("Invalid Area [{$areaCode}] for scale [{$scale['scale_code']}].", 422);
        }

        if ($area['entry_policy'] !== 'personnel_entry_allowed') {
            throw new RuntimeException("Portfolio Area [{$areaCode}: {$area['name']}] does not permit personnel accomplishment entry.", 409);
        }

        // 2. Validate title and occurrence date
        $title = trim($entry['title'] ?? '');
        if ($title === '') {
            throw new RuntimeException("Accomplishment title is required.", 422);
        }

        // 3. Compute points based on official category and subcategory rules
        $categoryName = trim($entry['category'] ?? '');
        $subCategoryName = trim($entry['sub_category'] ?? '');
        $scope = trim($entry['scope'] ?? '');

        $calculatedPoints = $this->calculatePoints($scale['scale_code'], $areaCode, $categoryName, $subCategoryName, $scope, $entry);


        return [
            'scale_code' => $scale['scale_code'],
            'scale_version_id' => $version['id'],
            'area_code' => $areaCode,
            'area_name' => $area['name'],
            'area_max_points' => (float)$area['max_points'],
            'category' => $categoryName,
            'sub_category' => $subCategoryName,
            'scope' => $scope,
            'raw_points' => $calculatedPoints['raw'],
            'claimed_points' => $calculatedPoints['claimed'],
            'point_trace' => [
                'rule_applied' => $calculatedPoints['rule'],
                'source_ref' => $calculatedPoints['source_ref'],
                'formula_key' => $calculatedPoints['formula_key'],
                'capped' => $calculatedPoints['capped'],
            ]
        ];
    }

    /**
     * Calculates points according to official NDMU point schedule.
     */
    protected function calculatePoints(string $scaleCode, string $areaCode, string $category, string $subcategory, string $scope, array $entry): array
    {
        $cat = strtolower($category);
        $sub = strtolower($subcategory);
        $sc  = strtolower($scope);

        // =========================================================================
        // NON-TEACHING PERSONNEL RANKING SCALE
        // =========================================================================
        if ($scaleCode === 'NON_TEACHING_PERSONNEL_RANKING_SCALE') {
            if ($areaCode === 'A') {
                throw new RuntimeException("Portfolio Area [A: Performance and Personal Indicators] is an evaluation-only section and does not permit personnel accomplishment mutations.", 409);
            }

            if ($areaCode === 'C') {
                throw new RuntimeException("Invalid Area [C] for Non-Teaching Personnel Ranking Scale.", 422);
            }

            if ($areaCode === 'B') {
                // Reject Administrators-only criteria if passed
                if (str_contains($cat, 'publication') || str_contains($cat, 'instructional material') || str_contains($cat, 'creative work')) {
                    throw new RuntimeException("Invalid criterion [{$category}] for Non-Teaching Personnel Ranking Scale.", 422);
                }

                // B.1 Involvement in School Activities / Recognized School Organizations (Max 30 pts)
                if (str_contains($cat, 'school activities') || str_contains($cat, 'recognized school') || str_contains($cat, 'b.1') || str_contains($cat, 'b1')) {
                    if (str_contains($sub, 'moderator') || str_contains($sub, 'officer')) {
                        $pts = 30.00;
                        $lbl = 'Moderator or Officer of Clubs (30 pts)';
                    } elseif (str_contains($sub, 'trainer') || str_contains($sub, 'coach')) {
                        $pts = 20.00;
                        $lbl = 'Trainer/Coach (20 pts)';
                    } elseif (str_contains($sub, 'committee') || str_contains($sub, 'working')) {
                        $pts = 20.00;
                        $lbl = 'Membership in Working Committees (20 pts)';
                    } elseif (str_contains($sub, 'rendered') || str_contains($sub, 'service')) {
                        $pts = 10.00;
                        $lbl = 'Rendered Service in School Activities (10 pts)';
                    } else {
                        $pts = 10.00;
                        $lbl = 'School Activities Participation (10 pts)';
                    }

                    return [
                        'raw' => $pts,
                        'claimed' => $pts,
                        'capped' => false,
                        'rule' => $lbl,
                        'source_ref' => 'Table B.1 (School Activities)',
                        'formula_key' => 'NT_ACT_SCHEDULE'
                    ];
                }

                // B.2 Community Involvement (Max 30 pts)
                if (str_contains($cat, 'community involvement') || str_contains($cat, 'church') || str_contains($cat, 'b.2') || str_contains($cat, 'b2')) {
                    if (str_contains($sub, 'church')) {
                        $pts = 25.00;
                        $lbl = 'Active Involvement in Church Activities (25 pts)';
                    } elseif (str_contains($sub, 'civic') || str_contains($sub, 'community')) {
                        $pts = 25.00;
                        $lbl = 'Active Involvement in Community/Civic Activities (25 pts)';
                    } elseif (str_contains($sub, 'charity') || str_contains($sub, 'project')) {
                        $pts = 5.00;
                        $lbl = 'Support to Charity and Community Projects (5 pts)';
                    } else {
                        $pts = 5.00;
                        $lbl = 'Community Support (5 pts)';
                    }

                    return [
                        'raw' => $pts,
                        'claimed' => $pts,
                        'capped' => false,
                        'rule' => $lbl,
                        'source_ref' => 'Table B.2 (Community Involvement)',
                        'formula_key' => 'NT_COMM_SCHEDULE'
                    ];
                }

                // B.3 Number of Years at NDMU (1 pt per 2 completed years, max 10 pts, server-derived)
                if (str_contains($cat, 'years at ndmu') || str_contains($cat, 'service credit') || str_contains($cat, 'b.3') || str_contains($cat, 'b3')) {
                    $years = (int)($entry['years_of_service'] ?? $entry['years'] ?? 0);
                    $pts = min(10.00, floor($years / 2) * 1.00);
                    return [
                        'raw' => $pts,
                        'claimed' => $pts,
                        'capped' => ($pts >= 10.00),
                        'server_derived' => true,
                        'rule' => 'Number of Years at NDMU (1 pt per 2 completed yrs, max 10 pts)',
                        'source_ref' => 'Table B.3 (Years at NDMU)',
                        'formula_key' => 'NT_SRV_CREDIT_SERVER_DERIVED'
                    ];
                }

                // B.4 Invited as Judge, Lecturer, Resource Person (5 pts per occurrence, max 30 pts)
                if (str_contains($cat, 'invited as judge') || str_contains($cat, 'lecturer') || str_contains($cat, 'resource person') || str_contains($cat, 'b.4') || str_contains($cat, 'b4')) {
                    $invitations = (int)($entry['invitation_count'] ?? $entry['count'] ?? 1);
                    $raw = max(1, $invitations) * 5.00;
                    $pts = min(30.00, $raw);
                    return [
                        'raw' => $pts,
                        'claimed' => $pts,
                        'capped' => ($raw > 30.00),
                        'rule' => 'Invited as Judge, Lecturer, Resource Person (5 pts per occurrence, max 30 pts)',
                        'source_ref' => 'Table B.4 (Invitations)',
                        'formula_key' => 'NT_INVITED_PER_ITEM'
                    ];
                }

                // B.5 Recognition / Meritorious Award (Max 30 pts, Evaluator Judgment Required)
                if (str_contains($cat, 'recognition') || str_contains($cat, 'meritorious award') || str_contains($cat, 'b.5') || str_contains($cat, 'b5')) {
                    return [
                        'raw' => 30.00,
                        'claimed' => 0.00,
                        'capped' => false,
                        'evaluator_judgment_required' => true,
                        'rule' => 'Evaluator Judgment Required (Max 30.0 pts)',
                        'source_ref' => 'Table B.5 (Recognition / Meritorious Award)',
                        'formula_key' => 'NT_AWARD_JUDGMENT_MAX_30'
                    ];
                }
            }
        }

        // =========================================================================
        // ADMINISTRATORS RANKING SCALE (DEFAULT / EXPLICIT)
        // =========================================================================

        // --- AREA A ---
        if ($areaCode === 'A') {
            // A.1 Degrees
            if (str_contains($cat, 'degree') || str_contains($sub, 'ph.d.') || str_contains($sub, 'ma degree')) {
                if (str_contains($sub, 'ph.d. degree holder') || str_contains($sub, 'doctor')) {
                    return [
                        'raw' => 40.00,
                        'claimed' => 40.00,
                        'capped' => false,
                        'rule' => 'Ph.D. Degree Holder (40 pts)',
                        'source_ref' => 'Table A.1, Row 1',
                        'formula_key' => 'DEGREE_PHD'
                    ];
                }
                if (str_contains($sub, 'ma degree holder') || str_contains($sub, 'master')) {
                    return [
                        'raw' => 20.00,
                        'claimed' => 20.00,
                        'capped' => false,
                        'rule' => 'Master\'s Degree Holder (20 pts)',
                        'source_ref' => 'Table A.1, Row 3',
                        'formula_key' => 'DEGREE_MA'
                    ];
                }
                if (str_contains($sub, 'ph.d. units') || str_contains($sub, 'doctoral units')) {
                    $units = (int)($entry['units_earned'] ?? $entry['units'] ?? 0);
                    $pts = min(10.00, floor($units / 3) * 2.00);
                    return [
                        'raw' => $pts,
                        'claimed' => $pts,
                        'capped' => ($pts >= 10.00),
                        'rule' => 'Ph.D. Units (2 pts per 3 units, max 10 pts)',
                        'source_ref' => 'Table A.1, Row 2',
                        'formula_key' => 'DEGREE_PHD_UNITS'
                    ];
                }
                if (str_contains($sub, 'ma units') || str_contains($sub, 'master units')) {
                    $units = (int)($entry['units_earned'] ?? $entry['units'] ?? 0);
                    $pts = min(10.00, floor($units / 3) * 1.00);
                    return [
                        'raw' => $pts,
                        'claimed' => $pts,
                        'capped' => ($pts >= 10.00),
                        'rule' => 'MA Units (1 pt per 3 units, max 10 pts)',
                        'source_ref' => 'Table A.1, Row 4',
                        'formula_key' => 'DEGREE_MA_UNITS'
                    ];
                }
            }

            // A.2 Professional Orgs
            if (str_contains($cat, 'membership') || str_contains($cat, 'prof org')) {
                if (str_contains($sub, 'officer') || str_contains($sub, 'board')) {
                    return [
                        'raw' => 10.00,
                        'claimed' => 10.00,
                        'capped' => false,
                        'rule' => 'Officer / Board Position (10 pts)',
                        'source_ref' => 'Table A.2, Row 2',
                        'formula_key' => 'MEMBERSHIP_OFFICER'
                    ];
                }
                return [
                    'raw' => 5.00,
                    'claimed' => 5.00,
                    'capped' => false,
                    'rule' => 'Regular Member (5 pts)',
                    'source_ref' => 'Table A.2, Row 1',
                    'formula_key' => 'MEMBERSHIP_REGULAR'
                ];
            }

            // A.3 Seminars / Trainings
            if (str_contains($cat, 'seminar') || str_contains($cat, 'training')) {
                if (str_contains($sc, 'international') || str_contains($sub, 'international')) {
                    return ['raw' => 10.00, 'claimed' => 10.00, 'capped' => false, 'rule' => 'International Seminar (10 pts)', 'source_ref' => 'Table A.3, Row 5', 'formula_key' => 'SEMINAR_INTL'];
                }
                if (str_contains($sc, 'national') || str_contains($sub, 'national')) {
                    return ['raw' => 8.00, 'claimed' => 8.00, 'capped' => false, 'rule' => 'National Seminar (8 pts)', 'source_ref' => 'Table A.3, Row 4', 'formula_key' => 'SEMINAR_NATL'];
                }
                if (str_contains($sc, 'regional') || str_contains($sub, 'regional')) {
                    return ['raw' => 6.00, 'claimed' => 6.00, 'capped' => false, 'rule' => 'Regional Seminar (6 pts)', 'source_ref' => 'Table A.3, Row 3', 'formula_key' => 'SEMINAR_REG'];
                }
                if (str_contains($sc, 'provincial') || str_contains($sc, 'city') || str_contains($sub, 'provincial')) {
                    return ['raw' => 4.00, 'claimed' => 4.00, 'capped' => false, 'rule' => 'City/Provincial Seminar (4 pts)', 'source_ref' => 'Table A.3, Row 2', 'formula_key' => 'SEMINAR_LOCAL'];
                }
                return ['raw' => 3.00, 'claimed' => 3.00, 'capped' => false, 'rule' => 'In-House Seminar (3 pts)', 'source_ref' => 'Table A.3, Row 1', 'formula_key' => 'SEMINAR_INHOUSE'];
            }
        }

        // --- AREA B ---
        if ($areaCode === 'B') {
            // B.1 Guest Lecturer / Consultant / Judge / Resource Person (4-factor sum)
            if (str_contains($cat, 'guest lecturer') || str_contains($cat, 'consultant') || str_contains($cat, 'judge') || str_contains($cat, 'b.1')) {
                $org = strtolower(trim($entry['sponsoring_organization'] ?? $entry['org_type'] ?? 'ndmu'));
                $orgPts = (str_contains($org, 'external') || str_contains($org, 'other')) ? 2.00 : 1.00;

                $extent = strtolower(trim($entry['extent_of_talk'] ?? $entry['extent'] ?? '1_hour'));
                if (str_contains($extent, 'more') || str_contains($extent, 'series')) $extPts = 5.00;
                elseif (str_contains($extent, '2_day') || str_contains($extent, '2 day')) $extPts = 4.00;
                elseif (str_contains($extent, '1_day') || str_contains($extent, 'full day') || str_contains($extent, '1 day')) $extPts = 3.00;
                elseif (str_contains($extent, 'half')) $extPts = 2.00;
                else $extPts = 1.00;

                $reach = strtolower(trim($entry['participant_reach'] ?? $entry['reach'] ?? $scope));
                if (str_contains($reach, 'international')) $reachPts = 4.00;
                elseif (str_contains($reach, 'national')) $reachPts = 3.00;
                elseif (str_contains($reach, 'regional')) $reachPts = 2.00;
                else $reachPts = 1.00;

                $role = strtolower(trim($entry['role'] ?? $subcategory));
                if (str_contains($role, 'judge')) $rolePts = 3.00;
                else $rolePts = 5.00; // Reactor, Resource Person, Facilitator, Consultant, Speaker, Organizer

                $total = $orgPts + $extPts + $reachPts + $rolePts;
                return [
                    'raw' => $total,
                    'claimed' => $total,
                    'capped' => false,
                    'rule' => "4-Factor Sum: Org({$orgPts}) + Extent({$extPts}) + Reach({$reachPts}) + Role({$rolePts}) = {$total} pts",
                    'source_ref' => 'Table B.1 (4-Factor Formula)',
                    'formula_key' => 'LECTURER_4FACTOR_SUM'
                ];
            }

            // B.2 Publication (2-factor sum: Scope + Publication Type)
            if (str_contains($cat, 'publication') || str_contains($cat, 'b.2')) {
                $locScope = strtolower(trim($entry['location_scope'] ?? $scope));
                if (str_contains($locScope, 'international')) $scopePts = 8.00;
                elseif (str_contains($locScope, 'national')) $scopePts = 6.00;
                elseif (str_contains($locScope, 'regional')) $scopePts = 4.00;
                else $scopePts = 3.00;

                $pType = strtolower(trim($entry['publication_type'] ?? $subcategory));
                if (str_contains($pType, 'book') || str_contains($pType, 'research_output') || str_contains($pType, 'research output')) $typePts = 10.00;
                elseif (str_contains($pType, 'scholarly') || str_contains($pType, 'monograph')) $typePts = 8.00;
                elseif (str_contains($pType, 'article') || str_contains($pType, 'compilation')) $typePts = 5.00;
                elseif (str_contains($pType, 'reviews') || str_contains($pType, 'review')) $typePts = 4.00;
                elseif (str_contains($pType, 'commentary')) $typePts = 2.00;
                else $typePts = 5.00;

                $total = $scopePts + $typePts;
                return [
                    'raw' => $total,
                    'claimed' => $total,
                    'capped' => false,
                    'rule' => "Scope({$scopePts}) + Type({$typePts}) = {$total} pts",
                    'source_ref' => 'Table B.2 (Scope + Type Formula)',
                    'formula_key' => 'PUB_SCOPE_TYPE_SUM'
                ];
            }

            // B.3 Conduct of Research (Max 40 pts, Evaluator Judgment Required)
            if (str_contains($cat, 'research') || str_contains($cat, 'b.3')) {
                return [
                    'raw' => 40.00,
                    'claimed' => 0.00,
                    'capped' => false,
                    'evaluator_judgment_required' => true,
                    'rule' => 'Evaluator Judgment Required (Max 40.0 pts)',
                    'source_ref' => 'Table B.3 (Evaluator Judgment)',
                    'formula_key' => 'RES_JUDGMENT_MAX_40'
                ];
            }

            // B.4 Recognition & Awards (Matrix Lookup)
            if (str_contains($cat, 'award') || str_contains($cat, 'recognition') || str_contains($cat, 'b.4')) {
                $status = strtolower(trim($entry['recognition_status'] ?? (str_contains($subcategory, 'nominee') ? 'nominee' : 'awardee')));
                $scKey = strtolower(trim($entry['scope'] ?? $scope));
                $isNominee = str_contains($status, 'nominee');

                if ($isNominee) {
                    if (str_contains($scKey, 'international') || str_contains($scKey, 'national')) $pts = 20.00;
                    elseif (str_contains($scKey, 'regional') || str_contains($scKey, 'provincial')) $pts = 15.00;
                    else $pts = 5.00;
                } else { // Awardee
                    if (str_contains($scKey, 'international') || str_contains($scKey, 'national')) $pts = 40.00;
                    elseif (str_contains($scKey, 'regional') || str_contains($scKey, 'provincial')) $pts = 30.00;
                    else $pts = 10.00;
                }

                $statusLabel = $isNominee ? 'Nominee' : 'Awardee';
                return [
                    'raw' => $pts,
                    'claimed' => $pts,
                    'capped' => false,
                    'rule' => "{$statusLabel} ({$scKey}) = {$pts} pts",
                    'source_ref' => 'Table B.4 (Awards Matrix)',
                    'formula_key' => 'AWARD_MATRIX'
                ];
            }

            // B.5 Instructional Materials
            if (str_contains($cat, 'instructional material') || str_contains($cat, 'materials') || str_contains($cat, 'b.5')) {
                $mType = strtolower(trim($entry['material_type'] ?? $subcategory));
                if (str_contains($mType, 'workbook') || str_contains($mType, 'others') || str_contains($mType, 'lecture')) {
                    $pts = 20.00;
                    $label = 'Others (Bound Workbook, Exercises, Lectures)';
                } else {
                    $pts = 10.00;
                    $label = 'Audio-Visual Aids / Modules / Reviewers (Bound)';
                }
                return [
                    'raw' => $pts,
                    'claimed' => $pts,
                    'capped' => false,
                    'rule' => "{$label} ({$pts} pts)",
                    'source_ref' => 'Table B.5',
                    'formula_key' => 'MAT_SCHEDULE'
                ];
            }

            // B.6 Creative Work (Max 20 pts, Evaluator Judgment Required)
            if (str_contains($cat, 'creative work') || str_contains($cat, 'b.6')) {
                return [
                    'raw' => 20.00,
                    'claimed' => 0.00,
                    'capped' => false,
                    'evaluator_judgment_required' => true,
                    'rule' => 'Evaluator Judgment Required (Max 20.0 pts)',
                    'source_ref' => 'Table B.6 (Evaluator Judgment)',
                    'formula_key' => 'CREATIVE_JUDGMENT_MAX_20'
                ];
            }
        }

        // --- AREA C ---
        if ($areaCode === 'C') {
            // C.1 Involvement in Extra-Curricular Activities
            if (str_contains($cat, 'extra-curricular') || str_contains($cat, 'activity') || str_contains($cat, 'c.1')) {
                if (str_contains($sub, 'rendered') || str_contains($sub, 'intramural')) {
                    $pts = 10.00;
                    $lbl = 'Rendered Service (10 pts)';
                } else {
                    $pts = 20.00;
                    $lbl = 'Moderator / Coach / Working Committee (20 pts)';
                }
                return ['raw' => $pts, 'claimed' => $pts, 'capped' => false, 'rule' => $lbl, 'source_ref' => 'Table C.1', 'formula_key' => 'ACT_SCHEDULE'];
            }

            // C.2 Community Involvement
            if (str_contains($cat, 'community') || str_contains($cat, 'church') || str_contains($cat, 'c.2')) {
                if (str_contains($sub, 'charity') || str_contains($sub, 'project')) {
                    $pts = 5.00;
                    $lbl = 'Support to charity and community projects (5 pts)';
                } else {
                    $pts = 25.00;
                    $lbl = 'Active involvement in church / civic activities (25 pts)';
                }
                return ['raw' => $pts, 'claimed' => $pts, 'capped' => false, 'rule' => $lbl, 'source_ref' => 'Table C.2', 'formula_key' => 'COMM_SCHEDULE'];
            }

            // C.3 Years of Service at NDMU (1 pt per 2 completed years, max 10 pts, server-derived)
            if (str_contains($cat, 'service credit') || str_contains($cat, 'years of service') || str_contains($cat, 'c.3')) {
                $years = (int)($entry['years_of_service'] ?? $entry['years'] ?? 0);
                $pts = min(10.00, floor($years / 2) * 1.00);
                return [
                    'raw' => $pts,
                    'claimed' => $pts,
                    'capped' => ($pts >= 10.00),
                    'server_derived' => true,
                    'rule' => 'Years of Service Credit (1 pt per 2 completed yrs, max 10 pts)',
                    'source_ref' => 'Table C.3',
                    'formula_key' => 'SRV_CREDIT_SERVER_DERIVED'
                ];
            }
        }

        // Generic fallback
        $pts = (float)($entry['points'] ?? 5.00);
        return [
            'raw' => $pts,
            'claimed' => $pts,
            'capped' => false,
            'rule' => 'Configured Standard Points',
            'source_ref' => 'Official Ranking Scale Manual',
            'formula_key' => 'STANDARD_POINT'
        ];
    }
}

