<?php

namespace App\Services;

use RuntimeException;

/** Deployment-owned ClamAV process boundary for persisted student evidence. */
class StudentEvidenceClamAvScanner
{
    public const TIMEOUT_SECONDS = 60;

    private string $binary;
    private string $databaseDirectory;

    public function __construct(?string $binary = null, ?string $databaseDirectory = null)
    {
        $backend = dirname(__DIR__, 2);
        $runtime = $backend . DIRECTORY_SEPARATOR . '.runtime' . DIRECTORY_SEPARATOR . 'clamav';
        $this->binary = $binary ?: (string) (env('CLAMAV_CLAMSCAN_PATH') ?: env(
            'clamav.clamscanPath',
            $runtime . DIRECTORY_SEPARATOR . 'clamav-1.5.4.win.x64' . DIRECTORY_SEPARATOR . 'clamscan.exe'
        ));
        $this->databaseDirectory = $databaseDirectory ?: (string) (env('CLAMAV_DATABASE_DIRECTORY') ?: env(
            'clamav.databaseDirectory',
            $runtime . DIRECTORY_SEPARATOR . 'database'
        ));
    }

    /** @return array{status: 'clean'|'infected'|'unavailable', code: string} */
    public function scan(string $absolutePath): array
    {
        if (! is_file($absolutePath)) {
            return ['status' => 'unavailable', 'code' => 'EVIDENCE_FILE_MISSING'];
        }
        if (! is_file($this->binary) || ! is_dir($this->databaseDirectory) || ! $this->hasSignatures()) {
            return ['status' => 'unavailable', 'code' => 'CLAMAV_RUNTIME_UNAVAILABLE'];
        }

        $command = implode(' ', array_map('escapeshellarg', [
            $this->binary,
            '--database=' . $this->databaseDirectory,
            '--no-summary',
            '--',
            $absolutePath,
        ]));
        $pipes = [];
        $process = proc_open($command, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, null, null, ['bypass_shell' => true]);
        if (! is_resource($process)) {
            return ['status' => 'unavailable', 'code' => 'CLAMAV_PROCESS_START_FAILED'];
        }
        foreach ($pipes as $pipe) { stream_set_blocking($pipe, false); }
        $started = microtime(true);
        $exitCode = null;
        do {
            $status = proc_get_status($process);
            if (! $status['running']) { $exitCode = $status['exitcode']; break; }
            if (microtime(true) - $started > self::TIMEOUT_SECONDS) {
                proc_terminate($process);
                foreach ($pipes as $pipe) { fclose($pipe); }
                return ['status' => 'unavailable', 'code' => 'CLAMAV_PROCESS_TIMEOUT'];
            }
            usleep(50_000);
        } while (true);
        foreach ($pipes as $pipe) { fclose($pipe); }
        $closedExit = proc_close($process);
        $exit = $exitCode ?? $closedExit;
        if ($exit === 0) { return ['status' => 'clean', 'code' => 'CLAMAV_CLEAN']; }
        if ($exit === 1) { return ['status' => 'infected', 'code' => 'CLAMAV_INFECTED']; }
        return ['status' => 'unavailable', 'code' => 'CLAMAV_SCAN_FAILED'];
    }

    /** @return array{available: bool, engine: ?string, code: string} */
    public function health(): array
    {
        if (! is_file($this->binary) || ! is_dir($this->databaseDirectory) || ! $this->hasSignatures()) {
            return ['available' => false, 'engine' => null, 'code' => 'CLAMAV_RUNTIME_UNAVAILABLE'];
        }
        $output = [];
        $exit = 1;
        @exec(escapeshellarg($this->binary) . ' --database=' . escapeshellarg($this->databaseDirectory) . ' --version', $output, $exit);
        if ($exit !== 0 || $output === []) {
            return ['available' => false, 'engine' => null, 'code' => 'CLAMAV_HEALTHCHECK_FAILED'];
        }
        return ['available' => true, 'engine' => trim(implode("\n", $output)), 'code' => 'CLAMAV_READY'];
    }

    private function hasSignatures(): bool
    {
        return is_file($this->databaseDirectory . DIRECTORY_SEPARATOR . 'main.cvd')
            && is_file($this->databaseDirectory . DIRECTORY_SEPARATOR . 'daily.cvd');
    }
}
