<?php

namespace App\Services;

/** Validates finalized event facts against the existing Student 01-09 taxonomy. */
final class StudentCategoryMapperRegistry
{
    private const RULES = [
        'ORG_MEMBERSHIP_PARTICIPATION' => ['roles'=>['activity_participant','committee_member','facilitator','organizer','project_contributor']],
        'COMMUNITY_SERVICE_VOLUNTEERISM' => ['roles'=>['participant','volunteer','organizer','initiator','leader']],
        'CHURCH_MINISTRY_INVOLVEMENT' => ['roles'=>['activity_participant','ministry_volunteer','service_role','assigned_responsibility','facilitator','organizer','initiator']],
        'SEMINAR_TRAINING' => ['outcomes'=>['participated','completed']],
        'SPORTS' => ['placements'=>['participant','bronze','3rd','silver','2nd','gold','1st','champion']],
        'SOCIO_CULTURAL_PERFORMING_ARTS' => ['placements'=>['participant','bronze','3rd','silver','2nd','gold','1st','champion']],
        'CAMPUS_JOURNALISM' => ['roles'=>['publication_contributor','contributor','publication_member','publication_officer']],
    ];

    public function validate(array $fact): array
    {
        $code=strtoupper((string)($fact['category_code'] ?? ''));
        $rule=self::RULES[$code] ?? null;
        if ($rule===null) return ['CATEGORY_MAPPING_UNRESOLVED'];
        $role=$this->token($fact['participation_role'] ?? null);
        $outcome=$this->token($fact['verified_engagement_outcome'] ?? null);
        $placement=$this->token($fact['placement'] ?? null);
        if (isset($rule['roles']) && !in_array($role,$rule['roles'],true)) return ['ROLE_NOT_FINALIZED'];
        if (isset($rule['outcomes']) && !in_array($outcome,$rule['outcomes'],true)) return ['RESULT_NOT_FINALIZED'];
        if (isset($rule['placements']) && !in_array($placement,$rule['placements'],true)) return ['RESULT_NOT_FINALIZED'];
        if (empty($fact['subcategory_id'])) return ['SUBCATEGORY_MAPPING_UNRESOLVED'];
        return [];
    }

    private function token(mixed $value): string { return strtolower(trim(str_replace([' / ',' '],['_','_'],(string)$value))); }
}
