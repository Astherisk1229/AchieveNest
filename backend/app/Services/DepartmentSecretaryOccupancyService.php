<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;

final class DepartmentSecretaryOccupancyService
{
    public const POSITION_TITLE = 'Department Secretary';

    public function isDepartmentSecretary(?string $positionTitle): bool
    {
        return strcasecmp(trim((string) $positionTitle), self::POSITION_TITLE) === 0;
    }

    /**
     * Must be called inside the caller's transaction. The placement row lock
     * serializes competing registrations/updates for the same placement.
     */
    public function findConflict(
        BaseConnection $db,
        ?string $positionTitle,
        ?string $collegeId,
        ?string $administrativeUnitId,
        ?string $excludeProfileId = null
    ): ?array {
        if (! $this->isDepartmentSecretary($positionTitle)) {
            return null;
        }

        $isCollege = $collegeId !== null && $collegeId !== '';
        $placementId = $isCollege ? $collegeId : $administrativeUnitId;
        if ($placementId === null || $placementId === '') {
            return null;
        }

        $placementTable = $isCollege ? 'colleges' : 'administrative_units';
        $db->query("SELECT id FROM {$placementTable} WHERE id = ? FOR UPDATE", [$placementId]);

        $affiliationTable = $isCollege
            ? 'personnel_college_affiliations'
            : 'personnel_administrative_unit_affiliations';
        $placementColumn = $isCollege ? 'college_id' : 'administrative_unit_id';

        $builder = $db->table("{$affiliationTable} a")
            ->select('p.id AS personnel_id, p.full_name')
            ->join('personnel_profiles pp', 'pp.profile_id = a.personnel_profile_id')
            ->join('profiles p', 'p.id = pp.profile_id')
            ->where("a.{$placementColumn}", $placementId)
            ->where('a.is_active', 1)
            ->where('p.status', 'active')
            ->where('LOWER(TRIM(pp.position_title))', strtolower(self::POSITION_TITLE));

        if ($excludeProfileId !== null && $excludeProfileId !== '') {
            $builder->where('p.id !=', $excludeProfileId);
        }

        $holder = $builder->get()->getRowArray();
        if ($holder === null) {
            return null;
        }

        $placement = $db->table($placementTable)
            ->select('id, name, code')
            ->where('id', $placementId)
            ->get()->getRowArray();

        return [
            'code' => 'POSITION_OCCUPIED',
            'message' => self::POSITION_TITLE . ' is already assigned to an active person in this placement.',
            'current_holder' => [
                'personnel_id' => $holder['personnel_id'],
                'name' => $holder['full_name'],
                'placement' => $placement,
            ],
        ];
    }
}
