<?php

namespace App\Services;

use RuntimeException;

/** OSAD category, subcategory and optional level choices for award intake. */
final class AwardCriteriaHierarchyAdministrationService
{
    private $db;

    public function __construct($db = null)
    {
        $this->db = $db ?? db_connect();
    }

    /** Return the current editable hierarchy without exposing criteria-version management. */
    public function get(string $awardId): array
    {
        $award = $this->award($awardId);
        $version = $this->currentHierarchyVersion($award);
        if ($version === null) {
            throw new RuntimeException('CURRENT_HIERARCHY_NOT_FOUND');
        }

        return [
            'award' => ['id' => $award['id'], 'name' => $award['name']],
            'hierarchy' => $this->decodeHierarchy($version['hierarchy_config'] ?? null)
                ?? $this->fromScoringRows($awardId, $version['id']),
        ];
    }

    /** Save category choices directly to the current hierarchy; scoring rules are untouched. */
    public function saveCurrent(string $awardId, array $hierarchy): array
    {
        $award = $this->award($awardId);
        $version = $this->currentHierarchyVersion($award);
        if ($version === null) {
            throw new RuntimeException('CURRENT_HIERARCHY_NOT_FOUND');
        }

        $errors = self::validateHierarchy($hierarchy);
        if ($errors !== []) {
            throw new RuntimeException('HIERARCHY_VALIDATION_FAILED:' . json_encode($errors, JSON_THROW_ON_ERROR));
        }

        $this->db->transBegin();
        try {
            $this->db->table('award_scoring_model_versions')
                ->where('id', $version['id'])
                ->where('award_definition_id', $awardId)
                ->where('status', 'published')
                ->update([
                    'hierarchy_config' => json_encode($hierarchy, JSON_THROW_ON_ERROR),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
            if ((string) ($award['active_hierarchy_version_id'] ?? '') !== (string) $version['id']) {
                $this->db->table('award_definitions')->where('id', $awardId)->update([
                    'active_hierarchy_version_id' => $version['id'],
                ]);
            }
            if ($this->db->transStatus() === false) {
                throw new RuntimeException('HIERARCHY_SAVE_FAILED');
            }
            $this->db->transCommit();
        } catch (\Throwable $e) {
            $this->db->transRollback();
            throw $e;
        }

        return $this->get($awardId);
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

    /** Remove inactive definitions only when exposing choices for new submissions. */
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

    private function currentHierarchyVersion(array $award): ?array
    {
        $awardId = (string) $award['id'];
        $activeId = trim((string) ($award['active_hierarchy_version_id'] ?? ''));
        if ($activeId !== '') {
            $current = $this->db->table('award_scoring_model_versions')
                ->where('id', $activeId)->where('award_definition_id', $awardId)->where('status', 'published')
                ->get()->getRowArray();
            if ($current !== null) return $current;
        }

        $query = $this->db->table('award_scoring_model_versions')
            ->where('award_definition_id', $awardId)->where('status', 'published');
        $scoringVersion = trim((string) ($award['active_scoring_version'] ?? ''));
        if ($scoringVersion !== '') $query->where('version_number', $scoringVersion);
        else $query->orderBy('created_at', 'DESC');
        return $query->get()->getRowArray() ?: null;
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

    private function award(string $id): array
    {
        $row = $this->db->table('award_definitions')->where('id', $id)->get()->getRowArray();
        if ($row === null) throw new RuntimeException('AWARD_NOT_FOUND');
        return $row;
    }

    private function decodeHierarchy($json): ?array
    {
        if (is_array($json)) return $json;
        if (! is_string($json) || $json === '') return null;
        $decoded = json_decode($json, true);
        return is_array($decoded) ? $decoded : null;
    }
}
