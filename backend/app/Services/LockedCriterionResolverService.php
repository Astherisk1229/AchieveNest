<?php

namespace App\Services;

use RuntimeException;

final class LockedCriterionResolverService
{
    private const SUBCATEGORY_MAP = [
        'A1_PHD_HOLDER' => 'A.1.1', 'A1_PHD_UNITS' => 'A.1.2', 'A1_MA_HOLDER' => 'A.1.3', 'A1_MA_UNITS' => 'A.1.4',
        'A2_MEMBERSHIP' => 'A.2.1', 'A2_REGULAR_MEMBER' => 'A.2.1',
        'C1_MODERATOR' => 'C.1.1', 'C1_COACH' => 'C.1.2', 'C1_COMMITTEE' => 'C.1.3', 'C1_SERVICE' => 'C.1.4',
        'C2_CHURCH' => 'C.2.1', 'C2_CIVIC' => 'C.2.2', 'C2_CHARITY' => 'C.2.3',
    ];
    private const CONTRACT_CRITERION_MAP = [
        'NTF-B1A' => [
            'personnel_group' => 'NON_TEACHING_FACULTY',
            'criterion_code' => 'B.1.a',
            'category_code' => 'B.1',
            'subcategory_code' => 'B.1.1',
        ],
        // Remaining Appendix N contracts: lettered form codes map to the numbered locked subcategories.
        'NTF-B1B' => ['personnel_group' => 'NON_TEACHING_FACULTY', 'criterion_code' => 'B.1.b', 'category_code' => 'B.1', 'subcategory_code' => 'B.1.2'],
        'NTF-B1C' => ['personnel_group' => 'NON_TEACHING_FACULTY', 'criterion_code' => 'B.1.c', 'category_code' => 'B.1', 'subcategory_code' => 'B.1.3'],
        'NTF-B1D' => ['personnel_group' => 'NON_TEACHING_FACULTY', 'criterion_code' => 'B.1.d', 'category_code' => 'B.1', 'subcategory_code' => 'B.1.4'],
        'NTF-B2A' => ['personnel_group' => 'NON_TEACHING_FACULTY', 'criterion_code' => 'B.2.a', 'category_code' => 'B.2', 'subcategory_code' => 'B.2.1'],
        'NTF-B2B' => ['personnel_group' => 'NON_TEACHING_FACULTY', 'criterion_code' => 'B.2.b', 'category_code' => 'B.2', 'subcategory_code' => 'B.2.2'],
        'NTF-B2C' => ['personnel_group' => 'NON_TEACHING_FACULTY', 'criterion_code' => 'B.2.c', 'category_code' => 'B.2', 'subcategory_code' => 'B.2.3'],
        'NTF-B4'  => ['personnel_group' => 'NON_TEACHING_FACULTY', 'criterion_code' => 'B.4', 'category_code' => 'B.4', 'subcategory_code' => 'B.4.1'],
        // B.5 has no official point breakdown: the evaluator awards points (up to the category cap).
        'NTF-B5'  => ['personnel_group' => 'NON_TEACHING_FACULTY', 'criterion_code' => 'B.5', 'category_code' => 'B.5', 'subcategory_code' => null, 'evaluator_judgment' => true],
    ];

    public function resolve(array $snapshot, string $categoryCode, array $metadata): array
    {
        $contractCode = strtoupper(trim((string) ($metadata['contract_code'] ?? '')));
        $contractMapping = self::CONTRACT_CRITERION_MAP[$contractCode] ?? null;
        $forcedSubcategoryCode = null;
        if ($contractMapping !== null) {
            $snapshotGroup = strtoupper(trim((string) ($snapshot['sheet']['applies_to'] ?? '')));
            if ($snapshotGroup !== $contractMapping['personnel_group']
                || strcasecmp($categoryCode, $contractMapping['criterion_code']) !== 0) {
                throw new RuntimeException("CRITERION_MAPPING_INVALID: {$categoryCode} does not match {$contractCode} in this locked criteria version.");
            }
            $categoryCode = $contractMapping['category_code'];
            $forcedSubcategoryCode = $contractMapping['subcategory_code'];
        }
        $category = $this->findCategory($snapshot, $categoryCode);
        if ($category === null) throw new RuntimeException("CRITERION_MAPPING_INVALID: {$categoryCode} is not part of the locked criteria version.");
        if (($contractMapping['evaluator_judgment'] ?? false) === true) {
            $cap = (float) ($category['max_points'] ?? 0);
            if ($cap <= 0) throw new RuntimeException("CRITERION_POINTS_UNRESOLVED: {$categoryCode} has no locked maximum.");
            return ['criterion_reference' => $contractMapping['criterion_code'], 'category' => $category, 'level' => null, 'configured_points' => $cap, 'criterion_cap' => $cap, 'evaluator_judgment_required' => true];
        }
        if ((int) ($category['requires_manual_hr_rule'] ?? 0) === 1 && empty($category['subcategories']) && empty($category['options'])) {
            throw new RuntimeException("CRITERION_CONFIGURATION_INCOMPLETE: {$categoryCode} has no locked automatic point rule.");
        }
        $details = is_array($metadata['details'] ?? null) ? $metadata['details'] : [];
        $submittedSubtype = strtoupper(trim((string) ($metadata['subcategory_code'] ?? '')));
        $subcategoryCode = $forcedSubcategoryCode ?? self::SUBCATEGORY_MAP[$submittedSubtype] ?? null;
        if ($categoryCode === 'A.2' && preg_match('/officer|president|chair|director/i', (string) ($details['membership_role'] ?? ''))) $subcategoryCode = 'A.2.2';
        if ($subcategoryCode !== null) {
            foreach ($category['subcategories'] ?? [] as $row) {
                if (strcasecmp((string) ($row['subcategory_code'] ?? ''), $subcategoryCode) === 0) {
                    return $this->result($category, $row, (float) ($row['default_points'] ?? 0), $subcategoryCode);
                }
            }
        }

        $points = match ($categoryCode) {
            'A.3' => $this->option($category, 'LEVEL', $this->scopeCode($details['scope'] ?? $metadata['scope_level'] ?? '')),
            'B.1' => $this->option($category, 'ROLE', preg_match('/judge|evaluator/i', (string) ($details['role'] ?? '')) ? 'JUDGE' : 'LECTURER')
                + $this->option($category, 'EXTENT', $this->extentCode($details['extent'] ?? ''))
                + $this->option($category, 'PARTICIPANTS', $this->scopeCode($details['scope'] ?? $metadata['scope_level'] ?? ''))
                + $this->option($category, 'SPONSOR', preg_match('/ndmu|notre dame/i', (string) ($details['organizer'] ?? $metadata['organizer'] ?? '')) ? 'NDMU' : 'EXTERNAL'),
            'B.2' => $this->option($category, 'TYPE', $this->publicationType($details['publication_type'] ?? ''))
                + $this->option($category, 'SCOPE', $this->scopeCode($details['scope'] ?? $metadata['scope_level'] ?? '')),
            'B.4' => $this->option($category, preg_match('/nomin/i', (string) ($details['recognition_status'] ?? '')) ? 'NOMINEE' : 'AWARDEE', $this->awardScope($details['scope'] ?? $metadata['scope_level'] ?? '')),
            'B.5' => $this->option($category, 'MATERIAL_TYPE', $this->materialType($details['material_type'] ?? '')),
            default => throw new RuntimeException("CRITERION_LEVEL_REQUIRED: {$categoryCode} claim does not identify a resolvable locked level or subtype."),
        };
        return $this->result($category, null, $points, $submittedSubtype ?: $categoryCode);
    }

    private function result(array $category, ?array $level, float $points, string $reference): array
    {
        if ($points <= 0) throw new RuntimeException('CRITERION_POINTS_UNRESOLVED: Locked configured points could not be determined.');
        return ['criterion_reference' => $reference, 'category' => $category, 'level' => $level, 'configured_points' => $points, 'criterion_cap' => (float) ($category['max_points'] ?? $points)];
    }
    private function findCategory(array $snapshot, string $code): ?array { foreach ($snapshot['areas'] ?? [] as $area) foreach ($area['categories'] ?? [] as $category) if (strcasecmp((string) ($category['category_code'] ?? ''), $code) === 0) return $category + ['area_code' => $area['area_code'] ?? null, 'area_max_points' => $area['max_points'] ?? null]; return null; }
    private function option(array $category, string $group, string $code): float { foreach ($category['options'] ?? [] as $row) if (strcasecmp((string) ($row['option_group_code'] ?? ''), $group) === 0 && strcasecmp((string) ($row['option_code'] ?? ''), $code) === 0) return (float) ($row['points'] ?? 0); throw new RuntimeException("CRITERION_OPTION_INVALID: {$group}/{$code} is not configured in the locked criterion."); }
    private function scopeCode(mixed $value): string { $v=strtoupper((string)$value); return str_contains($v,'INTERNATIONAL')?'INTERNATIONAL':(str_contains($v,'NATIONAL')?'NATIONAL':(str_contains($v,'REGION')?'REGIONAL':(preg_match('/CITY|PROV/', $v)?'CITY_PROV':'IN_HOUSE'))); }
    private function awardScope(mixed $value): string { $v=$this->scopeCode($value); return in_array($v,['INTERNATIONAL','NATIONAL'],true)?$v:(in_array($v,['REGIONAL','CITY_PROV'],true)?'PROV_REGIONAL':'LOCAL'); }
    private function extentCode(mixed $value): string { $v=strtoupper((string)$value); return preg_match('/>\s*2|MORE THAN 2|3 DAY/', $v)?'GT_2_DAYS':(str_contains($v,'2 DAY')?'2_DAYS':(str_contains($v,'1 DAY')||str_contains($v,'WHOLE')?'1_DAY':(str_contains($v,'HALF')?'HALF_DAY':'1_HOUR'))); }
    private function publicationType(mixed $value): string { $v=strtoupper(str_replace([' ','-'],'_',trim((string)$value))); foreach(['RESEARCH_OUTPUT','SCHOLARLY_PAPER','COMMENTARY','COMPILATION','MONOGRAPH','REVIEWS','ARTICLE','BOOK'] as $code) if(str_contains($v,$code))return $code; throw new RuntimeException('CRITERION_LEVEL_REQUIRED: Publication type is not recognized by the locked criterion.'); }
    private function materialType(mixed $value): string { $v=strtoupper((string)$value); return str_contains($v,'AUDIO')?'AUDIO_VISUAL':(str_contains($v,'MODULE')?'MODULES':(str_contains($v,'REVIEW')?'REVIEWERS':'BOUND_WORKBOOKS')); }
}
