<?php

namespace App\Services;
/*
 * PARKED (2026-09-30): student_portfolio_records is the single system of record for student
 * achievements in this release. This canonical lifecycle is retained but no UI calls it.
 * See docs/IMPLEMENTATION_PROMPT_STUDENT_ACHIEVEMENT_WORKFLOW.md (section 0) before reusing it.
 */

use CodeIgniter\Database\BaseConnection;
use RuntimeException;

/**
 * Resolves canonical student submissions to exactly one active, authorized
 * Program Coordinator. The single route row is the queue identity, so retries
 * cannot create duplicate verification tasks. The event table is append-only
 * audit history.
 */
final class StudentAchievementRoutingService
{
    public function __construct(private ?BaseConnection $db = null)
    {
        $this->db ??= db_connect();
    }

    public function routeSubmittedVersion(
        string $recordVersionId,
        ?string $actorProfileId = null
    ): array {
        $recordVersionId = trim($recordVersionId);

        if ($recordVersionId === '') {
            throw new RuntimeException(
                'STUDENT_ACHIEVEMENT_RECORD_VERSION_REQUIRED'
            );
        }

        $version = $this->db
            ->table('achievement_record_versions arv')
            ->select(
                'arv.id, arv.submission_state, ar.owner_profile_id, '
                . 'ar.owner_domain, ar.current_version_id'
            )
            ->join(
                'achievement_records ar',
                'ar.id = arv.achievement_record_id'
            )
            ->where('arv.id', $recordVersionId)
            ->get()
            ->getRowArray();

        if ($version === null) {
            throw new RuntimeException(
                'STUDENT_ACHIEVEMENT_RECORD_VERSION_NOT_FOUND'
            );
        }

        if (($version['owner_domain'] ?? '') !== 'STUDENT') {
            throw new RuntimeException(
                'STUDENT_ACHIEVEMENT_OWNER_DOMAIN_INVALID'
            );
        }

        if (($version['current_version_id'] ?? '') !== $recordVersionId) {
            throw new RuntimeException(
                'STUDENT_ACHIEVEMENT_VERSION_NOT_CURRENT'
            );
        }

        if (
            ! in_array(
                (string) $version['submission_state'],
                ['draft', 'revision_requested', 'routing_pending', 'submitted'],
                true
            )
        ) {
            throw new RuntimeException(
                'STUDENT_ACHIEVEMENT_VERSION_NOT_SUBMITTABLE'
            );
        }

        $resolution = $this->resolveCoordinator(
            (string) $version['owner_profile_id']
        );
        $now = date('Y-m-d H:i:s.u');
        $targetStatus = $resolution['coordinator_profile_id'] === null
            ? 'routing_pending'
            : 'routed';
        $submissionState = $targetStatus === 'routed'
            ? 'submitted'
            : 'routing_pending';

        $existing = $this->db
            ->table('student_achievement_verification_routes')
            ->where('record_version_id', $recordVersionId)
            ->get()
            ->getRowArray();

        $unchanged = $existing !== null
            && ($existing['routing_status'] ?? '') === $targetStatus
            && ($existing['academic_program_id'] ?? null)
                === $resolution['academic_program_id']
            && ($existing['coordinator_profile_id'] ?? null)
                === $resolution['coordinator_profile_id']
            && ($existing['reason_code'] ?? '') === $resolution['reason_code']
            && ($version['submission_state'] ?? '') === $submissionState;

        if ($unchanged) {
            return $this->result($recordVersionId, $resolution, false);
        }

        $this->db->transStart();

        $this->db->table('achievement_record_versions')
            ->where('id', $recordVersionId)
            ->update([
                'submission_state' => $submissionState,
                'submitted_at' => $version['submission_state'] === 'draft'
                    ? $now
                    : new \CodeIgniter\Database\RawSql(
                        'COALESCE(`submitted_at`, CURRENT_TIMESTAMP(6))'
                    ),
                'locked_at' => $now,
            ]);

        $route = [
            'record_version_id' => $recordVersionId,
            'academic_program_id' => $resolution['academic_program_id'],
            'coordinator_profile_id'
                => $resolution['coordinator_profile_id'],
            'routing_status' => $targetStatus,
            'reason_code' => $resolution['reason_code'],
            'resolved_at' => $targetStatus === 'routed' ? $now : null,
            'updated_at' => $now,
        ];

        if ($existing === null) {
            $route['created_at'] = $now;
            $this->db->table(
                'student_achievement_verification_routes'
            )->insert($route);
        } else {
            $this->db->table(
                'student_achievement_verification_routes'
            )->where('record_version_id', $recordVersionId)->update($route);
        }

        $this->db->table('student_achievement_routing_events')->insert([
            'id' => $this->uuid(),
            'record_version_id' => $recordVersionId,
            'event_type' => $targetStatus === 'routed'
                ? 'routing_resolved'
                : 'submission_routing_evaluated',
            'previous_routing_status'
                => $existing['routing_status'] ?? null,
            'new_routing_status' => $targetStatus,
            'academic_program_id' => $resolution['academic_program_id'],
            'coordinator_profile_id'
                => $resolution['coordinator_profile_id'],
            'actor_profile_id' => $actorProfileId,
            'reason_code' => $resolution['reason_code'],
            'occurred_at' => $now,
        ]);

        $this->db->transComplete();

        if ($this->db->transStatus() === false) {
            throw new RuntimeException(
                'STUDENT_ACHIEVEMENT_ROUTING_TRANSACTION_FAILED'
            );
        }

        return $this->result($recordVersionId, $resolution, true);
    }

    public function reconcilePendingForProgram(
        string $academicProgramId,
        ?string $actorProfileId = null
    ): array {
        $rows = $this->db
            ->table('student_achievement_verification_routes savr')
            ->select('savr.record_version_id')
            ->where('savr.routing_status', 'routing_pending')
            ->where('savr.academic_program_id', $academicProgramId)
            ->get()
            ->getResultArray();

        $routed = 0;

        foreach ($rows as $row) {
            $result = $this->routeSubmittedVersion(
                (string) $row['record_version_id'],
                $actorProfileId
            );

            if ($result['routing_status'] === 'routed') {
                $routed++;
            }
        }

        return [
            'evaluated' => count($rows),
            'routed' => $routed,
            'still_pending' => count($rows) - $routed,
        ];
    }

    private function resolveCoordinator(string $studentProfileId): array
    {
        $enrollments = $this->db
            ->table('student_program_enrollments spe')
            ->select('spe.academic_program_id')
            ->join(
                'academic_programs ap',
                "ap.id = spe.academic_program_id AND ap.status = 'active'"
            )
            ->where('spe.student_profile_id', $studentProfileId)
            ->where('spe.is_active', 1)
            ->orderBy('spe.effective_from', 'DESC')
            ->get()
            ->getResultArray();

        if ($enrollments === []) {
            return $this->pending(null, 'NO_ACTIVE_STUDENT_PROGRAM');
        }

        $programIds = array_values(array_unique(array_column(
            $enrollments,
            'academic_program_id'
        )));

        if (count($programIds) !== 1) {
            return $this->pending(null, 'AMBIGUOUS_ACTIVE_STUDENT_PROGRAM');
        }

        $programId = (string) $programIds[0];
        $coordinators = $this->db
            ->table('program_coordinator_assignments pca')
            ->select('pca.personnel_profile_id')
            ->join(
                'profiles p',
                "p.id = pca.personnel_profile_id AND p.status = 'active'"
            )
            ->where('pca.academic_program_id', $programId)
            ->where('pca.is_active', 1)
            ->get()
            ->getResultArray();

        $coordinatorIds = array_values(array_unique(array_column(
            $coordinators,
            'personnel_profile_id'
        )));

        if ($coordinatorIds === []) {
            return $this->pending(
                $programId,
                'NO_ACTIVE_AUTHORIZED_PROGRAM_COORDINATOR'
            );
        }

        if (count($coordinatorIds) !== 1) {
            return $this->pending(
                $programId,
                'AMBIGUOUS_ACTIVE_PROGRAM_COORDINATOR'
            );
        }

        return [
            'academic_program_id' => $programId,
            'coordinator_profile_id' => (string) $coordinatorIds[0],
            'reason_code' => 'AUTHORIZED_PROGRAM_COORDINATOR_RESOLVED',
        ];
    }

    private function pending(?string $programId, string $reason): array
    {
        return [
            'academic_program_id' => $programId,
            'coordinator_profile_id' => null,
            'reason_code' => $reason,
        ];
    }

    private function result(
        string $recordVersionId,
        array $resolution,
        bool $changed
    ): array {
        $routed = $resolution['coordinator_profile_id'] !== null;

        return [
            'record_version_id' => $recordVersionId,
            'submission_state' => $routed
                ? 'submitted'
                : 'routing_pending',
            'routing_status' => $routed ? 'routed' : 'routing_pending',
            'academic_program_id' => $resolution['academic_program_id'],
            'coordinator_profile_id'
                => $resolution['coordinator_profile_id'],
            'reason_code' => $resolution['reason_code'],
            'changed' => $changed,
        ];
    }

    private function uuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(
            bin2hex($data),
            4
        ));
    }
}
