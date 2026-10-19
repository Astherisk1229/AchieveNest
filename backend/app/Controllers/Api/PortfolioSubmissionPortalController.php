<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\OsadPortfolioSubmissionPortalService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

final class PortfolioSubmissionPortalController extends Controller
{
    use ResponseTrait;

    public function __construct(private ?AuthorizationService $authz = null, private ?OsadPortfolioSubmissionPortalService $portals = null) {}
    private function authorization(): AuthorizationService { return $this->authz ??= new AuthorizationService(); }
    private function service(): OsadPortfolioSubmissionPortalService { return $this->portals ??= new OsadPortfolioSubmissionPortalService(); }
    private function actor(): ?array { return $this->authorization()->resolveActor($this->request->getHeaderLine('Authorization')); }
    private function isOsad(array $actor): bool
    {
        return ($actor['profile']['account_type'] ?? '') === 'osad_admin'
            && ($actor['profile']['status'] ?? '') === 'active'
            && in_array('osad_staff', $actor['roles'] ?? [], true);
    }
    private function isStudent(array $actor): bool
    {
        return ($actor['profile']['account_type'] ?? '') === 'student'
            && ($actor['profile']['status'] ?? '') === 'active'
            && in_array('student', $actor['roles'] ?? [], true);
    }
    public function options(): mixed { return $this->respond(null, 204); }

    private function authorize(bool $osad): mixed
    {
        $actor = $this->actor();
        if ($actor === null) return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        $allowed = $osad ? $this->isOsad($actor) : $this->isStudent($actor);
        if (! $allowed) return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'This account cannot access the portfolio submission portal.']], 403);
        return $actor;
    }

    private function failure(Throwable $error): mixed
    {
        $code = $error->getMessage();
        $status = match ($code) {
            'PORTAL_NOT_FOUND', 'AWARD_NOT_FOUND', 'SUBMISSION_NOT_FOUND', 'SUBMISSION_EVIDENCE_NOT_FOUND' => 404,
            'PORTAL_ACCESS_NOT_AVAILABLE' => 404,
            'PORTAL_NOT_OPEN', 'PORTAL_NOT_EDITABLE', 'PORTAL_AWARD_ALREADY_ADDED', 'PORTAL_ASSIGNMENTS_REQUIRED', 'AWARD_NOT_IN_PORTAL', 'SUBMISSION_ALREADY_FINAL', 'SUBMISSION_NOT_FINAL', 'SUBMISSION_REQUIRED' => 409,
            'EVALUATION_EXCEPTION_ACK_REQUIRED' => 409,
            default => 422,
        };
        $messages = [
            'PORTAL_NOT_FOUND' => 'Portfolio submission portal not found.',
            'PORTAL_ACCESS_NOT_AVAILABLE' => 'This portfolio submission portal is not available.',
            'PORTAL_NOT_OPEN' => 'This portfolio submission portal is closed or outside its scheduled dates.',
            'PORTAL_TITLE_REQUIRED' => 'Enter a portal name before creating it.',
            'PORTAL_START_DATE_IN_PAST' => 'Choose a start date that is today or later.',
            'PORTAL_DATE_RANGE_INVALID' => 'Enter valid start and end dates, with the end date on or after the start date.',
            'PORTAL_ASSIGNMENTS_REQUIRED' => 'Add at least one award and select at least one student before creating the portal.',
            'PORTAL_AWARD_ALREADY_ADDED' => 'This award is already part of the portal.',
            'AWARD_NOT_IN_PORTAL' => 'Add this award to the portal before selecting students for it.',
            'PORTFOLIO_EMPTY' => 'Add at least one accomplishment before submitting your portfolio.',
            'SUBMISSION_ALREADY_FINAL' => 'This portfolio has already been submitted. Contact OSAD if a correction is needed.',
            'REOPEN_REASON_REQUIRED' => 'Provide a reason for reopening this submission.',
            'EVALUATION_EXCEPTION_ACK_REQUIRED' => 'Evaluation has started. Confirm the exception before reopening this submission.',
            'SUBMISSION_NOT_FINAL' => 'Only a final submission can be reopened.',
            'SUBMISSION_REQUIRED' => 'The student must submit a portfolio before evaluation begins.',
            'AWARD_SELECTION_REQUIRED' => 'Select at least one award assigned to you for this portfolio submission.',
            'AWARD_NOT_ASSIGNED' => 'One or more selected awards are not assigned to this student.',
            'STUDENT_SELECTION_REQUIRED' => 'Select at least one student account.',
            'SUBMITTED_AWARDS_LOCKED' => 'A submitted portfolio’s award access is locked. Reopen the submission for correction first.',
            'SUBMITTED_ACCESS_CANNOT_BE_REVOKED' => "A submitted student's access cannot be removed; reopen the submission if a correction is needed.",
            'SUBMISSION_EVIDENCE_UNAVAILABLE' => 'A supporting file could not be loaded.',
        ];
        return $this->respond(['error' => ['code' => $code, 'message' => $messages[$code] ?? 'The portfolio submission request could not be completed.']], $status);
    }

    public function studentPortals(): mixed
    {
        $actor = $this->authorize(false);
        if ($actor instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        try {
            // Deliberately return a neutral label and no award, score, threshold, candidate status, or selection source.
            return $this->respond(['data' => ['portals' => $this->service()->listOpenStudentPortals((string) $actor['profile']['id'])]], 200);
        } catch (Throwable $error) { return $this->failure($error); }
    }

    public function studentPortal(string $portalId): mixed
    {
        $actor = $this->authorize(false);
        if ($actor instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        try { return $this->respond(['data' => $this->service()->studentPortal($portalId, (string) $actor['profile']['id'])], 200); }
        catch (Throwable $error) { return $this->failure($error); }
    }

    public function submitStudentPortfolio(string $portalId): mixed
    {
        $actor = $this->authorize(false);
        if ($actor instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        try {
            $payload = $this->request->getJSON(true) ?? [];
            return $this->respond(['data' => $this->service()->submit($portalId, (string) $actor['profile']['id'], (array) ($payload['award_definition_ids'] ?? []))], 201);
        }
        catch (Throwable $error) { return $this->failure($error); }
    }

    public function studentSubmissionFile(string $portalId, string $submissionId, string $fileId): mixed
    {
        $actor = $this->authorize(false);
        if ($actor instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        return $this->streamSubmissionFile($portalId, $submissionId, $fileId, (string) $actor['profile']['id'], true);
    }

    public function listPortals(): mixed
    {
        $actor = $this->authorize(true);
        if ($actor instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        try { return $this->respond(['data' => ['portals' => $this->service()->listPortals()]], 200); }
        catch (Throwable $error) { return $this->failure($error); }
    }

    public function activeAwardYear(): mixed
    {
        $actor = $this->authorize(true);
        if ($actor instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        try { return $this->respond(['data' => ['active_award_year' => $this->service()->activeAwardYear()]], 200); }
        catch (Throwable $error) { return $this->failure($error); }
    }

    public function createPortal(): mixed
    {
        $actor = $this->authorize(true);
        if ($actor instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        try { return $this->respondCreated(['data' => $this->service()->createPortal($this->request->getJSON(true) ?? [], (string) $actor['profile']['id'])]); }
        catch (Throwable $error) { return $this->failure($error); }
    }

    public function portalDetails(string $portalId): mixed
    {
        $actor = $this->authorize(true);
        if ($actor instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        try { return $this->respond(['data' => $this->service()->portalDetails($portalId)], 200); }
        catch (Throwable $error) { return $this->failure($error); }
    }

    public function addPortalAward(string $portalId): mixed
    {
        $actor = $this->authorize(true);
        if ($actor instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        try {
            $payload = $this->request->getJSON(true) ?? [];
            return $this->respond(['data' => $this->service()->addPortalAward($portalId, (string) ($payload['award_definition_id'] ?? ''), (string) $actor['profile']['id'])], 201);
        } catch (Throwable $error) { return $this->failure($error); }
    }

    public function updatePortalStatus(string $portalId): mixed
    {
        $actor = $this->authorize(true);
        if ($actor instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        try { return $this->respond(['data' => $this->service()->updatePortalStatus($portalId, (string) (($this->request->getJSON(true) ?? [])['status'] ?? ''), (string) $actor['profile']['id'])], 200); }
        catch (Throwable $error) { return $this->failure($error); }
    }

    public function selectStudents(string $portalId): mixed
    {
        $actor = $this->authorize(true);
        if ($actor instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        try {
            $payload = $this->request->getJSON(true) ?? [];
            $count = $this->service()->selectStudents($portalId, (array) ($payload['student_ids'] ?? []), (string) $actor['profile']['id'], (array) ($payload['award_definition_ids'] ?? []));
            return $this->respond(['data' => ['selected_count' => $count, 'portal' => $this->service()->portalDetails($portalId)]], 200);
        } catch (Throwable $error) { return $this->failure($error); }
    }

    public function assignStudentAwards(string $portalId, string $studentId): mixed
    {
        $actor = $this->authorize(true);
        if ($actor instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        $payload = $this->request->getJSON(true) ?? [];
        try {
            $this->service()->assignStudentAwards($portalId, $studentId, (array) ($payload['award_definition_ids'] ?? []), (string) $actor['profile']['id']);
            return $this->respond(['data' => $this->service()->portalDetails($portalId)], 200);
        } catch (Throwable $error) { return $this->failure($error); }
    }

    public function revokeStudent(string $portalId, string $studentId): mixed
    {
        $actor = $this->authorize(true);
        if ($actor instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        try { $this->service()->revokeStudent($portalId, $studentId, (string) $actor['profile']['id']); return $this->respond(['data' => ['access_revoked' => true]], 200); }
        catch (Throwable $error) { return $this->failure($error); }
    }

    public function reopen(string $portalId, string $studentId): mixed
    {
        $actor = $this->authorize(true);
        if ($actor instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        $payload = $this->request->getJSON(true) ?? [];
        try { return $this->respond(['data' => $this->service()->reopen($portalId, $studentId, (string) $actor['profile']['id'], (string) ($payload['reason'] ?? ''), (bool) ($payload['acknowledge_evaluation_exception'] ?? false))], 200); }
        catch (Throwable $error) { return $this->failure($error); }
    }

    public function startEvaluation(string $portalId, string $studentId): mixed
    {
        $actor = $this->authorize(true);
        if ($actor instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        try { $this->service()->startEvaluation($portalId, $studentId, (string) $actor['profile']['id']); return $this->respond(['data' => ['evaluation_started' => true]], 200); }
        catch (Throwable $error) { return $this->failure($error); }
    }

    public function reviewSubmission(string $portalId, string $studentId): mixed
    {
        $actor = $this->authorize(true);
        if ($actor instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        try { return $this->respond(['data' => $this->service()->submissionForOsad($portalId, $studentId)], 200); }
        catch (Throwable $error) { return $this->failure($error); }
    }

    public function osadSubmissionFile(string $portalId, string $studentId, string $submissionId, string $fileId): mixed
    {
        $actor = $this->authorize(true);
        if ($actor instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        return $this->streamSubmissionFile($portalId, $submissionId, $fileId, $studentId, false);
    }

    private function streamSubmissionFile(string $portalId, string $submissionId, string $fileId, string $studentId, bool $isStudent): mixed
    {
        try {
            $file = $this->service()->submissionFile($portalId, $studentId, $submissionId, $fileId, $studentId, $isStudent);
            $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', basename((string) $file['filename']));
            $mime = preg_match('/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i', (string) $file['mime_type']) ? $file['mime_type'] : 'application/octet-stream';
            return $this->response->setHeader('Content-Type', $mime)->setHeader('X-Content-Type-Options', 'nosniff')
                ->setHeader('Content-Disposition', 'inline; filename="' . $filename . '"')->setHeader('Cache-Control', 'private, no-store')
                ->setBody((string) file_get_contents($file['path']));
        } catch (Throwable $error) { return $this->failure($error); }
    }
}
