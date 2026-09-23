<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use RuntimeException;

class RankingCycleService
{
    public function __construct(private ?BaseConnection $db = null) { $this->db ??= db_connect(); }

    public function list(): array
    {
        return array_map(fn(array $cycle): array => $this->withTracks($cycle), $this->db->table('ranking_cycles')->orderBy('academic_year', 'DESC')->orderBy('created_at', 'DESC')->get()->getResultArray());
    }

    public function find(string $id): ?array
    {
        $cycle = $this->db->table('ranking_cycles')->where('id', $id)->get()->getRowArray();
        return $cycle ? $this->withTracks($cycle) : null;
    }

    public function create(array $input, string $actorId): array
    {
        $data = $this->validate($input);
        $data += ['id'=>$this->uuid(), 'cycle_code'=>$this->cycleCode($data['academic_year']), 'created_by'=>$actorId, 'created_at'=>date('Y-m-d H:i:s'), 'updated_at'=>date('Y-m-d H:i:s')];
        $this->db->table('ranking_cycles')->insert($data);
        return $this->find($data['id']);
    }

    public function update(string $id, array $input, string $actorId): array
    {
        $existing = $this->db->table('ranking_cycles')->where('id', $id)->get()->getRowArray();
        if (! $existing) throw new InvalidArgumentException('RANKING_CYCLE_NOT_FOUND: Ranking cycle not found.');
        $data = $this->validate(array_merge($existing, $input));
        if ($data['academic_year'] !== $existing['academic_year'] && $this->db->table('personnel_evaluation_periods')->where('ranking_cycle_id', $id)->countAllResults() > 0) throw new RuntimeException('RANKING_CYCLE_YEAR_LOCKED: Academic year cannot change after tracks are attached.');
        $data += ['updated_by'=>$actorId, 'updated_at'=>date('Y-m-d H:i:s')];
        $this->db->table('ranking_cycles')->where('id', $id)->update($data);
        return $this->find($id);
    }

    public function delete(string $id): void
    {
        if (! $this->db->table('ranking_cycles')->where('id', $id)->get()->getRowArray()) throw new InvalidArgumentException('RANKING_CYCLE_NOT_FOUND: Ranking cycle not found.');
        if ($this->db->table('personnel_evaluation_periods')->where('ranking_cycle_id', $id)->countAllResults() > 0) throw new RuntimeException('RANKING_CYCLE_NOT_EMPTY: Remove or reassign tracks before deleting this cycle.');
        $this->db->table('ranking_cycles')->where('id', $id)->delete();
    }

    private function withTracks(array $cycle): array
    {
        $tracks = $this->db->table('personnel_evaluation_periods')->select('id, ranking_cycle_id, period_code, period_name, personnel_group, academic_year, status, version, submission_open_at, submission_close_at, evaluation_start_at, evaluation_end_at, evaluation_scale_version_id')->where('ranking_cycle_id', $cycle['id'])->orderBy('personnel_group')->get()->getResultArray();
        return $cycle + ['tracks'=>$tracks, 'track_count'=>count($tracks)];
    }

    private function validate(array $input): array
    {
        $name = trim((string)($input['cycle_name'] ?? ''));
        $year = trim((string)($input['academic_year'] ?? ''));
        if (mb_strlen($name) < 5 || mb_strlen($name) > 160) throw new InvalidArgumentException('INVALID_CYCLE_NAME: Cycle name must be 5–160 characters.');
        if (! preg_match('/^(19|20|21)\d{2}-(19|20|21)\d{2}$/', $year) || (int)substr($year,5) !== (int)substr($year,0,4)+1) throw new InvalidArgumentException('INVALID_ACADEMIC_YEAR: Academic year must contain consecutive years in YYYY-YYYY format.');
        return ['cycle_name'=>$name, 'academic_year'=>$year];
    }

    private function cycleCode(string $year): string { return 'RC-' . $year . '-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8)); }
    private function uuid(): string { return sprintf('%04x%04x-%04x-4%03x-%04x-%04x%04x%04x',random_int(0,65535),random_int(0,65535),random_int(0,65535),random_int(0,4095),random_int(32768,49151),random_int(0,65535),random_int(0,65535),random_int(0,65535)); }
}
