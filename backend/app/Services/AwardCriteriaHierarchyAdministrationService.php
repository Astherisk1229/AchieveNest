<?php

namespace App\Services;

use RuntimeException;

/** Versioned OSAD Category → Subcategory → optional Level configuration. */
final class AwardCriteriaHierarchyAdministrationService
{
    private $db;

    public function __construct($db = null)
    {
        $this->db = $db ?? db_connect();
    }

    public function get(string $awardId): array
    {
        $award = $this->award($awardId);
        $versions = $this->db->table('award_scoring_model_versions')->where('award_definition_id', $awardId)
            ->orderBy('created_at', 'DESC')->get()->getResultArray();
        foreach ($versions as &$version) {
            $version['hierarchy'] = $this->decodeHierarchy($version['hierarchy_config'] ?? null)
                ?? $this->fromScoringRows($awardId, $version['id']);
        }
        unset($version);
        return ['award' => $award, 'active_version_id' => $award['active_hierarchy_version_id'] ?? null, 'versions' => $versions];
    }

    public function createDraft(string $awardId, array $input, string $actorId): array
    {
        $award = $this->award($awardId);
        $number = trim((string) ($input['version_number'] ?? ''));
        $reason = trim((string) ($input['change_reason'] ?? ''));
        $effectiveDate = trim((string) ($input['effective_date'] ?? ''));
        if ($number === '' || strlen($number) > 20 || $reason === '' || $effectiveDate === '') {
            throw new RuntimeException('VERSION_METADATA_REQUIRED');
        }
        if ($this->db->table('award_scoring_model_versions')->where('award_definition_id', $awardId)->where('version_number', $number)->countAllResults() > 0) {
            throw new RuntimeException('VERSION_NUMBER_EXISTS');
        }

        $sourceId = (string) ($award['active_hierarchy_version_id'] ?? '');
        if ($sourceId === '') {
            $sourceId = (string) ($this->db->table('award_scoring_model_versions')->select('id')->where('award_definition_id', $awardId)
                ->where('version_number', $award['active_scoring_version'] ?? '1.0')->where('status', 'published')->get()->getRowArray()['id'] ?? '');
        }
        if ($sourceId === '') {
            throw new RuntimeException('PUBLISHED_SOURCE_VERSION_NOT_FOUND');
        }
        $source = $this->db->table('award_scoring_model_versions')->where('id', $sourceId)->where('award_definition_id', $awardId)->get()->getRowArray();
        if ($source === null || ($source['status'] ?? '') !== 'published') {
            throw new RuntimeException('PUBLISHED_SOURCE_VERSION_NOT_FOUND');
        }
        $hierarchy = $this->decodeHierarchy($source['hierarchy_config'] ?? null) ?? $this->fromScoringRows($awardId, $sourceId);
        $id = $this->uuid();
        $this->db->table('award_scoring_model_versions')->insert([
            'id' => $id, 'award_definition_id' => $awardId, 'award_cycle_id' => $source['award_cycle_id'] ?? null,
            'version_number' => $number, 'version_label' => trim((string) ($input['version_label'] ?? ($award['name'] . ' v' . $number))),
            'status' => 'draft', 'candidate_threshold_percent' => $source['candidate_threshold_percent'],
            'graduating_only' => $source['graduating_only'], 'gender_requirement' => $source['gender_requirement'],
            'authority_status' => $source['authority_status'], 'hierarchy_config' => json_encode($hierarchy, JSON_THROW_ON_ERROR),
            'change_reason' => $reason, 'effective_date' => $effectiveDate, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s'),
        ]);
        return $this->version($awardId, $id);
    }

    public function saveDraft(string $awardId, string $versionId, array $hierarchy): array
    {
        $this->draft($awardId, $versionId);
        $this->db->table('award_scoring_model_versions')->where('id', $versionId)->update([
            'hierarchy_config' => json_encode($hierarchy, JSON_THROW_ON_ERROR), 'updated_at' => date('Y-m-d H:i:s'),
        ]);
        return $this->version($awardId, $versionId);
    }

    public function validate(string $awardId, string $versionId): array
    {
        $version = $this->version($awardId, $versionId);
        $errors = self::validateHierarchy($version['hierarchy']);
        if (empty($version['effective_date'])) $errors[] = 'Effective date is required.';
        if (trim((string) ($version['change_reason'] ?? '')) === '') $errors[] = 'Change reason is required.';
        return ['valid' => $errors === [], 'errors' => $errors];
    }

    public function publish(string $awardId, string $versionId, string $actorId): array
    {
        $this->draft($awardId, $versionId);
        $validation = $this->validate($awardId, $versionId);
        if (! $validation['valid']) throw new RuntimeException('HIERARCHY_VALIDATION_FAILED:' . implode(' ', $validation['errors']));
        $this->db->transBegin();
        try {
            $this->db->table('award_scoring_model_versions')->where('id', $versionId)->where('award_definition_id', $awardId)->update([
                'status' => 'published', 'published_at' => date('Y-m-d H:i:s'), 'published_by' => $actorId, 'updated_at' => date('Y-m-d H:i:s'),
            ]);
            $this->db->table('award_definitions')->where('id', $awardId)->update(['active_hierarchy_version_id' => $versionId]);
            $this->db->transCommit();
        } catch (\Throwable $e) {
            $this->db->transRollback();
            throw $e;
        }
        return $this->version($awardId, $versionId);
    }

    public static function validateHierarchy(array $hierarchy): array
    {
        $errors = [];
        $categories = $hierarchy['categories'] ?? null;
        if (! is_array($categories) || $categories === []) return ['Add at least one Category.'];
        foreach ($categories as $ci => $category) {
            $path = 'Category ' . ($ci + 1);
            if (trim((string) ($category['name'] ?? '')) === '') $errors[] = "{$path}: name is required.";
            if (! is_numeric($category['cut_off_points'] ?? null) || (float) $category['cut_off_points'] < 0) $errors[] = "{$path}: Cut-off Points must be a non-negative number.";
            $subs = $category['subcategories'] ?? null;
            if (! is_array($subs) || $subs === []) { $errors[] = "{$path}: add at least one Subcategory."; continue; }
            foreach ($subs as $si => $sub) {
                $subPath = $path . ', Subcategory ' . ($si + 1);
                if (trim((string) ($sub['name'] ?? '')) === '') $errors[] = "{$subPath}: name is required.";
                if (! is_numeric($sub['points'] ?? null) || (float) $sub['points'] < 0) $errors[] = "{$subPath}: Points must be a non-negative number.";
                foreach (($sub['levels'] ?? []) as $li => $level) {
                    $levelPath = $subPath . ', Level ' . ($li + 1);
                    if (trim((string) ($level['name'] ?? '')) === '') $errors[] = "{$levelPath}: name is required.";
                    if (! is_numeric($level['points'] ?? null) || (float) $level['points'] < 0) $errors[] = "{$levelPath}: Points must be a non-negative number.";
                }
            }
        }
        return $errors;
    }

    /** Filters inactive definitions only for a current selection contract; persisted version JSON stays intact. */
    public static function activeForNewChoices(array $hierarchy): array
    {
        $categories = [];
        foreach (($hierarchy['categories'] ?? []) as $category) {
            if (empty($category['active'])) continue;
            $subcategories = [];
            foreach (($category['subcategories'] ?? []) as $subcategory) {
                if (empty($subcategory['active'])) continue;
                $subcategory['levels'] = array_values(array_filter($subcategory['levels'] ?? [], static fn(array $level): bool => ! empty($level['active'])));
                $subcategories[] = $subcategory;
            }
            $category['subcategories'] = $subcategories;
            $categories[] = $category;
        }
        return ['categories' => $categories];
    }

    private function fromScoringRows(string $awardId, string $versionId): array
    {
        $categories = $this->db->table('award_criteria')->where('award_definition_id', $awardId)->where('scoring_model_version_id', $versionId)->orderBy('sort_order')->get()->getResultArray();
        $rows = [];
        foreach ($categories as $i => $category) {
            $subs = $this->db->table('award_criterion_components')->where('criterion_id', $category['id'])->orderBy('sort_order')->get()->getResultArray();
            $rows[] = ['id' => $category['id'], 'code' => $category['code'], 'name' => $category['name'], 'cut_off_points' => (float) $category['max_points'], 'active' => (bool) ($category['is_published'] ?? true), 'order' => (int) ($category['sort_order'] ?? $i + 1), 'subcategories' => array_map(static fn(array $sub, int $j): array => ['id' => $sub['id'], 'code' => $sub['code'], 'name' => $sub['name'], 'points' => (float) $sub['max_points'], 'active' => true, 'order' => (int) ($sub['sort_order'] ?? $j + 1), 'levels' => []], $subs, array_keys($subs))];
        }
        return ['categories' => $rows];
    }

    private function award(string $id): array { $row = $this->db->table('award_definitions')->where('id', $id)->get()->getRowArray(); if ($row === null) throw new RuntimeException('AWARD_NOT_FOUND'); return $row; }
    private function draft(string $awardId, string $versionId): array { $row = $this->db->table('award_scoring_model_versions')->where('id', $versionId)->where('award_definition_id', $awardId)->get()->getRowArray(); if ($row === null) throw new RuntimeException('VERSION_NOT_FOUND'); if (($row['status'] ?? '') !== 'draft') throw new RuntimeException('PUBLISHED_VERSION_IMMUTABLE'); return $row; }
    private function version(string $awardId, string $id): array { $row = $this->db->table('award_scoring_model_versions')->where('id', $id)->where('award_definition_id', $awardId)->get()->getRowArray(); if ($row === null) throw new RuntimeException('VERSION_NOT_FOUND'); $row['hierarchy'] = $this->decodeHierarchy($row['hierarchy_config'] ?? null) ?? $this->fromScoringRows($awardId, $id); return $row; }
    private function decodeHierarchy($json): ?array { if (is_array($json)) return $json; if (! is_string($json) || $json === '') return null; $decoded = json_decode($json, true); return is_array($decoded) ? $decoded : null; }
    private function uuid(): string { $d = random_bytes(16); $d[6] = chr((ord($d[6]) & 0x0f) | 0x40); $d[8] = chr((ord($d[8]) & 0x3f) | 0x80); return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4)); }
}
