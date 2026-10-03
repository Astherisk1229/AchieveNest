<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\RankingCycleWorkspaceReadService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

final class RankingCycleWorkspaceController extends Controller
{
    use ResponseTrait;

    public function __construct(
        private ?AuthorizationService $authz = null,
        private ?RankingCycleWorkspaceReadService $workspace = null
    ) {
        $this->authz ??= new AuthorizationService();
        $this->workspace ??= new RankingCycleWorkspaceReadService();
    }

    public function options(): mixed
    {
        return $this->respond(null, 204);
    }

    public function show(string $cycleId = '', string $trackKey = '', string $stage = ''): mixed
    {
        $actor = $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
        if (! $actor) return $this->respond(['error'=>['code'=>'AUTH_TOKEN_INVALID','message'=>'Authentication is required.']], 401);
        if (! $this->authz->hasRole($actor, 'hr_staff')) {
            return $this->respond(['error'=>['code'=>'HR_ROLE_REQUIRED','message'=>'Only authorized HR staff may view the ranking-cycle workspace.']], 403);
        }

        $method = match (strtolower(str_replace('-', '_', trim($stage)))) {
            'annual_reviews' => 'annualReviews',
            'submissions' => 'submissions',
            'evaluation' => 'evaluation',
            'results' => 'results',
            default => null,
        };
        if ($method === null) {
            return $this->respond(['error'=>['code'=>'RANKING_WORKSPACE_STAGE_INVALID','message'=>'Stage must be annual-reviews, submissions, evaluation, or results.']], 422);
        }

        try {
            return $this->respond(['data'=>$this->workspace->{$method}($actor, $cycleId, $trackKey)]);
        } catch (InvalidArgumentException $error) {
            return $this->error($error, 404);
        } catch (RuntimeException $error) {
            $status = str_starts_with($error->getMessage(), 'FORBIDDEN') ? 403 : 409;
            return $this->error($error, $status);
        } catch (Throwable $error) {
            log_message('error', 'Ranking-cycle workspace read failed: '.$error->getMessage());
            return $this->failServerError('Ranking-cycle workspace could not be loaded.');
        }
    }

    private function error(Throwable $error, int $status): mixed
    {
        [$code, $message] = array_pad(explode(':', $error->getMessage(), 2), 2, 'Ranking-cycle workspace request failed.');
        return $this->respond(['error'=>['code'=>trim($code), 'message'=>trim($message)]], $status);
    }
}
