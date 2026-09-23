<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\PersonnelEvaluationPeriodService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

class PersonnelEvaluationPeriodController extends Controller
{
    use ResponseTrait;

    public function __construct(private ?AuthorizationService $authz = null, private ?PersonnelEvaluationPeriodService $periods = null)
    {
        $this->authz ??= new AuthorizationService();
        $this->periods ??= new PersonnelEvaluationPeriodService();
    }

    public function options(): mixed { return $this->respond(null, 204); }

    public function index(): mixed
    {
        if (($actor = $this->hrActor()) instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        return $this->respond(['data' => ['periods' => $this->periods->list($this->request->getGet())]]);
    }

    public function current(): mixed
    {
        if (($actor = $this->hrActor()) instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        return $this->execute(fn() => $this->respond(['data' => ['period' => $this->periods->current(
            $this->request->getGet('evaluation_type') ?: 'RANKING_PROMOTION',
            $this->request->getGet('personnel_group') ?: 'FACULTY'
        )]]));
    }

    public function facultyCurrent(): mixed
    {
        try {
            $actor = $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
        } catch (Throwable $error) {
            log_message('error', 'Faculty period actor resolution failed on {path}: {exception}: {message}', ['path'=>$this->request->getPath(),'exception'=>$error::class,'message'=>$error->getMessage()]);
            return $this->respond(['error'=>['code'=>'AUTH_RESOLUTION_FAILED','message'=>'Unable to verify the current session.']], 500);
        }
        if (! $actor) return $this->respond(['error'=>['code'=>'AUTH_TOKEN_INVALID','message'=>'Authentication is required. Please sign in again.']], 401);
        $profile = db_connect()->table('personnel_profiles')->select('personnel_classification')->where('profile_id', $actor['profile']['id'])->get()->getRowArray();
        $personnelGroup = ($profile['personnel_classification'] ?? '') === 'non_academic' ? 'NON_TEACHING_FACULTY' : 'FACULTY';
        return $this->execute(fn() => $this->respond(['data' => ['period' => $this->periods->current(
            $this->request->getGet('evaluation_type') ?: 'RANKING_PROMOTION',
            $personnelGroup
        )]]));
    }

    public function create(): mixed
    {
        if (($actor = $this->hrActor()) instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        return $this->execute(fn() => $this->respondCreated(['data' => ['period' => $this->periods->create((array)($this->request->getJSON(true) ?? []), $actor['profile']['id'], $this->requestId())]]));
    }

    public function update(string $id): mixed
    {
        if (($actor = $this->hrActor()) instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        return $this->execute(fn() => $this->respond(['data' => ['period' => $this->periods->update($id, (array)($this->request->getJSON(true) ?? []), $actor['profile']['id'], $this->requestId())]]));
    }

    public function transition(string $id, string $action): mixed
    {
        if (($actor = $this->hrActor()) instanceof \CodeIgniter\HTTP\ResponseInterface) return $actor;
        $body = (array) ($this->request->getJSON(true) ?? []);
        $expectedVersion = isset($body['expected_version']) ? (int) $body['expected_version'] : null;
        return $this->execute(fn() => $this->respond(['data' => ['period' => $this->periods->transition($id, $action, $actor['profile']['id'], $this->requestId(), $expectedVersion)]]));
    }

    private function hrActor(): array|\CodeIgniter\HTTP\ResponseInterface
    {
        try {
            $actor = $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
        } catch (Throwable $error) {
            log_message('error', 'Personnel evaluation actor resolution failed on {path}: {exception}: {message}', [
                'path' => $this->request->getPath(),
                'exception' => $error::class,
                'message' => $error->getMessage(),
            ]);
            return $this->respond(['error' => ['code' => 'AUTH_RESOLUTION_FAILED', 'message' => 'Unable to verify the current HR session.']], 500);
        }
        if (! $actor) return $this->respond(['error'=>['code'=>'AUTH_TOKEN_INVALID','message'=>'Authentication is required. Please sign in again.']], 401);
        if (! $this->authz->hasRole($actor, 'hr_staff')) return $this->respond(['error'=>['code'=>'HR_ROLE_REQUIRED','message'=>'Only authorized HR staff may manage personnel evaluation periods.']], 403);
        return $actor;
    }

    private function execute(callable $operation): mixed
    {
        try { return $operation(); }
        catch (InvalidArgumentException $e) { return $this->structuredError($e, 422); }
        catch (RuntimeException $e) { return $this->structuredError($e, 409); }
        catch (Throwable $e) { log_message('error', 'Personnel evaluation period error: '.$e->getMessage()); return $this->failServerError('Personnel evaluation period operation failed.'); }
    }

    private function requestId(): string
    {
        return trim($this->request->getHeaderLine('Idempotency-Key'));
    }

    private function structuredError(\Throwable $error, int $status): mixed
    {
        [$code, $message] = array_pad(explode(':', $error->getMessage(), 2), 2, 'The evaluation period request could not be completed.');
        return $this->respond(['error' => ['code' => trim($code), 'message' => trim($message)]], $status);
    }
}
