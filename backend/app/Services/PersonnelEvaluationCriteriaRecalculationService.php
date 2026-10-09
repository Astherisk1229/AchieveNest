<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;
use Throwable;

/** Durable criteria-change queue, protected recalculation worker, and finalization gate. */
final class PersonnelEvaluationCriteriaRecalculationService
{
    private const FINAL_STATUSES = ['completed', 'finalized', 'released'];
    private const MUTABLE_STATUSES = ['draft','submitted','in_progress','under_review','under_evaluation','awaiting_review','in_evaluation','returned_for_revision','revision_requested','reviewed','scoring_completed','ready_for_finalization','endorsed_to_hr','under_hr_review'];

    public function __construct(private ?BaseConnection $db = null)
    {
        $this->db ??= db_connect();
    }

    /** Called inside the criteria activation transaction; versions, periods, and jobs commit together. */
    public function enqueueForActivatedVersion(string $sourceVersionId, string $targetVersionId, string $actorProfileId, string $personnelGroup): array
    {
        foreach (['evaluation_criteria_recalculation_jobs', 'evaluation_criteria_recalculation_events', 'personnel_evaluation_periods', 'personnel_evaluations'] as $table) {
            if (! $this->db->tableExists($table)) throw new RuntimeException('CRITERIA_RECALCULATION_SCHEMA_NOT_READY', 503);
        }
        if (! $this->db->fieldExists('evaluation_scale_version_id', 'personnel_evaluations')) throw new RuntimeException('CRITERIA_RECALCULATION_SCHEMA_NOT_READY', 503);
        $scope = strtoupper(trim($personnelGroup));
        if (! in_array($scope, ['FACULTY', 'NON_TEACHING_FACULTY'], true)) throw new RuntimeException('CRITERIA_PERSONNEL_GROUP_UNRESOLVED', 409);

        $periods = $this->db->table('personnel_evaluation_periods')->where('evaluation_scale_version_id', $sourceVersionId)->get()->getResultArray();
        $periodById = [];
        $operational = ['DRAFT', 'OPEN_FOR_SUBMISSION', 'SUBMISSION_CLOSED', 'EVALUATION_ONGOING'];
        foreach ($periods as $period) {
            $periodById[(string) $period['id']] = $period;
            $status = strtoupper((string) ($period['status'] ?? ''));
            if (! in_array($status, array_merge($operational, ['CLOSED', 'ARCHIVED', 'CANCELLED']), true)) throw new RuntimeException('CRITERIA_PERIOD_STATUS_UNRESOLVED: Activation encountered an unrecognized ranking-period status.', 409);
            if (! in_array($status, $operational, true)) continue;
            $updates = ['evaluation_scale_version_id'=>$targetVersionId];
            if (isset($period['version'])) $updates['version'] = (int) $period['version'] + 1;
            if ($this->db->fieldExists('updated_by', 'personnel_evaluation_periods')) $updates['updated_by'] = $actorProfileId;
            if ($this->db->fieldExists('updated_at', 'personnel_evaluation_periods')) $updates['updated_at'] = date('Y-m-d H:i:s');
            $this->db->table('personnel_evaluation_periods')->where('id', $period['id'])->update($updates);
            if ($this->db->tableExists('personnel_evaluation_period_events')) {
                $this->db->table('personnel_evaluation_period_events')->insert([
                    'id'=>$this->uuid(), 'evaluation_period_id'=>$period['id'], 'event_type'=>'criteria_version_updated',
                    'actor_profile_id'=>$actorProfileId,
                    'old_values'=>json_encode(['evaluation_scale_version_id'=>$sourceVersionId], JSON_UNESCAPED_SLASHES),
                    'new_values'=>json_encode(['evaluation_scale_version_id'=>$targetVersionId], JSON_UNESCAPED_SLASHES),
                    'created_at'=>date('Y-m-d H:i:s'),
                ]);
            }
        }

        $hasPeriod = $this->db->fieldExists('evaluation_period_id', 'personnel_evaluations');
        $hasSnapshotGroup = $this->db->fieldExists('personnel_group_snapshot', 'personnel_evaluations');
        $builder = $this->db->table('personnel_evaluations pe')->select('pe.*');
        if ($hasPeriod) $builder->join('personnel_evaluation_periods p', 'p.id=pe.evaluation_period_id', 'left')->select('p.personnel_group AS period_group');
        $periodIds = array_keys($periodById);
        $builder->groupStart()->where('pe.evaluation_scale_version_id', $sourceVersionId);
        if ($hasPeriod) {
            $builder->orWhere('p.evaluation_scale_version_id', $sourceVersionId);
            // Periods were already advanced above, so include evaluations that
            // inherit their version only through the period reference.
            if ($periodIds !== []) $builder->orWhereIn('pe.evaluation_period_id', $periodIds);
        }
        $builder->groupEnd();
        $rows = $builder->get()->getResultArray();
        $count = 0;
        foreach ($rows as $evaluation) {
            $status = strtolower(trim((string) ($evaluation['status'] ?? '')));
            if (in_array($status, self::FINAL_STATUSES, true) || ! empty($evaluation['finalized_at']) || ! empty($evaluation['final_snapshot'])) continue;
            if (! in_array($status, self::MUTABLE_STATUSES, true)) throw new RuntimeException('CRITERIA_EVALUATION_STATUS_UNRESOLVED: Activation found an unrecognized evaluation lifecycle status.', 409);
            $evaluationGroup = $hasSnapshotGroup ? strtoupper(trim((string) ($evaluation['personnel_group_snapshot'] ?? ''))) : '';
            $periodGroup = strtoupper(trim((string) ($evaluation['period_group'] ?? '')));
            if (($evaluationGroup !== '' && $evaluationGroup !== $scope) || ($periodGroup !== '' && $periodGroup !== $scope)) continue;
            if ($evaluationGroup !== '' && $periodGroup !== '' && $evaluationGroup !== $periodGroup) throw new RuntimeException('CRITERIA_EVALUATION_SCOPE_MISMATCH: Evaluation and ranking period have different personnel groups.', 409);
            if ($evaluationGroup === '' && $periodGroup === '') throw new RuntimeException('CRITERIA_EVALUATION_SCOPE_UNRESOLVED: An evaluation has no verified personnel-group classification.', 409);

            $periodId = (string) ($evaluation['evaluation_period_id'] ?? '');
            $period = $periodById[$periodId] ?? ($periodId !== '' ? $this->db->table('personnel_evaluation_periods')->where('id', $periodId)->get()->getRowArray() : null);
            $reconfirmationStatus = 'not_required';
            $reviewerId = null;
            if ($scope === 'FACULTY' && $status === 'ready_for_finalization') {
                $authority = (new OrganizationalAuthorityResolver($this->db))->resolveResponsibleAuthority((string) $evaluation['personnel_profile_id'], $period ?: null);
                $reviewerId = (string) ($authority['authority_profile_id'] ?? '');
                if ($reviewerId === '' || $reviewerId === (string) $evaluation['personnel_profile_id']) throw new RuntimeException('CRITERIA_RECONFIRMATION_REVIEWER_UNRESOLVED: Cannot resolve an authorized, non-self reviewer for an endorsed evaluation.', 409);
                $reconfirmationStatus = 'pending';
            }

            $items = $this->db->table('personnel_evaluation_items')->where('evaluation_id', $evaluation['id'])->get()->getResultArray();
            $previous = [
                'evaluation_scale_version_id'=>$sourceVersionId,
                'criteria_snapshot'=>$this->decode($evaluation['criteria_snapshot'] ?? null),
                'scores'=>['total_score'=>$evaluation['total_score'] ?? null,'area_a_score'=>$evaluation['area_a_score'] ?? null,'area_b_score'=>$evaluation['area_b_score'] ?? null,'area_c_score'=>$evaluation['area_c_score'] ?? null],
                'items'=>$items,
            ];
            $jobId = $this->uuid(); $now = date('Y-m-d H:i:s');
            $this->db->table('evaluation_criteria_recalculation_jobs')->insert([
                'id'=>$jobId, 'evaluation_id'=>$evaluation['id'], 'source_version_id'=>$sourceVersionId, 'target_version_id'=>$targetVersionId,
                'status'=>'pending', 'reconfirmation_status'=>$reconfirmationStatus, 'required_reviewer_profile_id'=>$reviewerId,
                'attempt_count'=>0, 'previous_result_snapshot'=>json_encode($previous, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
                'created_at'=>$now, 'updated_at'=>$now,
            ]);
            $this->db->table('personnel_evaluations')->where('id', $evaluation['id'])->update(['evaluation_scale_version_id'=>$targetVersionId, 'updated_at'=>$now]);
            $this->event($jobId, (string) $evaluation['id'], 'recalculation_queued', $actorProfileId, ['source_version_id'=>$sourceVersionId,'target_version_id'=>$targetVersionId]);
            $count++;
        }
        return ['queued_evaluation_count'=>$count, 'updated_period_count'=>count(array_filter($periods, static fn(array $p): bool => in_array(strtoupper((string)($p['status']??'')), $operational, true)))];
    }

    /** Shared guard called before finalization, release, and score publication. */
    public function finalizationBlocker(array $evaluation): ?array
    {
        if (in_array(strtolower((string) ($evaluation['status'] ?? '')), self::FINAL_STATUSES, true)) return null;
        if (! $this->db->tableExists('evaluation_criteria_recalculation_jobs')) return ['code'=>'CRITERIA_RECALCULATION_SCHEMA_NOT_READY','message'=>'Criteria synchronization is unavailable; finalization is blocked.'];
        $versionId = (string) ($evaluation['evaluation_scale_version_id'] ?? '');
        $job = $this->db->table('evaluation_criteria_recalculation_jobs')->where('evaluation_id', (string) $evaluation['id'])->where('target_version_id', $versionId)->orderBy('created_at', 'DESC')->get()->getRowArray();
        if ($job) {
            if (($job['status'] ?? '') !== 'completed') return ['code'=>'CRITERIA_RECALCULATION_' . strtoupper((string) ($job['status'] ?? 'unknown')), 'message'=>'The evaluation must finish criteria recalculation before finalization.'];
            if (($job['reconfirmation_status'] ?? 'not_required') === 'pending') return ['code'=>'CRITERIA_RECONFIRMATION_REQUIRED','message'=>'The responsible reviewer must reconfirm the endorsement after the criteria change.'];
            if (($job['reconfirmation_status'] ?? 'not_required') === 'returned') return ['code'=>'CRITERIA_REVIEW_RETURNED','message'=>'The evaluation was returned for a new review and cannot be finalized in its previous version.'];
            return null;
        }
        $periodId = (string) ($evaluation['evaluation_period_id'] ?? '');
        if ($periodId !== '' && $this->db->tableExists('personnel_evaluation_periods')) {
            $period = $this->db->table('personnel_evaluation_periods')->select('evaluation_scale_version_id')->where('id', $periodId)->get()->getRowArray();
            if ($period && (string) ($period['evaluation_scale_version_id'] ?? '') !== $versionId) return ['code'=>'CRITERIA_VERSION_STALE','message'=>'Evaluation criteria do not match the version assigned to its ranking period.'];
        }
        return null;
    }

    public function assertCanFinalize(array $evaluation): void
    {
        $blocker = $this->finalizationBlocker($evaluation);
        if ($blocker) throw new RuntimeException($blocker['code'] . ': ' . $blocker['message'], 409);
    }

    public function statusForEvaluation(string $evaluationId): ?array
    {
        $evaluation = $this->db->table('personnel_evaluations')->where('id',$evaluationId)->get()->getRowArray();
        if (! $evaluation || ! $this->db->tableExists('evaluation_criteria_recalculation_jobs')) return null;
        $job = $this->db->table('evaluation_criteria_recalculation_jobs')->where('evaluation_id',$evaluationId)
            ->orderBy('created_at','DESC')->get()->getRowArray();
        if (! $job) return null;
        return [
            'job_id'=>$job['id'], 'source_version_id'=>$job['source_version_id'], 'target_version_id'=>$job['target_version_id'],
            'status'=>$job['status'], 'reconfirmation_status'=>$job['reconfirmation_status'],
            'scores_current'=>($job['status'] === 'completed'),
            'reconfirmation_required'=>($job['status'] === 'completed' && $job['reconfirmation_status'] === 'pending'),
            'required_reviewer_profile_id'=>$job['required_reviewer_profile_id'] ?? null,
            'attempt_count'=>(int)($job['attempt_count'] ?? 0),
            'last_error_code'=>$job['last_error_code'] ?? null, 'last_error_message'=>$job['last_error_message'] ?? null,
        ];
    }

    /** Processes one durable queue entry. A failed calculation rolls back all score writes. */
    public function processJob(string $jobId): array
    {
        $this->db->transBegin();
        try {
            $job = $this->locked('SELECT * FROM evaluation_criteria_recalculation_jobs WHERE id = ? FOR UPDATE', [$jobId])->getRowArray();
            if (! $job) throw new RuntimeException('CRITERIA_RECALCULATION_JOB_NOT_FOUND', 404);
            if (in_array($job['status'], ['completed','superseded'], true)) { $this->db->transCommit(); return ['job_id'=>$jobId,'status'=>$job['status'],'idempotent'=>true]; }
            if ($job['status'] !== 'pending') { $this->db->transCommit(); return ['job_id'=>$jobId,'status'=>$job['status'],'idempotent'=>true]; }
            $evaluation = $this->locked('SELECT * FROM personnel_evaluations WHERE id = ? FOR UPDATE', [$job['evaluation_id']])->getRowArray();
            if (! $evaluation) throw new RuntimeException('EVALUATION_NOT_FOUND', 404);
            if (in_array(strtolower((string) $evaluation['status']), self::FINAL_STATUSES, true) || ! empty($evaluation['finalized_at'])) {
                $this->db->table('evaluation_criteria_recalculation_jobs')->where('id', $jobId)->update(['status'=>'superseded','updated_at'=>date('Y-m-d H:i:s'),'completed_at'=>date('Y-m-d H:i:s')]);
                $this->event($jobId, (string) $evaluation['id'], 'recalculation_skipped_finalized', null, []);
                $this->db->transCommit(); return ['job_id'=>$jobId,'status'=>'superseded','idempotent'=>false];
            }
            if ((string) ($evaluation['evaluation_scale_version_id'] ?? '') !== (string) $job['target_version_id']) {
                $this->db->table('evaluation_criteria_recalculation_jobs')->where('id', $jobId)->update(['status'=>'superseded','updated_at'=>date('Y-m-d H:i:s'),'completed_at'=>date('Y-m-d H:i:s')]);
                $this->event($jobId, (string) $evaluation['id'], 'recalculation_superseded', null, ['current_version_id'=>$evaluation['evaluation_scale_version_id'] ?? null]);
                $this->db->transCommit(); return ['job_id'=>$jobId,'status'=>'superseded','idempotent'=>false];
            }
            $this->db->table('evaluation_criteria_recalculation_jobs')->where('id', $jobId)->update(['status'=>'processing','attempt_count'=>(int)$job['attempt_count']+1,'started_at'=>date('Y-m-d H:i:s'),'updated_at'=>date('Y-m-d H:i:s')]);
            $criteria = (new RubricAdministrationService())->getScaleVersionHierarchy((string) $job['target_version_id']);
            $items = $this->db->table('personnel_evaluation_items')->where('evaluation_id', $evaluation['id'])->get()->getResultArray();
            $updatedItems = $this->recalculateItems($items, $criteria, (string) $job['target_version_id']);
            $totals = $this->snapshotTotals($updatedItems);
            $now = date('Y-m-d H:i:s');
            if ($updatedItems !== []) $this->db->table('personnel_evaluation_items')->updateBatch($updatedItems, 'id');
            $evaluationUpdate = [
                'criteria_snapshot'=>json_encode($criteria, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
                'total_score'=>$totals['total_score'],'area_a_score'=>$totals['areaA_score'],'area_b_score'=>$totals['areaB_score'],'area_c_score'=>$totals['areaC_score'],
            ];
            if ($this->db->fieldExists('updated_at', 'personnel_evaluations')) $evaluationUpdate['updated_at'] = $now;
            $this->db->table('personnel_evaluations')->where('id', $evaluation['id'])->update($evaluationUpdate);
            $result = ['criteria_version_id'=>$job['target_version_id'],'scores'=>$totals,'items'=>$updatedItems,'previous_scores'=>$this->decode($job['previous_result_snapshot'])['scores'] ?? []];
            $status = $job['reconfirmation_status'] === 'pending' ? 'completed' : 'completed';
            $this->db->table('evaluation_criteria_recalculation_jobs')->where('id', $jobId)->update([
                'status'=>$status,'result_snapshot'=>json_encode($result, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),'last_error_code'=>null,'last_error_message'=>null,'updated_at'=>$now,'completed_at'=>$now,
            ]);
            $this->event($jobId, (string) $evaluation['id'], 'recalculation_completed', null, ['criteria_version_id'=>$job['target_version_id'],'scores'=>$totals]);
            if ($job['reconfirmation_status'] === 'pending') $this->notifyReviewer($job, $evaluation, $criteria, $now);
            $this->db->transCommit();
            return ['job_id'=>$jobId,'status'=>'completed','reconfirmation_status'=>$job['reconfirmation_status'],'scores'=>$totals,'idempotent'=>false];
        } catch (Throwable $error) {
            $this->db->transRollback();
            $this->recordFailure($jobId, $error);
            throw $error;
        }
    }

    public function processNext(int $limit = 20): array
    {
        $ids = array_column($this->db->table('evaluation_criteria_recalculation_jobs')->select('id')->where('status','pending')->orderBy('created_at','ASC')->limit(max(1, min(100, $limit)))->get()->getResultArray(), 'id');
        $results = [];
        foreach ($ids as $id) {
            try { $results[] = $this->processJob((string) $id); }
            catch (Throwable $e) { $results[] = ['job_id'=>$id,'status'=>'failed']; }
        }
        return $results;
    }

    public function retry(string $jobId, string $actorProfileId): array
    {
        $this->db->transBegin();
        try {
            $job = $this->locked('SELECT * FROM evaluation_criteria_recalculation_jobs WHERE id = ? FOR UPDATE', [$jobId])->getRowArray();
            if (! $job) throw new RuntimeException('CRITERIA_RECALCULATION_JOB_NOT_FOUND', 404);
            if ($job['status'] !== 'failed') throw new RuntimeException('CRITERIA_RECALCULATION_RETRY_NOT_ALLOWED', 409);
            $this->db->table('evaluation_criteria_recalculation_jobs')->where('id', $jobId)->update(['status'=>'pending','last_error_code'=>null,'last_error_message'=>null,'completed_at'=>null,'updated_at'=>date('Y-m-d H:i:s')]);
            $this->event($jobId, (string)$job['evaluation_id'], 'recalculation_retry_requested', $actorProfileId, []);
            $this->db->transCommit();
            return ['job_id'=>$jobId,'status'=>'pending'];
        } catch (Throwable $e) { $this->db->transRollback(); throw $e; }
    }

    /** Reconfirm the recalculated endorsement, or create a fresh evaluation revision for review. */
    public function decideReconfirmation(string $evaluationId, string $actorProfileId, string $decision, ?string $reason = null): array
    {
        if (! in_array($decision, ['reconfirm', 'return'], true)) throw new RuntimeException('CRITERIA_RECONFIRMATION_DECISION_INVALID', 422);
        if ($decision === 'return' && trim((string) $reason) === '') throw new RuntimeException('CRITERIA_RECONFIRMATION_RETURN_REASON_REQUIRED', 422);
        $this->db->transBegin();
        try {
            $evaluation = $this->locked('SELECT * FROM personnel_evaluations WHERE id = ? FOR UPDATE', [$evaluationId])->getRowArray();
            if (! $evaluation) throw new RuntimeException('EVALUATION_NOT_FOUND', 404);
            $job = $this->locked('SELECT * FROM evaluation_criteria_recalculation_jobs WHERE evaluation_id = ? AND target_version_id = ? ORDER BY created_at DESC FOR UPDATE', [$evaluationId, $evaluation['evaluation_scale_version_id']])->getRowArray();
            if (! $job || $job['status'] !== 'completed' || $job['reconfirmation_status'] !== 'pending') throw new RuntimeException('CRITERIA_RECONFIRMATION_NOT_PENDING', 409);
            if ((string) ($job['required_reviewer_profile_id'] ?? '') === '') throw new RuntimeException('CRITERIA_RECONFIRMATION_REVIEWER_UNRESOLVED', 409);
            $periodId = (string)($evaluation['evaluation_period_id'] ?? '');
            if ($periodId !== '') {
                $period = $this->db->table('personnel_evaluation_periods')->where('id',$periodId)->get()->getRowArray();
                $authorityResolver = new OrganizationalAuthorityResolver($this->db);
                $authority = $authorityResolver->resolveResponsibleAuthority((string)$evaluation['personnel_profile_id'], $period ?: null);
                if ((string)($authority['authority_profile_id'] ?? '') !== (string)$job['required_reviewer_profile_id'] || ! $authorityResolver->actorMayAct($authority, $actorProfileId)) throw new RuntimeException('CRITERIA_RECONFIRMATION_REVIEWER_REQUIRED', 403);
            } elseif ((string) ($job['required_reviewer_profile_id'] ?? '') !== $actorProfileId) {
                throw new RuntimeException('CRITERIA_RECONFIRMATION_REVIEWER_REQUIRED', 403);
            }
            if (($evaluation['status'] ?? '') !== 'ready_for_finalization') throw new RuntimeException('CRITERIA_RECONFIRMATION_EVALUATION_NOT_READY', 409);
            $now = date('Y-m-d H:i:s');
            if ($decision === 'reconfirm') {
                $this->db->table('evaluation_criteria_recalculation_jobs')->where('id', $job['id'])->update(['reconfirmation_status'=>'reconfirmed','reconfirmed_by_profile_id'=>$actorProfileId,'reconfirmed_at'=>$now,'updated_at'=>$now]);
                $this->event((string)$job['id'], $evaluationId, 'endorsement_reconfirmed', $actorProfileId, []);
                $this->db->transCommit();
                return ['evaluation_id'=>$evaluationId,'status'=>'reconfirmed'];
            }

            // Preserve the endorsed revision and its score history; create a new
            // editable evaluation revision and copy its item evidence forward.
            $latestBuilder = $this->db->table('personnel_evaluations');
            if (! empty($evaluation['evaluation_root_id'])) $latestBuilder->where('evaluation_root_id',$evaluation['evaluation_root_id']);
            else $latestBuilder->where('personnel_profile_id',$evaluation['personnel_profile_id'])->where('evaluation_period_id',$evaluation['evaluation_period_id']);
            $latest = $latestBuilder->orderBy('version_number','DESC')->get()->getRowArray();
            if (($latest['id'] ?? null) !== $evaluationId) throw new RuntimeException('EVALUATION_VERSION_SUPERSEDED', 409);
            $newEvaluationId = $this->uuid();
            $newEvaluation = $evaluation;
            $newEvaluation['id'] = $newEvaluationId;
            $newEvaluation['previous_version_id'] = $evaluationId;
            $newEvaluation['version_number'] = (int)($evaluation['version_number'] ?? 1) + 1;
            $newEvaluation['status'] = 'in_evaluation';
            if (array_key_exists('evaluator_profile_id', $newEvaluation)) $newEvaluation['evaluator_profile_id'] = $job['required_reviewer_profile_id'];
            $newEvaluation['finalized_at'] = null;
            if (array_key_exists('final_snapshot', $newEvaluation)) $newEvaluation['final_snapshot'] = null;
            if (array_key_exists('submitted_at', $newEvaluation)) $newEvaluation['submitted_at'] = $now;
            if (array_key_exists('updated_at', $newEvaluation)) $newEvaluation['updated_at'] = $now;
            if (array_key_exists('created_at', $newEvaluation)) $newEvaluation['created_at'] = $now;
            $this->db->table('personnel_evaluations')->insert($newEvaluation);
            $items = $this->db->table('personnel_evaluation_items')->where('evaluation_id',$evaluationId)->get()->getResultArray();
            foreach ($items as &$item) { $item['id']=$this->uuid(); $item['evaluation_id']=$newEvaluationId; if (array_key_exists('created_at',$item)) $item['created_at']=$now; if (array_key_exists('updated_at',$item)) $item['updated_at']=$now; }
            unset($item);
            if ($items !== []) $this->db->table('personnel_evaluation_items')->insertBatch($items);
            $this->db->table('evaluation_criteria_recalculation_jobs')->where('id',$job['id'])->update(['reconfirmation_status'=>'returned','updated_at'=>$now]);
            $this->event((string)$job['id'],$evaluationId,'endorsement_returned_for_review',$actorProfileId,['new_evaluation_id'=>$newEvaluationId,'reason'=>trim((string)$reason)]);
            $this->db->transCommit();
            return ['evaluation_id'=>$newEvaluationId,'previous_evaluation_id'=>$evaluationId,'status'=>'returned_for_review'];
        } catch (Throwable $error) { $this->db->transRollback(); throw $error; }
    }

    private function recalculateItems(array $items, array $criteria, string $versionId): array
    {
        $resolver = new LockedCriterionResolverService();
        $remarks = new EvaluationCriterionRemarkService();
        $hierarchy = $criteria['areas'] ?? [];
        $ntfByCode = [];
        foreach ($hierarchy as $area) if (strtoupper((string)($area['area_code']??'')) === 'A') foreach ($area['categories'] ?? [] as $category) $ntfByCode[strtoupper((string)$category['category_code'])] = $category;
        foreach ($items as &$item) {
            $code = trim((string)($item['criterion_code'] ?? ''));
            $scoring = $this->decode($item['scoring_payload'] ?? null);
            if (NtfAnnualReviewAreaAService::isLocked($item)) {
                $category = $ntfByCode[strtoupper($code)] ?? null;
                if (! $category) throw new RuntimeException('CRITERIA_MAPPING_INVALID: Locked Non-Teaching Area A criterion is absent from the new revision.');
                $dsValues = array_values(array_filter((array)($scoring['ds'] ?? []), 'is_numeric'));
                if ($dsValues === []) throw new RuntimeException('CRITERIA_RECALCULATION_MANUAL_REVIEW_REQUIRED: Locked Area A item has no preserved DS input.');
                $ds = round(array_sum($dsValues) / count($dsValues), 2);
                $max = (float)$category['max_points']; $weight = round($max / 100, 4); $awarded = min(round($ds * $weight, 2), $max);
                $snapshot = ['code'=>$code,'name'=>$category['name'],'max_points'=>$max,'weight'=>$weight,'criteria_version_id'=>$versionId,'scoring_rule'=>'DS × weight'];
                $item = array_merge($item, ['criterion_title'=>$category['name'],'criterion_version_id'=>$versionId,'criterion_snapshot'=>json_encode($snapshot, JSON_UNESCAPED_UNICODE),'configured_points_snapshot'=>$max,'max_allowed_points'=>$max,'raw_points'=>$awarded,'criterion_capped_points'=>$awarded,'awarded_points'=>$awarded,'accepted_points'=>$awarded]);
                continue;
            }
            if ($code === '') throw new RuntimeException('CRITERIA_MAPPING_INVALID: Evaluation item has no persisted criterion code.');
            $metadata = is_array($scoring['category_metadata'] ?? null) ? $scoring['category_metadata'] : [];
            foreach (['scope_level','organizer','category_code'] as $field) if (isset($scoring[$field]) && !isset($metadata[$field])) $metadata[$field] = $scoring[$field];
            $resolved = $resolver->resolve($criteria, $code, $metadata);
            $resolved = $remarks->snapshot($resolved);
            $configured = (float)($resolved['configured_points'] ?? 0);
            $cap = (float)($resolved['criterion_cap'] ?? $configured);
            $judgment = ! empty($resolved['evaluator_judgment_required']);
            $item = array_merge($item, [
                'criterion_key'=>$resolved['criterion_reference'] ?? ($item['criterion_key'] ?? $code),
                'criterion_version_id'=>$versionId,
                'criterion_snapshot'=>json_encode($resolved, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
                'configured_points_snapshot'=>$configured,'max_allowed_points'=>$cap,'evaluator_judgment_required'=>$judgment ? 1 : 0,
            ]);
            if (($item['verification_status'] ?? '') === 'verified' && ($item['rating_status'] ?? '') === 'rated') {
                if ($judgment) {
                    $awarded = (float)($item['awarded_points'] ?? $item['accepted_points'] ?? 0);
                    $accepted = (float)($item['accepted_points'] ?? $awarded);
                    if ($awarded > $cap + 0.001 || $accepted > $cap + 0.001) throw new RuntimeException('CRITERIA_RECALCULATION_MANUAL_REVIEW_REQUIRED: An existing evaluator award exceeds the updated criterion cap.');
                } elseif (! GraduateUnitScoringService::isUnitItem($item)) {
                    $item['raw_points'] = $configured; $item['criterion_capped_points'] = min($configured, $cap); $item['awarded_points'] = min($configured, $cap);
                    if (array_key_exists('accepted_points', $item) && $item['accepted_points'] !== null) $item['accepted_points'] = min($configured, $cap);
                }
            }
        }
        unset($item);
        return $items;
    }

    /** Uses the same catalog snapshot caps and Graduate Unit aggregation as HR evaluation totals. */
    private function snapshotTotals(array $items): array
    {
        $categories=[]; $categoryAreas=[]; $categoryCaps=[]; $areaCaps=[];
        $graduateUnits = GraduateUnitScoringService::aggregate($items);
        foreach ($items as $item) {
            if (($item['verification_status'] ?? '') !== 'verified' || ($item['rating_status'] ?? '') !== 'rated') continue;
            $snapshot=$this->decode($item['criterion_snapshot']??null); $category=$snapshot['category']??[]; $isUnit=GraduateUnitScoringService::isUnitItem($item);
            $code=(string)($category['category_code']??$item['criterion_code']??'UNMAPPED'); $area=strtoupper((string)($category['area_code']??substr($code,0,1)));
            $categories[$code]=($categories[$code]??0.0)+($isUnit?0.0:(float)($item['awarded_points']??0)); $categoryAreas[$code]=$area;
            $categoryCaps[$code]=(float)($snapshot['criterion_cap']??$category['max_points']??PHP_FLOAT_MAX); $areaCaps[$area]=(float)($category['area_max_points']??$areaCaps[$area]??PHP_FLOAT_MAX);
        }
        foreach ($graduateUnits as $level) $categories[$level['category_code']]=($categories[$level['category_code']]??0.0)+$level['points'];
        $areas=['A'=>0.0,'B'=>0.0,'C'=>0.0];
        foreach ($categories as $code=>$points) if (isset($categoryAreas[$code])) $areas[$categoryAreas[$code]]=($areas[$categoryAreas[$code]]??0)+min($points,$categoryCaps[$code]);
        foreach ($areas as $area=>$points) $areas[$area]=min($points,$areaCaps[$area]??PHP_FLOAT_MAX);
        return ['areaA_score'=>$areas['A'],'areaB_score'=>$areas['B'],'areaC_score'=>$areas['C'],'total_score'=>array_sum($areas),'category_scores'=>$categories,'graduate_units'=>array_values($graduateUnits)];
    }

    private function notifyReviewer(array $job, array $evaluation, array $criteria, string $now): void
    {
        $reviewer = (string)($job['required_reviewer_profile_id'] ?? '');
        if ($reviewer === '' || ! $this->db->tableExists('notifications')) throw new RuntimeException('CRITERIA_RECONFIRMATION_NOTIFICATION_UNAVAILABLE');
        $this->db->table('notifications')->insert([
            'id'=>$this->uuid(),'recipient_profile_id'=>$reviewer,'notification_type'=>'evaluation_criteria_reconfirmation_required',
            'title'=>'Evaluation endorsement needs reconfirmation','message'=>'The scoring criteria changed and the evaluation was recalculated. Review the updated scoring and reconfirm the endorsement.',
            'reference_type'=>'evaluation_criteria_recalculation_jobs','reference_id'=>$job['id'],'is_mandatory'=>1,'created_at'=>$now,
        ]);
    }

    private function recordFailure(string $jobId, Throwable $error): void
    {
        if (! $this->db->tableExists('evaluation_criteria_recalculation_jobs')) return;
        $message = trim(preg_replace('/\s+/', ' ', $error->getMessage()) ?? 'Criteria recalculation failed.');
        $code = strtoupper(strtok($message, ': ') ?: 'CRITERIA_RECALCULATION_FAILED');
        $this->db->table('evaluation_criteria_recalculation_jobs')->where('id', $jobId)->whereNotIn('status', ['completed','superseded'])->update([
            'status'=>'failed','attempt_count'=>new \CodeIgniter\Database\RawSql('attempt_count + 1'),'last_error_code'=>substr($code,0,100),'last_error_message'=>substr($message,0,2000),'updated_at'=>date('Y-m-d H:i:s'),'completed_at'=>date('Y-m-d H:i:s'),
        ]);
        $job=$this->db->table('evaluation_criteria_recalculation_jobs')->where('id',$jobId)->get()->getRowArray();
        if ($job) $this->event($jobId,(string)$job['evaluation_id'],'recalculation_failed',null,['error_code'=>$code]);
    }

    private function event(string $jobId, string $evaluationId, string $type, ?string $actorId, array $details): void
    {
        $this->db->table('evaluation_criteria_recalculation_events')->insert(['id'=>$this->uuid(),'job_id'=>$jobId,'evaluation_id'=>$evaluationId,'event_type'=>$type,'actor_profile_id'=>$actorId,'details'=>json_encode($details,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE),'created_at'=>date('Y-m-d H:i:s')]);
    }

    private function locked(string $sql, array $params = [])
    {
        if (str_contains(strtolower((string)$this->db->DBDriver), 'sqlite')) $sql = preg_replace('/\s+FOR UPDATE\s*$/i', '', $sql) ?? $sql;
        return $this->db->query($sql, $params);
    }

    private function decode(mixed $value): array
    {
        if (is_array($value)) return $value;
        if (! is_string($value) || $value === '') return [];
        $decoded=json_decode($value,true); return is_array($decoded)?$decoded:[];
    }

    private function uuid(): string
    {
        $d=random_bytes(16);$d[6]=chr((ord($d[6])&15)|0x40);$d[8]=chr((ord($d[8])&0x3f)|0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s',str_split(bin2hex($d),4));
    }
}
