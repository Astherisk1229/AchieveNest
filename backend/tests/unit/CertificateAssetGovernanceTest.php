<?php

namespace Tests\Unit;

use App\Services\CertificateAssetStorageService;
use CodeIgniter\Test\CIUnitTestCase;
use RuntimeException;

final class CertificateAssetGovernanceTest extends CIUnitTestCase
{
    private string $directory;
    protected function setUp(): void { parent::setUp(); $this->directory=sys_get_temp_dir().DIRECTORY_SEPARATOR.'certificate-assets-'.bin2hex(random_bytes(4)); mkdir($this->directory,0700,true); }
    protected function tearDown(): void { foreach(glob($this->directory.DIRECTORY_SEPARATOR.'*')?:[] as $file) if(is_file($file))unlink($file); if(is_dir($this->directory))rmdir($this->directory); parent::tearDown(); }

    public function testValidPngIsDecodedAndHasChecksum(): void
    {
        $path=$this->directory.DIRECTORY_SEPARATOR.'image.png';
        file_put_contents($path,base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='));
        $result=(new CertificateAssetStorageService($this->directory))->validate($path,'BACKGROUND');
        self::assertSame('image/png',$result['mime_type']); self::assertSame(64,strlen($result['checksum'])); self::assertSame(1,$result['metadata']['width']);
    }

    public function testMalformedImageAndFontAreRejected(): void
    {
        $path=$this->directory.DIRECTORY_SEPARATOR.'fake.png'; file_put_contents($path,'not an image');
        try{(new CertificateAssetStorageService($this->directory))->validate($path,'BACKGROUND');self::fail('Malformed image accepted.');}catch(RuntimeException $e){self::assertSame('ASSET_IMAGE_INVALID',$e->getMessage());}
        try{(new CertificateAssetStorageService($this->directory))->validate($path,'FONT');self::fail('Malformed font accepted.');}catch(RuntimeException $e){self::assertSame('FONT_INVALID',$e->getMessage());}
    }

    public function testStorageKeyTraversalIsRejected(): void
    {
        $this->expectException(RuntimeException::class);$this->expectExceptionMessage('ASSET_STORAGE_KEY_INVALID');
        (new CertificateAssetStorageService($this->directory))->resolve('../secret');
    }

    public function testMigrationAndTemplateBindingContractExist(): void
    {
        $migration=file_get_contents(APPPATH.'Phase2/Database/Migrations/2026-09-23-000018_GovernCertificateAssets.php');
        $governance=file_get_contents(APPPATH.'Services/CertificateTemplateGovernanceService.php');
        foreach(['certificate_assets','certificate_asset_versions','certificate_template_asset_bindings','ON DELETE RESTRICT'] as $needle)self::assertStringContainsString($needle,$migration);
        foreach(['FONT_NOT_EMBEDDABLE','ASSET_RENDERER_UNSUPPORTED','syncAssetBindings','asset_version_ids'] as $needle)self::assertStringContainsString($needle,$governance);
    }
}
