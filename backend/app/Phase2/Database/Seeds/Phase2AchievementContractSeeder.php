<?php

namespace Phase2\Database\Seeds;

use CodeIgniter\Database\Seeder;
use RuntimeException;

class Phase2AchievementContractSeeder extends Seeder
{
    private const EXPECTED_CONTRACT_COUNT = 84;

    public function run()
    {
        /*
         * Canonical Phase 2 achievement-contract registry.
         *
         * Naming convention intentionally introduced by AchieveNest Phase 2:
         *
         * Student:
         *   S<category-number>-<semantic-code>
         *
         * Faculty:
         *   FAC-<criterion>
         *
         * Non-Teaching Faculty:
         *   NTF-<criterion>
         *
         * IMPORTANT:
         * The physical achievement_contracts.domain CHECK currently uses
         * STUDENT / FACULTY / NTP. Therefore new Non-Teaching Faculty
         * contract codes use the NTF prefix while their persisted domain
         * temporarily remains NTP until a separate controlled domain
         * migration is explicitly approved.
         *
         * No legacy taxonomy UUID is hardcoded here. Student legacy
         * category/subcategory references are resolved from stable codes.
         */

        $contracts = array_merge(
            $this->studentContracts(),
            $this->facultyContracts(),
            $this->ntfContracts()
        );

        $this->assertContractSet($contracts);

        /*
         * Resolve all Student taxonomy references before performing any
         * mutation so a missing or ambiguous reference fails fast.
         */
        foreach ($contracts as &$contract) {
            if ($contract['domain'] !== 'STUDENT') {
                $contract['legacy_category_id'] = null;
                $contract['legacy_subcategory_id'] = null;
                continue;
            }

            $resolved = $this->resolveStudentTaxonomy(
                $contract['category_code'],
                $contract['subcategory_code']
            );

            $contract['legacy_category_id'] = $resolved['category_id'];
            $contract['legacy_subcategory_id'] = $resolved['subcategory_id'];
        }
        unset($contract);

        $this->db->transStart();

        foreach ($contracts as $contract) {
            $this->upsertContract($contract);
        }

        $this->db->transComplete();

        if ($this->db->transStatus() === false) {
            throw new RuntimeException(
                'Phase 2 achievement-contract registry seeding failed.'
            );
        }

        $codes = array_column($contracts, 'contract_code');

        $persistedCount = $this->db
            ->table('achievement_contracts')
            ->whereIn('contract_code', $codes)
            ->countAllResults();

        if ($persistedCount !== self::EXPECTED_CONTRACT_COUNT) {
            throw new RuntimeException(
                'Phase 2 achievement-contract registry verification failed: expected '
                . self::EXPECTED_CONTRACT_COUNT
                . ' canonical contracts, found '
                . $persistedCount
                . '.'
            );
        }
    }

    private function studentContracts(): array
    {
        $definitions = [
            // Student 01 — Leadership Position
            ['S01-SSG', 'SSG / University Student Government Leadership', 'LEADERSHIP_POSITION', 'SSG_UNIVERSITY_GOVERNMENT'],
            ['S01-COLLEGE_COUNCIL', 'Collegiate / College Council Leadership', 'LEADERSHIP_POSITION', 'COLLEGIATE_COLLEGE_COUNCIL'],
            ['S01-CLUB_ORGANIZATION', 'Club / Organization Leadership', 'LEADERSHIP_POSITION', 'CLUB_ORGANIZATION'],
            ['S01-YEAR_LEVEL', 'Year-Level Leadership', 'LEADERSHIP_POSITION', 'YEAR_LEVEL_LEADERSHIP'],

            // Student 02 — Organization Membership / Participation
            ['S02-GENERAL_MEMBER', 'General Member', 'ORG_MEMBERSHIP_PARTICIPATION', 'GENERAL_MEMBER'],
            ['S02-COMMITTEE_MEMBER', 'Committee Member', 'ORG_MEMBERSHIP_PARTICIPATION', 'COMMITTEE_MEMBER'],
            ['S02-ACTIVITY_PARTICIPANT', 'Activity Participant', 'ORG_MEMBERSHIP_PARTICIPATION', 'ACTIVITY_PARTICIPANT'],
            ['S02-FACILITATOR_ORGANIZER', 'Facilitator / Organizer', 'ORG_MEMBERSHIP_PARTICIPATION', 'FACILITATOR_ORGANIZER'],
            ['S02-PROJECT_CONTRIBUTOR', 'Project Contributor', 'ORG_MEMBERSHIP_PARTICIPATION', 'PROJECT_CONTRIBUTOR'],

            // Student 03 — Community Service / Volunteerism
            ['S03-UNIVERSITY_BASED_SERVICE', 'University-Based Service', 'COMMUNITY_SERVICE_VOLUNTEERISM', 'UNIVERSITY_BASED_SERVICE'],
            ['S03-COMMUNITY_BASED_SERVICE', 'Community-Based Service', 'COMMUNITY_SERVICE_VOLUNTEERISM', 'COMMUNITY_BASED_SERVICE'],
            ['S03-CHURCH_BASED_SERVICE', 'Church-Based Service', 'COMMUNITY_SERVICE_VOLUNTEERISM', 'CHURCH_BASED_SERVICE'],
            ['S03-ENVIRONMENTAL_SERVICE', 'Environmental Service', 'COMMUNITY_SERVICE_VOLUNTEERISM', 'ENVIRONMENTAL_SERVICE'],
            ['S03-PEOPLE_DEVELOPMENT_EDUCATIONAL_SERVICE', 'People Development / Educational Service', 'COMMUNITY_SERVICE_VOLUNTEERISM', 'PEOPLE_DEVELOPMENT_EDUCATIONAL_SERVICE'],

            // Student 04 — Church / Ministry Involvement
            ['S04-CAMPUS_MINISTRY', 'Campus Ministry', 'CHURCH_MINISTRY_INVOLVEMENT', 'CAMPUS_MINISTRY'],
            ['S04-PARISH_CHURCH_MINISTRY', 'Parish / Church Ministry', 'CHURCH_MINISTRY_INVOLVEMENT', 'PARISH_CHURCH_MINISTRY'],
            ['S04-CHURCH_ORGANIZATION', 'Church Organization', 'CHURCH_MINISTRY_INVOLVEMENT', 'CHURCH_ORGANIZATION'],
            ['S04-INITIATED_CHURCH_RELATED_ACTIVITY', 'Initiated Church-Related Activity', 'CHURCH_MINISTRY_INVOLVEMENT', 'INITIATED_CHURCH_RELATED_ACTIVITY'],

            // Student 05 — Seminar / Training
            ['S05-LEADERSHIP_DEVELOPMENT', 'Leadership Development', 'SEMINAR_TRAINING', 'LEADERSHIP_DEVELOPMENT'],
            ['S05-PERSONAL_PROFESSIONAL_DEVELOPMENT', 'Personal / Professional Development', 'SEMINAR_TRAINING', 'PERSONAL_PROFESSIONAL_DEVELOPMENT'],
            ['S05-CAMPUS_JOURNALISM_DEVELOPMENT', 'Campus Journalism Development', 'SEMINAR_TRAINING', 'CAMPUS_JOURNALISM_DEVELOPMENT'],
            ['S05-SPORTS_DEVELOPMENT', 'Sports Development', 'SEMINAR_TRAINING', 'SPORTS_DEVELOPMENT'],
            ['S05-SOCIO_CULTURAL_PERFORMING_ARTS_DEVELOPMENT', 'Socio-Cultural / Performing Arts Development', 'SEMINAR_TRAINING', 'SOCIO_CULTURAL_PERFORMING_ARTS_DEVELOPMENT'],
            ['S05-COMMUNITY_SERVICE_VOLUNTEER_DEVELOPMENT', 'Community Service / Volunteer Development', 'SEMINAR_TRAINING', 'COMMUNITY_SERVICE_VOLUNTEER_DEVELOPMENT'],
            ['S05-SPIRITUAL_FORMATION_DEVELOPMENT', 'Spiritual / Formation Development', 'SEMINAR_TRAINING', 'SPIRITUAL_FORMATION_DEVELOPMENT'],
            ['S05-OTHER_SEMINAR_TRAINING', 'Other Seminar / Training', 'SEMINAR_TRAINING', 'OTHER_SEMINAR_TRAINING'],

            // Student 06 — Citation / Recognition
            ['S06-LEADERSHIP', 'Leadership Recognition', 'CITATION_RECOGNITION', 'LEADERSHIP'],
            ['S06-ORGANIZATION_MEMBERSHIP', 'Organization / Membership Recognition', 'CITATION_RECOGNITION', 'ORGANIZATION_MEMBERSHIP'],
            ['S06-COMMUNITY_SERVICE_VOLUNTEERISM', 'Community Service / Volunteerism Recognition', 'CITATION_RECOGNITION', 'COMMUNITY_SERVICE_VOLUNTEERISM'],
            ['S06-CHURCH_MINISTRY', 'Church / Ministry Recognition', 'CITATION_RECOGNITION', 'CHURCH_MINISTRY'],
            ['S06-CAMPUS_JOURNALISM', 'Campus Journalism Recognition', 'CITATION_RECOGNITION', 'CAMPUS_JOURNALISM'],
            ['S06-SPORTS', 'Sports Recognition', 'CITATION_RECOGNITION', 'SPORTS'],
            ['S06-SOCIO_CULTURAL_PERFORMING_ARTS', 'Socio-Cultural / Performing Arts Recognition', 'CITATION_RECOGNITION', 'SOCIO_CULTURAL_PERFORMING_ARTS'],
            ['S06-OTHER_NON_ACADEMIC_RECOGNITION', 'Other Non-Academic Recognition', 'CITATION_RECOGNITION', 'OTHER_NON_ACADEMIC_RECOGNITION'],

            // Student 07 — Sports
            ['S07-BASKETBALL', 'Basketball', 'SPORTS', 'BASKETBALL'],
            ['S07-VOLLEYBALL', 'Volleyball', 'SPORTS', 'VOLLEYBALL'],
            ['S07-ATHLETICS', 'Athletics', 'SPORTS', 'ATHLETICS'],
            ['S07-SWIMMING', 'Swimming', 'SPORTS', 'SWIMMING'],
            ['S07-BADMINTON', 'Badminton', 'SPORTS', 'BADMINTON'],
            ['S07-TABLE_TENNIS', 'Table Tennis', 'SPORTS', 'TABLE_TENNIS'],
            ['S07-CHESS', 'Chess', 'SPORTS', 'CHESS'],
            ['S07-FOOTBALL', 'Football', 'SPORTS', 'FOOTBALL'],
            ['S07-SEPAK_TAKRAW', 'Sepak Takraw', 'SPORTS', 'SEPAK_TAKRAW'],
            ['S07-OTHER_APPROVED_SPORT', 'Other Approved Sport', 'SPORTS', 'OTHER_APPROVED_SPORT'],

            // Student 08 — Socio-Cultural / Performing Arts
            ['S08-DANCE', 'Dance', 'SOCIO_CULTURAL_PERFORMING_ARTS', 'DANCE'],
            ['S08-VOCAL_SINGING', 'Vocal / Singing', 'SOCIO_CULTURAL_PERFORMING_ARTS', 'VOCAL_SINGING'],
            ['S08-INSTRUMENTAL', 'Instrumental', 'SOCIO_CULTURAL_PERFORMING_ARTS', 'INSTRUMENTAL'],
            ['S08-THEATER', 'Theater', 'SOCIO_CULTURAL_PERFORMING_ARTS', 'THEATER'],
            ['S08-CULTURAL_PERFORMANCE', 'Cultural Performance', 'SOCIO_CULTURAL_PERFORMING_ARTS', 'CULTURAL_PERFORMANCE'],
            ['S08-PERFORMING_ARTS', 'Performing Arts', 'SOCIO_CULTURAL_PERFORMING_ARTS', 'PERFORMING_ARTS'],
            ['S08-OTHER_APPROVED_DISCIPLINE', 'Other Approved Discipline', 'SOCIO_CULTURAL_PERFORMING_ARTS', 'OTHER_APPROVED_DISCIPLINE'],

            // Student 09 — Campus Journalism
            ['S09-NEWS_ITEM', 'News Item', 'CAMPUS_JOURNALISM', 'NEWS_ITEM'],
            ['S09-LITERARY_WORK', 'Literary Work', 'CAMPUS_JOURNALISM', 'LITERARY_WORK'],
            ['S09-COLUMN', 'Column', 'CAMPUS_JOURNALISM', 'COLUMN'],
            ['S09-EDITORIAL', 'Editorial', 'CAMPUS_JOURNALISM', 'EDITORIAL'],
            ['S09-PUBLICATION_MEMBER_CONTRIBUTOR', 'Publication Member / Contributor', 'CAMPUS_JOURNALISM', 'PUBLICATION_MEMBER_CONTRIBUTOR'],
            ['S09-PUBLICATION_OFFICER', 'Publication Officer', 'CAMPUS_JOURNALISM', 'PUBLICATION_OFFICER'],
        ];

        $contracts = [];

        foreach ($definitions as [$code, $name, $category, $subcategory]) {
            $contracts[] = [
                'contract_code' => $code,
                'domain' => 'STUDENT',
                'display_name' => $name,
                'category_code' => $category,
                'subcategory_code' => $subcategory,
                'criterion_code' => null,
                'contract_version' => 1,
                'is_active' => 1,
            ];
        }

        return $contracts;
    }

    private function facultyContracts(): array
    {
        $definitions = [
            ['FAC-A1', 'Education', 'A.1'],
            ['FAC-A2', 'Active Membership to Professional Organizations', 'A.2'],
            ['FAC-A3', 'Attendance to Seminars / Trainings', 'A.3'],

            ['FAC-B1', 'Invited as Guest Lecturer / Consultant / Judge / Resource Person', 'B.1'],
            ['FAC-B2', 'Publication', 'B.2'],
            ['FAC-B3', 'Conduct of Research', 'B.3'],
            ['FAC-B4', 'Recognition / Awards', 'B.4'],
            ['FAC-B5', 'Production of Instructional Materials', 'B.5'],
            ['FAC-B6', 'Creative Work', 'B.6'],

            ['FAC-C1A', 'Moderator of Clubs / Organizations', 'C.1.a'],
            ['FAC-C1B', 'Coach / Trainer', 'C.1.b'],
            ['FAC-C1C', 'Membership in Working Committees', 'C.1.c'],
            ['FAC-C1D', 'Rendered Service in School Activities', 'C.1.d'],

            ['FAC-C2E', 'Active Involvement in Church Activities', 'C.2.e'],
            ['FAC-C2F', 'Active Involvement in Community / Civic Activities', 'C.2.f'],
            ['FAC-C2G', 'Support to Charity and Community Projects', 'C.2.g'],

            ['FAC-C3', 'NDMU Service Credit / Years of Service', 'C.3'],
        ];

        return $this->criterionContracts('FACULTY', $definitions);
    }

    private function ntfContracts(): array
    {
        $definitions = [
            ['NTF-B1A', 'Moderator or Officer of Clubs', 'B.1.a'],
            ['NTF-B1B', 'Trainer / Coach', 'B.1.b'],
            ['NTF-B1C', 'Membership in Working Committees', 'B.1.c'],
            ['NTF-B1D', 'Rendered Service in School Activities', 'B.1.d'],

            ['NTF-B2A', 'Active Involvement in Church Activities', 'B.2.a'],
            ['NTF-B2B', 'Active Involvement in Community / Civic Activities', 'B.2.b'],
            ['NTF-B2C', 'Support to Charity and Community Projects', 'B.2.c'],

            ['NTF-B3', 'Years of Service', 'B.3'],
            ['NTF-B4', 'Invited as Judge / Lecturer / Resource Person', 'B.4'],
            ['NTF-B5', 'Recognition / Meritorious Award', 'B.5'],
        ];

        /*
         * NTP is the existing stable physical domain value.
         * NTF is the corrected human-facing abbreviation and contract prefix.
         */
        return $this->criterionContracts('NTP', $definitions);
    }

    private function criterionContracts(string $domain, array $definitions): array
    {
        $contracts = [];

        foreach ($definitions as [$code, $name, $criterion]) {
            $contracts[] = [
                'contract_code' => $code,
                'domain' => $domain,
                'display_name' => $name,
                'category_code' => null,
                'subcategory_code' => null,
                'criterion_code' => $criterion,
                'contract_version' => 1,
                'is_active' => 1,
                'legacy_category_id' => null,
                'legacy_subcategory_id' => null,
            ];
        }

        return $contracts;
    }

    private function resolveStudentTaxonomy(
        string $categoryCode,
        string $subcategoryCode
    ): array {
        $categories = $this->db
            ->table('portfolio_categories')
            ->where('code', $categoryCode)
            ->get()
            ->getResultArray();

        if (count($categories) !== 1) {
            throw new RuntimeException(
                "Expected exactly one portfolio category for code {$categoryCode}; found "
                . count($categories)
                . '.'
            );
        }

        $category = $categories[0];

        $subcategories = $this->db
            ->table('portfolio_subcategories')
            ->where('category_id', $category['id'])
            ->where('code', $subcategoryCode)
            ->get()
            ->getResultArray();

        if (count($subcategories) !== 1) {
            throw new RuntimeException(
                "Expected exactly one portfolio subcategory for {$categoryCode}/{$subcategoryCode}; found "
                . count($subcategories)
                . '.'
            );
        }

        return [
            'category_id' => $category['id'],
            'subcategory_id' => $subcategories[0]['id'],
        ];
    }

    private function upsertContract(array $contract): void
    {
        $existing = $this->db
            ->table('achievement_contracts')
            ->where('contract_code', $contract['contract_code'])
            ->get()
            ->getRowArray();

        if ($existing === null) {
            $this->db
                ->table('achievement_contracts')
                ->insert($contract);

            return;
        }

        $this->db
            ->table('achievement_contracts')
            ->where('contract_code', $contract['contract_code'])
            ->update($contract);
    }

    private function assertContractSet(array $contracts): void
    {
        if (count($contracts) !== self::EXPECTED_CONTRACT_COUNT) {
            throw new RuntimeException(
                'Canonical achievement-contract definition count mismatch: expected '
                . self::EXPECTED_CONTRACT_COUNT
                . ', found '
                . count($contracts)
                . '.'
            );
        }

        $codes = array_column($contracts, 'contract_code');

        if (count(array_unique($codes)) !== self::EXPECTED_CONTRACT_COUNT) {
            throw new RuntimeException(
                'Canonical achievement-contract definitions contain duplicate contract codes.'
            );
        }

        foreach ($contracts as $contract) {
            if (
                trim((string) $contract['contract_code']) === ''
                || trim((string) $contract['display_name']) === ''
            ) {
                throw new RuntimeException(
                    'Canonical achievement-contract definitions contain a blank required identifier.'
                );
            }
        }
    }
}
