<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

final class RailwayPhpRuntimeConfigurationTest extends TestCase
{
    public function testRailpackPhpRequestLimitsAreFiniteAndCoverApplicationUploads(): void
    {
        $configuration = parse_ini_file(dirname(__DIR__, 2) . '/php.ini');

        $this->assertIsArray($configuration);
        $this->assertSame('10M', $configuration['upload_max_filesize'] ?? null);
        $this->assertSame('12M', $configuration['post_max_size'] ?? null);
    }
}
