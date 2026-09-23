<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use RuntimeException;

/** Canonical credential ledger. Deliberately contains no rank-placement inference. */
class PersonnelCredentialService
{
    public function __construct(private ?BaseConnection $db = null)
    {
        $this->db ??= db_connect();
    }

    public function submit(string $personnelId, string $actorId, array $input): array
    {
        $type = strtolower(trim((string) ($input['credential_type'] ?? '')));
        $degree = $this->nullableLower($input['degree_level'] ?? null);
        $board = $this->nullableLower($input['board_licensure_status'] ?? null);
        $title = trim((string) ($input['credential_title'] ?? ''));
        $provenance = trim((string) ($input['provenance'] ?? ''));
        $documentReference = trim((string) ($input['supporting_document_reference'] ?? ''));

        if (!in_array($type, ['degree', 'board_licensure', 'other'], true)) {
            throw new InvalidArgumentException('INVALID_CREDENTIAL_TYPE');
        }
        if ($type === 'degree' && !in_array($degree, ['baccalaureate', 'masters', 'doctorate'], true)) {
            throw new InvalidArgumentException('INVALID_DEGREE_LEVEL');
        }
        if ($type === 'board_licensure' && !in_array($board, ['board_passer', 'non_board'], true)) {
            throw new InvalidArgumentException('INVALID_BOARD_LICENSURE_STATUS');
        }
        if (($type === 'degree' && $board !== null) || ($type === 'board_licensure' && $degree !== null) || ($type === 'other' && ($degree !== null || $board !== null))) {
            throw new InvalidArgumentException('INVALID_CREDENTIAL_SHAPE');
        }
        if ($title === '' || $provenance === '' || $documentReference === '') {
            throw new InvalidArgumentException('CREDENTIAL_PROVENANCE_REQUIRED');
        }
        if (!$this->db->table('personnel_profiles')->where('profile_id', $personnelId)->countAllResults()) {
            throw new InvalidArgumentException('PERSONNEL_NOT_FOUND');
        }

        $id = $this->uuid();
        $row = [
            'id' => $id,
            'personnel_profile_id' => $personnelId,
            'credential_type' => $type,
            'degree_level' => $type === 'degree' ? $degree : null,
            'board_licensure_status' => $type === 'board_licensure' ? $board : null,
            'credential_title' => $title,
            'issuing_institution_authority' => $this->nullableText($input['issuing_institution_authority'] ?? null),
            'earned_issued_on' => $this->nullableText($input['earned_issued_on'] ?? null),
            'verification_status' => 'submitted',
            'provenance' => $provenance,
            'supporting_document_reference' => $documentReference,
            'supporting_evidence_id' => $this->nullableText($input['supporting_evidence_id'] ?? null),
            'supersedes_credential_id' => $this->nullableText($input['supersedes_credential_id'] ?? null),
            'submitted_by_profile_id' => $actorId,
            'record_state' => 'active',
        ];

        $this->db->transStart();
        $this->db->table('personnel_credentials')->insert($row);
        $this->event($id, $personnelId, 'submitted', $actorId, ['provenance' => $provenance]);
        $this->db->transComplete();
        if (!$this->db->transStatus()) {
            throw new RuntimeException('CREDENTIAL_SUBMISSION_FAILED');
        }
        return $this->find($id);
    }

    public function verify(string $personnelId, string $credentialId, string $hrActorId, bool $approved, ?string $notes = null): array
    {
        $credential = $this->findForPersonnel($personnelId, $credentialId);
        if ($credential['verification_status'] !== 'submitted' || $credential['record_state'] !== 'active') {
            throw new RuntimeException('CREDENTIAL_NOT_PENDING_VERIFICATION');
        }

        $status = $approved ? 'verified' : 'rejected';
        $prior = null;
        if ($approved && !empty($credential['supersedes_credential_id'])) {
            $prior = $this->findForPersonnel($personnelId, (string) $credential['supersedes_credential_id']);
            if ($prior['verification_status'] !== 'verified' || $prior['record_state'] !== 'active') {
                throw new RuntimeException('CREDENTIAL_SUPERSESSION_TARGET_INVALID');
            }
        }
        $this->db->transStart();
        $this->db->table('personnel_credentials')->where('id', $credentialId)->update([
            'verification_status' => $status,
            'verified_by_profile_id' => $hrActorId,
            'verified_at' => date('Y-m-d H:i:s'),
            'verification_notes' => $this->nullableText($notes),
        ]);

        if ($prior !== null) {
            $this->db->table('personnel_credentials')->where('id', $prior['id'])->update(['record_state' => 'superseded']);
            $this->event($prior['id'], $personnelId, 'superseded', $hrActorId, ['superseded_by_credential_id' => $credentialId]);
        }

        $this->event($credentialId, $personnelId, $status, $hrActorId, ['notes' => $this->nullableText($notes)]);
        $this->db->transComplete();
        if (!$this->db->transStatus()) {
            throw new RuntimeException('CREDENTIAL_VERIFICATION_FAILED');
        }
        return $this->find($credentialId);
    }

    public function history(string $personnelId, bool $verifiedOnly = false): array
    {
        $query = $this->db->table('personnel_credentials')->where('personnel_profile_id', $personnelId);
        if ($verifiedOnly) {
            $query->where('verification_status', 'verified');
        }
        return $query->orderBy('created_at', 'DESC')->get()->getResultArray();
    }

    private function find(string $id): array
    {
        $row = $this->db->table('personnel_credentials')->where('id', $id)->get()->getRowArray();
        if (!$row) throw new InvalidArgumentException('CREDENTIAL_NOT_FOUND');
        return $row;
    }

    private function findForPersonnel(string $personnelId, string $credentialId): array
    {
        $row = $this->find($credentialId);
        if ($row['personnel_profile_id'] !== $personnelId) throw new InvalidArgumentException('CREDENTIAL_NOT_FOUND');
        return $row;
    }

    private function event(string $credentialId, string $personnelId, string $type, string $actorId, array $payload): void
    {
        $this->db->table('personnel_credential_events')->insert([
            'id' => $this->uuid(), 'credential_id' => $credentialId, 'personnel_profile_id' => $personnelId,
            'event_type' => $type, 'performed_by_profile_id' => $actorId,
            'event_payload' => json_encode($payload, JSON_UNESCAPED_SLASHES),
        ]);
    }

    private function nullableText(mixed $value): ?string { $value = trim((string) ($value ?? '')); return $value === '' ? null : $value; }
    private function nullableLower(mixed $value): ?string { $value = $this->nullableText($value); return $value === null ? null : strtolower($value); }
    private function uuid(): string
    {
        $data = random_bytes(16); $data[6] = chr((ord($data[6]) & 0x0f) | 0x40); $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
