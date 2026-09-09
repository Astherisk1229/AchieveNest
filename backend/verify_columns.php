<?php
$db = new mysqli('localhost', 'root', '', 'achievenest_local');
if ($db->connect_error) {
    die("Connection error: " . $db->connect_error);
}

// Check if candidate_status column exists
$res = $db->query("SHOW COLUMNS FROM student_award_evaluations LIKE 'candidate_status'");
if ($res && $res->num_rows === 0) {
    $db->query("ALTER TABLE student_award_evaluations ADD COLUMN candidate_status VARCHAR(30) DEFAULT 'NOT_CLASSIFIED' AFTER qualifies_portfolio_based");
    echo "Added candidate_status column\n";
}

$res2 = $db->query("SHOW COLUMNS FROM student_award_evaluations LIKE 'candidate_classified_at'");
if ($res2 && $res2->num_rows === 0) {
    $db->query("ALTER TABLE student_award_evaluations ADD COLUMN candidate_classified_at DATETIME(6) NULL AFTER candidate_status");
    echo "Added candidate_classified_at column\n";
}

echo "Columns verified successfully.\n";
