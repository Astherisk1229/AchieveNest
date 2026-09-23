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

    public function resolve(array $snapshot, string $categoryCode, array $metadata): array
    {
        $category = $this->findCategory($snapshot, $categoryCode);
        if ($category === null) throw new RuntimeException("CRITERION_MAPPING_INVALID: {$categoryCode} is not part of the locked criteria version.");
        if ((int) ($category['requires_manual_hr_rule'] ?? 0) === 1 && empty($category['subcategories']) && empty($category['options'])) {
            throw new RuntimeException("CRITERION_CONFIGURATION_INCOMPLETE: {$categoryCode} has no locked automatic point rule.");
        }
        $details = is_array($metadata['details'] ?? null) ? $metadata['details'] : [];
        $submittedSubtype = strtoupper(trim((string) ($metadata['subcategory_code'] ?? '')));
        $subcategoryCode = self::SUBCATEGORY_MAP[$submittedSubtype] ?? null;
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
