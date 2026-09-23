<?php

namespace App\Services;

use DateTimeImmutable;
use InvalidArgumentException;

class EmploymentServiceDurationService
{
    public function validateRequiredStartDate(mixed $value, ?string $referenceDate = null): string
    {
        $value = is_string($value) ? trim($value) : '';
        if ($value === '') throw new InvalidArgumentException('Employment start date is required.');
        $start = $this->strictDate($value, 'Enter a valid employment start date.');
        $reference = $this->strictDate($referenceDate ?: date('Y-m-d'), 'Enter a valid reference date.');
        if ($start > $reference) throw new InvalidArgumentException('Employment start date cannot be in the future.');
        return $start->format('Y-m-d');
    }

    public function calculate(?string $startDate, ?string $referenceDate = null): ?array
    {
        if ($startDate === null || trim($startDate) === '') return null;
        $start = $this->strictDate($startDate, 'Enter a valid employment start date.');
        $reference = $this->strictDate($referenceDate ?: date('Y-m-d'), 'Enter a valid reference date.');
        if ($start > $reference) throw new InvalidArgumentException('Employment start date cannot be after the reference date.');
        $difference = $start->diff($reference);
        $parts = [];
        if ($difference->y) $parts[] = $difference->y . ' ' . ($difference->y === 1 ? 'year' : 'years');
        if ($difference->m || ! $parts) $parts[] = $difference->m . ' ' . ($difference->m === 1 ? 'month' : 'months');
        return [
            'years' => $difference->y,
            'months' => $difference->m,
            'days' => $difference->d,
            'total_months' => ($difference->y * 12) + $difference->m,
            'display' => implode(', ', $parts),
            'reference_date' => $reference->format('Y-m-d'),
        ];
    }

    private function strictDate(string $value, string $message): DateTimeImmutable
    {
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', trim($value));
        $errors = DateTimeImmutable::getLastErrors();
        if (! $date || ($errors !== false && ($errors['warning_count'] || $errors['error_count'])) || $date->format('Y-m-d') !== trim($value)) {
            throw new InvalidArgumentException($message);
        }
        return $date;
    }
}
