<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use Mpdf\Mpdf;
use Mpdf\Output\Destination;
use RuntimeException;
use Throwable;

final class CertificatePdfRendererService
{
    private BaseConnection $db;
    private CertificateVerificationQrService $qrService;
    private CertificateTemplateContractService $contractService;
    private CertificateAssetStorageService $assetStorage;
    private string $tempDir;

    public function __construct(
        ?BaseConnection $db = null,
        ?CertificateVerificationQrService $qrService = null,
        ?CertificateTemplateContractService $contractService = null,
        ?CertificateAssetStorageService $assetStorage = null,
        ?string $tempDir = null
    ) {
        $this->db = $db ?? db_connect();
        $this->qrService = $qrService ?? new CertificateVerificationQrService();
        $this->contractService = $contractService ?? new CertificateTemplateContractService();
        $this->assetStorage = $assetStorage ?? new CertificateAssetStorageService();
        
        $writableBase = defined('WRITEPATH') ? WRITEPATH : dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'writable';
        $this->tempDir = $tempDir ?? (rtrim($writableBase, '\\/') . DIRECTORY_SEPARATOR . 'cache' . DIRECTORY_SEPARATOR . 'certificate-pdf');
        if (!is_dir($this->tempDir)) {
            @mkdir($this->tempDir, 0755, true);
        }
    }

    public function render(string $certificateId): string
    {
        $issuance = $this->db->table('certificate_issuances')->where('id', $certificateId)->get()->getRowArray();
        if (!$issuance) {
            throw new RuntimeException('CERTIFICATE_NOT_FOUND');
        }

        if ($issuance['status'] === 'REVOKED') {
            throw new RuntimeException('CERTIFICATE_REVOKED');
        }
        if ($issuance['status'] === 'SUPERSEDED') {
            throw new RuntimeException('CERTIFICATE_SUPERSEDED');
        }
        if ($issuance['status'] !== 'ISSUED') {
            throw new RuntimeException('CERTIFICATE_NOT_IN_ISSUABLE_STATE');
        }

        $snapshotRow = $this->db->table('certificate_issuance_snapshots')->where('certificate_issuance_id', $certificateId)->get()->getRowArray();
        if (!$snapshotRow) {
            throw new RuntimeException('CERTIFICATE_SNAPSHOT_NOT_FOUND');
        }

        $snapshot = json_decode($snapshotRow['snapshot_json'] ?? '{}', true) ?: [];

        $templateVersion = null;
        if (!empty($issuance['template_version_id'])) {
            $templateVersion = $this->db->table('certificate_template_versions ctv')
                ->select('ctv.*, ctf.certificate_purpose, ctf.id template_family_id')
                ->join('certificate_template_families ctf', 'ctf.id=ctv.family_id')
                ->where('ctv.id', $issuance['template_version_id'])
                ->get()->getRowArray();
        }

        $boundAssets = [];
        if ($templateVersion) {
            $boundRows = $this->db->table('certificate_template_asset_bindings ctab')
                ->select('ctab.binding_role, cav.storage_key, cav.mime_type, cav.checksum, cav.id asset_version_id')
                ->join('certificate_asset_versions cav', 'cav.id=ctab.asset_version_id')
                ->where('ctab.template_version_id', $templateVersion['id'])
                ->get()->getResultArray();
            foreach ($boundRows as $brow) {
                $boundAssets[$brow['binding_role']] = $brow;
            }
        }

        return $this->renderFromData($issuance, $snapshot, $templateVersion, $boundAssets);
    }

    public function renderFromData(
        array $issuance,
        array $snapshot,
        ?array $templateVersion = null,
        ?array $boundAssets = null
    ): string {
        $resolvedData = (array)($snapshot['resolved_certificate_data'] ?? []);
        $recipientName = (string)($snapshot['recipient']['name'] ?? $resolvedData['recipient_name'] ?? '');
        $certificateNumber = (string)($snapshot['certificate_identity']['certificate_number'] ?? $issuance['certificate_number'] ?? '');
        $issuedDate = (string)($snapshot['dates']['issued_date'] ?? $resolvedData['issued_date'] ?? substr((string)($issuance['issued_at'] ?? date('Y-m-d')), 0, 10));
        $verificationUrl = (string)($snapshot['certificate_identity']['verification_url'] ?? ('/verify/certificate/' . ($issuance['public_verification_id'] ?? '')));

        if ($templateVersion !== null) {
            $layoutConfig = is_array($templateVersion['layout_config'] ?? null)
                ? $templateVersion['layout_config']
                : (json_decode((string)($templateVersion['layout_config'] ?? '{}'), true) ?: []);
            $placeholderContract = is_array($templateVersion['placeholder_contract'] ?? null)
                ? $templateVersion['placeholder_contract']
                : (json_decode((string)($templateVersion['placeholder_contract_json'] ?? '[]'), true) ?: []);
        } else {
            $layoutConfig = [];
            $placeholderContract = [];
        }

        $layoutSchema = (array)($layoutConfig['layout_schema'] ?? []);
        $contentSchema = (array)($layoutConfig['content_schema'] ?? []);

        // Resolve placeholder values
        $resolvedValues = array_merge([
            'recipient_name' => $recipientName,
            'activity_title' => (string)($resolvedData['activity_title'] ?? $snapshot['source_record']['title'] ?? ''),
            'activity_type' => (string)($resolvedData['activity_type'] ?? ''),
            'activity_date' => (string)($resolvedData['activity_date'] ?? $snapshot['dates']['activity_date'] ?? ''),
            'date_range' => (string)($resolvedData['date_range'] ?? ''),
            'organizer_name' => (string)($resolvedData['organizer_name'] ?? $snapshot['organizer_and_issuer']['organizer_name'] ?? ''),
            'student_role' => (string)($resolvedData['student_role'] ?? ''),
            'contribution_role' => (string)($resolvedData['contribution_role'] ?? ''),
            'recognition_title' => (string)($resolvedData['recognition_title'] ?? ''),
            'placement' => (string)($resolvedData['placement'] ?? ''),
            'scope' => (string)($resolvedData['scope'] ?? ''),
            'granting_body' => (string)($resolvedData['granting_body'] ?? ''),
            'issuer_name' => (string)($resolvedData['issuer_name'] ?? $snapshot['organizer_and_issuer']['issuer_name'] ?? 'Notre Dame of Marbel University'),
            'issued_date' => $issuedDate,
            'certificate_number' => $certificateNumber,
            'verification_url' => $verificationUrl,
        ], $resolvedData);

        // Body rendering with template placeholder contract validation
        $bodyTemplate = (string)($contentSchema['body'] ?? 'In recognition of valuable participation in {{activity_title}}.');
        try {
            $renderedBody = $this->contractService->render($bodyTemplate, $resolvedValues, $placeholderContract);
        } catch (Throwable $e) {
            throw new RuntimeException('UNRESOLVED_TEMPLATE_PLACEHOLDER: ' . $e->getMessage(), 0, $e);
        }

        // Heading & Recipient lead-in
        $heading = (string)($contentSchema['heading'] ?? ('Certificate of ' . ucfirst(strtolower((string)($snapshot['certificate_purpose'] ?? $issuance['certificate_purpose'] ?? 'Recognition')))));
        $recipientLeadIn = (string)($contentSchema['recipient_lead_in'] ?? 'This certificate is proudly presented to');
        $footerNote = (string)($contentSchema['footer_note'] ?? 'Issued by {{issuer_name}} on {{issued_date}}. Certificate Number: {{certificate_number}}.');
        $renderedFooterNote = preg_replace_callback('/{{\s*([a-z][a-z0-9_]*)\s*}}/i', static fn($m) => (string)($resolvedValues[strtolower($m[1])] ?? ''), $footerNote);

        // Resolve Signatories
        $signatories = $this->resolveSignatories($snapshot['signatories'] ?? []);

        // Resolve Assets
        $resolvedAssets = $this->resolveAssets($boundAssets ?? []);

        // Generate QR code Data URI
        $qrDataUri = $this->qrService->generateDataUri($verificationUrl, 160, 6);

        // Build HTML
        $html = $this->buildHtml([
            'heading' => $heading,
            'recipient_lead_in' => $recipientLeadIn,
            'recipient_name' => $recipientName,
            'rendered_body' => $renderedBody,
            'footer_note' => $renderedFooterNote,
            'certificate_number' => $certificateNumber,
            'issued_date' => $issuedDate,
            'verification_url' => $verificationUrl,
            'qr_data_uri' => $qrDataUri,
            'signatories' => $signatories,
            'assets' => $resolvedAssets,
            'layout' => $layoutSchema,
        ]);

        // Determine orientation & page size
        $orientation = strtolower((string)($layoutSchema['orientation'] ?? 'landscape')) === 'portrait' ? 'P' : 'L';
        $pageSize = strtoupper((string)($layoutSchema['page_size'] ?? 'A4'));
        $format = $orientation === 'L' ? ($pageSize . '-L') : $pageSize;

        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => $format,
            'orientation' => $orientation,
            'tempDir' => $this->tempDir,
            'margin_left' => 12,
            'margin_right' => 12,
            'margin_top' => 12,
            'margin_bottom' => 12,
            'margin_header' => 0,
            'margin_footer' => 0,
            'default_font' => 'dejavusans',
        ]);

        $mpdf->WriteHTML($html);
        return $mpdf->Output('', Destination::STRING_RETURN);
    }

    public function buildHtml(array $data): string
    {
        $themeId = (string)($data['layout']['theme_id'] ?? 'emerald_gold');
        $theme = $this->themePalette($themeId);

        $headingEscaped = htmlspecialchars((string)($data['heading'] ?? ''), ENT_QUOTES, 'UTF-8');
        $leadInEscaped = htmlspecialchars((string)($data['recipient_lead_in'] ?? ''), ENT_QUOTES, 'UTF-8');
        $recipientEscaped = htmlspecialchars((string)($data['recipient_name'] ?? ''), ENT_QUOTES, 'UTF-8');
        $bodyEscaped = htmlspecialchars((string)($data['rendered_body'] ?? ''), ENT_QUOTES, 'UTF-8');
        $certNumberEscaped = htmlspecialchars((string)($data['certificate_number'] ?? ''), ENT_QUOTES, 'UTF-8');
        $issuedDateEscaped = htmlspecialchars((string)($data['issued_date'] ?? ''), ENT_QUOTES, 'UTF-8');
        $footerNoteEscaped = htmlspecialchars((string)($data['footer_note'] ?? ''), ENT_QUOTES, 'UTF-8');
        $verificationUrlEscaped = htmlspecialchars((string)($data['verification_url'] ?? ''), ENT_QUOTES, 'UTF-8');
        $qrDataUri = (string)($data['qr_data_uri'] ?? '');

        $logoDataUri = $data['assets']['LOGO']['data_uri'] ?? null;
        $sealDataUri = $data['assets']['SEAL']['data_uri'] ?? null;

        // Signatories HTML
        $signatories = (array)($data['signatories'] ?? []);
        $signatoriesHtml = $this->buildSignatoriesHtml($signatories, $theme);

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    @page {
        margin: 10mm;
    }
    body {
        font-family: 'dejavusans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        color: {$theme['text_color']};
        background-color: {$theme['bg_color']};
        margin: 0;
        padding: 0;
    }
    .cert-container {
        border: 4px double {$theme['primary_color']};
        padding: 16px 24px;
        text-align: center;
        position: relative;
        background-color: {$theme['card_bg']};
    }
    .inner-border {
        border: 1px solid {$theme['gold_color']};
        padding: 20px 28px;
    }
    .institution-header {
        font-size: 13pt;
        font-weight: bold;
        letter-spacing: 2px;
        color: {$theme['primary_color']};
        text-transform: uppercase;
        margin-bottom: 2px;
    }
    .institution-sub {
        font-size: 9pt;
        letter-spacing: 1px;
        color: #555555;
        text-transform: uppercase;
        margin-bottom: 12px;
    }
    .logo-container {
        margin-bottom: 8px;
    }
    .cert-heading {
        font-size: 24pt;
        font-weight: bold;
        color: {$theme['primary_color']};
        letter-spacing: 2px;
        text-transform: uppercase;
        margin: 10px 0 6px 0;
        font-family: 'dejavuserif', Georgia, serif;
    }
    .cert-divider {
        width: 140px;
        height: 2px;
        background-color: {$theme['gold_color']};
        margin: 0 auto 12px auto;
    }
    .lead-in {
        font-size: 11pt;
        font-style: italic;
        color: #555555;
        margin-bottom: 10px;
    }
    .recipient-name {
        font-size: 24pt;
        font-weight: bold;
        color: {$theme['text_color']};
        letter-spacing: 1px;
        margin: 8px 0 14px 0;
        text-decoration: underline;
        text-decoration-color: {$theme['gold_color']};
    }
    .body-text {
        font-size: 11pt;
        line-height: 1.5;
        color: #333333;
        max-width: 85%;
        margin: 0 auto 18px auto;
    }
    .signatories-table {
        width: 100%;
        margin-top: 15px;
        margin-bottom: 10px;
    }
    .signatory-cell {
        text-align: center;
        vertical-align: bottom;
        padding: 0 15px;
    }
    .sig-img {
        max-height: 48px;
        max-width: 160px;
        margin-bottom: 4px;
    }
    .sig-line {
        border-top: 1px solid #444444;
        width: 80%;
        margin: 0 auto 4px auto;
    }
    .sig-name {
        font-size: 10.5pt;
        font-weight: bold;
        color: {$theme['text_color']};
    }
    .sig-title {
        font-size: 8.5pt;
        color: #666666;
    }
    .footer-bar {
        width: 100%;
        margin-top: 15px;
        border-top: 1px solid {$theme['gold_color']};
        padding-top: 8px;
    }
    .footer-left {
        text-align: left;
        font-size: 8pt;
        color: #666666;
        vertical-align: middle;
    }
    .footer-right {
        text-align: right;
        font-size: 8pt;
        color: #666666;
        vertical-align: middle;
    }
    .qr-img {
        width: 60px;
        height: 60px;
        vertical-align: middle;
    }
    .cert-meta-tag {
        font-weight: bold;
        color: {$theme['primary_color']};
    }
</style>
</head>
<body>
<div class="cert-container">
    <div class="inner-border">
        {$this->renderLogoHtml($logoDataUri)}
        <div class="institution-header">Notre Dame of Marbel University</div>
        <div class="institution-sub">Office of Student Affairs and Discipline (OSAD)</div>

        <div class="cert-heading">{$headingEscaped}</div>
        <div class="cert-divider"></div>

        <div class="lead-in">{$leadInEscaped}</div>
        <div class="recipient-name">{$recipientEscaped}</div>

        <div class="body-text">{$bodyEscaped}</div>

        {$signatoriesHtml}

        <table class="footer-bar">
            <tr>
                <td class="footer-left" style="width: 70%;">
                    <div><span class="cert-meta-tag">Certificate No:</span> {$certNumberEscaped}</div>
                    <div><span class="cert-meta-tag">Issued Date:</span> {$issuedDateEscaped}</div>
                    <div style="font-size: 7.5pt; color: #888888; margin-top: 3px;">Verify authenticity: {$verificationUrlEscaped}</div>
                </td>
                <td class="footer-right" style="width: 30%;">
                    <img src="{$qrDataUri}" class="qr-img" alt="Verification QR" />
                </td>
            </tr>
        </table>
    </div>
</div>
</body>
</html>
HTML;
    }

    private function renderLogoHtml(?string $logoDataUri): string
    {
        if (!$logoDataUri) {
            return '';
        }
        return '<div class="logo-container"><img src="' . $logoDataUri . '" style="max-height: 50px; max-width: 120px;" alt="Logo" /></div>';
    }

    private function buildSignatoriesHtml(array $signatories, array $theme): string
    {
        if (empty($signatories)) {
            return '';
        }

        $count = count($signatories);
        $colWidth = $count > 0 ? (int)(100 / $count) : 100;

        $cells = [];
        foreach ($signatories as $sig) {
            $name = htmlspecialchars((string)($sig['name'] ?? ''), ENT_QUOTES, 'UTF-8');
            $title = htmlspecialchars((string)($sig['title'] ?? ''), ENT_QUOTES, 'UTF-8');
            $sigDataUri = $sig['data_uri'] ?? null;

            $sigImgHtml = $sigDataUri
                ? '<img src="' . $sigDataUri . '" class="sig-img" alt="Signature" /><br>'
                : '<div style="height: 32px;"></div>';

            $cells[] = <<<HTML
<td class="signatory-cell" style="width: {$colWidth}%;">
    {$sigImgHtml}
    <div class="sig-line"></div>
    <div class="sig-name">{$name}</div>
    <div class="sig-title">{$title}</div>
</td>
HTML;
        }

        $cellsHtml = implode("\n", $cells);
        return <<<HTML
<table class="signatories-table">
    <tr>
        {$cellsHtml}
    </tr>
</table>
HTML;
    }

    private function resolveSignatories(array $signatories): array
    {
        $resolved = [];
        foreach ($signatories as $role => $sig) {
            if (!is_array($sig)) {
                continue;
            }
            $item = [
                'role_code' => $sig['role_code'] ?? (is_string($role) ? $role : ''),
                'name' => $sig['name'] ?? '',
                'title' => $sig['title'] ?? '',
                'data_uri' => null,
            ];

            $storagePath = (string)($sig['signature_storage_path'] ?? '');
            if ($storagePath !== '') {
                $item['data_uri'] = $this->loadSignatureImageAsDataUri($storagePath);
            }

            $resolved[] = $item;
        }
        return $resolved;
    }

    private function loadSignatureImageAsDataUri(string $path): string
    {
        // Path safety & traversal prevention
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            throw new RuntimeException('REMOTE_URL_BLOCKED');
        }
        if (str_contains($path, '..')) {
            throw new RuntimeException('PATH_TRAVERSAL_BLOCKED');
        }

        $realPath = null;
        if (is_file($path) && is_readable($path)) {
            $realPath = realpath($path);
        } else {
            $writableBase = defined('WRITEPATH') ? WRITEPATH : dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'writable';
            $candidate = rtrim($writableBase, '\\/') . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . ltrim($path, '\\/');
            if (is_file($candidate) && is_readable($candidate)) {
                $realPath = realpath($candidate);
            }
        }

        if (!$realPath || !is_file($realPath) || !is_readable($realPath)) {
            throw new RuntimeException('MISSING_REQUIRED_SIGNATURE');
        }

        $info = @getimagesize($realPath);
        $mime = (string)($info['mime'] ?? '');
        if (!in_array($mime, ['image/png', 'image/jpeg', 'image/jpg'], true)) {
            throw new RuntimeException('SIGNATURE_IMAGE_INVALID');
        }

        $content = file_get_contents($realPath);
        if ($content === false || $content === '') {
            throw new RuntimeException('MISSING_REQUIRED_SIGNATURE');
        }

        return 'data:' . $mime . ';base64,' . base64_encode($content);
    }

    private function resolveAssets(array $boundAssets): array
    {
        $resolved = [];
        foreach ($boundAssets as $role => $asset) {
            $key = (string)($asset['storage_key'] ?? '');
            if ($key === '') {
                continue;
            }

            if (str_starts_with($key, 'http://') || str_starts_with($key, 'https://')) {
                throw new RuntimeException('REMOTE_URL_BLOCKED');
            }
            if (str_contains($key, '..')) {
                throw new RuntimeException('PATH_TRAVERSAL_BLOCKED');
            }

            try {
                $resolvedPath = $this->assetStorage->resolve($key);
                if (is_file($resolvedPath) && is_readable($resolvedPath)) {
                    $mime = (string)($asset['mime_type'] ?? 'image/png');
                    $content = file_get_contents($resolvedPath);
                    if ($content !== false && $content !== '') {
                        $resolved[$role] = [
                            'binding_role' => $role,
                            'mime_type' => $mime,
                            'data_uri' => 'data:' . $mime . ';base64,' . base64_encode($content),
                        ];
                    }
                }
            } catch (Throwable $e) {
                // If resolving bound asset fails, fail safely or continue if non-critical
                if ($e->getMessage() === 'ASSET_STORAGE_KEY_INVALID') {
                    throw new RuntimeException('PATH_TRAVERSAL_BLOCKED');
                }
            }
        }
        return $resolved;
    }

    private function themePalette(string $themeId): array
    {
        return match ($themeId) {
            'royal_navy' => [
                'primary_color' => '#002855',
                'gold_color' => '#b8860b',
                'text_color' => '#0a192f',
                'bg_color' => '#f8fafc',
                'card_bg' => '#ffffff',
            ],
            'classic_black' => [
                'primary_color' => '#1e293b',
                'gold_color' => '#946b2d',
                'text_color' => '#111827',
                'bg_color' => '#fafafa',
                'card_bg' => '#ffffff',
            ],
            'crimson_silver' => [
                'primary_color' => '#7f1d1d',
                'gold_color' => '#64748b',
                'text_color' => '#1c1917',
                'bg_color' => '#fdfbfb',
                'card_bg' => '#ffffff',
            ],
            default => [ // emerald_gold
                'primary_color' => '#134e3f',
                'gold_color' => '#b48a3c',
                'text_color' => '#1b281d',
                'bg_color' => '#fbfaf7',
                'card_bg' => '#ffffff',
            ],
        };
    }
}
