<?php
$db = new mysqli('localhost', 'root', '', 'achievenest_local');
if ($db->connect_error) {
    die("Connection error: " . $db->connect_error);
}
$res = $db->query('DESCRIBE award_criteria');
while ($row = $res->fetch_assoc()) {
    echo $row['Field'] . ' | ' . $row['Type'] . "\n";
}
