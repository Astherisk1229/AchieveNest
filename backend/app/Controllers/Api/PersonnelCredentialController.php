<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\PersonnelCredentialService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

/** Phase L0 credential submission, HR verification, and history endpoints. */
class PersonnelCredentialController extends Controller
{
    use ResponseTrait;

    public function __construct(
        private ?AuthorizationService $authz = null,
        private ?PersonnelCredentialService $credentials = null
    ) {
        $this->authz ??= new AuthorizationService();
        $this->credentials ??= new PersonnelCredentialService();
    }

    public function options(): mixed { return $this->respond(null, 204); }

    public function submitOwn(): mixed
    {
        $actor = $this->actor();
        if (!$actor) return $this->unauthorized();
        $profileId = (string) ($actor['profile']['id'] ?? '');
        if (!$this->authz->hasRole($actor, 'personnel') || $profileId === '') return $this->forbidden();
        return $this->submit($profileId, $profileId);
    }

    public function ownHistory(): mixed
    {
        $actor = $this->actor();
        if (!$actor) return $this->unauthorized();
        $profileId = (string) ($actor['profile']['id'] ?? '');
        if (!$this->authz->hasRole($actor, 'personnel') || $profileId === '') return $this->forbidden();
        return $this->respond(['data' => $this->credentials->history($profileId)]);
    }

    public function ownVerified(): mixed
    {
        $actor = $this->actor();
        if (!$actor) return $this->unauthorized();
        $profileId = (string) ($actor['profile']['id'] ?? '');
        if (!$this->authz->hasRole($actor, 'personnel') || $profileId === '') return $this->forbidden();
        return $this->respond(['data' => $this->credentials->history($profileId, true)]);
    }

    public function submitForPersonnel(string $personnelId): mixed
    {
        $actor = $this->actor();
        if (!$actor) return $this->unauthorized();
        if (!$this->isHr($actor)) return $this->forbidden();
        return $this->submit($personnelId, (string) $actor['profile']['id']);
    }

    public function historyForPersonnel(string $personnelId): mixed
    {
        $actor = $this->actor();
        if (!$actor) return $this->unauthorized();
        if (!$this->isHr($actor)) return $this->forbidden();
        return $this->respond(['data' => $this->credentials->history($personnelId)]);
    }

    public function verifiedForPersonnel(string $personnelId): mixed
    {
        $actor = $this->actor();
        if (!$actor) return $this->unauthorized();
        if (!$this->isHr($actor)) return $this->forbidden();
        return $this->respond(['data' => $this->credentials->history($personnelId, true)]);
    }

    public function verify(string $personnelId, string $credentialId): mixed
    {
        $actor = $this->actor();
        if (!$actor) return $this->unauthorized();
        if (!$this->isHr($actor)) return $this->forbidden();
        $json = (array) ($this->request->getJSON(true) ?? []);
        if (!array_key_exists('approved', $json) || !is_bool($json['approved'])) {
            return $this->respond(['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'approved must be boolean.']], 422);
        }
        try {
            $row = $this->credentials->verify($personnelId, $credentialId, (string) $actor['profile']['id'], $json['approved'], $json['notes'] ?? null);
            return $this->respond(['data' => $row]);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => $e->getMessage(), 'message' => 'Credential was not found or was invalid.']], 422);
        } catch (RuntimeException $e) {
            return $this->respond(['error' => ['code' => $e->getMessage(), 'message' => 'Credential verification could not be completed.']], 409);
        }
    }

    private function submit(string $personnelId, string $actorId): mixed
    {
        try {
            $row = $this->credentials->submit($personnelId, $actorId, (array) ($this->request->getJSON(true) ?? []));
            return $this->respondCreated(['data' => $row]);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => $e->getMessage(), 'message' => 'Credential submission is invalid.']], 422);
        } catch (Throwable) {
            return $this->respond(['error' => ['code' => 'CREDENTIAL_SUBMISSION_FAILED', 'message' => 'Credential submission could not be completed.']], 500);
        }
    }

    private function actor(): ?array { return $this->authz->resolveActor($this->request->getHeaderLine('Authorization')); }
    private function isHr(array $actor): bool { return $this->authz->hasRole($actor, 'hr_staff'); }
    private function unauthorized(): mixed { return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated active session required.']], 401); }
    private function forbidden(): mixed { return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Credential access is not authorized.']], 403); }
}
