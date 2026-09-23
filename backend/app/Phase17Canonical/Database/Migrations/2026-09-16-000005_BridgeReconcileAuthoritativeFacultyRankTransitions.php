<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Phase K2: reconcile Faculty progression with the official document and HR interview addendum. */
class BridgeReconcileAuthoritativeFacultyRankTransitions extends Migration
{
    use September15BridgeGuard;

    private const AUTHORITY = 'NDMU-HR-INTERVIEW-ADDENDUM-2026/SECTIONS-2-3-9';

    public function up()
    {
        $this->assertBridgeStep(5);
        // Retain legacy rows for compatibility/audit, but exclude unsupported cross-placement
        // and rank-skipping edges from all active progression resolution.
        $unsupported = [
            ['INSTRUCTOR_I', 'SENIOR_INSTRUCTOR_I'],
            ['SENIOR_INSTRUCTOR_IV', 'ASSISTANT_PROFESSOR_I'],
            ['ASSISTANT_PROFESSOR_IV', 'ASSOCIATE_PROFESSOR_I'],
            ['ASSOCIATE_PROFESSOR_IV', 'PROFESSOR_I'],
            ['PROFESSOR_IV', 'UNIVERSITY_PROFESSOR_I'],
            ['UNIVERSITY_PROFESSOR_IV', 'UNIVERSITY_PROFESSOR'],
        ];

        foreach ($unsupported as [$from, $to]) {
            $this->db->table('faculty_rank_transitions')
                ->where('from_rank_code', $from)
                ->where('to_rank_code', $to)
                ->where('transition_type', 'normal_sequential')
                ->update(['is_active' => 0]);
        }

        $authoritative = [
            ['ASSISTANT_PROFESSOR_IV', 'ASSOCIATE_PROFESSOR'],
            ['PROFESSOR_IV', 'UNIVERSITY_PROFESSOR'],
            ['UNIVERSITY_PROFESSOR', 'UNIVERSITY_PROFESSOR_I'],
        ];

        foreach ($authoritative as [$from, $to]) {
            $existing = $this->db->table('faculty_rank_transitions')
                ->where('from_rank_code', $from)
                ->where('to_rank_code', $to)
                ->where('transition_type', 'normal_sequential')
                ->get()
                ->getRowArray();

            $values = [
                'requires_verified_phd' => 0,
                'rule_reference' => self::AUTHORITY,
                'is_active' => 1,
            ];

            if ($existing) {
                $this->db->table('faculty_rank_transitions')->where('id', $existing['id'])->update($values);
                continue;
            }

            $this->db->table('faculty_rank_transitions')->insert($values + [
                'from_rank_code' => $from,
                'to_rank_code' => $to,
                'transition_type' => 'normal_sequential',
                'created_at' => date('Y-m-d H:i:s'),
            ]);
        }

        // The exception existed in the legacy configuration; this records its now-explicit authority.
        $this->db->table('faculty_rank_transitions')
            ->where('from_rank_code', 'ASSISTANT_PROFESSOR_I')
            ->where('to_rank_code', 'PROFESSOR_I')
            ->where('transition_type', 'phd_exception')
            ->update([
                'requires_verified_phd' => 1,
                'rule_reference' => self::AUTHORITY,
                'is_active' => 1,
            ]);
    }

    }
