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
                (SELECT p.institutional_email
                 FROM organization_moderator_assignments oma
                 JOIN profiles p ON p.id = oma.personnel_profile_id
                 WHERE oma.organization_id = o.id AND oma.is_active = 1
                 LIMIT 1) AS moderator_email
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
        $affiliations = $this->db->table('organization_program_affiliations')
            ->whereIn('organization_id', $orgIds)
            ->get()
            ->getResultArray();

        $affMap = [];
        foreach ($affiliations as $aff) {
            $affMap[$aff['organization_id']][] = $aff['academic_program_id'];
        }

        return array_map(function (array $row) use ($affMap): array {
            $row['program_ids'] = $affMap[$row['id']] ?? [];
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
                (SELECT p.institutional_email
                 FROM organization_moderator_assignments oma
                 JOIN profiles p ON p.id = oma.personnel_profile_id
                 WHERE oma.organization_id = o.id AND oma.is_active = 1
                 LIMIT 1) AS moderator_email
            ')
            ->join('colleges c', 'c.id = o.college_id', 'left')
            ->where('o.id', $id)
            ->get()
            ->getRowArray();

        if (! $row) {
            return null;
        }

        $affiliations = $this->db->table('organization_program_affiliations')
            ->where('organization_id', $id)
            ->get()
            ->getResultArray();

        $row['program_ids'] = array_column($affiliations, 'academic_program_id');

        return $row;
    }

    /**
     * Validates and creates a new Student Organization transactionally.
     */
    public function createOrganization(array $data, ?array $logoFile = null): array
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
        $programIds = is_array($data['program_ids'] ?? null)
            ? array_values(array_filter(array_map('trim', $data['program_ids'])))
            : [];

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
        // storageKey is "organizations/<orgId>/logo_<uuid>.<ext>"
        // Strip leading "organizations/" prefix to match storageRoot
        $relPath = preg_replace('#^organizations[/\\\\]#', '', $cleanKey);

        return $this->storageRoot . '/' . ltrim($relPath, '/\\');
    }
}
