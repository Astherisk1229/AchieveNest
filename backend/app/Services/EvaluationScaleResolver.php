<?php

namespace App\Services;

use Config\Database;
use RuntimeException;

class EvaluationScaleResolver
{
    /**
     * Resolves the canonical Evaluation Scale Code from the authoritative personnel group.
     *
     * @param string $personnelGroup 'faculty' | 'non_teaching_faculty'
     * @param string $organizationalSide 'academic' | 'non_academic'
     * @return string Canonical Scale Code ('ADMINISTRATORS_RANKING_SCALE' | 'NON_TEACHING_PERSONNEL_RANKING_SCALE')
     * @throws RuntimeException if the pair is invalid or rejected
     */
    public function resolveScaleCode(string $personnelGroup, string $organizationalSide = ''): string
    {
        $group = strtolower(trim($personnelGroup));

        if ($group === 'faculty') {
            return 'ADMINISTRATORS_RANKING_SCALE';
        }

        if ($group === 'non_teaching_faculty') {
            return 'NON_TEACHING_PERSONNEL_RANKING_SCALE';
        }

        throw new RuntimeException("Invalid personnel group: [{$group}]. Cannot resolve evaluation scale.", 422);
    }

    /**
     * Resolves the approved, effective scale version record for a given scale code and evaluation cycle.
     *
     * @param string $scaleCode
     * @param string $evaluationCycleId
     * @return array Scale and Version record
     * @throws RuntimeException if scale or approved version is unavailable
     */
    public function resolveActiveScaleVersion(string $scaleCode, string $evaluationCycleId = '2025-2026'): array
    {
        $db = Database::connect();

        $scale = $db->table('evaluation_scales')
            ->where('scale_code', $scaleCode)
            ->get()
            ->getRowArray();

        if (!$scale) {
            throw new RuntimeException("Evaluation scale [{$scaleCode}] not found in catalogue.", 404);
        }

        $version = $db->table('evaluation_scale_versions')
            ->where('scale_id', $scale['id'])
            ->where('evaluation_cycle_id', $evaluationCycleId)
            ->where('status', 'approved')
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getRowArray();

        if (!$version) {
            throw new RuntimeException("Approved scale configuration unavailable for scale [{$scaleCode}] in cycle [{$evaluationCycleId}].", 409);
        }

        return [
            'scale' => $scale,
            'version' => $version,
        ];
    }

    /**
     * Resolves scale and version directly for a personnel profile.
     *
     * @param string $personnelProfileId
     * @param string $evaluationCycleId
     * @return array
     */
    public function resolveForPersonnel(string $personnelProfileId, string $evaluationCycleId = '2025-2026'): array
    {
        $db = Database::connect();

        $profile = $db->table('personnel_profiles')
            ->select('profile_id AS id, personnel_group, organizational_side, faculty_engagement, employment_status')
            ->where('profile_id', $personnelProfileId)
            ->get()
            ->getRowArray();

        if (!$profile) {
            throw new RuntimeException("Personnel profile [{$personnelProfileId}] not found.", 404);
        }

        $scaleCode = $this->resolveScaleCode($profile['personnel_group'] ?? '');

        $resolved = $this->resolveActiveScaleVersion($scaleCode, $evaluationCycleId);

        return array_merge($resolved, [
            'personnel_profile' => $profile,
            'scale_code' => $scaleCode,
            'evaluation_cycle_id' => $evaluationCycleId,
        ]);
    }
}
