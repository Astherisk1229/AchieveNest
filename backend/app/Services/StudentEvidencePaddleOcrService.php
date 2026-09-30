<?php

namespace App\Services;

use RuntimeException;

/** Transient, advisory-only boundary to the deployment-owned PaddleOCR runtime. */
class StudentEvidencePaddleOcrService
{
    public const TIMEOUT_SECONDS = 60; // 40.9 s representative ceiling + 19.1 s operational margin.

    public function extract(string $path, string $mime): array
    {
        if (! in_array($mime, ['image/jpeg', 'image/png', 'application/pdf'], true)) {
            throw new RuntimeException('OCR_TYPE_UNSUPPORTED');
        }
        if (! is_file($path) || filesize($path) > LocalEvidenceStorageService::DEFAULT_MAX_BYTES) {
            throw new RuntimeException('OCR_EVIDENCE_INVALID');
        }
        $backend = dirname(__DIR__, 2);
        $python = $backend . DIRECTORY_SEPARATOR . '.runtime' . DIRECTORY_SEPARATOR . 'python' . DIRECTORY_SEPARATOR . 'python.exe';
        $bridge = $backend . DIRECTORY_SEPARATOR . 'ocr' . DIRECTORY_SEPARATOR . 'student_ocr_bridge.py';
        if (! is_file($python) || ! is_file($bridge)) {
            throw new RuntimeException('OCR_RUNTIME_UNAVAILABLE');
        }
        $command = implode(' ', array_map('escapeshellarg', [$python, $bridge, '--extract', '--input', $path, '--mime', $mime]));
        $pipes = [];
        $environment = getenv();
        $environment['PADDLE_PDX_CACHE_HOME'] = $backend . DIRECTORY_SEPARATOR . '.runtime' . DIRECTORY_SEPARATOR . 'paddlex-cache';
        $environment['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True';
        $process = proc_open($command, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, null, $environment, ['bypass_shell' => true]);
        if (! is_resource($process)) throw new RuntimeException('OCR_PROCESS_START_FAILED');
        foreach ($pipes as $pipe) stream_set_blocking($pipe, false);
        $out = ''; $err = ''; $started = microtime(true); $exitCode = null;
        do {
            $status = proc_get_status($process);
            $out .= stream_get_contents($pipes[1]); $err .= stream_get_contents($pipes[2]);
            if (! $status['running']) {
                $exitCode = $status['exitcode'];
                break;
            }
            if (microtime(true) - $started > self::TIMEOUT_SECONDS) {
                proc_terminate($process); foreach ($pipes as $pipe) fclose($pipe);
                throw new RuntimeException('OCR_PROCESS_TIMEOUT');
            }
            usleep(50000);
        } while (true);
        // Drain the final buffered bytes after the child exits. With non-blocking
        // Windows pipes, the completed JSON envelope may arrive after running
        // changes to false.
        $out .= stream_get_contents($pipes[1]);
        $err .= stream_get_contents($pipes[2]);
        foreach ($pipes as $pipe) fclose($pipe);
        $closedExit = proc_close($process);
        $exit = $exitCode ?? $closedExit;
        $payload = json_decode($out, true);
        // Windows can report -1 after proc_get_status() has already consumed the
        // child's terminal status. A valid, successful bridge envelope remains
        // authoritative in that case; every other non-zero exit is rejected.
        if (($exit !== 0 && $exit !== -1) || ! is_array($payload) || ! ($payload['ok'] ?? false)) {
            log_message('error', 'Student PaddleOCR failed (exit={exit}, stdout_bytes={stdout_bytes}, json_error={json_error}, stderr_bytes={stderr_bytes})', [
                'exit' => $exit, 'stdout_bytes' => strlen($out), 'json_error' => json_last_error_msg(), 'stderr_bytes' => strlen($err),
            ]);
            throw new RuntimeException('OCR_EXTRACTION_FAILED');
        }
        return $this->withReviewSuggestions($payload);
    }

    /**
     * Produces transient, presentation-only review suggestions from OCR's
     * explicit labels. These keys are deliberately not canonical contract
     * fields and are never persisted. Contract-specific mapping remains
     * unavailable until a student chooses a trusted contract.
     */
    private function withReviewSuggestions(array $payload): array
    {
        $labels = [
            'event' => ['activity_title', 'Activity / Event Title'],
            'activity' => ['activity_title', 'Activity / Event Title'],
            'program' => ['activity_title', 'Activity / Event Title'],
            'achievement' => ['activity_title', 'Activity / Event Title'],
            'recognition' => ['activity_title', 'Activity / Event Title'],
            'award' => ['activity_title', 'Activity / Event Title'],
            'organizer' => ['organizer_granting_body', 'Organizer / Granting Body'],
            'granting_body' => ['organizer_granting_body', 'Organizer / Granting Body'],
            'venue' => ['venue', 'Venue'],
            'date' => ['start_date_raw', 'Start Date'],
            'date_awarded' => ['start_date_raw', 'Start Date'],
            'service_date' => ['start_date_raw', 'Start Date'],
            // Explicitly labelled certificate lines used by the category-specific details.
            'role' => ['position_title', 'Position / Role'],
            'position' => ['position_title', 'Position / Role'],
            'organization' => ['organization_name', 'Organization'],
            'academic_year' => ['academic_year', 'Academic Year'],
        ];
        $review = [];

        foreach (($payload['pages'] ?? []) as $page) {
            foreach (($page['suggestions'] ?? []) as $sourceLabel => $suggestion) {
                if (! isset($labels[$sourceLabel]) || isset($review[$labels[$sourceLabel][0]])) {
                    continue;
                }
                $value = trim((string) ($suggestion['value'] ?? ''));
                if ($value === '') {
                    continue;
                }
                [$key, $label] = $labels[$sourceLabel];
                $review[$key] = [
                    'key' => $key,
                    'label' => $label,
                    'value' => $value,
                    'confidence' => $suggestion['confidence'] ?? null,
                    'source' => 'labelled_ocr',
                    'advisory_only' => true,
                ];
            }
        }

        $payload['review_suggestions'] = array_values($review);
        return $payload;
    }
}
