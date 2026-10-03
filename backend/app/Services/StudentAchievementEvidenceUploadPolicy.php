<?php

namespace App\Services;

/** Canonical lifecycle upload policy; never trusts the browser-provided MIME type. */
final class StudentAchievementEvidenceUploadPolicy
{
    public const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png'];
    public const MAX_PDF_PAGES = 2;

    public function __construct(private readonly LocalEvidenceStorageService $storage)
    {
    }

    /** @return array{success: bool, error_code?: string, extension?: string, detected_mime?: string, byte_size?: int} */
    public function validate(string $path, string $clientFilename): array
    {
        $validated = $this->storage->validateFile($path, $clientFilename);
        if (! ($validated['success'] ?? false)) {
            return $validated;
        }

        if (! in_array($validated['detected_mime'] ?? '', self::ALLOWED_MIMES, true)) {
            return ['success' => false, 'error_code' => 'STUDENT_EVIDENCE_TYPE_NOT_ALLOWED'];
        }

        if (($validated['detected_mime'] ?? '') === 'application/pdf' && $this->pdfPageCount($path) > self::MAX_PDF_PAGES) {
            return ['success' => false, 'error_code' => 'STUDENT_EVIDENCE_PDF_PAGE_LIMIT_EXCEEDED'];
        }

        return $validated;
    }

    private function pdfPageCount(string $path): int
    {
        $contents = @file_get_contents($path);
        if (! is_string($contents)) {
            return self::MAX_PDF_PAGES + 1;
        }

        // This counts page objects, excluding the /Pages tree. The policy fails closed
        // for malformed PDFs that do not expose a page object.
        $count = preg_match_all('~/Type\s*/Page\b~', $contents);
        return is_int($count) && $count > 0 ? $count : self::MAX_PDF_PAGES + 1;
    }
}
