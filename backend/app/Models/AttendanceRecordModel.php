<?php

namespace App\Models;

use CodeIgniter\Model;

class AttendanceRecordModel extends Model
{
    protected $table            = 'attendance_records';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = false;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'id',
        'session_id',
        'attendee_profile_id',
        'scanned_by',
        'checked_in_at',
        'verification_method',
    ];

    protected $useTimestamps = false;

    /**
     * Find an existing record for a specific session and attendee.
     */
    public function findForSessionAndAttendee(string $sessionId, string $attendeeProfileId): ?array
    {
        return $this->where([
            'session_id'          => $sessionId,
            'attendee_profile_id' => $attendeeProfileId,
        ])->first();
    }

    /**
     * List all attendance records for a session with joined attendee and scanner details.
     */
    public function listForSession(string $sessionId): array
    {
        return $this->db->table('attendance_records r')
            ->select('r.id, r.session_id, r.attendee_profile_id, r.checked_in_at, r.verification_method,
                      p.institutional_id, p.full_name, p.email, p.designation_title,
                      scanner.full_name AS scanned_by_name')
            ->join('profiles p', 'p.id = r.attendee_profile_id')
            ->join('profiles scanner', 'scanner.id = r.scanned_by', 'left')
            ->where('r.session_id', $sessionId)
            ->orderBy('r.checked_in_at', 'DESC')
            ->get()
            ->getResultArray();
    }
}
