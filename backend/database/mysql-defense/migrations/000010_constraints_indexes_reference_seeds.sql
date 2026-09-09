-- ============================================================================
-- Migration: 000010_constraints_indexes_reference_seeds.sql
-- Domain: Active-History Uniqueness, High-Value Indexes, and Authoritative Permanent Reference Seeds
-- Engine: MySQL 8.4.7 (InnoDB, utf8mb4_unicode_ci)
-- ============================================================================

-- ============================================================================
-- SECTION 1: ACTIVE-HISTORY UNIQUENESS CONSTRAINTS
-- Using MySQL Stored Generated Columns with Unique Keys to emulate partial unique indexes
-- ============================================================================

-- 1. Profiles: Exactly one active HR Administrator
ALTER TABLE profiles
    ADD COLUMN active_hr_guard CHAR(36)
    GENERATED ALWAYS AS (CASE WHEN account_type = 'hr_admin' AND status = 'active' THEN id ELSE NULL END) VIRTUAL,
    ADD UNIQUE KEY uq_profiles_one_active_hr_admin (active_hr_guard);

-- 2. Student Program Enrollments: Exactly one active enrollment per student
ALTER TABLE student_program_enrollments
    ADD COLUMN active_student_guard CHAR(36)
    GENERATED ALWAYS AS (CASE WHEN is_active = 1 THEN student_profile_id ELSE NULL END) VIRTUAL,
    ADD UNIQUE KEY uq_active_student_enrollment (active_student_guard);

-- 3. Personnel College Affiliations: Exactly one active college affiliation per academic personnel
ALTER TABLE personnel_college_affiliations
    ADD COLUMN active_personnel_guard CHAR(36)
    GENERATED ALWAYS AS (CASE WHEN is_active = 1 THEN personnel_profile_id ELSE NULL END) VIRTUAL,
    ADD UNIQUE KEY uq_active_personnel_college (active_personnel_guard);

-- 4. Personnel Administrative Unit Affiliations: Exactly one active unit affiliation per non-academic personnel
ALTER TABLE personnel_administrative_unit_affiliations
    ADD COLUMN active_personnel_unit_guard CHAR(36)
    GENERATED ALWAYS AS (CASE WHEN is_active = 1 THEN personnel_profile_id ELSE NULL END) VIRTUAL,
    ADD UNIQUE KEY uq_active_personnel_admin_unit (active_personnel_unit_guard);

-- 5. Dean Assignments: Exactly one active dean per college, and one active dean assignment per personnel
ALTER TABLE dean_assignments
    ADD COLUMN active_college_dean_guard CHAR(36)
    GENERATED ALWAYS AS (CASE WHEN is_active = 1 THEN college_id ELSE NULL END) VIRTUAL,
    ADD COLUMN active_personnel_dean_guard CHAR(36)
    GENERATED ALWAYS AS (CASE WHEN is_active = 1 THEN personnel_profile_id ELSE NULL END) VIRTUAL,
    ADD UNIQUE KEY uq_active_college_dean (active_college_dean_guard),
    ADD UNIQUE KEY uq_active_personnel_dean (active_personnel_dean_guard);

-- 6. Program Coordinator Assignments: Exactly one active coordinator per academic program
ALTER TABLE program_coordinator_assignments
    ADD COLUMN active_program_coord_guard CHAR(36)
    GENERATED ALWAYS AS (CASE WHEN is_active = 1 THEN academic_program_id ELSE NULL END) VIRTUAL,
    ADD UNIQUE KEY uq_active_program_coordinator (active_program_coord_guard);

-- 7. Organization Moderator Assignments: Exactly one active moderator per student organization
ALTER TABLE organization_moderator_assignments
    ADD COLUMN active_org_moderator_guard CHAR(36)
    GENERATED ALWAYS AS (CASE WHEN is_active = 1 THEN organization_id ELSE NULL END) VIRTUAL,
    ADD UNIQUE KEY uq_active_org_moderator (active_org_moderator_guard);


-- ============================================================================
-- SECTION 2: HIGH-VALUE PERFORMANCE AND AUTHORIZATION INDEXES
-- ============================================================================

-- Profiles & Roles
CREATE INDEX idx_profiles_account_type_status ON profiles(account_type, status);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profile_roles_profile ON profile_roles(profile_id);
CREATE INDEX idx_profile_roles_role ON profile_roles(role_id);
CREATE INDEX idx_profile_roles_scope ON profile_roles(scope_type, scope_id);

-- Institutional & Affiliations
CREATE INDEX idx_academic_programs_college ON academic_programs(college_id);
CREATE INDEX idx_administrative_units_college ON administrative_units(college_id);
CREATE INDEX idx_student_enrollments_student ON student_program_enrollments(student_profile_id);
CREATE INDEX idx_student_enrollments_program ON student_program_enrollments(academic_program_id);
CREATE INDEX idx_personnel_college_personnel ON personnel_college_affiliations(personnel_profile_id);
CREATE INDEX idx_personnel_college_college ON personnel_college_affiliations(college_id);
CREATE INDEX idx_personnel_program_personnel ON personnel_program_affiliations(personnel_profile_id);
CREATE INDEX idx_personnel_program_program ON personnel_program_affiliations(academic_program_id);
CREATE INDEX idx_personnel_unit_personnel ON personnel_administrative_unit_affiliations(personnel_profile_id);
CREATE INDEX idx_personnel_unit_unit ON personnel_administrative_unit_affiliations(administrative_unit_id);

-- Governance & Organizations
CREATE INDEX idx_organizations_college ON organizations(college_id);
CREATE INDEX idx_dean_assignments_personnel ON dean_assignments(personnel_profile_id);
CREATE INDEX idx_dean_assignments_college ON dean_assignments(college_id);
CREATE INDEX idx_prog_coord_personnel ON program_coordinator_assignments(personnel_profile_id);
CREATE INDEX idx_prog_coord_program ON program_coordinator_assignments(academic_program_id);
CREATE INDEX idx_org_mod_personnel ON organization_moderator_assignments(personnel_profile_id);
CREATE INDEX idx_org_mod_organization ON organization_moderator_assignments(organization_id);

-- Student Portfolio & Evidence
CREATE INDEX idx_portfolio_records_student ON student_portfolio_records(student_profile_id);
CREATE INDEX idx_portfolio_records_category ON student_portfolio_records(category_id);
CREATE INDEX idx_portfolio_records_subcategory ON student_portfolio_records(subcategory_id);
CREATE INDEX idx_portfolio_records_status ON student_portfolio_records(status);
CREATE INDEX idx_portfolio_records_submitted ON student_portfolio_records(submitted_at);
CREATE INDEX idx_portfolio_evidence_record ON student_portfolio_evidence(portfolio_record_id);
CREATE INDEX idx_portfolio_evidence_uploader ON student_portfolio_evidence(uploaded_by);
CREATE INDEX idx_verification_events_record ON student_portfolio_verification_events(portfolio_record_id);
CREATE INDEX idx_verification_events_actor ON student_portfolio_verification_events(actor_profile_id);

-- Events & Certificates
CREATE INDEX idx_events_organizer ON events(organizer_profile_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_attendance_records_attendee ON attendance_records(attendee_profile_id);
CREATE INDEX idx_issued_certificates_recipient ON issued_certificates(recipient_profile_id);
CREATE INDEX idx_issued_certificates_code ON issued_certificates(certificate_code);

-- Award Evaluations & Scoring
CREATE INDEX idx_award_criteria_award ON award_criteria(award_definition_id);
CREATE INDEX idx_award_scoring_rules_criterion ON award_scoring_rules(criterion_id);
CREATE INDEX idx_award_mappings_rule ON award_portfolio_mappings(scoring_rule_id);
CREATE INDEX idx_award_evaluations_cycle ON student_award_evaluations(cycle_id);
CREATE INDEX idx_award_evaluations_award ON student_award_evaluations(award_definition_id);
CREATE INDEX idx_award_evaluations_student ON student_award_evaluations(student_profile_id);
CREATE INDEX idx_award_criterion_scores_eval ON student_award_criterion_scores(evaluation_id);
CREATE INDEX idx_award_score_evidence_port ON student_award_score_evidence(portfolio_record_id);
CREATE INDEX idx_dean_nominations_cycle_award ON dean_student_nominations(cycle_id, award_definition_id);
CREATE INDEX idx_dean_nominations_student ON dean_student_nominations(student_profile_id);
CREATE INDEX idx_interview_eligibility_student ON award_interview_eligibilities(student_profile_id);

-- Notifications & Personnel Ranking
CREATE INDEX idx_notifications_recipient ON notifications(recipient_profile_id, read_at);
CREATE INDEX idx_personnel_accomplishments_personnel ON personnel_accomplishments(personnel_profile_id);
CREATE INDEX idx_personnel_evaluations_personnel ON personnel_evaluations(personnel_profile_id);
CREATE INDEX idx_personnel_evaluations_evaluator ON personnel_evaluations(evaluator_profile_id);

-- Audit & Security
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_profile_id);
CREATE INDEX idx_audit_logs_event_code ON audit_logs(event_code);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_file_security_evidence ON file_security_audit_events(evidence_domain, evidence_id);


-- ============================================================================
-- SECTION 3: AUTHORITATIVE PERMANENT REFERENCE SEEDS
-- ============================================================================

-- 1. Roles (7 Authoritative Roles)
INSERT INTO roles (id, role_key, display_name, description, is_system_role, created_at, updated_at) VALUES
('e750f1e5-5baf-4269-b8fe-9e4d49d175a4', 'dean', 'Dean', 'College-scoped faculty ranking and academic governance access', 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('7b14b5ee-27a5-4e05-b00e-7f37723b49bf', 'hr_staff', 'HR Staff', 'Personnel account provisioning and governance access', 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('0aef2e84-8792-4c94-9cfc-a6e25f4b4751', 'organization_moderator', 'Organization Moderator', 'Organization-scoped event access', 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('eee0b2d1-47c0-4791-a26b-db777dd670c8', 'osad_staff', 'OSAD Staff', 'Student account provisioning and student-affairs access', 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('539ce155-8b60-4f04-80af-828b70fe2d57', 'personnel', 'Personnel', 'Personnel or faculty portfolio access', 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('b3afa366-9e6c-4f0a-ae31-b52732499bf3', 'program_coordinator', 'Program Coordinator', 'Program-scoped coordination access', 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('6b9424d2-5c71-44ef-9f1e-b3740b98a2bf', 'student', 'Student', 'Student achievement and portfolio access', 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- 2. Colleges (5 Undergraduate Academic Colleges)
INSERT INTO colleges (id, code, name, description, status, created_at, updated_at) VALUES
('20000000-0000-0000-0000-000000000001', 'CET', 'College of Engineering and Technology', 'Engineering, Computing, and Architecture Disciplines', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('20000000-0000-0000-0000-000000000002', 'CBA', 'College of Business and Accountancy', 'Business, Management, and Accountancy Programs', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('20000000-0000-0000-0000-000000000003', 'CAS', 'College of Arts and Sciences', 'Liberal Arts, Social Sciences, and Natural Sciences', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('20000000-0000-0000-0000-000000000004', 'CTE', 'College of Teacher Education', 'Teacher Education and Pedagogical Formation', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('20000000-0000-0000-0000-000000000005', 'CHS', 'College of Health Sciences', 'Nursing and Allied Health Professions', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- 3. Academic Programs (14 Undergraduate Degree Programs)
INSERT INTO academic_programs (id, college_id, code, name, degree_level, status, created_at, updated_at) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'BSCS', 'Bachelor of Science in Computer Science', 'undergraduate', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'BSIT', 'Bachelor of Science in Information Technology', 'undergraduate', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'BSCE', 'Bachelor of Science in Civil Engineering', 'undergraduate', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'BSEE', 'Bachelor of Science in Electrical Engineering', 'undergraduate', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', 'BSA', 'Bachelor of Science in Accountancy', 'undergraduate', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', 'BSBA-FM', 'Bachelor of Science in Business Administration - Financial Management', 'undergraduate', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002', 'BSBA-MM', 'Bachelor of Science in Business Administration - Marketing Management', 'undergraduate', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000003', 'AB-COMM', 'Bachelor of Arts in Communication', 'undergraduate', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000003', 'AB-POLSCI', 'Bachelor of Arts in Political Science', 'undergraduate', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000003', 'BS-PSYCH', 'Bachelor of Science in Psychology', 'undergraduate', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000004', 'BSED-ENG', 'Bachelor of Secondary Education - English', 'undergraduate', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000004', 'BSED-MATH', 'Bachelor of Secondary Education - Mathematics', 'undergraduate', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000004', 'BEED', 'Bachelor of Elementary Education', 'undergraduate', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000005', 'BSN', 'Bachelor of Science in Nursing', 'undergraduate', 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- 4. Administrative Units (19 Central Offices)
INSERT INTO administrative_units (id, code, name, unit_type, college_id, description, status, created_at, updated_at) VALUES
('cae00fd6-ab53-4614-b98f-6d50e122180f', 'QAPS', 'Quality Assurance, Admissions, Promotions, and Scholarships', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('9a2bcbc4-1ded-4aac-b82b-77d662fba160', 'IRO', 'International Relations', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('a6fe5d51-410d-484b-b18e-b510d8a1368b', 'FIN', 'Finance / Comptroller', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('7238a000-9ce3-4c13-86ae-503d4f3b0ea0', 'CMRE', 'CMRE', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('c627be88-3c73-45f7-b29b-9993c786d6a6', 'LIB_EMC', 'Libraries and EMC', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('c37e8868-2894-46ac-a18f-127eb5a6ff02', 'RPC', 'Research and Publication Center', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('8cb1b662-a405-4e3a-ae6b-5fa1cc4603b2', 'HR', 'Human Resources Office', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('db80fc1b-0eec-49d4-ad83-2113ee84ef1f', 'GTC', 'Guidance and Testing Center', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('281c1e04-7ca9-4307-95cb-563e9820f71d', 'PPS', 'Physical Plant & Security', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('68336010-7852-4bf8-ae41-fbc1e51d69ed', 'OSAD', 'Student Affairs & Development', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('a33cf662-17ef-4cb0-9fb5-a1335e512c49', 'ATH', 'Athletics and Sports', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('a9434754-cc86-41bd-a11b-9efdda16fd4f', 'GHDO', 'Gender and Human Development Office', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('5bd15d30-22d9-46bd-850e-dc7f45b168a0', 'CEPE', 'Community Extension and Peace & Environment', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('34bb502e-0ab6-4924-8ed0-8679420f1234', 'CM', 'Campus Ministry', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('b3f9f522-df49-4aac-85fd-a9f43f0c5bad', 'ICT', 'Information and Communications Technology', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('ffe5fc91-59aa-4251-972b-851b3b0472db', 'DPO', 'Data Protection', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('fb34aa82-8a6c-4983-bc88-91aa5aac8081', 'ETHICS', 'Ethics Committee', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('a16e55d2-7859-4f1c-967e-d63808185fa3', 'IPO', 'Intellectual Property Office', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('62c3ed98-f5b4-4cfd-a6b3-a6506fae0b9f', 'SC_NSTP', 'Socio-Cultural & NSTP', 'central_office', NULL, NULL, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- 5. Portfolio Categories (Exactly 9 Categories)
INSERT INTO portfolio_categories (id, code, name, description, sort_order, status, created_at, updated_at) VALUES
('8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646', 'LEADERSHIP_POSITION', 'Leadership Position', 'Use this only for an official leadership position held in SSG, a College/Collegiate Council, a Club/Organization, or a Year-Level body.', 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('c9a6d837-78f4-4516-b2db-d438ae717be5', 'ORG_MEMBERSHIP_PARTICIPATION', 'Organization Membership / Participation', 'Use this for organization membership, committee participation, activity involvement, facilitation, organizing, or documented contributions when the record is not primarily a leadership position.', 2, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('ace24637-66f7-4329-9451-ccc61e18eab9', 'COMMUNITY_SERVICE_VOLUNTEERISM', 'Community Service / Volunteerism', 'Use this for outreach, volunteer work, community extension, environmental service, or other service-oriented involvement.', 3, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('779a9653-d972-47ce-93dc-cb381150568b', 'CHURCH_MINISTRY_INVOLVEMENT', 'Church / Ministry Involvement', 'Use this for campus ministry, parish/church ministry, church organizations, church-related service, or an initiated church-related activity.', 4, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('802de57b-54d7-4d38-9433-052ca9636380', 'SEMINAR_TRAINING', 'Seminar / Training', 'Use this for seminars, workshops, trainings, conferences, congresses, certifications, and similar development activities.', 5, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('448beadb-a254-4cb6-84fb-a3d5f4f8822e', 'CITATION_RECOGNITION', 'Citation / Recognition', 'Use this for verified non-academic citations, commendations, or recognitions that are not already captured as a sports or socio-cultural competition placement.', 6, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('2d20d412-bf34-46b4-a21d-d7131d4b514a', 'SPORTS', 'Sports', 'Use this for athletic participation, sports meets or competitions, and sports placements or medals.', 7, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('6514e620-b5a0-4ff2-9353-0ee8787b5ce6', 'SOCIO_CULTURAL_PERFORMING_ARTS', 'Socio-Cultural / Performing Arts', 'Use this for dance, vocal, instrumental, theater, cultural performance, and related competitions or placements.', 8, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('2b09cd61-7a23-4466-be58-889398e8f201', 'CAMPUS_JOURNALISM', 'Campus Journalism', 'Use this for news, literary works, columns, editorials, campus publication membership/contribution, or publication officer roles.', 9, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- 6. Portfolio Subcategories (Exactly 57 Subcategories: 40 with descriptions, 17 with NULL descriptions)
-- Category 1: Leadership Position (4 subcategories)
INSERT INTO portfolio_subcategories (id, category_id, code, name, description, sort_order, status, created_at, updated_at) VALUES
('40000001-0001-0000-0000-000000000001', '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646', 'SSG_UNIVERSITY_GOVERNMENT', 'SSG / University Student Government', 'For an official position in the university-wide student government.', 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000001-0001-0000-0000-000000000002', '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646', 'COLLEGIATE_COLLEGE_COUNCIL', 'Collegiate / College Council', 'For an official position in a college or collegiate student council.', 2, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000001-0001-0000-0000-000000000003', '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646', 'CLUB_ORGANIZATION', 'Club / Organization', 'For an officer or official leadership position in a recognized club or organization.', 3, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000001-0001-0000-0000-000000000004', '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646', 'YEAR_LEVEL_LEADERSHIP', 'Year-Level Leadership', 'For an official year-level representative or recognized year-level leadership position.', 4, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- Category 2: Organization Membership / Participation (5 subcategories)
INSERT INTO portfolio_subcategories (id, category_id, code, name, description, sort_order, status, created_at, updated_at) VALUES
('40000002-0001-0000-0000-000000000001', 'c9a6d837-78f4-4516-b2db-d438ae717be5', 'GENERAL_MEMBER', 'General Member', 'For verified membership without an officer position.', 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000002-0001-0000-0000-000000000002', 'c9a6d837-78f4-4516-b2db-d438ae717be5', 'COMMITTEE_MEMBER', 'Committee Member', 'For participation in a committee or working group.', 2, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000002-0001-0000-0000-000000000003', 'c9a6d837-78f4-4516-b2db-d438ae717be5', 'ACTIVITY_PARTICIPANT', 'Activity Participant', 'For verified participation in an official organization activity.', 3, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000002-0001-0000-0000-000000000004', 'c9a6d837-78f4-4516-b2db-d438ae717be5', 'FACILITATOR_ORGANIZER', 'Facilitator / Organizer', 'For documented facilitation or organizing responsibility.', 4, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000002-0001-0000-0000-000000000005', 'c9a6d837-78f4-4516-b2db-d438ae717be5', 'PROJECT_CONTRIBUTOR', 'Project Contributor', 'For a documented contribution to an organization project or program.', 5, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- Category 3: Community Service / Volunteerism (5 subcategories)
INSERT INTO portfolio_subcategories (id, category_id, code, name, description, sort_order, status, created_at, updated_at) VALUES
('40000003-0001-0000-0000-000000000001', 'ace24637-66f7-4329-9451-ccc61e18eab9', 'UNIVERSITY_BASED_SERVICE', 'University-Based Service', 'For outreach, volunteerism, or extension conducted through the university or a university unit.', 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000003-0001-0000-0000-000000000002', 'ace24637-66f7-4329-9451-ccc61e18eab9', 'COMMUNITY_BASED_SERVICE', 'Community-Based Service', 'For barangay/community outreach, volunteer work, extension, or service activities.', 2, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000003-0001-0000-0000-000000000003', 'ace24637-66f7-4329-9451-ccc61e18eab9', 'CHURCH_BASED_SERVICE', 'Church-Based Service', 'For service or outreach conducted through a church/ministry context when the evidence is primarily a service activity.', 3, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000003-0001-0000-0000-000000000004', 'ace24637-66f7-4329-9451-ccc61e18eab9', 'ENVIRONMENTAL_SERVICE', 'Environmental Service', 'For clean-ups, tree planting, environmental campaigns, and similar service activities.', 4, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000003-0001-0000-0000-000000000005', 'ace24637-66f7-4329-9451-ccc61e18eab9', 'PEOPLE_DEVELOPMENT_EDUCATIONAL_SERVICE', 'People Development / Educational Service', 'For tutorials, formation, educational outreach, livelihood, or people-development activities.', 5, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- Category 4: Church / Ministry Involvement (4 subcategories)
INSERT INTO portfolio_subcategories (id, category_id, code, name, description, sort_order, status, created_at, updated_at) VALUES
('40000004-0001-0000-0000-000000000001', '779a9653-d972-47ce-93dc-cb381150568b', 'CAMPUS_MINISTRY', 'Campus Ministry', 'For involvement in university/campus ministry.', 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000004-0001-0000-0000-000000000002', '779a9653-d972-47ce-93dc-cb381150568b', 'PARISH_CHURCH_MINISTRY', 'Parish / Church Ministry', 'For parish or church ministry involvement.', 2, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000004-0001-0000-0000-000000000003', '779a9653-d972-47ce-93dc-cb381150568b', 'CHURCH_ORGANIZATION', 'Church Organization', 'For membership or involvement in a recognized church organization.', 3, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000004-0001-0000-0000-000000000004', '779a9653-d972-47ce-93dc-cb381150568b', 'INITIATED_CHURCH_RELATED_ACTIVITY', 'Initiated Church-Related Activity', 'For a church-related activity that the student initiated or led.', 4, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- Category 5: Seminar / Training (8 subcategories)
INSERT INTO portfolio_subcategories (id, category_id, code, name, description, sort_order, status, created_at, updated_at) VALUES
('40000005-0001-0000-0000-000000000001', '802de57b-54d7-4d38-9433-052ca9636380', 'LEADERSHIP_DEVELOPMENT', 'Leadership Development', 'Leadership seminars, student-leader congresses, governance workshops, leadership camps, or leadership training.', 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000005-0001-0000-0000-000000000002', '802de57b-54d7-4d38-9433-052ca9636380', 'PERSONAL_PROFESSIONAL_DEVELOPMENT', 'Personal / Professional Development', 'General career, communication, employability, productivity, professional, or personal-growth activities.', 2, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000005-0001-0000-0000-000000000003', '802de57b-54d7-4d38-9433-052ca9636380', 'CAMPUS_JOURNALISM_DEVELOPMENT', 'Campus Journalism Development', 'Writing, editorial, publication, journalism, or media-related seminars and training.', 3, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000005-0001-0000-0000-000000000004', '802de57b-54d7-4d38-9433-052ca9636380', 'SPORTS_DEVELOPMENT', 'Sports Development', 'Sports clinics, athletic development, coaching, or sports-related training.', 4, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000005-0001-0000-0000-000000000005', '802de57b-54d7-4d38-9433-052ca9636380', 'SOCIO_CULTURAL_PERFORMING_ARTS_DEVELOPMENT', 'Socio-Cultural / Performing Arts Development', 'Dance, music, theater, cultural performance, or performing-arts development activities.', 5, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000005-0001-0000-0000-000000000006', '802de57b-54d7-4d38-9433-052ca9636380', 'COMMUNITY_SERVICE_VOLUNTEER_DEVELOPMENT', 'Community Service / Volunteer Development', 'Volunteer orientation, outreach training, community-engagement, or service-development activities.', 6, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000005-0001-0000-0000-000000000007', '802de57b-54d7-4d38-9433-052ca9636380', 'SPIRITUAL_FORMATION_DEVELOPMENT', 'Spiritual / Formation Development', 'Faith formation, ministry formation, spiritual-development, or related training.', 7, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000005-0001-0000-0000-000000000008', '802de57b-54d7-4d38-9433-052ca9636380', 'OTHER_SEMINAR_TRAINING', 'Other Seminar / Training', 'For legitimate development activities that do not fit the defined areas.', 8, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- Category 6: Citation / Recognition (8 subcategories)
INSERT INTO portfolio_subcategories (id, category_id, code, name, description, sort_order, status, created_at, updated_at) VALUES
('40000006-0001-0000-0000-000000000001', '448beadb-a254-4cb6-84fb-a3d5f4f8822e', 'LEADERSHIP', 'Leadership', 'For a non-competition leadership citation or recognition.', 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000006-0001-0000-0000-000000000002', '448beadb-a254-4cb6-84fb-a3d5f4f8822e', 'ORGANIZATION_MEMBERSHIP', 'Organization / Membership', 'For recognition related to organization involvement or membership.', 2, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000006-0001-0000-0000-000000000003', '448beadb-a254-4cb6-84fb-a3d5f4f8822e', 'COMMUNITY_SERVICE_VOLUNTEERISM', 'Community Service / Volunteerism', 'For volunteerism, outreach, or community-service recognition.', 3, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000006-0001-0000-0000-000000000004', '448beadb-a254-4cb6-84fb-a3d5f4f8822e', 'CHURCH_MINISTRY', 'Church / Ministry', 'For a church/ministry-related citation or recognition.', 4, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000006-0001-0000-0000-000000000005', '448beadb-a254-4cb6-84fb-a3d5f4f8822e', 'CAMPUS_JOURNALISM', 'Campus Journalism', 'For journalism/publication recognition not already represented by another structured competition record.', 5, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000006-0001-0000-0000-000000000006', '448beadb-a254-4cb6-84fb-a3d5f4f8822e', 'SPORTS', 'Sports', 'For a non-placement sports recognition.', 6, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000006-0001-0000-0000-000000000007', '448beadb-a254-4cb6-84fb-a3d5f4f8822e', 'SOCIO_CULTURAL_PERFORMING_ARTS', 'Socio-Cultural / Performing Arts', 'For a non-placement socio-cultural or performing-arts recognition.', 7, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000006-0001-0000-0000-000000000008', '448beadb-a254-4cb6-84fb-a3d5f4f8822e', 'OTHER_NON_ACADEMIC_RECOGNITION', 'Other Non-Academic Recognition', 'For another verified non-academic citation that does not fit the listed areas.', 8, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- Category 7: Sports (10 subcategories - intentional NULL descriptions matching source matrix disciplines)
INSERT INTO portfolio_subcategories (id, category_id, code, name, description, sort_order, status, created_at, updated_at) VALUES
('40000007-0001-0000-0000-000000000001', '2d20d412-bf34-46b4-a21d-d7131d4b514a', 'BASKETBALL', 'Basketball', NULL, 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000007-0001-0000-0000-000000000002', '2d20d412-bf34-46b4-a21d-d7131d4b514a', 'VOLLEYBALL', 'Volleyball', NULL, 2, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000007-0001-0000-0000-000000000003', '2d20d412-bf34-46b4-a21d-d7131d4b514a', 'ATHLETICS', 'Athletics', NULL, 3, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000007-0001-0000-0000-000000000004', '2d20d412-bf34-46b4-a21d-d7131d4b514a', 'SWIMMING', 'Swimming', NULL, 4, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000007-0001-0000-0000-000000000005', '2d20d412-bf34-46b4-a21d-d7131d4b514a', 'BADMINTON', 'Badminton', NULL, 5, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000007-0001-0000-0000-000000000006', '2d20d412-bf34-46b4-a21d-d7131d4b514a', 'TABLE_TENNIS', 'Table Tennis', NULL, 6, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000007-0001-0000-0000-000000000007', '2d20d412-bf34-46b4-a21d-d7131d4b514a', 'CHESS', 'Chess', NULL, 7, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000007-0001-0000-0000-000000000008', '2d20d412-bf34-46b4-a21d-d7131d4b514a', 'FOOTBALL', 'Football', NULL, 8, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000007-0001-0000-0000-000000000009', '2d20d412-bf34-46b4-a21d-d7131d4b514a', 'SEPAK_TAKRAW', 'Sepak Takraw', NULL, 9, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000007-0001-0000-0000-000000000010', '2d20d412-bf34-46b4-a21d-d7131d4b514a', 'OTHER_APPROVED_SPORT', 'Other Approved Sport', NULL, 10, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- Category 8: Socio-Cultural / Performing Arts (7 subcategories - intentional NULL descriptions matching source matrix disciplines)
INSERT INTO portfolio_subcategories (id, category_id, code, name, description, sort_order, status, created_at, updated_at) VALUES
('40000008-0001-0000-0000-000000000001', '6514e620-b5a0-4ff2-9353-0ee8787b5ce6', 'DANCE', 'Dance', NULL, 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000008-0001-0000-0000-000000000002', '6514e620-b5a0-4ff2-9353-0ee8787b5ce6', 'VOCAL_SINGING', 'Vocal / Singing', NULL, 2, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000008-0001-0000-0000-000000000003', '6514e620-b5a0-4ff2-9353-0ee8787b5ce6', 'INSTRUMENTAL', 'Instrumental', NULL, 3, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000008-0001-0000-0000-000000000004', '6514e620-b5a0-4ff2-9353-0ee8787b5ce6', 'THEATER', 'Theater', NULL, 4, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000008-0001-0000-0000-000000000005', '6514e620-b5a0-4ff2-9353-0ee8787b5ce6', 'CULTURAL_PERFORMANCE', 'Cultural Performance', NULL, 5, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000008-0001-0000-0000-000000000006', '6514e620-b5a0-4ff2-9353-0ee8787b5ce6', 'PERFORMING_ARTS', 'Performing Arts', NULL, 6, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000008-0001-0000-0000-000000000007', '6514e620-b5a0-4ff2-9353-0ee8787b5ce6', 'OTHER_APPROVED_DISCIPLINE', 'Other Approved Discipline', NULL, 7, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- Category 9: Campus Journalism (6 subcategories)
INSERT INTO portfolio_subcategories (id, category_id, code, name, description, sort_order, status, created_at, updated_at) VALUES
('40000009-0001-0000-0000-000000000001', '2b09cd61-7a23-4466-be58-889398e8f201', 'NEWS_ITEM', 'News Item', 'For verified news writing or publication output.', 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000009-0001-0000-0000-000000000002', '2b09cd61-7a23-4466-be58-889398e8f201', 'LITERARY_WORK', 'Literary Work', 'For verified literary work or publication.', 2, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000009-0001-0000-0000-000000000003', '2b09cd61-7a23-4466-be58-889398e8f201', 'COLUMN', 'Column', 'For a verified column.', 3, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000009-0001-0000-0000-000000000004', '2b09cd61-7a23-4466-be58-889398e8f201', 'EDITORIAL', 'Editorial', 'For a verified editorial.', 4, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000009-0001-0000-0000-000000000005', '2b09cd61-7a23-4466-be58-889398e8f201', 'PUBLICATION_MEMBER_CONTRIBUTOR', 'Publication Member / Contributor', 'For staff, member, or contributor involvement in a campus publication.', 5, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('40000009-0001-0000-0000-000000000006', '2b09cd61-7a23-4466-be58-889398e8f201', 'PUBLICATION_OFFICER', 'Publication Officer', 'For an official officer/editorial leadership role in a campus publication.', 6, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- 7. Potential Award Definitions (Exactly 15 Official Potential Awards)
INSERT INTO award_definitions (id, code, name, category, description, candidate_threshold_percent, gender_restriction, graduating_only, status, created_at, updated_at) VALUES
('50000001-0000-0000-0000-000000000001', 'MOST_OUTSTANDING_STUDENT', 'Most Outstanding Student Award', 'overall', 'Highest institutional non-academic and holistic excellence award.', 80.00, NULL, 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('50000001-0000-0000-0000-000000000002', 'OUTSTANDING_LEADERSHIP', 'Outstanding Student Leader Award', 'leadership', 'Exemplary leadership in university student government and councils.', 80.00, NULL, 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('50000001-0000-0000-0000-000000000003', 'OUTSTANDING_COMMUNITY_SERVICE', 'Outstanding Community Service Award', 'service', 'Dedication to community outreach, volunteerism, and extension.', 80.00, NULL, 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('50000001-0000-0000-0000-000000000004', 'OUTSTANDING_CAMPUS_JOURNALISM', 'Outstanding Campus Journalist Award', 'journalism', 'Excellence in editorial leadership, publication, and campus journalism.', 80.00, NULL, 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('50000001-0000-0000-0000-000000000005', 'OUTSTANDING_ATHLETE_MALE', 'Outstanding Athlete of the Year (Male)', 'sports', 'Top male student athlete in official athletic meets and PRISAA.', 80.00, 'male', 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('50000001-0000-0000-0000-000000000006', 'OUTSTANDING_ATHLETE_FEMALE', 'Outstanding Athlete of the Year (Female)', 'sports', 'Top female student athlete in official athletic meets and PRISAA.', 80.00, 'female', 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('50000001-0000-0000-0000-000000000007', 'OUTSTANDING_CULTURAL_ARTIST', 'Outstanding Socio-Cultural Performing Artist Award', 'culture', 'Exemplary contribution to dance, vocal, music, and performing arts.', 80.00, NULL, 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('50000001-0000-0000-0000-000000000008', 'OUTSTANDING_CHURCH_MINISTRY', 'Outstanding Campus Ministry Service Award', 'ministry', 'Dedicated involvement in campus ministry and faith formation.', 80.00, NULL, 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('50000001-0000-0000-0000-000000000009', 'OUTSTANDING_CO_CURRICULAR', 'Outstanding Co-Curricular Student Organization Award', 'organization', 'High-impact academic and co-curricular student organization leadership.', 80.00, NULL, 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('50000001-0000-0000-0000-000000000010', 'OUTSTANDING_EXTRA_CURRICULAR', 'Outstanding Extra-Curricular Club Award', 'organization', 'Exemplary activities and contribution from special interest student clubs.', 80.00, NULL, 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('50000001-0000-0000-0000-000000000011', 'ACADEMIC_EXCELLENCE', 'Academic Excellence Award', 'academic', 'Top scholastic standing across academic terms.', 80.00, NULL, 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('50000001-0000-0000-0000-000000000012', 'RESEARCH_AND_INNOVATION', 'Research & Innovation Award', 'research', 'Outstanding scientific publication, thesis, or patent innovation.', 80.00, NULL, 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('50000001-0000-0000-0000-000000000013', 'LOYALTY_AWARD', 'Institutional Loyalty Award', 'loyalty', 'Continuous holistic formation and residency in the institution.', 80.00, NULL, 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('50000001-0000-0000-0000-000000000014', 'DEANS_MEDAL_OF_DISTINCTION', 'Dean Medal of Distinction', 'collegiate', 'Collegiate-level highest recognition awarded by the College Dean.', 80.00, NULL, 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('50000001-0000-0000-0000-000000000015', 'PRESIDENTS_MEDAL_OF_EXCELLENCE', 'President Medal of Excellence', 'presidential', 'Supreme university commendation for character, scholarship, and service.', 80.00, NULL, 1, 'active', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

-- 8. Award Criteria Sample Rubrics for Potential Candidate Calculations
INSERT INTO award_criteria (id, award_definition_id, code, name, weight, max_points, sort_order, is_portfolio_computable, created_at, updated_at) VALUES
('50000002-0001-0000-0000-000000000001', '50000001-0000-0000-0000-000000000001', 'CRIT_LEADERSHIP', 'Leadership and Governance', 35.00, 35.00, 1, 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('50000002-0001-0000-0000-000000000002', '50000001-0000-0000-0000-000000000001', 'CRIT_COMMUNITY', 'Community Service and Extension', 35.00, 35.00, 2, 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('50000002-0001-0000-0000-000000000003', '50000001-0000-0000-0000-000000000001', 'CRIT_DEVELOPMENT', 'Seminars and Professional Growth', 30.00, 30.00, 3, 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));
