<?php
// This is deliberately not a *Test.php file and is never part of normal PHPUnit collection.
chdir(dirname(__DIR__, 2));
require 'vendor/autoload.php';
require 'tests/bootstrap.php';

use Tests\Support\Phase2\MySQL\Instance;
use Tests\Support\Phase2\PortfolioController;
use Tests\Support\Phase2\PortfolioFixture as F;

Instance::authorize();
if (($argv[1] ?? '') !== 'worker') {
    putenv('ACHIEVENEST_PHASE2_RUN=' . bin2hex(random_bytes(4)));
}
$evidenceDirectory = dirname(ROOTPATH) . '/output/phase2-evidence/run-' . getenv('ACHIEVENEST_PHASE2_RUN');
if (!is_dir($evidenceDirectory)) { mkdir($evidenceDirectory, 0777, true); }

function check(bool $condition, string $message): void
{
    if (!$condition) { throw new RuntimeException($message); }
    echo "PASS: {$message}\n";
}

function awaitFile(string $path): void
{
    $deadline = microtime(true) + 15;
    while (!is_file($path)) {
        if (microtime(true) > $deadline) { throw new RuntimeException('Barrier timeout: ' . basename($path)); }
        usleep(20000);
    }
}

function worker(string $action, string $prefix, bool $pause = false): array
{
    $command = [PHP_BINARY, __FILE__, 'worker', $action, $prefix, $pause ? 'pause' : 'run'];
    $process = proc_open($command, [0 => ['pipe', 'r'], 1 => ['file', $prefix . '.out', 'w'], 2 => ['file', $prefix . '.err', 'w']], $pipes);
    if (!is_resource($process)) { throw new RuntimeException('Unable to create proof worker'); }
    fclose($pipes[0]);
    awaitFile($prefix . '.ready');
    return [$process, $prefix];
}

function finish(array $worker): int
{
    [$process, $prefix] = $worker;
    $deadline = microtime(true) + 20;
    do {
        $state = proc_get_status($process);
        if (!$state['running']) { break; }
        if (microtime(true) > $deadline) { proc_terminate($process); throw new RuntimeException('Worker timeout'); }
        usleep(20000);
    } while (true);
    $exit = $state['exitcode'];
    proc_close($process);
    if ($exit !== 0) { throw new RuntimeException('Worker failed: ' . file_get_contents($prefix . '.err') . file_get_contents($prefix . '.out')); }
    return (int) file_get_contents($prefix . '.status');
}

if (($argv[1] ?? '') === 'worker') {
    [, , $action, $prefix, $pause] = $argv;
    $db = Instance::connect();
    $controller = new PortfolioController(db: $db);
    $controller->beforeLock = static function () use ($prefix, $pause): void {
        file_put_contents($prefix . '.ready', 'ready');
        if ($pause === 'pause') { awaitFile($prefix . '.release'); }
    };
    $controller->request(['title' => 'late edit']);
    $response = match ($action) {
        'submit' => $controller->resubmitRecord(F::RECORD),
        'edit' => $controller->update(F::RECORD),
        'remove' => $controller->removeEvidence(F::RECORD, F::EVIDENCE),
    };
    file_put_contents($prefix . '.status', (string) $response->getStatusCode());
    echo $response->getBody();
    $db->close();
    exit(0);
}

Instance::provision();
$db = Instance::connect();
F::create($db, 'mysql-disposable');
$identity = $db->query('SELECT @@port AS port, @@datadir AS datadir, @@server_uuid AS uuid, DATABASE() AS db')->getRowArray();
file_put_contents($evidenceDirectory . '/mysql-identity.json', json_encode($identity, JSON_PRETTY_PRINT));

// Reproduce the original ID-only update against a synthetic row after a simulated review.
$stale = $db->table('student_portfolio_records')->where('id', F::RECORD)->get()->getRowArray();
$db->table('student_portfolio_records')->where('id', F::RECORD)->update(['status' => 'verified']);
$db->table('student_portfolio_records')->where('id', F::RECORD)->update(['status' => 'submitted']);
check($stale['status'] === 'draft' && $db->table('student_portfolio_records')->get()->getRow()->status === 'submitted', 'Original ID-only pattern overwrites a synthetic review');
$db->table('student_portfolio_records')->where('id', F::RECORD)->update(['status' => 'draft']);

// Two real PHP processes wait on the same InnoDB record lock, then race to submit.
$db->transBegin();
$db->query('SELECT id FROM student_portfolio_records WHERE id = ? FOR UPDATE', [F::RECORD]);
$first = worker('submit', $evidenceDirectory . '/submit-a');
$second = worker('submit', $evidenceDirectory . '/submit-b');
$deadline = microtime(true) + 10;
do {
    $waits = (int) $db->query('SELECT COUNT(*) AS n FROM performance_schema.data_lock_waits')->getRow()->n;
    if ($waits >= 2) { break; }
    if (microtime(true) > $deadline) { throw new RuntimeException('Expected two observed InnoDB lock waits'); }
    usleep(20000);
} while (true);
check($waits >= 2, 'Both submitters demonstrably wait on InnoDB locks');
$db->transCommit();
$statuses = [finish($first), finish($second)]; sort($statuses);
check($statuses === [200, 403], 'Exactly one concurrent submit succeeds');
check($db->table('student_portfolio_verification_events')->countAllResults() === 1, 'One submission event');
check($db->table('notifications')->countAllResults() === 1, 'One submission notification');

// Delay the next request before its lock. Commit a review before it can continue.
$late = worker('submit', $evidenceDirectory . '/submit-after-review', true);
$reviewer = new PortfolioController(db: $db); $reviewer->reviewer = true; $reviewer->request();
check($reviewer->verifyRecord(F::RECORD)->getStatusCode() === 200, 'Reviewer commits verification');
file_put_contents($late[1] . '.release', 'release');
check(finish($late) === 403, 'Delayed submit cannot reverse committed verification');
check($db->table('student_portfolio_records')->get()->getRow()->status === 'verified', 'Verified state preserved');
check($db->table('student_portfolio_verification_events')->where('action', 'submitted')->countAllResults() === 1, 'No duplicate submitted event after review');
check($db->table('notifications')->where('notification_type', 'student_achievement_submitted')->countAllResults() === 1, 'No duplicate submission notification after review');

// Editing/removal likewise re-read the post-submit state after a real lock wait.
foreach (['edit', 'remove'] as $action) {
    $db->table('student_portfolio_records')->where('id', F::RECORD)->update(['status' => 'draft']);
    $db->transBegin();
    $db->table('student_portfolio_records')->where('id', F::RECORD)->update(['status' => 'submitted']);
    $pending = worker($action, $evidenceDirectory . '/' . $action . '-after-submit');
    $db->transCommit();
    check(finish($pending) === 403, $action . ' refuses the newly submitted state');
}
check($db->table('student_portfolio_evidence')->get()->getRow()->status === 'active', 'Submitted evidence remains active');
check($db->table('student_portfolio_records')->get()->getRow()->title === 'mysql-disposable achievement', 'Submitted content remains unchanged');
$db->close();
echo "PHASE2_MYSQL_PROOF=PASS\n";
