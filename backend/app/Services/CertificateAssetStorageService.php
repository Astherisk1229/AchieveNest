<?php

namespace App\Services;

use RuntimeException;

final class CertificateAssetStorageService
{
    private const IMAGE_TYPES = ['image/png' => 'png', 'image/jpeg' => 'jpg'];
    private const FONT_TYPES = ['font/ttf' => 'ttf', 'font/otf' => 'otf', 'font/woff2' => 'woff2'];
    public function __construct(private ?string $root = null, private int $maxImageBytes = 15728640, private int $maxFontBytes = 8388608)
    {
        $this->root ??= rtrim(WRITEPATH, '\\/') . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'certificate_assets';
    }

    public function validate(string $path, string $assetType): array
    {
        if (! is_file($path) || ! is_readable($path)) throw new RuntimeException('ASSET_FILE_INVALID');
        $size = filesize($path); $head = file_get_contents($path, false, null, 0, 12) ?: '';
        $isFont = strtoupper($assetType) === 'FONT'; $limit = $isFont ? $this->maxFontBytes : $this->maxImageBytes;
        if ($size < 1 || $size > $limit) throw new RuntimeException('ASSET_FILE_SIZE_INVALID');
        if ($isFont) {
            $mime = str_starts_with($head, "\x00\x01\x00\x00") || str_starts_with($head, 'true') ? 'font/ttf' : (str_starts_with($head, 'OTTO') ? 'font/otf' : (str_starts_with($head, 'wOF2') ? 'font/woff2' : ''));
            if ($mime === '') throw new RuntimeException('FONT_INVALID');
            return ['mime_type'=>$mime,'extension'=>self::FONT_TYPES[$mime],'file_size'=>$size,'checksum'=>hash_file('sha256',$path),'metadata'=>['format'=>strtoupper(self::FONT_TYPES[$mime]),'embeddable'=>false]];
        }
        $info = @getimagesize($path); $mime = (string) ($info['mime'] ?? '');
        if (! isset(self::IMAGE_TYPES[$mime]) || ($mime === 'image/png' && ! str_starts_with($head, "\x89PNG\r\n\x1a\n")) || ($mime === 'image/jpeg' && ! str_starts_with($head, "\xFF\xD8\xFF"))) throw new RuntimeException('ASSET_IMAGE_INVALID');
        return ['mime_type'=>$mime,'extension'=>self::IMAGE_TYPES[$mime],'file_size'=>$size,'checksum'=>hash_file('sha256',$path),'metadata'=>['width'=>(int)$info[0],'height'=>(int)$info[1],'orientation'=>$info[0] >= $info[1] ? 'landscape' : 'portrait']];
    }

    public function store(string $source, string $assetId, string $versionId, string $extension): string
    {
        $directory = $this->root . DIRECTORY_SEPARATOR . $assetId;
        if (! is_dir($directory) && ! mkdir($directory, 0750, true) && ! is_dir($directory)) throw new RuntimeException('ASSET_STORAGE_FAILED');
        $key = $assetId . '/' . $versionId . '.' . $extension; $target = $this->root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $key);
        if (! copy($source, $target)) throw new RuntimeException('ASSET_STORAGE_FAILED');
        return $key;
    }

    public function resolve(string $key): string
    {
        if ($key === '' || str_contains($key, '..') || str_starts_with($key, '/') || str_starts_with($key, '\\')) throw new RuntimeException('ASSET_STORAGE_KEY_INVALID');
        $root = realpath($this->root); $path = realpath($this->root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $key));
        if ($root === false || $path === false || ! str_starts_with($path, $root . DIRECTORY_SEPARATOR)) throw new RuntimeException('ASSET_NOT_FOUND');
        return $path;
    }
}
