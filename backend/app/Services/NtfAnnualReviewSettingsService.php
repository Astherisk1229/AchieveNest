<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use RuntimeException;

/**
 * Versioned HR settings for the Non-Teaching Faculty annual-review workbook.
 *
 * Settings are append-only: every save writes a new version and the newest version is active, so
 * any computed rating can always be traced to the exact scale version that produced it.
 */
class NtfAnnualReviewSettingsService
{
    public const GROUP = 'NON_TEACHING_FACULTY';
    public const KEY_RATING_SCALE = 'rating_scale';
    public const KEY_SIGNATORIES = 'signatories';
    public const SIGNATORY_SOURCES = ['college_dean', 'unit_head', 'custom'];
    public const SIGNATORY_CONTEXTS = ['college', 'office'];

    public function __construct(private ?BaseConnection $db = null) { $this->db ??= db_connect(); }

    /** @return array{version:int,value:array,created_at:?string,created_by:?string} */
    public function active(string $key): array
    {
        $row = $this->db->table('personnel_annual_review_settings')
            ->where(['personnel_group' => self::GROUP, 'setting_key' => $key])
            ->orderBy('version', 'DESC')->get(1)->getRowArray();
        if (! $row) throw new RuntimeException('ANNUAL_REVIEW_SETTINGS_MISSING: NTF annual-review settings are not installed. Run the database migrations.');
        return ['version' => (int) $row['version'], 'value' => json_decode((string) $row['value_json'], true) ?: [], 'created_at' => $row['created_at'], 'created_by' => $row['created_by']];
    }

    public function all(): array
    {
        return [self::KEY_RATING_SCALE => $this->active(self::KEY_RATING_SCALE), self::KEY_SIGNATORIES => $this->active(self::KEY_SIGNATORIES)];
    }

    public function saveRatingScale(array $input, string $actorId): array
    {
        $bands = $input['bands'] ?? null;
        if (! is_array($bands) || count($bands) < 2 || count($bands) > 10) throw new InvalidArgumentException('RATING_SCALE_INVALID: Provide between 2 and 10 rating bands.');
        $clean = [];
        foreach ($bands as $band) {
            $label = trim((string) ($band['label'] ?? ''));
            if ($label === '' || mb_strlen($label) > 40 || preg_match('/[<>]/', $label)) throw new InvalidArgumentException('RATING_SCALE_INVALID: Each band needs a label of up to 40 characters.');
            $min = filter_var($band['min_percent'] ?? null, FILTER_VALIDATE_FLOAT);
            if ($min === false || $min < 0 || $min > 100) throw new InvalidArgumentException("RATING_SCALE_INVALID: The minimum for {$label} must be between 0 and 100.");
            $clean[] = ['key' => self::ratingKey($label), 'label' => $label, 'min_percent' => round((float) $min, 2), 'passing' => (bool) ($band['passing'] ?? false)];
        }
        usort($clean, fn(array $a, array $b) => $b['min_percent'] <=> $a['min_percent']);
        $keys = array_column($clean, 'key');
        if (count(array_unique($keys)) !== count($keys)) throw new InvalidArgumentException('RATING_SCALE_INVALID: Band labels must be unique.');
        $mins = array_column($clean, 'min_percent');
        if (count(array_unique(array_map('strval', $mins))) !== count($mins)) throw new InvalidArgumentException('RATING_SCALE_INVALID: Each band needs a different minimum percentage.');
        if (end($clean)['min_percent'] != 0.0) throw new InvalidArgumentException('RATING_SCALE_INVALID: The lowest band must start at 0% so every score receives a rating.');
        $current = $this->active(self::KEY_RATING_SCALE)['value'];
        $value = ['scale_name' => $current['scale_name'] ?? 'AchieveNest provisional NTF annual-review rating scale', 'is_provisional' => true, 'basis' => 'percentage_of_area_a_maximum', 'bands' => $clean];
        return $this->write(self::KEY_RATING_SCALE, $value, $actorId, $input['change_reason'] ?? null);
    }

    public function saveSignatories(array $input, string $actorId): array
    {
        $value = [];
        foreach (self::SIGNATORY_CONTEXTS as $context) {
            $lines = $input[$context] ?? [];
            if (! is_array($lines) || count($lines) > 6) throw new InvalidArgumentException('SIGNATORIES_INVALID: Up to 6 signature lines are allowed per context.');
            $value[$context] = [];
            foreach ($lines as $line) {
                $label = trim((string) ($line['label'] ?? ''));
                $source = (string) ($line['source'] ?? '');
                $name = trim((string) ($line['custom_name'] ?? ''));
                $position = trim((string) ($line['custom_position'] ?? ''));
                if ($label === '' || mb_strlen($label) > 60) throw new InvalidArgumentException('SIGNATORIES_INVALID: Each signature line needs a label of up to 60 characters (for example, the wording used on your form).');
                if (! in_array($source, self::SIGNATORY_SOURCES, true)) throw new InvalidArgumentException('SIGNATORIES_INVALID: Choose who signs each line.');
                if ($source === 'custom' && $name === '') throw new InvalidArgumentException('SIGNATORIES_INVALID: A custom signature line needs a name.');
                foreach ([$label, $name, $position] as $text) if (preg_match('/[<>]/', $text) || mb_strlen($text) > 120) throw new InvalidArgumentException('SIGNATORIES_INVALID: Signature text contains unsupported characters or is too long.');
                $value[$context][] = ['label' => $label, 'source' => $source, 'custom_name' => $source === 'custom' ? $name : '', 'custom_position' => $source === 'custom' ? $position : ''];
            }
        }
        return $this->write(self::KEY_SIGNATORIES, $value, $actorId, $input['change_reason'] ?? null);
    }

    /** Returns the band for a percentage (bands sorted high → low, lowest band starts at 0). */
    public static function band(float $percent, array $scale): array
    {
        $bands = $scale['bands'] ?? [];
        usort($bands, fn(array $a, array $b) => $b['min_percent'] <=> $a['min_percent']);
        foreach ($bands as $band) if ($percent + 1e-9 >= (float) $band['min_percent']) return $band;
        throw new RuntimeException('RATING_SCALE_INVALID: The active rating scale does not cover this score.');
    }

    public static function ratingKey(string $label): string
    {
        return trim(preg_replace('/[^a-z0-9]+/', '_', mb_strtolower($label)), '_');
    }

    private function write(string $key, array $value, string $actorId, ?string $reason): array
    {
        $reason = trim((string) $reason);
        if (mb_strlen($reason) > 500) throw new InvalidArgumentException('CHANGE_REASON_TOO_LONG: Keep the reason under 500 characters.');
        $this->db->transBegin();
        try {
            $latest = $this->db->query('SELECT MAX(version) AS v FROM personnel_annual_review_settings WHERE personnel_group = ? AND setting_key = ? FOR UPDATE', [self::GROUP, $key])->getRowArray();
            $version = (int) ($latest['v'] ?? 0) + 1;
            $this->db->table('personnel_annual_review_settings')->insert([
                'id' => $this->uuid(), 'personnel_group' => self::GROUP, 'setting_key' => $key, 'version' => $version,
                'value_json' => json_encode($value, JSON_UNESCAPED_UNICODE), 'change_reason' => $reason ?: null,
                'created_by' => $actorId, 'created_at' => date('Y-m-d H:i:s'),
            ]);
            if ($this->db->tableExists('audit_logs')) {
                $this->db->table('audit_logs')->insert([
                    'id' => $this->uuid(), 'actor_profile_id' => $actorId, 'event_code' => "ntf_annual_review_{$key}_updated",
                    'category' => 'annual_review_settings', 'target_type' => 'annual_review_setting', 'target_id' => null,
                    'outcome' => 'success', 'details' => "ntf_annual_review_{$key}_updated",
                    'safe_context' => json_encode(['version' => $version, 'reason' => $reason ?: null], JSON_UNESCAPED_UNICODE), 'created_at' => date('Y-m-d H:i:s'),
                ]);
            }
            $this->db->transCommit();
        } catch (\Throwable $error) {
            $this->db->transRollback();
            throw $error;
        }
        return $this->active($key);
    }

    private function uuid(): string
    {
        $d = random_bytes(16); $d[6] = chr((ord($d[6]) & 0x0f) | 0x40); $d[8] = chr((ord($d[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
    }
}
