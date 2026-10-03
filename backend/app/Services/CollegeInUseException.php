<?php

namespace App\Services;

use RuntimeException;

/** Raised when a College cannot be deleted because other records still reference it. */
class CollegeInUseException extends RuntimeException
{
    /** @param array<int, array{table:string,label:string,count:int}> $references */
    public function __construct(private array $references)
    {
        parent::__construct('COLLEGE_IN_USE: This College is still referenced by other records and cannot be deleted.');
    }

    public function references(): array
    {
        return $this->references;
    }
}
