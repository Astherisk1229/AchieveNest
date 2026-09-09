<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use Config\Database;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

class OrganizationService
{
    protected BaseConnection $db;
    protected string $storageRoot;

    public const ALLOWED_CATEGORIES = [
        'academic_college',
        'co_curricular',
        'special_interest',
        'socio_cultural',
        'religious',
        'sports',
        'student_council',
    ];

    public const ALLOWED_SCOPES = [
        'university',
        'college',
        'program',
    ];

    public const ALLOWED_MIME_TYPES = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];

    public const MAX_LOGO_SIZE_BYTES = 5242880; // 5 MB

    public function __construct(?BaseConnection $db = null, ?string $storageRoot = null)
    {
        $this->db = $db ?? Database::connect();
        $this->storageRoot = $storageRoot ?? (rtrim(WRITEPATH, '\\/') . '/uploads/organization-logos');

        if (! is_dir($this->storageRoot)) {
            @mkdir($this->storageRoot, 0755, true);
        }
    }

    protected function genUuid(): string
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

    /**
     * Lists all organizations with optional status, category, and scope filters.
     */
    public function listOrganizations(?string $status = null, ?string $category = null, ?string $scope = null): array
    {
        $builder = $this->db->table('organizations o')
            ->select('
                o.id,
                o.college_id,
                o.code,
                o.name,
                o.scope,
                o.category,
                o.status,
                o.logo_storage_key,
                o.logo_original_name,
                o.logo_mime_type,
                o.logo_updated_at,
                o.created_at,
                o.updated_at,
                c.code AS college_code,
                c.name AS college_name,
                (SELECT p.id
                 FROM organization_moderator_assignments oma
                 JOIN profiles p ON p.id = oma.personnel_profile_id
                 WHERE oma.organization_id = o.id AND oma.is_active = 1
                 LIMIT 1) AS moderator_profile_id,
                (SELECT CONCAT_WS(" ", p.first_name, p.last_name)
                 FROM organization_moderator_assignments oma
                 JOIN profiles p ON p.id = oma.personnel_profile_id
                 WHERE oma.organization_id = o.id AND oma.is_active = 1
                 LIMIT 1) AS moderator_name,
                (SELECT p.email
                 FROM organization_moderator_assignments oma
                 JOIN profiles p ON p.id = oma.personnel_profile_id
                 WHERE oma.organization_id = o.id AND oma.is_active = 1
                 LIMIT 1) AS moderator_email,
                (SELECT p.institutional_id
                 FROM organization_moderator_assignments oma
                 JOIN profiles p ON p.id = oma.personnel_profile_id
                 WHERE oma.organization_id = o.id AND oma.is_active = 1
                 LIMIT 1) AS moderator_employee_id,
                (SELECT p.designation_title
                 FROM organization_moderator_assignments oma
                 JOIN profiles p ON p.id = oma.personnel_profile_id
                 WHERE oma.organization_id = o.id AND oma.is_active = 1
                 LIMIT 1) AS moderator_designation
            ')
            ->join('colleges c', 'c.id = o.college_id', 'left')
            ->orderBy('o.name', 'ASC');

        if ($status !== null && $status !== '' && $status !== 'all') {
            $builder->where('o.status', $status);
        }
        if ($category !== null && $category !== '' && $category !== 'all') {
            $builder->where('o.category', $category);
        }
        if ($scope !== null && $scope !== '' && $scope !== 'all') {
            $builder->where('o.scope', $scope);
        }

        $rows = $builder->get()->getResultArray();
        if (empty($rows)) {
            return [];
        }

        $orgIds = array_column($rows, 'id');
        $affiliations = $this->db->table('organization_program_affiliations opa')
            ->select('opa.organization_id, opa.academic_program_id, ap.code AS program_code, ap.name AS program_name, ap.college_id, c.code AS college_code, c.name AS college_name')
            ->join('academic_programs ap', 'ap.id = opa.academic_program_id')
            ->join('colleges c', 'c.id = ap.college_id', 'left')
            ->whereIn('opa.organization_id', $orgIds)
            ->get()
            ->getResultArray();

        $affMap = [];
        $affObjectsMap = [];
        foreach ($affiliations as $aff) {
            $affMap[$aff['organization_id']][] = $aff['academic_program_id'];
            $affObjectsMap[$aff['organization_id']][] = [
                'id'           => $aff['academic_program_id'],
                'code'         => $aff['program_code'],
                'name'         => $aff['program_name'],
                'college_id'   => $aff['college_id'],
                'college_code' => $aff['college_code'],
                'college_name' => $aff['college_name'],
            ];
        }

        return array_map(function (array $row) use ($affMap, $affObjectsMap): array {
            $pIds = $affMap[$row['id']] ?? [];
            $row['program_ids'] = $pIds;
            $row['programs'] = $affObjectsMap[$row['id']] ?? [];
            
            $hasModerator = ! empty($row['moderator_profile_id']);
            if ($hasModerator) {
                $row['current_moderator'] = [
                    'profile_id'   => $row['moderator_profile_id'],
                    'full_name'    => $row['moderator_name'] ?: 'Unknown Personnel',
                    'email'        => $row['moderator_email'],
                    'employee_id'  => $row['moderator_employee_id'],
                    'designation'  => $row['moderator_designation'],
                ];
            } else {
                $row['current_moderator'] = null;
            }

            // Derive configuration status
            if ($row['scope'] === 'program') {
                $row['configuration_status'] = (count($pIds) > 0 && $hasModerator) ? 'COMPLETE' : 'PARTIALLY_CONFIGURED';
            } else {
                $row['configuration_status'] = $hasModerator ? 'COMPLETE' : 'PARTIALLY_CONFIGURED';
            }

            return $row;
        }, $rows);
    }

    /**
     * Gets a single organization by ID.
     */
    public function getOrganization(string $id): ?array
    {
        $row = $this->db->table('organizations o')
            ->select('
                o.id,
                o.college_id,
                o.code,
                o.name,
                o.scope,
                o.category,
                o.status,
                o.logo_storage_key,
                o.logo_original_name,
                o.logo_mime_type,
                o.logo_updated_at,
                o.created_at,
                o.updated_at,
                c.code AS college_code,
                c.name AS college_name,
                (SELECT p.id
                 FROM organization_moderator_assignments oma
                 JOIN profiles p ON p.id = oma.personnel_profile_id
                 WHERE oma.organization_id = o.id AND oma.is_active = 1
                 LIMIT 1) AS moderator_profile_id,
                (SELECT CONCAT_WS(" ", p.first_name, p.last_name)
                 FROM organization_moderator_assignments oma
                 JOIN profiles p ON p.id = oma.personnel_profile_id
                 WHERE oma.organization_id = o.id AND oma.is_active = 1
                 LIMIT 1) AS moderator_name,
                (SELECT p.email
                 FROM organization_moderator_assignments oma
                 JOIN profiles p ON p.id = oma.personnel_profile_id
                 WHERE oma.organization_id = o.id AND oma.is_active = 1
                 LIMIT 1) AS moderator_email,
                (SELECT p.institutional_id
                 FROM organization_moderator_assignments oma
                 JOIN profiles p ON p.id = oma.personnel_profile_id
                 WHERE oma.organization_id = o.id AND oma.is_active = 1
                 LIMIT 1) AS moderator_employee_id,
                (SELECT p.designation_title
                 FROM organization_moderator_assignments oma
                 JOIN profiles p ON p.id = oma.personnel_profile_id
                 WHERE oma.organization_id = o.id AND oma.is_active = 1
                 LIMIT 1) AS moderator_designation
            ')
            ->join('colleges c', 'c.id = o.college_id', 'left')
            ->where('o.id', $id)
            ->get()
            ->getRowArray();

        if (! $row) {
            return null;
        }

        $affiliations = $this->db->table('organization_program_affiliations opa')
            ->select('opa.academic_program_id, ap.code AS program_code, ap.name AS program_name, ap.college_id, c.code AS college_code, c.name AS college_name')
            ->join('academic_programs ap', 'ap.id = opa.academic_program_id')
            ->join('colleges c', 'c.id = ap.college_id', 'left')
            ->where('opa.organization_id', $id)
            ->get()
            ->getResultArray();

        $row['program_ids'] = array_column($affiliations, 'academic_program_id');
        $row['programs'] = array_map(function ($aff) {
            return [
                'id'           => $aff['academic_program_id'],
                'code'         => $aff['program_code'],
                'name'         => $aff['program_name'],
                'college_id'   => $aff['college_id'],
                'college_code' => $aff['college_code'],
                'college_name' => $aff['college_name'],
            ];
        }, $affiliations);

        $hasModerator = ! empty($row['moderator_profile_id']);
        if ($hasModerator) {
            $row['current_moderator'] = [
                'profile_id'   => $row['moderator_profile_id'],
                'full_name'    => $row['moderator_name'] ?: 'Unknown Personnel',
                'email'        => $row['moderator_email'],
                'employee_id'  => $row['moderator_employee_id'],
                'designation'  => $row['moderator_designation'],
            ];
        } else {
            $row['current_moderator'] = null;
        }

        $history = $this->db->table('organization_moderator_assignments oma')
            ->select('oma.id, oma.personnel_profile_id, oma.effective_from, oma.effective_until, oma.is_active, oma.assigned_at, p.first_name, p.last_name, p.email, p.institutional_id, p.designation_title')
            ->join('profiles p', 'p.id = oma.personnel_profile_id')
            ->where('oma.organization_id', $id)
            ->orderBy('oma.is_active', 'DESC')
            ->orderBy('oma.effective_from', 'DESC')
            ->get()
            ->getResultArray();

        $row['moderator_history'] = array_map(function ($h) {
            return [
                'assignment_id'  => $h['id'],
                'profile_id'     => $h['personnel_profile_id'],
                'full_name'      => trim(($h['first_name'] ?? '') . ' ' . ($h['last_name'] ?? '')) ?: 'Unknown Personnel',
                'email'          => $h['email'],
                'employee_id'    => $h['institutional_id'],
                'designation'    => $h['designation_title'],
                'effective_from' => $h['effective_from'],
                'effective_until'=> $h['effective_until'],
                'is_active'      => (bool) $h['is_active'],
                'status'         => ((int) $h['is_active'] === 1) ? 'Active' : 'Ended',
            ];
        }, $history);

        if ($row['scope'] === 'program') {
            $row['configuration_status'] = (count($row['program_ids']) > 0 && $hasModerator) ? 'COMPLETE' : 'PARTIALLY_CONFIGURED';
        } else {
            $row['configuration_status'] = $hasModerator ? 'COMPLETE' : 'PARTIALLY_CONFIGURED';
        }

        return $row;
    }

    /**
     * Validates and creates a new Student Organization with full configuration atomically.
     * Supports optional program scope affiliations and initial moderator assignment.
     */
    public function createOrganization(array $data, ?array $logoFile = null, ?string $actorProfileId = null): array
    {
        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '') {
            throw new InvalidArgumentException('Organization name is required.');
        }
        if (mb_strlen($name) > 150) {
            throw new InvalidArgumentException('Organization name may not exceed 150 characters.');
        }

        $code = strtoupper(trim((string) ($data['code'] ?? '')));
        if ($code === '') {
            throw new InvalidArgumentException('Organization code / acronym is required.');
        }
        if (mb_strlen($code) > 30) {
            throw new InvalidArgumentException('Organization code / acronym may not exceed 30 characters.');
        }

        $category = trim((string) ($data['category'] ?? ''));
        if (! in_array($category, self::ALLOWED_CATEGORIES, true)) {
            throw new InvalidArgumentException("Invalid organization category '{$category}'.");
        }

        $scope = trim((string) ($data['scope'] ?? ''));
        if (! in_array($scope, self::ALLOWED_SCOPES, true)) {
            throw new InvalidArgumentException("Invalid organization scope '{$scope}'.");
        }

        $collegeId = ! empty($data['college_id']) ? trim((string) $data['college_id']) : null;
        $rawProgramIds = is_array($data['program_ids'] ?? null)
            ? array_values(array_filter(array_map('trim', $data['program_ids'])))
            : [];
        // Deduplicate program IDs
        $programIds = array_values(array_unique($rawProgramIds));

        // Scope relationship validation
        if ($scope === 'university') {
            $collegeId = null;
            $programIds = [];
        } elseif ($scope === 'college') {
            if ($collegeId === null) {
                throw new InvalidArgumentException('College selection is required for college-scoped organizations.');
            }
            $programIds = [];
        } elseif ($scope === 'program') {
            if (empty($programIds)) {
                throw new InvalidArgumentException('At least one academic program affiliation is required for program-scoped organizations.');
            }
        }

        // Check uniqueness of code
        $existing = $this->db->table('organizations')->where('code', $code)->countAllResults();
        if ($existing > 0) {
            throw new InvalidArgumentException("Organization code '{$code}' already exists.");
        }

        if ($scope === 'college' && $collegeId !== null) {
            $collegeExists = $this->db->table('colleges')->where('id', $collegeId)->countAllResults();
            if ($collegeExists === 0) {
                throw new InvalidArgumentException('Selected college does not exist.');
            }
        } elseif ($scope === 'program') {
            $programs = $this->db->table('academic_programs')
                ->whereIn('id', $programIds)
                ->get()
                ->getResultArray();

            if (count($programs) !== count($programIds)) {
                throw new InvalidArgumentException('One or more selected academic programs do not exist.');
            }

            // Verify active status of programs
            foreach ($programs as $prog) {
                if (isset($prog['status']) && $prog['status'] !== 'active') {
                    throw new InvalidArgumentException("Academic program '{$prog['name']}' is not active.");
                }
            }

            $progCollegeId = $programs[0]['college_id'] ?? null;
            if ($collegeId === null) {
                $collegeId = $progCollegeId;
            } else {
                foreach ($programs as $prog) {
                    if ($prog['college_id'] !== $collegeId) {
                        throw new InvalidArgumentException('Selected programs must belong to the selected college.');
                    }
                }
            }
        }

        // Moderator profile validation (if provided)
        $moderatorProfileId = ! empty($data['moderator_profile_id'])
            ? trim((string) $data['moderator_profile_id'])
            : (! empty($data['moderator_id']) ? trim((string) $data['moderator_id']) : null);

        if ($moderatorProfileId !== null && $moderatorProfileId !== '') {
            $modProfile = $this->db->table('profiles')
                ->select('id, account_type, status, first_name, last_name')
                ->where('id', $moderatorProfileId)
                ->get()
                ->getRowArray();

            if (! $modProfile) {
                throw new InvalidArgumentException('Selected Organization Moderator profile does not exist.');
            }

            if (! in_array($modProfile['account_type'] ?? '', ['personnel', 'hr_admin', 'osad_admin'], true) || ($modProfile['status'] ?? '') !== 'active') {
                throw new InvalidArgumentException('Selected Organization Moderator must be an active personnel account.');
            }

            if ($scope === 'college' && $collegeId !== null) {
                $eligible = $this->db->query(
                    "SELECT 1 FROM personnel_college_affiliations WHERE personnel_profile_id = ? AND college_id = ? AND is_active = 1",
                    [$moderatorProfileId, $collegeId]
                )->getRowArray();
                if ($eligible === null) {
                    throw new InvalidArgumentException('College-based Organization moderators must be affiliated with the Organization College.');
                }
            }
        } else {
            $moderatorProfileId = null;
        }

        $orgId = $this->genUuid();
        $stagedLogoMetadata = null;
        $stagedFilePath = null;

        // Process logo upload if provided
        if ($logoFile !== null && ! empty($logoFile['tmp_name'])) {
            $stagedLogoMetadata = $this->validateAndStageLogo($orgId, $logoFile);
            $stagedFilePath = $stagedLogoMetadata['absolute_path'] ?? null;
        }

        $this->db->transBegin();
        try {
            $insertData = [
                'id'                 => $orgId,
                'college_id'         => $collegeId,
                'code'               => $code,
                'name'               => $name,
                'scope'              => $scope,
                'category'           => $category,
                'status'             => 'active',
                'logo_storage_key'   => $stagedLogoMetadata['logo_storage_key'] ?? null,
                'logo_original_name' => $stagedLogoMetadata['logo_original_name'] ?? null,
                'logo_mime_type'     => $stagedLogoMetadata['logo_mime_type'] ?? null,
                'logo_updated_at'    => $stagedLogoMetadata ? date('Y-m-d H:i:s.u') : null,
                'created_at'         => date('Y-m-d H:i:s.u'),
                'updated_at'         => date('Y-m-d H:i:s.u'),
            ];

            $this->db->table('organizations')->insert($insertData);

            // Insert program affiliations
            foreach ($programIds as $pId) {
                $this->db->table('organization_program_affiliations')->insert([
                    'id'                  => $this->genUuid(),
                    'organization_id'     => $orgId,
                    'academic_program_id' => $pId,
                    'created_at'          => date('Y-m-d H:i:s.u'),
                ]);
            }

            // Insert initial moderator assignment if provided
            if ($moderatorProfileId !== null) {
                $this->db->table('organization_moderator_assignments')->insert([
                    'id'                   => $this->genUuid(),
                    'organization_id'      => $orgId,
                    'personnel_profile_id' => $moderatorProfileId,
                    'effective_from'       => date('Y-m-d'),
                    'effective_until'      => null,
                    'is_active'            => 1,
                    'assigned_by'          => $actorProfileId,
                    'assigned_at'          => date('Y-m-d H:i:s.u'),
                    'created_at'           => date('Y-m-d H:i:s.u'),
                    'updated_at'           => date('Y-m-d H:i:s.u'),
                ]);
            }

            $this->db->transCommit();
        } catch (Throwable $e) {
            $this->db->transRollback();
            // Compensating cleanup of staged file
            if ($stagedFilePath && file_exists($stagedFilePath)) {
                @unlink($stagedFilePath);
            }
            throw new RuntimeException('Failed to create organization: ' . $e->getMessage(), 0, $e);
        }

        return $this->getOrganization($orgId);
    }

    /**
     * Updates an organization master data (name, code, category, scope, college_id, status, optional logo).
     */
    public function updateOrganization(string $id, array $data, ?array $logoFile = null): array
    {
        $org = $this->db->table('organizations')->where('id', $id)->get()->getRowArray();
        if (! $org) {
            throw new InvalidArgumentException('Organization not found.');
        }

        $name = isset($data['name']) ? trim((string) $data['name']) : $org['name'];
        if ($name === '') {
            throw new InvalidArgumentException('Organization name is required.');
        }
        if (mb_strlen($name) > 150) {
            throw new InvalidArgumentException('Organization name may not exceed 150 characters.');
        }

        $code = isset($data['code']) ? strtoupper(trim((string) $data['code'])) : $org['code'];
        if ($code === '') {
            throw new InvalidArgumentException('Organization code / acronym is required.');
        }
        if (mb_strlen($code) > 30) {
            throw new InvalidArgumentException('Organization code / acronym may not exceed 30 characters.');
        }

        // Check code uniqueness against other organizations
        $dup = $this->db->table('organizations')->where('code', $code)->where('id !=', $id)->countAllResults();
        if ($dup > 0) {
            throw new InvalidArgumentException("Organization code '{$code}' is already used by another organization.");
        }

        $category = isset($data['category']) ? trim((string) $data['category']) : $org['category'];
        if (! in_array($category, self::ALLOWED_CATEGORIES, true)) {
            throw new InvalidArgumentException("Invalid organization category '{$category}'.");
        }

        $scope = isset($data['scope']) ? trim((string) $data['scope']) : $org['scope'];
        if (! in_array($scope, self::ALLOWED_SCOPES, true)) {
            throw new InvalidArgumentException("Invalid organization scope '{$scope}'.");
        }

        $collegeId = array_key_exists('college_id', $data)
            ? (! empty($data['college_id']) ? trim((string) $data['college_id']) : null)
            : $org['college_id'];

        if ($scope === 'university') {
            $collegeId = null;
        } elseif ($scope === 'college' || $scope === 'program') {
            if ($collegeId === null) {
                throw new InvalidArgumentException('College selection is required for college- or program-scoped organizations.');
            }
            $collegeExists = $this->db->table('colleges')->where('id', $collegeId)->countAllResults();
            if ($collegeExists === 0) {
                throw new InvalidArgumentException('Selected college does not exist.');
            }
        }

        $status = isset($data['status']) ? trim((string) $data['status']) : $org['status'];
        if (! in_array($status, ['active', 'inactive', 'archived'], true)) {
            $status = $org['status'];
        }

        // Scope integrity check: if changing scope to 'program', verify it has affiliated programs
        if ($scope === 'program') {
            $affCount = $this->db->table('organization_program_affiliations')->where('organization_id', $id)->countAllResults();
            if ($affCount === 0 && empty($data['program_ids'])) {
                throw new InvalidArgumentException('Program-scoped organizations must have at least one academic program affiliation.');
            }
        }

        $updateData = [
            'name'       => $name,
            'code'       => $code,
            'category'   => $category,
            'scope'      => $scope,
            'college_id' => $collegeId,
            'status'     => $status,
            'updated_at' => date('Y-m-d H:i:s.u'),
        ];

        // Process logo upload if provided
        $stagedLogoMetadata = null;
        $stagedFilePath = null;
        if ($logoFile !== null && ! empty($logoFile['tmp_name'])) {
            $stagedLogoMetadata = $this->validateAndStageLogo($id, $logoFile);
            $stagedFilePath = $stagedLogoMetadata['absolute_path'] ?? null;
            $updateData['logo_storage_key']   = $stagedLogoMetadata['logo_storage_key'];
            $updateData['logo_original_name'] = $stagedLogoMetadata['logo_original_name'];
            $updateData['logo_mime_type']     = $stagedLogoMetadata['logo_mime_type'];
            $updateData['logo_updated_at']    = date('Y-m-d H:i:s.u');
        }

        $this->db->table('organizations')->where('id', $id)->update($updateData);

        return $this->getOrganization($id);
    }

    /**
     * Adds one or more academic programs to an organization's program scope.
     */
    public function addProgramAffiliations(string $organizationId, array $programIds): array
    {
        $org = $this->db->table('organizations')->where('id', $organizationId)->get()->getRowArray();
        if (! $org) {
            throw new InvalidArgumentException('Organization not found.');
        }

        $rawProgramIds = array_values(array_filter(array_map('trim', $programIds)));
        $uniqueProgramIds = array_values(array_unique($rawProgramIds));

        if (empty($uniqueProgramIds)) {
            throw new InvalidArgumentException('At least one academic program ID is required.');
        }

        // Validate program existence and college alignment
        $programs = $this->db->table('academic_programs')
            ->whereIn('id', $uniqueProgramIds)
            ->get()
            ->getResultArray();

        if (count($programs) !== count($uniqueProgramIds)) {
            throw new InvalidArgumentException('One or more selected academic programs do not exist.');
        }

        foreach ($programs as $prog) {
            if (isset($prog['status']) && $prog['status'] !== 'active') {
                throw new InvalidArgumentException("Academic program '{$prog['name']}' is not active.");
            }
            if (! empty($org['college_id']) && $prog['college_id'] !== $org['college_id']) {
                throw new InvalidArgumentException('Affiliated programs must belong to the organization\'s college.');
            }
        }

        // Query existing affiliations to prevent duplicate insert errors
        $existingAffs = $this->db->table('organization_program_affiliations')
            ->where('organization_id', $organizationId)
            ->get()
            ->getResultArray();
        $existingProgIds = array_column($existingAffs, 'academic_program_id');

        $this->db->transBegin();
        try {
            foreach ($uniqueProgramIds as $pId) {
                if (! in_array($pId, $existingProgIds, true)) {
                    $this->db->table('organization_program_affiliations')->insert([
                        'id'                  => $this->genUuid(),
                        'organization_id'     => $organizationId,
                        'academic_program_id' => $pId,
                        'created_at'          => date('Y-m-d H:i:s.u'),
                    ]);
                }
            }
            $this->db->transCommit();
        } catch (Throwable $e) {
            $this->db->transRollback();
            throw new RuntimeException('Failed to add program affiliations: ' . $e->getMessage(), 0, $e);
        }

        return $this->getOrganization($organizationId);
    }

    /**
     * Removes an academic program from an organization's scope.
     */
    public function removeProgramAffiliation(string $organizationId, string $programId): array
    {
        $org = $this->db->table('organizations')->where('id', $organizationId)->get()->getRowArray();
        if (! $org) {
            throw new InvalidArgumentException('Organization not found.');
        }

        $currentAffs = $this->db->table('organization_program_affiliations')
            ->where('organization_id', $organizationId)
            ->get()
            ->getResultArray();

        // Scope integrity check: program-scoped orgs must retain at least one program
        if (($org['scope'] ?? '') === 'program' && count($currentAffs) <= 1) {
            throw new InvalidArgumentException('Cannot remove the last academic program. Program-scoped organizations must maintain at least one program affiliation.');
        }

        $this->db->table('organization_program_affiliations')
            ->where('organization_id', $organizationId)
            ->where('academic_program_id', $programId)
            ->delete();

        return $this->getOrganization($organizationId);
    }

    /**
     * Assigns or reassigns an Organization Moderator to an organization.
     * Soft-deactivates any prior active moderator and records assignment tenure.
     */
    public function assignModerator(string $organizationId, string $personnelProfileId, ?string $actorProfileId = null): array
    {
        $org = $this->db->table('organizations')->where('id', $organizationId)->get()->getRowArray();
        if (! $org) {
            throw new InvalidArgumentException('Organization not found.');
        }

        $personnel = $this->db->table('profiles')
            ->select('id, account_type, status')
            ->where('id', $personnelProfileId)
            ->get()
            ->getRowArray();

        if (! $personnel) {
            throw new InvalidArgumentException('Personnel profile not found.');
        }

        if (! in_array($personnel['account_type'] ?? '', ['personnel', 'hr_admin', 'osad_admin'], true) || ($personnel['status'] ?? '') !== 'active') {
            throw new InvalidArgumentException('Personnel must be an active account to moderate an organization.');
        }

        if (($org['scope'] ?? '') === 'college' && ! empty($org['college_id'])) {
            $eligible = $this->db->query(
                "SELECT 1 FROM personnel_college_affiliations WHERE personnel_profile_id = ? AND college_id = ? AND is_active = 1",
                [$personnelProfileId, $org['college_id']]
            )->getRowArray();
            if ($eligible === null) {
                throw new InvalidArgumentException('College-based Organization moderators must be affiliated with the Organization College.');
            }
        }

        $this->db->transBegin();
        try {
            // Deactivate any existing active moderator assignment
            $this->db->table('organization_moderator_assignments')
                ->where('organization_id', $organizationId)
                ->where('is_active', 1)
                ->update([
                    'is_active'       => 0,
                    'effective_until' => date('Y-m-d'),
                    'updated_at'      => date('Y-m-d H:i:s.u'),
                ]);

            // Insert new active moderator assignment
            $newAssignmentId = $this->genUuid();
            $this->db->table('organization_moderator_assignments')->insert([
                'id'                   => $newAssignmentId,
                'organization_id'      => $organizationId,
                'personnel_profile_id' => $personnelProfileId,
                'effective_from'       => date('Y-m-d'),
                'effective_until'      => null,
                'is_active'            => 1,
                'assigned_by'          => $actorProfileId,
                'assigned_at'          => date('Y-m-d H:i:s.u'),
                'created_at'           => date('Y-m-d H:i:s.u'),
                'updated_at'           => date('Y-m-d H:i:s.u'),
            ]);

            $this->db->transCommit();
        } catch (Throwable $e) {
            $this->db->transRollback();
            throw new RuntimeException('Failed to assign organization moderator: ' . $e->getMessage(), 0, $e);
        }

        return $this->getOrganization($organizationId);
    }

    /**
     * Removes / unassigns the active Organization Moderator, preserving assignment history.
     */
    public function removeModerator(string $organizationId, ?string $actorProfileId = null): array
    {
        $org = $this->db->table('organizations')->where('id', $organizationId)->get()->getRowArray();
        if (! $org) {
            throw new InvalidArgumentException('Organization not found.');
        }

        $this->db->transBegin();
        try {
            $this->db->table('organization_moderator_assignments')
                ->where('organization_id', $organizationId)
                ->where('is_active', 1)
                ->update([
                    'is_active'       => 0,
                    'effective_until' => date('Y-m-d'),
                    'updated_at'      => date('Y-m-d H:i:s.u'),
                ]);

            $this->db->transCommit();
        } catch (Throwable $e) {
            $this->db->transRollback();
            throw new RuntimeException('Failed to remove organization moderator: ' . $e->getMessage(), 0, $e);
        }

        return $this->getOrganization($organizationId);
    }

    /**
     * Validates and stages an uploaded logo file in storage.
     */
    protected function validateAndStageLogo(string $orgId, array $file): array
    {
        $tmpName = $file['tmp_name'] ?? '';
        $originalName = basename($file['name'] ?? 'logo');
        $fileSize = (int) ($file['size'] ?? 0);
        $error = (int) ($file['error'] ?? 0);

        if ($error !== UPLOAD_ERR_OK || ! is_uploaded_file($tmpName)) {
            throw new InvalidArgumentException('Uploaded logo file is invalid or could not be received.');
        }

        if ($fileSize <= 0 || $fileSize > self::MAX_LOGO_SIZE_BYTES) {
            throw new InvalidArgumentException('Logo file size exceeds the 5 MB limit.');
        }

        // Validate MIME type via finfo
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo->file($tmpName);

        if (! isset(self::ALLOWED_MIME_TYPES[$detectedMime])) {
            throw new InvalidArgumentException("Unsupported logo image format '{$detectedMime}'. Supported formats: JPEG, PNG, WebP.");
        }

        $ext = self::ALLOWED_MIME_TYPES[$detectedMime];
        $fileUuid = $this->genUuid();
        $storageKey = "organizations/{$orgId}/logo_{$fileUuid}.{$ext}";

        $targetDir = $this->storageRoot . '/' . $orgId;
        if (! is_dir($targetDir)) {
            @mkdir($targetDir, 0755, true);
        }

        $targetPath = $targetDir . "/logo_{$fileUuid}.{$ext}";

        if (! move_uploaded_file($tmpName, $targetPath)) {
            throw new RuntimeException('Failed to persist uploaded logo to internal storage.');
        }

        return [
            'logo_storage_key'   => $storageKey,
            'logo_original_name' => $originalName,
            'logo_mime_type'     => $detectedMime,
            'absolute_path'      => $targetPath,
        ];
    }

    /**
     * Updates an organization's logo.
     */
    public function updateLogo(string $organizationId, array $logoFile): array
    {
        $org = $this->getOrganization($organizationId);
        if (! $org) {
            throw new InvalidArgumentException('Organization not found.');
        }

        $staged = $this->validateAndStageLogo($organizationId, $logoFile);
        $oldStorageKey = $org['logo_storage_key'] ?? null;

        $this->db->table('organizations')
            ->where('id', $organizationId)
            ->update([
                'logo_storage_key'   => $staged['logo_storage_key'],
                'logo_original_name' => $staged['logo_original_name'],
                'logo_mime_type'     => $staged['logo_mime_type'],
                'logo_updated_at'    => date('Y-m-d H:i:s.u'),
                'updated_at'         => date('Y-m-d H:i:s.u'),
            ]);

        // Cleanup old file after successful DB update
        if ($oldStorageKey) {
            $oldPath = $this->resolveAbsolutePath($oldStorageKey);
            if (file_exists($oldPath) && $oldPath !== $staged['absolute_path']) {
                @unlink($oldPath);
            }
        }

        return $this->getOrganization($organizationId);
    }

    /**
     * Removes an organization's logo metadata and deletes stored asset.
     */
    public function deleteLogo(string $organizationId): array
    {
        $org = $this->getOrganization($organizationId);
        if (! $org) {
            throw new InvalidArgumentException('Organization not found.');
        }

        $oldStorageKey = $org['logo_storage_key'] ?? null;

        $this->db->table('organizations')
            ->where('id', $organizationId)
            ->update([
                'logo_storage_key'   => null,
                'logo_original_name' => null,
                'logo_mime_type'     => null,
                'logo_updated_at'    => null,
                'updated_at'         => date('Y-m-d H:i:s.u'),
            ]);

        if ($oldStorageKey) {
            $oldPath = $this->resolveAbsolutePath($oldStorageKey);
            if (file_exists($oldPath)) {
                @unlink($oldPath);
            }
        }

        return $this->getOrganization($organizationId);
    }

    /**
     * Returns the absolute storage path and MIME type for serving an organization's logo.
     */
    public function getLogoPath(string $organizationId): ?array
    {
        $org = $this->getOrganization($organizationId);
        if (! $org || empty($org['logo_storage_key'])) {
            return null;
        }

        $filePath = $this->resolveAbsolutePath($org['logo_storage_key']);
        if (! file_exists($filePath)) {
            return null;
        }

        return [
            'path'      => $filePath,
            'mime_type' => $org['logo_mime_type'] ?? 'image/png',
            'filename'  => $org['logo_original_name'] ?? 'logo.png',
        ];
    }

    protected function resolveAbsolutePath(string $storageKey): string
    {
        // Prevent path traversal
        $cleanKey = str_replace(['../', '..\\'], '', $storageKey);
        // Strip leading "organizations/" prefix to match storageRoot
        $relPath = preg_replace('#^organizations[/\\\\]#', '', $cleanKey);

        return $this->storageRoot . '/' . ltrim($relPath, '/\\');
    }
}
