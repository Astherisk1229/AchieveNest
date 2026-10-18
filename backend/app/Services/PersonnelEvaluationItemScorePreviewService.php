<?php

namespace App\Services;

/** Calculates reviewer previews with the same locked-item totals used when decisions are saved. */
final class PersonnelEvaluationItemScorePreviewService
{
    public function totals(array $items, int $tenureYears = 0, array $criteriaSnapshot = []): array
    {
        // A submitted portfolio may already contain an approved score frozen in
        // criterion_snapshot.provisional_scoring. Keep that approved submission
        // visible in the summary until the Dean records a new decision. A Dean
        // rejection still removes the item, while a completed review continues
        // to use the persisted awarded_points value.
        $scoringItems = array_map(static function (array $item): array {
            if (($item['verification_status'] ?? '') === 'ineligible'
                || (($item['verification_status'] ?? '') === 'verified' && ($item['rating_status'] ?? '') === 'rated')) {
                return $item;
            }
            $submittedPoints = self::submittedApprovedPoints($item);
            if ($submittedPoints === null) return $item;
            $item['verification_status'] = 'verified';
            $item['rating_status'] = 'rated';
            $item['awarded_points'] = $submittedPoints;
            return $item;
        }, $items);
        $categories = [];
        $categoryAreas = [];
        $categoryCaps = [];
        $areaCaps = [];
        $graduateUnits = GraduateUnitScoringService::aggregate($scoringItems);
        foreach ($scoringItems as $item) {
            if (($item['verification_status'] ?? '') !== 'verified' || ($item['rating_status'] ?? '') !== 'rated') continue;
            $snapshot = self::decode($item['criterion_snapshot'] ?? null);
            $isUnitItem = GraduateUnitScoringService::isUnitItem($item);
            $category = $snapshot['category'] ?? [];
            $code = (string) ($category['category_code'] ?? $item['criterion_code'] ?? 'UNMAPPED');
            $area = strtoupper((string) ($category['area_code'] ?? substr($code, 0, 1)));
            $categories[$code] = ($categories[$code] ?? 0.0) + ($isUnitItem ? 0.0 : (float) ($item['awarded_points'] ?? 0));
            $categoryAreas[$code] = $area;
            $fixedNtf = $this->nonTeachingFixedCriterion($item);
            $categoryCaps[$code] = $fixedNtf !== null
                ? $fixedNtf['category_max']
                // Sum sibling subcriteria first, then apply the parent category
                // maximum. criterion_cap is the per-item ceiling and can be
                // lower than the parent cap (for example, each C.1 leaf is 20
                // while the C.1 category allows 30 across multiple items).
                : (float) ($category['max_points'] ?? $snapshot['criterion_cap'] ?? PHP_FLOAT_MAX);
            $areaCaps[$area] = (float) ($category['area_max_points'] ?? $areaCaps[$area] ?? PHP_FLOAT_MAX);
        }
        foreach ($graduateUnits as $level) $categories[$level['category_code']] = ($categories[$level['category_code']] ?? 0.0) + $level['points'];
        $serviceCredit = $this->serviceYearsCredit($criteriaSnapshot, $tenureYears);
        if ($serviceCredit !== null) {
            $serviceCode = $serviceCredit['category_code'];
            $serviceArea = $serviceCredit['area_code'];
            $categories[$serviceCode] = $serviceCredit['points'];
            $categoryAreas[$serviceCode] = $serviceArea;
            $categoryCaps[$serviceCode] = $serviceCredit['maximum_points'];
            $areaCaps[$serviceArea] = (float) ($serviceCredit['area_maximum_points'] ?? $areaCaps[$serviceArea] ?? PHP_FLOAT_MAX);
        }
        $areas = ['A' => 0.0, 'B' => 0.0, 'C' => 0.0];
        $countedCategories = [];
        foreach ($categories as $code => $points) {
            $countedCategories[$code] = min($points, $categoryCaps[$code]);
            $areas[$categoryAreas[$code]] = ($areas[$categoryAreas[$code]] ?? 0) + $countedCategories[$code];
        }
        foreach ($areas as $area => $points) $areas[$area] = min($points, $areaCaps[$area] ?? PHP_FLOAT_MAX);
        return ['areaA_score' => $areas['A'], 'areaB_score' => $areas['B'], 'areaC_score' => $areas['C'], 'total_score' => array_sum($areas), 'category_scores' => $categories, 'category_counted_scores' => $countedCategories, 'graduate_units' => array_values($graduateUnits), 'service_years_credit' => $serviceCredit];
    }

    private static function submittedApprovedPoints(array $item): ?float
    {
        $snapshot = self::decode($item['criterion_snapshot'] ?? null);
        $scoring = self::decode($item['provisional_scoring'] ?? ($snapshot['provisional_scoring'] ?? null));
        if (strtolower(trim((string) ($scoring['status'] ?? ''))) !== 'verified') return null;
        $points = $item['verified_points'] ?? $item['awarded_points'] ?? $scoring['verified_points'] ?? null;
        return is_numeric($points) ? (float) $points : null;
    }

    public function preview(array $items, array $item, string $personnelGroup, int $tenureYears = 0, array $criteriaSnapshot = []): array
    {
        if ($issue = $this->mappingIssue($item)) return ['mode' => 'unavailable', 'reason' => $issue];
        $snapshot = self::decode($item['criterion_snapshot'] ?? null);

        $graduate = GraduateUnitScoringService::isUnitItem($item);
        $evidenceScoring = new VerifiedEvidenceScoringService();
        $automatic = $evidenceScoring->isApplicable($item, $personnelGroup);
        $fixedNtf = $this->nonTeachingFixedCriterion($item);
        $manual = ! $graduate && ! $automatic && $fixedNtf === null && ! empty($item['evaluator_judgment_required']);
        $mode = $graduate ? 'graduate_units' : ($automatic ? 'automatic' : ($manual ? 'manual' : 'fixed'));
        $proposed = null;
        $reason = null;
        $basis = null;
        $maximum = null;

        if ($graduate) {
            $proposed = 0.0; // Individual unit rows never carry points; the level is aggregated below.
            $basis = GraduateUnitScoringService::unitsOf($item) . ' submitted graduate units; the verified level total is scored once.';
            if (GraduateUnitScoringService::unitsOf($item) <= 0) $reason = 'The submitted record has no valid graduate-unit count.';
        } elseif ($automatic) {
            $proposed = $evidenceScoring->scoreOnVerification($item, $personnelGroup);
            if (! $evidenceScoring->hasAttachedEvidence($item)) $reason = 'Supporting evidence is required before this automatic score can be awarded.';
            elseif ($proposed === null || $proposed <= 0) $reason = 'The locked automatic criterion has no resolvable maximum.';
            $basis = 'Locked criterion maximum after supporting evidence is verified.';
        } elseif ($manual) {
            $maximum = (float) ($item['max_allowed_points'] ?? $item['configured_points_snapshot'] ?? 0);
            $proposed = ($item['rating_status'] ?? '') === 'rated' ? (float) ($item['awarded_points'] ?? 0) : null;
            if ($maximum <= 0) $reason = 'The locked criterion has no valid evaluator scoring maximum.';
            elseif ($proposed !== null && ($proposed <= 0 || $proposed > $maximum)) $reason = 'The saved evaluator score is outside the locked criterion range.';
            $basis = 'The evaluator assigns points within the locked maximum.';
        } else {
            $proposed = $fixedNtf['points'] ?? (float) ($snapshot['configured_points'] ?? $item['configured_points_snapshot'] ?? 0);
            if ($proposed <= 0) $reason = 'The locked criterion has no configured points.';
            $basis = 'Fixed points from the locked HR criterion.';
        }

        $result = ['mode' => $mode, 'proposed_points' => $proposed, 'maximum_points' => $maximum, 'scoring_basis' => $basis, 'reason' => $reason];
        if ($reason !== null) return $result;
        if ($manual && $proposed === null) {
            $candidate = $items;
            foreach ($candidate as &$row) {
                if ((string) ($row['id'] ?? '') !== (string) ($item['id'] ?? '')) continue;
                $row['verification_status'] = 'verified';
                $row['rating_status'] = 'rated';
                $row['awarded_points'] = $maximum;
                break;
            }
            unset($row);
            $result['maximum_additional_total_points'] = round($this->totals($candidate, $tenureYears, $criteriaSnapshot)['total_score'] - $this->totals($items, $tenureYears, $criteriaSnapshot)['total_score'], 2);
            return $result;
        }

        // Compare a review with and without this record. This keeps the preview
        // meaningful when returning to an item that has already been approved.
        $baseline = $items;
        $candidate = $items;
        $found = false;
        foreach ($candidate as $index => $row) {
            if ((string) ($row['id'] ?? '') !== (string) ($item['id'] ?? '')) continue;
            $found = true;
            $baseline[$index]['verification_status'] = 'pending';
            $baseline[$index]['rating_status'] = 'unrated';
            $baseline[$index]['awarded_points'] = 0.0;
            $candidate[$index]['verification_status'] = 'verified';
            $candidate[$index]['rating_status'] = 'rated';
            $candidate[$index]['awarded_points'] = $graduate ? 0.0 : $proposed;
            break;
        }
        if (! $found) return ['mode' => 'unavailable', 'reason' => 'This record is missing from the submitted evaluation. Refresh the review before scoring.'];
        $currentTotals = $this->totals($baseline, $tenureYears, $criteriaSnapshot);
        $afterTotals = $this->totals($candidate, $tenureYears, $criteriaSnapshot);
        if ($graduate) {
            $level = GraduateUnitScoringService::levelOf($item);
            $afterLevel = self::levelPoints($afterTotals['graduate_units'], $level);
            $result['proposed_points'] = $afterLevel;
            $result['graduate_level_points'] = $afterLevel;
            $result['graduate_level_units'] = self::levelUnits($afterTotals['graduate_units'], $level);
            $result['graduate_level'] = $level;
            $result['scoring_basis'] = GraduateUnitScoringService::unitsOf($item) . ' submitted units; the ' . $level . ' level totals ' . self::levelUnits($afterTotals['graduate_units'], $level) . ' verified units and ' . number_format($afterLevel, 2) . ' points if approved.';
        }
        $result['additional_total_points'] = round((float) $afterTotals['total_score'] - (float) $currentTotals['total_score'], 2);
        $result['total_after_approval'] = (float) $afterTotals['total_score'];
        return $result;
    }

    public function mappingIssue(array $item): ?string
    {
        $snapshot = self::decode($item['criterion_snapshot'] ?? null);
        $category = self::decode($snapshot['category'] ?? null);
        $reference = trim((string) ($snapshot['criterion_reference'] ?? ''));
        $categoryCode = trim((string) ($category['category_code'] ?? ''));
        $itemReference = trim((string) ($item['criterion_key'] ?? ''));
        $fixedNtf = $this->nonTeachingFixedCriterion($item);
        if ($snapshot === [] || ($reference !== '' && $itemReference !== '' && strcasecmp($reference, $itemReference) !== 0)
            || ($categoryCode !== '' && strcasecmp($categoryCode, (string) ($item['criterion_code'] ?? '')) !== 0 && $fixedNtf === null)
            || (! GraduateUnitScoringService::isUnitItem($item)
                && ! (new VerifiedEvidenceScoringService())->isApplicable($item, 'FACULTY')
                && (! empty($snapshot['evaluator_judgment_required'])) !== (! empty($item['evaluator_judgment_required']))
                && $fixedNtf === null)) {
            return 'The submitted criterion does not match its locked evaluation snapshot. Ask HR to review the mapping before scoring.';
        }
        if (isset($snapshot['configured_points'], $item['configured_points_snapshot'])
            && (float) $snapshot['configured_points'] !== (float) $item['configured_points_snapshot']) {
            return 'The saved points differ from the locked criterion. Ask HR to review this record.';
        }
        $payload = self::decode($item['scoring_payload'] ?? null);
        $metadata = self::decode($payload['category_metadata'] ?? $item['category_metadata'] ?? null);
        $submittedSubtype = strtoupper(trim((string) ($metadata['subcategory_code'] ?? '')));
        $details = self::decode($metadata['details'] ?? null);
        $lockedCode = strtoupper((string) ($category['category_code'] ?? $item['criterion_code'] ?? ''));
        if (($metadata['portfolio_format'] ?? '') === 'faculty_academic' && $submittedSubtype !== '') {
            $facultyCategories = [
                'A1_PHD_HOLDER'=>'A.1', 'A1_PHD_UNITS'=>'A.1', 'A1_MA_HOLDER'=>'A.1', 'A1_MA_UNITS'=>'A.1',
                'A2_MEMBERSHIP'=>'A.2', 'A2_REGULAR_MEMBER'=>'A.2', 'A3_ATTENDANCE'=>'A.3',
                'B1_ACTIVITY'=>'B.1', 'B2_PUBLICATION'=>'B.2', 'B3_RESEARCH'=>'B.3',
                'B4_AWARD'=>'B.4', 'B5_MATERIAL'=>'B.5', 'B6_CREATIVE_WORK'=>'B.6',
                'C1_MODERATOR'=>'C.1.1', 'C1_COACH'=>'C.1.2', 'C1_COMMITTEE'=>'C.1.3', 'C1_SERVICE'=>'C.1.4',
                'C2_CHURCH'=>'C.2.1', 'C2_CIVIC'=>'C.2.2', 'C2_CHARITY'=>'C.2.3',
                'A.1.1'=>'A.1', 'A.1.2'=>'A.1', 'A.1.3'=>'A.1', 'A.1.4'=>'A.1',
                'A.2.1'=>'A.2', 'A.2.2'=>'A.2', 'A.3.1'=>'A.3',
                'B.1.1'=>'B.1', 'B.2.1'=>'B.2', 'B.3.1'=>'B.3', 'B.4.1'=>'B.4', 'B.5.1'=>'B.5', 'B.6.1'=>'B.6',
                'C.1.1'=>'C.1.1', 'C.1.2'=>'C.1.2', 'C.1.3'=>'C.1.3', 'C.1.4'=>'C.1.4',
                'C.2.1'=>'C.2.1', 'C.2.2'=>'C.2.2', 'C.2.3'=>'C.2.3',
            ];
            $expectedCode = $facultyCategories[$submittedSubtype] ?? null;
            // Some published HR hierarchies store C.1/C.2 as the scoring
            // category while the frozen subcategory carries the canonical
            // C.1.x/C.2.x code. Confirm the precise leaf against any of the
            // immutable reference fields before accepting its parent bucket.
            $criterionReference = strtoupper(trim($reference !== '' ? $reference : $itemReference));
            $lockedSubcategoryCode = strtoupper(trim((string) (
                $snapshot['subcategory']['subcategory_code']
                ?? $snapshot['subcategory']['code']
                ?? ''
            )));
            $matchesLockedCriterion = $expectedCode !== null && (
                $expectedCode === $lockedCode
                || (str_starts_with($expectedCode, $lockedCode . '.')
                    && ($criterionReference === $expectedCode || $lockedSubcategoryCode === $expectedCode))
            );
            if (! $matchesLockedCriterion) {
                return 'The submitted faculty classification differs from its locked HR criterion. Request a correction before scoring.';
            }
        }
        if ($lockedCode === 'B.1' && in_array($submittedSubtype, ['B1_ACTIVITY', 'B.1.1'], true)) {
            $allowed = [
                'role' => ['Guest Lecturer', 'Consultant', 'Judge', 'Resource Person'],
                'extent' => ['1 Hour', 'Half Day', '1 Day', '2 Days', 'More than 2 Days'],
                'scope' => ['Local', 'Regional', 'National', 'International'],
            ];
            foreach ($allowed as $field => $values) {
                if (! in_array($details[$field] ?? null, $values, true)) {
                    return "The submitted {$field} is missing or invalid for the locked B.1 criterion. Request a correction before scoring.";
                }
            }
            if (trim((string) ($details['organizer'] ?? '')) === '') {
                return 'The submitted organizer is missing for the locked B.1 criterion. Request a correction before scoring.';
            }
        }
        $unitReferences = ['A1_PHD_UNITS' => 'A.1.2', 'A1_MA_UNITS' => 'A.1.4'];
        if (isset($unitReferences[$submittedSubtype]) && strcasecmp($unitReferences[$submittedSubtype], $reference) !== 0) {
            return 'The submitted graduate-unit classification differs from its locked criterion. Ask HR to review the mapping before scoring.';
        }
        if (preg_match('/^A1_(PHD|MA)_(HOLDER|UNITS)$/', $submittedSubtype) === 1 || in_array($submittedSubtype, ['A.1.1', 'A.1.2', 'A.1.3', 'A.1.4'], true)) {
            $claimedDegree = trim((string) ($details['program'] ?? $details['degree_title'] ?? ''));
            if (preg_match('/\bbachelor(?:\s+of\s+\w+)?\b/i', $claimedDegree) === 1) {
                return 'The submitted undergraduate degree is classified under a graduate criterion. Request a correction before scoring this item.';
            }
        }
        return null;
    }

    /** Recognize a fixed NTF item only when its submitted code and frozen leaf agree. */
    public function nonTeachingFixedCriterion(array $item): ?array
    {
        $codes = [
            'B.1.A' => ['B.1', 'B.1.1'], 'B.1.B' => ['B.1', 'B.1.2'],
            'B.1.C' => ['B.1', 'B.1.3'], 'B.1.D' => ['B.1', 'B.1.4'],
            'B.2.A' => ['B.2', 'B.2.1'], 'B.2.B' => ['B.2', 'B.2.2'],
            'B.2.C' => ['B.2', 'B.2.3'], 'B.4' => ['B.4', 'B.4.1'],
        ];
        $code = strtoupper(trim((string) ($item['criterion_code'] ?? '')));
        if (! isset($codes[$code])) return null;
        [$parent, $leaf] = $codes[$code];
        $snapshot = self::decode($item['criterion_snapshot'] ?? null);
        $category = self::decode($snapshot['category'] ?? null);
        $subcategory = self::decode($snapshot['subcategory'] ?? $snapshot['level'] ?? null);
        $payload = self::decode($item['scoring_payload'] ?? null);
        $metadata = self::decode($payload['category_metadata'] ?? null);
        $format = strtolower(trim((string) ($metadata['portfolio_format'] ?? '')));
        $contract = strtoupper(trim((string) ($metadata['contract_code'] ?? '')));
        $expectedContract = 'NTF-' . str_replace('.', '', $code);
        $points = (float) ($snapshot['configured_points'] ?? 0);
        $maximum = (float) ($category['max_points'] ?? 0);
        if (($format !== '' && $format !== 'non_teaching_faculty')
            || ($contract !== '' && $contract !== $expectedContract)
            || (isset($metadata['criterion_code']) && strcasecmp((string) $metadata['criterion_code'], $code) !== 0)
            || ($code === 'B.4' && $format === '' && $contract === '')
            || strtoupper(trim((string) ($category['category_code'] ?? ''))) !== $parent
            || strtoupper(trim((string) ($subcategory['subcategory_code'] ?? ''))) !== $leaf
            || strtoupper(trim((string) ($snapshot['criterion_reference'] ?? ''))) !== $leaf
            || strtoupper(trim((string) ($item['criterion_key'] ?? ''))) !== $leaf
            || $points <= 0 || $maximum < $points
            || $points !== (float) ($item['configured_points_snapshot'] ?? -1)
            || (isset($subcategory['default_points']) && $points !== (float) $subcategory['default_points'])) return null;
        return ['points' => $points, 'category_code' => $parent, 'category_max' => $maximum];
    }

    /** C.3 is HR-derived, so it contributes to the score without becoming a reviewed achievement. */
    public function serviceYearsCredit(array $criteriaSnapshot, int $years): ?array
    {
        $group = strtoupper((string) ($criteriaSnapshot['sheet']['applies_to'] ?? ''));
        if (! in_array($group, ['FACULTY', 'NON_TEACHING_FACULTY'], true)) return null;
        $serviceCode = $group === 'FACULTY' ? 'C.3' : 'B.3';
        $serviceArea = $group === 'FACULTY' ? 'C' : 'B';
        $serviceCategory = null;
        $serviceAreaMaximum = null;
        foreach ((array) ($criteriaSnapshot['areas'] ?? []) as $area) {
            foreach ((array) ($area['categories'] ?? []) as $category) {
                if (strtoupper(trim((string) ($category['category_code'] ?? ''))) !== $serviceCode) continue;
                $serviceCategory = $category;
                $serviceAreaMaximum = isset($area['max_points']) ? (float) $area['max_points'] : null;
                break 2;
            }
        }
        if ($serviceCategory === null || (int) ($serviceCategory['is_active'] ?? 1) !== 1) return null;
        $maximum = (float) ($serviceCategory['max_points'] ?? 0);
        if ($maximum <= 0) return null;

        // Prefer the thresholds and points in this evaluation's immutable HR criteria snapshot.
        $options = array_values(array_filter((array) ($serviceCategory['options'] ?? []), static fn(array $option): bool =>
            strtoupper((string) ($option['option_group_code'] ?? '')) === 'YEARS' && (int) ($option['is_active'] ?? 1) === 1
        ));
        $points = 0.0;
        if ($options !== []) {
            foreach ($options as $option) {
                $label = trim((string) ($option['label'] ?? ''));
                if (preg_match('/^(\d+)\s*\+?$/', $label, $matches) !== 1 || (int) $matches[1] > max(0, $years)) continue;
                $points = max($points, (float) ($option['points'] ?? 0));
            }
        } else {
            // The published Faculty Table C.3 rule is one point per two full years.
            $points = floor(max(0, $years) / 2);
        }

        return [
            'category_code' => $serviceCode,
            'area_code' => $serviceArea,
            'years' => max(0, $years),
            'points' => min($maximum, max(0.0, $points)),
            'maximum_points' => $maximum,
            'area_maximum_points' => $serviceAreaMaximum,
            'rule' => '1 point per 2 completed years, up to the criterion maximum',
        ];
    }

    private static function levelPoints(array $levels, ?string $level): float
    {
        foreach ($levels as $row) if (($row['level'] ?? null) === $level) return (float) $row['points'];
        return 0.0;
    }

    private static function levelUnits(array $levels, ?string $level): int
    {
        foreach ($levels as $row) if (($row['level'] ?? null) === $level) return (int) $row['units'];
        return 0;
    }

    private static function decode(mixed $value): array
    {
        if (is_array($value)) return $value;
        if (! is_string($value)) return [];
        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : [];
    }
}
