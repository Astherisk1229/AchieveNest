<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AccountLifecycleResolver;
use App\Services\AuthenticatedActorService;
use App\Services\SupabaseAdminAuthService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;
use Config\ProvisioningValidation;

class TargetProvisioningController extends Controller
{
    use ResponseTrait;

    protected AuthenticatedActorService $actorService;
    protected SupabaseAdminAuthService $adminAuthService;
    protected bool $isLocalDefense;
    protected ProvisioningValidation $provisioningConfig;

    public function __construct(
        ?AuthenticatedActorService $actorService = null,
        ?SupabaseAdminAuthService $adminAuthService = null
    ) {
        $this->actorService = $actorService ?? new AuthenticatedActorService();
        $this->adminAuthService = $adminAuthService ?? new SupabaseAdminAuthService();
        $this->isLocalDefense = (env('AUTH_MODE') === 'local-defense' || env('ACHIEVENEST_ENV') === 'local-defense');
        $this->provisioningConfig = config('ProvisioningValidation');
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

    public function availability()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }
        $accountType = (string) ($actor['profile']['account_type'] ?? '');
        $authorized = ($accountType === 'osad_admin' && in_array('osad_staff', $actor['roles'], true))
            || ($accountType === 'hr_admin' && in_array('hr_staff', $actor['roles'], true));
        if (! $authorized) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Administrative provisioning permission required.']], 403);
        }

        $throttler = service('throttler');
        $actorId = (string) ($actor['profile']['id'] ?? 'unknown');
        $sourceIp = $this->request->getIPAddress();
        $capacity = $this->provisioningConfig->availabilityCapacity;
        $window = $this->provisioningConfig->availabilityWindowSeconds;
        $lock = fopen(WRITEPATH . 'cache/provisioning-availability-rate-limit.lock', 'c');
        if ($lock === false || ! flock($lock, LOCK_EX)) {
            if (is_resource($lock)) fclose($lock);
            return $this->respond(['error' => ['code' => 'AVAILABILITY_RATE_LIMIT_UNAVAILABLE', 'message' => 'Availability checking is temporarily unavailable.']], 503);
        }
        try {
            $actorAllowed = $throttler->check('provisioning-availability-actor-' . hash('sha256', $actorId), $capacity, $window);
            $actorRetry = $throttler->getTokenTime();
            $ipAllowed = $throttler->check('provisioning-availability-ip-' . hash('sha256', $sourceIp), $capacity, $window);
            $retryAfter = max(1, $actorRetry, $throttler->getTokenTime());
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
        if (! $actorAllowed || ! $ipAllowed) {
            return $this->respond(['error' => [
                'code' => 'AVAILABILITY_RATE_LIMITED',
                'message' => 'Too many availability checks. Try again shortly.',
                'retry_after' => $retryAfter,
            ]], 429)->setHeader('Retry-After', (string) $retryAfter);
        }

        $json = $this->request->getJSON(true) ?? [];
        if (array_diff(array_keys($json), ['field', 'value']) !== []) {
            return $this->validationError(['request' => 'Only field and value are accepted.']);
        }
        $field = $json['field'] ?? null;
        if ($field !== 'institutional_email') {
            return $this->validationError(['field' => 'Only institutional_email availability is supported.']);
        }
        $email = ValidationHelper::canonicalizeNdmuEmail($json['value'] ?? null);
        if ($email === null) {
            return $this->validationError(['institutional_email' => 'Enter a valid ndmu.edu.ph institutional email.']);
        }

        $owner = db_connect()->table('profiles')->select('status')->where('email', $email)->get()->getRowArray();
        $state = $owner === null ? null : (in_array($owner['status'] ?? '', ['inactive', 'suspended', 'archived'], true) ? $owner['status'] : 'active');
        return $this->respond(['data' => [
            'field' => 'institutional_email', 'canonical_value' => $email,
            'available' => $owner === null, 'conflict_state' => $state,
            'error_code' => $owner === null ? null : 'EMAIL_ALREADY_EXISTS',
        ]]);
    }

    private function validationError(array $fields)
    {
        return $this->respond(['error' => [
            'code' => 'VALIDATION_FAILED', 'message' => 'One or more request fields are invalid.', 'fields' => $fields,
        ]], 422);
    }

    private function identityConflict($db, string $institutionalId, string $email)
    {
        $emailOwner = $db->table('profiles')->select('status')->where('email', $email)->get()->getRowArray();
        if ($emailOwner !== null) {
            $state = in_array($emailOwner['status'] ?? '', ['inactive', 'suspended', 'archived'], true) ? $emailOwner['status'] : 'active';
            return $this->respond(['error' => ['code' => 'EMAIL_ALREADY_EXISTS', 'field' => 'institutional_email', 'conflict_state' => $state, 'message' => 'This institutional email is already reserved by an account.']], 409);
        }
        $idOwner = $db->table('profiles')->select('status')->where('institutional_id', $institutionalId)->get()->getRowArray();
        if ($idOwner !== null) {
            return $this->respond(['error' => ['code' => 'INSTITUTIONAL_ID_ALREADY_EXISTS', 'field' => 'institutional_id', 'message' => 'This Institutional ID is already assigned to an account.']], 409);
        }
        return null;
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
        $allowedFields = ['institutional_id','institutional_email','first_name','middle_name','last_name','suffix','academic_program_id','degree_program_id','year_level','academic_year','sex'];
        if (! is_array($json) || array_diff(array_keys($json), $allowedFields) !== []) {
            return $this->validationError(['request' => 'Request contains unsupported fields.']);
        }
        foreach ($json as $field => $value) {
            if ($value !== null && ! is_string($value)) {
                return $this->validationError([$field => 'Field must be a scalar string or null.']);
            }
        }
        $instId = ValidationHelper::canonicalizeStudentInstitutionalId(
            $json['institutional_id'] ?? null,
            $this->provisioningConfig->studentIdMinimumLength,
            $this->provisioningConfig->institutionalIdMaximumLength
        );
        $email = ValidationHelper::canonicalizeNdmuEmail($json['institutional_email'] ?? null);
        $firstName = trim((string) ($json['first_name'] ?? ''));
        $lastName = trim((string) ($json['last_name'] ?? ''));
        $middleName = ! empty($json['middle_name']) ? trim((string) $json['middle_name']) : null;
        $suffix = ! empty($json['suffix']) ? trim((string) $json['suffix']) : null;
        $academicProgramId = trim((string) ($json['academic_program_id'] ?? $json['degree_program_id'] ?? ''));
        $yearLevel = trim((string) ($json['year_level'] ?? ''));
        $academicYear = ! empty($json['academic_year']) ? trim((string) $json['academic_year']) : '';
        $rawSex = $json['sex'] ?? null;

        if ($firstName === '' || $lastName === '' || $academicProgramId === '') {
            return $this->respond(['error' => ['code' => 'MISSING_REQUIRED_FIELDS', 'message' => 'Institutional ID, institutional email, first name, last name, and academic_program_id are required.']], 422);
        }
        if ($instId === null) {
            return $this->respond(['error' => ['code' => 'INVALID_INSTITUTIONAL_ID', 'field' => 'institutional_id', 'message' => 'Student Institutional ID must contain 5 to 50 ASCII digits.']], 422);
        }
        if ($email === null) {
            return $this->validationError(['institutional_email' => 'Enter a valid ndmu.edu.ph institutional email.']);
        }
        if (! ValidationHelper::validateName($firstName) || ! ValidationHelper::validateName($lastName)
            || ($middleName !== null && ! ValidationHelper::validateName($middleName, false))
            || ($suffix !== null && ! ValidationHelper::validateName($suffix, false))) {
            return $this->validationError(['name' => 'Names must be within database limits and contain no control or invisible formatting characters.']);
        }
        if (! ValidationHelper::validateUuid($academicProgramId)) {
            return $this->respond(['error' => ['code' => 'INVALID_ACADEMIC_PROGRAM', 'message' => 'academic_program_id must be a valid UUID.']], 422);
        }
        if ($rawSex === null || ! is_string($rawSex) || trim($rawSex) === '') {
            return $this->respond(['error' => ['code' => 'VALIDATION_FAILED', 'field' => 'sex', 'message' => 'Sex is required.']], 422);
        }
        $sex = trim($rawSex);
        if (! ValidationHelper::validateSex($sex, $this->provisioningConfig->canonicalSexValues)) {
            return $this->respond(['error' => ['code' => 'INVALID_SEX', 'field' => 'sex', 'message' => 'Sex must be Male, Female, or Prefer not to say.']], 422);
        }
        if (! ValidationHelper::validateStudentYearLevel($yearLevel, $this->provisioningConfig->canonicalYearLevels)) {
            return $this->validationError(['year_level' => 'Year level must be 1st Year through 5th Year.']);
        }
        $currentYear = (int) date('Y');
        if (! ValidationHelper::validateAcademicYear($academicYear, $this->provisioningConfig->earliestAcademicYearStart, $currentYear)) {
            return $this->validationError(['academic_year' => 'Academic year must be consecutive YYYY-YYYY+1 between 2025-2026 and the current institutional year.']);
        }


        $db = db_connect();
        $program = $db->table('academic_programs')
            ->where('id', $academicProgramId)
            ->where('status', 'active')
            ->get()->getRowArray();
        if ($program === null) {
            return $this->respond(['error' => ['code' => 'ACADEMIC_PROGRAM_NOT_FOUND', 'message' => 'Active Academic Program not found.']], 422);
        }

        $conflict = $this->identityConflict($db, $instId, $email);
        if ($conflict !== null) {
            return $conflict;
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
            if ($this->identityConflict($db, $instId, $email) !== null) {
                throw new \RuntimeException('IDENTITY_CONFLICT');
            }
            $now = date('Y-m-d H:i:s');
            $db->table('profiles')->insert([
                'id'                   => $authUserId,
                'institutional_id'     => $instId,
                'email'                => $email,
                'first_name'           => $firstName,
                'middle_name'          => $middleName,
                'last_name'            => $lastName,
                'full_name'            => $fullName,
                'sex'                  => $sex,
                'account_type'         => 'student',
                'status'               => 'active',
                'password_hash'        => $passwordHash,
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

            // Sync local_auth_credentials (canonical authority for must_change_password)
            $db->table('local_auth_credentials')->insert([
                'profile_id'           => $authUserId,
                'password_hash'        => $passwordHash,
                'must_change_password' => 1,
                'password_changed_at'  => null,
                'status'               => 'active',
                'created_at'           => $now,
                'updated_at'           => $now,
            ]);

            $this->recordLifecycle($db, $authUserId, $actor['profile']['id'], 'provisioned', 'Manually provisioned by OSAD administrator');
            $this->recordLifecycle($db, $authUserId, $actor['profile']['id'], 'activated', 'Activated upon manual provisioning');

            $db->table('audit_logs')->insert([
                'id'               => $this->genUuid(),
                'actor_profile_id' => $actor['profile']['id'],
                'event_code'       => 'ACCOUNT_PROVISIONING_SUCCEEDED',
                'category'         => 'provisioning',
                'target_type'      => 'student',
                'target_id'        => $authUserId,
                'outcome'          => 'success',
                'ip_address'       => $this->request->getIPAddress(),
                'details'          => 'Student account provisioned successfully by OSAD administrator.',
                'safe_context'     => json_encode([
                    'institutional_id'    => $instId,
                    'academic_program_id' => $academicProgramId,
                    'year_level'          => $yearLevel,
                    'academic_year'       => $academicYear,
                ]),
            ]);

            $db->transComplete();
        } catch (Throwable $e) {
            $db->transRollback();
            if ($createdInAuth) {
                $this->adminAuthService->deleteUser($authUserId);
            }
            $this->logProvisioningFailure($db, $actor['profile']['id'], 'student', 'Student provisioning failed: ' . $e->getMessage());
            $conflict = $this->identityConflict($db, $instId, $email);
            if ($conflict !== null) return $conflict;
            return $this->respond(['error' => ['code' => 'PROVISIONING_FAILED', 'message' => 'Failed to create Student account.']], 500);
        }

        if ($db->transStatus() === false) {
            return $this->respond(['error' => ['code' => 'PROVISIONING_FAILED', 'message' => 'Transaction failed while provisioning student.']], 500);
        }

        return $this->respondCreated(['data' => [
            'message'                  => 'Student account successfully provisioned.',
            'id'                       => $authUserId,
            'institutional_id'         => $instId,
            'institutional_email'      => $email,
            'full_name'                => $fullName,
            'sex'                      => $sex,
            'account_type'             => 'student',
            'academic_program_id'      => $academicProgramId,
            'program'                  => $program['name'],
            'program_code'             => $program['code'],
            'year_level'               => $yearLevel,
            'enrollment_status'        => 'enrolled',
            'status'                   => 'active',
            'administrative_status'    => 'active',
            'account_lifecycle_status' => AccountLifecycleResolver::STATUS_PENDING_FIRST_LOGIN,
            'required_next_action'     => AccountLifecycleResolver::ACTION_CHANGE_PASSWORD,
            'temporary_password'       => $initialPassword,
            'must_change_password'     => true,
        ]]);
    }

    /**
     * Lists all student accounts with normalized projection and zero N+1 queries.
     * GET /api/v1/osad/students
     */
    public function listStudents()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $isOsad = (($actor['profile']['account_type'] ?? '') === 'osad_admin' && in_array('osad_staff', $actor['roles'], true));
        if (! $isOsad) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may list Student accounts.']], 403);
        }

        $db = db_connect();
        $builder = $db->table('profiles p')
            ->select('
                p.id,
                p.institutional_id,
                p.email,
                p.first_name,
                p.middle_name,
                p.last_name,
                p.full_name,
                p.sex,
                p.status,
                lac.must_change_password AS credential_must_change_password,
                CASE
                    WHEN lac.profile_id IS NULL THEN \'missing\'
                    WHEN lac.must_change_password IS NULL THEN \'invalid\'
                    ELSE \'valid\'
                END AS credential_integrity_status,
                sp.year_level,
                sp.enrollment_status,
                ap.id AS academic_program_id,
                ap.code AS program_code,
                ap.name AS program_name,
                c.id AS college_id,
                c.code AS college_code,
                c.name AS college_name,
                c.acronym_badge_color AS college_color
            ', false)
            ->join('local_auth_credentials lac', 'lac.profile_id = p.id', 'left')
            ->join('student_profiles sp', 'sp.profile_id = p.id')
            ->join('student_program_enrollments spe', 'spe.student_profile_id = sp.profile_id AND spe.is_active = 1', 'left')
            ->join('academic_programs ap', 'ap.id = spe.academic_program_id', 'left')
            ->join('colleges c', 'c.id = ap.college_id', 'left')
            ->where('p.account_type', 'student');

        // Apply Search
        $search = trim((string) ($this->request->getGet('search') ?? ''));
        if ($search !== '') {
            $builder->groupStart()
                ->like('p.full_name', $search)
                ->orLike('p.institutional_id', $search)
                ->orLike('p.email', $search)
                ->groupEnd();
        }

        // Apply College Filter
        $collegeId = trim((string) ($this->request->getGet('college_id') ?? ''));
        if ($collegeId !== '') {
            $builder->where('c.id', $collegeId);
        }

        // Apply Program Filter
        $programId = trim((string) ($this->request->getGet('program_id') ?? ''));
        if ($programId !== '') {
            $builder->where('ap.id', $programId);
        }

        // Apply Year Level Filter
        $yearLevel = trim((string) ($this->request->getGet('year_level') ?? ''));
        if ($yearLevel !== '' && $yearLevel !== 'all') {
            if (! ValidationHelper::validateStudentYearLevel($yearLevel, $this->provisioningConfig->canonicalYearLevels)) {
                return $this->validationError(['year_level' => 'Invalid year level filter. Must be 1st Year through 5th Year.']);
            }
            $builder->where('sp.year_level', $yearLevel);
        }


        // Apply Administrative Status Filter
        $status = trim((string) ($this->request->getGet('status') ?? ''));
        if ($status !== '' && in_array($status, ['active', 'suspended', 'archived'], true)) {
            $builder->where('p.status', $status);
        }

        $rows = $builder->orderBy('p.last_name', 'ASC')
            ->orderBy('p.first_name', 'ASC')
            ->orderBy('p.id', 'ASC')
            ->get()->getResultArray();

        $students = array_map(static function (array $r): array {
            $lifecycle = AccountLifecycleResolver::resolve(
                $r['status'] ?? 'active',
                $r['credential_must_change_password'] ?? null,
                false,
                $r['credential_integrity_status'] ?? null
            );

            return [
                'id'                          => $r['id'],
                'institutional_id'            => $r['institutional_id'],
                'student_id'                  => $r['institutional_id'],
                'full_name'                   => $r['full_name'],
                'first_name'                  => $r['first_name'],
                'middle_name'                 => $r['middle_name'],
                'last_name'                   => $r['last_name'],
                'email'                       => $r['email'],
                'sex'                         => $r['sex'] ?? null,
                'college'                     => $r['college_code'] ?? null,
                'college_id'                  => $r['college_id'] ?? null,
                'college_name'                => $r['college_name'] ?? null,
                'college_color'               => $r['college_color'] ?? null,
                'program'                     => $r['program_name'] ?? null,
                'program_code'                => $r['program_code'] ?? null,
                'academic_program_id'         => $r['academic_program_id'] ?? null,
                'year_level'                  => $r['year_level'] ?? null,
                'enrollment_status'           => $r['enrollment_status'] ?? 'enrolled',
                'status'                      => $r['status'] ?? 'active',
                'administrative_status'       => $lifecycle['administrative_status'],
                'account_lifecycle_status'    => $lifecycle['account_lifecycle_status'],
                'credential_integrity_status' => $lifecycle['credential_integrity_status'],
                'must_change_password'        => $lifecycle['must_change_password'],
                'required_next_action'        => $lifecycle['required_next_action'],
            ];
        }, $rows);

        return $this->respond(['data' => ['students' => $students]]);
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
        $allowedFields = ['institutional_id','institutional_email','first_name','middle_name','last_name','suffix','designation','personnel_classification','personnel_group','organizational_side','college_id','academic_program_ids','administrative_unit_id'];
        if (! is_array($json) || array_diff(array_keys($json), $allowedFields) !== []) {
            return $this->validationError(['request' => 'Request contains unsupported fields.']);
        }
        foreach ($json as $field => $value) {
            if ($field === 'academic_program_ids') {
                if (! is_array($value) || array_filter($value, static fn ($item) => ! is_string($item)) !== []) {
                    return $this->validationError([$field => 'Field must be an array of scalar strings.']);
                }
            } elseif ($value !== null && ! is_string($value)) {
                return $this->validationError([$field => 'Field must be a scalar string or null.']);
            }
        }
        $instId = ValidationHelper::canonicalizePersonnelInstitutionalId($json['institutional_id'] ?? null, $this->provisioningConfig->institutionalIdMaximumLength);
        $email = ValidationHelper::canonicalizeNdmuEmail($json['institutional_email'] ?? null);
        $firstName = trim((string) ($json['first_name'] ?? ''));
        $lastName = trim((string) ($json['last_name'] ?? ''));
        $middleName = ! empty($json['middle_name']) ? trim((string) $json['middle_name']) : null;
        $suffix = ! empty($json['suffix']) ? trim((string) $json['suffix']) : null;
        $designation = ! empty($json['designation']) ? trim((string) $json['designation']) : 'Personnel';
        
        $rawGroup = $json['personnel_group'] ?? null;
        $rawSide  = $json['organizational_side'] ?? ($json['personnel_classification'] ?? null);
        
        if ($rawGroup === null) {
            $rawGroup = ($rawSide === 'academic') ? 'faculty' : 'non_teaching_faculty';
        }
        if ($rawSide === null) {
            $rawSide = 'academic';
        }

        $clsService = new \App\Services\PersonnelClassificationService();
        $clsValidation = $clsService->validatePair($rawGroup, $rawSide);
        if (! $clsValidation['valid']) {
            return $this->respond(['error' => $clsValidation['error']], 422);
        }

        $classification = $clsValidation['side'];
        $collegeId = ! empty($json['college_id']) ? (string) $json['college_id'] : null;
        $administrativeUnitId = ! empty($json['administrative_unit_id']) ? (string) $json['administrative_unit_id'] : null;
        $programIds = array_values(array_unique(array_filter(array_map('strval', (array) ($json['academic_program_ids'] ?? [])))));

        if ($firstName === '' || $lastName === '') {
            return $this->respond(['error' => ['code' => 'MISSING_REQUIRED_FIELDS', 'message' => 'Institutional ID, institutional email, first name, and last name are required.']], 422);
        }
        if ($instId === null) {
            return $this->respond(['error' => ['code' => 'INVALID_INSTITUTIONAL_ID', 'field' => 'institutional_id', 'message' => 'Personnel Institutional ID must be a non-empty scalar string of at most 50 characters without control or invisible formatting characters.']], 422);
        }
        if ($email === null) {
            return $this->validationError(['institutional_email' => 'Enter a valid ndmu.edu.ph institutional email.']);
        }
        if (! ValidationHelper::validateName($firstName) || ! ValidationHelper::validateName($lastName)
            || ($middleName !== null && ! ValidationHelper::validateName($middleName, false))
            || ($suffix !== null && ! ValidationHelper::validateName($suffix, false))) {
            return $this->validationError(['name' => 'Names must be within database limits and contain no control or invisible formatting characters.']);
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

        $conflict = $this->identityConflict($db, $instId, $email);
        if ($conflict !== null) {
            return $conflict;
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
            if ($this->identityConflict($db, $instId, $email) !== null) {
                throw new \RuntimeException('IDENTITY_CONFLICT');
            }
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
                'created_at'           => $now,
                'updated_at'           => $now,
            ]);

            $personnelProfileData = [
                'profile_id'               => $authUserId,
                'personnel_classification' => $clsValidation['side'],
                'employment_status'        => 'full_time',
            ];
            if ($db->fieldExists('personnel_group', 'personnel_profiles')) {
                $personnelProfileData['personnel_group'] = $clsValidation['group'];
            }
            if ($db->fieldExists('organizational_side', 'personnel_profiles')) {
                $personnelProfileData['organizational_side'] = $clsValidation['side'];
            }

            $db->table('personnel_profiles')->insert($personnelProfileData);

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

            // Sync local_auth_credentials (canonical authority for must_change_password)
            $db->table('local_auth_credentials')->insert([
                'profile_id'           => $authUserId,
                'password_hash'        => $passwordHash,
                'must_change_password' => 1,
                'password_changed_at'  => null,
                'status'               => 'active',
                'created_at'           => $now,
                'updated_at'           => $now,
            ]);

            $this->recordLifecycle($db, $authUserId, $actor['profile']['id'], 'provisioned', 'Manually provisioned by HR administrator');
            $this->recordLifecycle($db, $authUserId, $actor['profile']['id'], 'activated', 'Activated upon manual provisioning');

            $db->table('audit_logs')->insert([
                'id'               => $this->genUuid(),
                'actor_profile_id' => $actor['profile']['id'],
                'event_code'       => 'ACCOUNT_PROVISIONING_SUCCEEDED',
                'category'         => 'provisioning',
                'target_type'      => 'personnel',
                'target_id'        => $authUserId,
                'outcome'          => 'success',
                'ip_address'       => $this->request->getIPAddress(),
                'details'          => 'Personnel account provisioned successfully by HR administrator.',
                'safe_context'     => json_encode([
                    'institutional_id'         => $instId,
                    'personnel_classification' => $classification,
                    'college_id'               => $collegeId,
                    'academic_program_ids'     => $programIds,
                ]),
            ]);

            $db->transComplete();
        } catch (Throwable $e) {
            $db->transRollback();
            if ($createdInAuth) {
                $this->adminAuthService->deleteUser($authUserId);
            }
            $this->logProvisioningFailure($db, $actor['profile']['id'], 'personnel', 'Personnel provisioning failed: ' . $e->getMessage());
            $conflict = $this->identityConflict($db, $instId, $email);
            if ($conflict !== null) return $conflict;
            return $this->respond(['error' => ['code' => 'PROVISIONING_FAILED', 'message' => 'Failed to create Personnel account.']], 500);
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
            'personnel_group'          => $clsValidation['group'],
            'organizational_side'      => $clsValidation['side'],
            'classification_code'      => $clsValidation['code'],
            'classification_label'     => $clsValidation['label'],
            'college_id'               => $collegeId,
            'academic_program_ids'     => $programIds,
            'administrative_unit_id'   => $administrativeUnitId,
            'status'                   => 'active',
            'administrative_status'    => 'active',
            'account_lifecycle_status' => AccountLifecycleResolver::STATUS_PENDING_FIRST_LOGIN,
            'required_next_action'     => AccountLifecycleResolver::ACTION_CHANGE_PASSWORD,
            'temporary_password'       => $initialPassword,
            'must_change_password'     => true,
        ]]);
    }

    /**
     * GET /api/v1/osad/audit
     * Provides OSAD administrators with operational visibility into Student audit trail.
     */
    public function audit(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated active session required.']], 401);
        }
        $isOsad = (($actor['profile']['account_type'] ?? '') === 'osad_admin' && in_array('osad_staff', $actor['roles'], true));
        if (! $isOsad) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'OSAD Admin access required.']], 403);
        }

        $db = db_connect();
        $filterProfileId = trim((string) $this->request->getGet('profile_id'));
        $fromDate        = trim((string) $this->request->getGet('from_date'));
        $toDate          = trim((string) $this->request->getGet('to_date'));
        $eventCode       = trim((string) $this->request->getGet('event_code'));
        $pagination      = ValidationHelper::validatePagination(
            $this->request->getGet('page') ?? 1,
            $this->request->getGet('per_page') ?? 50
        );

        $bindings = [];
        $where = "1=1";
        if ($filterProfileId !== '') {
            $where .= " AND (al.target_id = ? OR al.actor_profile_id = ?)";
            $bindings[] = $filterProfileId;
            $bindings[] = $filterProfileId;
        }
        if ($eventCode !== '') {
            $where .= " AND al.event_code = ?";
            $bindings[] = $eventCode;
        }
        if ($fromDate !== '' && ValidationHelper::validateDateString($fromDate)) {
            $where .= " AND al.created_at >= ?";
            $bindings[] = $fromDate . ' 00:00:00';
        }
        if ($toDate !== '' && ValidationHelper::validateDateString($toDate)) {
            $where .= " AND al.created_at <= ?";
            $bindings[] = $toDate . ' 23:59:59';
        }

        $auditQuery = <<<SQL
          SELECT
            al.id,
            al.event_code,
            al.category,
            al.target_type,
            al.target_id,
            tp.full_name AS target_name,
            al.actor_profile_id,
            ap.full_name AS actor_name,
            al.outcome,
            al.details,
            al.safe_context,
            al.created_at
          FROM audit_logs al
          LEFT JOIN profiles tp ON tp.id = al.target_id
          LEFT JOIN profiles ap ON ap.id = al.actor_profile_id
          WHERE {$where}
          ORDER BY al.created_at DESC
          LIMIT ? OFFSET ?
SQL;

        $bindings[] = $pagination['per_page'];
        $bindings[] = $pagination['offset'];

        $events = $db->query($auditQuery, $bindings)->getResultArray();

        return $this->respond([
            'data' => [
                'page'     => $pagination['page'],
                'per_page' => $pagination['per_page'],
                'events'   => $events,
            ],
        ], 200);
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

    private function logProvisioningFailure($db, ?string $actorId, string $targetType, string $details): void
    {
        try {
            $db->table('audit_logs')->insert([
                'id'               => $this->genUuid(),
                'actor_profile_id' => $actorId,
                'event_code'       => 'ACCOUNT_PROVISIONING_FAILED',
                'category'         => 'provisioning',
                'target_type'      => $targetType,
                'target_id'        => null,
                'outcome'          => 'failure',
                'ip_address'       => $this->request->getIPAddress(),
                'details'          => $details,
                'safe_context'     => json_encode(['target_type' => $targetType]),
            ]);
        } catch (Throwable $e) {
            // Non-blocking log failure
        }
    }
}
