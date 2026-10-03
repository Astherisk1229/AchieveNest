<?php
namespace Tests\Support\Phase2;

use CodeIgniter\Database\BaseConnection;

/** Synthetic tables only. Never invokes application migrations or reads working data. */
final class PortfolioFixture
{
    public const OWNER = '10000000-0000-4000-8000-000000000001';
    public const REVIEWER = '10000000-0000-4000-8000-000000000002';
    public const RECORD = '20000000-0000-4000-8000-000000000001';
    public const EVIDENCE = '30000000-0000-4000-8000-000000000001';
    public const CATEGORY = '40000000-0000-4000-8000-000000000001';
    public const SUBCATEGORY = '40000000-0000-4000-8000-000000000002';
    public const PROGRAM = '50000000-0000-4000-8000-000000000001';

    public static function create(BaseConnection $db, string $label = 'selected'): void
    {
        foreach ([
            'profiles' => 'id VARCHAR(36) PRIMARY KEY, full_name TEXT, institutional_id TEXT, email TEXT, account_type TEXT, status VARCHAR(30)',
            'portfolio_categories' => 'id VARCHAR(36) PRIMARY KEY, name TEXT, code VARCHAR(80), status VARCHAR(30), sort_order INTEGER',
            'portfolio_subcategories' => 'id VARCHAR(36) PRIMARY KEY, category_id VARCHAR(36), name TEXT, code VARCHAR(80), status VARCHAR(30), sort_order INTEGER',
            'student_portfolio_records' => 'id VARCHAR(36) PRIMARY KEY, student_profile_id VARCHAR(36), category_id VARCHAR(36), subcategory_id VARCHAR(36), title TEXT, organizer_or_body TEXT, occurrence_date VARCHAR(30), start_date VARCHAR(30), end_date VARCHAR(30), description TEXT, structured_metadata TEXT, status VARCHAR(30), submitted_at VARCHAR(30), verified_at VARCHAR(30), created_at VARCHAR(30), updated_at VARCHAR(30)',
            'student_portfolio_evidence' => 'id VARCHAR(36) PRIMARY KEY, portfolio_record_id VARCHAR(36), uploaded_by VARCHAR(36), status VARCHAR(30), security_status VARCHAR(30), storage_path TEXT, original_filename TEXT, mime_type VARCHAR(80), detected_mime_type VARCHAR(80), byte_size INTEGER, sha256 TEXT, checksum TEXT, evidence_type TEXT, uploaded_at VARCHAR(30), malware_scanner TEXT, security_validated_at VARCHAR(30)',
            'student_portfolio_verification_events' => 'id VARCHAR(36) PRIMARY KEY, portfolio_record_id VARCHAR(36), actor_profile_id VARCHAR(36), action VARCHAR(80), previous_status VARCHAR(30), new_status VARCHAR(30), remarks TEXT, occurred_at VARCHAR(30)',
            'notifications' => 'id VARCHAR(36) PRIMARY KEY, recipient_profile_id VARCHAR(36), actor_profile_id VARCHAR(36), notification_type VARCHAR(80), title TEXT, message TEXT, reference_type VARCHAR(80), reference_id VARCHAR(36), is_mandatory INTEGER, created_at VARCHAR(30)',
            'academic_programs' => 'id VARCHAR(36) PRIMARY KEY, code VARCHAR(30), name TEXT, college_id VARCHAR(36), status VARCHAR(30)',
            'student_program_enrollments' => 'student_profile_id VARCHAR(36), academic_program_id VARCHAR(36), is_active INTEGER, effective_from VARCHAR(30), year_level VARCHAR(30)',
            'program_coordinator_assignments' => 'id VARCHAR(36), personnel_profile_id VARCHAR(36), academic_program_id VARCHAR(36), is_active INTEGER',
            'roles' => 'id VARCHAR(36), role_key VARCHAR(40), display_name TEXT',
            'profile_roles' => 'id VARCHAR(36), profile_id VARCHAR(36), role_id VARCHAR(36), is_active INTEGER',
            'dean_assignments' => 'id VARCHAR(36), personnel_profile_id VARCHAR(36), college_id VARCHAR(36), is_active INTEGER',
            'colleges' => 'id VARCHAR(36), code VARCHAR(30), name TEXT',
            'organization_moderator_assignments' => 'id VARCHAR(36), personnel_profile_id VARCHAR(36), organization_id VARCHAR(36), is_active INTEGER',
            'organizations' => 'id VARCHAR(36), code VARCHAR(30), name TEXT',
        ] as $table => $columns) {
            $db->query('CREATE TABLE ' . $db->escapeIdentifiers($db->prefixTable($table)) . ' (' . $columns . ')' . ($db->DBDriver === 'MySQLi' ? ' ENGINE=InnoDB' : ''));
        }
        foreach ([[self::OWNER, 'student'], [self::REVIEWER, 'personnel']] as [$id, $type]) {
            $db->table('profiles')->insert(['id' => $id, 'full_name' => $label . '-' . $type, 'account_type' => $type, 'status' => 'active']);
        }
        $db->table('portfolio_categories')->insert(['id' => self::CATEGORY, 'name' => 'Synthetic category', 'code' => 'test', 'status' => 'active', 'sort_order' => 1]);
        $db->table('portfolio_subcategories')->insert(['id' => self::SUBCATEGORY, 'category_id' => self::CATEGORY, 'name' => 'Synthetic subcategory', 'code' => 'test', 'status' => 'active', 'sort_order' => 1]);
        $db->table('academic_programs')->insert(['id' => self::PROGRAM, 'name' => $label, 'code' => 'TEST', 'status' => 'active']);
        $db->table('student_program_enrollments')->insert(['student_profile_id' => self::OWNER, 'academic_program_id' => self::PROGRAM, 'is_active' => 1]);
        $db->table('program_coordinator_assignments')->insert(['id' => 'assignment', 'personnel_profile_id' => self::REVIEWER, 'academic_program_id' => self::PROGRAM, 'is_active' => 1]);
        $db->table('roles')->insert(['id' => 'role-student', 'role_key' => 'student', 'display_name' => 'Student']);
        $db->table('profile_roles')->insert(['id' => 'owner-role', 'profile_id' => self::OWNER, 'role_id' => 'role-student', 'is_active' => 1]);
        $db->table('student_portfolio_records')->insert(['id' => self::RECORD, 'student_profile_id' => self::OWNER, 'category_id' => self::CATEGORY, 'subcategory_id' => self::SUBCATEGORY, 'title' => $label . ' achievement', 'organizer_or_body' => 'Synthetic organizer', 'start_date' => '2026-01-01', 'structured_metadata' => '{"schema_version":"1.0","academic_year":"2025-2026","semester":"1st_semester"}', 'status' => 'draft', 'created_at' => '2026-01-01 00:00:00']);
        $db->table('student_portfolio_evidence')->insert(['id' => self::EVIDENCE, 'portfolio_record_id' => self::RECORD, 'uploaded_by' => self::OWNER, 'status' => 'active', 'security_status' => 'clean', 'original_filename' => 'synthetic.png', 'mime_type' => 'image/png', 'detected_mime_type' => 'image/png', 'byte_size' => 1, 'storage_path' => 'synthetic.png']);
    }

    public static function actor(bool $reviewer = false): array
    {
        return ['profile' => ['id' => $reviewer ? self::REVIEWER : self::OWNER, 'account_type' => $reviewer ? 'personnel' : 'student', 'status' => 'active'],
            'roles' => [$reviewer ? 'program_coordinator' : 'student'],
            'assignments' => $reviewer ? [['role_key' => 'program_coordinator', 'scope_type' => 'academic_program', 'scope_id' => self::PROGRAM]] : []];
    }
}
