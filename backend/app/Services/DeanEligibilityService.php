<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;

class DeanEligibilityService
{
    public function check(string $profileId, string $collegeId, ?BaseConnection $db = null): array
    {
        $db ??= db_connect();
        $row = $db->query(
            "SELECT p.id, p.full_name, p.institutional_id, p.email,
                    p.account_type='personnel' AS account_type_personnel,
                    p.status='active' AS active_profile,
                    pp.profile_id IS NOT NULL AS personnel_profile_exists,
                    pp.personnel_classification='academic' AS academic_personnel,
                    EXISTS(SELECT 1 FROM personnel_college_affiliations pca
                           WHERE pca.personnel_profile_id=p.id AND pca.college_id=? AND pca.is_active=1) AS active_college_affiliation
             FROM profiles p LEFT JOIN personnel_profiles pp ON pp.profile_id=p.id WHERE p.id=? LIMIT 1",
            [$collegeId, $profileId]
        )->getRowArray();
        $checks = [
            'profile_exists' => $row !== null,
            'account_type_personnel' => (bool) ($row['account_type_personnel'] ?? false),
            'active_profile' => (bool) ($row['active_profile'] ?? false),
            'academic_personnel' => (bool) ($row['academic_personnel'] ?? false),
            'active_college_affiliation' => (bool) ($row['active_college_affiliation'] ?? false),
        ];
        return ['eligible' => ! in_array(false, $checks, true), 'checks' => $checks, 'personnel' => $row];
    }
}
