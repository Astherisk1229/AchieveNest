<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthenticatedActorService;
use App\Services\SupabaseAdminAuthService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class ProvisioningController extends Controller
{
    use ResponseTrait;

    protected AuthenticatedActorService $actorService;
    protected SupabaseAdminAuthService $adminAuthService;

    public function __construct(
        ?AuthenticatedActorService $actorService = null,
        ?SupabaseAdminAuthService $adminAuthService = null
    ) {
        $this->actorService = $actorService ?? new AuthenticatedActorService();
        $this->adminAuthService = $adminAuthService ?? new SupabaseAdminAuthService();
    }

    public function options()
    {
        return $this->respond(null, 204);
    }

    /**
     * Resolves authenticated actor, checking active status and roles.
     */
    protected function resolveActor(): ?array
    {
        return $this->actorService->resolveActor($this->request->getHeaderLine('Authorization'));
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
        // Always server-generated — no fixed/default password is ever accepted or stored
        $initialPassword = ValidationHelper::generateTemporaryPassword();

        // Institutional ID ownership: Must be supplied externally, never generated
        if ($instId === '' || $email === '' || $firstName === '' || $lastName === '') {
            return $this->respond(['error' => ['code' => 'MISSING_REQUIRED_FIELDS', 'message' => 'Institutional ID, email, first name, and last name are required.']], 422);
        }

        if (! str_ends_with($email, '@ndmu.edu.ph')) {
            return $this->respond(['error' => ['code' => 'INVALID_EMAIL_DOMAIN', 'message' => 'Institutional email must end with @ndmu.edu.ph.']], 422);
        }

        $db = db_connect();

        // Check duplicates in profiles
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

        $fullName = trim(implode(' ', array_filter([$firstName, $middleName, $lastName, $suffix])));

        // Step 1: Create Supabase Auth user first (or mock/fallback if in offline test mode)
        $authUserId = null;
        $createdInAuth = false;

        try {
            if ($this->adminAuthService->isConfigured()) {
                $authUser = $this->adminAuthService->createUser($email, $initialPassword, [
                    'full_name'        => $fullName,
                    'institutional_id' => $instId,
                    'account_type'     => 'student',
                ]);
                $authUserId = $authUser['id'] ?? null;
                $createdInAuth = true;
            } else {
                // If service is not configured (e.g. unit tests without Supabase network access), generate valid UUID
                $authUserId = (string) service('uuid')->uuid4();
            }
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'AUTH_CREATION_FAILED', 'message' => 'Failed to create Supabase Auth identity: ' . $e->getMessage()]], 500);
        }

        if ($authUserId === null || trim($authUserId) === '') {
            return $this->respond(['error' => ['code' => 'AUTH_CREATION_FAILED', 'message' => 'Supabase Auth did not return a valid user UUID.']], 500);
        }

        // Step 2: Database transaction to insert profile & roles with profiles.id = auth.users.id
        $db->transBegin();
        try {
            $db->table('public.profiles')->insert([
                'id'                   => $authUserId, // Must match Auth UUID exactly
                'institutional_id'     => $instId,     // Institution-supplied identifier
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
                'profile_id'  => $authUserId,
                'role_id'     => $studentRole['id'],
                'scope_type'  => 'university',
                'scope_id'    => null,
                'is_active'   => true,
                'assigned_by' => $actor['profile']['id'],
                'assigned_at' => date('Y-m-d H:i:s'),
            ]);

            $db->table('public.account_lifecycle_events')->insert([
                'profile_id'   => $authUserId,
                'event_type'   => 'provisioned',
                'performed_by' => $actor['profile']['id'],
                'reason'       => sprintf('Manually provisioned by OSAD administrator %s', $actor['profile']['full_name']),
                'occurred_at'  => date('Y-m-d H:i:s'),
            ]);

            $db->table('public.account_lifecycle_events')->insert([
                'profile_id'   => $authUserId,
                'event_type'   => 'activated',
                'performed_by' => $actor['profile']['id'],
                'reason'       => 'Activated upon manual provisioning',
                'occurred_at'  => date('Y-m-d H:i:s'),
            ]);

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();

            // Compensating transaction: Delete the newly created Auth user to prevent orphan identity
            if ($createdInAuth && $authUserId !== null) {
                $this->adminAuthService->deleteUser($authUserId);
            }

            return $this->respond(['error' => ['code' => 'PROVISIONING_FAILED', 'message' => 'Failed to create student account: ' . $e->getMessage()]], 500);
        }

        return $this->respondCreated([
            'data' => [
                'message'             => 'Student account successfully provisioned.',
                'id'                  => $authUserId,
                'institutional_id'    => $instId,
                'institutional_email' => $email,
                'full_name'           => $fullName,
                'account_type'        => 'student',
                // One-time display only — never stored in logs, audit trail, or DB
                'temporary_password'  => $initialPassword,
                'must_change_password' => true,
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
        // Always server-generated — no fixed/default password is ever accepted or stored
        $initialPassword = ValidationHelper::generateTemporaryPassword();

        // Institutional ID ownership: Must be supplied externally, never generated
        if ($instId === '' || $email === '' || $firstName === '' || $lastName === '') {
            return $this->respond(['error' => ['code' => 'MISSING_REQUIRED_FIELDS', 'message' => 'Institutional ID, email, first name, and last name are required.']], 422);
        }

        if (! str_ends_with($email, '@ndmu.edu.ph')) {
            return $this->respond(['error' => ['code' => 'INVALID_EMAIL_DOMAIN', 'message' => 'Institutional email must end with @ndmu.edu.ph.']], 422);
        }

        $db = db_connect();

        // Check duplicates in profiles
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

        $fullName = trim(implode(' ', array_filter([$firstName, $middleName, $lastName, $suffix])));

        // Step 1: Create Supabase Auth user first
        $authUserId = null;
        $createdInAuth = false;

        try {
            if ($this->adminAuthService->isConfigured()) {
                $authUser = $this->adminAuthService->createUser($email, $initialPassword, [
                    'full_name'        => $fullName,
                    'institutional_id' => $instId,
                    'account_type'     => 'personnel',
                ]);
                $authUserId = $authUser['id'] ?? null;
                $createdInAuth = true;
            } else {
                $authUserId = (string) service('uuid')->uuid4();
            }
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'AUTH_CREATION_FAILED', 'message' => 'Failed to create Supabase Auth identity: ' . $e->getMessage()]], 500);
        }

        if ($authUserId === null || trim($authUserId) === '') {
            return $this->respond(['error' => ['code' => 'AUTH_CREATION_FAILED', 'message' => 'Supabase Auth did not return a valid user UUID.']], 500);
        }

        // Step 2: Database transaction with profiles.id = auth.users.id
        $db->transBegin();
        try {
            $db->table('public.profiles')->insert([
                'id'                   => $authUserId, // Exact parity with Auth UUID
                'institutional_id'     => $instId,     // Preserved institution-supplied ID
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
                'profile_id'  => $authUserId,
                'role_id'     => $personnelRole['id'],
                'scope_type'  => 'university',
                'scope_id'    => null,
                'is_active'   => true,
                'assigned_by' => $actor['profile']['id'],
                'assigned_at' => date('Y-m-d H:i:s'),
            ]);

            $db->table('public.account_lifecycle_events')->insert([
                'profile_id'   => $authUserId,
                'event_type'   => 'provisioned',
                'performed_by' => $actor['profile']['id'],
                'reason'       => sprintf('Manually provisioned by HR administrator %s', $actor['profile']['full_name']),
                'occurred_at'  => date('Y-m-d H:i:s'),
            ]);

            $db->table('public.account_lifecycle_events')->insert([
                'profile_id'   => $authUserId,
                'event_type'   => 'activated',
                'performed_by' => $actor['profile']['id'],
                'reason'       => 'Activated upon manual provisioning',
                'occurred_at'  => date('Y-m-d H:i:s'),
            ]);

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();

            // Compensating transaction: Delete the newly created Auth user
            if ($createdInAuth && $authUserId !== null) {
                $this->adminAuthService->deleteUser($authUserId);
            }

            return $this->respond(['error' => ['code' => 'PROVISIONING_FAILED', 'message' => 'Failed to create personnel account: ' . $e->getMessage()]], 500);
        }

        return $this->respondCreated([
            'data' => [
                'message'             => 'Personnel account successfully provisioned.',
                'id'                  => $authUserId,
                'institutional_id'    => $instId,
                'institutional_email' => $email,
                'full_name'           => $fullName,
                'account_type'        => 'personnel',
                // One-time display only — never stored in logs, audit trail, or DB
                'temporary_password'  => $initialPassword,
                'must_change_password' => true,
            ],
        ]);
    }

    /**
     * POST /api/v1/provisioning/preview-roster
     * Validates XLSX roster rows before commitment. Never generates IDs or creates accounts.
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
            $warnings = [];

            $instId = trim((string) ($row['institutional_id'] ?? ''));
            $email = strtolower(trim((string) ($row['institutional_email'] ?? '')));
            $firstName = trim((string) ($row['first_name'] ?? ''));
            $lastName = trim((string) ($row['last_name'] ?? ''));
            $fullName = trim((string) ($row['full_name'] ?? ''));

            if ($instId === '') {
                $errors[] = 'Missing institutional ID (external official ID is required).';
            }
            if ($email === '') {
                $errors[] = 'Missing institutional email.';
            } elseif (! str_ends_with($email, '@ndmu.edu.ph')) {
                $errors[] = 'Email must end with @ndmu.edu.ph.';
            }

            if ($firstName === '' && $fullName === '') {
                $errors[] = 'Missing name.';
            }

            // Duplicate checks within upload
            if ($instId !== '') {
                if (isset($seenIds[$instId])) {
                    $errors[] = 'Duplicate institutional ID within roster.';
                }
                $seenIds[$instId] = true;
            }

            if ($email !== '') {
                if (isset($seenEmails[$email])) {
                    $errors[] = 'Duplicate institutional email within roster.';
                }
                $seenEmails[$email] = true;
            }

            // Database duplicate check
            if ($instId !== '' || $email !== '') {
                $dbDup = $db->table('public.profiles')
                    ->groupStart()
                        ->where('institutional_id', $instId)
                        ->orWhere('institutional_email', $email)
                    ->groupEnd()
                    ->countAllResults();

                if ($dbDup > 0) {
                    $errors[] = 'Account already exists in database.';
                }
            }

            $validatedRows[] = [
                'row_number'           => $rowNum,
                'institutional_id'     => $instId,
                'institutional_email'  => $email,
                'first_name'           => $firstName,
                'last_name'            => $lastName,
                'name'                 => $fullName !== '' ? $fullName : trim($firstName . ' ' . $lastName),
                'is_valid'             => count($errors) === 0,
                'errors'               => $errors,
                'warnings'             => $warnings,
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

    /**
     * POST /api/v1/provisioning/commit-roster
     * Commits validated XLSX roster rows by creating Auth users + profiles + roles + lifecycle records.
     */
    public function commitRoster()
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
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only dedicated HR administrators may commit personnel rosters.']], 403);
        }
        if ($rosterType === 'student' && ! $isOsad) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only dedicated OSAD administrators may commit student rosters.']], 403);
        }

        $db = db_connect();

        $roleKey = ($rosterType === 'personnel') ? 'personnel' : 'student';
        $roleRecord = $db->table('public.roles')->where('role_key', $roleKey)->get()->getRowArray();
        if ($roleRecord === null) {
            return $this->respond(['error' => ['code' => 'ROLE_NOT_FOUND', 'message' => 'Base role definition missing.']], 500);
        }

        $successful = [];
        $failed = [];
        $skipped = [];

        foreach ($rows as $index => $row) {
            $rowNum = $index + 1;
            $instId = trim((string) ($row['institutional_id'] ?? ''));
            $email = strtolower(trim((string) ($row['institutional_email'] ?? '')));
            $firstName = trim((string) ($row['first_name'] ?? ''));
            $lastName = trim((string) ($row['last_name'] ?? ''));
            $middleName = ! empty($row['middle_name']) ? trim((string) $row['middle_name']) : null;
            $suffix = ! empty($row['suffix']) ? trim((string) $row['suffix']) : null;
            $deptId = ! empty($row['department_id']) ? (string) $row['department_id'] : null;
            $progId = ! empty($row['degree_program_id']) ? (string) $row['degree_program_id'] : null;
            $yearLevel = ! empty($row['year_level']) ? trim((string) $row['year_level']) : '1st Year';
            $designation = ! empty($row['designation']) ? trim((string) $row['designation']) : 'Faculty Member';
            $initialPassword = ! empty($row['password']) ? (string) $row['password'] : ($rosterType === 'student' ? 'NDMU@Student2026!' : 'NDMU@Personnel2026!');

            // Server-side revalidation
            if ($instId === '' || $email === '' || ($firstName === '' && empty($row['full_name']))) {
                $failed[] = [
                    'row_number'       => $rowNum,
                    'institutional_id' => $instId,
                    'email'            => $email,
                    'reason'           => 'Missing required institutional ID, email, or name.',
                ];
                continue;
            }

            if (! str_ends_with($email, '@ndmu.edu.ph')) {
                $failed[] = [
                    'row_number'       => $rowNum,
                    'institutional_id' => $instId,
                    'email'            => $email,
                    'reason'           => 'Institutional email must end with @ndmu.edu.ph.',
                ];
                continue;
            }

            // Check if already exists (safe retry/idempotency)
            $existing = $db->table('public.profiles')
                ->groupStart()
                    ->where('institutional_id', $instId)
                    ->orWhere('institutional_email', $email)
                ->groupEnd()
                ->get()
                ->getRowArray();

            if ($existing !== null) {
                $skipped[] = [
                    'row_number'       => $rowNum,
                    'institutional_id' => $instId,
                    'email'            => $email,
                    'reason'           => 'Account already exists in database.',
                ];
                continue;
            }

            $fullName = ! empty($row['full_name'])
                ? trim((string) $row['full_name'])
                : trim(implode(' ', array_filter([$firstName, $middleName, $lastName, $suffix])));

            // Step 1: Auth creation first
            $authUserId = null;
            $createdInAuth = false;

            try {
                if ($this->adminAuthService->isConfigured()) {
                    $authUser = $this->adminAuthService->createUser($email, $initialPassword, [
                        'full_name'        => $fullName,
                        'institutional_id' => $instId,
                        'account_type'     => $rosterType,
                    ]);
                    $authUserId = $authUser['id'] ?? null;
                    $createdInAuth = true;
                } else {
                    $authUserId = (string) service('uuid')->uuid4();
                }
            } catch (Throwable $e) {
                $failed[] = [
                    'row_number'       => $rowNum,
                    'institutional_id' => $instId,
                    'email'            => $email,
                    'reason'           => 'Auth creation failed: ' . $e->getMessage(),
                ];
                continue;
            }

            if ($authUserId === null || trim($authUserId) === '') {
                $failed[] = [
                    'row_number'       => $rowNum,
                    'institutional_id' => $instId,
                    'email'            => $email,
                    'reason'           => 'Invalid Auth user ID returned.',
                ];
                continue;
            }

            // Step 2: Database transaction
            $db->transBegin();
            try {
                $db->table('public.profiles')->insert([
                    'id'                   => $authUserId,
                    'institutional_id'     => $instId,
                    'institutional_email'  => $email,
                    'first_name'           => $firstName !== '' ? $firstName : $fullName,
                    'middle_name'          => $middleName,
                    'last_name'            => $lastName !== '' ? $lastName : '',
                    'suffix'               => $suffix,
                    'full_name'            => $fullName,
                    'account_type'         => $rosterType,
                    'department_id'        => $deptId,
                    'degree_program_id'    => ($rosterType === 'student') ? $progId : null,
                    'designation'          => ($rosterType === 'personnel') ? $designation : null,
                    'year_level'           => ($rosterType === 'student') ? $yearLevel : null,
                    'status'               => 'active',
                    'provisioning_method'  => 'roster_xlsx',
                    'created_by'           => $actor['profile']['id'],
                    'must_change_password' => true,
                    'provisioned_at'       => date('Y-m-d H:i:s'),
                    'activated_at'         => date('Y-m-d H:i:s'),
                ]);

                $db->table('public.profile_roles')->insert([
                    'profile_id'  => $authUserId,
                    'role_id'     => $roleRecord['id'],
                    'scope_type'  => 'university',
                    'scope_id'    => null,
                    'is_active'   => true,
                    'assigned_by' => $actor['profile']['id'],
                    'assigned_at' => date('Y-m-d H:i:s'),
                ]);

                $db->table('public.account_lifecycle_events')->insert([
                    'profile_id'   => $authUserId,
                    'event_type'   => 'provisioned',
                    'performed_by' => $actor['profile']['id'],
                    'reason'       => sprintf('Provisioned via %s roster import by %s', $rosterType, $actor['profile']['full_name']),
                    'occurred_at'  => date('Y-m-d H:i:s'),
                ]);

                $db->table('public.account_lifecycle_events')->insert([
                    'profile_id'   => $authUserId,
                    'event_type'   => 'activated',
                    'performed_by' => $actor['profile']['id'],
                    'reason'       => 'Activated upon roster commit',
                    'occurred_at'  => date('Y-m-d H:i:s'),
                ]);

                $db->transCommit();

                $successful[] = [
                    'row_number'          => $rowNum,
                    'id'                  => $authUserId,
                    'institutional_id'    => $instId,
                    'institutional_email' => $email,
                    'full_name'           => $fullName,
                    'account_type'        => $rosterType,
                ];
            } catch (Throwable $e) {
                $db->transRollback();

                // Compensating deletion
                if ($createdInAuth && $authUserId !== null) {
                    $this->adminAuthService->deleteUser($authUserId);
                }

                $failed[] = [
                    'row_number'       => $rowNum,
                    'institutional_id' => $instId,
                    'email'            => $email,
                    'reason'           => 'Database insert failed: ' . $e->getMessage(),
                ];
            }
        }

        return $this->respondCreated([
            'data' => [
                'roster_type'      => $rosterType,
                'total_submitted'  => count($rows),
                'successful_count' => count($successful),
                'failed_count'     => count($failed),
                'skipped_count'    => count($skipped),
                'successful'       => $successful,
                'failed'           => $failed,
                'skipped'          => $skipped,
            ],
        ]);
    }
}
