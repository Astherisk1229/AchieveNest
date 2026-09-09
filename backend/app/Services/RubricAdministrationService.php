<?php

namespace App\Services;

use Config\Database;
use RuntimeException;

class RubricAdministrationService
{
    /**
     * Lists all evaluation scales with their versions.
     */
    public function listScalesWithVersions(): array
    {
        $db = Database::connect();

        $scales = $db->table('evaluation_scales')
            ->orderBy('created_at', 'ASC')
            ->get()
            ->getResultArray();

        $result = [];
        foreach ($scales as $scale) {
            $versions = $db->table('evaluation_scale_versions')
                ->where('scale_id', $scale['id'])
                ->orderBy('version_number', 'DESC')
                ->get()
                ->getResultArray();

            $result[] = [
                'id' => $scale['id'],
                'scale_code' => $scale['scale_code'],
                'title' => $scale['title'],
                'description' => $scale['description'],
                'total_points' => (float)$scale['total_points'],
                'passing_score' => (float)$scale['passing_score'],
                'versions' => array_map(function ($v) {
                    return [
                        'id' => $v['id'],
                        'version_number' => $v['version_number'],
                        'evaluation_cycle_id' => $v['evaluation_cycle_id'],
                        'status' => $v['status'],
                        'total_max_points' => (float)$v['total_max_points'],
                        'passing_score' => (float)$v['passing_score'],
                        'source_document_ref' => $v['source_document_ref'],
                        'approved_at' => $v['approved_at'],
                    ];
                }, $versions),
            ];
        }

        return $result;
    }

    /**
     * Approves a draft scale version for an evaluation cycle.
     */
    public function approveVersion(string $versionId, string $actorUserId, string $reason): array
    {
        $db = Database::connect();

        $version = $db->table('evaluation_scale_versions')
            ->where('id', $versionId)
            ->get()
            ->getRowArray();

        if (!$version) {
            throw new RuntimeException("Scale version [{$versionId}] not found.", 404);
        }

        if ($version['status'] === 'approved') {
            throw new RuntimeException("Scale version [{$versionId}] is already approved.", 409);
        }

        $now = date('Y-m-d H:i:s');
        $beforeState = $version;

        $db->table('evaluation_scale_versions')
            ->where('id', $versionId)
            ->update([
                'status' => 'approved',
                'approved_by_user_id' => $actorUserId,
                'approved_at' => $now,
                'updated_at' => $now,
            ]);

        // Audit Event
        $db->table('evaluation_scale_change_events')->insert([
            'id' => 'esce-' . bin2hex(random_bytes(8)),
            'scale_version_id' => $versionId,
            'action' => 'version_approved',
            'actor_user_id' => $actorUserId,
            'reason' => $reason,
            'before_state' => json_encode($beforeState),
            'after_state' => json_encode(array_merge($beforeState, ['status' => 'approved', 'approved_at' => $now])),
            'created_at' => $now,
        ]);

        return [
            'version_id' => $versionId,
            'status' => 'approved',
            'approved_at' => $now,
            'message' => 'Scale version approved successfully.'
        ];
    }

    /**
     * Retires an active scale version.
     */
    public function retireVersion(string $versionId, string $actorUserId, string $reason): array
    {
        $db = Database::connect();

        $version = $db->table('evaluation_scale_versions')
            ->where('id', $versionId)
            ->get()
            ->getRowArray();

        if (!$version) {
            throw new RuntimeException("Scale version [{$versionId}] not found.", 404);
        }

        if ($version['status'] === 'retired') {
            throw new RuntimeException("Scale version [{$versionId}] is already retired.", 409);
        }

        $now = date('Y-m-d H:i:s');
        $beforeState = $version;

        $db->table('evaluation_scale_versions')
            ->where('id', $versionId)
            ->update([
                'status' => 'retired',
                'updated_at' => $now,
            ]);

        // Audit Event
        $db->table('evaluation_scale_change_events')->insert([
            'id' => 'esce-' . bin2hex(random_bytes(8)),
            'scale_version_id' => $versionId,
            'action' => 'version_retired',
            'actor_user_id' => $actorUserId,
            'reason' => $reason,
            'before_state' => json_encode($beforeState),
            'after_state' => json_encode(array_merge($beforeState, ['status' => 'retired'])),
            'created_at' => $now,
        ]);

        return [
            'version_id' => $versionId,
            'status' => 'retired',
            'message' => 'Scale version retired successfully.'
        ];
    }
}
