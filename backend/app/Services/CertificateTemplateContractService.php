<?php

namespace App\Services;

use InvalidArgumentException;

final class CertificateTemplateContractService
{
    public const PLACEHOLDERS=['recipient_name','activity_title','activity_type','activity_date','date_range','organizer_name','student_role','contribution_role','recognition_title','placement','scope','granting_body','issuer_name','issued_date','certificate_number','verification_url'];

    public function extract(string $content): array
    {
        preg_match_all('/{{\s*([a-z][a-z0-9_]*)\s*}}/i', $content, $matches);
        return array_values(array_unique(array_map('strtolower',$matches[1] ?? [])));
    }

    public function validatePublication(string $content): array
    {
        $unknown=array_values(array_diff($this->extract($content), self::PLACEHOLDERS));
        if ($unknown !== []) throw new InvalidArgumentException('Unknown certificate placeholders: '.implode(', ',$unknown));
        return $this->extract($content);
    }

    public function render(string $content, array $values, array $contract): string
    {
        foreach ($contract as $item) {
            $name=(string)($item['name'] ?? ''); $type=strtoupper((string)($item['requirement_type'] ?? 'OPTIONAL'));
            if ($type === 'REQUIRED' && trim((string)($values[$name] ?? '')) === '') throw new InvalidArgumentException("Required placeholder unresolved: {$name}");
        }
        $rendered=preg_replace_callback('/{{\s*([a-z][a-z0-9_]*)\s*}}/i', static fn($m)=>(string)($values[strtolower($m[1])] ?? ''), $content);
        if (str_contains($rendered,'{{') || str_contains($rendered,'}}')) throw new InvalidArgumentException('Certificate output contains unresolved placeholders.');
        return $rendered;
    }
}
