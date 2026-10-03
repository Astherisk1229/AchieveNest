<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

final class CollegeRequestPayloadContractTest extends TestCase
{
    public function testCollegeCreateAndUpdateUseContentTypeAwarePayloadParsing(): void
    {
        $controller = file_get_contents(
            dirname(__DIR__, 2) . '/app/Controllers/Api/CollegeController.php'
        );

        self::assertIsString($controller);
        self::assertStringContainsString(
            "str_contains(\$contentType, 'application/json')",
            $controller
        );

        foreach (['update', 'create'] as $methodName) {
            $method = $this->methodSource($controller, $methodName);

            self::assertStringContainsString(
                '$payload = $this->getRequestPayload();',
                $method
            );
            self::assertStringNotContainsString('getJSON(', $method);
        }
    }

    private function methodSource(string $source, string $methodName): string
    {
        $start = strpos($source, "public function {$methodName}(");
        self::assertNotFalse($start, "Controller method {$methodName} was not found.");

        $nextMethod = strpos($source, 'public function ', $start + 1);

        return substr(
            $source,
            $start,
            $nextMethod === false ? null : $nextMethod - $start
        );
    }
}
