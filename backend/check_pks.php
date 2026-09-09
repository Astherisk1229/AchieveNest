<?php
$db = new mysqli('localhost', 'root', '', 'achievenest_local');
$res = $db->query("
    SELECT TABLE_NAME, COLUMN_NAME, COLUMN_KEY 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'achievenest_local' AND COLUMN_KEY = 'PRI'
    ORDER BY TABLE_NAME, ORDINAL_POSITION
");
$pks = [];
while ($r = $res->fetch_assoc()) {
    $pks[$r['TABLE_NAME']][] = $r['COLUMN_NAME'];
}
echo "Total Tables with PK: " . count($pks) . "\n";
foreach ($pks as $t => $cols) {
    echo $t . ": [" . implode(', ', $cols) . "]\n";
}
