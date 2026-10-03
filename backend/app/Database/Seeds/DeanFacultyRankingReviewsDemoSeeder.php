<?php

namespace App\Database\Seeds;

use App\Services\FacultyStatusService;
use App\Services\LockedCriterionResolverService;
use App\Services\OrganizationalAuthorityResolver;
use App\Services\PersonnelClassificationService;
use App\Services\PersonnelEligibilityService;
use App\Services\PersonnelEvaluationPeriodService;
use App\Services\RubricAdministrationService;
use CodeIgniter\Database\Seeder;
use RuntimeException;
use Throwable;

/**
 * Local-only, idempotent showcase data for the Dean → Faculty Ranking Reviews tabs
 * (Needs Review, Resubmitted, Returned, Endorsed to HR, Completed).
 *
 * Six synthetic CBA faculty are created, each with a confirmed passing Annual Review,
 * permanent full-time service, and a portfolio in the current HR Faculty ranking track:
 *
 *   1 Villanueva  submitted (v1)                          → Needs Review
 *   2 Dela Cruz   in_evaluation (v1, Dean started)        → Needs Review (Review in Progress)
 *   3 Reyes       v1 returned → v2 submitted              → Needs Review + Resubmitted
 *   4 Mendoza     returned_for_revision (v1)              → Returned
 *   5 Bautista    ready_for_finalization (v1)             → Endorsed to HR
 *   6 Garcia      completed (v1)                          → Completed
 *
 * Run: php spark db:seed DeanFacultyRankingReviewsDemoSeeder
 * All rows use the d7200000- id prefix; re-running replaces them in place.
 */
class DeanFacultyRankingReviewsDemoSeeder extends Seeder
{
    private const DEAN_ID = 'd0000000-0000-0000-0001-000000000007';
    private const HR_ID = 'd0000000-0000-0000-0001-000000000005';
    private const PROGRAM_SOURCES = ['d0000000-0000-0000-0001-000000000008', 'd0000000-0000-0000-0001-000000000009'];

    private array $period;
    private array $criteria;
    private array $college;
    private array $programs;
    private array $columns = [];

    public function run()
    {
        if (ENVIRONMENT === 'production') throw new RuntimeException('Demo seeding is disabled in production.');

        $this->period = $this->resolvePeriod();
        $this->college = $this->resolveCollege();
        $this->programs = $this->resolvePrograms();
        $this->criteria = $this->resolveCriteria();

        $people = $this->people();
        $this->db->transStart();
        foreach ($people as $person) {
            $this->seedPerson($person);
            $this->seedAnnualReview($person);
            $this->seedPortfolio($person);
        }
        $this->db->transComplete();
        if (! $this->db->transStatus()) throw new RuntimeException('Dean Faculty Ranking Reviews demo records could not be seeded.');

        $this->verify($people);
    }

    // ---------------------------------------------------------------- personas

    private function people(): array
    {
        $id = static fn (int $group, int $n): string => sprintf('d7200000-0000-0000-%04d-%012d', $group, $n);
        $rows = [
            [1, 'Andrea L. Villanueva', 'Assistant Professor I', 'submitted', 0, '-2 days', '2016-06-01'],
            [2, 'Paolo M. Dela Cruz', 'Instructor III', 'in_evaluation', 1, '-4 days', '2018-06-01'],
            [3, 'Kristine A. Reyes', 'Assistant Professor II', 'resubmitted', 0, '-9 days', '2015-06-01'],
            [4, 'Jerome T. Mendoza', 'Instructor II', 'returned_for_revision', 1, '-7 days', '2019-06-01'],
            [5, 'Liza Marie C. Bautista', 'Associate Professor I', 'ready_for_finalization', 0, '-12 days', '2012-06-01'],
            [6, 'Ramon D. Garcia', 'Associate Professor III', 'completed', 1, '-20 days', '2009-06-01'],
        ];
        $out = [];
        foreach ($rows as [$n, $name, $rank, $state, $programIndex, $offset, $start]) {
            $program = $this->programs[$programIndex % count($this->programs)];
            $out[] = [
                'n' => $n, 'name' => $name, 'rank' => $rank, 'state' => $state, 'offset' => $offset, 'start' => $start,
                'program' => $program,
                'profile_id' => $id(1, $n),
                'institutional_id' => sprintf('DEMO-FRR-%03d', $n),
                'email' => sprintf('demo.faculty.review%d@ndmu.edu.ph', $n),
                'college_affiliation_id' => $id(2, $n),
                'program_affiliation_id' => $id(3, $n),
                'role_link_id' => $id(4, $n),
                'import_id' => $id(5, $n),
                'root_id' => $id(6, $n),
                'v1_id' => $id(7, $n),
                'v2_id' => $id(8, $n),
            ];
        }
        return $out;
    }

    // ---------------------------------------------------------------- context

    private function resolvePeriod(): array
    {
        $period = (new PersonnelEvaluationPeriodService($this->db))->currentWorkflowTrack('FACULTY');
        if (! $period) throw new RuntimeException('No current HR Faculty ranking track exists. Open the Faculty track in HR first.');
        if (! in_array($period['status'] ?? '', ['OPEN_FOR_SUBMISSION', 'SUBMISSION_CLOSED', 'EVALUATION_ONGOING'], true)) {
            throw new RuntimeException("The Faculty track \"{$period['period_name']}\" is {$period['status']}; eligibility requires an open or ongoing track.");
        }
        return $period;
    }

    private function resolveCollege(): array
    {
        $row = $this->db->table('dean_assignments da')->select('c.id,c.name')
            ->join('colleges c', 'c.id=da.college_id')
            ->where('da.personnel_profile_id', self::DEAN_ID)->where('da.is_active', 1)->get()->getRowArray();
        if (! $row) throw new RuntimeException('Demo Dean (CBA) has no active Dean assignment. Run DefenseDemoSeeder first.');
        return $row;
    }

    private function resolvePrograms(): array
    {
        $programs = [];
        foreach (self::PROGRAM_SOURCES as $source) {
            $row = $this->db->table('personnel_program_affiliations ppa')->select('ap.id,ap.name')
                ->join('academic_programs ap', 'ap.id=ppa.academic_program_id')
                ->where('ppa.personnel_profile_id', $source)->where('ppa.is_active', 1)->get()->getRowArray();
            if ($row && ! isset($programs[$row['id']])) $programs[$row['id']] = $row;
        }
        if (! $programs && $this->db->fieldExists('college_id', 'academic_programs')) {
            foreach ($this->db->table('academic_programs')->select('id,name')->where('college_id', $this->college['id'])->orderBy('name')->limit(2)->get()->getResultArray() as $row) {
                $programs[$row['id']] = $row;
            }
        }
        if (! $programs) throw new RuntimeException('No CBA academic programs were found for the demo faculty.');
        return array_values($programs);
    }

    private function resolveCriteria(): array
    {
        try {
            return (new RubricAdministrationService())->getScaleVersionHierarchy((string) $this->period['evaluation_scale_version_id']);
        } catch (Throwable) {
            return ['version' => ['id' => $this->period['evaluation_scale_version_id'], 'passing_score' => 75], 'areas' => []];
        }
    }

    // ---------------------------------------------------------------- person + eligibility

    private function seedPerson(array $p): void
    {
        $now = date('Y-m-d H:i:s');
        $this->upsert('profiles', [
            'id' => $p['profile_id'], 'institutional_id' => $p['institutional_id'], 'email' => $p['email'],
            'full_name' => $p['name'], 'account_type' => 'personnel', 'designation_title' => $p['rank'],
            'status' => 'active', 'password_hash' => password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT),
            'created_at' => $now, 'updated_at' => $now,
        ]);
        $this->upsert('personnel_profiles', [
            'profile_id' => $p['profile_id'],
            'personnel_classification' => PersonnelClassificationService::SIDE_ACADEMIC,
            'personnel_group' => PersonnelClassificationService::GROUP_FACULTY,
            'organizational_side' => PersonnelClassificationService::SIDE_ACADEMIC,
            'employment_status' => FacultyStatusService::EMPLOYMENT_PERMANENT,
            'faculty_engagement' => FacultyStatusService::ENGAGEMENT_FULL_TIME,
            'employment_start_date' => $p['start'],
            'position_title' => $p['rank'], 'current_rank_title' => $p['rank'],
            'created_at' => $now, 'updated_at' => $now,
        ]);
        // One active College affiliation per person (unique guard): retire any stray one first.
        $this->db->table('personnel_college_affiliations')->where('personnel_profile_id', $p['profile_id'])
            ->where('id !=', $p['college_affiliation_id'])->update(['is_active' => 0]);
        $this->upsert('personnel_college_affiliations', [
            'id' => $p['college_affiliation_id'], 'personnel_profile_id' => $p['profile_id'], 'college_id' => $this->college['id'],
            'effective_from' => $p['start'], 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $this->upsert('personnel_program_affiliations', [
            'id' => $p['program_affiliation_id'], 'personnel_profile_id' => $p['profile_id'], 'academic_program_id' => $p['program']['id'],
            'effective_from' => $p['start'], 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $role = $this->db->table('roles')->select('id')->where('role_key', 'personnel')->get()->getRowArray();
        if ($role && ! $this->db->table('profile_roles')->where(['profile_id' => $p['profile_id'], 'role_id' => $role['id']])->countAllResults()) {
            $this->insert('profile_roles', ['id' => $p['role_link_id'], 'profile_id' => $p['profile_id'], 'role_id' => $role['id'], 'scope_type' => 'university', 'is_active' => 1, 'assigned_at' => $now]);
        }
    }

    private function seedAnnualReview(array $p): void
    {
        $now = date('Y-m-d H:i:s');
        // Keep exactly one confirmed, current import for this track.
        $this->db->table('personnel_annual_review_imports')->where('personnel_profile_id', $p['profile_id'])
            ->where('evaluation_period_id', $this->period['id'])->where('id !=', $p['import_id'])->where('superseded_at', null)
            ->update(['superseded_at' => $now, 'updated_at' => $now]);
        [$y1, $y2] = $this->reviewYears();
        $ratings = [['outstanding', 'very_satisfactory'], ['very_satisfactory', 'very_satisfactory'], ['outstanding', 'outstanding'], ['satisfactory', 'very_satisfactory'], ['outstanding', 'outstanding'], ['very_satisfactory', 'outstanding']][$p['n'] - 1];
        $this->upsert('personnel_annual_review_imports', [
            'id' => $p['import_id'], 'personnel_profile_id' => $p['profile_id'], 'expected_personnel_profile_id' => $p['profile_id'],
            'evaluation_period_id' => $this->period['id'], 'source' => 'demo_seed',
            'source_file_path' => 'demo/annual-review/' . $p['institutional_id'] . '.xlsx',
            'original_filename' => 'Annual_Review_' . $p['institutional_id'] . '.xlsx',
            'file_hash' => hash('sha256', $p['profile_id'] . $this->period['id']),
            'template_identifier' => 'demo_faculty_annual_review', 'detected_personnel_name' => $p['name'],
            'review_1_school_year' => $y1, 'review_1_rating' => $ratings[0],
            'review_2_school_year' => $y2, 'review_2_rating' => $ratings[1],
            'two_review_status' => 'passed', 'two_review_reason' => null,
            'validation_status' => 'valid', 'validation_issues' => json_encode([]), 'match_status' => 'matched',
            'uploaded_by' => self::DEAN_ID, 'uploader_workspace' => 'dean',
            'uploaded_at' => date('Y-m-d H:i:s', strtotime('-30 days')), 'confirmed_at' => date('Y-m-d H:i:s', strtotime('-29 days')),
            'supersedes_import_id' => null, 'superseded_at' => null, 'correction_reason' => null,
            'created_at' => $now, 'updated_at' => $now,
        ]);
    }

    private function reviewYears(): array
    {
        // "2027-2028" → reviews for 2025-2026 and 2026-2027.
        if (preg_match('/(\d{4})\D+(\d{4})/', (string) $this->period['academic_year'], $m)) {
            $start = (int) $m[1];
            return [($start - 2) . '-' . ($start - 1), ($start - 1) . '-' . $start];
        }
        return ['2025-2026', '2026-2027'];
    }

    // ---------------------------------------------------------------- portfolio

    private function seedPortfolio(array $p): void
    {
        $existing = $this->db->table('personnel_evaluations')->select('id')
            ->where('personnel_profile_id', $p['profile_id'])->where('evaluation_period_id', $this->period['id'])->get()->getResultArray();
        foreach ($existing as $row) {
            if (! in_array($row['id'], [$p['v1_id'], $p['v2_id']], true)) {
                throw new RuntimeException("Demo seed stopped: {$p['name']} already has a non-demo evaluation in this track.");
            }
        }
        foreach ([$p['v2_id'], $p['v1_id']] as $evaluationId) $this->clearEvaluation($evaluationId);

        $submittedAt = date('Y-m-d H:i:s', strtotime($p['offset']));
        $this->upsert('personnel_evaluation_roots', [
            'id' => $p['root_id'], 'personnel_profile_id' => $p['profile_id'],
            'evaluation_cycle_id' => $this->period['id'], 'evaluation_period_id' => $this->period['id'],
            'academic_year' => $this->period['academic_year'], 'created_by' => $p['profile_id'],
            'created_at' => $submittedAt, 'updated_at' => date('Y-m-d H:i:s'),
        ]);

        if ($p['state'] === 'resubmitted') {
            $this->seedEvaluation($p, $p['v1_id'], 1, null, 'returned_for_revision', $submittedAt);
            $this->seedEvaluation($p, $p['v2_id'], 2, $p['v1_id'], 'submitted', date('Y-m-d H:i:s', strtotime('-1 day')));
            return;
        }
        $this->seedEvaluation($p, $p['v1_id'], 1, null, $p['state'], $submittedAt);
    }

    private function seedEvaluation(array $p, string $id, int $version, ?string $previousId, string $status, string $submittedAt): void
    {
        $at = static fn (string $base, string $shift): string => date('Y-m-d H:i:s', strtotime($base . ' ' . $shift));
        $started = in_array($status, ['in_evaluation', 'returned_for_revision', 'ready_for_finalization', 'completed'], true) ? $at($submittedAt, '+1 day') : null;
        $returned = $status === 'returned_for_revision' ? $at($submittedAt, '+2 days') : null;
        $endorsed = in_array($status, ['ready_for_finalization', 'completed'], true) ? $at($submittedAt, '+3 days') : null;
        $finalized = $status === 'completed' ? $at($submittedAt, '+6 days') : null;

        $items = $this->buildItems($p, $id, $status, $started);
        $totals = ['A' => 0.0, 'B' => 0.0, 'C' => 0.0];
        foreach ($items as $item) $totals[$item['_area']] += (float) $item['awarded_points'];
        $total = array_sum($totals);
        $passing = (float) ($this->criteria['sheet']['passing_score'] ?? $this->criteria['version']['passing_score'] ?? 75);

        $returnReason = $returned ? 'Please attach the signed certificate for the PICPA membership and the committee designation memo.' : null;
        $this->upsert('personnel_evaluations', [
            'id' => $id, 'personnel_profile_id' => $p['profile_id'],
            'evaluator_profile_id' => self::DEAN_ID, 'originating_evaluator_profile_id' => self::DEAN_ID,
            'academic_year' => $this->period['academic_year'], 'semester' => (string) ($this->period['semester'] ?? ''),
            'score_professional_development' => min(70, $totals['A']), 'score_productivity_creative_work' => min(50, $totals['B']),
            'score_service_leadership' => min(40, $totals['C']),
            'area_a_score' => $totals['A'], 'area_b_score' => $totals['B'], 'area_c_score' => $totals['C'], 'total_score' => $total,
            'passing_status' => $total >= $passing ? 'pass' : 'fail',
            'status' => $status, 'submission_type' => 'Personnel Ranking Evaluation',
            'submitted_at' => $submittedAt, 'evaluation_started_at' => $started,
            'returned_at' => $returned, 'return_reason' => $returnReason,
            'finalized_at' => $finalized, 'finalized_by' => $finalized ? self::HR_ID : null,
            'version_number' => $version, 'previous_version_id' => $previousId,
            'evaluation_root_id' => $p['root_id'], 'evaluation_cycle_id' => $this->period['id'],
            'evaluation_period_id' => $this->period['id'],
            'period_name_snapshot' => $this->period['period_name'],
            'evaluation_type_snapshot' => $this->period['evaluation_type'] ?? 'RANKING_PROMOTION',
            'coverage_label_snapshot' => ($this->period['coverage_label'] ?? '') ?: 'Full Academic Year',
            'evaluation_scale_version_id' => $this->period['evaluation_scale_version_id'],
            'personnel_group_snapshot' => 'FACULTY',
            'criteria_snapshot' => json_encode($this->criteria, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'position_title_snapshot' => $p['rank'],
            'college_id_snapshot' => $this->college['id'], 'college_name_snapshot' => $this->college['name'],
            'eligibility_snapshot' => json_encode(['fixture' => 'dean_faculty_ranking_reviews_demo', 'eligibility_status' => 'eligible', 'eligibility_reasons' => []]),
            'final_snapshot' => $finalized ? json_encode(['criteria_version_id' => $this->period['evaluation_scale_version_id'], 'grand_total' => $total]) : null,
            'created_at' => $submittedAt, 'updated_at' => $finalized ?? $endorsed ?? $returned ?? $started ?? $submittedAt,
        ]);

        foreach ($items as $item) {
            unset($item['_area']);
            $this->insert('personnel_evaluation_items', $item);
        }

        $events = [[$version > 1 ? 'portfolio_resubmitted' : 'portfolio_submitted', $p['profile_id'], 'draft', 'submitted', $submittedAt, "Version {$version} submitted"]];
        if ($started) $events[] = ['review_started', self::DEAN_ID, 'submitted', 'in_evaluation', $started, 'Dean review started'];
        if ($returned) $events[] = ['revision_requested', self::DEAN_ID, 'in_evaluation', 'returned_for_revision', $returned, $returnReason];
        if ($endorsed) $events[] = ['evaluation_ready_for_finalization', self::DEAN_ID, 'in_evaluation', 'ready_for_finalization', $endorsed, 'Endorsed to HR by Demo Dean (CBA)'];
        if ($finalized) $events[] = ['evaluation_finalized', self::HR_ID, 'ready_for_finalization', 'completed', $finalized, 'Finalized by HR'];
        foreach ($events as $i => [$type, $actor, $from, $to, $when, $note]) {
            $this->event(substr($id, 0, 19) . sprintf('a%d%02d-', $version, $i) . substr($id, -12), $id, $type, $actor, $from, $to, $when, $note);
        }
    }

    private function buildItems(array $p, string $evaluationId, string $status, ?string $evaluatedAt): array
    {
        $claims = [
            ['A.1', 'A1_MA_HOLDER', 'professional_development', 'Master in Business Administration — Notre Dame of Marbel University', 'MBA_Diploma.pdf'],
            ['A.2', 'A2_MEMBERSHIP', 'professional_development', 'Regular member, Philippine Institute of Certified Public Accountants', 'PICPA_Membership.pdf'],
            ['C.1', 'C1_COMMITTEE', 'service_leadership', 'Member, CBA Program Accreditation Task Force', 'Committee_Designation_Memo.pdf'],
            ['C.2', 'C2_CIVIC', 'service_leadership', 'Volunteer facilitator, Koronadal City financial-literacy outreach', 'Outreach_Certificate.pdf'],
        ];
        $done = in_array($status, ['ready_for_finalization', 'completed'], true);
        $items = [];
        foreach ($claims as $order => [$code, $subtype, $domain, $title, $file]) {
            $snapshot = $this->criterionSnapshot($code, $subtype);
            $points = (float) ($snapshot['configured_points'] ?? 0);
            $verified = $done || ($status === 'in_evaluation' && $order === 0) || ($status === 'returned_for_revision' && $order === 0);
            $needsRevision = $status === 'returned_for_revision' && $order === 1;
            $itemId = sprintf('d7200000-0000-0000-%04d-%012d', 9, (int) substr($evaluationId, -2) * 1000 + (int) substr($evaluationId, 19, 4) * 10 + $order);
            $evidence = [[
                'id' => 'demo-ev-' . substr($itemId, -6), 'original_filename' => $file, 'mime_type' => 'application/pdf',
                'byte_size' => 48000 + 1024 * $order, 'sha256' => hash('sha256', $itemId), 'status' => 'active',
            ]];
            $items[] = [
                '_area' => $code[0],
                'id' => $itemId, 'evaluation_id' => $evaluationId, 'accomplishment_id' => null,
                'domain' => $domain, 'item_description' => $title, 'category_area' => 'area' . $code[0],
                'criterion_code' => $code, 'criterion_key' => $snapshot['criterion_reference'] ?? ($code . '-' . strtolower($subtype)),
                'criterion_title' => $snapshot['category']['title'] ?? $title,
                'criterion_version_id' => $this->period['evaluation_scale_version_id'],
                'criterion_snapshot' => json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'configured_points_snapshot' => $points, 'portfolio_section' => $domain, 'submission_order' => $order,
                'evidence_snapshot' => json_encode($evidence, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'evidence_title' => $title, 'file_name' => $file, 'source_type' => 'accomplishment',
                'verification_status' => $verified ? 'verified' : ($needsRevision ? 'needs_revision' : 'pending'),
                'rating_status' => $verified ? 'rated' : 'unrated',
                'awarded_points' => $verified ? $points : 0,
                'rejection_reason' => $needsRevision ? 'Membership certificate is unsigned; upload the signed copy.' : null,
                'evaluated_by' => $verified ? self::DEAN_ID : null, 'evaluated_at' => $verified ? $evaluatedAt : null,
                'scoring_payload' => json_encode(['scope_level' => 'Local', 'category_code' => $code, 'category_metadata' => ['subcategory_code' => $subtype], 'fixture' => 'dean_faculty_ranking_reviews_demo']),
                'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s'),
            ];
        }
        return $items;
    }

    private function criterionSnapshot(string $code, string $subtype): array
    {
        try {
            return (new LockedCriterionResolverService())->resolve($this->criteria, $code, ['subcategory_code' => $subtype, 'scope_level' => 'Local']);
        } catch (Throwable) {
            return ['criterion_reference' => $code . '-demo', 'configured_points' => 5, 'category' => ['code' => $code, 'area' => $code[0]], 'fixture' => true];
        }
    }

    private function clearEvaluation(string $evaluationId): void
    {
        foreach (['personnel_evaluation_reports', 'personnel_evaluation_events', 'personnel_evaluation_items'] as $table) {
            if ($this->db->tableExists($table)) $this->db->table($table)->where('evaluation_id', $evaluationId)->delete();
        }
        $this->db->table('personnel_evaluations')->where('id', $evaluationId)->delete();
    }

    private function event(string $id, string $evaluationId, string $type, string $actor, string $from, string $to, string $when, ?string $note): void
    {
        $table = 'personnel_evaluation_events';
        $row = ['id' => $id, 'evaluation_id' => $evaluationId];
        $row[$this->db->fieldExists('event_type', $table) ? 'event_type' : 'action'] = $type;
        $row[$this->db->fieldExists('performed_by', $table) ? 'performed_by' : 'actor_profile_id'] = $actor;
        if ($this->db->fieldExists('payload', $table)) $row['payload'] = json_encode(['notes' => $note, 'fixture' => 'dean_faculty_ranking_reviews_demo']);
        foreach (['notes', 'remarks'] as $field) $row[$field] = $note;
        foreach (['created_at', 'occurred_at'] as $field) $row[$field] = $when;
        $row['previous_status'] = $from;
        $row['new_status'] = $to;
        $this->insert($table, $row);
    }

    // ---------------------------------------------------------------- verification

    private function verify(array $people): void
    {
        $resolver = new OrganizationalAuthorityResolver($this->db);
        $eligibility = new PersonnelEligibilityService($this->db);
        $counts = ['needs_review' => 0, 'resubmitted' => 0, 'returned' => 0, 'endorsed' => 0, 'completed' => 0];
        foreach ($people as $p) {
            $authority = $resolver->resolveResponsibleAuthority($p['profile_id'], $this->period);
            if (($authority['authority_type'] ?? '') !== 'DEAN' || ! $resolver->actorMayAct($authority, self::DEAN_ID)) {
                throw new RuntimeException("Verification failed: Demo Dean is not the responsible reviewer for {$p['name']}.");
            }
            $result = $eligibility->evaluateEligibility($p['profile_id'], (string) $this->period['id']);
            if (($result['annual_review_requirement']['status'] ?? '') !== 'passed' || ($result['eligibility_status'] ?? '') !== 'eligible') {
                throw new RuntimeException("Verification failed: {$p['name']} is not eligible — " . implode(' ', $result['eligibility_reasons'] ?? []));
            }
            match ($p['state']) {
                'submitted', 'in_evaluation' => $counts['needs_review']++,
                'resubmitted' => [$counts['needs_review']++, $counts['resubmitted']++],
                'returned_for_revision' => $counts['returned']++,
                'ready_for_finalization' => $counts['endorsed']++,
                'completed' => $counts['completed']++,
            };
        }
        $summary = [];
        foreach ($counts as $tab => $count) $summary[] = "{$tab}={$count}";
        echo "Dean Faculty Ranking Reviews demo ready for {$this->college['name']} · {$this->period['period_name']}: " . implode(', ', $summary) . PHP_EOL;
    }

    // ---------------------------------------------------------------- helpers

    private function fields(string $table): array
    {
        if (! isset($this->columns[$table])) {
            $generated = array_column($this->db->query(
                "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND EXTRA LIKE '%GENERATED%'",
                [$table]
            )->getResultArray(), 'COLUMN_NAME');
            $this->columns[$table] = array_diff($this->db->getFieldNames($table), $generated);
        }
        return $this->columns[$table];
    }

    private function filter(string $table, array $row): array
    {
        return array_intersect_key($row, array_flip($this->fields($table)));
    }

    private function upsert(string $table, array $row): void
    {
        $this->db->table($table)->upsert($this->filter($table, $row));
    }

    private function insert(string $table, array $row): void
    {
        $this->db->table($table)->insert($this->filter($table, $row));
    }
}
