<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use CodeIgniter\HTTP\Files\UploadedFile;
use Config\Database;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

class CollegeService
{
    protected BaseConnection $db;
    protected string $storageRoot;

    public const ALLOWED_MIME_TYPES = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];

    public const MAX_LOGO_SIZE_BYTES = 5242880; // 5 MB

    public function __construct(?BaseConnection $db = null, ?string $storageRoot = null)
    {
        $this->db = $db ?? Database::connect();
        $this->storageRoot = $storageRoot ?? (rtrim(WRITEPATH, '\\/') . '/uploads/college-logos');

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
     * Lists all colleges with program count and active dean details.
     */
    public function listColleges(?string $status = null): array
    {
        $builder = $this->db->table('colleges c')
            ->select('
                c.id,
                c.code,
                c.name,
                c.description,
                c.status,
                c.logo_storage_key,
                c.logo_original_name,
                c.logo_mime_type,
                c.logo_updated_at,
                c.acronym_badge_color,
                c.created_at,
                c.updated_at,
                (SELECT COUNT(*) FROM academic_programs ap WHERE ap.college_id = c.id AND ap.status = "active") AS program_count,
                (SELECT p.id
                 FROM dean_assignments da
                 JOIN profiles p ON p.id = da.personnel_profile_id
                 WHERE da.college_id = c.id AND da.is_active = 1
                 LIMIT 1) AS dean_profile_id,
                (SELECT p.full_name
                 FROM dean_assignments da
                 JOIN profiles p ON p.id = da.personnel_profile_id
                 WHERE da.college_id = c.id AND da.is_active = 1
                 LIMIT 1) AS dean_name,
                (SELECT p.email
                 FROM dean_assignments da
                 JOIN profiles p ON p.id = da.personnel_profile_id
                 WHERE da.college_id = c.id AND da.is_active = 1
                 LIMIT 1) AS dean_email
            ');

        if ($status !== null && $status !== '' && $status !== 'all') {
            $builder->where('c.status', $status);
        }

        $rows = $builder->orderBy('c.code', 'ASC')->get()->getResultArray();

        foreach ($rows as &$row) {
            $row['program_count'] = (int) ($row['program_count'] ?? 0);
            $row['has_logo'] = ! empty($row['logo_storage_key']);
            $row['programs'] = $this->db->table('academic_programs ap')
                ->select('
                    ap.id,
                    ap.college_id,
                    ap.code,
                    ap.name,
                    ap.degree_level,
                    ap.status,
                    (SELECT p.full_name
                     FROM program_coordinator_assignments pca
                     JOIN profiles p ON p.id = pca.personnel_profile_id
                     WHERE pca.academic_program_id = ap.id AND pca.is_active = 1
                     LIMIT 1) AS coordinator_name
                ')
                ->where('ap.college_id', $row['id'])
                ->where('ap.status', 'active')
                ->orderBy('ap.code', 'ASC')
                ->get()
                ->getResultArray();
        }
        unset($row);

        return $rows;
    }

    /**
     * Gets single college details.
     */
    public function getCollege(string $id): ?array
    {
        $row = $this->db->table('colleges c')
            ->select('
                c.id,
                c.code,
                c.name,
                c.description,
                c.status,
                c.logo_storage_key,
                c.logo_original_name,
                c.logo_mime_type,
                c.logo_updated_at,
                c.acronym_badge_color,
                c.created_at,
                c.updated_at,
                (SELECT p.id
                 FROM dean_assignments da
                 JOIN profiles p ON p.id = da.personnel_profile_id
                 WHERE da.college_id = c.id AND da.is_active = 1
                 LIMIT 1) AS dean_profile_id,
                (SELECT p.full_name
                 FROM dean_assignments da
                 JOIN profiles p ON p.id = da.personnel_profile_id
                 WHERE da.college_id = c.id AND da.is_active = 1
                 LIMIT 1) AS dean_name,
                (SELECT p.email
                 FROM dean_assignments da
                 JOIN profiles p ON p.id = da.personnel_profile_id
                 WHERE da.college_id = c.id AND da.is_active = 1
                 LIMIT 1) AS dean_email
            ')
            ->where('c.id', $id)
            ->get()
            ->getRowArray();

        if (! $row) {
            return null;
        }

        $row['has_logo'] = ! empty($row['logo_storage_key']);
        $programs = $this->db->table('academic_programs ap')
            ->select('
                ap.id,
                ap.college_id,
                ap.code,
                ap.name,
                ap.degree_level,
                ap.status,
                (SELECT p.id
                 FROM program_coordinator_assignments pca
                 JOIN profiles p ON p.id = pca.personnel_profile_id
                 WHERE pca.academic_program_id = ap.id AND pca.is_active = 1
                 LIMIT 1) AS coordinator_profile_id,
                (SELECT p.full_name
                 FROM program_coordinator_assignments pca
                 JOIN profiles p ON p.id = pca.personnel_profile_id
                 WHERE pca.academic_program_id = ap.id AND pca.is_active = 1
                 LIMIT 1) AS coordinator_name,
                (SELECT p.email
                 FROM program_coordinator_assignments pca
                 JOIN profiles p ON p.id = pca.personnel_profile_id
                 WHERE pca.academic_program_id = ap.id AND pca.is_active = 1
                 LIMIT 1) AS coordinator_email
            ')
            ->where('ap.college_id', $id)
            ->orderBy('ap.code', 'ASC')
            ->get()
            ->getResultArray();

        $assignedCount = 0;
        foreach ($programs as &$p) {
            $p['has_coordinator'] = ! empty($p['coordinator_name']);
            if ($p['has_coordinator']) {
                $assignedCount++;
            }
        }
        unset($p);

        $programCount = count($programs);
        $unassignedCount = $programCount - $assignedCount;

        $row['programs'] = $programs;
        $row['summary'] = [
            'program_count'                => $programCount,
            'assigned_coordinators_count'  => $assignedCount,
            'unassigned_coordinators_count' => $unassignedCount,
        ];

        return $row;
    }

    /**
     * Atomically creates a College, optional branding logo, and optional nested Academic Programs.
     */
    public function createCollege(array $data, ?UploadedFile $logoFile = null): array
    {
        // 1. Pre-validation of College Identity
        $name = trim((string) ($data['name'] ?? ''));
        $code = strtoupper(trim((string) ($data['code'] ?? '')));
        $description = isset($data['description']) ? trim((string) $data['description']) : null;
        $badgeColor = isset($data['acronym_badge_color']) ? trim((string) $data['acronym_badge_color']) : null;

        if ($name === '') {
            throw new InvalidArgumentException('College name is required.');
        }
        if (mb_strlen($name) > 150) {
            throw new InvalidArgumentException('College name must not exceed 150 characters.');
        }

        if ($code === '') {
            throw new InvalidArgumentException('College code / acronym is required.');
        }
        if (mb_strlen($code) > 20) {
            throw new InvalidArgumentException('College code must not exceed 20 characters.');
        }

        // Check College code uniqueness
        $existingCode = $this->db->table('colleges')->where('code', $code)->countAllResults();
        if ($existingCode > 0) {
            throw new InvalidArgumentException("College code '{$code}' already exists.");
        }

        // Validate badge color
        if ($badgeColor !== null && $badgeColor !== '') {
            if (! preg_match('/^#[0-9A-Fa-f]{6}$/', $badgeColor)) {
                throw new InvalidArgumentException('Acronym badge color must be a valid 6-digit hex string (e.g. #16834A).');
            }
            $badgeColor = strtoupper($badgeColor);
        } else {
            $badgeColor = null;
        }

        // 2. Pre-validation of Nested Academic Programs
        $rawPrograms = $data['programs'] ?? [];
        if (is_string($rawPrograms)) {
            $decoded = json_decode($rawPrograms, true);
            if (is_array($decoded)) {
                $rawPrograms = $decoded;
            }
        }

        $validatedPrograms = [];
        $batchProgramCodes = [];

        if (is_array($rawPrograms) && count($rawPrograms) > 0) {
            foreach ($rawPrograms as $idx => $prog) {
                if (! is_array($prog)) {
                    continue;
                }
                $pCode = strtoupper(trim((string) ($prog['code'] ?? '')));
                $pName = trim((string) ($prog['name'] ?? ''));

                if ($pCode === '' && $pName === '') {
                    // Skip completely empty draft rows
                    continue;
                }

                if ($pCode === '') {
                    throw new InvalidArgumentException("Program #" . ($idx + 1) . ": Program code is required.");
                }
                if (mb_strlen($pCode) > 20) {
                    throw new InvalidArgumentException("Program #" . ($idx + 1) . ": Program code must not exceed 20 characters.");
                }
                if ($pName === '') {
                    throw new InvalidArgumentException("Program #" . ($idx + 1) . ": Program name is required.");
                }
                if (mb_strlen($pName) > 150) {
                    throw new InvalidArgumentException("Program #" . ($idx + 1) . ": Program name must not exceed 150 characters.");
                }

                if (in_array($pCode, $batchProgramCodes, true)) {
                    throw new InvalidArgumentException("Duplicate program code '{$pCode}' in submitted programs batch.");
                }
                $batchProgramCodes[] = $pCode;

                // Check conflict against existing academic programs
                $conflict = $this->db->table('academic_programs')->where('code', $pCode)->countAllResults();
                if ($conflict > 0) {
                    throw new InvalidArgumentException("Academic program code '{$pCode}' already exists in the university system.");
                }

                $validatedPrograms[] = [
                    'code' => $pCode,
                    'name' => $pName
                ];
            }
        }

        // 3. Pre-validation of Logo File
        $stagedLogoPath = null;
        $logoMetadata = null;

        if ($logoFile !== null && $logoFile->isValid()) {
            if ($logoFile->hasMoved()) {
                throw new InvalidArgumentException('Uploaded logo file has already been processed.');
            }
            if ($logoFile->getSize() > self::MAX_LOGO_SIZE_BYTES) {
                throw new InvalidArgumentException('Logo file size must not exceed 5 MB.');
            }

            $clientMime = $logoFile->getMimeType();
            $detectedMime = $this->detectMimeType($logoFile->getTempName());
            $effectiveMime = $detectedMime ?: $clientMime;

            if (! array_key_exists($effectiveMime, self::ALLOWED_MIME_TYPES)) {
                throw new InvalidArgumentException('Invalid image format. Allowed formats: JPEG, PNG, WebP.');
            }

            $ext = self::ALLOWED_MIME_TYPES[$effectiveMime];
            $logoMetadata = [
                'original_name' => pathinfo($logoFile->getClientName(), PATHINFO_BASENAME),
                'mime_type'     => $effectiveMime,
                'extension'     => $ext
            ];
        }

        // 4. Transactional Execution
        $collegeId = $this->genUuid();
        $this->db->transBegin();

        try {
            // Insert College record
            $this->db->table('colleges')->insert([
                'id'                  => $collegeId,
                'code'                => $code,
                'name'                => $name,
                'description'         => $description,
                'status'              => 'active',
                'acronym_badge_color' => $badgeColor,
                'created_at'          => date('Y-m-d H:i:s.u'),
                'updated_at'          => date('Y-m-d H:i:s.u'),
            ]);

            // Process and store Logo if present
            if ($logoMetadata !== null && $logoFile !== null) {
                $storageSubdir = 'colleges/' . $collegeId;
                $targetDir = $this->storageRoot . '/' . $storageSubdir;
                if (! is_dir($targetDir)) {
                    @mkdir($targetDir, 0755, true);
                }

                $filename = 'logo_' . $this->genUuid() . '.' . $logoMetadata['extension'];
                $logoFile->move($targetDir, $filename);
                $stagedLogoPath = $targetDir . '/' . $filename;
                $storageKey = $storageSubdir . '/' . $filename;

                $this->db->table('colleges')->where('id', $collegeId)->update([
                    'logo_storage_key'   => $storageKey,
                    'logo_original_name' => $logoMetadata['original_name'],
                    'logo_mime_type'     => $logoMetadata['mime_type'],
                    'logo_updated_at'    => date('Y-m-d H:i:s.u'),
                ]);
            }

            // Insert nested Academic Programs
            $createdPrograms = [];
            foreach ($validatedPrograms as $vp) {
                $progId = $this->genUuid();
                $this->db->table('academic_programs')->insert([
                    'id'           => $progId,
                    'college_id'   => $collegeId,
                    'code'         => $vp['code'],
                    'name'         => $vp['name'],
                    'degree_level' => 'undergraduate',
                    'status'       => 'active',
                    'created_at'   => date('Y-m-d H:i:s.u'),
                    'updated_at'   => date('Y-m-d H:i:s.u'),
                ]);
                $createdPrograms[] = [
                    'id'           => $progId,
                    'college_id'   => $collegeId,
                    'code'         => $vp['code'],
                    'name'         => $vp['name'],
                    'degree_level' => 'undergraduate',
                    'status'       => 'active'
                ];
            }

            if ($this->db->transStatus() === false) {
                $this->db->transRollback();
                if ($stagedLogoPath !== null && file_exists($stagedLogoPath)) {
                    @unlink($stagedLogoPath);
                }
                throw new RuntimeException('Database transaction status failed during College creation.');
            }

            $this->db->transCommit();
        } catch (Throwable $e) {
            $this->db->transRollback();
            if ($stagedLogoPath !== null && file_exists($stagedLogoPath)) {
                @unlink($stagedLogoPath);
            }
            throw $e;
        }

        return [
            'college'  => $this->getCollege($collegeId),
            'programs' => $createdPrograms
        ];
    }

    /**
     * Retrieves logo file path and mime for streaming.
     */
    public function getLogoPathAndMime(string $collegeId): ?array
    {
        $college = $this->db->table('colleges')
            ->select('logo_storage_key, logo_mime_type, logo_original_name')
            ->where('id', $collegeId)
            ->get()
            ->getRowArray();

        if (! $college || empty($college['logo_storage_key'])) {
            return null;
        }

        $fullPath = $this->storageRoot . '/' . $college['logo_storage_key'];
        if (! file_exists($fullPath) || ! is_readable($fullPath)) {
            return null;
        }

        return [
            'path'          => $fullPath,
            'mime_type'     => $college['logo_mime_type'] ?: 'image/jpeg',
            'original_name' => $college['logo_original_name'] ?: 'college_logo.png'
        ];
    }

    /**
     * Creates a single standalone Academic Program under an existing active College.
     */
    public function createProgram(array $data): array
    {
        $collegeId = trim((string) ($data['college_id'] ?? ''));
        $code = strtoupper(trim((string) ($data['code'] ?? '')));
        $name = trim((string) ($data['name'] ?? ''));
        $degreeLevel = isset($data['degree_level']) ? strtolower(trim((string) $data['degree_level'])) : 'undergraduate';

        if ($collegeId === '') {
            throw new InvalidArgumentException('College ID is required to create an Academic Program.');
        }

        // Validate College existence and active status
        $college = $this->db->table('colleges')->where('id', $collegeId)->get()->getRowArray();
        if (! $college) {
            throw new InvalidArgumentException('Selected College not found.');
        }
        if (($college['status'] ?? '') !== 'active') {
            throw new InvalidArgumentException('Academic Programs can only be created under active Colleges.');
        }

        if ($code === '') {
            throw new InvalidArgumentException('Program code is required.');
        }
        if (mb_strlen($code) > 20) {
            throw new InvalidArgumentException('Program code must not exceed 20 characters.');
        }

        if ($name === '') {
            throw new InvalidArgumentException('Program name is required.');
        }
        if (mb_strlen($name) > 150) {
            throw new InvalidArgumentException('Program name must not exceed 150 characters.');
        }

        // Check for duplicate program code
        $conflict = $this->db->table('academic_programs')->where('code', $code)->countAllResults();
        if ($conflict > 0) {
            throw new InvalidArgumentException("Academic program code '{$code}' already exists in the university system.");
        }

        // Validate degree level allowlist or default
        $allowedLevels = ['undergraduate', 'graduate', 'certificate', 'diploma'];
        if (! in_array($degreeLevel, $allowedLevels, true)) {
            $degreeLevel = 'undergraduate';
        }

        $programId = $this->genUuid();
        $this->db->table('academic_programs')->insert([
            'id'           => $programId,
            'college_id'   => $collegeId,
            'code'         => $code,
            'name'         => $name,
            'degree_level' => $degreeLevel,
            'status'       => 'active',
            'created_at'   => date('Y-m-d H:i:s'),
            'updated_at'   => date('Y-m-d H:i:s'),
        ]);

        return [
            'id'           => $programId,
            'college_id'   => $collegeId,
            'college_code' => $college['code'],
            'college_name' => $college['name'],
            'code'         => $code,
            'name'         => $name,
            'degree_level' => $degreeLevel,
            'status'       => 'active',
        ];
    }

    /**
     * Updates Academic Program master data (name, degree_level, status, and optionally code).
     * Strictly decouples coordinator coverage (coordinator fields are never mutated from program edit).
     */
    public function updateProgram(string $programId, array $data): array
    {
        $existing = $this->db->table('academic_programs')->where('id', $programId)->get()->getRowArray();
        if (! $existing) {
            throw new InvalidArgumentException('Academic program not found.');
        }

        $updates = [];

        if (isset($data['name'])) {
            $name = trim((string) $data['name']);
            if ($name === '') {
                throw new InvalidArgumentException('Program name cannot be empty.');
            }
            if (mb_strlen($name) > 150) {
                throw new InvalidArgumentException('Program name must not exceed 150 characters.');
            }
            $updates['name'] = $name;
        }

        if (isset($data['code'])) {
            $code = strtoupper(trim((string) $data['code']));
            if ($code === '') {
                throw new InvalidArgumentException('Program code cannot be empty.');
            }
            if (mb_strlen($code) > 20) {
                throw new InvalidArgumentException('Program code must not exceed 20 characters.');
            }
            if ($code !== $existing['code']) {
                $conflict = $this->db->table('academic_programs')
                    ->where('code', $code)
                    ->where('id !=', $programId)
                    ->countAllResults();
                if ($conflict > 0) {
                    throw new InvalidArgumentException("Academic program code '{$code}' is already in use.");
                }
                $updates['code'] = $code;
            }
        }

        if (isset($data['degree_level'])) {
            $degreeLevel = strtolower(trim((string) $data['degree_level']));
            $allowedLevels = ['undergraduate', 'graduate', 'certificate', 'diploma'];
            if (! in_array($degreeLevel, $allowedLevels, true)) {
                throw new InvalidArgumentException('Invalid degree level. Allowed: ' . implode(', ', $allowedLevels));
            }
            $updates['degree_level'] = $degreeLevel;
        }

        if (isset($data['status'])) {
            $status = strtolower(trim((string) $data['status']));
            $allowedStatus = ['active', 'inactive', 'archived'];
            if (! in_array($status, $allowedStatus, true)) {
                throw new InvalidArgumentException('Invalid program status. Allowed: ' . implode(', ', $allowedStatus));
            }
            $updates['status'] = $status;
        }

        if (! empty($updates)) {
            $updates['updated_at'] = date('Y-m-d H:i:s');
            $this->db->table('academic_programs')->where('id', $programId)->update($updates);
        }

        $row = $this->db->table('academic_programs ap')
            ->select('
                ap.id,
                ap.college_id,
                c.code AS college_code,
                c.name AS college_name,
                c.acronym_badge_color,
                ap.code,
                ap.name,
                ap.degree_level,
                ap.status,
                (SELECT p.full_name
                 FROM program_coordinator_assignments pca
                 JOIN profiles p ON p.id = pca.personnel_profile_id
                 WHERE pca.academic_program_id = ap.id AND pca.is_active = 1
                 LIMIT 1) AS coordinator_name
            ')
            ->join('colleges c', 'c.id = ap.college_id', 'left')
            ->where('ap.id', $programId)
            ->get()
            ->getRowArray();

        return $row;
    }

    /**
     * Atomically reassigns an Academic Program\'s coordinator coverage from an existing coordinator
     * to a new eligible personnel member, preserving historical tenure.
     */
    public function reassignCoordinator(string $collegeId, string $programId, string $newCoordinatorProfileId, ?string $actorProfileId = null): array
    {
        $college = $this->db->table('colleges')->where('id', $collegeId)->get()->getRowArray();
        if (! $college) {
            throw new InvalidArgumentException('College not found.');
        }

        $program = $this->db->table('academic_programs')->where('id', $programId)->get()->getRowArray();
        if (! $program) {
            throw new InvalidArgumentException('Academic program not found.');
        }
        if ($program['college_id'] !== $collegeId) {
            throw new InvalidArgumentException("Program '{$program['code']}' does not belong to the specified College.");
        }
        if ($program['status'] !== 'active') {
            throw new InvalidArgumentException("Cannot reassign coordinator for inactive program '{$program['code']}'.");
        }

        $newPersonnel = $this->db->table('profiles')->where('id', $newCoordinatorProfileId)->get()->getRowArray();
        if (! $newPersonnel || ($newPersonnel['status'] ?? '') !== 'active') {
            throw new InvalidArgumentException('Replacement coordinator personnel profile is not active.');
        }

        // Validate HR program affiliation
        $affiliation = $this->db->table('personnel_program_affiliations')
            ->where('personnel_profile_id', $newCoordinatorProfileId)
            ->where('academic_program_id', $programId)
            ->where('is_active', 1)
            ->get()
            ->getRowArray();
        if (! $affiliation) {
            throw new InvalidArgumentException("Replacement personnel has no active HR affiliation with program '{$program['code']}'.");
        }

        // Check current active coordinator
        $currentAssignment = $this->db->table('program_coordinator_assignments pca')
            ->select('pca.id, pca.personnel_profile_id, p.full_name')
            ->join('profiles p', 'p.id = pca.personnel_profile_id', 'inner')
            ->where('pca.academic_program_id', $programId)
            ->where('pca.is_active', 1)
            ->get()
            ->getRowArray();

        if ($currentAssignment && $currentAssignment['personnel_profile_id'] === $newCoordinatorProfileId) {
            return [
                'message'          => 'Personnel is already the active coordinator for this program.',
                'program_id'       => $programId,
                'program_code'     => $program['code'],
                'coordinator_name' => $newPersonnel['full_name'],
                'reassigned'       => false,
            ];
        }

        $this->db->transStart();

        // Soft-deactivate existing assignment
        if ($currentAssignment) {
            $this->db->table('program_coordinator_assignments')
                ->where('id', $currentAssignment['id'])
                ->update([
                    'is_active'       => 0,
                    'effective_until' => date('Y-m-d'),
                    'updated_at'      => date('Y-m-d H:i:s'),
                ]);
        }

        // Insert new assignment
        $newAssignmentId = $this->genUuid();
        $this->db->table('program_coordinator_assignments')->insert([
            'id'                   => $newAssignmentId,
            'personnel_profile_id' => $newCoordinatorProfileId,
            'academic_program_id'  => $programId,
            'effective_from'       => date('Y-m-d'),
            'effective_until'      => null,
            'is_active'            => 1,
            'assigned_by'          => $actorProfileId,
            'assigned_at'          => date('Y-m-d H:i:s'),
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        $this->db->transComplete();

        if ($this->db->transStatus() === false) {
            throw new \RuntimeException('Database transaction failed during coordinator reassignment.');
        }

        return [
            'message'              => 'Program Coordinator reassigned successfully.',
            'program_id'           => $programId,
            'program_code'         => $program['code'],
            'previous_coordinator' => $currentAssignment['full_name'] ?? 'Unassigned',
            'new_coordinator'      => $newPersonnel['full_name'],
            'new_assignment_id'    => $newAssignmentId,
            'reassigned'           => true,
        ];
    }

    /**
     * Lists academic programs optionally filtered by College ID.
     */
    public function listPrograms(?string $collegeId = null): array
    {
        $builder = $this->db->table('academic_programs ap')
            ->select('
                ap.id,
                ap.college_id,
                c.code AS college_code,
                c.name AS college_name,
                c.acronym_badge_color,
                ap.code,
                ap.name,
                ap.degree_level,
                ap.status,
                (SELECT p.full_name
                 FROM program_coordinator_assignments pca
                 JOIN profiles p ON p.id = pca.personnel_profile_id
                 WHERE pca.academic_program_id = ap.id AND pca.is_active = 1
                 LIMIT 1) AS coordinator_name
            ')
            ->join('colleges c', 'c.id = ap.college_id', 'left')
            ->orderBy('c.code', 'ASC')
            ->orderBy('ap.code', 'ASC');

        if ($collegeId !== null && $collegeId !== '' && $collegeId !== 'all') {
            $builder->where('ap.college_id', $collegeId);
        }

        return $builder->get()->getResultArray();
    }

    /**
     * Lists personnel eligible for Program Coordinator assignment under a College.
     * Eligible personnel must have at least one active HR affiliation (personnel_program_affiliations)
     * to an Academic Program in this College.
     */
    public function listCoordinatorPersonnel(string $collegeId): array
    {
        $college = $this->db->table('colleges')->where('id', $collegeId)->get()->getRowArray();
        if (! $college) {
            throw new InvalidArgumentException('College not found.');
        }

        // Get distinct personnel with active HR affiliation to programs in this college
        $personnelRows = $this->db->table('profiles p')
            ->select('DISTINCT p.id, p.full_name, p.email, p.designation_title AS designation, p.status', false)
            ->join('personnel_program_affiliations ppa', 'ppa.personnel_profile_id = p.id', 'inner')
            ->join('academic_programs ap', 'ap.id = ppa.academic_program_id', 'inner')
            ->where('ap.college_id', $collegeId)
            ->where('ppa.is_active', 1)
            ->where('p.status', 'active')
            ->orderBy('p.full_name', 'ASC')
            ->get()
            ->getResultArray();

        $result = [];
        foreach ($personnelRows as $p) {
            $profileId = $p['id'];

            // Eligible programs under this college
            $eligiblePrograms = $this->db->table('academic_programs ap')
                ->select('ap.id, ap.code, ap.name')
                ->join('personnel_program_affiliations ppa', 'ppa.academic_program_id = ap.id', 'inner')
                ->where('ppa.personnel_profile_id', $profileId)
                ->where('ap.college_id', $collegeId)
                ->where('ppa.is_active', 1)
                ->orderBy('ap.code', 'ASC')
                ->get()
                ->getResultArray();

            // Currently assigned coordinator programs under this college
            $assignedPrograms = $this->db->table('academic_programs ap')
                ->select('ap.id, ap.code, ap.name, pca.id AS assignment_id, pca.assigned_at')
                ->join('program_coordinator_assignments pca', 'pca.academic_program_id = ap.id', 'inner')
                ->where('pca.personnel_profile_id', $profileId)
                ->where('ap.college_id', $collegeId)
                ->where('pca.is_active', 1)
                ->orderBy('ap.code', 'ASC')
                ->get()
                ->getResultArray();

            $assignedCodes = array_column($assignedPrograms, 'code');

            $result[] = [
                'profile_id'                          => $profileId,
                'name'                                => $p['full_name'],
                'email'                               => $p['email'],
                'designation'                         => $p['designation'] ?: 'Faculty Personnel',
                'status'                              => $p['status'],
                'eligible_program_count'              => count($eligiblePrograms),
                'eligible_programs'                   => $eligiblePrograms,
                'current_coordinator_assignment_count' => count($assignedPrograms),
                'assigned_programs'                   => $assignedPrograms,
                'assigned_program_codes'              => $assignedCodes,
            ];
        }

        return [
            'college'   => [
                'id'                  => $college['id'],
                'code'                => $college['code'],
                'name'                => $college['name'],
                'acronym_badge_color' => $college['acronym_badge_color'],
            ],
            'personnel' => $result,
        ];
    }

    /**
     * Retrieves one personnel member's assignment context for a specific College.
     */
    public function getPersonnelCoordinatorContext(string $collegeId, string $profileId): array
    {
        $college = $this->db->table('colleges')->where('id', $collegeId)->get()->getRowArray();
        if (! $college) {
            throw new InvalidArgumentException('College not found.');
        }

        $personnel = $this->db->table('profiles')->where('id', $profileId)->get()->getRowArray();
        if (! $personnel) {
            throw new InvalidArgumentException('Personnel not found.');
        }

        // Fetch all eligible programs under this college via HR affiliation
        $eligiblePrograms = $this->db->table('academic_programs ap')
            ->select('ap.id, ap.code, ap.name')
            ->join('personnel_program_affiliations ppa', 'ppa.academic_program_id = ap.id', 'inner')
            ->where('ppa.personnel_profile_id', $profileId)
            ->where('ap.college_id', $collegeId)
            ->where('ppa.is_active', 1)
            ->orderBy('ap.code', 'ASC')
            ->get()
            ->getResultArray();

        // Fetch active coordinator assignments for this personnel under this college
        $activeAssignments = $this->db->table('program_coordinator_assignments pca')
            ->select('pca.id AS assignment_id, pca.academic_program_id')
            ->join('academic_programs ap', 'ap.id = pca.academic_program_id', 'inner')
            ->where('pca.personnel_profile_id', $profileId)
            ->where('ap.college_id', $collegeId)
            ->where('pca.is_active', 1)
            ->get()
            ->getResultArray();

        $activeMap = [];
        foreach ($activeAssignments as $a) {
            $activeMap[$a['academic_program_id']] = $a['assignment_id'];
        }

        $formattedPrograms = [];
        $selectedCount = 0;
        foreach ($eligiblePrograms as $ep) {
            $progId = $ep['id'];
            $isAssigned = isset($activeMap[$progId]);
            if ($isAssigned) {
                $selectedCount++;
            }

            // Check if someone else is active coordinator
            $otherCoord = null;
            if (! $isAssigned) {
                $other = $this->db->table('program_coordinator_assignments pca')
                    ->select('p.full_name')
                    ->join('profiles p', 'p.id = pca.personnel_profile_id', 'inner')
                    ->where('pca.academic_program_id', $progId)
                    ->where('pca.personnel_profile_id !=', $profileId)
                    ->where('pca.is_active', 1)
                    ->get()
                    ->getRowArray();
                if ($other) {
                    $otherCoord = $other['full_name'];
                }
            }

            $formattedPrograms[] = [
                'program_id'         => $progId,
                'program_code'       => $ep['code'],
                'program_name'       => $ep['name'],
                'currently_assigned' => $isAssigned,
                'assignment_id'      => $activeMap[$progId] ?? null,
                'other_coordinator'  => $otherCoord,
            ];
        }

        return [
            'personnel' => [
                'profile_id'  => $personnel['id'],
                'name'        => $personnel['full_name'],
                'email'       => $personnel['email'],
                'designation' => $personnel['designation_title'] ?: 'Faculty Personnel',
            ],
            'college' => [
                'id'                  => $college['id'],
                'code'                => $college['code'],
                'name'                => $college['name'],
                'acronym_badge_color' => $college['acronym_badge_color'],
            ],
            'eligible_programs' => $formattedPrograms,
            'selected_count'    => $selectedCount,
        ];
    }

    /**
     * Atomically updates a personnel member's active coordinator assignments across multiple Academic Programs
     * within a College using a diff-based transaction.
     */
    public function updatePersonnelCoordinatorAssignments(string $collegeId, string $profileId, array $submittedProgramIds, ?string $actorProfileId = null): array
    {
        $college = $this->db->table('colleges')->where('id', $collegeId)->get()->getRowArray();
        if (! $college) {
            throw new InvalidArgumentException('College not found.');
        }

        $personnel = $this->db->table('profiles')->where('id', $profileId)->get()->getRowArray();
        if (! $personnel) {
            throw new InvalidArgumentException('Personnel not found.');
        }
        if (($personnel['status'] ?? '') !== 'active') {
            throw new InvalidArgumentException('Cannot assign coordinator roles to an inactive personnel profile.');
        }

        // Deduplicate submitted IDs
        $submittedProgramIds = array_values(array_unique(array_filter($submittedProgramIds)));

        // Step 1: Validate every submitted program belongs to the selected College
        foreach ($submittedProgramIds as $progId) {
            $prog = $this->db->table('academic_programs')->where('id', $progId)->get()->getRowArray();
            if (! $prog) {
                throw new InvalidArgumentException("Academic program ID '{$progId}' not found.");
            }
            if ($prog['college_id'] !== $collegeId) {
                throw new InvalidArgumentException("The submitted Academic Program '{$prog['code']}' does not belong to the selected College.");
            }

            // Step 2: Validate HR personnel-program affiliation
            $affiliation = $this->db->table('personnel_program_affiliations')
                ->where('personnel_profile_id', $profileId)
                ->where('academic_program_id', $progId)
                ->where('is_active', 1)
                ->get()
                ->getRowArray();

            if (! $affiliation) {
                throw new InvalidArgumentException("The selected personnel has no active HR affiliation with program '{$prog['code']}'.");
            }
        }

        // Step 3: Fetch current active coordinator assignments for this personnel under this college
        $currentRows = $this->db->table('program_coordinator_assignments pca')
            ->select('pca.id, pca.academic_program_id')
            ->join('academic_programs ap', 'ap.id = pca.academic_program_id', 'inner')
            ->where('pca.personnel_profile_id', $profileId)
            ->where('ap.college_id', $collegeId)
            ->where('pca.is_active', 1)
            ->get()
            ->getResultArray();

        $currentProgramIds = array_column($currentRows, 'academic_program_id');

        // Step 4: Compute Diff
        $toKeep = array_values(array_intersect($currentProgramIds, $submittedProgramIds));
        $toAdd = array_values(array_diff($submittedProgramIds, $currentProgramIds));
        $toRemove = array_values(array_diff($currentProgramIds, $submittedProgramIds));

        // Step 5: Check conflicts for toAdd
        foreach ($toAdd as $progIdToAdd) {
            $conflict = $this->db->table('program_coordinator_assignments pca')
                ->select('pca.id, p.full_name, ap.code')
                ->join('profiles p', 'p.id = pca.personnel_profile_id', 'inner')
                ->join('academic_programs ap', 'ap.id = pca.academic_program_id', 'inner')
                ->where('pca.academic_program_id', $progIdToAdd)
                ->where('pca.personnel_profile_id !=', $profileId)
                ->where('pca.is_active', 1)
                ->get()
                ->getRowArray();

            if ($conflict) {
                throw new InvalidArgumentException("Academic Program '{$conflict['code']}' already has an active Program Coordinator ({$conflict['full_name']}).");
            }
        }

        // Step 6: Execute Transactional Diff
        $this->db->transStart();

        // 6a. Deactivate removed assignments
        foreach ($toRemove as $progIdToRemove) {
            $this->db->table('program_coordinator_assignments')
                ->where('personnel_profile_id', $profileId)
                ->where('academic_program_id', $progIdToRemove)
                ->where('is_active', 1)
                ->update([
                    'is_active'        => 0,
                    'effective_until'  => date('Y-m-d'),
                    'updated_at'       => date('Y-m-d H:i:s'),
                ]);
        }

        // 6b. Insert added assignments
        foreach ($toAdd as $progIdToAdd) {
            $newId = $this->genUuid();
            $this->db->table('program_coordinator_assignments')->insert([
                'id'                   => $newId,
                'personnel_profile_id' => $profileId,
                'academic_program_id'  => $progIdToAdd,
                'effective_from'       => date('Y-m-d'),
                'effective_until'      => null,
                'is_active'            => 1,
                'assigned_by'          => $actorProfileId,
                'assigned_at'          => date('Y-m-d H:i:s'),
                'created_at'           => date('Y-m-d H:i:s'),
                'updated_at'           => date('Y-m-d H:i:s'),
            ]);
        }

        $this->db->transComplete();

        if ($this->db->transStatus() === false) {
            throw new \RuntimeException('Failed to atomically update Program Coordinator assignments.');
        }

        return [
            'message'   => 'Program Coordinator assignments updated successfully.',
            'diff'      => [
                'kept'    => $toKeep,
                'added'   => $toAdd,
                'removed' => $toRemove,
            ],
            'context'   => $this->getPersonnelCoordinatorContext($collegeId, $profileId),
        ];
    }

    protected function detectMimeType(string $path): ?string
    {
        if (! function_exists('finfo_open')) {
            return null;
        }
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if (! $finfo) {
            return null;
        }
        $mime = finfo_file($finfo, $path);
        finfo_close($finfo);
        return $mime ?: null;
    }
}
