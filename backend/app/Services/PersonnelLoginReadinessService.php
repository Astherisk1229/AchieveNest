<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;

/**
 * Computes a safe, HR-facing view of a personnel account's login readiness.
 * Password hashes and session material never leave this service.
 */
class PersonnelLoginReadinessService
{
    public const READY = 'READY';
    public const NOT_READY = 'NOT_READY';
    public const NEEDS_PASSWORD_CHANGE = 'NEEDS_PASSWORD_CHANGE';
    public const DISABLED = 'DISABLED';
    public const IDENTITY_CONFLICT = 'IDENTITY_CONFLICT';
    public const UNKNOWN = 'UNKNOWN';

    public function evaluate(array $record): array
    {
        $reasons = [];
        $profileExists = $this->truthy($record['profile_exists'] ?? true);
        $personnelProfileExists = $this->truthy($record['has_personnel_profile'] ?? false);
        $profileActive = strtolower((string) ($record['profile_status'] ?? $record['status'] ?? '')) === 'active';
        $correctAccountType = strtolower((string) ($record['account_type'] ?? '')) === 'personnel';
        $credentialExists = $this->truthy($record['has_credential'] ?? false);
        $hashExists = $this->truthy($record['has_password_hash'] ?? false);
        $credentialActive = strtolower((string) ($record['credential_status'] ?? '')) === 'active';
        $hasPersonnelRole = (int) ($record['active_personnel_roles'] ?? 0) > 0;
        $mustChangePassword = $this->truthy($record['must_change_password'] ?? $record['credential_must_change_password'] ?? false);

        if (! $profileExists) $reasons[] = 'ORPHANED_PROFILE';
        if (! $personnelProfileExists) $reasons[] = 'MISSING_PERSONNEL_PROFILE';
        if (! $profileActive) $reasons[] = 'INACTIVE_PROFILE';
        if (! $correctAccountType) $reasons[] = 'WRONG_ACCOUNT_TYPE';
        if (! $credentialExists) $reasons[] = 'MISSING_CREDENTIAL';
        if ($credentialExists && ! $hashExists) $reasons[] = 'EMPTY_PASSWORD_HASH';
        if ($credentialExists && ! $credentialActive) $reasons[] = 'INACTIVE_CREDENTIAL';
        if (! $hasPersonnelRole) $reasons[] = 'MISSING_PERSONNEL_ROLE';
        if ((int) ($record['duplicate_email_count'] ?? 1) > 1) $reasons[] = 'DUPLICATE_EMAIL';
        if ((int) ($record['duplicate_employee_id_count'] ?? 1) > 1) $reasons[] = 'DUPLICATE_EMPLOYEE_ID';

        $identityConflict = in_array('DUPLICATE_EMAIL', $reasons, true)
            || in_array('DUPLICATE_EMPLOYEE_ID', $reasons, true);
        $disabled = in_array('INACTIVE_PROFILE', $reasons, true)
            || in_array('INACTIVE_CREDENTIAL', $reasons, true);
        $structurallyReady = $reasons === [];

        if ($identityConflict) {
            $status = self::IDENTITY_CONFLICT;
            $canSignIn = false;
        } elseif ($disabled) {
            $status = self::DISABLED;
            $canSignIn = false;
        } elseif (! $structurallyReady) {
            $status = self::NOT_READY;
            $canSignIn = false;
        } elseif ($mustChangePassword) {
            $status = self::NEEDS_PASSWORD_CHANGE;
            $canSignIn = true;
            $reasons[] = 'MUST_CHANGE_PASSWORD';
        } else {
            $status = self::READY;
            $canSignIn = true;
        }

        return [
            'status' => $status,
            'can_sign_in' => $canSignIn,
            'must_change_password' => $mustChangePassword,
            'reason_codes' => array_values(array_unique($reasons)),
            'governance_contexts' => [
                'dean' => $this->context($record['active_dean_assignments'] ?? 0),
                'program_coordinator' => $this->context($record['active_coordinator_assignments'] ?? 0),
                'organization_moderator' => $this->context($record['active_moderator_assignments'] ?? 0),
            ],
            'checked_at' => gmdate('c'),
        ];
    }

    public function evaluateByProfileId(string $profileId, ?BaseConnection $db = null): array
    {
        $db ??= db_connect();
        $row = $db->query(
            "SELECT p.id, 1 AS profile_exists, p.account_type, p.status AS profile_status,
                    (pp.profile_id IS NOT NULL) AS has_personnel_profile,
                    (lac.profile_id IS NOT NULL) AS has_credential,
                    (COALESCE(lac.password_hash, '') <> '') AS has_password_hash,
                    lac.status AS credential_status, lac.must_change_password,
                    (SELECT COUNT(*) FROM profile_roles pr JOIN roles r ON r.id=pr.role_id
                     WHERE pr.profile_id=p.id AND pr.is_active=1 AND r.role_key='personnel') AS active_personnel_roles,
                    (SELECT COUNT(*) FROM dean_assignments da WHERE da.personnel_profile_id=p.id AND da.is_active=1) AS active_dean_assignments,
                    (SELECT COUNT(*) FROM program_coordinator_assignments ca WHERE ca.personnel_profile_id=p.id AND ca.is_active=1) AS active_coordinator_assignments,
                    (SELECT COUNT(*) FROM organization_moderator_assignments ma WHERE ma.personnel_profile_id=p.id AND ma.is_active=1) AS active_moderator_assignments,
                    (SELECT COUNT(*) FROM profiles pe WHERE LOWER(TRIM(pe.email))=LOWER(TRIM(p.email))) AS duplicate_email_count,
                    (SELECT COUNT(*) FROM profiles pi WHERE pi.institutional_id=p.institutional_id) AS duplicate_employee_id_count
             FROM profiles p
             LEFT JOIN personnel_profiles pp ON pp.profile_id=p.id
             LEFT JOIN local_auth_credentials lac ON lac.profile_id=p.id
             WHERE p.id=? LIMIT 1",
            [$profileId]
        )->getRowArray();

        return $row === null
            ? $this->evaluate(['profile_exists' => false])
            : $this->evaluate($row);
    }

    private function context(mixed $count): array
    {
        $assignmentCount = max(0, (int) $count);
        return ['available' => $assignmentCount > 0, 'assignment_count' => $assignmentCount];
    }

    private function truthy(mixed $value): bool
    {
        return in_array($value, [true, 1, '1', 'true'], true);
    }
}
