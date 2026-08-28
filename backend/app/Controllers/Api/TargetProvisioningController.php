<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthenticatedActorService;
use App\Services\SupabaseAdminAuthService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class TargetProvisioningController extends Controller
{
    use ResponseTrait;

    protected AuthenticatedActorService $actorService;
    protected SupabaseAdminAuthService $adminAuthService;
    protected bool $isLocalDefense;

    public function __construct(
        ?AuthenticatedActorService $actorService = null,
        ?SupabaseAdminAuthService $adminAuthService = null
    ) {
        $this->actorService = $actorService ?? new AuthenticatedActorService();
        $this->adminAuthService = $adminAuthService ?? new SupabaseAdminAuthService();
        $this->isLocalDefense = (env('AUTH_MODE') === 'local-defense' || env('ACHIEVENEST_ENV') === 'local-defense');
    }

    public function options()
    {
        return $this->respond(null, 204);
    }

    protected function resolveActor(): ?array
    {
        return $this->actorService->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    private function genUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
        );
    }

    public function manualStudent()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $isOsad = (($actor['profile']['account_type'] ?? '') === 'osad_admin' && in_array('osad_staff', $actor['roles'], true));
        if (! $isOsad) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may provision Student accounts.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $instId = trim((string) ($json['institutional_id'] ?? ''));
        $email = strtolower(trim((string) ($json['institutional_email'] ?? '')));
        $firstName = trim((string) ($json['first_name'] ?? ''));
        $lastName = trim((string) ($json['last_name'] ?? ''));
        $middleName = ! empty($json['middle_name']) ? trim((string) $json['middle_name']) : null;
        $suffix = ! empty($json['suffix']) ? trim((string) $json['suffix']) : null;
        $academicProgramId = trim((string) ($json['academic_program_id'] ?? $json['degree_program_id'] ?? ''));
        $yearLevel = trim((string) ($json['year_level'] ?? '1st Year'));
        $academicYear = ! empty($json['academic_year']) ? trim((string) $json['academic_year']) : '2025-2026';

        if ($instId === '' || $email === '' || $firstName === '' || $lastName === '' || $academicProgramId === '') {
            return $this->respond(['error' => ['code' => 'MISSING_REQUIRED_FIELDS', 'message' => 'Institutional ID, institutional email, first name, last name, and academic_program_id are required.']], 422);
        }
        if (! str_ends_with($email, '@ndmu.edu.ph')) {
            return $this->respond(['error' => ['code' => 'INVALID_EMAIL_DOMAIN', 'message' => 'Institutional email must end with @ndmu.edu.ph.']], 422);
        }
        if (! ValidationHelper::validateUuid($academicProgramId)) {
            return $this->respond(['error' => ['code' => 'INVALID_ACADEMIC_PROGRAM', 'message' => 'academic_program_id must be a valid UUID.']], 422);
        }

        $db = db_connect();
        $program = $db->table('academic_programs')
            ->where('id', $academicProgramId)
            ->where('status', 'active')
            ->get()->getRowArray();
        if ($program === null) {
            return $this->respond(['error' => ['code' => 'ACADEMIC_PROGRAM_NOT_FOUND', 'message' => 'Active Academic Program not found.']], 422);
        }

        $duplicate = $db->table('profiles')
            ->where('institutional_id', $instId)
            ->orWhere('email', $email)
            ->get()->getRowArray();
        if ($duplicate !== null) {
            return $this->respond(['error' => ['code' => 'DUPLICATE_ACCOUNT', 'message' => 'An account with this institutional ID or email already exists.']], 409);
        }

        $studentRole = $db->table('roles')->where('role_key', 'student')->get()->getRowArray();
        if ($studentRole === null) {
            return $this->respond(['error' => ['code' => 'ROLE_NOT_FOUND', 'message' => 'Student role catalog definition missing.']], 500);
        }

        $fullName = trim(implode(' ', array_filter([$firstName, $middleName, $lastName, $suffix])));
        $initialPassword = ValidationHelper::generateTemporaryPassword();
        $passwordHash = password_hash($initialPassword, PASSWORD_DEFAULT);

        [$authUserId, $createdInAuth, $authError] = $this->createAuthIdentity($email, $initialPassword, $fullName, $instId, 'student');
        if ($authError !== null) {
            return $this->respond(['error' => ['code' => 'AUTH_CREATION_FAILED', 'message' => $authError]], 500);
        }

        $db->transStart();
        try {
            $now = date('Y-m-d H:i:s');
            $db->table('profiles')->insert([
                'id'                   => $authUserId,
                'institutional_id'     => $instId,
                'email'                => $email,
                'first_name'           => $firstName,
                'middle_name'          => $middleName,
                'last_name'            => $lastName,
                'full_name'            => $fullName,
                'account_type'         => 'student',
                'status'               => 'active',
                'password_hash'        => $passwordHash,
                'must_change_password' => 1,
                'created_at'           => $now,
                'updated_at'           => $now,
            ]);

            $db->table('student_profiles')->insert([
                'profile_id'        => $authUserId,
                'year_level'        => $yearLevel,
                'enrollment_status' => 'enrolled',
            ]);

            $db->table('student_program_enrollments')->insert([
                'id'                  => $this->genUuid(),
                'student_profile_id'  => $authUserId,
                'academic_program_id' => $academicProgramId,
                'year_level'          => $yearLevel,
                'academic_year'       => $academicYear,
                'effective_from'      => date('Y-m-d'),
                'is_active'           => 1,
            ]);

            $db->table('profile_roles')->insert([
                'id'          => $this->genUuid(),
                'profile_id'  => $authUserId,
                'role_id'     => $studentRole['id'],
                'scope_type'  => 'university',
                'scope_id'    => null,
                'is_active'   => 1,
                'assigned_by' => $actor['profile']['id'],
                'assigned_at' => $now,
            ]);

            // Sync local_auth_credentials
            $db->table('local_auth_credentials')->insert([
                'profile_id'          => $authUserId,
                'password_hash'       => $passwordHash,
                'password_changed_at' => null,
                'status'              => 'active',
                'created_at'          => $now,
                'updated_at'          => $now,
            ]);

            $this->recordLifecycle($db, $authUserId, $actor['profile']['id'], 'provisioned', 'Manually provisioned by OSAD administrator');
            $this->recordLifecycle($db, $authUserId, $actor['profile']['id'], 'activated', 'Activated upon manual provisioning');
            $db->transComplete();
        } catch (Throwable $e) {
            $db->transRollback();
            if ($createdInAuth) {
                $this->adminAuthService->deleteUser($authUserId);
            }
            return $this->respond(['error' => ['code' => 'PROVISIONING_FAILED', 'message' => 'Failed to create Student account: ' . $e->getMessage()]], 500);
        }

        if ($db->transStatus() === false) {
            return $this->respond(['error' => ['code' => 'PROVISIONING_FAILED', 'message' => 'Transaction failed while provisioning student.']], 500);
        }

        return $this->respondCreated(['data' => [
            'message'              => 'Student account successfully provisioned.',
            'id'                   => $authUserId,
            'institutional_id'     => $instId,
            'institutional_email'  => $email,
            'full_name'            => $fullName,
            'account_type'         => 'student',
            'academic_program_id'  => $academicProgramId,
            'temporary_password'   => $initialPassword,
            'must_change_password' => true,
        ]]);
    }

    public function manualPersonnel()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $isHr = (($actor['profile']['account_type'] ?? '') === 'hr_admin' && in_array('hr_staff', $actor['roles'], true));
        if (! $isHr) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only HR administrators may provision Personnel accounts.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $instId = trim((string) ($json['institutional_id'] ?? ''));
        $email = strtolower(trim((string) ($json['institutional_email'] ?? '')));
        $firstName = trim((string) ($json['first_name'] ?? ''));
        $lastName = trim((string) ($json['last_name'] ?? ''));
        $middleName = ! empty($json['middle_name']) ? trim((string) $json['middle_name']) : null;
        $suffix = ! empty($json['suffix']) ? trim((string) $json['suffix']) : null;
        $designation = ! empty($json['designation']) ? trim((string) $json['designation']) : 'Personnel';
        $classification = strtolower(trim((string) ($json['personnel_classification'] ?? '')));
        $collegeId = ! empty($json['college_id']) ? (string) $json['college_id'] : null;
        $administrativeUnitId = ! empty($json['administrative_unit_id']) ? (string) $json['administrative_unit_id'] : null;
        $programIds = array_values(array_unique(array_filter(array_map('strval', (array) ($json['academic_program_ids'] ?? [])))));

        if ($instId === '' || $email === '' || $firstName === '' || $lastName === '' || ! in_array($classification, ['academic', 'non_academic'], true)) {
            return $this->respond(['error' => ['code' => 'MISSING_REQUIRED_FIELDS', 'message' => 'Institutional ID, institutional email, first name, last name, and personnel_classification (academic/non_academic) are required.']], 422);
        }
        if (! str_ends_with($email, '@ndmu.edu.ph')) {
            return $this->respond(['error' => ['code' => 'INVALID_EMAIL_DOMAIN', 'message' => 'Institutional email must end with @ndmu.edu.ph.']], 422);
        }

        $db = db_connect();
        if ($classification === 'academic') {
            if ($collegeId === null || $programIds === []) {
                return $this->respond(['error' => ['code' => 'MISSING_ACADEMIC_AFFILIATION', 'message' => 'Academic Personnel require college_id and at least one academic_program_id.']], 422);
            }
            $validProgramCount = $db->table('academic_programs')
                ->where('college_id', $collegeId)
                ->where('status', 'active')
                ->whereIn('id', $programIds)
                ->countAllResults();
            if ($validProgramCount !== count($programIds)) {
                return $this->respond(['error' => ['code' => 'INVALID_PROGRAM_AFFILIATION', 'message' => 'Every Academic Program must be active and belong to the selected College.']], 422);
            }
            $administrativeUnitId = null;
        } else {
            if ($administrativeUnitId === null) {
                return $this->respond(['error' => ['code' => 'MISSING_ADMINISTRATIVE_UNIT', 'message' => 'Non-Academic Personnel require administrative_unit_id.']], 422);
            }
            $unit = $db->table('administrative_units')->where('id', $administrativeUnitId)->where('status', 'active')->get()->getRowArray();
            if ($unit === null) {
                return $this->respond(['error' => ['code' => 'INVALID_ADMINISTRATIVE_UNIT', 'message' => 'Active Administrative Unit not found.']], 422);
            }
            $collegeId = null;
            $programIds = [];
        }

        $duplicate = $db->table('profiles')
            ->where('institutional_id', $instId)
            ->orWhere('email', $email)
            ->get()->getRowArray();
        if ($duplicate !== null) {
            return $this->respond(['error' => ['code' => 'DUPLICATE_ACCOUNT', 'message' => 'An account with this institutional ID or email already exists.']], 409);
        }

        $personnelRole = $db->table('roles')->where('role_key', 'personnel')->get()->getRowArray();
        if ($personnelRole === null) {
            return $this->respond(['error' => ['code' => 'ROLE_NOT_FOUND', 'message' => 'Personnel role catalog definition missing.']], 500);
        }

        $fullName = trim(implode(' ', array_filter([$firstName, $middleName, $lastName, $suffix])));
        $initialPassword = ValidationHelper::generateTemporaryPassword();
        $passwordHash = password_hash($initialPassword, PASSWORD_DEFAULT);

        [$authUserId, $createdInAuth, $authError] = $this->createAuthIdentity($email, $initialPassword, $fullName, $instId, 'personnel');
        if ($authError !== null) {
            return $this->respond(['error' => ['code' => 'AUTH_CREATION_FAILED', 'message' => $authError]], 500);
        }

        $db->transStart();
        try {
            $now = date('Y-m-d H:i:s');
            $db->table('profiles')->insert([
                'id'                   => $authUserId,
                'institutional_id'     => $instId,
                'email'                => $email,
                'first_name'           => $firstName,
                'middle_name'          => $middleName,
                'last_name'            => $lastName,
                'full_name'            => $fullName,
                'account_type'         => 'personnel',
                'designation_title'    => $designation,
                'status'               => 'active',
                'password_hash'        => $passwordHash,
                'must_change_password' => 1,
                'created_at'           => $now,
                'updated_at'           => $now,
            ]);

            $db->table('personnel_profiles')->insert([
                'profile_id'               => $authUserId,
                'personnel_classification' => $classification,
                'employment_status'        => 'full_time',
            ]);

            if ($classification === 'academic') {
                $db->table('personnel_college_affiliations')->insert([
                    'id'                   => $this->genUuid(),
                    'personnel_profile_id' => $authUserId,
                    'college_id'           => $collegeId,
                    'effective_from'       => date('Y-m-d'),
                    'is_active'            => 1,
                ]);
                foreach ($programIds as $programId) {
                    $db->table('personnel_program_affiliations')->insert([
                        'id'                   => $this->genUuid(),
                        'personnel_profile_id' => $authUserId,
                        'academic_program_id'  => $programId,
                        'effective_from'       => date('Y-m-d'),
                        'is_active'            => 1,
                    ]);
                }
            } else {
                $db->table('personnel_administrative_unit_affiliations')->insert([
                    'id'                     => $this->genUuid(),
                    'personnel_profile_id'   => $authUserId,
                    'administrative_unit_id' => $administrativeUnitId,
                    'effective_from'         => date('Y-m-d'),
                    'is_active'              => 1,
                ]);
            }

            $db->table('profile_roles')->insert([
                'id'          => $this->genUuid(),
                'profile_id'  => $authUserId,
                'role_id'     => $personnelRole['id'],
                'scope_type'  => 'university',
                'scope_id'    => null,
                'is_active'   => 1,
                'assigned_by' => $actor['profile']['id'],
                'assigned_at' => $now,
            ]);

            // Sync local_auth_credentials
            $db->table('local_auth_credentials')->insert([
                'profile_id'          => $authUserId,
                'password_hash'       => $passwordHash,
                'password_changed_at' => null,
                'status'              => 'active',
                'created_at'          => $now,
                'updated_at'          => $now,
            ]);

            $this->recordLifecycle($db, $authUserId, $actor['profile']['id'], 'provisioned', 'Manually provisioned by HR administrator');
            $this->recordLifecycle($db, $authUserId, $actor['profile']['id'], 'activated', 'Activated upon manual provisioning');
            $db->transComplete();
        } catch (Throwable $e) {
            $db->transRollback();
            if ($createdInAuth) {
                $this->adminAuthService->deleteUser($authUserId);
            }
            return $this->respond(['error' => ['code' => 'PROVISIONING_FAILED', 'message' => 'Failed to create Personnel account: ' . $e->getMessage()]], 500);
        }

        if ($db->transStatus() === false) {
            return $this->respond(['error' => ['code' => 'PROVISIONING_FAILED', 'message' => 'Transaction failed while provisioning personnel.']], 500);
        }

        return $this->respondCreated(['data' => [
            'message'                  => 'Personnel account successfully provisioned.',
            'id'                       => $authUserId,
            'institutional_id'         => $instId,
            'institutional_email'      => $email,
            'full_name'                => $fullName,
            'account_type'             => 'personnel',
            'personnel_classification' => $classification,
            'college_id'               => $collegeId,
            'academic_program_ids'     => $programIds,
            'administrative_unit_id'   => $administrativeUnitId,
            'temporary_password'       => $initialPassword,
            'must_change_password'     => true,
        ]]);
    }

    private function createAuthIdentity(string $email, string $password, string $fullName, string $institutionalId, string $accountType): array
    {
        if ($this->isLocalDefense) {
            return [$this->genUuid(), false, null];
        }

        try {
            if ($this->adminAuthService->isConfigured()) {
                $authUser = $this->adminAuthService->createUser($email, $password, [
                    'full_name'        => $fullName,
                    'institutional_id' => $institutionalId,
                    'account_type'     => $accountType,
                ]);
                $id = (string) ($authUser['id'] ?? '');
                if ($id === '') {
                    return [null, false, 'Supabase Auth did not return a valid user UUID.'];
                }
                return [$id, true, null];
            }

            return [$this->genUuid(), false, null];
        } catch (Throwable $e) {
            return [null, false, 'Failed to create Supabase Auth identity: ' . $e->getMessage()];
        }
    }

    private function recordLifecycle($db, string $profileId, string $performedBy, string $eventType, string $reason): void
    {
        $db->table('account_lifecycle_events')->insert([
            'id'               => $this->genUuid(),
            'profile_id'       => $profileId,
            'actor_profile_id' => $performedBy,
            'event_type'       => $eventType,
            'new_status'       => 'active',
            'reason'           => $reason,
            'occurred_at'      => date('Y-m-d H:i:s'),
        ]);
    }
}
