<?php

namespace App\Controllers\Api;

use App\Services\SupabaseAuthService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class ProvisioningController extends Controller
{
    use ResponseTrait;

    public function options()
    {
        return $this->respond(null, 204);
    }

    /**
     * Resolves authenticated actor, checking active status and roles.
     */
    protected function resolveActor(): ?array
    {
        $authorization = $this->request->getHeaderLine('Authorization');
        if ($authorization === '' || ! preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
            return null;
        }

        $token = trim($matches[1]);

        try {
            $claims = (new SupabaseAuthService())->verifyAccessToken($token);
        } catch (Throwable) {
            return null;
        }

        $authUserId = (string) ($claims->sub ?? '');
        if ($authUserId === '') {
            return null;
        }

        $db = db_connect();
        $profile = $db->table('public.profiles')
            ->where('id', $authUserId)
            ->get()
            ->getRowArray();

        if ($profile === null || ($profile['status'] ?? '') !== 'active') {
            return null;
        }

        $roles = $db->query(
            'SELECT r.role_key
             FROM public.profile_roles pr
             JOIN public.roles r ON r.id = pr.role_id
             WHERE pr.profile_id = ? AND pr.is_active = true',
            [$authUserId]
        )->getResultArray();

        return [
            'profile' => $profile,
            'roles'   => array_column($roles, 'role_key'),
        ];
    }

    /**
     * POST /api/v1/provisioning/manual-student
     * OSAD Admin manual student account creation.
     */
    public function manualStudent()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $isOsad = (($actor['profile']['account_type'] ?? '') === 'osad_admin' && in_array('osad_staff', $actor['roles'], true));
        if (! $isOsad) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only dedicated OSAD administrators (osad_admin) may provision Student accounts.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];

        $instId = trim((string) ($json['institutional_id'] ?? ''));
        $email = strtolower(trim((string) ($json['institutional_email'] ?? '')));
        $firstName = trim((string) ($json['first_name'] ?? ''));
        $lastName = trim((string) ($json['last_name'] ?? ''));
        $middleName = ! empty($json['middle_name']) ? trim((string) $json['middle_name']) : null;
        $suffix = ! empty($json['suffix']) ? trim((string) $json['suffix']) : null;
        $deptId = ! empty($json['department_id']) ? (string) $json['department_id'] : null;
        $progId = ! empty($json['degree_program_id']) ? (string) $json['degree_program_id'] : null;
        $yearLevel = ! empty($json['year_level']) ? trim((string) $json['year_level']) : '1st Year';

        if ($instId === '' || $email === '' || $firstName === '' || $lastName === '') {
            return $this->respond(['error' => ['code' => 'MISSING_REQUIRED_FIELDS', 'message' => 'Institutional ID, email, first name, and last name are required.']], 422);
        }

        if (! str_ends_with($email, '@ndmu.edu.ph')) {
            return $this->respond(['error' => ['code' => 'INVALID_EMAIL_DOMAIN', 'message' => 'Institutional email must end with @ndmu.edu.ph.']], 422);
        }

        $db = db_connect();

        // Duplicate checks
        $dup = $db->table('public.profiles')
            ->where('institutional_id', $instId)
            ->orWhere('institutional_email', $email)
            ->get()
            ->getRowArray();

        if ($dup !== null) {
            return $this->respond(['error' => ['code' => 'DUPLICATE_ACCOUNT', 'message' => 'An account with this institutional ID or email already exists.']], 409);
        }

        // Validate program belongs to department if both provided
        if ($progId !== null && $deptId !== null) {
            $prog = $db->table('public.degree_programs')->where('id', $progId)->get()->getRowArray();
            if ($prog === null || $prog['department_id'] !== $deptId) {
                return $this->respond(['error' => ['code' => 'INVALID_PROGRAM_DEPARTMENT', 'message' => 'Specified degree program does not belong to the selected department.']], 422);
            }
        }

        $studentRole = $db->table('public.roles')->where('role_key', 'student')->get()->getRowArray();
        if ($studentRole === null) {
            return $this->respond(['error' => ['code' => 'ROLE_NOT_FOUND', 'message' => 'Student role catalog definition missing.']], 500);
        }

        // Generate profile UUID
        $profileId = (string) service('uuid')->uuid4();
        $fullName = trim(implode(' ', array_filter([$firstName, $middleName, $lastName, $suffix])));

        $db->transBegin();
        try {
            $db->table('public.profiles')->insert([
                'id'                   => $profileId,
                'institutional_id'     => $instId,
                'institutional_email'  => $email,
                'first_name'           => $firstName,
                'middle_name'          => $middleName,
                'last_name'            => $lastName,
                'suffix'               => $suffix,
                'full_name'            => $fullName,
                'account_type'         => 'student',
                'department_id'        => $deptId,
                'degree_program_id'    => $progId,
                'year_level'           => $yearLevel,
                'status'               => 'active',
                'provisioning_method'  => 'manual',
                'created_by'           => $actor['profile']['id'],
                'must_change_password' => true,
                'provisioned_at'       => date('Y-m-d H:i:s'),
                'activated_at'         => date('Y-m-d H:i:s'),
            ]);

            $db->table('public.profile_roles')->insert([
                'profile_id'  => $profileId,
                'role_id'     => $studentRole['id'],
                'scope_type'  => 'university',
                'scope_id'    => null,
                'is_active'   => true,
                'assigned_by' => $actor['profile']['id'],
                'assigned_at' => date('Y-m-d H:i:s'),
            ]);

            $db->table('public.account_lifecycle_events')->insert([
                'profile_id'   => $profileId,
                'event_type'   => 'provisioned',
                'performed_by' => $actor['profile']['id'],
                'reason'       => sprintf('Manually provisioned by OSAD administrator %s', $actor['profile']['full_name']),
                'occurred_at'  => date('Y-m-d H:i:s'),
            ]);

            $db->table('public.account_lifecycle_events')->insert([
                'profile_id'   => $profileId,
                'event_type'   => 'activated',
                'performed_by' => $actor['profile']['id'],
                'reason'       => 'Activated upon manual provisioning',
                'occurred_at'  => date('Y-m-d H:i:s'),
            ]);

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'PROVISIONING_FAILED', 'message' => 'Failed to create student account: ' . $e->getMessage()]], 500);
        }

        return $this->respondCreated([
            'data' => [
                'message'             => 'Student account successfully provisioned.',
                'id'                  => $profileId,
                'institutional_id'    => $instId,
                'institutional_email' => $email,
                'full_name'           => $fullName,
                'account_type'        => 'student',
            ],
        ]);
    }

    /**
     * POST /api/v1/provisioning/manual-personnel
     * HR Admin manual personnel account creation.
     */
    public function manualPersonnel()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $isHr = (($actor['profile']['account_type'] ?? '') === 'hr_admin' && in_array('hr_staff', $actor['roles'], true));
        if (! $isHr) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only dedicated HR administrators (hr_admin) may provision Personnel accounts.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];

        $instId = trim((string) ($json['institutional_id'] ?? ''));
        $email = strtolower(trim((string) ($json['institutional_email'] ?? '')));
        $firstName = trim((string) ($json['first_name'] ?? ''));
        $lastName = trim((string) ($json['last_name'] ?? ''));
        $middleName = ! empty($json['middle_name']) ? trim((string) $json['middle_name']) : null;
        $suffix = ! empty($json['suffix']) ? trim((string) $json['suffix']) : null;
        $deptId = ! empty($json['department_id']) ? (string) $json['department_id'] : null;
        $designation = ! empty($json['designation']) ? trim((string) $json['designation']) : 'Faculty Member';

        if ($instId === '' || $email === '' || $firstName === '' || $lastName === '') {
            return $this->respond(['error' => ['code' => 'MISSING_REQUIRED_FIELDS', 'message' => 'Institutional ID, email, first name, and last name are required.']], 422);
        }

        if (! str_ends_with($email, '@ndmu.edu.ph')) {
            return $this->respond(['error' => ['code' => 'INVALID_EMAIL_DOMAIN', 'message' => 'Institutional email must end with @ndmu.edu.ph.']], 422);
        }

        $db = db_connect();

        $dup = $db->table('public.profiles')
            ->where('institutional_id', $instId)
            ->orWhere('institutional_email', $email)
            ->get()
            ->getRowArray();

        if ($dup !== null) {
            return $this->respond(['error' => ['code' => 'DUPLICATE_ACCOUNT', 'message' => 'An account with this institutional ID or email already exists.']], 409);
        }

        $personnelRole = $db->table('public.roles')->where('role_key', 'personnel')->get()->getRowArray();
        if ($personnelRole === null) {
            return $this->respond(['error' => ['code' => 'ROLE_NOT_FOUND', 'message' => 'Personnel role catalog definition missing.']], 500);
        }

        $profileId = (string) service('uuid')->uuid4();
        $fullName = trim(implode(' ', array_filter([$firstName, $middleName, $lastName, $suffix])));

        $db->transBegin();
        try {
            $db->table('public.profiles')->insert([
                'id'                   => $profileId,
                'institutional_id'     => $instId,
                'institutional_email'  => $email,
                'first_name'           => $firstName,
                'middle_name'          => $middleName,
                'last_name'            => $lastName,
                'suffix'               => $suffix,
                'full_name'            => $fullName,
                'account_type'         => 'personnel',
                'department_id'        => $deptId,
                'degree_program_id'    => null,
                'designation'          => $designation,
                'status'               => 'active',
                'provisioning_method'  => 'manual',
                'created_by'           => $actor['profile']['id'],
                'must_change_password' => true,
                'provisioned_at'       => date('Y-m-d H:i:s'),
                'activated_at'         => date('Y-m-d H:i:s'),
            ]);

            $db->table('public.profile_roles')->insert([
                'profile_id'  => $profileId,
                'role_id'     => $personnelRole['id'],
                'scope_type'  => 'university',
                'scope_id'    => null,
                'is_active'   => true,
                'assigned_by' => $actor['profile']['id'],
                'assigned_at' => date('Y-m-d H:i:s'),
            ]);

            $db->table('public.account_lifecycle_events')->insert([
                'profile_id'   => $profileId,
                'event_type'   => 'provisioned',
                'performed_by' => $actor['profile']['id'],
                'reason'       => sprintf('Manually provisioned by HR administrator %s', $actor['profile']['full_name']),
                'occurred_at'  => date('Y-m-d H:i:s'),
            ]);

            $db->table('public.account_lifecycle_events')->insert([
                'profile_id'   => $profileId,
                'event_type'   => 'activated',
                'performed_by' => $actor['profile']['id'],
                'reason'       => 'Activated upon manual provisioning',
                'occurred_at'  => date('Y-m-d H:i:s'),
            ]);

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'PROVISIONING_FAILED', 'message' => 'Failed to create personnel account: ' . $e->getMessage()]], 500);
        }

        return $this->respondCreated([
            'data' => [
                'message'             => 'Personnel account successfully provisioned.',
                'id'                  => $profileId,
                'institutional_id'    => $instId,
                'institutional_email' => $email,
                'full_name'           => $fullName,
                'account_type'        => 'personnel',
            ],
        ]);
    }

    /**
     * POST /api/v1/provisioning/preview-roster
     * Validates XLSX roster rows before commitment.
     */
    public function previewRoster()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $json = $this->request->getJSON(true) ?? [];
        $rosterType = trim((string) ($json['roster_type'] ?? 'student'));
        $rows = (array) ($json['rows'] ?? []);

        $isHr = (($actor['profile']['account_type'] ?? '') === 'hr_admin' && in_array('hr_staff', $actor['roles'], true));
        $isOsad = (($actor['profile']['account_type'] ?? '') === 'osad_admin' && in_array('osad_staff', $actor['roles'], true));

        if ($rosterType === 'personnel' && ! $isHr) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only dedicated HR administrators may validate personnel rosters.']], 403);
        }
        if ($rosterType === 'student' && ! $isOsad) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only dedicated OSAD administrators may validate student rosters.']], 403);
        }

        $db = db_connect();
        $validatedRows = [];
        $seenIds = [];
        $seenEmails = [];

        foreach ($rows as $index => $row) {
            $rowNum = $index + 1;
            $errors = [];

            $instId = trim((string) ($row['institutional_id'] ?? ''));
            $email = strtolower(trim((string) ($row['institutional_email'] ?? '')));
            $firstName = trim((string) ($row['first_name'] ?? ''));
            $lastName = trim((string) ($row['last_name'] ?? ''));
            $fullName = trim((string) ($row['full_name'] ?? ''));

            if ($instId === '') $errors[] = 'Missing institutional ID.';
            if ($email === '') $errors[] = 'Missing institutional email.';
            elseif (! str_ends_with($email, '@ndmu.edu.ph')) $errors[] = 'Email must end with @ndmu.edu.ph.';

            if ($firstName === '' && $fullName === '') $errors[] = 'Missing name.';

            // Duplicate checks within file
            if (isset($seenIds[$instId])) $errors[] = 'Duplicate institutional ID within roster.';
            if (isset($seenEmails[$email])) $errors[] = 'Duplicate institutional email within roster.';
            $seenIds[$instId] = true;
            $seenEmails[$email] = true;

            // Database duplicate check
            if ($instId !== '' || $email !== '') {
                $dbDup = $db->table('public.profiles')
                    ->where('institutional_id', $instId)
                    ->orWhere('institutional_email', $email)
                    ->countAllResults();
                if ($dbDup > 0) $errors[] = 'Account already exists in database.';
            }

            $validatedRows[] = [
                'row_number'           => $rowNum,
                'institutional_id'     => $instId,
                'institutional_email'  => $email,
                'name'                 => $fullName !== '' ? $fullName : ($firstName . ' ' . $lastName),
                'is_valid'             => count($errors) === 0,
                'errors'               => $errors,
            ];
        }

        $validCount = count(array_filter($validatedRows, static fn ($r) => $r['is_valid']));
        $invalidCount = count($validatedRows) - $validCount;

        return $this->respond([
            'data' => [
                'roster_type'   => $rosterType,
                'total_rows'    => count($validatedRows),
                'valid_count'   => $validCount,
                'invalid_count' => $invalidCount,
                'preview'       => $validatedRows,
            ],
        ], 200);
    }
}
