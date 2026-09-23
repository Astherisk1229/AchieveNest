<?php

namespace App\Services;

use App\Helpers\ValidationHelper;
use Config\Database;
use Throwable;
use ZipArchive;
use SimpleXMLElement;

class PersonnelImportService
{
    protected $db;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    private function genUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
        );
    }

    /**
     * Generates a standard Excel template (.xlsx) with Guidance worksheet and valid headers.
     */
    public function generateTemplate(): string
    {
        $headers = [
            'Employee ID',
            'Institutional Email',
            'First Name',
            'Middle Name',
            'Last Name',
            'Suffix',
            'Personnel Type',
            'Personnel Status',
            'Organizational Side',
            'Organizational Unit Code',
            'Faculty Engagement',
            'Position Title',
            'Current Rank Title'
        ];

        $sampleRow = [
            'EMP-2026-001',
            'sample.faculty@ndmu.edu.ph',
            'Maria',
            'Clara',
            'Santos',
            '',
            'Faculty',
            'Permanent',
            'Academic',
            'CBA',
            'full_time_faculty',
            'Assistant Professor',
            'Assistant Professor I'
        ];

        // We build a clean OpenXML .xlsx in memory via ZipArchive
        $tempFile = tempnam(sys_get_temp_dir(), 'xlsx_tpl_');
        $zip = new ZipArchive();
        $zip->open($tempFile, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        // [Content_Types].xml
        $contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' .
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' .
            '<Default Extension="xml" ContentType="application/xml"/>' .
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' .
            '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' .
            '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' .
            '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>' .
            '</Types>';
        $zip->addFromString('[Content_Types].xml', $contentTypes);

        // _rels/.rels
        $rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' .
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' .
            '</Relationships>';
        $zip->addFromString('_rels/.rels', $rels);

        // xl/_rels/workbook.xml.rels
        $wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' .
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' .
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>' .
            '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>' .
            '</Relationships>';
        $zip->addFromString('xl/_rels/workbook.xml.rels', $wbRels);

        // xl/workbook.xml
        $workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' .
            '<sheets>' .
            '<sheet name="Personnel Roster" sheetId="1" r:id="rId1"/>' .
            '<sheet name="Guidance &amp; Allowed Values" sheetId="2" r:id="rId2"/>' .
            '</sheets>' .
            '</workbook>';
        $zip->addFromString('xl/workbook.xml', $workbook);

        // Shared strings
        $strings = array_merge(
            $headers,
            $sampleRow,
            [
                'ACHIEVENEST PERSONNEL BATCH IMPORT GUIDELINES',
                'Field',
                'Allowed Values / Format',
                'Description / Rules',
                'Personnel Type',
                'Faculty | Non-Teaching Faculty',
                'Must be Faculty or Non-Teaching Faculty. Never use contractual or part-time here.',
                'Personnel Status',
                'Permanent | Probationary',
                'Must be Permanent or Probationary. Never use full_time or temporary.',
                'Organizational Side',
                'Academic | Non-Academic',
                'Academic units link to Colleges (e.g., CBA, CET). Non-Academic link to Administrative Units (e.g., HR, OSAD).',
                'Institutional Email',
                'user@ndmu.edu.ph',
                'Must end in @ndmu.edu.ph and be unique.'
            ]
        );
        $strings = array_values(array_unique($strings));
        $stringMap = array_flip($strings);

        $sstXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="' . count($strings) . '" uniqueCount="' . count($strings) . '">';
        foreach ($strings as $s) {
            $sstXml .= '<si><t>' . htmlspecialchars($s, ENT_XML1, 'UTF-8') . '</t></si>';
        }
        $sstXml .= '</sst>';
        $zip->addFromString('xl/sharedStrings.xml', $sstXml);

        // Sheet 1: Personnel Roster
        $sheet1Xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
        // Row 1: Headers
        $sheet1Xml .= '<row r="1">';
        foreach ($headers as $colIdx => $h) {
            $colLetter = chr(65 + $colIdx);
            $strIdx = $stringMap[$h];
            $sheet1Xml .= '<c r="' . $colLetter . '1" t="s"><v>' . $strIdx . '</v></c>';
        }
        $sheet1Xml .= '</row>';
        // Row 2: Sample Row
        $sheet1Xml .= '<row r="2">';
        foreach ($sampleRow as $colIdx => $val) {
            $colLetter = chr(65 + $colIdx);
            if ($val !== '') {
                $strIdx = $stringMap[$val];
                $sheet1Xml .= '<c r="' . $colLetter . '2" t="s"><v>' . $strIdx . '</v></c>';
            }
        }
        $sheet1Xml .= '</row>';
        $sheet1Xml .= '</sheetData>' .
            '<dataValidations count="4">' .
            '<dataValidation type="list" allowBlank="0" showErrorMessage="1" sqref="G2:G1000"><formula1>&quot;Faculty,Non-Teaching Faculty&quot;</formula1></dataValidation>' .
            '<dataValidation type="list" allowBlank="0" showErrorMessage="1" sqref="H2:H1000"><formula1>&quot;Permanent,Probationary&quot;</formula1></dataValidation>' .
            '<dataValidation type="list" allowBlank="0" showErrorMessage="1" sqref="I2:I1000"><formula1>&quot;Academic,Non-Academic&quot;</formula1></dataValidation>' .
            '<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="K2:K1000"><formula1>&quot;full_time_faculty,part_time_faculty&quot;</formula1></dataValidation>' .
            '</dataValidations></worksheet>';
        $zip->addFromString('xl/worksheets/sheet1.xml', $sheet1Xml);

        // Sheet 2: Guidance
        $sheet2Xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' .
            '<row r="1"><c r="A1" t="s"><v>' . $stringMap['ACHIEVENEST PERSONNEL BATCH IMPORT GUIDELINES'] . '</v></c></row>' .
            '<row r="3"><c r="A3" t="s"><v>' . $stringMap['Field'] . '</v></c><c r="B3" t="s"><v>' . $stringMap['Allowed Values / Format'] . '</v></c><c r="C3" t="s"><v>' . $stringMap['Description / Rules'] . '</v></c></row>' .
            '<row r="4"><c r="A4" t="s"><v>' . $stringMap['Personnel Type'] . '</v></c><c r="B4" t="s"><v>' . $stringMap['Faculty | Non-Teaching Faculty'] . '</v></c><c r="C4" t="s"><v>' . $stringMap['Must be Faculty or Non-Teaching Faculty. Never use contractual or part-time here.'] . '</v></c></row>' .
            '<row r="5"><c r="A5" t="s"><v>' . $stringMap['Personnel Status'] . '</v></c><c r="B5" t="s"><v>' . $stringMap['Permanent | Probationary'] . '</v></c><c r="C5" t="s"><v>' . $stringMap['Must be Permanent or Probationary. Never use full_time or temporary.'] . '</v></c></row>' .
            '<row r="6"><c r="A6" t="s"><v>' . $stringMap['Organizational Side'] . '</v></c><c r="B6" t="s"><v>' . $stringMap['Academic | Non-Academic'] . '</v></c><c r="C6" t="s"><v>' . $stringMap['Academic units link to Colleges (e.g., CBA, CET). Non-Academic link to Administrative Units (e.g., HR, OSAD).'] . '</v></c></row>' .
            '<row r="7"><c r="A7" t="s"><v>' . $stringMap['Institutional Email'] . '</v></c><c r="B7" t="s"><v>' . $stringMap['user@ndmu.edu.ph'] . '</v></c><c r="C7" t="s"><v>' . $stringMap['Must end in @ndmu.edu.ph and be unique.'] . '</v></c></row>' .
            '</sheetData></worksheet>';
        $zip->addFromString('xl/worksheets/sheet2.xml', $sheet2Xml);

        $zip->close();
        $content = file_get_contents($tempFile);
        @unlink($tempFile);

        return $content;
    }

    /**
     * Parses uploaded XLSX / CSV file into normalized associative row arrays.
     */
    public function parseFile(string $filePath, string $mimeType = ''): array
    {
        if (!file_exists($filePath)) {
            throw new \RuntimeException('Uploaded file not found on server.');
        }

        // Check if CSV
        if (str_ends_with(strtolower($filePath), '.csv') || str_contains($mimeType, 'csv')) {
            return $this->parseCsv($filePath);
        }

        // Otherwise parse as XLSX
        return $this->parseXlsx($filePath);
    }

    private function parseCsv(string $filePath): array
    {
        $rows = [];
        if (($handle = fopen($filePath, 'r')) !== false) {
            $headers = null;
            while (($data = fgetcsv($handle, 2000, ',')) !== false) {
                if ($headers === null) {
                    $headers = array_map([$this, 'normalizeHeaderKey'], $data);
                    continue;
                }
                if (empty(array_filter($data, static fn($v) => trim((string)$v) !== ''))) {
                    continue; // Skip empty rows
                }
                $row = [];
                foreach ($headers as $idx => $key) {
                    $row[$key] = isset($data[$idx]) ? trim((string)$data[$idx]) : '';
                }
                $rows[] = $row;
            }
            fclose($handle);
        }
        return $rows;
    }

    private function parseXlsx(string $filePath): array
    {
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            throw new \RuntimeException('Invalid or corrupt XLSX file structure.');
        }

        // Extract sharedStrings
        $sharedStrings = [];
        $sstXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($sstXml !== false) {
            $xml = simplexml_load_string($sstXml);
            if ($xml !== false) {
                foreach ($xml->si as $si) {
                    if (isset($si->t)) {
                        $sharedStrings[] = (string)$si->t;
                    } elseif (isset($si->r)) {
                        $text = '';
                        foreach ($si->r as $r) {
                            $text .= (string)$r->t;
                        }
                        $sharedStrings[] = $text;
                    } else {
                        $sharedStrings[] = '';
                    }
                }
            }
        }

        // Extract sheet1.xml
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        if ($sheetXml === false) {
            throw new \RuntimeException('XLSX worksheet sheet1.xml missing.');
        }

        $xml = simplexml_load_string($sheetXml);
        if ($xml === false || !isset($xml->sheetData)) {
            throw new \RuntimeException('Unable to parse XLSX sheet structure.');
        }

        $rows = [];
        $headerMap = [];
        $isFirstRow = true;

        foreach ($xml->sheetData->row as $row) {
            $rowCells = [];
            foreach ($row->c as $cell) {
                $ref = (string)$cell['r'];
                $colLetter = preg_replace('/[0-9]/', '', $ref);
                $type = (string)$cell['t'];
                $val = (string)$cell->v;

                if ($type === 's' && isset($sharedStrings[(int)$val])) {
                    $val = $sharedStrings[(int)$val];
                }

                $rowCells[$colLetter] = trim($val);
            }

            if ($isFirstRow) {
                foreach ($rowCells as $colLetter => $headerName) {
                    $normKey = $this->normalizeHeaderKey($headerName);
                    if ($normKey !== '') {
                        $headerMap[$colLetter] = $normKey;
                    }
                }
                $isFirstRow = false;
                continue;
            }

            // Map data row
            if (empty(array_filter($rowCells, static fn($v) => $v !== ''))) {
                continue; // Skip empty row
            }

            $mappedRow = [];
            foreach ($headerMap as $colLetter => $normKey) {
                $mappedRow[$normKey] = $rowCells[$colLetter] ?? '';
            }
            $rows[] = $mappedRow;
        }

        return $rows;
    }

    private function normalizeHeaderKey(string $header): string
    {
        $h = strtolower(trim($header));
        $h = str_replace([' ', '-', '_'], '', $h);

        return match ($h) {
            'employeeid', 'institutionalid', 'id' => 'institutional_id',
            'institutionalemail', 'email' => 'institutional_email',
            'firstname' => 'first_name',
            'middlename' => 'middle_name',
            'lastname' => 'last_name',
            'suffix' => 'suffix',
            'personneltype', 'personnelgroup', 'group', 'type' => 'personnel_group',
            'personnelstatus', 'employmentstatus', 'status' => 'employment_status',
            'organizationalside', 'orgside', 'side', 'classification' => 'organizational_side',
            'organizationalunitcode', 'organizationalunit', 'unitcode', 'unit', 'college', 'department' => 'organizational_unit',
            'facultyengagement', 'engagement' => 'faculty_engagement',
            'positiontitle', 'position', 'designation' => 'position_title',
            'currentranktitle', 'ranktitle', 'rank' => 'current_rank_title',
            default => ''
        };
    }

    /**
     * Validates raw rows and produces detailed preview classification.
     */
    public function validateRows(array $rawRows): array
    {
        $validated = [];
        $seenIds = [];
        $seenEmails = [];

        // Preload valid colleges and administrative units
        $colleges = $this->db->table('colleges')->where('status', 'active')->get()->getResultArray();
        $collegeMap = [];
        foreach ($colleges as $c) {
            $collegeMap[strtoupper($c['code'])] = $c['id'];
            $collegeMap[strtoupper($c['id'])] = $c['id'];
        }

        $units = $this->db->table('administrative_units')->where('status', 'active')->get()->getResultArray();
        $unitMap = [];
        foreach ($units as $u) {
            $unitMap[strtoupper($u['code'])] = $u['id'];
            $unitMap[strtoupper($u['id'])] = $u['id'];
            $unitMap[strtoupper($u['name'])] = $u['id'];
        }

        $clsService = new PersonnelClassificationService();
        $facultyStatusService = new FacultyStatusService();

        foreach ($rawRows as $index => $row) {
            $rowNum = $index + 1;
            $errors = [];
            $warnings = [];

            $instId = trim((string)($row['institutional_id'] ?? ''));
            $email  = trim((string)($row['institutional_email'] ?? ''));
            $firstName = trim((string)($row['first_name'] ?? ''));
            $middleName = trim((string)($row['middle_name'] ?? '')) ?: null;
            $lastName = trim((string)($row['last_name'] ?? ''));
            $suffix = trim((string)($row['suffix'] ?? '')) ?: null;

            $rawGroup = trim((string)($row['personnel_group'] ?? ''));
            $rawStatus = trim((string)($row['employment_status'] ?? ''));
            $rawSide = trim((string)($row['organizational_side'] ?? ''));
            $rawUnit = trim((string)($row['organizational_unit'] ?? ''));
            $rawEngagement = trim((string)($row['faculty_engagement'] ?? 'full_time_faculty'));
            $positionTitle = trim((string)($row['position_title'] ?? 'Personnel'));
            $currentRankTitle = trim((string)($row['current_rank_title'] ?? '')) ?: null;

            // 1. Identity Validations
            if ($instId === '') {
                $errors[] = 'Missing Institutional / Employee ID.';
            }
            if ($email === '') {
                $errors[] = 'Missing Institutional Email.';
            } else {
                $canonicalEmail = ValidationHelper::canonicalizeNdmuEmail($email);
                if ($canonicalEmail === null) {
                    $errors[] = 'Email must be a valid @ndmu.edu.ph address.';
                } else {
                    $email = $canonicalEmail;
                }
            }
            if ($firstName === '') {
                $errors[] = 'Missing First Name.';
            }
            if ($lastName === '') {
                $errors[] = 'Missing Last Name.';
            }

            // 2. In-File Duplicate Checks
            if ($instId !== '') {
                if (isset($seenIds[strtoupper($instId)])) {
                    $errors[] = "Duplicate Employee ID '{$instId}' within uploaded file.";
                }
                $seenIds[strtoupper($instId)] = true;
            }
            if ($email !== '') {
                if (isset($seenEmails[strtolower($email)])) {
                    $errors[] = "Duplicate Email '{$email}' within uploaded file.";
                }
                $seenEmails[strtolower($email)] = true;
            }

            // 3. Database Duplicate Checks
            if ($instId !== '' || $email !== '') {
                $dupQuery = $this->db->table('profiles')
                    ->groupStart()
                    ->where('institutional_id', $instId)
                    ->orWhere('email', $email)
                    ->groupEnd()
                    ->get()->getRowArray();
                if ($dupQuery !== null) {
                    if (strcasecmp($dupQuery['institutional_id'] ?? '', $instId) === 0) {
                        $errors[] = "Employee ID '{$instId}' already exists in database.";
                    }
                    if (strcasecmp($dupQuery['email'] ?? '', $email) === 0) {
                        $errors[] = "Institutional Email '{$email}' already exists in database.";
                    }
                }
            }

            // 4. Canonical Classification Pair Validation
            $normGroup = match (strtolower($rawGroup)) {
                'faculty' => 'faculty',
                'non-teaching faculty', 'non_teaching_faculty', 'nonteachingfaculty', 'staff' => 'non_teaching_faculty',
                default => null
            };
            $normSide = match (strtolower($rawSide)) {
                'academic' => 'academic',
                'non-academic', 'non_academic', 'nonacademic' => 'non_academic',
                default => null
            };

            if ($normGroup === null) {
                $errors[] = "Invalid Personnel Type '{$rawGroup}'. Must be 'Faculty' or 'Non-Teaching Faculty'.";
            }
            if ($normSide === null) {
                $errors[] = "Invalid Organizational Side '{$rawSide}'. Must be 'Academic' or 'Non-Academic'.";
            }

            if ($normGroup !== null && $normSide !== null) {
                $clsResult = $clsService->validatePair($normGroup, $normSide);
                if (!$clsResult['valid']) {
                    $errors[] = $clsResult['error']['message'] ?? 'Invalid classification pair.';
                }
            }

            // 5. Personnel Status Validation (Strictly Permanent | Probationary)
            $normStatus = match (strtolower($rawStatus)) {
                'permanent' => 'permanent',
                'probationary' => 'probationary',
                default => null
            };
            if ($normStatus === null) {
                $errors[] = "Invalid Personnel Status '{$rawStatus}'. Must be 'Permanent' or 'Probationary' (Never full_time or contractual).";
            }

            // 6. Organizational Unit Placement Validation
            $resolvedCollegeId = null;
            $resolvedUnitId = null;
            $resolvedProgramIds = [];

            if ($normSide === 'academic') {
                $lookupKey = strtoupper($rawUnit);
                if (isset($collegeMap[$lookupKey])) {
                    $resolvedCollegeId = $collegeMap[$lookupKey];
                    // Link to default or active program under college
                    $prog = $this->db->table('academic_programs')
                        ->where('college_id', $resolvedCollegeId)
                        ->where('status', 'active')
                        ->get()->getRowArray();
                    if ($prog !== null) {
                        $resolvedProgramIds = [$prog['id']];
                    }
                } else {
                    $errors[] = "Unknown or inactive Academic College '{$rawUnit}'. Valid examples: CBA, CET, CAS, CTE, CHS, CEAC.";
                }
            } elseif ($normSide === 'non_academic') {
                $lookupKey = strtoupper($rawUnit);
                if (isset($unitMap[$lookupKey])) {
                    $resolvedUnitId = $unitMap[$lookupKey];
                } else {
                    $errors[] = "Unknown or inactive Administrative Unit '{$rawUnit}'. Valid examples: HR, OSAD, REGISTRAR, IT.";
                }
            }

            // 7. Engagement & Rank Cross-over Validation
            $normEngagement = match (strtolower($rawEngagement)) {
                'part_time_faculty', 'part-time faculty', 'part time' => 'part_time_faculty',
                default => 'full_time_faculty'
            };

            $isDuplicate = false;
            foreach ($errors as $err) {
                if (str_contains($err, 'already exists') || str_contains($err, 'Duplicate')) {
                    $isDuplicate = true;
                    break;
                }
            }

            $isValid = count($errors) === 0;
            $resultStatus = $isValid ? 'VALID' : ($isDuplicate ? 'DUPLICATE' : 'INVALID');

            $fullName = trim(implode(' ', array_filter([$firstName, $middleName, $lastName, $suffix])));

            $validated[] = [
                'row_number'           => $rowNum,
                'institutional_id'     => $instId,
                'institutional_email'  => $email,
                'first_name'           => $firstName,
                'middle_name'          => $middleName,
                'last_name'            => $lastName,
                'suffix'               => $suffix,
                'full_name'            => $fullName,
                'personnel_group'      => $normGroup,
                'employment_status'    => $normStatus,
                'organizational_side'  => $normSide,
                'faculty_engagement'   => $normEngagement,
                'position_title'       => $positionTitle,
                'current_rank_title'   => $currentRankTitle,
                'college_id'           => $resolvedCollegeId,
                'academic_program_ids' => $resolvedProgramIds,
                'administrative_unit_id' => $resolvedUnitId,
                'unit_code'            => $rawUnit,
                'is_valid'             => $isValid,
                'result_status'        => $resultStatus,
                'errors'               => $errors,
                'warnings'             => $warnings,
            ];
        }

        $validCount = count(array_filter($validated, static fn($r) => $r['is_valid']));
        $invalidCount = count(array_filter($validated, static fn($r) => !$r['is_valid'] && $r['result_status'] !== 'DUPLICATE'));
        $duplicateCount = count(array_filter($validated, static fn($r) => $r['result_status'] === 'DUPLICATE'));

        return [
            'total_rows'      => count($validated),
            'valid_count'     => $validCount,
            'invalid_count'   => $invalidCount,
            'duplicate_count' => $duplicateCount,
            'preview'         => $validated,
        ];
    }

    /**
     * Commits validated rows safely within an atomic transaction.
     */
    public function commitRows(array $validRows, array $actor): array
    {
        $importedCount = 0;
        $failedCount = 0;
        $failureDetails = [];

        $personnelRole = $this->db->table('roles')->where('role_key', 'personnel')->get()->getRowArray();
        if ($personnelRole === null) {
            throw new \RuntimeException('Personnel role catalog definition missing.');
        }

        $this->db->transStart();
        try {
            $now = date('Y-m-d H:i:s');
            foreach ($validRows as $row) {
                if (empty($row['is_valid'])) {
                    continue;
                }

                $authUserId = $this->genUuid();
                $tempPassword = ValidationHelper::generateTemporaryPassword();
                $passwordHash = password_hash($tempPassword, PASSWORD_DEFAULT);

                // Insert profile
                $this->db->table('profiles')->insert([
                    'id'                => $authUserId,
                    'institutional_id'  => $row['institutional_id'],
                    'email'             => $row['institutional_email'],
                    'first_name'        => $row['first_name'],
                    'middle_name'       => $row['middle_name'],
                    'last_name'         => $row['last_name'],
                    'full_name'         => $row['full_name'],
                    'account_type'      => 'personnel',
                    'designation_title' => $row['position_title'],
                    'status'            => 'active',
                    'password_hash'     => $passwordHash,
                    'created_at'        => $now,
                    'updated_at'        => $now,
                ]);

                // Insert personnel profile
                $this->db->table('personnel_profiles')->insert([
                    'profile_id'               => $authUserId,
                    'personnel_classification' => $row['organizational_side'],
                    'personnel_group'          => $row['personnel_group'],
                    'organizational_side'      => $row['organizational_side'],
                    'employment_status'        => $row['employment_status'],
                    'faculty_engagement'       => $row['faculty_engagement'],
                    'position_title'           => $row['position_title'],
                    'current_rank_title'       => $row['current_rank_title'],
                    'college_id'               => $row['college_id'],
                    'administrative_unit_id'   => $row['administrative_unit_id'],
                ]);

                // Insert affiliations
                if ($row['organizational_side'] === 'academic' && !empty($row['college_id'])) {
                    $this->db->table('personnel_college_affiliations')->insert([
                        'id'                   => $this->genUuid(),
                        'personnel_profile_id' => $authUserId,
                        'college_id'           => $row['college_id'],
                        'effective_from'       => date('Y-m-d'),
                        'is_active'            => 1,
                    ]);
                    foreach ($row['academic_program_ids'] ?? [] as $progId) {
                        $this->db->table('personnel_program_affiliations')->insert([
                            'id'                   => $this->genUuid(),
                            'personnel_profile_id' => $authUserId,
                            'academic_program_id'  => $progId,
                            'effective_from'       => date('Y-m-d'),
                            'is_active'            => 1,
                        ]);
                    }
                } elseif (!empty($row['administrative_unit_id'])) {
                    $this->db->table('personnel_administrative_unit_affiliations')->insert([
                        'id'                     => $this->genUuid(),
                        'personnel_profile_id'   => $authUserId,
                        'administrative_unit_id' => $row['administrative_unit_id'],
                        'effective_from'         => date('Y-m-d'),
                        'is_active'              => 1,
                    ]);
                }

                // Insert role
                $this->db->table('profile_roles')->insert([
                    'id'          => $this->genUuid(),
                    'profile_id'  => $authUserId,
                    'role_id'     => $personnelRole['id'],
                    'scope_type'  => 'university',
                    'scope_id'    => null,
                    'is_active'   => 1,
                    'assigned_by' => $actor['profile']['id'],
                    'assigned_at' => $now,
                ]);

                // Sync credentials
                $this->db->table('local_auth_credentials')->insert([
                    'profile_id'           => $authUserId,
                    'password_hash'        => $passwordHash,
                    'must_change_password' => 1,
                    'password_changed_at'  => null,
                    'status'               => 'active',
                    'created_at'           => $now,
                    'updated_at'           => $now,
                ]);

                // Audit log
                $this->db->table('audit_logs')->insert([
                    'id'               => $this->genUuid(),
                    'actor_profile_id' => $actor['profile']['id'],
                    'event_code'       => 'PERSONNEL_BATCH_IMPORTED',
                    'category'         => 'provisioning',
                    'target_type'      => 'personnel',
                    'target_id'        => $authUserId,
                    'outcome'          => 'success',
                    'ip_address'       => service('request')->getIPAddress(),
                    'details'          => "Personnel {$row['full_name']} batch imported by HR.",
                    'safe_context'     => json_encode([
                        'institutional_id'  => $row['institutional_id'],
                        'personnel_group'   => $row['personnel_group'],
                        'employment_status' => $row['employment_status'],
                        'unit'              => $row['unit_code'],
                    ]),
                ]);

                $importedCount++;
            }

            $this->db->transComplete();
        } catch (Throwable $e) {
            $this->db->transRollback();
            throw new \RuntimeException('Batch import transaction failed: ' . $e->getMessage());
        }

        return [
            'total_submitted' => count($validRows),
            'imported_count'  => $importedCount,
            'failed_count'    => $failedCount,
            'summary'         => "Successfully imported {$importedCount} personnel records with atomic transaction integrity."
        ];
    }
}
