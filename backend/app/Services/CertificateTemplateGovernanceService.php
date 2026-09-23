<?php

namespace App\Services;

use App\Domain\Certificates\CertificateDomain;
use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

final class CertificateTemplateGovernanceService
{
    private const DB_PUBLISHED = 'active';
    private const DB_DRAFT = 'draft';
    private const DB_SUPERSEDED = 'deprecated';
    private const LAYOUT_VALUES = [
        'page_size' => ['A4', 'LETTER'],
        'orientation' => ['landscape', 'portrait'],
        'alignment' => ['left', 'center'],
        'theme_id' => ['emerald_gold', 'royal_navy', 'classic_black'],
        'border_style' => ['classic_ornate', 'modern_geometric', 'minimalist'],
        'logo_placement' => ['top_center', 'top_left'],
        'signature_layout' => ['single_row', 'stacked'],
        'qr_placement' => ['bottom_right', 'footer'],
    ];
    private const SIGNATORY_ROLES = [
        'OSAD_DIRECTOR' => 'OSAD Director',
        'ORGANIZATION_MODERATOR' => 'Organization Moderator',
        'DEAN' => 'Dean',
        'OTHER_APPROVED_ROLE' => 'Other approved role',
    ];

    public function __construct(
        private ?BaseConnection $db = null,
        private ?CertificateTemplateContractService $contracts = null,
        private ?CertificateIdentityService $identity = null,
    ) {
        $this->db ??= db_connect();
        $this->contracts ??= new CertificateTemplateContractService();
        $this->identity ??= new CertificateIdentityService();
    }

    public function placeholderRegistry(): array
    {
        $labels = [
            'recipient_name' => 'Recipient name', 'activity_title' => 'Activity title', 'activity_type' => 'Activity type',
            'activity_date' => 'Activity date', 'date_range' => 'Date range', 'organizer_name' => 'Organizer',
            'student_role' => 'Student role', 'contribution_role' => 'Contribution role',
            'recognition_title' => 'Recognition title', 'placement' => 'Placement', 'scope' => 'Scope',
            'granting_body' => 'Granting body', 'issuer_name' => 'Issuer', 'issued_date' => 'Issued date',
            'certificate_number' => 'Certificate number', 'verification_url' => 'Verification URL',
        ];
        $purposeHints = [
            'contribution_role' => [CertificateDomain::PURPOSE_APPRECIATION],
            'student_role' => [CertificateDomain::PURPOSE_PARTICIPATION, CertificateDomain::PURPOSE_APPRECIATION],
            'recognition_title' => [CertificateDomain::PURPOSE_RECOGNITION],
            'placement' => [CertificateDomain::PURPOSE_RECOGNITION],
            'scope' => [CertificateDomain::PURPOSE_RECOGNITION],
            'granting_body' => [CertificateDomain::PURPOSE_RECOGNITION],
        ];
        return array_map(static fn (string $code) => [
            'code' => $code,
            'label' => $labels[$code] ?? ucwords(str_replace('_', ' ', $code)),
            'requirement_type' => in_array($code, ['issued_date', 'certificate_number', 'verification_url'], true) ? 'RESOLVED_AT_ISSUANCE' : 'OPTIONAL',
            'supported_purposes' => $purposeHints[$code] ?? CertificateDomain::PURPOSES,
            'description' => 'Governed certificate field: ' . ($labels[$code] ?? $code) . '.',
            'token' => '{{' . $code . '}}',
        ], CertificateTemplateContractService::PLACEHOLDERS);
    }

    public function signatoryRoleRegistry(): array
    {
        return array_map(static fn (string $code, string $label) => ['code' => $code, 'label' => $label], array_keys(self::SIGNATORY_ROLES), self::SIGNATORY_ROLES);
    }

    public function listFamilies(): array
    {
        $families = $this->db->table('certificate_template_families')->orderBy('certificate_purpose')->get()->getResultArray();
        return array_map(fn (array $family) => $this->familyReadModel($family, $this->versions((string) $family['id'])), $families);
    }

    public function getFamily(string $familyId): ?array
    {
        $family = $this->db->table('certificate_template_families')->where('id', $familyId)->get()->getRowArray();
        return $family ? $this->familyReadModel($family, $this->versions($familyId)) : null;
    }

    public function getVersion(string $versionId): ?array
    {
        $row = $this->versionRow($versionId);
        return $row ? $this->versionReadModel($row) : null;
    }

    public function createFamily(array $payload, string $actorId): array
    {
        $purpose = strtoupper(trim((string) ($payload['certificate_purpose'] ?? '')));
        $name = trim((string) ($payload['name'] ?? ''));
        $code = strtoupper(trim((string) ($payload['code'] ?? $purpose)));
        if (! in_array($purpose, CertificateDomain::PURPOSES, true) || $name === '' || $code === '') {
            throw new InvalidArgumentException('VALIDATION_FAILED: Name, code, and an approved certificate purpose are required.');
        }
        if ($this->db->table('certificate_template_families')->groupStart()->where('code', $code)->orWhere('certificate_purpose', $purpose)->groupEnd()->countAllResults() > 0) {
            throw new RuntimeException('TEMPLATE_FAMILY_ALREADY_EXISTS');
        }
        $now = date('Y-m-d H:i:s');
        $familyId = $this->identity->uuid();
        $this->db->transBegin();
        try {
            $this->write($this->db->table('certificate_template_families')->insert([
                'id' => $familyId, 'code' => $code, 'name' => $name,
                'description' => trim((string) ($payload['description'] ?? '')) ?: null,
                'category' => 'student', 'status' => 'active', 'certificate_purpose' => $purpose,
                'variant_code' => 'default', 'supported_capabilities' => json_encode(['readiness', 'issuance', 'public_verification']),
                'is_default' => 1, 'created_at' => $now, 'updated_at' => $now,
            ]));
            $this->audit($actorId, 'TEMPLATE_FAMILY_CREATED', 'certificate_template_family', $familyId, ['purpose' => $purpose, 'code' => $code]);
            $draft = $this->createDraftInternal($familyId, [], $actorId, null);
            $this->commit();
            return ['family' => $this->getFamily($familyId), 'draft' => $draft];
        } catch (Throwable $exception) {
            $this->db->transRollback();
            throw $exception;
        }
    }

    public function createDraft(string $familyId, array $payload, string $actorId): array
    {
        $this->db->transBegin();
        try {
            $draft = $this->createDraftInternal($familyId, $payload, $actorId, isset($payload['source_version_id']) ? (string) $payload['source_version_id'] : null);
            $this->commit();
            return $draft;
        } catch (Throwable $exception) {
            $this->db->transRollback();
            throw $exception;
        }
    }

    public function updateDraft(string $versionId, array $payload, string $actorId): array
    {
        $this->db->transBegin();
        try {
            $row = $this->requireDraft($versionId);
            $currentToken = $this->concurrencyToken($row);
            if (! hash_equals($currentToken, (string) ($payload['expected_token'] ?? ''))) {
                throw new RuntimeException('STALE_DRAFT');
            }
            $document = $this->documentFromPayload($payload, $this->decodeDocument($row));
            $governance = $document['governance'];
            $governance['updated_by'] = $actorId;
            $governance['updated_at'] = date('c');
            $governance['change_summary'] = trim((string) ($payload['change_summary'] ?? $governance['change_summary'] ?? 'Draft updated'));
            $governance['validation'] = ['status' => 'NOT_RUN', 'issues' => [], 'validated_at' => null, 'validated_by' => null];
            $document['governance'] = $governance;
            $this->write($this->db->table('certificate_template_versions')->where('id', $versionId)->where('status', self::DB_DRAFT)->update($this->versionPersistence($document)));
            $this->syncAssetBindings($versionId, $document['asset_bindings'] ?? []);
            $this->audit($actorId, 'TEMPLATE_DRAFT_UPDATED', 'certificate_template_version', $versionId, ['version_number' => $row['version_number']]);
            $this->commit();
            return $this->getVersion($versionId) ?? throw new RuntimeException('TEMPLATE_VERSION_NOT_FOUND');
        } catch (Throwable $exception) {
            $this->db->transRollback();
            throw $exception;
        }
    }

    public function validateDraft(string $versionId, string $actorId, ?string $expectedToken = null): array
    {
        $this->db->transBegin();
        try {
            $row = $this->requireDraft($versionId, true);
            $this->assertExpectedToken($row, $expectedToken);
            $document = $this->decodeDocument($row);
            $issues = $this->validateDocument($document, (string) $row['certificate_purpose']);
            $document['governance']['validation'] = [
                'status' => $issues === [] ? 'PASS' : 'FAIL', 'issues' => $issues,
                'validated_at' => date('c'), 'validated_by' => $actorId,
            ];
            $this->write($this->db->table('certificate_template_versions')->where('id', $versionId)->where('status', self::DB_DRAFT)->update($this->versionPersistence($document)));
            $this->audit($actorId, 'TEMPLATE_VALIDATED', 'certificate_template_version', $versionId, ['status' => $issues === [] ? 'PASS' : 'FAIL', 'issue_codes' => array_column($issues, 'code')]);
            $this->commit();
            return ['valid' => $issues === [], 'issues' => $issues, 'version' => $this->getVersion($versionId)];
        } catch (Throwable $exception) {
            $this->db->transRollback();
            throw $exception;
        }
    }

    public function publishDraft(string $versionId, string $actorId, ?string $expectedToken = null): array
    {
        $this->db->transBegin();
        try {
            $row = $this->versionRow($versionId, true);
            if (! $row || $row['status'] !== self::DB_DRAFT) {
                throw new RuntimeException($row ? 'PUBLISHED_VERSION_IMMUTABLE' : 'TEMPLATE_VERSION_NOT_FOUND');
            }
            $this->assertExpectedToken($row, $expectedToken);
            $document = $this->decodeDocument($row);
            if (($document['governance']['validation']['status'] ?? 'NOT_RUN') !== 'PASS') {
                throw new RuntimeException('DRAFT_VALIDATION_REQUIRED');
            }
            $issues = $this->validateDocument($document, (string) $row['certificate_purpose']);
            if ($issues !== []) {
                throw new InvalidArgumentException('PUBLICATION_VALIDATION_FAILED:' . json_encode($issues, JSON_UNESCAPED_SLASHES));
            }
            $previous = $this->db->table('certificate_template_versions')->where(['family_id' => $row['family_id'], 'status' => self::DB_PUBLISHED])->get()->getResultArray();
            foreach ($previous as $published) {
                $this->write($this->db->table('certificate_template_versions')->where('id', $published['id'])->update(['status' => self::DB_SUPERSEDED]));
                $this->audit($actorId, 'TEMPLATE_VERSION_SUPERSEDED', 'certificate_template_version', (string) $published['id'], ['superseded_by' => $versionId]);
            }
            $now = date('c');
            $document['governance']['semantic_status'] = CertificateDomain::TEMPLATE_PUBLISHED;
            $document['governance']['publisher_profile_id'] = $actorId;
            $document['governance']['published_at'] = $now;
            $document['governance']['immutable'] = true;
            $document['governance']['validation'] = ['status' => 'PASS', 'issues' => [], 'validated_at' => $now, 'validated_by' => $actorId];
            $this->write($this->db->table('certificate_template_versions')->where('id', $versionId)->where('status', self::DB_DRAFT)->update($this->versionPersistence($document) + ['status' => self::DB_PUBLISHED]));
            $this->write($this->db->table('certificate_template_families')->where('id', $row['family_id'])->update(['status' => 'active', 'is_default' => 1]));
            $this->audit($actorId, 'TEMPLATE_PUBLISHED', 'certificate_template_version', $versionId, ['family_id' => $row['family_id'], 'purpose' => $row['certificate_purpose'], 'version_number' => $row['version_number'], 'design_schema_version' => $document['schema_version'] ?? 2, 'renderer_version' => $document['renderer_version'] ?? 'legacy', 'asset_version_ids' => array_values($document['asset_bindings'] ?? [])]);
            $this->commit();
            return $this->getVersion($versionId) ?? throw new RuntimeException('TEMPLATE_VERSION_NOT_FOUND');
        } catch (Throwable $exception) {
            $this->db->transRollback();
            throw $exception;
        }
    }

    public function validateDocument(array $document, string $purpose): array
    {
        $issues = [];
        if (! in_array($purpose, CertificateDomain::PURPOSES, true)) {
            $issues[] = $this->issue('INVALID_PURPOSE', 'certificate_purpose', 'Select an approved certificate purpose.');
        }
        $content = $document['content_schema'] ?? [];
        foreach (['heading', 'recipient_lead_in', 'body', 'footer_note'] as $field) {
            if (trim((string) ($content[$field] ?? '')) === '') {
                $issues[] = $this->issue('CONTENT_REQUIRED', 'content_schema.' . $field, ucwords(str_replace('_', ' ', $field)) . ' is required.');
            }
        }
        $contentText = implode("\n", array_map('strval', $content));
        try {
            $used = $this->contracts->validatePublication($contentText);
        } catch (InvalidArgumentException $exception) {
            $issues[] = $this->issue('UNKNOWN_PLACEHOLDER', 'content_schema.body', $exception->getMessage());
            $used = $this->contracts->extract($contentText);
        }
        $contract = $document['placeholder_contract'] ?? [];
        $declared = [];
        foreach ($contract as $index => $item) {
            $name = (string) ($item['name'] ?? '');
            $type = strtoupper((string) ($item['requirement_type'] ?? ''));
            if (! in_array($name, CertificateTemplateContractService::PLACEHOLDERS, true) || ! in_array($type, ['REQUIRED', 'CONDITIONAL', 'OPTIONAL', 'RESOLVED_AT_ISSUANCE'], true)) {
                $issues[] = $this->issue('INVALID_PLACEHOLDER_CONTRACT', 'placeholder_contract.' . $index, 'Placeholder contract entries must use governed fields and requirement types.');
            }
            $declared[] = $name;
        }
        foreach ($used as $name) {
            if (! in_array($name, $declared, true)) {
                $issues[] = $this->issue('UNDECLARED_PLACEHOLDER', 'placeholder_contract', "Declare the {{$name}} placeholder before publication.");
            }
        }
        foreach (['recipient_name', 'activity_title', 'issuer_name', 'issued_date', 'certificate_number', 'verification_url'] as $required) {
            $position = array_search($required, $declared, true);
            $entry = $position === false ? null : ($contract[$position] ?? null);
            if (! $entry || ! in_array(strtoupper((string) ($entry['requirement_type'] ?? '')), ['REQUIRED', 'RESOLVED_AT_ISSUANCE'], true)) {
                $issues[] = $this->issue('REQUIRED_PLACEHOLDER_CONTRACT_MISSING', 'placeholder_contract', "{{$required}} must be governed as required or resolved at issuance.");
            }
        }
        $layout = $document['layout_schema'] ?? [];
        foreach (self::LAYOUT_VALUES as $field => $allowed) {
            if (! in_array((string) ($layout[$field] ?? ''), $allowed, true)) {
                $issues[] = $this->issue('INVALID_LAYOUT', 'layout_schema.' . $field, 'Choose a supported ' . str_replace('_', ' ', $field) . '.');
            }
        }
        $seenRoles = [];
        foreach (($document['signatory_slots'] ?? []) as $index => $slot) {
            $role = strtoupper((string) ($slot['role_code'] ?? ''));
            $requirement = strtoupper((string) ($slot['requirement_type'] ?? ''));
            if (! isset(self::SIGNATORY_ROLES[$role]) || ! in_array($requirement, ['REQUIRED', 'OPTIONAL'], true) || ! is_bool($slot['signature_required'] ?? null) || (int) ($slot['display_order'] ?? 0) < 1 || in_array($role, $seenRoles, true)) {
                $issues[] = $this->issue('INVALID_SIGNATORY_SLOT', 'signatory_slots.' . $index, 'Use one approved role per slot with a requirement, signature flag, and positive display order.');
            }
            $seenRoles[] = $role;
        }
        foreach (($document['asset_bindings'] ?? []) as $role => $assetVersionId) {
            if (! preg_match('/^[a-z][a-z0-9_]{1,63}$/', (string) $role) || trim((string) $assetVersionId) === '') {
                $issues[] = $this->issue('ASSET_NOT_FOUND', 'asset_bindings.' . $role, 'Choose a valid governed asset version.');
                continue;
            }
            if (! $this->db->tableExists('certificate_asset_versions')) {
                $issues[] = $this->issue('ASSET_NOT_FOUND', 'asset_bindings.' . $role, 'Certificate asset governance is not installed.');
                continue;
            }
            $asset = $this->db->table('certificate_asset_versions v')->select('v.renderer_compatible,a.status,a.asset_type,v.metadata_json')->join('certificate_assets a', 'a.id=v.asset_id')->where('v.id', $assetVersionId)->get()->getRowArray();
            if (! $asset) $issues[] = $this->issue('ASSET_NOT_FOUND', 'asset_bindings.' . $role, 'The selected governed asset version is unavailable.');
            elseif ($asset['status'] !== 'ACTIVE') $issues[] = $this->issue('ASSET_ARCHIVED', 'asset_bindings.' . $role, 'Archived assets cannot be selected for a new publication.');
            elseif (! (bool) $asset['renderer_compatible']) $issues[] = $this->issue($asset['asset_type'] === 'FONT' ? 'FONT_NOT_EMBEDDABLE' : 'ASSET_RENDERER_UNSUPPORTED', 'asset_bindings.' . $role, 'The official renderer cannot reproduce this asset.');
        }
        return $issues;
    }

    private function createDraftInternal(string $familyId, array $payload, string $actorId, ?string $sourceVersionId): array
    {
        $family = $this->db->table('certificate_template_families')->where('id', $familyId)->get()->getRowArray();
        if (! $family) {
            throw new RuntimeException('TEMPLATE_FAMILY_NOT_FOUND');
        }
        if ($this->db->table('certificate_template_versions')->where(['family_id' => $familyId, 'status' => self::DB_DRAFT])->countAllResults() > 0) {
            throw new RuntimeException('DRAFT_ALREADY_EXISTS');
        }
        $source = $sourceVersionId ? $this->versionRow($sourceVersionId) : $this->db->table('certificate_template_versions')->where(['family_id' => $familyId, 'status' => self::DB_PUBLISHED])->orderBy('version_number', 'DESC')->get()->getRowArray();
        if ($sourceVersionId && (! $source || $source['family_id'] !== $familyId)) {
            throw new RuntimeException('SOURCE_VERSION_NOT_FOUND');
        }
        $base = $source ? $this->decodeDocument($source) : [];
        $document = $this->documentFromPayload($payload, $base);
        $now = date('c');
        $document['governance'] = [
            'semantic_status' => CertificateDomain::TEMPLATE_DRAFT, 'created_by' => $actorId, 'created_at' => $now,
            'updated_by' => $actorId, 'updated_at' => $now, 'source_version_id' => $source['id'] ?? null,
            'change_summary' => trim((string) ($payload['change_summary'] ?? 'New draft version')),
            'validation' => ['status' => 'NOT_RUN', 'issues' => [], 'validated_at' => null, 'validated_by' => null],
            'immutable' => false,
        ];
        $next = (int) ($this->db->table('certificate_template_versions')->selectMax('version_number', 'maximum')->where('family_id', $familyId)->get()->getRowArray()['maximum'] ?? 0) + 1;
        $versionId = $this->identity->uuid();
        $this->write($this->db->table('certificate_template_versions')->insert($this->versionPersistence($document) + [
            'id' => $versionId, 'family_id' => $familyId, 'version_number' => $next, 'status' => self::DB_DRAFT, 'created_at' => date('Y-m-d H:i:s'),
        ]));
        $this->syncAssetBindings($versionId, $document['asset_bindings'] ?? []);
        $this->audit($actorId, 'TEMPLATE_DRAFT_CREATED', 'certificate_template_version', $versionId, ['family_id' => $familyId, 'version_number' => $next, 'source_version_id' => $source['id'] ?? null]);
        return $this->getVersion($versionId) ?? throw new RuntimeException('TEMPLATE_VERSION_NOT_FOUND');
    }

    private function documentFromPayload(array $payload, array $base): array
    {
        $defaultContract = array_map(static fn (string $name) => ['name' => $name, 'requirement_type' => in_array($name, ['issued_date', 'certificate_number', 'verification_url'], true) ? 'RESOLVED_AT_ISSUANCE' : 'REQUIRED'], ['recipient_name', 'activity_title', 'activity_date', 'organizer_name', 'issuer_name', 'issued_date', 'certificate_number', 'verification_url']);
        return [
            'schema_version' => 3,
            'renderer_version' => 'certificate-renderer-v1',
            'content_schema' => $payload['content_schema'] ?? $base['content_schema'] ?? [
                'heading' => 'CERTIFICATE', 'recipient_lead_in' => 'This certificate is presented to',
                'body' => '{{recipient_name}} is recognized for {{activity_title}} on {{activity_date}}, organized by {{organizer_name}}.',
                'footer_note' => 'Issued by {{issuer_name}} on {{issued_date}}. Certificate {{certificate_number}}. Verify: {{verification_url}}.',
            ],
            'layout_schema' => $payload['layout_schema'] ?? $base['layout_schema'] ?? [
                'page_size' => 'A4', 'orientation' => 'landscape', 'alignment' => 'center', 'theme_id' => 'emerald_gold',
                'border_style' => 'classic_ornate', 'logo_placement' => 'top_center', 'signature_layout' => 'single_row', 'qr_placement' => 'bottom_right',
            ],
            'placeholder_contract' => $payload['placeholder_contract'] ?? $base['placeholder_contract'] ?? $defaultContract,
            'signatory_slots' => $payload['signatory_slots'] ?? $base['signatory_slots'] ?? [],
            'asset_bindings' => $payload['asset_bindings'] ?? $base['asset_bindings'] ?? [],
            'governance' => $base['governance'] ?? [],
        ];
    }

    private function versionPersistence(array $document): array
    {
        return [
            'layout_config' => json_encode($document, JSON_UNESCAPED_SLASHES),
            'signatories_config' => json_encode(['policy' => 'CURRENT_APPROVED_CONFIGURATION', 'institutional_scope_policy' => 'DEFERRED'], JSON_UNESCAPED_SLASHES),
            'placeholder_contract_json' => json_encode($document['placeholder_contract'], JSON_UNESCAPED_SLASHES),
            'signatory_slots_json' => json_encode($document['signatory_slots'], JSON_UNESCAPED_SLASHES),
        ];
    }

    private function decodeDocument(array $row): array
    {
        $layout = json_decode((string) ($row['layout_config'] ?? '{}'), true) ?: [];
        if (isset($layout['content_schema'])) {
            return $layout + ['placeholder_contract' => json_decode((string) ($row['placeholder_contract_json'] ?? '[]'), true) ?: [], 'signatory_slots' => json_decode((string) ($row['signatory_slots_json'] ?? '[]'), true) ?: []];
        }
        $body = (string) ($layout['content']['body'] ?? '');
        return [
            'schema_version' => 2,
            'content_schema' => ['heading' => $this->defaultHeading((string) ($row['certificate_purpose'] ?? '')), 'recipient_lead_in' => 'This certificate is presented to', 'body' => $body, 'footer_note' => 'Notre Dame of Marbel University • Office of Student Affairs & Services'],
            'layout_schema' => ['page_size' => 'A4', 'orientation' => 'landscape', 'alignment' => 'center', 'theme_id' => 'emerald_gold', 'border_style' => 'classic_ornate', 'logo_placement' => 'top_center', 'signature_layout' => 'single_row', 'qr_placement' => 'bottom_right'],
            'placeholder_contract' => json_decode((string) ($row['placeholder_contract_json'] ?? '[]'), true) ?: [],
            'signatory_slots' => json_decode((string) ($row['signatory_slots_json'] ?? '[]'), true) ?: [],
            'governance' => $layout['governance'] ?? [],
            'asset_bindings' => $layout['asset_bindings'] ?? [],
        ];
    }

    private function syncAssetBindings(string $versionId, array $bindings): void
    {
        if (! $this->db->tableExists('certificate_template_asset_bindings')) return;
        $this->db->table('certificate_template_asset_bindings')->where('template_version_id', $versionId)->delete();
        foreach ($bindings as $role => $assetVersionId) {
            if (trim((string) $assetVersionId) === '') continue;
            $this->write($this->db->table('certificate_template_asset_bindings')->insert([
                'id' => $this->identity->uuid(), 'template_version_id' => $versionId, 'binding_role' => $role,
                'asset_version_id' => $assetVersionId, 'created_at' => date('Y-m-d H:i:s'),
            ]));
        }
    }

    private function versions(string $familyId): array
    {
        return $this->db->table('certificate_template_versions ctv')->select('ctv.*,ctf.certificate_purpose')->join('certificate_template_families ctf', 'ctf.id=ctv.family_id')->where('ctv.family_id', $familyId)->orderBy('ctv.version_number', 'DESC')->get()->getResultArray();
    }

    private function versionRow(string $versionId, bool $forUpdate = false): ?array
    {
        $sql = 'SELECT ctv.*,ctf.certificate_purpose FROM certificate_template_versions ctv JOIN certificate_template_families ctf ON ctf.id=ctv.family_id WHERE ctv.id=?' . ($forUpdate ? ' FOR UPDATE' : '');
        return $this->db->query($sql, [$versionId])->getRowArray();
    }

    private function requireDraft(string $versionId, bool $forUpdate = false): array
    {
        $row = $this->versionRow($versionId, $forUpdate);
        if (! $row) {
            throw new RuntimeException('TEMPLATE_VERSION_NOT_FOUND');
        }
        if ($row['status'] !== self::DB_DRAFT) {
            throw new RuntimeException('PUBLISHED_VERSION_IMMUTABLE');
        }
        return $row;
    }

    private function assertExpectedToken(array $row, ?string $expectedToken): void
    {
        if ($expectedToken === null || ! hash_equals($this->concurrencyToken($row), $expectedToken)) {
            throw new RuntimeException('STALE_DRAFT');
        }
    }

    private function familyReadModel(array $family, array $versions): array
    {
        $mapped = array_map(fn (array $version) => $this->versionReadModel($version), $versions);
        $publishedVersions = array_values(array_filter($mapped, static fn (array $version) => $version['status'] === CertificateDomain::TEMPLATE_PUBLISHED));
        $draftVersions = array_values(array_filter($mapped, static fn (array $version) => $version['status'] === CertificateDomain::TEMPLATE_DRAFT));
        $published = $publishedVersions[0] ?? null;
        $draft = $draftVersions[0] ?? null;
        return [
            'id' => $family['id'], 'code' => $family['code'], 'name' => $family['name'], 'description' => $family['description'],
            'certificate_purpose' => $family['certificate_purpose'], 'variant_code' => $family['variant_code'], 'is_default' => (bool) $family['is_default'],
            'status' => $family['status'] === 'active' ? 'ACTIVE' : strtoupper((string) $family['status']),
            'current_published_version' => $published, 'draft_version' => $draft, 'versions' => $mapped,
            'created_at' => $family['created_at'], 'updated_at' => $family['updated_at'],
        ];
    }

    private function versionReadModel(array $row): array
    {
        $document = $this->decodeDocument($row);
        $status = match ($row['status']) { self::DB_PUBLISHED => CertificateDomain::TEMPLATE_PUBLISHED, self::DB_SUPERSEDED => CertificateDomain::TEMPLATE_SUPERSEDED, default => CertificateDomain::TEMPLATE_DRAFT };
        return [
            'id' => $row['id'], 'family_id' => $row['family_id'], 'version_number' => (int) $row['version_number'], 'status' => $status,
            'certificate_purpose' => $row['certificate_purpose'], 'content_schema' => $document['content_schema'], 'layout_schema' => $document['layout_schema'],
            'placeholder_contract' => $document['placeholder_contract'], 'signatory_slots' => $document['signatory_slots'], 'asset_bindings' => $document['asset_bindings'] ?? [], 'design_schema_version' => $document['schema_version'] ?? 2, 'renderer_version' => $document['renderer_version'] ?? 'legacy', 'governance' => $document['governance'],
            'created_at' => $row['created_at'], 'concurrency_token' => $this->concurrencyToken($row),
        ];
    }

    private function concurrencyToken(array $row): string
    {
        return hash('sha256', implode('|', [(string) $row['id'], (string) $row['status'], (string) $row['layout_config'], (string) $row['placeholder_contract_json'], (string) $row['signatory_slots_json']]));
    }

    private function audit(string $actorId, string $code, string $targetType, string $targetId, array $context): void
    {
        $this->write($this->db->table('audit_logs')->insert([
            'id' => $this->identity->uuid(), 'actor_profile_id' => $actorId, 'event_code' => $code,
            'category' => 'certificate_template_governance', 'target_type' => $targetType, 'target_id' => $targetId,
            'outcome' => 'success', 'details' => $code, 'safe_context' => json_encode($context, JSON_UNESCAPED_SLASHES), 'created_at' => date('Y-m-d H:i:s'),
        ]));
    }

    private function issue(string $code, string $field, string $message): array { return compact('code', 'field', 'message'); }
    private function write(bool $result): void { if (! $result) throw new RuntimeException('TEMPLATE_WRITE_FAILED'); }
    private function commit(): void { if ($this->db->transStatus() === false) throw new RuntimeException('TEMPLATE_TRANSACTION_FAILED'); $this->db->transCommit(); }
    private function defaultHeading(string $purpose): string { return 'CERTIFICATE OF ' . ($purpose === 'APPRECIATION' ? 'APPRECIATION' : ($purpose === 'RECOGNITION' ? 'RECOGNITION' : ($purpose === 'COMPLETION' ? 'COMPLETION' : 'PARTICIPATION'))); }
}
