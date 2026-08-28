<?php

namespace App\Database\Seeds;

use App\Services\LocalEvidenceStorageService;
use CodeIgniter\Database\Seeder;
use RuntimeException;

class DefenseDemoScenarioSeeder extends Seeder
{
    public function run()
    {
        $db = $this->db;
        $storage = new LocalEvidenceStorageService();
        $storage->ensureDirectories();

        $now = date('Y-m-d H:i:s');
        $studentAId = 'd0000000-0000-0000-0001-000000000001';
        $studentBId = 'd0000000-0000-0000-0001-000000000002';
        $facultyId = 'd0000000-0000-0000-0001-000000000003';
        $deanId = 'd0000000-0000-0000-0001-000000000007';
        $coordAId = 'd0000000-0000-0000-0001-000000000008';

        // 1. Resolve active portfolio categories & subcategories
        $categories = $db->table('portfolio_categories')->where('status', 'active')->orderBy('sort_order', 'ASC')->get()->getResultArray();
        if (count($categories) < 5) {
            throw new RuntimeException('Insufficient active portfolio categories in database.');
        }

        $catMap = [];
        foreach ($categories as $c) {
            $catMap[$c['code']] = $c;
        }

        $subcats = $db->table('portfolio_subcategories')->where('status', 'active')->get()->getResultArray();
        $subcatByCat = [];
        foreach ($subcats as $s) {
            $subcatByCat[$s['category_id']][] = $s;
        }

        // Minimal valid PDF binary string for demo evidence
        $pdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000102 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF";

        // Helper to store synthetic physical evidence
        $tmpDir = $storage->getStorageRoot() . 'tmp/';
        $seedEvidence = function (string $type, string $ownerId, string $recordId, string $filename) use ($storage, $tmpDir, $pdfContent, $db, $now) {
            $tmpPath = $tmpDir . 'demo_tmp_' . uniqid() . '.pdf';
            file_put_contents($tmpPath, $pdfContent);
            $stored = $storage->storeFile($tmpPath, $type, $ownerId, $recordId, 'pdf', true);
            @unlink($tmpPath);

            $evidenceId = 'd0000000-0000-0000-0005-' . substr($recordId, -12);
            $table = $type === 'student' ? 'student_portfolio_evidence' : 'personnel_accomplishment_evidence';
            $fkCol = $type === 'student' ? 'portfolio_record_id' : 'accomplishment_id';

            $row = [
                'id'                  => $evidenceId,
                $fkCol                => $recordId,
                'storage_path'        => $stored['storage_path'],
                'original_filename'   => $filename,
                'mime_type'           => 'application/pdf',
                'detected_mime_type'  => 'application/pdf',
                'byte_size'           => $stored['byte_size'],
                'checksum'            => $stored['sha256'],
                'sha256'              => $stored['sha256'],
                'uploaded_by'         => $ownerId,
                'uploaded_at'         => $now,
                'security_status'     => 'pending',
                'malware_scanner'     => 'none_deferred',
                'status'              => 'active',
            ];
            if ($type === 'student') {
                $row['evidence_type'] = 'certificate';
            }

            $db->table($table)->upsert($row);
            return $row;
        };

        // 2. Seed Student Portfolio Records for Student A
        $records = [
            // DEMO-PORT-01: Draft record
            [
                'id'                 => 'd0000000-0000-0000-0003-000000000001',
                'student_profile_id' => $studentAId,
                'category_id'        => $categories[0]['id'],
                'subcategory_id'     => $subcatByCat[$categories[0]['id']][0]['id'] ?? null,
                'title'              => 'Research Paper on Edge Computing Architectures',
                'organizer_or_body'  => 'National Computer Science Research Forum',
                'occurrence_date'    => date('Y-m-d', strtotime('-15 days')),
                'description'        => 'Draft submission for published paper presentation in Edge Computing.',
                'status'             => 'draft',
                'evidence'           => false,
            ],
            // DEMO-PORT-02: Submitted record (ready for live Coordinator review/verification)
            [
                'id'                 => 'd0000000-0000-0000-0003-000000000002',
                'student_profile_id' => $studentAId,
                'category_id'        => $categories[1]['id'],
                'subcategory_id'     => $subcatByCat[$categories[1]['id']][0]['id'] ?? null,
                'title'              => 'President of Computer Science Society (AY 2025-2026)',
                'organizer_or_body'  => 'NDMU Student Affairs & Services',
                'occurrence_date'    => date('Y-m-d', strtotime('-30 days')),
                'description'        => 'Institutional student leadership role managing collegiate CS events.',
                'status'             => 'submitted',
                'submitted_at'       => date('Y-m-d H:i:s', strtotime('-5 days')),
                'evidence'           => 'CSS_President_Appointment_Order.pdf',
            ],
            // DEMO-PORT-03: Verified record (eligible for award evaluation)
            [
                'id'                 => 'd0000000-0000-0000-0003-000000000003',
                'student_profile_id' => $studentAId,
                'category_id'        => $categories[2]['id'],
                'subcategory_id'     => $subcatByCat[$categories[2]['id']][0]['id'] ?? null,
                'title'              => 'Champion — Regional Inter-Collegiate Hackathon 2026',
                'organizer_or_body'  => 'Philippine Society of Information Technology Educators (PSITE)',
                'occurrence_date'    => date('Y-m-d', strtotime('-45 days')),
                'description'        => 'First place project development in Regional AI Hackathon.',
                'status'             => 'verified',
                'submitted_at'       => date('Y-m-d H:i:s', strtotime('-40 days')),
                'verified_at'        => date('Y-m-d H:i:s', strtotime('-35 days')),
                'evidence'           => 'PSITE_Hackathon_Champion_Certificate.pdf',
                'verified_by'        => $coordAId,
            ],
            // DEMO-PORT-04: Revision requested record
            [
                'id'                 => 'd0000000-0000-0000-0003-000000000004',
                'student_profile_id' => $studentAId,
                'category_id'        => $categories[3]['id'],
                'subcategory_id'     => $subcatByCat[$categories[3]['id']][0]['id'] ?? null,
                'title'              => 'Community Literacy Extension Volunteer',
                'organizer_or_body'  => 'Marist Community Outreach Center',
                'occurrence_date'    => date('Y-m-d', strtotime('-60 days')),
                'description'        => 'Volunteer tutor for basic programming literacy.',
                'status'             => 'revision_requested',
                'submitted_at'       => date('Y-m-d H:i:s', strtotime('-20 days')),
                'evidence'           => 'Outreach_Attendance_Summary.pdf',
                'revision_remarks'   => 'Please attach the signed certificate of completion from the outreach director.',
                'revision_by'        => $coordAId,
            ],
            // DEMO-PORT-05: Sports Category record
            [
                'id'                 => 'd0000000-0000-0000-0003-000000000005',
                'student_profile_id' => $studentAId,
                'category_id'        => $catMap['SPORTS']['id'] ?? $categories[4]['id'],
                'subcategory_id'     => $subcatByCat[$catMap['SPORTS']['id'] ?? $categories[4]['id']][0]['id'] ?? null,
                'title'              => 'Gold Medalist — University Athletic Meet 2026 Table Tennis',
                'organizer_or_body'  => 'NDMU Sports Development Office',
                'occurrence_date'    => date('Y-m-d', strtotime('-10 days')),
                'description'        => 'Men Singles Table Tennis Championship.',
                'structured_metadata'=> json_encode(['sport_type' => 'Table Tennis', 'event_level' => 'University', 'rank' => 'Gold']),
                'status'             => 'submitted',
                'submitted_at'       => date('Y-m-d H:i:s', strtotime('-2 days')),
                'evidence'           => 'Sports_Gold_Medal_Official_Certificate.pdf',
            ],
        ];

        foreach ($records as $rec) {
            $row = [
                'id'                  => $rec['id'],
                'student_profile_id'  => $rec['student_profile_id'],
                'category_id'         => $rec['category_id'],
                'subcategory_id'      => $rec['subcategory_id'],
                'title'               => $rec['title'],
                'organizer_or_body'   => $rec['organizer_or_body'],
                'occurrence_date'     => $rec['occurrence_date'],
                'description'         => $rec['description'],
                'structured_metadata' => $rec['structured_metadata'] ?? null,
                'status'              => $rec['status'],
                'submitted_at'        => $rec['submitted_at'] ?? null,
                'verified_at'         => $rec['verified_at'] ?? null,
                'created_at'          => $now,
                'updated_at'          => $now,
            ];
            $db->table('student_portfolio_records')->upsert($row);

            // Attach physical evidence file if specified
            if (! empty($rec['evidence'])) {
                $seedEvidence('student', $rec['student_profile_id'], $rec['id'], $rec['evidence']);
            }

            // Record verification events
            if ($rec['status'] === 'submitted' || $rec['status'] === 'verified' || $rec['status'] === 'revision_requested') {
                $db->table('student_portfolio_verification_events')->upsert([
                    'id'                  => 'd0000000-0000-0000-0006-' . substr($rec['id'], -12) . '1',
                    'portfolio_record_id' => $rec['id'],
                    'actor_profile_id'    => $rec['student_profile_id'],
                    'action'              => 'submitted',
                    'previous_status'     => 'draft',
                    'new_status'          => 'submitted',
                    'remarks'             => 'Initial submission for verification.',
                    'occurred_at'         => $rec['submitted_at'] ?? $now,
                ]);
            }

            if ($rec['status'] === 'verified' && ! empty($rec['verified_by'])) {
                $db->table('student_portfolio_verification_events')->upsert([
                    'id'                  => 'd0000000-0000-0000-0006-' . substr($rec['id'], -12) . '2',
                    'portfolio_record_id' => $rec['id'],
                    'actor_profile_id'    => $rec['verified_by'],
                    'action'              => 'verified',
                    'previous_status'     => 'submitted',
                    'new_status'          => 'verified',
                    'remarks'             => 'Verified against official institutional contest records.',
                    'occurred_at'         => $rec['verified_at'] ?? $now,
                ]);

                // Notification to Student
                $db->table('notifications')->upsert([
                    'id'                   => 'd0000000-0000-0000-0007-' . substr($rec['id'], -12),
                    'recipient_profile_id' => $rec['student_profile_id'],
                    'actor_profile_id'     => $rec['verified_by'],
                    'notification_type'    => 'portfolio_verified',
                    'title'                => 'Portfolio Submission Verified',
                    'message'              => "Your submission '{$rec['title']}' has been officially verified.",
                    'reference_type'       => 'student_portfolio_records',
                    'reference_id'         => $rec['id'],
                    'is_mandatory'         => 1,
                    'created_at'           => $rec['verified_at'] ?? $now,
                ]);
            }

            if ($rec['status'] === 'revision_requested' && ! empty($rec['revision_by'])) {
                $db->table('student_portfolio_verification_events')->upsert([
                    'id'                  => 'd0000000-0000-0000-0006-' . substr($rec['id'], -12) . '3',
                    'portfolio_record_id' => $rec['id'],
                    'actor_profile_id'    => $rec['revision_by'],
                    'action'              => 'revision_requested',
                    'previous_status'     => 'submitted',
                    'new_status'          => 'revision_requested',
                    'remarks'             => $rec['revision_remarks'],
                    'occurred_at'         => $now,
                ]);

                // Notification to Student
                $db->table('notifications')->upsert([
                    'id'                   => 'd0000000-0000-0000-0007-' . substr($rec['id'], -12),
                    'recipient_profile_id' => $rec['student_profile_id'],
                    'actor_profile_id'     => $rec['revision_by'],
                    'notification_type'    => 'portfolio_revision_requested',
                    'title'                => 'Revision Requested on Portfolio Submission',
                    'message'              => "Revision requested for '{$rec['title']}': {$rec['revision_remarks']}",
                    'reference_type'       => 'student_portfolio_records',
                    'reference_id'         => $rec['id'],
                    'is_mandatory'         => 1,
                    'created_at'           => $now,
                ]);
            }
        }

        // 3. Seed Personnel Accomplishment for Demo Faculty
        $accId = 'd0000000-0000-0000-0004-000000000001';
        $db->table('personnel_accomplishments')->upsert([
            'id'                     => $accId,
            'personnel_profile_id'   => $facultyId,
            'domain'                 => 'productivity_creative_work',
            'title'                  => 'Published Research on Applied Machine Learning in Academic Advising',
            'organizer_or_publisher' => 'IEEE Transactions on Learning Technologies',
            'occurrence_date'        => date('Y-m-d', strtotime('-90 days')),
            'description'            => 'Peer-reviewed journal paper on intelligent student achievement ranking.',
            'claimed_points'         => 45.00,
            'status'                 => 'submitted',
            'created_at'             => $now,
            'updated_at'             => $now,
        ]);
        $seedEvidence('personnel', $facultyId, $accId, 'IEEE_Paper_Publication_Proof.pdf');

        // 4. Seed Active Award Cycle & Dean Nomination
        $cycleId = 'd0000000-0000-0000-0008-000000000001';
        $award = $db->table('award_definitions')->where('status', 'active')->orderBy('code', 'ASC')->get()->getRowArray();
        $deanAssign = $db->table('dean_assignments')->where('personnel_profile_id', $deanId)->get()->getRowArray();
        $osadAdmin = $db->table('profiles')->where('email', 'demo.osad.admin@ndmu.edu.ph')->get()->getRowArray();
        $creatorId = $osadAdmin['id'] ?? $deanId;

        if ($award !== null) {
            $db->table('award_cycles')->upsert([
                'id'                  => $cycleId,
                'code'                => 'CYCLE_2025_2026_S2',
                'academic_year'       => '2025-2026',
                'semester'            => '2nd Semester',
                'name'                => 'AY 2025-2026 Annual Student Honors & Awards',
                'start_date'          => date('Y-m-d', strtotime('-30 days')),
                'end_date'            => date('Y-m-d', strtotime('+30 days')),
                'candidate_threshold' => 80.00,
                'status'              => 'active',
                'created_by'          => $creatorId,
                'created_at'          => $now,
            ]);

            // Dean Nomination for Student A
            $nomId = 'd0000000-0000-0000-0009-000000000001';
            $db->table('dean_student_nominations')->upsert([
                'id'                  => $nomId,
                'cycle_id'            => $cycleId,
                'award_definition_id' => $award['id'],
                'student_profile_id'  => $studentAId,
                'dean_assignment_id'  => $deanAssign['id'] ?? null,
                'dean_profile_id'     => $deanId,
                'college_id'          => $deanAssign['college_id'] ?? null,
                'justification'       => 'Strongly endorsed by the Dean of CET for exceptional leadership and academic achievements.',
                'status'              => 'active',
                'nominated_at'        => $now,
            ]);
        }
    }
}
