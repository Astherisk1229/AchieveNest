<?php

namespace App\Services;

use RuntimeException;

final class OcrExtractionService
{
    private string $tesseract;
    private string $pdfToText;
    private string $pdfToPpm;

    public function __construct(?string $tesseract = null, ?string $pdfToText = null, ?string $pdfToPpm = null)
    {
        $this->tesseract = $tesseract ?? (string) env('ocr.tesseractPath', 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe');
        $this->pdfToText = $pdfToText ?? (string) env('ocr.pdfToTextPath', 'C:\\Tools\\poppler-26.07.0\\poppler-26.07.0\\Library\\bin\\pdftotext.exe');
        $this->pdfToPpm = $pdfToPpm ?? (string) env('ocr.pdfToPpmPath', 'C:\\Tools\\poppler-26.07.0\\poppler-26.07.0\\Library\\bin\\pdftoppm.exe');
    }

    public function extract(string $sourcePath, string $mime): array
    {
        $this->assertExecutable($this->tesseract, 'Tesseract');
        $work = rtrim(sys_get_temp_dir(), '/\\') . DIRECTORY_SEPARATOR . 'achievenest-ocr-' . bin2hex(random_bytes(12));
        if (! mkdir($work, 0700, true) && ! is_dir($work)) {
            throw new RuntimeException('Could not create isolated OCR workspace.');
        }

        try {
            if ($mime === 'application/pdf') {
                $this->assertExecutable($this->pdfToText, 'pdftotext');
                $this->assertExecutable($this->pdfToPpm, 'pdftoppm');
                $embedded = $work . DIRECTORY_SEPARATOR . 'embedded.txt';
                $this->run([$this->pdfToText, '-enc', 'UTF-8', '-nopgbrk', $sourcePath, $embedded], 30);
                $text = is_file($embedded) ? (string) file_get_contents($embedded) : '';
                $text = $this->normalize($text);
                if ($this->quality($text)['score'] >= 0.60) {
                    return $this->result($text, 'poppler-text', 1);
                }

                $prefix = $work . DIRECTORY_SEPARATOR . 'page';
                $this->run([$this->pdfToPpm, '-f', '1', '-l', '10', '-r', '300', '-png', $sourcePath, $prefix], 90);
                $images = glob($prefix . '-*.png') ?: [];
                sort($images, SORT_NATURAL);
                if ($images === []) {
                    return $this->result('', 'poppler-tesseract', 0, ['No readable PDF pages were produced.']);
                }
                $pages = [];
                foreach ($images as $image) {
                    $pages[] = $this->ocrImage($image);
                }
                return $this->result(implode("\n\n", $pages), 'poppler-tesseract', count($pages));
            }

            return $this->result($this->ocrImage($sourcePath), 'tesseract', 1);
        } finally {
            $this->removeTree($work);
        }
    }

    private function ocrImage(string $path): string
    {
        $outputBase = dirname($path) . DIRECTORY_SEPARATOR . pathinfo($path, PATHINFO_FILENAME) . '-ocr';
        $this->run([$this->tesseract, $path, $outputBase, '-l', 'eng', '--oem', '1', '--psm', '6'], 60);
        return $this->normalize(is_file($outputBase . '.txt') ? (string) file_get_contents($outputBase . '.txt') : '');
    }

    private function result(string $text, string $engine, int $pages, array $warnings = []): array
    {
        $quality = $this->quality($text);
        if ($quality['score'] < 0.60) {
            $text = '';
            $warnings[] = 'OCR could not reliably read this document. Continue with manual entry or upload a clearer file.';
        }
        return ['text' => $text, 'engine' => $engine, 'engine_version' => 'local', 'pages' => $pages, 'quality' => $quality, 'warnings' => array_values(array_unique($warnings))];
    }

    public function normalize(string $text): string
    {
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\p{Cf}]/u', '', $text) ?? '';
        $text = str_replace("\xEF\xBF\xBD", '', $text);
        $lines = preg_split('/\R/u', $text) ?: [];
        $lines = array_map(static fn (string $line): string => trim(preg_replace('/[ \t]+/u', ' ', $line) ?? ''), $lines);
        return trim(implode("\n", array_filter($lines, static fn (string $line): bool => $line !== '')));
    }

    public function quality(string $text): array
    {
        if ($text === '') return ['score' => 0.0, 'label' => 'failed'];
        $length = max(1, mb_strlen($text));
        $letters = preg_match_all('/[\p{L}\p{N}]/u', $text) ?: 0;
        $replacement = substr_count($text, "\xEF\xBF\xBD");
        $score = max(0.0, min(1.0, ($letters / $length) - min(0.5, $replacement / $length)));
        return ['score' => round($score, 3), 'label' => $score >= 0.75 ? 'good' : ($score >= 0.60 ? 'review' : 'failed')];
    }

    private function run(array $arguments, int $timeout): void
    {
        $command = implode(' ', array_map('escapeshellarg', $arguments));
        $descriptor = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
        $process = proc_open($command, $descriptor, $pipes, null, null, ['bypass_shell' => true]);
        if (! is_resource($process)) throw new RuntimeException('OCR process could not start.');
        foreach ($pipes as $pipe) stream_set_blocking($pipe, false);
        $start = microtime(true);
        $stderr = '';
        do {
            $status = proc_get_status($process);
            $stderr .= stream_get_contents($pipes[2]);
            if (! $status['running']) break;
            if (microtime(true) - $start > $timeout) {
                proc_terminate($process);
                throw new RuntimeException('OCR processing timed out.');
            }
            usleep(50000);
        } while (true);
        foreach ($pipes as $pipe) fclose($pipe);
        $exit = proc_close($process);
        if ($exit !== 0 && $exit !== -1) throw new RuntimeException('OCR engine rejected the document: ' . trim($stderr));
    }

    private function assertExecutable(string $path, string $name): void
    {
        if (! is_file($path)) throw new RuntimeException($name . ' executable is not configured.');
    }

    private function removeTree(string $path): void
    {
        if (! is_dir($path)) return;
        foreach (new \FilesystemIterator($path) as $item) {
            $item->isDir() ? $this->removeTree($item->getPathname()) : @unlink($item->getPathname());
        }
        @rmdir($path);
    }
}
