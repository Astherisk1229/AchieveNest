<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

class ProvisioningValidation extends BaseConfig
{
    public int $studentIdMinimumLength = 5;
    public int $institutionalIdMaximumLength = 50;
    public int $earliestAcademicYearStart = 2025;
    public int $availabilityCapacity = 30;
    public int $availabilityWindowSeconds = 60;

    /** @var list<string> Canonical student year levels (Graduate is excluded) */
    public array $canonicalYearLevels = [
        '1st Year',
        '2nd Year',
        '3rd Year',
        '4th Year',
        '5th Year',
    ];

    /** @var list<string> Canonical sex values */
    public array $canonicalSexValues = [
        'Male',
        'Female',
        'Prefer not to say',
    ];

    public function __construct()
    {
        parent::__construct();
        $this->studentIdMinimumLength = max(5, (int) env('provisioning.studentIdMinimumLength', 5));
        $this->institutionalIdMaximumLength = min(50, max($this->studentIdMinimumLength, (int) env('provisioning.institutionalIdMaximumLength', 50)));
        $this->earliestAcademicYearStart = (int) env('provisioning.earliestAcademicYearStart', 2025);
        $this->availabilityCapacity = max(1, (int) env('provisioning.availabilityCapacity', 30));
        $this->availabilityWindowSeconds = max(1, (int) env('provisioning.availabilityWindowSeconds', 60));
    }
}

