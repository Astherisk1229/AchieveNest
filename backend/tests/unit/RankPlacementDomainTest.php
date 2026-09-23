<?php

namespace Tests\Unit;

use CodeIgniter\Test\CIUnitTestCase;

final class RankPlacementDomainTest extends CIUnitTestCase
{
    private function source(string $path): string { return file_get_contents(ROOTPATH.$path); }

    public function testFoundationKeepsClassificationSeparateAndDoesNotSeedNonTeachingPolicy(): void
    {
        $migration=$this->source('app/Database/Migrations/2026-09-15-000004_CreateRankPlacementDomain.php');
        self::assertStringContainsString("personnel_group IN ('FACULTY','NON_TEACHING_FACULTY')",$migration);
        self::assertStringNotContainsString("['personnel_group'=>'NON_TEACHING_FACULTY'",$migration);
        self::assertStringContainsString("configuration_status='configured'",$migration);
    }

    public function testHistoryPreservesCurrentAndPendingUniquenessWithoutBackfill(): void
    {
        $migration=$this->source('app/Database/Migrations/2026-09-15-000004_CreateRankPlacementDomain.php');
        self::assertStringContainsString('uq_personnel_current_placement',$migration);
        self::assertStringContainsString('uq_personnel_pending_placement',$migration);
        self::assertStringNotContainsString('INSERT INTO personnel_rank_placements',$migration);
        self::assertStringContainsString('correction_of_placement_id',$migration);
        self::assertStringContainsString('cancellation_reason',$migration);
    }

    public function testOnlyConfiguredExactCatalogGroupsAreMapped(): void
    {
        $migration=$this->source('app/Database/Migrations/2026-09-15-000004_CreateRankPlacementDomain.php');
        self::assertStringContainsString("g.configuration_status='configured'",$migration);
        self::assertStringContainsString('Existing part-time catalog qualification label omits SOCIAL WORKER',$migration);
    }

    public function testResolverRejectsCrossPlacementAndUnsupportedPolicy(): void
    {
        $service=$this->source('app/Services/RankPlacementCatalogService.php');
        self::assertStringContainsString('RANK_OUTSIDE_PLACEMENT',$service);
        self::assertStringContainsString('RANK_PLACEMENT_UNRESOLVED',$service);
        self::assertStringContainsString("where('m.rank_placement_group_id',\$placementGroupId)",$service);
        self::assertStringContainsString("where('t.transition_type','normal_sequential')",$service);
    }
}
