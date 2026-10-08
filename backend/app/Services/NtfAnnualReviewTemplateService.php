<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use RuntimeException;
use ZipArchive;

/**
 * Generates the Non-Teaching Faculty annual-review workbook (blank or prefilled per personnel).
 *
 * Area A items, maximum points and weights are read from the criteria version locked to the ranking
 * track; nothing about the criteria is hard-coded here. The layout is the contract read by
 * NtfAnnualReviewWorkbookParser (sheet name, hidden marker sheet, column-A criterion codes, DS columns).
 */
class NtfAnnualReviewTemplateService
{
    public const TEMPLATE_ID = 'NTF_ANNUAL_REVIEW_V1';
    public const MARKER = 'ACHIEVENEST_NTF_ANNUAL_REVIEW';
    public const SHEET = 'NTF ANNUAL REVIEW';
    public const META_SHEET = '_ACHIEVENEST';
    public const FIRST_ITEM_ROW = 16;
    public const COL_YEAR1_DS = 'D';
    public const COL_YEAR2_DS = 'F';

    public function __construct(private ?BaseConnection $db = null, private ?NtfAnnualReviewSettingsService $settings = null)
    {
        $this->db ??= db_connect();
        $this->settings ??= new NtfAnnualReviewSettingsService($this->db);
    }

    public function period(string $periodId): array
    {
        $period = $this->db->table('personnel_evaluation_periods')->where('id', $periodId)->get()->getRowArray();
        if (! $period) throw new InvalidArgumentException('EVALUATION_PERIOD_INVALID: Ranking track was not found.');
        if (($period['personnel_group'] ?? '') !== NtfAnnualReviewSettingsService::GROUP) throw new InvalidArgumentException('NTF_TRACK_REQUIRED: This template is only for Non-Teaching Faculty ranking tracks.');
        return $period;
    }

    public static function requiredYears(string $academicYear): array
    {
        if (! preg_match('/^(\d{4})-(\d{4})$/', $academicYear, $m) || (int) $m[2] !== (int) $m[1] + 1) throw new RuntimeException('EVALUATION_PERIOD_INVALID: Academic year is not consecutive.');
        $start = (int) $m[1];
        return [($start - 2) . '-' . ($start - 1), ($start - 1) . '-' . $start];
    }

    /** Area A items of the track's locked criteria version. */
    public function criteria(array $period): array
    {
        $versionId = (string) ($period['evaluation_scale_version_id'] ?? '');
        if ($versionId === '') throw new RuntimeException('TEMPLATE_CRITERIA_UNAVAILABLE: The ranking track has no criteria version.');
        $version = $this->db->table('evaluation_scale_versions v')->select('v.id, v.version_number, s.title, s.personnel_group')
            ->join('evaluation_scales s', 's.id = v.scale_id')->where('v.id', $versionId)->get()->getRowArray();
        $area = $this->db->table('evaluation_scale_areas')->where(['scale_version_id' => $versionId, 'area_code' => 'A'])->get()->getRowArray();
        if (! $version || ! $area) throw new RuntimeException('TEMPLATE_CRITERIA_UNAVAILABLE: Area A of the locked NTF criteria could not be found.');
        $categories = $this->db->table('evaluation_scale_categories')->where('scale_area_id', $area['id'])->orderBy('display_order')->get()->getResultArray();
        if ($categories === []) throw new RuntimeException('TEMPLATE_CRITERIA_UNAVAILABLE: Area A has no items.');
        $items = [];
        foreach ($categories as $category) {
            $max = (float) $category['max_points'];
            $items[] = ['code' => $category['category_code'], 'name' => $category['name'], 'max_points' => $max, 'weight' => round($max / 100, 4)];
        }
        $areaMax = (float) $area['max_points'];
        if (abs(array_sum(array_column($items, 'max_points')) - $areaMax) > 0.001) throw new RuntimeException('TEMPLATE_CRITERIA_UNAVAILABLE: Area A item maximums do not add up to the area maximum.');
        return ['version_id' => $versionId, 'version_number' => $version['version_number'], 'scale_title' => $version['title'], 'area_name' => $area['name'], 'area_max' => $areaMax, 'items' => $items];
    }

    /** Organizational context used for the College row and for signatories. */
    public function personContext(string $profileId, array $period): array
    {
        $person = $this->db->table('profiles p')
            ->select('p.id, p.full_name, p.first_name, p.last_name, p.institutional_id, pp.personnel_group, pp.position_title, pp.current_rank_title')
            ->join('personnel_profiles pp', 'pp.profile_id = p.id')->where('p.id', $profileId)->get()->getRowArray();
        if (! $person) throw new InvalidArgumentException('PERSONNEL_NOT_FOUND: Personnel record was not found.');
        if (strtoupper((string) $person['personnel_group']) !== NtfAnnualReviewSettingsService::GROUP) throw new InvalidArgumentException('NTF_PERSONNEL_REQUIRED: This template is only for Non-Teaching Faculty personnel.');

        $unit = $this->db->table('personnel_administrative_unit_affiliations pau')
            ->select('au.id, au.name, au.college_id')->join('administrative_units au', "au.id = pau.administrative_unit_id AND au.status = 'active'")
            ->where('pau.personnel_profile_id', $profileId)->where('pau.is_active', 1)->get(1)->getRowArray();
        $collegeId = $this->db->table('personnel_college_affiliations')->select('college_id')->where('personnel_profile_id', $profileId)->where('is_active', 1)->get(1)->getRowArray()['college_id'] ?? ($unit['college_id'] ?? null);
        $college = $collegeId ? $this->db->table('colleges')->select('id, code, name')->where('id', $collegeId)->get()->getRowArray() : null;

        $rankApplied = null;
        if ($this->db->tableExists('personnel_rank_applied_for_decisions')) {
            $decision = $this->db->table('personnel_rank_applied_for_decisions d')->select('d.confirmed_rank_code, c.display_label')
                ->join('faculty_rank_catalog c', 'c.rank_code = d.confirmed_rank_code', 'left')
                ->where(['d.personnel_profile_id' => $profileId, 'd.ranking_track_id' => $period['id']])->where('d.confirmed_rank_code !=', null)->where('d.status !=', 'stale')
                ->orderBy('d.confirmed_at', 'DESC')->get(1)->getRowArray();
            if ($decision) $rankApplied = $decision['display_label'] ?: $decision['confirmed_rank_code'];
        }

        return [
            'profile_id' => $person['id'],
            'name' => $person['full_name'],
            'first_name' => $person['first_name'],
            'last_name' => $person['last_name'],
            'employee_id' => $person['institutional_id'],
            'unit' => $unit ? ['id' => $unit['id'], 'name' => $unit['name']] : null,
            'college' => $college,
            'context' => $college ? 'college' : ($unit ? 'office' : null),
            'position' => $person['position_title'],
            'present_rank' => $person['current_rank_title'],
            'rank_applied_for' => $rankApplied,
        ];
    }

    /** Resolves configured signature lines for one person, or lists configured lines for a blank form. */
    public function signatories(?array $person): array
    {
        $config = $this->settings->active(NtfAnnualReviewSettingsService::KEY_SIGNATORIES)['value'];
        $contexts = $person ? ($person['context'] ? [$person['context']] : []) : NtfAnnualReviewSettingsService::SIGNATORY_CONTEXTS;
        $groups = [];
        foreach ($contexts as $context) {
            $lines = [];
            foreach ($config[$context] ?? [] as $line) {
                [$name, $position] = match ($line['source']) {
                    'custom' => [$line['custom_name'], $line['custom_position']],
                    'college_dean' => $person ? $this->dean($person) : ['', 'Dean of the employee’s College'],
                    default => ['', ''],
                };
                $lines[] = ['label' => $line['label'], 'name' => $name, 'position' => $position];
            }
            $groups[$context] = $lines;
        }
        return $groups;
    }

    /** Builds the workbook into a temporary file and returns [path, download filename]. */
    public function build(array $period, ?array $person = null): array
    {
        $criteria = $this->criteria($period);
        $years = self::requiredYears($period['academic_year']);
        $scale = $this->settings->active(NtfAnnualReviewSettingsService::KEY_RATING_SCALE);
        $x = new SimpleXlsxWriter();
        $s = $x->addSheet(self::SHEET);
        $meta = $x->addSheet(self::META_SHEET, true);
        foreach ([1 => 46, 2 => 11, 3 => 9, 4 => 14, 5 => 14, 6 => 14, 7 => 14, 8 => 15] as $col => $w) $x->width($s, $col, $w);

        $x->set($s, 'A1', 'NOTRE DAME OF MARBEL UNIVERSITY', SimpleXlsxWriter::S_TITLE); $x->merge($s, 'A1:H1');
        $x->set($s, 'A2', 'NON-TEACHING FACULTY ANNUAL REVIEW', SimpleXlsxWriter::S_SUBTITLE); $x->merge($s, 'A2:H2');
        $x->set($s, 'A3', "Criteria: {$criteria['scale_title']} v{$criteria['version_number']}. Fill in the yellow cells only; do not rename this sheet.", SimpleXlsxWriter::S_NOTE); $x->merge($s, 'A3:H3');

        $college = $person ? ($person['context'] === 'college' ? ($person['college']['name'] ?? '') : 'Not applicable (Office/Unit-assigned)') : '';
        $unit = $person['unit']['name'] ?? ($person && $person['context'] === 'college' ? ($person['college']['name'] ?? '') : '');
        $fields = [
            5 => ['Name:', $person['name'] ?? '', true],
            6 => ['Department/Office/Unit:', $unit, true],
            7 => ['College (if College-assigned):', $college, true],
            8 => ['Specific Job/Position:', $person['position'] ?? '', true],
            9 => ['Period Covered:', "SY {$years[0]} & SY {$years[1]}", false],
            10 => ['Employee’s Progress Last Ranking:', '', true],
            11 => ['Present Rank:', $person['present_rank'] ?? '', true],
            12 => ['Rank Applied For:', $person['rank_applied_for'] ?? '', true],
        ];
        foreach ($fields as $row => [$label, $value, $editable]) {
            $x->set($s, "A{$row}", $label, SimpleXlsxWriter::S_LABEL);
            $x->set($s, "B{$row}", $value, $editable ? SimpleXlsxWriter::S_INPUT_TEXT : SimpleXlsxWriter::S_VALUE_TEXT);
            $x->merge($s, "B{$row}:H{$row}", $editable ? SimpleXlsxWriter::S_INPUT_TEXT : SimpleXlsxWriter::S_VALUE_TEXT);
        }

        $h = 14;
        foreach (['A' => 'Criteria', 'B' => 'Weight', 'C' => '%', 'D' => "SY {$years[0]}\nDS (0–100)", 'E' => "SY {$years[0]}\nPoints Earned", 'F' => "SY {$years[1]}\nDS (0–100)", 'G' => "SY {$years[1]}\nPoints Earned", 'H' => "Average\nPoints Earned"] as $col => $text) $x->set($s, "{$col}{$h}", $text, SimpleXlsxWriter::S_HEADER);
        $x->height($s, $h, 32);
        $x->set($s, 'A15', $this->areaTitle($criteria['area_name']), SimpleXlsxWriter::S_SECTION); $x->merge($s, 'A15:H15', SimpleXlsxWriter::S_SECTION);

        $row = self::FIRST_ITEM_ROW;
        foreach ($criteria['items'] as $item) {
            $x->set($s, "A{$row}", "{$item['code']}  {$item['name']}", SimpleXlsxWriter::S_CELL);
            $x->set($s, "B{$row}", self::num($item['max_points']) . ' pts', SimpleXlsxWriter::S_CELL_CENTER);
            $x->set($s, "C{$row}", $item['weight'], SimpleXlsxWriter::S_FORMULA);
            $x->style($s, "D{$row}", SimpleXlsxWriter::S_INPUT_NUMBER);
            $x->formula($s, "E{$row}", "IF(D{$row}=\"\",\"\",ROUND(D{$row}*C{$row},2))");
            $x->style($s, "F{$row}", SimpleXlsxWriter::S_INPUT_NUMBER);
            $x->formula($s, "G{$row}", "IF(F{$row}=\"\",\"\",ROUND(F{$row}*C{$row},2))");
            $x->formula($s, "H{$row}", "IF(OR(D{$row}=\"\",F{$row}=\"\"),\"\",ROUND((E{$row}+G{$row})/2,2))");
            $row++;
        }
        $first = self::FIRST_ITEM_ROW; $last = $row - 1; $count = count($criteria['items']);
        $total = $row; $pct = $row + 1; $rating = $row + 2;
        $max = self::num($criteria['area_max']);
        $x->set($s, "A{$total}", 'Category Total', SimpleXlsxWriter::S_TOTAL);
        $x->set($s, "B{$total}", "{$max} pts", SimpleXlsxWriter::S_TOTAL_FORMULA);
        foreach (['C', 'D', 'F'] as $col) $x->style($s, "{$col}{$total}", SimpleXlsxWriter::S_TOTAL);
        foreach (['E' => 'D', 'G' => 'F', 'H' => null] as $col => $ds) {
            $guard = $ds ? "COUNT({$ds}{$first}:{$ds}{$last})<{$count}" : "COUNT(H{$first}:H{$last})<{$count}";
            $x->formula($s, "{$col}{$total}", "IF({$guard},\"\",SUM({$col}{$first}:{$col}{$last}))", SimpleXlsxWriter::S_TOTAL_FORMULA);
        }
        $x->set($s, "A{$pct}", "Percentage of Area A (points ÷ {$max} × 100)", SimpleXlsxWriter::S_CELL);
        $x->set($s, "A{$rating}", 'Performance Rating', SimpleXlsxWriter::S_TOTAL);
        foreach (['B', 'C', 'D', 'F', 'H'] as $col) { $x->style($s, "{$col}{$pct}", SimpleXlsxWriter::S_CELL); $x->style($s, "{$col}{$rating}", SimpleXlsxWriter::S_TOTAL); }
        foreach (['E', 'G'] as $col) {
            $x->formula($s, "{$col}{$pct}", "IF({$col}{$total}=\"\",\"\",ROUND({$col}{$total}/{$criteria['area_max']}*100,2))");
            $x->formula($s, "{$col}{$rating}", $this->ratingFormula("{$col}{$pct}", $scale['value']['bands'] ?? []), SimpleXlsxWriter::S_TOTAL_FORMULA);
        }

        $r = $rating + 2;
        $x->set($s, "A{$r}", 'DS is the score out of 100 for each item. Points Earned = DS × %. Average Points Earned = (first school year + second school year) ÷ 2 and becomes the locked Area A score in the NTF evaluation. AchieveNest recalculates every value from the DS cells when the workbook is uploaded.', SimpleXlsxWriter::S_NOTE);
        $x->merge($s, "A{$r}:H" . ($r + 1)); $x->height($s, $r, 22); $x->height($s, $r + 1, 22);
        $r += 3;
        $x->set($s, "A{$r}", "Rating scale (AchieveNest provisional scale, version {$scale['version']}; HR may revise it)", SimpleXlsxWriter::S_LABEL);
        $r++;
        foreach (['A' => 'Performance Rating', 'B' => 'From', 'C' => 'To', 'D' => 'Result'] as $col => $text) $x->set($s, "{$col}{$r}", $text, SimpleXlsxWriter::S_HEADER);
        $bands = $scale['value']['bands'] ?? [];
        usort($bands, fn($a, $b) => $b['min_percent'] <=> $a['min_percent']);
        $upper = 100.0;
        foreach ($bands as $i => $band) {
            $r++;
            $x->set($s, "A{$r}", $band['label'], SimpleXlsxWriter::S_CELL);
            $x->set($s, "B{$r}", self::num($band['min_percent']) . '%', SimpleXlsxWriter::S_CELL_CENTER);
            $x->set($s, "C{$r}", ($i === 0 ? '100' : self::num($upper - 0.01)) . '%', SimpleXlsxWriter::S_CELL_CENTER);
            $x->set($s, "D{$r}", $band['passing'] ? 'Passing' : 'Not passing', SimpleXlsxWriter::S_CELL_CENTER);
            $upper = (float) $band['min_percent'];
        }

        $r += 2;
        $groups = $this->signatories($person);
        $titles = ['college' => 'Signatories for College-assigned personnel', 'office' => 'Signatories for Office/Unit-assigned personnel'];
        $any = array_filter($groups, fn($lines) => $lines !== []);
        if ($any === []) {
            $x->set($s, "A{$r}", 'Signatories have not been configured in AchieveNest. Sign on the lines below or ask HR to configure them under Template Settings.', SimpleXlsxWriter::S_NOTE);
            $x->merge($s, "A{$r}:H{$r}");
            $r += 3;
            foreach (['A', 'E'] as $col) {
                $end = $col === 'A' ? 'C' : 'H';
                $x->merge($s, "{$col}{$r}:{$end}{$r}", SimpleXlsxWriter::S_SIGN_LINE);
                $x->set($s, "{$col}" . ($r + 1), 'Signature over printed name / Position', SimpleXlsxWriter::S_NOTE);
                $x->merge($s, "{$col}" . ($r + 1) . ":{$end}" . ($r + 1));
            }
        } else {
            foreach ($any as $context => $lines) {
                if (! $person) { $x->set($s, "A{$r}", $titles[$context], SimpleXlsxWriter::S_LABEL); $r += 1; }
                foreach (array_chunk($lines, 2) as $pair) {
                    foreach ($pair as $i => $line) {
                        $col = $i === 0 ? 'A' : 'E'; $end = $i === 0 ? 'C' : 'H';
                        $x->set($s, "{$col}{$r}", $line['label'], SimpleXlsxWriter::S_LABEL);
                        $x->set($s, "{$col}" . ($r + 3), $line['name'], SimpleXlsxWriter::S_SIGN_LINE);
                        $x->merge($s, "{$col}" . ($r + 3) . ":{$end}" . ($r + 3), SimpleXlsxWriter::S_SIGN_LINE);
                        $x->set($s, "{$col}" . ($r + 4), $line['position'], SimpleXlsxWriter::S_NOTE);
                        $x->merge($s, "{$col}" . ($r + 4) . ":{$end}" . ($r + 4));
                    }
                    $r += 6;
                }
            }
        }

        $metaValues = [self::MARKER, self::TEMPLATE_ID, $period['id'], $criteria['version_id'], $years[0], $years[1], $person['profile_id'] ?? '', date('c'), (string) $scale['version']];
        foreach ($metaValues as $i => $value) $x->set($meta, 'A' . ($i + 1), $value);
        foreach (['marker', 'template', 'ranking_track_id', 'criteria_version_id', 'school_year_1', 'school_year_2', 'personnel_profile_id', 'generated_at', 'rating_scale_version'] as $i => $label) $x->set($meta, 'B' . ($i + 1), $label);

        $path = tempnam(sys_get_temp_dir(), 'ntfar');
        $x->save($path);
        return [$path, $person ? self::workbookFilename($years, $person) : "NTF-Annual-Review-{$years[0]}-{$years[1]}-Blank.xlsx"];
    }

    /** One prefilled workbook per personnel in the actor's roster for this track. */
    public function buildZip(array $period, array $profileIds): array
    {
        $zipPath = tempnam(sys_get_temp_dir(), 'ntfarz');
        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::OVERWRITE) !== true) throw new RuntimeException('ZIP_WRITE_FAILED: Archive could not be created.');
        $temp = []; $names = [];
        foreach ($profileIds as $id) {
            [$path, $filename] = $this->build($period, $this->personContext($id, $period));
            $base = $filename; $n = 2;
            while (isset($names[$filename])) $filename = preg_replace('/\.xlsx$/', '-' . ($n++) . '.xlsx', $base);
            $names[$filename] = true;
            $zip->addFile($path, $filename); $temp[] = $path;
        }
        $zip->close();
        foreach ($temp as $path) @unlink($path);
        $years = self::requiredYears($period['academic_year']);
        return [$zipPath, self::zipFilename($years)];
    }

    /** Formal HR-visible filename built only from authoritative personnel data. */
    public static function workbookFilename(array $years, array $person): string
    {
        $identity = array_filter([
            self::filenamePart((string) ($person['employee_id'] ?? '')),
            self::filenamePart((string) ($person['last_name'] ?? '')),
            self::filenamePart((string) ($person['first_name'] ?? '')),
        ], fn(string $value) => $value !== '');
        if ($identity === []) $identity[] = self::filenamePart((string) ($person['name'] ?? 'Personnel')) ?: 'Personnel';
        return 'NTF_AnnualReview_' . self::periodToken($years) . '_' . implode('_', $identity) . '.xlsx';
    }

    public static function zipFilename(array $years): string
    {
        return 'NTF_Annual_Review_Workbooks_' . self::periodToken($years) . '.zip';
    }

    private static function periodToken(array $years): string
    {
        $first = (string) ($years[0] ?? '');
        $second = (string) ($years[1] ?? '');
        if (preg_match('/^(\d{4})-\d{4}$/', $first, $a) && preg_match('/^\d{4}-(\d{4})$/', $second, $b)) return "SY{$a[1]}-{$b[1]}";
        return 'SY' . self::filenamePart(implode('-', $years));
    }

    private static function filenamePart(string $value): string
    {
        return trim((string) preg_replace('/[^\p{L}\p{N}-]+/u', '_', trim($value)), '_-');
    }

    private function ratingFormula(string $cell, array $bands): string
    {
        usort($bands, fn($a, $b) => $b['min_percent'] <=> $a['min_percent']);
        $expr = '"' . str_replace('"', '""', end($bands)['label'] ?? '') . '"';
        foreach (array_reverse(array_slice($bands, 0, -1)) as $band) {
            $expr = "IF({$cell}>=" . self::num($band['min_percent']) . ',"' . str_replace('"', '""', $band['label']) . '",' . $expr . ')';
        }
        return "IF({$cell}=\"\",\"\",{$expr})";
    }

    private function areaTitle(string $name): string
    {
        // "Area A – Performance and Personal Indicators" → "A. Performance and Personal Indicators"
        return preg_replace('/^Area\s+A\s*[\p{Pd}:\-]\s*/u', 'A. ', $name) ?: $name;
    }

    private function dean(array $person): array
    {
        if (empty($person['college']['id'])) return ['', ''];
        $row = $this->db->table('dean_assignments da')->select('p.full_name')->join('profiles p', 'p.id = da.personnel_profile_id')
            ->where(['da.college_id' => $person['college']['id'], 'da.is_active' => 1])->where('p.status', 'active')->get()->getResultArray();
        return count($row) === 1 ? [$row[0]['full_name'], 'Dean, ' . $person['college']['name']] : ['', 'Dean, ' . $person['college']['name'] . ' (not assigned)'];
    }

    private static function num(float|int|string $value): string
    {
        $value = (float) $value;
        return rtrim(rtrim(number_format($value, 2, '.', ''), '0'), '.');
    }
}
