<?php

namespace App\Controllers\Api;

use App\Services\AuthorityRankingRosterService;
use App\Services\AuthorizationService;
use App\Services\NtfAnnualReviewSettingsService;
use App\Services\NtfAnnualReviewTemplateService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

/** HR endpoints for the Non-Teaching Faculty annual-review workbook: settings and downloads. */
final class NtfAnnualReviewTemplateController extends Controller
{
    use ResponseTrait;

    public function __construct(
        private ?AuthorizationService $authz = null,
        private ?NtfAnnualReviewSettingsService $settings = null,
        private ?NtfAnnualReviewTemplateService $templates = null
    ) {
        $this->authz ??= new AuthorizationService();
        $this->settings ??= new NtfAnnualReviewSettingsService();
        $this->templates ??= new NtfAnnualReviewTemplateService(null, $this->settings);
    }

    public function options(): mixed { return $this->respond(null, 204); }

    public function showSettings(): mixed
    {
        if (($actor = $this->hr()) instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        return $this->run(fn() => $this->respond(['data' => $this->settings->all() + ['signatory_sources' => [
            ['value' => 'college_dean', 'label' => 'Dean of the employee’s College (from Dean assignments)'],
            ['value' => 'custom', 'label' => 'Named person (enter name and position)'],
        ]]]));
    }

    public function saveRatingScale(): mixed
    {
        if (($actor = $this->hr()) instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        return $this->run(fn() => $this->respond(['data' => $this->settings->saveRatingScale($this->body(), $actor['profile']['id'])]));
    }

    public function saveSignatories(): mixed
    {
        if (($actor = $this->hr()) instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        return $this->run(fn() => $this->respond(['data' => $this->settings->saveSignatories($this->body(), $actor['profile']['id'])]));
    }

    public function blank(string $periodId): mixed
    {
        if (($actor = $this->hr()) instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        return $this->run(function () use ($periodId) {
            [$path, $name] = $this->templates->build($this->templates->period($periodId));
            return $this->file($path, $name, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        });
    }

    public function prefilled(string $periodId, string $profileId): mixed
    {
        if (($actor = $this->hr()) instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        return $this->run(function () use ($actor, $periodId, $profileId) {
            $period = $this->templates->period($periodId);
            if (! in_array($profileId, $this->rosterIds($actor, $period), true)) throw new RuntimeException('FORBIDDEN: Personnel is outside your Non-Teaching Faculty roster for this ranking track.');
            [$path, $name] = $this->templates->build($period, $this->templates->personContext($profileId, $period));
            return $this->file($path, $name, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        });
    }

    public function prefilledZip(string $periodId): mixed
    {
        if (($actor = $this->hr()) instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        return $this->run(function () use ($actor, $periodId) {
            $period = $this->templates->period($periodId);
            $ids = $this->rosterIds($actor, $period);
            if ($ids === []) throw new RuntimeException('ROSTER_EMPTY: No Non-Teaching Faculty personnel are assigned to HR for this ranking track.');
            [$path, $name] = $this->templates->buildZip($period, $ids);
            return $this->file($path, $name, 'application/zip');
        });
    }

    /** Generates one ZIP containing only the authoritative roster members selected by HR. */
    public function selectedPrefilledZip(string $periodId): mixed
    {
        if (($actor = $this->hr()) instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        return $this->run(function () use ($actor, $periodId) {
            $period = $this->templates->period($periodId);
            $requested = $this->body()['personnel_profile_ids'] ?? null;
            if (! is_array($requested) || ! array_is_list($requested) || $requested === []) throw new InvalidArgumentException('PERSONNEL_SELECTION_REQUIRED: Select at least one Non-Teaching Faculty personnel record.');
            $ids = [];
            foreach ($requested as $id) {
                if (! is_string($id) || trim($id) === '') throw new InvalidArgumentException('PERSONNEL_SELECTION_INVALID: Every selection must be an authoritative personnel profile ID.');
                $ids[] = trim($id);
            }
            $ids = array_values(array_unique($ids));
            $allowed = $this->rosterIds($actor, $period);
            if (array_diff($ids, $allowed) !== []) throw new RuntimeException('FORBIDDEN: One or more selected personnel are outside your Non-Teaching Faculty roster for this ranking track.');
            [$path, $name] = $this->templates->buildZip($period, $ids);
            return $this->file($path, $name, 'application/zip');
        });
    }

    private function rosterIds(array $actor, array $period): array
    {
        $roster = (new AuthorityRankingRosterService())->list($actor, (string) $period['ranking_cycle_id'], 'non-teaching-faculty');
        return array_values(array_map(fn(array $row) => (string) $row['personnel']['id'], $roster['personnel'] ?? []));
    }

    private function file(string $path, string $name, string $mime): mixed
    {
        $body = (string) file_get_contents($path);
        @unlink($path);
        return $this->response->setStatusCode(200)
            ->setHeader('Content-Type', $mime)
            ->setHeader('Content-Disposition', 'attachment; filename="' . str_replace('"', '', $name) . '"')
            ->setHeader('Access-Control-Expose-Headers', 'Content-Disposition')
            ->setHeader('Cache-Control', 'no-store')
            ->setBody($body);
    }

    private function body(): array { return (array) ($this->request->getJSON(true) ?? []); }

    private function hr(): array|\CodeIgniter\HTTP\ResponseInterface
    {
        $actor = $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
        if (! $actor) return $this->respond(['error' => ['code' => 'AUTH_TOKEN_INVALID', 'message' => 'Authentication is required.']], 401);
        if (! $this->authz->hasRole($actor, 'hr_staff')) return $this->respond(['error' => ['code' => 'HR_ROLE_REQUIRED', 'message' => 'Only authorized HR staff may manage the NTF annual-review workbook.']], 403);
        return $actor;
    }

    private function run(callable $operation): mixed
    {
        try { return $operation(); }
        catch (InvalidArgumentException $e) { return $this->error($e, 422); }
        catch (RuntimeException $e) { return $this->error($e, str_starts_with($e->getMessage(), 'FORBIDDEN') ? 403 : 409); }
        catch (Throwable $e) { log_message('error', 'NTF annual-review template error: ' . $e->getMessage()); return $this->failServerError('The NTF annual-review workbook request failed.'); }
    }

    private function error(Throwable $e, int $status): mixed
    {
        [$code, $message] = array_pad(explode(':', $e->getMessage(), 2), 2, 'The NTF annual-review workbook request failed.');
        return $this->respond(['error' => ['code' => trim($code), 'message' => trim($message)]], $status);
    }
}
