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
            $area['is_active'] = (int) ($area['is_active'] ?? 1);
            $categories = $db->table('evaluation_scale_categories')->where('scale_area_id', $area['id'])->orderBy('display_order')->get()->getResultArray();
            foreach ($categories as &$category) {
                foreach (['field_schema', 'evidence_rules'] as $jsonField) {
                    if (is_string($category[$jsonField] ?? null)) {
                        $category[$jsonField] = json_decode($category[$jsonField], true) ?: null;
                    }
                }
                $category['is_active'] = (int) ($category['is_active'] ?? 1);
                $category['subcategories'] = $db->table('evaluation_scale_subcategories')->where('scale_category_id', $category['id'])->orderBy('display_order')->get()->getResultArray();
                foreach ($category['subcategories'] as &$subcategory) {
                    $subcategory['is_active'] = (int) ($subcategory['is_active'] ?? 1);
                    foreach (['field_schema', 'evidence_rules'] as $jsonField) {
                        if (is_string($subcategory[$jsonField] ?? null)) {
                            $subcategory[$jsonField] = json_decode($subcategory[$jsonField], true) ?: null;
                        }
                    }
                    $subcategory['levels'] = [];
                    if ($db->tableExists('evaluation_scale_criterion_options') && $db->fieldExists('scale_subcategory_id', 'evaluation_scale_criterion_options')) {
                        $subcategory['levels'] = $db->table('evaluation_scale_criterion_options')
                            ->where('scale_category_id', $category['id'])->where('scale_subcategory_id', $subcategory['id'])
                            ->where('option_group_code', 'LEVEL')->orderBy('display_order')->get()->getResultArray();
                        foreach ($subcategory['levels'] as &$level) $level['is_active'] = (int) ($level['is_active'] ?? 1);
                        unset($level);
                    }
                }
                unset($subcategory);
                $category['criteria'] = $db->table('evaluation_scale_criteria')->where('scale_category_id', $category['id'])->orderBy('criterion_code')->get()->getResultArray();
                foreach ($category['criteria'] as &$criterion) {
                    $criterion['is_active'] = (int) ($criterion['is_active'] ?? 1);
                }
                unset($criterion);
                $category['options'] = [];
                if ($db->tableExists('evaluation_scale_criterion_options')) {
                    $optionQuery = $db->table('evaluation_scale_criterion_options')->where('scale_category_id', $category['id']);
                    if ($db->fieldExists('scale_subcategory_id', 'evaluation_scale_criterion_options')) {
                        $optionQuery->groupStart()->where('scale_subcategory_id', null)->orWhere('scale_subcategory_id', '')->groupEnd();
                    }
                    $category['options'] = $optionQuery->orderBy('option_group_code')->orderBy('display_order')->get()->getResultArray();
                }
            }
            $area['categories'] = $categories;
        }

        return [
            'sheet' => ['id'=>$version['scale_id'], 'code'=>$version['scale_code'], 'name'=>$version['title'], 'description'=>$version['description'], 'applies_to'=>$version['personnel_group'], 'overall_max_points'=>(float)$version['total_max_points'], 'passing_score'=>(float)$version['passing_score']],
            'version' => $this->versionSummary($db, $version),
            'areas' => $areas,
        ];
    }

    public function getVersionHistory(string $versionId): array
    {
        $db = Database::connect();
        $version = $db->table('evaluation_scale_versions')->select('id')->where('id', $versionId)->get()->getRowArray();
        if (! $version) throw new RuntimeException('Ranking criteria version not found.', 404);
        if (! $db->tableExists('evaluation_scale_change_events')) return [];

        return $db->table('evaluation_scale_change_events e')
            ->select('e.id, e.scale_version_id, e.action, e.actor_user_id, p.full_name AS actor_name, e.reason, e.before_state, e.after_state, e.created_at')
            ->join('profiles p', 'p.id = e.actor_user_id', 'left')
            ->where('e.scale_version_id', $versionId)
            ->orderBy('e.created_at', 'DESC')->orderBy('e.id', 'DESC')
            ->get()->getResultArray();
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

    /** Resolve a personnel caller's own group and return only its published intake criteria. */
    public function findActiveIntakeCriteriaForPersonnelProfile(string $profileId): array
    {
        $profile = Database::connect()->table('personnel_profiles')->select('personnel_group')
            ->where('profile_id', $profileId)->get()->getRowArray();
        if (! $profile) throw new RuntimeException('PERSONNEL_PROFILE_NOT_FOUND', 404);
        if (strtoupper((string) ($profile['personnel_group'] ?? '')) !== 'FACULTY') {
            throw new RuntimeException('FACULTY_INTAKE_CRITERIA_ONLY', 422);
        }
        return $this->getActiveIntakeCriteriaContract((string) $profile['personnel_group']);
    }

    /** Return the published, HR-authored intake contract for a group. */
    public function getActiveIntakeCriteriaContract(string $personnelGroup): array
    {
        $group = strtoupper(trim($personnelGroup));
        if (! in_array($group, ['FACULTY', 'NON_TEACHING_FACULTY'], true)) throw new RuntimeException('INVALID_PERSONNEL_GROUP', 422);
        $db = Database::connect();
        foreach (['evaluation_scale_subcategories' => ['intake_active', 'intake_mode', 'field_schema', 'evidence_rules', 'scoring_rule_reference'], 'evaluation_scale_categories' => ['intake_active', 'intake_mode', 'field_schema', 'evidence_rules', 'scoring_rule_reference'] ] as $table => $fields) {
            foreach ($fields as $field) {
                if (! $db->fieldExists($field, $table)) {
                    throw new RuntimeException('INTAKE_CRITERIA_SCHEMA_NOT_READY', 503);
                }
            }
        }

        return self::buildActiveIntakeCriteriaContract($this->findActiveCriteriaForPersonnelGroup($group));
    }

    /** Pure contract builder: strips inactive leaves and emits explicit canonical identity/schema fields. */
    public static function buildActiveIntakeCriteriaContract(array $hierarchy): array
    {
        $version = $hierarchy['version'] ?? [];
        if (strtolower((string) ($version['status'] ?? '')) !== 'approved') {
            throw new RuntimeException('INTAKE_CRITERIA_VERSION_NOT_PUBLISHED', 409);
        }

        $activeLeafCount = 0;
        $areas = [];
        foreach (($hierarchy['areas'] ?? []) as $area) {
            $categories = [];
            foreach (($area['categories'] ?? []) as $category) {
                if ((int) ($area['is_active'] ?? 1) !== 1 || (int) ($category['is_active'] ?? 1) !== 1) continue;
                $criteria = [];
                if ((int) ($category['intake_active'] ?? 0) === 1) {
                    try {
                        self::assertValidIntakeDefinition($category);
                    } catch (RuntimeException $error) {
                        throw new RuntimeException('INTAKE_CRITERIA_DEFINITION_INCOMPLETE: ' . $error->getMessage(), 409, $error);
                    }
                    $activeLeafCount++;
                    $criteria[] = [
                        'criterion_id' => (string) $category['id'],
                        'scale_version_id' => (string) ($version['id'] ?? ''),
                        'code' => (string) ($category['category_code'] ?? ''),
                        'label' => (string) $category['name'],
                        'name' => (string) $category['name'],
                        'description' => $category['description'] ?? null,
                        'intake_mode' => strtoupper((string) $category['intake_mode']),
                        'intake_level' => 'CATEGORY',
                        'field_schema' => $category['field_schema'] ?? [],
                        'evidence_rules' => $category['evidence_rules'] ?? null,
                        'scoring' => [
                            'rule_reference' => (string) $category['scoring_rule_reference'],
                            'default_points' => (float) ($category['max_points'] ?? 0),
                            'criterion_maximum' => (float) ($category['max_points'] ?? 0),
                            'category_maximum' => (float) ($category['max_points'] ?? 0),
                            'area_maximum' => (float) ($area['max_points'] ?? 0),
                        ],
                        'source_reference' => $category['source_ref'] ?? null,
                        'active' => true,
                    ];
                }
                foreach (($category['subcategories'] ?? []) as $leaf) {
                    if ((int) ($leaf['is_active'] ?? 1) !== 1 || (int) ($leaf['intake_active'] ?? 0) !== 1) continue;
                    try {
                        self::assertValidIntakeDefinition($leaf);
                    } catch (RuntimeException $error) {
                        throw new RuntimeException('INTAKE_CRITERIA_DEFINITION_INCOMPLETE: ' . $error->getMessage(), 409, $error);
                    }
                    $activeLeafCount++;
                    $criteria[] = [
                        'criterion_id' => (string) $leaf['id'],
                        'scale_version_id' => (string) ($version['id'] ?? ''),
                        'code' => (string) ($leaf['subcategory_code'] ?? ''),
                        'label' => (string) $leaf['name'],
                        'name' => (string) $leaf['name'],
                        'description' => $leaf['description'] ?? null,
                        'intake_mode' => strtoupper((string) $leaf['intake_mode']),
                        'intake_level' => 'SUBCATEGORY',
                        'field_schema' => $leaf['field_schema'] ?? [],
                        'evidence_rules' => $leaf['evidence_rules'] ?? null,
                        'levels' => array_values(array_map(static fn (array $level): array => [
                            'level_id' => (string) ($level['id'] ?? ''),
                            'name' => (string) ($level['label'] ?? ''),
                            'points' => (float) ($level['points'] ?? 0),
                            'active' => (int) ($level['is_active'] ?? 1) === 1,
                            'order' => (int) ($level['display_order'] ?? 1),
                        ], array_filter($leaf['levels'] ?? [], static fn (array $level): bool => strtoupper((string) ($level['option_group_code'] ?? '')) === 'LEVEL' && (int) ($level['is_active'] ?? 1) === 1))),
                        'scoring' => [
                            'rule_reference' => (string) $leaf['scoring_rule_reference'],
                            'default_points' => (float) ($leaf['default_points'] ?? 0),
                            'criterion_maximum' => (float) ($leaf['default_points'] ?? 0),
                            'category_maximum' => (float) ($category['max_points'] ?? 0),
                            'area_maximum' => (float) ($area['max_points'] ?? 0),
                        ],
                        'source_reference' => $leaf['source_ref'] ?? null,
                        'active' => true,
                    ];
                }
                if ($criteria === []) continue;

                $scoringRules = [];
                foreach (($category['criteria'] ?? []) as $rule) {
                    $ruleLeafId = (string) ($rule['scale_subcategory_id'] ?? '');
                    if ($ruleLeafId !== '' && ! in_array($ruleLeafId, array_column($criteria, 'criterion_id'), true)) continue;
                    foreach (['field_schema', 'evidence_rules', 'formula_params'] as $jsonField) {
                        if (is_string($rule[$jsonField] ?? null)) $rule[$jsonField] = json_decode($rule[$jsonField], true) ?: null;
                    }
                    $scoringRules[] = [
                        'rule_id' => (string) ($rule['id'] ?? ''),
                        'code' => (string) ($rule['criterion_code'] ?? ''),
                        'label' => (string) ($rule['name'] ?? ''),
                        'description' => $rule['description'] ?? null,
                        'formula_key' => $rule['formula_key'] ?? null,
                        'formula_parameters' => $rule['formula_params'] ?? null,
                        'maximum_per_entry' => (float) ($rule['max_points_per_entry'] ?? 0),
                        'maximum_occurrences' => isset($rule['max_occurrences']) ? (int) $rule['max_occurrences'] : null,
                        'source_reference' => $rule['source_ref'] ?? null,
                    ];
                }
                $options = array_map(static fn (array $option): array => [
                    'option_id' => (string) ($option['id'] ?? ''),
                    'group_code' => (string) ($option['option_group_code'] ?? ''),
                    'code' => (string) ($option['option_code'] ?? ''),
                    'label' => (string) ($option['label'] ?? ''),
                    'points' => isset($option['points']) ? (float) $option['points'] : null,
                    'maximum_points' => isset($option['maximum_points']) ? (float) $option['maximum_points'] : null,
                ], $category['options'] ?? []);

                $categories[] = [
                    'category_id' => (string) $category['id'],
                    'code' => (string) ($category['category_code'] ?? ''),
                    'name' => (string) ($category['name'] ?? ''),
                    'description' => $category['description'] ?? null,
                    'maximum_points' => (float) ($category['max_points'] ?? 0),
                    'cut_off_points' => (float) ($category['max_points'] ?? 0),
                    'active' => true,
                    'order' => (int) ($category['display_order'] ?? 1),
                    'subcategories' => array_values(array_map(static fn (array $subcategory): array => [
                        'subcategory_id' => (string) $subcategory['id'],
                        'code' => (string) ($subcategory['subcategory_code'] ?? ''),
                        'name' => (string) ($subcategory['name'] ?? ''),
                        'points' => (float) ($subcategory['default_points'] ?? 0),
                        'active' => true,
                        'order' => (int) ($subcategory['display_order'] ?? 1),
                        'levels' => array_values(array_map(static fn (array $level): array => [
                            'level_id' => (string) ($level['id'] ?? ''),
                            'name' => (string) ($level['label'] ?? ''),
                            'points' => (float) ($level['points'] ?? 0),
                            'active' => (int) ($level['is_active'] ?? 1) === 1,
                            'order' => (int) ($level['display_order'] ?? 1),
                        ], array_filter($subcategory['levels'] ?? [], static fn (array $level): bool => strtoupper((string) ($level['option_group_code'] ?? '')) === 'LEVEL' && (int) ($level['is_active'] ?? 1) === 1))),
                    ], array_filter($category['subcategories'] ?? [], static fn (array $subcategory): bool => (int) ($subcategory['is_active'] ?? 1) === 1 && (int) ($subcategory['intake_active'] ?? 0) === 1))),
                    'intake_level' => (int) ($category['intake_active'] ?? 0) === 1 ? 'CATEGORY' : null,
                    'criteria' => $criteria,
                    'scoring_rules' => $scoringRules,
                    'scoring_options' => $options,
                ];
            }
            if ($categories === []) continue;
            $areas[] = [
                'area_id' => (string) $area['id'],
                'code' => (string) ($area['area_code'] ?? ''),
                'name' => (string) ($area['name'] ?? ''),
                'description' => $area['description'] ?? null,
                'maximum_points' => (float) ($area['max_points'] ?? 0),
                'categories' => $categories,
            ];
        }
        if ($activeLeafCount === 0) throw new RuntimeException('INTAKE_CRITERIA_NOT_CONFIGURED', 409);

        $sheet = $hierarchy['sheet'] ?? [];
        return [
            'personnel_group' => strtoupper((string) ($sheet['applies_to'] ?? '')),
            'scale' => [
                'id' => (string) ($sheet['id'] ?? ''),
                'code' => (string) ($sheet['code'] ?? ''),
                'title' => (string) ($sheet['name'] ?? ''),
                'description' => $sheet['description'] ?? null,
                'maximum_points' => (float) ($sheet['overall_max_points'] ?? 0),
                'passing_score' => (float) ($sheet['passing_score'] ?? 0),
            ],
            'version' => [
                'scale_version_id' => (string) ($version['id'] ?? ''),
                'version_number' => (string) ($version['version_number'] ?? ''),
                'status' => 'approved',
                'effective_start_date' => $version['effective_start_date'] ?? null,
                'effective_end_date' => $version['effective_end_date'] ?? null,
                'approved_at' => $version['approved_at'] ?? null,
            ],
            'areas' => $areas,
        ];
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
            $source = $this->queryForUpdate($db, 'SELECT * FROM evaluation_scale_versions WHERE id = ? FOR UPDATE', [$sourceVersionId])->getRowArray();
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
                        $option['id']=$this->newId('eso'); $option['scale_category_id']=$category['id'];
                        if (($option['scale_subcategory_id'] ?? null) !== null && ($option['scale_subcategory_id'] ?? '') !== '') {
                            $option['scale_subcategory_id'] = $subcategoryMap[$option['scale_subcategory_id']] ?? null;
                        }
                        $option['created_at']=$now; $option['updated_at']=$now;
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

    public function approveVersion(string $versionId, string $actorUserId, string $reason, ?string $impactPreviewToken = null): array
    {
        $db = Database::connect();
        $db->transBegin();
        try {
            $version = $this->queryForUpdate($db, 'SELECT * FROM evaluation_scale_versions WHERE id = ? FOR UPDATE', [$versionId])->getRowArray();
            if (! $version) throw new RuntimeException("Scale version [{$versionId}] not found.", 404);
            if ($version['status'] !== 'draft') throw new RuntimeException('Only a draft criteria version can be published.', 409);
            $this->queryForUpdate($db, 'SELECT id FROM evaluation_scales WHERE id = ? FOR UPDATE', [$version['scale_id']]);
            $this->validateDraft($db, $version);

            // Recheck impact while the draft and scale are locked. The revision,
            // active period references, and per-evaluation jobs commit together.
            $impact = $this->buildActivationImpact($db, $version);
            if (array_sum($impact['change_summary']) > 0 && (! $impactPreviewToken || ! hash_equals($impact['preview_token'], $impactPreviewToken))) {
                throw new RuntimeException('CRITERIA_IMPACT_PREVIEW_STALE: Refresh the impact preview and confirm the latest criteria changes before publishing.', 409);
            }
            if (! $impact['activation_allowed']) {
                throw new RuntimeException('CRITERIA_ACTIVATION_BLOCKED: ' . json_encode($impact['activation_blockers'], JSON_UNESCAPED_UNICODE), 409);
            }

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
            $activationWork = ['queued_evaluation_count'=>0, 'updated_period_count'=>0];
            if ($activeVersions !== []) {
                $activationWork = (new PersonnelEvaluationCriteriaRecalculationService($db))->enqueueForActivatedVersion(
                    (string) $activeVersions[0]['id'],
                    $versionId,
                    $actorUserId,
                    (string) ($impact['personnel_group'] ?? '')
                );
            }
            if ($db->transStatus() === false) throw new RuntimeException('Unable to publish the criteria version.', 500);
            $db->transCommit();
            return ['version_id'=>$versionId, 'status'=>'approved', 'approved_at'=>$now, 'superseded_version_ids'=>array_column($activeVersions, 'id'), 'activation_work'=>$activationWork, 'message'=>'Criteria version published and recalculation work registered.'];
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
            foreach (['evaluation_scale_areas' => ['is_active'], 'evaluation_scale_categories' => ['is_active'], 'evaluation_scale_subcategories' => ['is_active'], 'evaluation_scale_criterion_options' => ['scale_subcategory_id', 'is_active']] as $table => $fields) {
                if (! $db->tableExists($table)) throw new RuntimeException('CRITERIA_HIERARCHY_SCHEMA_NOT_READY', 503);
                foreach ($fields as $field) if (! $db->fieldExists($field, $table)) throw new RuntimeException('CRITERIA_HIERARCHY_SCHEMA_NOT_READY', 503);
            }
            $version = $this->queryForUpdate($db, 'SELECT * FROM evaluation_scale_versions WHERE id = ? FOR UPDATE', [$versionId])->getRowArray();
            if (! $version) throw new RuntimeException('Criteria version not found.', 404);
            if ($version['status'] !== 'draft') throw new RuntimeException('Only draft criteria versions can be edited.', 409);
            $expected = (string)($input['expected_updated_at'] ?? '');
            if ($expected !== '' && $expected !== (string)$version['updated_at']) throw new RuntimeException('This draft has been updated by another user. Refresh and review the latest version before saving.', 409);
            $now = date('Y-m-d H:i:s');
            $versionPatch = ['updated_at'=>$now];
            foreach (['total_max_points','passing_score'] as $field) if (array_key_exists($field, $input)) {
                if (! is_numeric($input[$field]) || (float) $input[$field] < 0) throw new RuntimeException('Overall maximum and passing threshold must be non-negative numbers.', 422);
                $versionPatch[$field] = (float) $input[$field];
            }
            foreach (['effective_start_date','change_reason','change_summary'] as $field) if (array_key_exists($field, $input) && $db->fieldExists($field, 'evaluation_scale_versions')) $versionPatch[$field] = trim((string)$input[$field]) ?: null;
            $areasBefore = $this->captureVersionState($db, $versionId);
            $deletedNodes = $input['deleted_nodes'] ?? [];
            if ($deletedNodes !== []) {
                $this->assertDraftVersionUnused($db, $versionId);
                $this->deleteDraftNodes($db, $versionId, $deletedNodes);
            }
            $db->table('evaluation_scale_versions')->where('id', $versionId)->update($versionPatch);

            $this->updateOwnedRows($db, 'evaluation_scale_areas', 'scale_version_id', $versionId, $input['areas'] ?? [], ['area_code','name','display_order','max_points','description','entry_policy','is_active'], $now);
            $this->insertNewAreas($db, $versionId, $input['areas'] ?? [], $now);
            $areaIds = array_column($db->table('evaluation_scale_areas')->select('id')->where('scale_version_id', $versionId)->get()->getResultArray(), 'id');
            foreach ($areaIds as $areaId) {
                $this->updateOwnedRows($db, 'evaluation_scale_categories', 'scale_area_id', $areaId, $input['categories'] ?? [], ['name','category_code','display_order','max_points','description','scoring_mode','requires_manual_hr_rule','is_active'], $now);
                $this->insertNewCategories($db, $areaId, $input['categories'] ?? [], $now);
            }
            $categoryIds = $areaIds ? array_column($db->table('evaluation_scale_categories')->select('id')->whereIn('scale_area_id', $areaIds)->get()->getResultArray(), 'id') : [];
            foreach ($categoryIds as $categoryId) {
                $this->updateOwnedRows($db, 'evaluation_scale_categories', 'id', $categoryId, $input['categories'] ?? [], ['intake_active','intake_mode','field_schema','evidence_rules','scoring_rule_reference','is_active'], $now);
                $this->updateOwnedRows($db, 'evaluation_scale_subcategories', 'scale_category_id', $categoryId, $input['subcategories'] ?? [], ['subcategory_code','name','display_order','default_points','description','intake_active','intake_mode','field_schema','evidence_rules','scoring_rule_reference','is_active'], $now);
                $this->insertNewSubcategories($db, $categoryId, $input['subcategories'] ?? [], $now);
                $this->updateOwnedRows($db, 'evaluation_scale_criteria', 'scale_category_id', $categoryId, $input['criteria'] ?? [], ['max_points_per_entry','max_occurrences','description','field_schema','evidence_rules','formula_key','formula_params'], $now);
                if ($db->tableExists('evaluation_scale_criterion_options')) $this->saveDraftOptions($db, $categoryId, $input['options'] ?? [], $now);
            }
            $this->assertUniqueCodesInVersion($db, $versionId);
            $this->audit($db, $versionId, 'draft_edited', $actorUserId, trim((string)($input['change_reason'] ?? 'Draft criteria updated')), $areasBefore, $this->captureVersionState($db, $versionId), $now);
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

    /** Read-only, persisted-reference impact analysis for a draft criteria revision. */
    public function previewActivationImpact(string $draftVersionId): array
    {
        $db = Database::connect();
        $draft = $db->table('evaluation_scale_versions')->where('id', $draftVersionId)->get()->getRowArray();
        if (! $draft) throw new RuntimeException('Criteria version not found.', 404);
        if (($draft['status'] ?? null) !== 'draft') throw new RuntimeException('Impact preview requires a draft criteria version.', 409);
        return $this->buildActivationImpact($db, $draft);
    }

    private function buildActivationImpact(BaseConnection $db, array $draft): array
    {
        $approved = $db->table('evaluation_scale_versions')->where('scale_id', $draft['scale_id'])->where('status', 'approved')->orderBy('approved_at', 'DESC')->orderBy('created_at', 'DESC')->get()->getResultArray();
        if (count($approved) !== 1) throw new RuntimeException('CRITERIA_ACTIVE_VERSION_AMBIGUOUS: Impact preview requires exactly one currently approved source version.', 409);
        $source = $approved[0];
        $diff = $this->compareVersions((string) $draft['id'], (string) $source['id']);
        $scale = $db->table('evaluation_scales')->select('personnel_group')->where('id', $draft['scale_id'])->get()->getRowArray();
        $scope = strtoupper(trim((string) ($scale['personnel_group'] ?? '')));

        $periodRows = [];
        if ($db->tableExists('personnel_evaluation_periods') && $db->fieldExists('evaluation_scale_version_id', 'personnel_evaluation_periods')) {
            $periodRows = $db->table('personnel_evaluation_periods')->where('evaluation_scale_version_id', $source['id'])->get()->getResultArray();
        }
        $operationalStatuses = ['DRAFT', 'OPEN_FOR_SUBMISSION', 'SUBMISSION_CLOSED', 'EVALUATION_ONGOING'];
        $operationalPeriods = array_values(array_filter($periodRows, static fn (array $row): bool => in_array(strtoupper((string) ($row['status'] ?? '')), $operationalStatuses, true)));
        $knownPeriodStatuses = array_merge($operationalStatuses, ['CLOSED', 'ARCHIVED', 'CANCELLED']);
        $unresolvedPeriodCount = count(array_filter($periodRows, static function (array $row) use ($knownPeriodStatuses, $scope): bool {
            $statusUnknown = ! in_array(strtoupper((string) ($row['status'] ?? '')), $knownPeriodStatuses, true);
            $group = strtoupper(trim((string) ($row['personnel_group'] ?? '')));
            return $statusUnknown || ($group !== '' && $scope !== '' && $group !== $scope);
        }));

        $evaluationCount = 0;
        $endorsedCount = 0;
        $unresolvedEvaluationCount = 0;
        $byStatus = [];
        $terminalStatuses = ['completed', 'finalized', 'released'];
        $mutableStatuses = ['draft', 'submitted', 'in_progress', 'under_review', 'under_evaluation', 'awaiting_review', 'in_evaluation', 'returned_for_revision', 'revision_requested', 'reviewed', 'scoring_completed', 'ready_for_finalization', 'endorsed_to_hr', 'under_hr_review'];
        if ($db->tableExists('personnel_evaluations') && $db->fieldExists('id', 'personnel_evaluations')) {
            $hasPeriod = $db->fieldExists('evaluation_period_id', 'personnel_evaluations') && $db->tableExists('personnel_evaluation_periods');
            $hasDirectVersion = $db->fieldExists('evaluation_scale_version_id', 'personnel_evaluations');
            if ($hasPeriod || $hasDirectVersion) {
                $select = 'e.id, e.status';
                if ($db->fieldExists('finalized_at', 'personnel_evaluations')) $select .= ', e.finalized_at';
                if ($db->fieldExists('final_snapshot', 'personnel_evaluations')) $select .= ', e.final_snapshot';
                if ($db->fieldExists('personnel_group_snapshot', 'personnel_evaluations')) $select .= ', e.personnel_group_snapshot AS evaluation_group';
                if ($hasDirectVersion) $select .= ', e.evaluation_scale_version_id AS direct_version_id';
                if ($hasPeriod) $select .= ', e.evaluation_period_id';
                if ($hasPeriod && $db->fieldExists('evaluation_scale_version_id', 'personnel_evaluation_periods')) $select .= ', p.evaluation_scale_version_id AS period_version_id';
                if ($hasPeriod && $db->fieldExists('personnel_group', 'personnel_evaluation_periods')) $select .= ', p.personnel_group AS period_group';
                $builder = $db->table('personnel_evaluations e')->select($select);
                if ($hasPeriod) $builder->join('personnel_evaluation_periods p', 'p.id = e.evaluation_period_id', 'left');
                $builder->groupStart();
                if ($hasDirectVersion) $builder->where('e.evaluation_scale_version_id', $source['id']);
                if ($hasPeriod) $builder->orWhere('p.evaluation_scale_version_id', $source['id']);
                $builder->groupEnd();
                foreach ($builder->get()->getResultArray() as $evaluation) {
                    $evalGroup = strtoupper(trim((string) ($evaluation['evaluation_group'] ?? '')));
                    $periodGroup = strtoupper(trim((string) ($evaluation['period_group'] ?? '')));
                    if ($evalGroup !== '' && $periodGroup !== '' && $evalGroup !== $periodGroup) {
                        $unresolvedEvaluationCount++;
                        continue;
                    }
                    if (($evalGroup !== '' && $evalGroup !== $scope) || ($periodGroup !== '' && $periodGroup !== $scope)) continue;
                    if ($evalGroup === '' && $periodGroup === '' && $scope !== '') {
                        $unresolvedEvaluationCount++;
                        continue;
                    }
                    $status = strtolower(trim((string) ($evaluation['status'] ?? '')));
                    $hasFinalSnapshot = ! empty($evaluation['finalized_at']) || ! empty($evaluation['final_snapshot']);
                    if (in_array($status, $terminalStatuses, true) || $hasFinalSnapshot) continue;
                    if (! in_array($status, $mutableStatuses, true)) {
                        $unresolvedEvaluationCount++;
                        continue;
                    }
                    $evaluationCount++;
                    $byStatus[$status] = ($byStatus[$status] ?? 0) + 1;
                    if (in_array($status, ['ready_for_finalization', 'endorsed_to_hr', 'under_hr_review'], true)) $endorsedCount++;
                }
            }
        }

        $blockers = [];
        if ($scope === '') $blockers[] = ['code'=>'CRITERIA_PERSONNEL_GROUP_UNRESOLVED','count'=>1,'message'=>'The criteria sheet has no verified personnel-group classification.'];
        if ($unresolvedPeriodCount > 0) $blockers[] = ['code'=>'PERIOD_STATUS_UNRESOLVED','count'=>$unresolvedPeriodCount,'message'=>'Some ranking periods reference the current revision but have an unrecognized lifecycle status.'];
        if ($unresolvedEvaluationCount > 0) $blockers[] = ['code'=>'EVALUATION_SCOPE_OR_STATUS_UNRESOLVED','count'=>$unresolvedEvaluationCount,'message'=>'Some evaluations reference the current revision but their classification or lifecycle status could not be safely determined.'];

        $preview = [
            'source_version' => ['id'=>$source['id'], 'version_number'=>$source['version_number'], 'status'=>$source['status']],
            'candidate_version' => ['id'=>$draft['id'], 'version_number'=>$draft['version_number'], 'status'=>$draft['status']],
            'personnel_group' => $scope,
            'changes' => $diff['changes'],
            'change_summary' => $diff['summary'],
            'affected_ranking_period_count' => count($periodRows),
            'operational_ranking_period_count' => count($operationalPeriods),
            'unresolved_ranking_period_count' => $unresolvedPeriodCount,
            'affected_nonfinalized_evaluation_count' => $evaluationCount,
            'affected_endorsed_evaluation_count' => $endorsedCount,
            'evaluations_by_status' => $byStatus,
            'unresolved_evaluation_count' => $unresolvedEvaluationCount,
            'finalized_evaluations_modified' => 0,
            'activation_allowed' => count($blockers) === 0,
            'activation_blockers' => $blockers,
        ];
        $preview['preview_token'] = hash('sha256', json_encode([
            'draft_id'=>$draft['id'], 'draft_updated_at'=>$draft['updated_at'] ?? null,
            'source_id'=>$source['id'], 'source_updated_at'=>$source['updated_at'] ?? null,
            'changes'=>$diff['changes'], 'period_count'=>$preview['affected_ranking_period_count'],
            'operational_period_count'=>$preview['operational_ranking_period_count'],
            'evaluation_count'=>$evaluationCount, 'endorsed_count'=>$endorsedCount,
            'unresolved_evaluations'=>$unresolvedEvaluationCount, 'unresolved_periods'=>$unresolvedPeriodCount,
            'evaluations_by_status'=>$byStatus,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        return $preview;
    }

    public function retireVersion(string $versionId, string $actorUserId, string $reason): array
    {
        $db = Database::connect(); $db->transBegin();
        try {
            $version = $this->queryForUpdate($db, 'SELECT * FROM evaluation_scale_versions WHERE id = ? FOR UPDATE', [$versionId])->getRowArray();
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
        $scale = $db->table('evaluation_scales')->select('personnel_group')->where('id', $version['scale_id'])->get()->getRowArray();
        $isFacultyScale = strtoupper((string) ($scale['personnel_group'] ?? '')) === 'FACULTY';
        $codes = array_map(fn($row) => strtoupper(trim($row['area_code'])), $areas);
        if (count($codes) !== count(array_unique($codes))) throw new RuntimeException('Area codes must be unique within a version.', 422);
        $areaTotal = array_sum(array_map(fn($row) => (float)$row['max_points'], $areas));
        if (abs($areaTotal - $total) > 0.001) throw new RuntimeException('Area maximums must add up to the overall maximum.', 422);
        $criterionCodes = [];
        foreach ($areas as $area) {
            $categories = $db->table('evaluation_scale_categories')->where('scale_area_id', $area['id'])->get()->getResultArray();
            if (! $categories) throw new RuntimeException("Area {$area['area_code']} must contain at least one category.", 422);
            foreach ($categories as $category) {
                if (trim((string) ($category['name'] ?? '')) === '' || ! is_numeric($category['max_points'] ?? null) || (float) $category['max_points'] < 0) throw new RuntimeException('Each category needs a name and non-negative cut-off points.', 422);
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
                if ($isFacultyScale) {
                    foreach (['field_schema', 'evidence_rules'] as $jsonField) {
                        if (is_string($category[$jsonField] ?? null)) $category[$jsonField] = json_decode($category[$jsonField], true) ?: null;
                    }
                    self::assertValidIntakeDefinition(array_merge(['intake_active' => 0], $category));
                    foreach ($db->table('evaluation_scale_subcategories')->where('scale_category_id', $category['id'])->get()->getResultArray() as $subcategory) {
                        foreach (['field_schema', 'evidence_rules'] as $jsonField) {
                            if (is_string($subcategory[$jsonField] ?? null)) {
                                $subcategory[$jsonField] = json_decode($subcategory[$jsonField], true) ?: null;
                            }
                        }
                        self::assertValidIntakeDefinition($subcategory);
                    }
                }
                foreach ($db->table('evaluation_scale_subcategories')->where('scale_category_id', $category['id'])->get()->getResultArray() as $subcategory) {
                    if (trim((string) ($subcategory['name'] ?? '')) === '' || ! is_numeric($subcategory['default_points'] ?? null) || (float) $subcategory['default_points'] < 0) throw new RuntimeException('Each subcategory needs a name and non-negative corresponding points.', 422);
                    if ($db->tableExists('evaluation_scale_criterion_options') && $db->fieldExists('scale_subcategory_id', 'evaluation_scale_criterion_options')) {
                        foreach ($db->table('evaluation_scale_criterion_options')->where('scale_category_id', $category['id'])->where('scale_subcategory_id', $subcategory['id'])->where('option_group_code', 'LEVEL')->get()->getResultArray() as $level) {
                            if (trim((string) ($level['label'] ?? '')) === '' || ! is_numeric($level['points'] ?? null) || (float) $level['points'] < 0) throw new RuntimeException('Each level needs a name and non-negative points.', 422);
                        }
                    }
                }
            }
        }
    }

    /** Validate the HR-authored intake contract without accepting executable or scoring input. */
    public static function assertValidIntakeDefinition(array $criterion): void
    {
        if ((int) ($criterion['intake_active'] ?? 1) !== 1) return;

        $name = trim((string) ($criterion['name'] ?? 'Selectable criterion'));
        if (mb_strlen($name) > 255) throw new RuntimeException('Selectable criterion labels must be 255 characters or fewer.', 422);
        $mode = strtoupper(trim((string) ($criterion['intake_mode'] ?? 'FORM')));
        if (! in_array($mode, ['FORM', 'MANUAL_HR'], true)) {
            throw new RuntimeException("{$name} has an invalid Faculty intake mode.", 422);
        }

        $fields = $criterion['field_schema'] ?? [];
        if (! is_array($fields) || (! array_is_list($fields) && $fields !== [])) {
            throw new RuntimeException("{$name} field definitions must be a list.", 422);
        }
        if ($mode === 'FORM' && $fields === []) {
            throw new RuntimeException("{$name} needs at least one required or optional field, or must be marked Manual / HR-defined.", 422);
        }
        if ($mode === 'MANUAL_HR' && $fields !== []) {
            throw new RuntimeException("{$name} is Manual / HR-defined and cannot also define form fields.", 422);
        }

        $keys = [];
        $allowedTypes = ['text', 'textarea', 'number', 'date', 'select'];
        foreach ($fields as $field) {
            if (! is_array($field)) throw new RuntimeException("{$name} contains an invalid field definition.", 422);
            $key = trim((string) ($field['key'] ?? ''));
            $label = trim((string) ($field['label'] ?? ''));
            $type = strtolower(trim((string) ($field['type'] ?? '')));
            if (! preg_match('/^[a-z][a-z0-9_]{0,63}$/', $key) || $label === '' || ! in_array($type, $allowedTypes, true)) {
                throw new RuntimeException("{$name} has a field with an invalid key, label, or type.", 422);
            }
            if (isset($keys[$key])) throw new RuntimeException("{$name} has duplicate field key {$key}.", 422);
            $keys[$key] = true;
            if (! is_bool($field['required'] ?? null)) throw new RuntimeException("{$name} field {$label} must be marked required or optional.", 422);
            if ($type === 'select') {
                $options = $field['options'] ?? null;
                if (! is_array($options) || ! array_is_list($options) || $options === []) {
                    throw new RuntimeException("{$name} select field {$label} needs at least one HR-defined choice.", 422);
                }
                $normalizedOptions = array_map(static fn ($option) => is_string($option) ? trim($option) : '', $options);
                if (in_array('', $normalizedOptions, true) || count($normalizedOptions) !== count(array_unique($normalizedOptions))) {
                    throw new RuntimeException("{$name} select field {$label} contains a blank or duplicate choice.", 422);
                }
            }
            if (isset($field['ocr_key']) && ! preg_match('/^[a-z][a-z0-9_]{0,63}$/', (string) $field['ocr_key'])) {
                throw new RuntimeException("{$name} field {$label} has an invalid OCR mapping key.", 422);
            }
            $constraints = $field['validation'] ?? [];
            if (! is_array($constraints)) throw new RuntimeException("{$name} field {$label} has invalid validation constraints.", 422);
            foreach (['min', 'max', 'minLength', 'maxLength'] as $constraint) {
                if (isset($constraints[$constraint]) && (! is_numeric($constraints[$constraint]) || (float) $constraints[$constraint] < 0)) {
                    throw new RuntimeException("{$name} field {$label} has an invalid {$constraint} constraint.", 422);
                }
            }
            if (isset($constraints['min'], $constraints['max']) && (float) $constraints['min'] > (float) $constraints['max']) {
                throw new RuntimeException("{$name} field {$label} has a minimum greater than its maximum.", 422);
            }
            if (isset($constraints['minLength'], $constraints['maxLength']) && (float) $constraints['minLength'] > (float) $constraints['maxLength']) {
                throw new RuntimeException("{$name} field {$label} has a minimum length greater than its maximum length.", 422);
            }
        }

        $evidence = $criterion['evidence_rules'] ?? null;
        if (! is_array($evidence) || ! is_bool($evidence['required'] ?? null) || ! is_array($evidence['accepted'] ?? null) || ! array_is_list($evidence['accepted'])) {
            throw new RuntimeException("{$name} must define whether Supporting Document evidence is required and list accepted evidence.", 422);
        }
        $accepted = array_map(static fn ($item) => is_string($item) ? trim($item) : '', $evidence['accepted']);
        if (($evidence['required'] === true && $accepted === []) || in_array('', $accepted, true)) {
            throw new RuntimeException("{$name} must list valid accepted evidence when evidence is required, and evidence entries cannot be blank.", 422);
        }
        if (count($accepted) !== count(array_unique($accepted))) {
            throw new RuntimeException("{$name} accepted evidence entries must be unique.", 422);
        }
        if (trim((string) ($criterion['scoring_rule_reference'] ?? '')) === '') {
            throw new RuntimeException("{$name} needs an HR scoring rule reference or a Manual / HR-defined note.", 422);
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

    private function insertNewAreas(BaseConnection $db, string $versionId, array $areas, string $now): void
    {
        foreach ($areas as $area) {
            $id = (string) ($area['id'] ?? '');
            if (($area['scale_version_id'] ?? '') !== $versionId || $id === '' || $db->table('evaluation_scale_areas')->where('id', $id)->countAllResults() > 0) continue;
            $code = strtoupper(trim((string) ($area['area_code'] ?? '')));
            $name = trim((string) ($area['name'] ?? ''));
            $points = $area['max_points'] ?? null;
            if ($code === '' || ! preg_match('/^[A-Z0-9]{1,8}$/', $code) || $name === '' || ! is_numeric($points) || (float) $points < 0) {
                throw new RuntimeException('Each section needs a valid code, name, and non-negative maximum.', 422);
            }
            $db->table('evaluation_scale_areas')->insert([
                'id' => $id, 'scale_version_id' => $versionId, 'area_code' => $code, 'name' => $name,
                'description' => $area['description'] ?? null,
                'display_order' => max(1, (int) ($area['display_order'] ?? 1)),
                'max_points' => (float) $points,
                'entry_policy' => $area['entry_policy'] ?? 'personnel_entry_allowed',
                'source_ref' => $area['source_ref'] ?? null,
                'created_at' => $now, 'updated_at' => $now,
                'is_active' => (int) ($area['is_active'] ?? 1),
            ]);
        }
    }

    private function assertUniqueCodesInVersion(BaseConnection $db, string $versionId): void
    {
        $areas = $db->table('evaluation_scale_areas')->where('scale_version_id', $versionId)->get()->getResultArray();
        $this->assertUniqueField($areas, 'area_code', 'Section');
        foreach ($areas as $area) {
            if (trim((string) ($area['name'] ?? '')) === '' || ! preg_match('/^[A-Z0-9]{1,8}$/', strtoupper(trim((string) ($area['area_code'] ?? ''))))) throw new RuntimeException('Each section needs a valid code and name.', 422);
            if (! is_numeric($area['max_points'] ?? null) || (float) $area['max_points'] < 0) throw new RuntimeException('Section maximums must be non-negative numbers.', 422);
        }
        foreach ($areas as $area) {
            $categories = $db->table('evaluation_scale_categories')->where('scale_area_id', $area['id'])->get()->getResultArray();
            $this->assertUniqueField($categories, 'category_code', 'Category');
            foreach ($categories as $category) {
                if (trim((string) ($category['name'] ?? '')) === '' || ! preg_match('/^[A-Z0-9][A-Z0-9._-]{0,15}$/', strtoupper(trim((string) ($category['category_code'] ?? ''))))) throw new RuntimeException('Each category needs a valid code and name.', 422);
                if (! is_numeric($category['max_points'] ?? null) || (float) $category['max_points'] < 0) throw new RuntimeException('Category cutoffs must be non-negative numbers.', 422);
            }
            foreach ($categories as $category) {
                $subcategories = $db->table('evaluation_scale_subcategories')->where('scale_category_id', $category['id'])->get()->getResultArray();
                $this->assertUniqueField($subcategories, 'subcategory_code', 'Subcategory');
                foreach ($subcategories as $subcategory) {
                    if (trim((string) ($subcategory['name'] ?? '')) === '' || ! preg_match('/^[A-Z0-9][A-Z0-9._-]{0,23}$/', strtoupper(trim((string) ($subcategory['subcategory_code'] ?? ''))))) throw new RuntimeException('Each subcategory needs a valid code and name.', 422);
                    if (! is_numeric($subcategory['default_points'] ?? null) || (float) $subcategory['default_points'] < 0) throw new RuntimeException('Subcategory points must be non-negative numbers.', 422);
                }
            }
        }
    }

    private function assertUniqueField(array $rows, string $field, string $label): void
    {
        $values = array_map(static fn (array $row): string => strtoupper(trim((string) ($row[$field] ?? ''))), $rows);
        $values = array_filter($values, static fn (string $value): bool => $value !== '');
        if (count($values) !== count(array_unique($values))) throw new RuntimeException("{$label} codes must be unique within their parent.", 422);
    }

    private function captureVersionState(BaseConnection $db, string $versionId): array
    {
        $state = ['version' => $db->table('evaluation_scale_versions')->where('id', $versionId)->get()->getRowArray(), 'areas' => []];
        foreach ($db->table('evaluation_scale_areas')->where('scale_version_id', $versionId)->orderBy('display_order')->get()->getResultArray() as $area) {
            $area['categories'] = [];
            foreach ($db->table('evaluation_scale_categories')->where('scale_area_id', $area['id'])->orderBy('display_order')->get()->getResultArray() as $category) {
                $category['subcategories'] = $db->table('evaluation_scale_subcategories')->where('scale_category_id', $category['id'])->orderBy('display_order')->get()->getResultArray();
                $category['criteria'] = $db->table('evaluation_scale_criteria')->where('scale_category_id', $category['id'])->orderBy('criterion_code')->get()->getResultArray();
                $category['options'] = $db->table('evaluation_scale_criterion_options')->where('scale_category_id', $category['id'])->orderBy('option_group_code')->orderBy('display_order')->get()->getResultArray();
                $area['categories'][] = $category;
            }
            $state['areas'][] = $area;
        }
        return $state;
    }

    private function insertNewCategories(BaseConnection $db, string $areaId, array $categories, string $now): void
    {
        foreach ($categories as $category) {
            if (($category['scale_area_id'] ?? '') !== $areaId || empty($category['id']) || $db->table('evaluation_scale_categories')->where('id', $category['id'])->countAllResults() > 0) continue;
            $name = trim((string) ($category['name'] ?? ''));
            $points = $category['max_points'] ?? null;
            if ($name === '' || ! is_numeric($points) || (float) $points < 0) throw new RuntimeException('Each category needs a name and non-negative cut-off points.', 422);
            $id = (string) $category['id'];
            $code = strtoupper(trim((string) ($category['category_code'] ?? '')));
            if ($code === '' || ! preg_match('/^[A-Z0-9][A-Z0-9._-]{0,15}$/', $code)) throw new RuntimeException('Each category needs a valid code.', 422);
            $db->table('evaluation_scale_categories')->insert([
                'id' => $id, 'scale_area_id' => $areaId, 'category_code' => $code, 'name' => $name,
                'description' => $category['description'] ?? null, 'display_order' => max(1, (int) ($category['display_order'] ?? 1)),
                'max_points' => (float) $points, 'scoring_mode' => $category['scoring_mode'] ?? 'MANUAL',
                'requires_manual_hr_rule' => (int) ($category['requires_manual_hr_rule'] ?? 0),
                'created_at' => $now, 'updated_at' => $now,
            ]);
            if ($db->fieldExists('is_active', 'evaluation_scale_categories')) $db->table('evaluation_scale_categories')->where('id', $id)->update(['is_active' => (int) ($category['is_active'] ?? 1)]);
        }
    }

    private function insertNewSubcategories(BaseConnection $db, string $categoryId, array $subcategories, string $now): void
    {
        foreach ($subcategories as $subcategory) {
            if (($subcategory['scale_category_id'] ?? '') !== $categoryId || empty($subcategory['id']) || $db->table('evaluation_scale_subcategories')->where('id', $subcategory['id'])->countAllResults() > 0) continue;
            $name = trim((string) ($subcategory['name'] ?? ''));
            $points = $subcategory['default_points'] ?? null;
            if ($name === '' || ! is_numeric($points) || (float) $points < 0) throw new RuntimeException('Each subcategory needs a name and non-negative corresponding points.', 422);
            $id = (string) $subcategory['id'];
            $row = [
                'id' => $id, 'scale_category_id' => $categoryId,
                'subcategory_code' => strtoupper(trim((string) ($subcategory['subcategory_code'] ?? ''))),
                'name' => $name, 'description' => $subcategory['description'] ?? null,
                'display_order' => max(1, (int) ($subcategory['display_order'] ?? 1)), 'default_points' => (float) $points,
                'source_ref' => $subcategory['source_ref'] ?? null, 'created_at' => $now, 'updated_at' => $now,
            ];
            if ($row['subcategory_code'] === '' || ! preg_match('/^[A-Z0-9][A-Z0-9._-]{0,23}$/', $row['subcategory_code'])) throw new RuntimeException('Each subcategory needs a valid code.', 422);
            if ($db->fieldExists('is_active', 'evaluation_scale_subcategories')) $row['is_active'] = (int) ($subcategory['is_active'] ?? 1);
            foreach (['intake_active','intake_mode','field_schema','evidence_rules','scoring_rule_reference'] as $field) {
                if ($db->fieldExists($field, 'evaluation_scale_subcategories') && array_key_exists($field, $subcategory)) {
                    $row[$field] = is_array($subcategory[$field]) ? json_encode($subcategory[$field]) : $subcategory[$field];
                }
            }
            $db->table('evaluation_scale_subcategories')->insert($row);
        }
    }

    /** Saves subcategory level rows in the existing versioned options table. */
    private function saveDraftOptions(BaseConnection $db, string $categoryId, array $options, string $now): void
    {
        $table = 'evaluation_scale_criterion_options';
        if (! $db->fieldExists('scale_subcategory_id', $table) && array_filter($options, static fn(array $option): bool => ! empty($option['scale_subcategory_id']))) {
            throw new RuntimeException('The optional levels schema migration must be applied before saving subcategory levels.', 503);
        }

        $existing = $db->table($table)->where('scale_category_id', $categoryId)->get()->getResultArray();
        $existingById = array_column($existing, null, 'id');
        $submittedIds = [];
        $category = $db->table('evaluation_scale_categories')->where('id', $categoryId)->get()->getRowArray() ?? [];
        $allowedOptionGroups = [
            'GUEST_LECTURER_MATRIX' => ['SPONSOR', 'EXTENT', 'PARTICIPANTS', 'ROLE'],
            'PUBLICATION_MATRIX' => ['SCOPE', 'TYPE'],
            'RECOGNITION_MATRIX' => ['NOMINEE', 'AWARDEE'],
            'INSTRUCTIONAL_MATERIALS' => ['MATERIAL_TYPE'],
        ][$category['renderer_key'] ?? ''] ?? [];
        foreach ($options as $option) {
            $id = (string) ($option['id'] ?? '');
            $submittedCategoryId = trim((string) ($option['scale_category_id'] ?? ''));
            if ($submittedCategoryId !== '' && $submittedCategoryId !== $categoryId) continue;
            if ($submittedCategoryId === '' && ! isset($existingById[$id])) {
                throw new RuntimeException('Each new scoring option must identify its owning category.', 422);
            }
            if ($id === '') continue;
            $submittedIds[] = $id;
            $subcategoryId = trim((string) ($option['scale_subcategory_id'] ?? '')) ?: null;
            if ($subcategoryId !== null) {
                $ownedSubcategory = $db->table('evaluation_scale_subcategories')->where('id', $subcategoryId)->where('scale_category_id', $categoryId)->countAllResults() > 0;
                if (! $ownedSubcategory) throw new RuntimeException('A level must belong to a subcategory in this draft.', 422);
                if (trim((string) ($option['label'] ?? '')) === '' || ! is_numeric($option['points'] ?? null) || (float) $option['points'] < 0) {
                    throw new RuntimeException('Each level needs a name and non-negative points.', 422);
                }
            } elseif (! isset($existingById[$id])) {
                $group = strtoupper(trim((string) ($option['option_group_code'] ?? '')));
                if (! in_array($group, $allowedOptionGroups, true)) {
                    throw new RuntimeException('Scoring options can only be added to a verified scoring dimension for this criterion.', 422);
                }
                if (trim((string) ($option['label'] ?? '')) === '' || ! is_numeric($option['points'] ?? null) || (float) $option['points'] < 0) {
                    throw new RuntimeException('Each scoring option needs a label and non-negative points.', 422);
                }
            }
            $row = [
                'scale_category_id' => $categoryId,
                'option_group_code' => $subcategoryId === null ? (string) ($option['option_group_code'] ?? '') : 'LEVEL',
                'option_code' => trim((string) ($option['option_code'] ?? '')) ?: ('OPT-' . strtoupper(substr(hash('sha256', $id), 0, 12))),
                'label' => (string) ($option['label'] ?? ''), 'points' => $option['points'] ?? null,
                'display_order' => max(1, (int) ($option['display_order'] ?? 1)), 'updated_at' => $now,
            ];
            if ($db->fieldExists('scale_subcategory_id', $table)) $row['scale_subcategory_id'] = $subcategoryId;
            if ($db->fieldExists('is_active', $table)) $row['is_active'] = (int) ($option['is_active'] ?? 1);
            if (isset($existingById[$id])) {
                $db->table($table)->where('id', $id)->where('scale_category_id', $categoryId)->update($row);
            } else {
                $row['id'] = $id; $row['created_at'] = $now; $row['source_ref'] = $option['source_ref'] ?? null;
                $db->table($table)->insert($row);
            }
        }

        if ($db->fieldExists('scale_subcategory_id', $table)) {
            foreach ($existing as $row) {
                if (! in_array((string) $row['id'], $submittedIds, true)) {
                    $db->table($table)->where('id', $row['id'])->where('scale_category_id', $categoryId)->delete();
                }
            }
        }
    }

    private function assertDraftVersionUnused(BaseConnection $db, string $versionId): void
    {
        $checks = [
            ['personnel_evaluation_periods', 'evaluation_scale_version_id'],
            ['personnel_evaluations', 'evaluation_scale_version_id'],
            ['personnel_accomplishments', 'evaluation_scale_version_id'],
        ];
        foreach ($checks as [$table, $field]) {
            if ($db->tableExists($table) && $db->fieldExists($field, $table)
                && $db->table($table)->where($field, $versionId)->countAllResults() > 0) {
                throw new RuntimeException('This draft is referenced by a ranking period, portfolio record, or evaluation and cannot be permanently deleted.', 409);
            }
        }
    }

    private function deleteDraftNodes(BaseConnection $db, string $versionId, array $nodes): void
    {
        foreach ($nodes as $node) {
            $type = strtolower(trim((string) ($node['type'] ?? '')));
            $id = trim((string) ($node['id'] ?? ''));
            if ($id === '') continue;
            if ($type === 'section') {
                $row = $db->table('evaluation_scale_areas')->where(['id' => $id, 'scale_version_id' => $versionId])->get()->getRowArray();
                if (! $row) throw new RuntimeException('The section does not belong to this draft.', 422);
                $categoryIds = array_column($db->table('evaluation_scale_categories')->select('id')->where('scale_area_id', $id)->get()->getResultArray(), 'id');
                foreach ($categoryIds as $categoryId) $this->deleteDraftCategory($db, $categoryId);
                $db->table('evaluation_scale_areas')->where('id', $id)->delete();
                continue;
            }
            if ($type === 'category') {
                $row = $db->query('SELECT c.id FROM evaluation_scale_categories c JOIN evaluation_scale_areas a ON a.id=c.scale_area_id WHERE c.id=? AND a.scale_version_id=?', [$id, $versionId])->getRowArray();
                if (! $row) throw new RuntimeException('The category does not belong to this draft.', 422);
                $this->deleteDraftCategory($db, $id);
                continue;
            }
            if ($type === 'subcategory') {
                $row = $db->query('SELECT sc.id,c.id AS category_id FROM evaluation_scale_subcategories sc JOIN evaluation_scale_categories c ON c.id=sc.scale_category_id JOIN evaluation_scale_areas a ON a.id=c.scale_area_id WHERE sc.id=? AND a.scale_version_id=?', [$id, $versionId])->getRowArray();
                if (! $row) throw new RuntimeException('The subcategory does not belong to this draft.', 422);
                $db->table('evaluation_scale_criterion_options')->where('scale_category_id', $row['category_id'])->where('scale_subcategory_id', $id)->delete();
                $db->table('evaluation_scale_subcategories')->where('id', $id)->delete();
                continue;
            }
            if ($type === 'level' || $type === 'scoring_option') {
                $row = $db->query('SELECT o.id FROM evaluation_scale_criterion_options o JOIN evaluation_scale_areas a ON a.scale_version_id=? JOIN evaluation_scale_categories c ON c.scale_area_id=a.id AND c.id=o.scale_category_id WHERE o.id=?', [$versionId, $id])->getRowArray();
                if (! $row) throw new RuntimeException('The scoring option does not belong to this draft.', 422);
                $db->table('evaluation_scale_criterion_options')->where('id', $id)->delete();
                continue;
            }
            if ($type === 'criterion') {
                $row = $db->query('SELECT r.id FROM evaluation_scale_criteria r JOIN evaluation_scale_categories c ON c.id=r.scale_category_id JOIN evaluation_scale_areas a ON a.id=c.scale_area_id WHERE r.id=? AND a.scale_version_id=?', [$id, $versionId])->getRowArray();
                if (! $row) throw new RuntimeException('The scoring factor does not belong to this draft.', 422);
                $db->table('evaluation_scale_criteria')->where('id', $id)->delete();
                continue;
            }
            throw new RuntimeException('This item type cannot be deleted.', 422);
        }
    }

    private function deleteDraftCategory(BaseConnection $db, string $categoryId): void
    {
        $db->table('evaluation_scale_criterion_options')->where('scale_category_id', $categoryId)->delete();
        $db->table('evaluation_scale_criteria')->where('scale_category_id', $categoryId)->delete();
        $db->table('evaluation_scale_subcategories')->where('scale_category_id', $categoryId)->delete();
        $db->table('evaluation_scale_categories')->where('id', $categoryId)->delete();
    }

    private function audit(BaseConnection $db, string $versionId, string $action, string $actor, string $reason, ?array $before, ?array $after, string $now): void
    {
        $db->table('evaluation_scale_change_events')->insert(['id'=>$this->newId('esce'), 'scale_version_id'=>$versionId, 'action'=>$action, 'actor_user_id'=>$actor, 'reason'=>$reason, 'before_state'=>$before ? json_encode($before) : null, 'after_state'=>$after ? json_encode($after) : null, 'created_at'=>$now]);
    }

    private function newId(string $prefix): string
    { return $prefix . '-' . bin2hex(random_bytes(12)); }

    /** Keep row locking on production databases while allowing isolated SQLite integration tests. */
    private function queryForUpdate(BaseConnection $db, string $sql, array $binds = []): mixed
    {
        if (strtolower($db->DBDriver) === 'sqlite3') {
            $sql = preg_replace('/\\s+FOR UPDATE\\s*$/i', '', $sql) ?? $sql;
        }

        return $db->query($sql, $binds);
    }
}
