<?php

namespace App\Controllers\Api;

use App\Services\AuthenticatedActorService;
use App\Services\CertificateTemplateGovernanceService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

final class CertificateTemplateController extends Controller
{
    use ResponseTrait;

    public function __construct(
        private ?AuthenticatedActorService $actors = null,
        private ?CertificateTemplateGovernanceService $templates = null,
    ) {
        $this->actors ??= new AuthenticatedActorService();
        $this->templates ??= new CertificateTemplateGovernanceService();
    }

    public function options(): mixed { return $this->respond(null, 204); }

    public function index(): mixed
    {
        $actor = $this->actor();
        if (! $actor) return $this->unauthorized();
        if (! $this->canGovern($actor)) return $this->forbidden();
        return $this->respond(['data' => ['families' => $this->templates->listFamilies()]]);
    }

    public function show(string $familyId): mixed
    {
        $actor = $this->actor();
        if (! $actor) return $this->unauthorized();
        if (! $this->canGovern($actor)) return $this->forbidden();
        $family = $this->templates->getFamily($familyId);
        return $family ? $this->respond(['data' => $family]) : $this->respond(['error' => ['code' => 'TEMPLATE_FAMILY_NOT_FOUND', 'message' => 'Template family not found.']], 404);
    }

    public function create(): mixed
    {
        return $this->mutate(fn (array $payload, string $actorId) => $this->templates->createFamily($payload, $actorId), 201);
    }

    public function createDraft(string $familyId): mixed
    {
        return $this->mutate(fn (array $payload, string $actorId) => $this->templates->createDraft($familyId, $payload, $actorId), 201);
    }

    public function version(string $versionId): mixed
    {
        $actor = $this->actor();
        if (! $actor) return $this->unauthorized();
        if (! $this->canGovern($actor)) return $this->forbidden();
        $version = $this->templates->getVersion($versionId);
        return $version ? $this->respond(['data' => $version]) : $this->respond(['error' => ['code' => 'TEMPLATE_VERSION_NOT_FOUND', 'message' => 'Template version not found.']], 404);
    }

    public function updateDraft(string $versionId): mixed
    {
        return $this->mutate(fn (array $payload, string $actorId) => $this->templates->updateDraft($versionId, $payload, $actorId));
    }

    public function validateDraft(string $versionId): mixed
    {
        return $this->mutate(fn (array $payload, string $actorId) => $this->templates->validateDraft($versionId, $actorId, isset($payload['expected_token']) ? (string) $payload['expected_token'] : null));
    }

    public function publish(string $versionId): mixed
    {
        return $this->mutate(fn (array $payload, string $actorId) => $this->templates->publishDraft($versionId, $actorId, isset($payload['expected_token']) ? (string) $payload['expected_token'] : null));
    }

    public function placeholders(): mixed
    {
        $actor = $this->actor();
        if (! $actor) return $this->unauthorized();
        if (! $this->canGovern($actor)) return $this->forbidden();
        return $this->respond(['data' => ['placeholders' => $this->templates->placeholderRegistry(), 'signatory_roles' => $this->templates->signatoryRoleRegistry()]]);
    }

    private function mutate(callable $operation, int $successStatus = 200): mixed
    {
        $actor = $this->actor();
        if (! $actor) return $this->unauthorized();
        if (! $this->canGovern($actor)) return $this->forbidden();
        try {
            return $this->respond(['data' => $operation($this->request->getJSON(true) ?: [], (string) $actor['profile']['id'])], $successStatus);
        } catch (Throwable $exception) {
            return $this->error($exception);
        }
    }

    private function error(Throwable $exception): mixed
    {
        $raw = $exception->getMessage();
        $code = str_contains($raw, ':') ? strstr($raw, ':', true) : $raw;
        $status = match ($code) {
            'TEMPLATE_FAMILY_NOT_FOUND', 'TEMPLATE_VERSION_NOT_FOUND', 'SOURCE_VERSION_NOT_FOUND' => 404,
            'STALE_DRAFT' => 409,
            'TEMPLATE_FAMILY_ALREADY_EXISTS', 'DRAFT_ALREADY_EXISTS', 'PUBLISHED_VERSION_IMMUTABLE' => 409,
            'VALIDATION_FAILED', 'PUBLICATION_VALIDATION_FAILED', 'DRAFT_VALIDATION_REQUIRED' => 422,
            default => $exception instanceof InvalidArgumentException ? 422 : 500,
        };
        $message = match ($code) {
            'STALE_DRAFT' => 'This draft changed in another session. Reload before saving.',
            'PUBLISHED_VERSION_IMMUTABLE' => 'Published and superseded template versions are immutable. Create a new draft version.',
            'DRAFT_ALREADY_EXISTS' => 'This template family already has an editable draft.',
            'DRAFT_VALIDATION_REQUIRED' => 'Validate the current saved draft before publishing it.',
            'PUBLICATION_VALIDATION_FAILED' => 'The draft must pass publication validation before it can be published.',
            default => $status === 500 ? 'The governed template operation could not be completed.' : str_replace('_', ' ', ucfirst(strtolower($code))),
        };
        $details = [];
        if ($code === 'PUBLICATION_VALIDATION_FAILED') {
            $details = json_decode(substr($raw, strlen($code) + 1), true) ?: [];
        }
        return $this->respond(['error' => ['code' => $code, 'message' => $message, 'issues' => $details]], $status);
    }

    private function actor(): ?array { return $this->actors->resolveActor($this->request->getHeaderLine('Authorization')); }
    private function canGovern(array $actor): bool { return in_array('osad_staff', $actor['roles'] ?? [], true); }
    private function unauthorized(): mixed { return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401); }
    private function forbidden(): mixed { return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'OSAD authorization is required to govern certificate templates.']], 403); }
}
