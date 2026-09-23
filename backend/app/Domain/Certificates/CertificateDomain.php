<?php

namespace App\Domain\Certificates;

final class CertificateDomain
{
    public const PURPOSE_PARTICIPATION = 'PARTICIPATION';
    public const PURPOSE_COMPLETION = 'COMPLETION';
    public const PURPOSE_APPRECIATION = 'APPRECIATION';
    public const PURPOSE_RECOGNITION = 'RECOGNITION';

    public const PURPOSES = [self::PURPOSE_PARTICIPATION, self::PURPOSE_COMPLETION, self::PURPOSE_APPRECIATION, self::PURPOSE_RECOGNITION];
    public const READINESS_NOT_ELIGIBLE = 'NOT_ELIGIBLE';
    public const READINESS_BLOCKED = 'ELIGIBLE_NOT_ISSUABLE';
    public const READINESS_ISSUABLE = 'ISSUABLE';
    public const LIFECYCLE_ISSUED = 'ISSUED';
    public const LIFECYCLE_SUPERSEDED = 'SUPERSEDED';
    public const LIFECYCLE_REVOKED = 'REVOKED';
    public const TEMPLATE_DRAFT = 'DRAFT';
    public const TEMPLATE_PUBLISHED = 'PUBLISHED';
    public const TEMPLATE_SUPERSEDED = 'SUPERSEDED';

    private function __construct() {}
}
