<?php

namespace App\Services;

use RuntimeException;

class DefenseDemoConfigService
{
    public function requirePassword(): string
    {
        $password = trim((string) env('ACHIEVENEST_DEMO_PASSWORD'));

        if ($password === '') {
            throw new RuntimeException(
                'ACHIEVENEST_DEMO_PASSWORD is required for defense demo fixtures. Please configure it in your local backend/.env file.'
            );
        }

        return $password;
    }

    public function requiredCollegeCode(): string
    {
        return 'CBA';
    }

    public function requiredProgramACode(): string
    {
        return 'BSA';
    }

    public function requiredProgramBCode(): string
    {
        return 'BSBA-FM';
    }

    public function requiredAdministrativeUnitCode(): string
    {
        return 'HR';
    }
}
