<?php

namespace App\Models;

use CodeIgniter\Model;

class AttendanceSessionModel extends Model
{
    protected $table            = 'attendance_sessions';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = false;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'id',
        'event_id',
        'session_name',
        'session_type',
        'check_in_start',
        'check_in_end',
        'status',
        'created_at',
        'updated_at',
    ];

    protected $useTimestamps = false;

    /**
     * Find all attendance sessions belonging to an event.
     */
    public function findByEvent(string $eventId): array
    {
        return $this->where('event_id', $eventId)
            ->orderBy('check_in_start', 'ASC')
            ->findAll();
    }

    /**
     * Find a session with parent event context.
     */
    public function findWithEvent(string $sessionId): ?array
    {
        return $this->db->table('attendance_sessions s')
            ->select('s.*, e.title AS event_title, e.organization_id, e.status AS event_status, e.start_time AS event_start_time, e.end_time AS event_end_time')
            ->join('events e', 'e.id = s.event_id')
            ->where('s.id', $sessionId)
            ->get()
            ->getRowArray();
    }
}
