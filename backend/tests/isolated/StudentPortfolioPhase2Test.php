<?php
namespace Tests\Isolated;

use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;
use Tests\Support\Phase2\PortfolioController;
use Tests\Support\Phase2\PortfolioFixture as F;

final class StudentPortfolioPhase2Test extends CIUnitTestCase
{
    private function memory(): \CodeIgniter\Database\BaseConnection
    {
        return Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => '', 'DBDebug' => true], false);
    }

    public function testControllerWithoutInjectionUsesSelectedTestsGroup(): void
    {
        $db = Database::connect('tests');
        F::create($db, 'implicit-selected');
        $controller = new PortfolioController(); $controller->request();
        self::assertStringContainsString('implicit-selected achievement', $controller->index()->getBody());
        self::assertSame(':memory:', $db->database);
        // The named working group remains forbidden, including after controller creation.
        $this->expectException(\RuntimeException::class);
        Database::connect('default');
    }

    public function testManualMysqlProofCannotConnectWithoutExplicitOptIn(): void
    {
        $previous = getenv('ACHIEVENEST_PHASE2_MYSQL');
        putenv('ACHIEVENEST_PHASE2_MYSQL');
        try {
            $this->expectException(\RuntimeException::class);
            $this->expectExceptionMessage('PHASE2_MYSQL_REQUIRES_EXPLICIT_OPT_IN');
            \Tests\Support\Phase2\MySQL\Instance::connect();
        } finally {
            putenv($previous === false ? 'ACHIEVENEST_PHASE2_MYSQL' : 'ACHIEVENEST_PHASE2_MYSQL=' . $previous);
        }
    }

    public function testSelectedDatabaseOwnsReadsWritesValidationPoliciesAndActorLookup(): void
    {
        $selected = $this->memory();
        $decoy = $this->memory();
        F::create($selected, 'selected');
        F::create($decoy, 'decoy');
        $controller = new PortfolioController(db: $selected);
        $controller->request();
        self::assertStringContainsString('selected achievement', $controller->index()->getBody());
        self::assertStringContainsString('selected achievement', $controller->get(F::RECORD)->getBody());
        $controller->request(['title' => 'changed selected']);
        self::assertSame(200, $controller->update(F::RECORD)->getStatusCode());
        self::assertSame('decoy achievement', $decoy->table('student_portfolio_records')->get()->getRow()->title);
        $controller->request(['title' => 'New draft', 'submit_now' => false]);
        self::assertSame(201, $controller->create()->getStatusCode());
        self::assertSame(2, $selected->table('student_portfolio_records')->countAllResults());
        self::assertSame(1, $decoy->table('student_portfolio_records')->countAllResults());
        $tokens = $this->createMock(\App\Services\LocalTokenService::class);
        $tokens->method('verifyToken')->willReturn((object) ['sub' => F::OWNER]);
        $actor = (new \App\Services\AuthenticatedActorService($tokens, $selected))->resolveActor('Bearer synthetic');
        self::assertSame('selected-student', $actor['profile']['full_name']);
        $controller->request();
        self::assertSame(200, $controller->resubmitRecord(F::RECORD)->getStatusCode());
        self::assertSame('draft', $decoy->table('student_portfolio_records')->get()->getRow()->status);
        self::assertSame(1, $selected->table('notifications')->countAllResults());
        $controller->reviewer = true;
        self::assertStringContainsString('changed selected', $controller->coordinatorQueue()->getBody());
        self::assertStringContainsString('changed selected', $controller->index()->getBody());
        $controller->request(['remarks' => 'Synthetic rejection']);
        self::assertSame(200, $controller->rejectRecord(F::RECORD)->getStatusCode());
        self::assertSame('rejected', $selected->table('student_portfolio_records')->where('id', F::RECORD)->get()->getRow()->status);
        $selected->close(); $decoy->close();
    }

    public function testRepeatedSubmissionCannotOverwriteReviewOrDuplicateSideEffects(): void
    {
        $db = $this->memory(); F::create($db);
        $controller = new PortfolioController(db: $db); $controller->request();
        self::assertSame(200, $controller->resubmitRecord(F::RECORD)->getStatusCode());
        $controller->request();
        self::assertSame(403, $controller->resubmitRecord(F::RECORD)->getStatusCode());
        self::assertSame(1, $db->table('student_portfolio_verification_events')->countAllResults());
        self::assertSame(1, $db->table('notifications')->countAllResults());
        $controller->reviewer = true; $controller->request();
        self::assertSame(200, $controller->verifyRecord(F::RECORD)->getStatusCode());
        $controller->reviewer = false; $controller->request(['title' => 'late edit']);
        self::assertSame(403, $controller->update(F::RECORD)->getStatusCode());
        self::assertSame(403, $controller->removeEvidence(F::RECORD, F::EVIDENCE)->getStatusCode());
        self::assertSame(403, $controller->resubmitRecord(F::RECORD)->getStatusCode());
        self::assertSame('verified', $db->table('student_portfolio_records')->get()->getRow()->status);
        self::assertSame('active', $db->table('student_portfolio_evidence')->get()->getRow()->status);
        $db->close();
    }

    public function testEvidenceRemovalAndValidationFailureLeaveNoOpenTransaction(): void
    {
        $db = $this->memory(); F::create($db);
        $controller = new PortfolioController(db: $db); $controller->request();
        self::assertSame(200, $controller->removeEvidence(F::RECORD, F::EVIDENCE)->getStatusCode());
        self::assertSame(422, $controller->resubmitRecord(F::RECORD)->getStatusCode());
        self::assertSame('draft', $db->table('student_portfolio_records')->get()->getRow()->status);
        self::assertSame(0, $db->table('notifications')->countAllResults());
        self::assertSame(0, (new \ReflectionProperty($db, 'transDepth'))->getValue($db));
        $db->close();
    }

    public function testSuccessfulNestedEditDoesNotRollBackCallerTransaction(): void
    {
        $db = $this->memory(); F::create($db);
        $db->transBegin();
        $controller = new PortfolioController(db: $db); $controller->request(['title' => 'nested edit']);
        self::assertSame(200, $controller->update(F::RECORD)->getStatusCode());
        self::assertSame(1, (new \ReflectionProperty($db, 'transDepth'))->getValue($db));
        self::assertSame('nested edit', $db->table('student_portfolio_records')->get()->getRow()->title);
        $db->transRollback();
        self::assertSame('selected achievement', $db->table('student_portfolio_records')->get()->getRow()->title);
        $db->close();
    }

    public function testLateScanCannotChangeSubmittedEvidence(): void
    {
        $db = $this->memory(); F::create($db);
        $storage = $this->getMockBuilder(\App\Services\LocalEvidenceStorageService::class)
            ->disableOriginalConstructor()->onlyMethods(['resolveAbsolutePath'])->getMock();
        $storage->method('resolveAbsolutePath')->willReturn(__FILE__);
        $submitter = new PortfolioController(db: $db); $submitter->request();
        $scanner = $this->createMock(\App\Services\StudentEvidenceClamAvScanner::class);
        $scanner->method('scan')->willReturnCallback(function () use ($submitter): array {
            self::assertSame(200, $submitter->resubmitRecord(F::RECORD)->getStatusCode());
            return ['status' => 'infected'];
        });
        $controller = new PortfolioController(storage: $storage, db: $db);
        $controller->setScanner($scanner); $controller->request();
        self::assertSame(409, $controller->scanEvidence(F::RECORD, F::EVIDENCE)->getStatusCode());
        $evidence = $db->table('student_portfolio_evidence')->get()->getRowArray();
        self::assertSame('active', $evidence['status']);
        self::assertSame('clean', $evidence['security_status']);
        self::assertSame(0, (new \ReflectionProperty($db, 'transDepth'))->getValue($db));
        $db->close();
    }

    public function testLateUploadUsesExistingCompensationAndCannotAttachToSubmittedRecord(): void
    {
        $db = $this->memory(); F::create($db);
        $submitter = new PortfolioController(db: $db); $submitter->request();
        $storage = $this->getMockBuilder(\App\Services\LocalEvidenceStorageService::class)
            ->disableOriginalConstructor()->onlyMethods(['validateFile', 'storeFile', 'deletePhysicalFile'])->getMock();
        $storage->method('validateFile')->willReturn(['success' => true, 'extension' => 'png', 'detected_mime' => 'image/png']);
        $storage->method('storeFile')->willReturnCallback(function () use ($submitter): array {
            self::assertSame(200, $submitter->resubmitRecord(F::RECORD)->getStatusCode());
            return ['storage_path' => 'synthetic-late-upload.png', 'byte_size' => 1, 'sha256' => 'synthetic'];
        });
        $storage->expects(self::once())->method('deletePhysicalFile')->with('synthetic-late-upload.png')->willReturn(true);
        $file = $this->getMockBuilder(\CodeIgniter\HTTP\Files\UploadedFile::class)->disableOriginalConstructor()
            ->onlyMethods(['isValid', 'getTempName', 'getClientName'])->getMock();
        $file->method('isValid')->willReturn(true);
        $file->method('getTempName')->willReturn(__FILE__);
        $file->method('getClientName')->willReturn('synthetic.png');
        $request = $this->getMockBuilder(\CodeIgniter\HTTP\IncomingRequest::class)->disableOriginalConstructor()
            ->onlyMethods(['getFile', 'getPost'])->getMock();
        $request->method('getFile')->willReturn($file);
        $request->method('getPost')->willReturn(null);
        $controller = new PortfolioController(storage: $storage, db: $db);
        $controller->initController($request, new \CodeIgniter\HTTP\Response(new \Config\App()), service('logger'));
        self::assertSame(409, $controller->addEvidence(F::RECORD)->getStatusCode());
        self::assertSame(1, $db->table('student_portfolio_evidence')->countAllResults());
        self::assertSame(0, (new \ReflectionProperty($db, 'transDepth'))->getValue($db));
        $db->close();
    }
}
