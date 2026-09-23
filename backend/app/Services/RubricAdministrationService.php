<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use Config\Database;
use RuntimeException;
use Throwable;

class RubricAdministrationService
{
    public function listScalesWithVersions(): array
    {
        $db = Database::connect();
        $scales = $db->table('evaluation_scales')->orderBy('created_at', 'ASC')->get()->getResultArray();

        return array_map(function (array $scale) use ($db): array {
            $versions = $db->table('evaluation_scale_versions')
                ->where('scale_id', $scale['id'])
                ->orderBy('created_at', 'DESC')
                ->orderBy('version_number', 'DESC')
                ->get()->getResultArray();

            return [
                'id' => $scale['id'],
                'scale_code' => $scale['scale_code'],
                'title' => $scale['title'],
                'description' => $scale['description'],
                'personnel_group' => $scale['personnel_group'] ?? null,
                'total_points' => (float) $scale['total_points'],
                'passing_score' => (float) $scale['passing_score'],
                'versions' => array_map(fn (array $version): array => $this->versionSummary($db, $version), $versions),
            ];
        }, $scales);
    }

    public function getScaleVersionHierarchy(string $versionId): array
    {
        $db = Database::connect();
        $version = $db->table('evaluation_scale_versions v')
            ->select('v.*, s.scale_code, s.title, s.description, s.personnel_group, s.total_points, s.passing_score AS sheet_passing_score')
            ->join('evaluation_scales s', 's.id=v.scale_id')
            ->where('v.id', $versionId)->get()->getRowArray();
        if (! $version) throw new RuntimeException('Ranking criteria version not found.', 404);

        $areas = $db->table('evaluation_scale_areas')->where('scale_version_id', $versionId)->orderBy('display_order')->get()->getResultArray();
        foreach ($areas as &$area) {
            $categories = $db->table('evaluation_scale_categories')->where('scale_area_id', $area['id'])->orderBy('display_order')->get()->getResultArray();
            foreach ($categories as &$category) {
                $category['subcategories'] = $db->table('evaluation_scale_subcategories')->where('scale_category_id', $category['id'])->orderBy('display_order')->get()->getResultArray();
                $category['criteria'] = $db->table('evaluation_scale_criteria')->where('scale_category_id', $category['id'])->orderBy('criterion_code')->get()->getResultArray();
                $category['options'] = $db->tableExists('evaluation_scale_criterion_options') ? $db->table('evaluation_scale_criterion_options')->where('scale_category_id', $category['id'])->orderBy('option_group_code')->orderBy('display_order')->get()->getResultArray() : [];
            }
            $area['categories'] = $categories;
        }

        return [
            'sheet' => ['id'=>$version['scale_id'], 'code'=>$version['scale_code'], 'name'=>$version['title'], 'description'=>$version['description'], 'applies_to'=>$version['personnel_group'], 'overall_max_points'=>(float)$version['total_max_points'], 'passing_score'=>(float)$version['passing_score']],
            'version' => $this->versionSummary($db, $version),
            'areas' => $areas,
        ];
    }

    public function findActiveCriteriaForPersonnelGroup(string $personnelGroup): array
    {
        $group = strtoupper(trim($personnelGroup));
        if (! in_array($group, ['FACULTY', 'NON_TEACHING_FACULTY'], true)) throw new RuntimeException('INVALID_PERSONNEL_GROUP', 422);
        $rows = Database::connect()->table('evaluation_scale_versions v')->select('v.id')->join('evaluation_scales s', 's.id=v.scale_id')->where('s.personnel_group', $group)->where('v.status', 'approved')->get()->getResultArray();
        if (! $rows) throw new RuntimeException('CRITERIA_NOT_CONFIGURED', 404);
        if (count($rows) > 1) throw new RuntimeException('MULTIPLE_ACTIVE_CRITERIA', 409);
        return $this->getScaleVersionHierarchy($rows[0]['id']);
    }

    public function cloneVersion(string $sourceVersionId, array $input, string $actorUserId): array
    {
        $versionNumber = trim((string) ($input['version_number'] ?? ''));
        $reason = trim((string) ($input['change_reason'] ?? ''));
        if ($versionNumber === '' || mb_strlen($versionNumber) > 32) throw new RuntimeException('Enter a version number of up to 32 characters.', 422);
        if (mb_strlen($reason) < 10) throw new RuntimeException('Explain the reason for this version in at least 10 characters.', 422);

        $db = Database::connect();
        $db->transBegin();
        try {
            $source = $db->query('SELECT * FROM evaluation_scale_versions WHERE id = ? FOR UPDATE', [$sourceVersionId])->getRowArray();
            if (! $source) throw new RuntimeException('Source criteria version not found.', 404);
            $duplicate = $db->table('evaluation_scale_versions')->where('scale_id', $source['scale_id'])->where('version_number', $versionNumber)->countAllResults();
            if ($duplicate > 0) throw new RuntimeException('That version number already exists for this criteria sheet.', 409);

            $now = date('Y-m-d H:i:s');
            $newVersionId = $this->newId('esv');
            $version = $source;
            foreach (['id', 'approved_by_user_id', 'approved_at'] as $field) unset($version[$field]);
            $version = array_merge($version, [
                'id'=>$newVersionId, 'version_number'=>$versionNumber, 'status'=>'draft',
                'effective_start_date'=>$input['effective_start_date'] ?? null,
                'effective_end_date'=>null, 'created_at'=>$now, 'updated_at'=>$now,
            ]);
            $this->setIfField($db, 'evaluation_scale_versions', $version, 'change_reason', $reason);
            $this->setIfField($db, 'evaluation_scale_versions', $version, 'change_summary', trim((string)($input['change_summary'] ?? '')) ?: null);
            $this->setIfField($db, 'evaluation_scale_versions', $version, 'source_type', 'HR_REVISION');
            $this->setIfField($db, 'evaluation_scale_versions', $version, 'created_by_user_id', $actorUserId);
            $db->table('evaluation_scale_versions')->insert($version);

            $areas = $db->table('evaluation_scale_areas')->where('scale_version_id', $sourceVersionId)->orderBy('display_order')->get()->getResultArray();
            foreach ($areas as $area) {
                $oldAreaId = $area['id'];
                $area['id'] = $this->newId('esa'); $area['scale_version_id'] = $newVersionId; $area['created_at'] = $now; $area['updated_at'] = $now;
                $db->table('evaluation_scale_areas')->insert($area);
                $categories = $db->table('evaluation_scale_categories')->where('scale_area_id', $oldAreaId)->orderBy('display_order')->get()->getResultArray();
                foreach ($categories as $category) {
                    $oldCategoryId = $category['id'];
                    $category['id'] = $this->newId('esc'); $category['scale_area_id'] = $area['id']; $category['created_at'] = $now; $category['updated_at'] = $now;
                    $db->table('evaluation_scale_categories')->insert($category);
                    $subcategoryMap = [];
                    foreach ($db->table('evaluation_scale_subcategories')->where('scale_category_id', $oldCategoryId)->orderBy('display_order')->get()->getResultArray() as $subcategory) {
                        $oldSubcategoryId = $subcategory['id'];
                        $subcategory['id'] = $this->newId('ess'); $subcategory['scale_category_id'] = $category['id']; $subcategory['created_at'] = $now; $subcategory['updated_at'] = $now;
                        $db->table('evaluation_scale_subcategories')->insert($subcategory);
                        $subcategoryMap[$oldSubcategoryId] = $subcategory['id'];
                    }
                    foreach ($db->table('evaluation_scale_criteria')->where('scale_category_id', $oldCategoryId)->orderBy('criterion_code')->get()->getResultArray() as $criterion) {
                        $criterion['id'] = $this->newId('esr'); $criterion['scale_category_id'] = $category['id'];
                        if ($criterion['scale_subcategory_id'] ?? null) $criterion['scale_subcategory_id'] = $subcategoryMap[$criterion['scale_subcategory_id']] ?? null;
                        $criterion['created_at'] = $now; $criterion['updated_at'] = $now;
                        $db->table('evaluation_scale_criteria')->insert($criterion);
                    }
                    if ($db->tableExists('evaluation_scale_criterion_options')) foreach ($db->table('evaluation_scale_criterion_options')->where('scale_category_id', $oldCategoryId)->orderBy('display_order')->get()->getResultArray() as $option) {
                        $option['id']=$this->newId('eso'); $option['scale_category_id']=$category['id']; $option['created_at']=$now; $option['updated_at']=$now;
                        $db->table('evaluation_scale_criterion_options')->insert($option);
                    }
                }
            }
            $this->audit($db, $newVersionId, 'version_created', $actorUserId, $reason, null, ['source_version_id'=>$sourceVersionId, 'version_number'=>$versionNumber, 'status'=>'draft'], $now);
            if ($db->transStatus() === false) throw new RuntimeException('Unable to clone the criteria version.', 500);
            $db->transCommit();
            return ['version_id'=>$newVersionId, 'status'=>'draft', 'message'=>'Draft criteria version created.'];
        } catch (Throwable $error) {
            $db->transRollback();
            throw $error;
        }
    }

    public function approveVersion(string $versionId, string $actorUserId, string $reason): array
    {
        $db = Database::connect();
        $db->transBegin();
        try {
            $version = $db->query('SELECT * FROM evaluation_scale_versions WHERE id = ? FOR UPDATE', [$versionId])->getRowArray();
            if (! $version) throw new RuntimeException("Scale version [{$versionId}] not found.", 404);
            if ($version['status'] !== 'draft') throw new RuntimeException('Only a draft criteria version can be published.', 409);
            $db->query('SELECT id FROM evaluation_scales WHERE id = ? FOR UPDATE', [$version['scale_id']]);
            $this->validateDraft($db, $version);

            $now = date('Y-m-d H:i:s');
            $activeVersions = $db->table('evaluation_scale_versions')->where('scale_id', $version['scale_id'])->where('status', 'approved')->get()->getResultArray();
            foreach ($activeVersions as $active) {
                $after = array_merge($active, ['status'=>'retired', 'effective_end_date'=>$version['effective_start_date'] ?: date('Y-m-d'), 'updated_at'=>$now]);
                $db->table('evaluation_scale_versions')->where('id', $active['id'])->update(['status'=>'retired', 'effective_end_date'=>$after['effective_end_date'], 'updated_at'=>$now]);
                $this->audit($db, $active['id'], 'version_superseded', $actorUserId, $reason, $active, $after, $now);
            }

            $after = array_merge($version, ['status'=>'approved', 'approved_by_user_id'=>$actorUserId, 'approved_at'=>$now, 'updated_at'=>$now]);
            $db->table('evaluation_scale_versions')->where('id', $versionId)->update(['status'=>'approved', 'approved_by_user_id'=>$actorUserId, 'approved_at'=>$now, 'updated_at'=>$now]);
            $this->audit($db, $versionId, 'version_published', $actorUserId, $reason, $version, $after, $now);
            if ($db->transStatus() === false) throw new RuntimeException('Unable to publish the criteria version.', 500);
            $db->transCommit();
            return ['version_id'=>$versionId, 'status'=>'approved', 'approved_at'=>$now, 'superseded_version_ids'=>array_column($activeVersions, 'id'), 'message'=>'Criteria version published successfully.'];
        } catch (Throwable $error) {
            $db->transRollback();
            throw $error;
        }
    }

    public function validateVersion(string $versionId): array
    {
        $db = Database::connect();
        $version = $db->table('evaluation_scale_versions')->where('id', $versionId)->get()->getRowArray();
        if (! $version) throw new RuntimeException('Criteria version not found.', 404);
        $blocking = [];
        try { $this->validateDraft($db, $version); } catch (RuntimeException $error) { $blocking[] = ['code'=>'VERSION_NOT_READY', 'message'=>$error->getMessage()]; }
        return ['status'=>$blocking ? 'VALIDATION_FAILED' : 'READY_TO_PUBLISH', 'blocking_errors'=>$blocking, 'warnings'=>[], 'informational_notes'=>[$blocking ? 'Correct the blocking issue and validate again.' : 'All publication checks passed.']];
    }

    public function saveDraft(string $versionId, array $input, string $actorUserId): array
    {
        $db = Database::connect(); $db->transBegin();
        try {
            $version = $db->query('SELECT * FROM evaluation_scale_versions WHERE id = ? FOR UPDATE', [$versionId])->getRowArray();
            if (! $version) throw new RuntimeException('Criteria version not found.', 404);
            if ($version['status'] !== 'draft') throw new RuntimeException('Only draft criteria versions can be edited.', 409);
            $expected = (string)($input['expected_updated_at'] ?? '');
            if ($expected !== '' && $expected !== (string)$version['updated_at']) throw new RuntimeException('This draft has been updated by another user. Refresh and review the latest version before saving.', 409);
            $now = date('Y-m-d H:i:s');
            $versionPatch = ['updated_at'=>$now];
            foreach (['total_max_points','passing_score'] as $field) if (array_key_exists($field, $input)) $versionPatch[$field] = max(0, (float)$input[$field]);
            foreach (['effective_start_date','change_reason','change_summary'] as $field) if (array_key_exists($field, $input) && $db->fieldExists($field, 'evaluation_scale_versions')) $versionPatch[$field] = trim((string)$input[$field]) ?: null;
            $db->table('evaluation_scale_versions')->where('id', $versionId)->update($versionPatch);

            $this->updateOwnedRows($db, 'evaluation_scale_areas', 'scale_version_id', $versionId, $input['areas'] ?? [], ['max_points','description'], $now);
            $areaIds = array_column($db->table('evaluation_scale_areas')->select('id')->where('scale_version_id', $versionId)->get()->getResultArray(), 'id');
            foreach ($areaIds as $areaId) $this->updateOwnedRows($db, 'evaluation_scale_categories', 'scale_area_id', $areaId, $input['categories'] ?? [], ['max_points','description','scoring_mode','requires_manual_hr_rule'], $now);
            $categoryIds = $areaIds ? array_column($db->table('evaluation_scale_categories')->select('id')->whereIn('scale_area_id', $areaIds)->get()->getResultArray(), 'id') : [];
            foreach ($categoryIds as $categoryId) {
                $this->updateOwnedRows($db, 'evaluation_scale_subcategories', 'scale_category_id', $categoryId, $input['subcategories'] ?? [], ['default_points','description'], $now);
                $this->updateOwnedRows($db, 'evaluation_scale_criteria', 'scale_category_id', $categoryId, $input['criteria'] ?? [], ['max_points_per_entry','max_occurrences','description','field_schema','evidence_rules','formula_key','formula_params'], $now);
                if ($db->tableExists('evaluation_scale_criterion_options')) $this->updateOwnedRows($db, 'evaluation_scale_criterion_options', 'scale_category_id', $categoryId, $input['options'] ?? [], ['points','label'], $now);
            }
            $after = $db->table('evaluation_scale_versions')->where('id', $versionId)->get()->getRowArray();
            $this->audit($db, $versionId, 'draft_edited', $actorUserId, trim((string)($input['change_reason'] ?? 'Draft criteria updated')), $version, $after, $now);
            if ($db->transStatus() === false) throw new RuntimeException('Draft could not be saved.', 500);
            $db->transCommit();
            return ['version_id'=>$versionId, 'updated_at'=>$now, 'message'=>'Draft criteria saved.'];
        } catch (Throwable $error) { $db->transRollback(); throw $error; }
    }

    public function compareVersions(string $versionId, string $otherVersionId): array
    {
        $left = $this->getScaleVersionHierarchy($otherVersionId); $right = $this->getScaleVersionHierarchy($versionId);
        if ($left['sheet']['id'] !== $right['sheet']['id']) throw new RuntimeException('Only versions of the same criteria sheet can be compared.', 422);
        $flatten = function (array $tree): array {
            $values = ['version.overall_maximum'=>$tree['sheet']['overall_max_points'], 'version.passing_score'=>$tree['sheet']['passing_score']];
            foreach ($tree['areas'] as $area) { $values["area.{$area['area_code']}.maximum"] = (float)$area['max_points']; foreach ($area['categories'] as $category) { $base = "category.{$category['category_code']}"; $values["{$base}.maximum"]=(float)$category['max_points']; $values["{$base}.scoring_mode"]=$category['scoring_mode'] ?? 'MANUAL'; foreach ($category['subcategories'] as $item) $values["{$base}.{$item['subcategory_code']}.points"]=(float)$item['default_points']; foreach ($category['criteria'] as $item) { $values["{$base}.{$item['criterion_code']}.points"]=(float)$item['max_points_per_entry']; $values["{$base}.{$item['criterion_code']}.evidence"]=$item['evidence_rules']; } foreach($category['options']??[] as $option)$values["{$base}.option.{$option['option_group_code']}.{$option['option_code']}"]=(float)$option['points']; } }
            return $values;
        };
        $before=$flatten($left); $after=$flatten($right); $changes=[];
        foreach (array_unique(array_merge(array_keys($before), array_keys($after))) as $path) if (($before[$path] ?? null) !== ($after[$path] ?? null)) $changes[]=['path'=>$path, 'type'=>!array_key_exists($path,$before)?'ADDED':(!array_key_exists($path,$after)?'REMOVED':'CHANGED'), 'before'=>$before[$path]??null, 'after'=>$after[$path]??null];
        return ['from'=>$left['version'], 'to'=>$right['version'], 'summary'=>['added'=>count(array_filter($changes,fn($c)=>$c['type']==='ADDED')), 'removed'=>count(array_filter($changes,fn($c)=>$c['type']==='REMOVED')), 'changed'=>count(array_filter($changes,fn($c)=>$c['type']==='CHANGED'))], 'changes'=>$changes];
    }

    public function retireVersion(string $versionId, string $actorUserId, string $reason): array
    {
        $db = Database::connect(); $db->transBegin();
        try {
            $version = $db->query('SELECT * FROM evaluation_scale_versions WHERE id = ? FOR UPDATE', [$versionId])->getRowArray();
            if (! $version) throw new RuntimeException("Scale version [{$versionId}] not found.", 404);
            if ($version['status'] === 'retired') throw new RuntimeException("Scale version [{$versionId}] is already retired.", 409);
            $now = date('Y-m-d H:i:s'); $after = array_merge($version, ['status'=>'retired', 'updated_at'=>$now]);
            $db->table('evaluation_scale_versions')->where('id', $versionId)->update(['status'=>'retired', 'updated_at'=>$now]);
            $this->audit($db, $versionId, 'version_retired', $actorUserId, $reason, $version, $after, $now);
            if ($db->transStatus() === false) throw new RuntimeException('Unable to retire the criteria version.', 500);
            $db->transCommit();
            return ['version_id'=>$versionId, 'status'=>'retired', 'message'=>'Scale version retired successfully.'];
        } catch (Throwable $error) { $db->transRollback(); throw $error; }
    }

    private function validateDraft(BaseConnection $db, array $version): void
    {
        $total = (float) $version['total_max_points']; $passing = (float) $version['passing_score'];
        if ($total <= 0 || $passing < 0 || $passing > $total) throw new RuntimeException('Passing score must be between zero and the overall maximum.', 422);
        if (array_key_exists('change_reason', $version) && mb_strlen(trim((string)$version['change_reason'])) < 10) throw new RuntimeException('A change reason of at least 10 characters is required.', 422);
        if (array_key_exists('change_summary', $version) && trim((string)$version['change_summary']) === '') throw new RuntimeException('A change summary is required.', 422);
        if (empty($version['effective_start_date'])) throw new RuntimeException('An effective date is required.', 422);
        $areas = $db->table('evaluation_scale_areas')->where('scale_version_id', $version['id'])->get()->getResultArray();
        if (! $areas) throw new RuntimeException('Add at least one criteria area before publishing.', 422);
        $codes = array_map(fn($row) => strtoupper(trim($row['area_code'])), $areas);
        if (count($codes) !== count(array_unique($codes))) throw new RuntimeException('Area codes must be unique within a version.', 422);
        $areaTotal = array_sum(array_map(fn($row) => (float)$row['max_points'], $areas));
        if (abs($areaTotal - $total) > 0.001) throw new RuntimeException('Area maximums must add up to the overall maximum.', 422);
        $criterionCodes = [];
        foreach ($areas as $area) {
            $categories = $db->table('evaluation_scale_categories')->where('scale_area_id', $area['id'])->get()->getResultArray();
            if (! $categories) throw new RuntimeException("Area {$area['area_code']} must contain at least one category.", 422);
            foreach ($categories as $category) {
                $mode = strtoupper((string)($category['scoring_mode'] ?? 'MANUAL'));
                if (! in_array($mode, ['FIXED','FORMULA','DIMENSIONAL','LOOKUP','CATEGORY_CAP','MANUAL'], true)) throw new RuntimeException("Category {$category['category_code']} has an invalid scoring mode.", 422);
                if ($mode === 'MANUAL' && (int)($category['requires_manual_hr_rule'] ?? 0) !== 1) {
                    // Legacy official imports used MANUAL as the enum default even when their
                    // child rows contained deterministic fixed-point choices. Preserve those
                    // published rules; reject only a genuinely ambiguous manual category.
                    $fixedChoices = $db->table('evaluation_scale_subcategories')
                        ->where('scale_category_id', $category['id'])
                        ->where('default_points >', 0)
                        ->countAllResults();
                    $fixedOptions = $db->tableExists('evaluation_scale_criterion_options')
                        ? $db->table('evaluation_scale_criterion_options')->where('scale_category_id', $category['id'])->where('points >', 0)->countAllResults()
                        : 0;
                    if ($fixedChoices === 0 && $fixedOptions === 0) throw new RuntimeException("Category {$category['category_code']} must be explicitly marked for manual HR scoring.", 422);
                }
                foreach ($db->table('evaluation_scale_criteria')->where('scale_category_id', $category['id'])->get()->getResultArray() as $criterion) {
                    $code = strtoupper(trim($criterion['criterion_code']));
                    if (isset($criterionCodes[$code])) throw new RuntimeException("Criterion code {$code} is duplicated within the version.", 422);
                    $criterionCodes[$code] = true;
                    if ($mode !== 'MANUAL' && ! $criterion['formula_key'] && ! $criterion['formula_params'] && (float)$criterion['max_points_per_entry'] <= 0) throw new RuntimeException("Criterion {$code} has no deterministic scoring configuration.", 422);
                }
            }
        }
    }

    private function versionSummary(BaseConnection $db, array $version): array
    {
        $summary = [
            'id'=>$version['id'], 'version_number'=>$version['version_number'], 'evaluation_cycle_id'=>$version['evaluation_cycle_id'],
            'status'=>$version['status'], 'total_max_points'=>(float)$version['total_max_points'], 'passing_score'=>(float)$version['passing_score'],
            'effective_start_date'=>$version['effective_start_date'] ?? null, 'effective_end_date'=>$version['effective_end_date'] ?? null,
            'source_document_ref'=>$version['source_document_ref'] ?? null, 'approved_by_user_id'=>$version['approved_by_user_id'] ?? null,
            'approved_at'=>$version['approved_at'] ?? null, 'created_at'=>$version['created_at'] ?? null, 'updated_at'=>$version['updated_at'] ?? null,
        ];
        foreach (['change_reason','change_summary','source_type','source_title','source_reference','imported_at','created_by_user_id'] as $field) if (array_key_exists($field, $version)) $summary[$field] = $version[$field];
        if ($db->tableExists('personnel_evaluation_periods')) $summary['ranking_period_count'] = $db->table('personnel_evaluation_periods')->where('evaluation_scale_version_id', $version['id'])->countAllResults();
        return $summary;
    }

    private function setIfField(BaseConnection $db, string $table, array &$row, string $field, mixed $value): void
    { if ($db->fieldExists($field, $table)) $row[$field] = $value; }

    private function updateOwnedRows(BaseConnection $db, string $table, string $ownerField, string $ownerId, array $patches, array $allowed, string $now): void
    {
        foreach ($patches as $patch) {
            $id = (string)($patch['id'] ?? ''); if ($id === '') continue;
            $update = ['updated_at'=>$now];
            foreach ($allowed as $field) if (array_key_exists($field, $patch)) {
                $value = $patch[$field];
                if (in_array($field, ['max_points','default_points','max_points_per_entry','points'], true)) { if ($value !== null && (!is_numeric($value) || (float)$value < 0)) throw new RuntimeException('Point and maximum values cannot be negative.', 422); $value=$value===null?null:(float)$value; }
                if (in_array($field, ['field_schema','evidence_rules','formula_params'], true) && is_array($value)) $value=json_encode($value);
                $update[$field]=$value;
            }
            if (count($update) > 1) $db->table($table)->where('id',$id)->where($ownerField,$ownerId)->update($update);
        }
    }

    private function audit(BaseConnection $db, string $versionId, string $action, string $actor, string $reason, ?array $before, ?array $after, string $now): void
    {
        $db->table('evaluation_scale_change_events')->insert(['id'=>$this->newId('esce'), 'scale_version_id'=>$versionId, 'action'=>$action, 'actor_user_id'=>$actor, 'reason'=>$reason, 'before_state'=>$before ? json_encode($before) : null, 'after_state'=>$after ? json_encode($after) : null, 'created_at'=>$now]);
    }

    private function newId(string $prefix): string
    { return $prefix . '-' . bin2hex(random_bytes(12)); }
}
