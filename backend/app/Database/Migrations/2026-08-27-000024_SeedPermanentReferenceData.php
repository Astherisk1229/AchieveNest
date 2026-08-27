<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class SeedPermanentReferenceData extends Migration
{
    public function up()
    {
        $units = [
            ['QAPS','Quality Assurance, Admissions, Promotions, and Scholarships'], ['IRO','International Relations'],
            ['FIN','Finance / Comptroller'], ['CMRE','CMRE'], ['LIB_EMC','Libraries and EMC'],
            ['RPC','Research and Publication Center'], ['HR','Human Resources Office'], ['GTC','Guidance and Testing Center'],
            ['PPS','Physical Plant & Security'], ['OSAD','Student Affairs & Development'], ['ATH','Athletics and Sports'],
            ['GHDO','Gender and Human Development Office'], ['CEPE','Community Extension and Peace & Environment'],
            ['CM','Campus Ministry'], ['ICT','Information and Communications Technology'], ['DPO','Data Protection'],
            ['ETHICS','Ethics Committee'], ['IPO','Intellectual Property Office'], ['SC_NSTP','Socio-Cultural & NSTP'],
        ];
        foreach ($units as [$code,$name]) {
            $this->db->query(<<<'SQL'
INSERT INTO public.administrative_units(code,name,unit_type,college_id,status)
VALUES (?,?,'central_office',NULL,'active')
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name,status='active',updated_at=now()
SQL, [$code,$name]);
        }

        $categories = [
            ['LEADERSHIP_POSITION','Leadership Position','Use this only for an official leadership position held in SSG, a College/Collegiate Council, a Club/Organization, or a Year-Level body.',1],
            ['ORG_MEMBERSHIP_PARTICIPATION','Organization Membership / Participation','Use this for organization membership, committee participation, activity involvement, facilitation, organizing, or documented contributions when the record is not primarily a leadership position.',2],
            ['COMMUNITY_SERVICE_VOLUNTEERISM','Community Service / Volunteerism','Use this for outreach, volunteer work, community extension, environmental service, or other service-oriented involvement.',3],
            ['CHURCH_MINISTRY_INVOLVEMENT','Church / Ministry Involvement','Use this for campus ministry, parish/church ministry, church organizations, church-related service, or an initiated church-related activity.',4],
            ['SEMINAR_TRAINING','Seminar / Training','Use this for seminars, workshops, trainings, conferences, congresses, certifications, and similar development activities.',5],
            ['CITATION_RECOGNITION','Citation / Recognition','Use this for verified non-academic citations, commendations, or recognitions that are not already captured as a sports or socio-cultural competition placement.',6],
            ['SPORTS','Sports','Use this for athletic participation, sports meets or competitions, and sports placements or medals.',7],
            ['SOCIO_CULTURAL_PERFORMING_ARTS','Socio-Cultural / Performing Arts','Use this for dance, vocal, instrumental, theater, cultural performance, and related competitions or placements.',8],
            ['CAMPUS_JOURNALISM','Campus Journalism','Use this for news, literary works, columns, editorials, campus publication membership/contribution, or publication officer roles.',9],
        ];
        foreach ($categories as [$code,$name,$description,$sort]) {
            $this->db->query(<<<'SQL'
INSERT INTO public.portfolio_categories(code,name,description,status,sort_order) VALUES (?,?,?,'active',?)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,status='active',sort_order=EXCLUDED.sort_order
SQL, [$code,$name,$description,$sort]);
        }

        $subcategoryRows = [
            'LEADERSHIP_POSITION' => [
                ['SSG_UNIVERSITY_GOVERNMENT','SSG / University Student Government','For an official position in the university-wide student government.'],
                ['COLLEGIATE_COLLEGE_COUNCIL','Collegiate / College Council','For an official position in a college or collegiate student council.'],
                ['CLUB_ORGANIZATION','Club / Organization','For an officer or official leadership position in a recognized club or organization.'],
                ['YEAR_LEVEL_LEADERSHIP','Year-Level Leadership','For an official year-level representative or recognized year-level leadership position.'],
            ],
            'ORG_MEMBERSHIP_PARTICIPATION' => [
                ['GENERAL_MEMBER','General Member','For verified membership without an officer position.'],
                ['COMMITTEE_MEMBER','Committee Member','For participation in a committee or working group.'],
                ['ACTIVITY_PARTICIPANT','Activity Participant','For verified participation in an official organization activity.'],
                ['FACILITATOR_ORGANIZER','Facilitator / Organizer','For documented facilitation or organizing responsibility.'],
                ['PROJECT_CONTRIBUTOR','Project Contributor','For a documented contribution to an organization project or program.'],
            ],
            'COMMUNITY_SERVICE_VOLUNTEERISM' => [
                ['UNIVERSITY_BASED_SERVICE','University-Based Service','For outreach, volunteerism, or extension conducted through the university or a university unit.'],
                ['COMMUNITY_BASED_SERVICE','Community-Based Service','For barangay/community outreach, volunteer work, extension, or service activities.'],
                ['CHURCH_BASED_SERVICE','Church-Based Service','For service or outreach conducted through a church/ministry context when the evidence is primarily a service activity.'],
                ['ENVIRONMENTAL_SERVICE','Environmental Service','For clean-ups, tree planting, environmental campaigns, and similar service activities.'],
                ['PEOPLE_DEVELOPMENT_EDUCATIONAL_SERVICE','People Development / Educational Service','For tutorials, formation, educational outreach, livelihood, or people-development activities.'],
            ],
            'CHURCH_MINISTRY_INVOLVEMENT' => [
                ['CAMPUS_MINISTRY','Campus Ministry','For involvement in university/campus ministry.'],
                ['PARISH_CHURCH_MINISTRY','Parish / Church Ministry','For parish or church ministry involvement.'],
                ['CHURCH_ORGANIZATION','Church Organization','For membership or involvement in a recognized church organization.'],
                ['INITIATED_CHURCH_RELATED_ACTIVITY','Initiated Church-Related Activity','For a church-related activity that the student initiated or led.'],
            ],
            'SEMINAR_TRAINING' => [
                ['LEADERSHIP_DEVELOPMENT','Leadership Development','Leadership seminars, student-leader congresses, governance workshops, leadership camps, or leadership training.'],
                ['PERSONAL_PROFESSIONAL_DEVELOPMENT','Personal / Professional Development','General career, communication, employability, productivity, professional, or personal-growth activities.'],
                ['CAMPUS_JOURNALISM_DEVELOPMENT','Campus Journalism Development','Writing, editorial, publication, journalism, or media-related seminars and training.'],
                ['SPORTS_DEVELOPMENT','Sports Development','Sports clinics, athletic development, coaching, or sports-related training.'],
                ['SOCIO_CULTURAL_PERFORMING_ARTS_DEVELOPMENT','Socio-Cultural / Performing Arts Development','Dance, music, theater, cultural performance, or performing-arts development activities.'],
                ['COMMUNITY_SERVICE_VOLUNTEER_DEVELOPMENT','Community Service / Volunteer Development','Volunteer orientation, outreach training, community-engagement, or service-development activities.'],
                ['SPIRITUAL_FORMATION_DEVELOPMENT','Spiritual / Formation Development','Faith formation, ministry formation, spiritual-development, or related training.'],
                ['OTHER_SEMINAR_TRAINING','Other Seminar / Training','For legitimate development activities that do not fit the defined areas.'],
            ],
            'CITATION_RECOGNITION' => [
                ['LEADERSHIP','Leadership','For a non-competition leadership citation or recognition.'],
                ['ORGANIZATION_MEMBERSHIP','Organization / Membership','For recognition related to organization involvement or membership.'],
                ['COMMUNITY_SERVICE_VOLUNTEERISM','Community Service / Volunteerism','For volunteerism, outreach, or community-service recognition.'],
                ['CHURCH_MINISTRY','Church / Ministry','For a church/ministry-related citation or recognition.'],
                ['CAMPUS_JOURNALISM','Campus Journalism','For journalism/publication recognition not already represented by another structured competition record.'],
                ['SPORTS','Sports','For a non-placement sports recognition.'],
                ['SOCIO_CULTURAL_PERFORMING_ARTS','Socio-Cultural / Performing Arts','For a non-placement socio-cultural or performing-arts recognition.'],
                ['OTHER_NON_ACADEMIC_RECOGNITION','Other Non-Academic Recognition','For another verified non-academic citation that does not fit the listed areas.'],
            ],
            'SPORTS' => [
                ['BASKETBALL','Basketball',null], ['VOLLEYBALL','Volleyball',null], ['ATHLETICS','Athletics',null],
                ['SWIMMING','Swimming',null], ['BADMINTON','Badminton',null], ['TABLE_TENNIS','Table Tennis',null],
                ['CHESS','Chess',null], ['FOOTBALL','Football',null], ['SEPAK_TAKRAW','Sepak Takraw',null],
                ['OTHER_APPROVED_SPORT','Other Approved Sport',null],
            ],
            'SOCIO_CULTURAL_PERFORMING_ARTS' => [
                ['DANCE','Dance',null], ['VOCAL_SINGING','Vocal / Singing',null], ['INSTRUMENTAL','Instrumental',null],
                ['THEATER','Theater',null], ['CULTURAL_PERFORMANCE','Cultural Performance',null],
                ['PERFORMING_ARTS','Performing Arts',null], ['OTHER_APPROVED_DISCIPLINE','Other Approved Discipline',null],
            ],
            'CAMPUS_JOURNALISM' => [
                ['NEWS_ITEM','News Item','For verified news writing or publication output.'],
                ['LITERARY_WORK','Literary Work','For verified literary work or publication.'],
                ['COLUMN','Column','For a verified column.'], ['EDITORIAL','Editorial','For a verified editorial.'],
                ['PUBLICATION_MEMBER_CONTRIBUTOR','Publication Member / Contributor','For staff, member, or contributor involvement in a campus publication.'],
                ['PUBLICATION_OFFICER','Publication Officer','For an official officer/editorial leadership role in a campus publication.'],
            ],
        ];

        $metadata = $this->metadataRequirements();
        foreach ($subcategoryRows as $categoryCode => $rows) {
            foreach ($rows as $offset => [$code,$name,$description]) {
                $this->db->query(<<<'SQL'
INSERT INTO public.portfolio_subcategories(category_id,code,name,description,metadata_requirements,status,sort_order)
SELECT c.id,?,?,?,?, 'active',? FROM public.portfolio_categories c WHERE c.code=?
ON CONFLICT (category_id,code) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,
 metadata_requirements=EXCLUDED.metadata_requirements,status='active',sort_order=EXCLUDED.sort_order
SQL, [$code,$name,$description,json_encode($metadata[$categoryCode], JSON_UNESCAPED_SLASHES),$offset+1,$categoryCode]);
            }
        }

        $this->db->query(<<<'SQL'
DO $$ DECLARE n integer; BEGIN
 SELECT count(*) INTO n FROM public.portfolio_categories WHERE status='active';
 IF n<>9 THEN RAISE EXCEPTION 'Permanent taxonomy requires exactly 9 active categories, found %',n; END IF;
 SELECT count(*) INTO n FROM public.portfolio_subcategories s JOIN public.portfolio_categories c ON c.id=s.category_id
 WHERE s.status='active' AND c.code IN ('LEADERSHIP_POSITION','ORG_MEMBERSHIP_PARTICIPATION','COMMUNITY_SERVICE_VOLUNTEERISM','CHURCH_MINISTRY_INVOLVEMENT','SEMINAR_TRAINING','CITATION_RECOGNITION','SPORTS','SOCIO_CULTURAL_PERFORMING_ARTS','CAMPUS_JOURNALISM');
 IF n<>57 THEN RAISE EXCEPTION 'Permanent taxonomy requires exactly 57 active subcategories, found %',n; END IF;
END $$;
SQL);
    }

    private function metadataRequirements(): array
    {
        $workflow = ['supporting_evidence_required'=>true,'requires_verification'=>true];
        $core = static fn(array $fields, array $structured=[]): array => ['core_fields'=>$fields,'structured_fields'=>$structured];
        $stored = static fn(string $key,string $label,string $column,bool $required=true): array => ['key'=>$key,'label'=>$label,'storage'=>"student_portfolio_records.{$column}",'required'=>$required];
        $text = static fn(string $key,string $label,bool $required=true): array => ['key'=>$key,'label'=>$label,'type'=>'text','required'=>$required];
        $enum = static fn(string $key,string $label,array $values,bool $required=true): array => ['key'=>$key,'label'=>$label,'type'=>'enum','required'=>$required,'allowed_values'=>$values];
        return [
            'LEADERSHIP_POSITION' => $core([$stored('title','Title','title'),$stored('organization_body','Organization/Body','organizer_or_body'),$stored('start_date','Start Date','start_date'),$stored('end_date','End Date','end_date')],[$text('position','Position')])+$workflow,
            'ORG_MEMBERSHIP_PARTICIPATION' => $core([$stored('activity_project','Activity/Project','title'),$stored('organization','Organization','organizer_or_body'),$stored('date','Date','occurrence_date')],[$text('role_or_contribution','Role or Contribution')])+$workflow,
            'COMMUNITY_SERVICE_VOLUNTEERISM' => $core([$stored('activity','Activity','title'),$stored('organization','Organization','organizer_or_body'),$stored('date','Date','occurrence_date')],[$enum('activity_role','Activity Role',['Participant','Volunteer','Organizer','Initiator','Leader']),$enum('civic_scope','Civic Scope',['Barangay','Municipal','Provincial','National'],false)])+$workflow,
            'CHURCH_MINISTRY_INVOLVEMENT' => $core([$stored('activity','Activity','title'),$stored('ministry_organization','Ministry/Organization','organizer_or_body'),$stored('date','Date','occurrence_date')],[$text('role','Role'),$text('context','Context')])+$workflow,
            'SEMINAR_TRAINING' => $core([$stored('title','Title','title'),$stored('organizer','Organizer','organizer_or_body'),$stored('date','Date','occurrence_date')],[$enum('activity_type','Activity Type',['Seminar','Workshop','Training','Conference','Congress','Certification'])])+$workflow,
            'CITATION_RECOGNITION' => $core([$stored('title','Title','title'),$stored('issuing_body','Issuing Body','organizer_or_body'),$stored('date','Date','occurrence_date')])+$workflow,
            'SPORTS' => $core([$stored('title','Activity or Competition Title','title'),$stored('organizer','Organizer','organizer_or_body'),$stored('event_date','Event Date','occurrence_date',false)],[$enum('event_type_competition','Event Type / Competition',['PRISAA','NDEA','Intramurals / University Meet','Other Approved Competition']),$enum('competition_level','Competition Level',['Local','Regional','National']),$enum('participation_type','Participation Type',['Individual','Team']),$enum('placement_result','Placement / Result',['Participant','Bronze / 3rd Place','Silver / 2nd Place','Gold / 1st Place / Champion']),$text('academic_year','Academic Year',false)])+['validation_rules'=>[['rule'=>'at_least_one_required','fields'=>['event_date','academic_year'],'message'=>'Provide an Event Date or Academic Year.']]]+$workflow,
            'SOCIO_CULTURAL_PERFORMING_ARTS' => $core([$stored('title','Activity or Competition Title','title'),$stored('organizer','Organizer','organizer_or_body'),$stored('date','Date','occurrence_date')],[$enum('event_type_competition','Event Type / Competition',['PRISAA','NDEA or Equivalent','University-Level Competition','Other Approved Event']),$enum('competition_level','Competition Level',['Local','Regional','National']),$enum('participation_type','Participation Type',['Individual','Group / Ensemble']),$enum('placement_result','Placement / Result',['Participant','Bronze / 3rd Place','Silver / 2nd Place','Gold / 1st Place / Champion'])])+$workflow,
            'CAMPUS_JOURNALISM' => $core([$stored('work_activity_title','Work or Activity Title','title'),$stored('publication_organization','Publication/Organization','organizer_or_body'),$stored('date','Date','occurrence_date')],[$text('publication_role','Publication Role',false)])+$workflow,
        ];
    }

    public function down()
    {
        // Permanent reference rows are retained so rollback cannot orphan portfolio records.
    }
}
