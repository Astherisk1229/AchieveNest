<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;

/** Resolve report rank fields using the institution's shared active rank rules. */
final class PersonnelSharedRankContextService
{
    public function __construct(private BaseConnection $db)
    {
    }

    public function forPersonnel(string $profileId, string $trackId): array
    {
        $profile = $this->db->table('personnel_profiles')->select('current_rank_title')
            ->where('profile_id', $profileId)->get()->getRowArray() ?: [];
        $present = trim((string) ($profile['current_rank_title'] ?? ''));
        $previous = $this->db->tableExists('personnel_rank_history')
            ? $this->db->table('personnel_rank_history')->select('rank_code')
                ->where('personnel_profile_id', $profileId)->where('status', 'historical')
                ->orderBy('effective_to', 'DESC')->get()->getRowArray()
            : null;
        $decision = $this->db->tableExists('personnel_rank_applied_for_decisions')
            ? $this->db->table('personnel_rank_applied_for_decisions')->select('id,confirmed_rank_code,verified_credential_references')
                ->where('personnel_profile_id', $profileId)->where('ranking_track_id', $trackId)
                ->where('status', 'confirmed')->orderBy('confirmed_at', 'DESC')->get()->getRowArray()
            : null;
        $progression = null;
        if ($present !== '') {
            $hasVerifiedPhd = $this->db->tableExists('personnel_credentials') && $this->db->table('personnel_credentials')
                ->where(['personnel_profile_id' => $profileId, 'verification_status' => 'verified',
                    'record_state' => 'active', 'credential_type' => 'degree', 'degree_level' => 'doctorate'])
                ->countAllResults() > 0;
            $progression = (new FacultyRankProgressionService())->getAllowedTransitions($present, [
                'personnel_group' => 'non_teaching_faculty',
                'personnel_profile_id' => $profileId,
                'has_verified_phd' => $hasVerifiedPhd,
            ]);
        }
        $catalog = new FacultyRankCatalogService();
        $label = static fn (?string $value): ?string => $value === null || $value === ''
            ? null
            : (($catalog->getRankByCode($value) ?? $catalog->getRankByLabel($value))['display_label'] ?? $value);
        // A possible next rank is not the employee's confirmed Rank Applied For.
        $applied = $decision['confirmed_rank_code'] ?? null;
        $status = $decision ? 'confirmed' : (($progression['status'] ?? '') === 'OK' ? 'PENDING_CONFIRMATION' : ($progression['status'] ?? 'UNRESOLVED'));
        if (! $decision && in_array($progression['current_rank_code'] ?? '',
            ['ASSISTANT_INSTRUCTOR', 'SENIOR_INSTRUCTOR'], true)
            && empty($progression['all_valid_target_ranks'])) {
            $status = 'MASTERS_REQUIRED';
        }

        return [
            'employee_progress_last_ranking' => $label($previous['rank_code'] ?? null),
            'present_rank' => $label($present),
            'rank_applied_for' => $label($applied),
            'rank_applied_for_status' => $status,
            'rank_applied_for_decision_id' => $decision['id'] ?? null,
            'rank_applied_for_credential_references' => $decision['verified_credential_references'] ?? null,
        ];
    }
}
