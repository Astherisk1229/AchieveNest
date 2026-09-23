<?php

namespace App\Services;

use Config\Database;
use RuntimeException;

/**
 * Class EvaluationScaleAssignmentService
 *
 * Server-Authoritative Scale Assignment Service for Plan F — Phase F1.
 *
 * Decides exactly one evaluation scale per Personnel evaluation context based on
 * the canonical Plan D classification pair (Personnel Group + Organizational Side).
 * Enforces the authoritative assignment matrix frozen in Phase F0.
 */
class EvaluationScaleAssignmentService
{
    protected EvaluationInstrumentRegistry $registry;

    public function __construct(?EvaluationInstrumentRegistry $registry = null)
    {
        $this->registry = $registry ?? new EvaluationInstrumentRegistry();
    }

    /**
     * Resolves the canonical scale assignment for a given Personnel Profile ID.
     *
     * @param string|int $personnelProfileId
     * @param string $evaluationCycleId
     * @return array Assignment DTO
     * @throws RuntimeException
     */
    public function resolveScaleForPersonnel($personnelProfileId, string $evaluationCycleId = '2025-2026'): array
    {
        $db = Database::connect();

        $profile = $db->table('personnel_profiles')
            ->select('id, personnel_group, organizational_side, faculty_status, workload_status, employment_status, college_id')
            ->where('id', (int)$personnelProfileId)
            ->get()
            ->getRowArray();

        if (!$profile) {
            throw new RuntimeException("Personnel profile [{$personnelProfileId}] was not found.", 404);
        }

        return $this->resolveScaleFromContext([
            'personnel_profile_id' => (int)$profile['id'],
            'personnel_group' => $profile['personnel_group'] ?? '',
            'organizational_side' => $profile['organizational_side'] ?? '',
            'faculty_status' => $profile['faculty_status'] ?? $profile['workload_status'] ?? '',
            'evaluation_cycle_id' => $evaluationCycleId,
        ]);
    }

    /**
     * Resolves scale assignment directly from a classification context array.
     *
     * @param array $context
     * @return array
     * @throws RuntimeException
     */
    public function resolveScaleFromContext(array $context): array
    {
        $profileId = $context['personnel_profile_id'] ?? null;
        $group = strtolower(trim((string)($context['personnel_group'] ?? '')));
        $side = strtolower(trim((string)($context['organizational_side'] ?? '')));
        $cycleId = $context['evaluation_cycle_id'] ?? '2025-2026';

        if ($group === '' || $side === '') {
            throw new RuntimeException("Incomplete personnel classification context: personnel_group and organizational_side are required.", 422);
        }

        try {
            $scaleCode = EvaluationInstrumentRegistry::resolveScaleCode($group, $side);
        } catch (RuntimeException $e) {
            return [
                'personnel_profile_id' => $profileId,
                'personnel_group' => $group,
                'organizational_side' => $side,
                'evaluation_scale_code' => null,
                'scale_title' => null,
                'rule_version' => EvaluationInstrumentRegistry::RULE_VERSION,
                'assignment_source' => 'canonical_profile_matrix',
                'assignment_status' => 'rejected',
                'reason_code' => 'unsupported_personnel_combination',
                'override_applied' => false,
                'override_reason' => null,
                'resolved_at' => date('c'),
                'message' => $e->getMessage(),
            ];
        }

        $instrument = EvaluationInstrumentRegistry::getInstrument($scaleCode);

        return [
            'personnel_profile_id' => $profileId,
            'personnel_group' => $group,
            'organizational_side' => $side,
            'evaluation_scale_code' => $scaleCode,
            'scale_title' => $instrument['title'] ?? $scaleCode,
            'rule_version' => EvaluationInstrumentRegistry::RULE_VERSION,
            'assignment_source' => 'canonical_profile_matrix',
            'assignment_status' => 'assigned',
            'reason_code' => 'scale_assigned_successfully',
            'override_applied' => false,
            'override_reason' => null,
            'resolved_at' => date('c'),
            'evaluation_cycle_id' => $cycleId,
            'instrument' => $instrument,
        ];
    }

    /**
     * Validates if a proposed scale code matches the authoritative scale for the personnel.
     *
     * @param string|int $personnelProfileId
     * @param string $scaleCode
     * @return bool
     */
    public function validateScaleAssignment($personnelProfileId, string $scaleCode): bool
    {
        try {
            $resolved = $this->resolveScaleForPersonnel($personnelProfileId);
            return $resolved['evaluation_scale_code'] === $scaleCode;
        } catch (RuntimeException $e) {
            return false;
        }
    }

    /**
     * Retrieves the full effective instrument configuration for a personnel member.
     *
     * @param string|int $personnelProfileId
     * @param string $evaluationCycleId
     * @return array
     */
    public function getEffectiveInstrument($personnelProfileId, string $evaluationCycleId = '2025-2026'): array
    {
        $resolved = $this->resolveScaleForPersonnel($personnelProfileId, $evaluationCycleId);
        if ($resolved['assignment_status'] !== 'assigned') {
            throw new RuntimeException("Cannot retrieve instrument: " . ($resolved['message'] ?? 'Scale assignment rejected.'), 422);
        }

        return $resolved['instrument'];
    }

    /**
     * Returns a human-readable explanation of why a scale was assigned.
     *
     * @param string|int $personnelProfileId
     * @return string
     */
    public function getAssignmentExplanation($personnelProfileId): string
    {
        $resolved = $this->resolveScaleForPersonnel($personnelProfileId);
        if ($resolved['assignment_status'] === 'assigned') {
            return "Assigned [{$resolved['scale_title']}] based on canonical classification [{$resolved['personnel_group']} + {$resolved['organizational_side']}].";
        }

        return "Scale assignment rejected: unsupported classification combination [{$resolved['personnel_group']} + {$resolved['organizational_side']}].";
    }
}
