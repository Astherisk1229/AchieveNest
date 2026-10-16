<?php

namespace App\Controllers\Api;

use App\Services\AuthorityRankingRosterService;
use App\Services\AuthorizationService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

class ReviewerRankingRosterController extends Controller
{
    use ResponseTrait;

    public function __construct(private ?AuthorizationService $authz = null, private ?AuthorityRankingRosterService $roster = null)
    { $this->authz ??= new AuthorizationService(); $this->roster ??= new AuthorityRankingRosterService(); }

    public function options(): mixed { return $this->respond(null, 204); }

    public function index(string $cycleId = '', string $trackKey = ''): mixed
    {
        $actor = $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
        if (! $actor) return $this->failUnauthorized('UNAUTHORIZED');
        try {
            if ((string) $this->request->getGet('summary') === '1') {
                $roster = $this->roster->list($actor, $cycleId, $trackKey, true);
                $people = $roster['personnel'];
                $counts = ['total'=>count($people), 'need'=>0, 'passed'=>0, 'failed'=>0, 'pending'=>0, 'eligible'=>0];
                $positions = [];
                foreach ($people as $entry) {
                    $annual = $entry['eligibility']['annual_review_requirement'] ?? [];
                    if (empty($annual['import_id'])) $counts['need']++;
                    if (($annual['status'] ?? '') === 'passed') $counts['passed']++;
                    if (($annual['status'] ?? '') === 'not_passed') $counts['failed']++;
                    if (($entry['eligibility']['eligibility_status'] ?? '') === 'pending') $counts['pending']++;
                    if (($entry['eligibility']['eligibility_status'] ?? '') === 'eligible') $counts['eligible']++;
                    $position = trim((string) ($entry['personnel']['position_title'] ?? ''));
                    if ($position !== '') $positions[$position] = true;
                }
                return $this->respond(['data'=>['counts'=>$counts, 'positions'=>array_keys($positions)]]);
            }
            $pageQuery = null;
            if ($this->request->getGet('page') !== null) {
                $pagination = \App\Helpers\ValidationHelper::validatePagination($this->request->getGet('page'), $this->request->getGet('per_page') ?? 25);
                $pageQuery = $pagination + [
                    'search'=>$this->request->getGet('search'), 'employment'=>$this->request->getGet('employment'),
                    'assignment'=>$this->request->getGet('assignment'),
                    'annual'=>(string) ($this->request->getGet('annual') ?? 'all'),
                    'result'=>(string) ($this->request->getGet('result') ?? 'all'),
                ];
            }
            $eligibility = (string) ($this->request->getGet('eligibility') ?? 'all');
            if ($pageQuery === null || $eligibility === 'all') {
                // Search and annual-review status filters are applied by SQL before
                // LIMIT/OFFSET in AuthorityRankingRosterService.
                $roster = $this->roster->list($actor, $cycleId, $trackKey, true, $pageQuery);
            } else {
                // Eligibility is computed from service history and evidence, so scan
                // bounded pages and retain only the requested page in memory.
                $chunkSize = 100;
                $candidateTotal = null;
                $matchedTotal = 0;
                $selectedRows = [];
                $requestedStart = $pageQuery['offset'];
                $requestedEnd = $requestedStart + $pageQuery['per_page'];
                $scanPage = 1;
                do {
                    $chunkQuery = array_replace($pageQuery, [
                        'page'=>$scanPage,
                        'per_page'=>$chunkSize,
                        'offset'=>($scanPage - 1) * $chunkSize,
                    ]);
                    $batch = $this->roster->list($actor, $cycleId, $trackKey, true, $chunkQuery);
                    $candidateTotal = (int) ($batch['total_personnel'] ?? 0);
                    foreach ($batch['personnel'] as $entry) {
                        if (($entry['eligibility']['eligibility_status'] ?? 'pending') !== $eligibility) continue;
                        if ($matchedTotal >= $requestedStart && $matchedTotal < $requestedEnd) $selectedRows[] = $entry;
                        $matchedTotal++;
                    }
                    $scanPage++;
                } while (($scanPage - 1) * $chunkSize < $candidateTotal && !empty($batch['personnel']));

                $roster = $batch;
                $roster['total_personnel'] = $matchedTotal;
                $roster['personnel'] = $selectedRows;
            }
            if ($pageQuery !== null) $roster += ['page'=>$pageQuery['page'], 'per_page'=>$pageQuery['per_page']];
            return $this->respond(['data'=>$roster]);
        }
        catch (InvalidArgumentException $error) { return $this->fail(['error'=>['code'=>strtok($error->getMessage(), ':'), 'message'=>$error->getMessage()]], 404); }
        catch (RuntimeException $error) { $status = str_starts_with($error->getMessage(), 'FORBIDDEN') ? 403 : 409; return $this->fail(['error'=>['code'=>strtok($error->getMessage(), ':'), 'message'=>$error->getMessage()]], $status); }
        catch (Throwable $error) { log_message('error', '[ReviewerRankingRosterController] ' . get_class($error) . ': ' . $error->getMessage() . ' @ ' . $error->getFile() . ':' . $error->getLine()); return $this->failServerError('Unexpected error retrieving the ranking-track roster.'); }
    }
}
