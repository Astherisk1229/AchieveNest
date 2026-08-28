<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthenticatedActorService;
use App\Services\LocalAuthService;
use App\Services\LocalTokenService;
use App\Services\SupabaseAdminAuthService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class PasswordResetRequestController extends Controller
{
    use ResponseTrait;

    protected AuthenticatedActorService $actorService;
    protected LocalAuthService $localAuthService;
    protected SupabaseAdminAuthService $adminAuthService;
    protected LocalTokenService $localTokenService;
    protected bool $isLocalDefense;

    public function __construct(
        ?AuthenticatedActorService $actorService = null,
        ?LocalAuthService $localAuthService = null,
        ?SupabaseAdminAuthService $adminAuthService = null,
        ?LocalTokenService $localTokenService = null
    ) {
        $this->actorService = $actorService ?? new AuthenticatedActorService();
        $this->localAuthService = $localAuthService ?? new LocalAuthService();
        $this->adminAuthService = $adminAuthService ?? new SupabaseAdminAuthService();
        $this->localTokenService = $localTokenService ?? new LocalTokenService();
        $this->isLocalDefense = (env('AUTH_MODE') === 'local-defense' || env('ACHIEVENEST_ENV') === 'local-defense');
    }

    public function options()
    {
        return $this->respond(null, 204);
    }

    protected function resolveActor(): ?array
    {
        return $this->actorService->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    /**
     * POST /api/v1/password-reset-requests
     * Public endpoint to submit an institutional password reset request.
     */
    public function submit()
    {
        $json = $this->request->getJSON(true) ?? [];
        $rawEmail = (string) ($json['institutional_email'] ?? ($json['email'] ?? ''));
        $cleanEmail = strtolower(trim($rawEmail));

        if ($cleanEmail === '' || ! str_ends_with($cleanEmail, '@ndmu.edu.ph')) {
            return $this->respond([
                'error' => [
                    'code'    => 'INVALID_INSTITUTIONAL_EMAIL',
                    'message' => 'Please provide a valid @ndmu.edu.ph institutional email address.',
                ],
            ], 422);
        }

        $genericSuccessMessage = 'If an eligible account exists, your password reset request has been submitted to the appropriate administrative office.';

        $db = db_connect();
        $profile = $db->table('profiles')
            ->where('email', $cleanEmail)
            ->get()
            ->getRowArray();

        // If no matching profile or account is not active, return generic response without account disclosure
        if ($profile === null || ($profile['status'] ?? '') !== 'active') {
            return $this->respond([
                'data' => [
                    'message' => $genericSuccessMessage,
                ],
            ], 200);
        }

        $accountType = $profile['account_type'] ?? '';
        if (! in_array($accountType, ['student', 'personnel'], true)) {
            return $this->respond([
                'data' => [
                    'message' => $genericSuccessMessage,
                ],
            ], 200);
        }

        // Rate-limit: reject if a pending request exists within the last 24 hours
        $existingPending = $db->table('password_reset_requests')
            ->where('institutional_email', $cleanEmail)
            ->where('status', 'pending')
            ->where('created_at >=', date('Y-m-d H:i:s', strtotime('-24 hours')))
            ->get()
            ->getRowArray();

        if ($existingPending !== null) {
            return $this->respond([
                'data' => [
                    'message' => $genericSuccessMessage,
                ],
            ], 200);
        }

        $requestId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0x0fff) | 0x4000, random_int(0, 0x3fff) | 0x8000, random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff));

        $db->table('password_reset_requests')->insert([
            'id'                  => $requestId,
            'institutional_email' => $cleanEmail,
            'reason'              => (string) ($json['reason'] ?? 'User submitted password reset request'),
            'status'              => 'pending',
            'ip_address'          => $this->request->getIPAddress(),
            'user_agent'          => $this->request->getUserAgent()->getAgentString(),
            'created_at'          => date('Y-m-d H:i:s'),
        ]);

        return $this->respond([
            'data' => [
                'message'    => $genericSuccessMessage,
                'request_id' => $requestId,
            ],
        ], 200);
    }

    /**
     * GET /api/v1/password-reset-requests
     * Administrative listing endpoint scoped strictly to the caller's office.
     */
    public function list()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $accountType = $actor['profile']['account_type'] ?? '';
        $roles = $actor['roles'] ?? [];

        $office = null;
        $targetAccountType = null;
        if ($accountType === 'osad_admin' && in_array('osad_staff', $roles, true)) {
            $office = 'osad';
            $targetAccountType = 'student';
        } elseif ($accountType === 'hr_admin' && in_array('hr_staff', $roles, true)) {
            $office = 'hr';
            $targetAccountType = 'personnel';
        } else {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only HR or OSAD administrators may view password reset requests.']], 403);
        }

        $statusFilter = (string) ($this->request->getGet('status') ?? 'pending');
        if (! in_array($statusFilter, ['pending', 'completed', 'rejected', 'all'], true)) {
            $statusFilter = 'pending';
        }

        $db = db_connect();
        $builder = $db->table('password_reset_requests prr')
            ->select('prr.*, p.id as user_id, p.full_name, p.account_type, p.status as profile_status')
            ->join('profiles p', 'p.email = prr.institutional_email', 'inner')
            ->where('p.account_type', $targetAccountType);

        if ($statusFilter !== 'all') {
            $builder->where('prr.status', $statusFilter);
        }

        $requests = $builder->orderBy('prr.created_at', 'DESC')->get()->getResultArray();

        return $this->respond([
            'data' => [
                'office'   => $office,
                'requests' => $requests,
                'count'    => count($requests),
            ],
        ], 200);
    }

    /**
     * POST /api/v1/password-reset-requests/{id}/reset
     * Executes administrative password reset and returns one-time temporary password.
     */
    public function reset(string $requestId)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $accountType = $actor['profile']['account_type'] ?? '';
        $roles = $actor['roles'] ?? [];

        $db = db_connect();
        $request = $db->table('password_reset_requests prr')
            ->select('prr.*, p.id as user_id, p.full_name, p.account_type, p.status as profile_status')
            ->join('profiles p', 'p.email = prr.institutional_email', 'inner')
            ->where('prr.id', $requestId)
            ->get()
            ->getRowArray();

        if ($request === null) {
            return $this->respond(['error' => ['code' => 'REQUEST_NOT_FOUND', 'message' => 'Password reset request not found.']], 404);
        }

        if ($request['status'] !== 'pending') {
            return $this->respond(['error' => ['code' => 'REQUEST_ALREADY_PROCESSED', 'message' => 'This password reset request has already been processed.']], 422);
        }

        // Office authority validation
        if ($request['account_type'] === 'student') {
            if (! ($accountType === 'osad_admin' && in_array('osad_staff', $roles, true))) {
                return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may process student password reset requests.']], 403);
            }
        } elseif ($request['account_type'] === 'personnel') {
            if (! ($accountType === 'hr_admin' && in_array('hr_staff', $roles, true))) {
                return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only HR administrators may process personnel password reset requests.']], 403);
            }
        } else {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Unrecognized target account type.']], 403);
        }

        $targetUserId = $request['user_id'];
        $ip = $this->request->getIPAddress();

        if ($this->isLocalDefense) {
            $result = $this->localAuthService->adminResetPassword($actor['profile']['id'], $targetUserId, $ip);
            if (! $result['success']) {
                return $this->respond(['error' => $result['error']], $result['status']);
            }

            $temporaryPassword = $result['data']['temporary_password'];

            $db->table('password_reset_requests')->where('id', $requestId)->update([
                'status'       => 'completed',
                'processed_by' => $actor['profile']['id'],
                'processed_at' => date('Y-m-d H:i:s'),
                'updated_at'   => date('Y-m-d H:i:s'),
            ]);
        } else {
            $temporaryPassword = 'Temp_' . bin2hex(random_bytes(6)) . '!A1';
            try {
                $this->adminAuthService->updateUserPassword($targetUserId, $temporaryPassword);
            } catch (Throwable $e) {
                return $this->respond([
                    'error' => [
                        'code'    => 'AUTH_UPDATE_FAILED',
                        'message' => 'Failed to update user password in authentication provider: ' . $e->getMessage(),
                    ],
                ], 500);
            }

            $db->transStart();

            $db->table('profiles')->where('id', $targetUserId)->update([
                'must_change_password' => 1,
                'updated_at'           => date('Y-m-d H:i:s'),
            ]);

            $db->table('password_reset_requests')->where('id', $requestId)->update([
                'status'       => 'completed',
                'processed_by' => $actor['profile']['id'],
                'processed_at' => date('Y-m-d H:i:s'),
                'updated_at'   => date('Y-m-d H:i:s'),
            ]);

            $db->transComplete();
        }

        return $this->respond([
            'data' => [
                'message'             => 'Password reset executed successfully.',
                'request_id'          => $requestId,
                'temporary_password'  => $temporaryPassword,
                'institutional_email' => $request['institutional_email'],
                'full_name'           => $request['full_name'],
            ],
        ], 200);
    }

    /**
     * POST /api/v1/password-reset-requests/{id}/reject
     * Rejects a pending password reset request without modifying user credentials.
     */
    public function reject(string $requestId)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $accountType = $actor['profile']['account_type'] ?? '';
        $roles = $actor['roles'] ?? [];

        $db = db_connect();
        $request = $db->table('password_reset_requests prr')
            ->select('prr.*, p.account_type')
            ->join('profiles p', 'p.email = prr.institutional_email', 'inner')
            ->where('prr.id', $requestId)
            ->get()
            ->getRowArray();

        if ($request === null) {
            return $this->respond(['error' => ['code' => 'REQUEST_NOT_FOUND', 'message' => 'Password reset request not found.']], 404);
        }

        if ($request['status'] !== 'pending') {
            return $this->respond(['error' => ['code' => 'REQUEST_ALREADY_PROCESSED', 'message' => 'This password reset request has already been processed.']], 422);
        }

        if ($request['account_type'] === 'student') {
            if (! ($accountType === 'osad_admin' && in_array('osad_staff', $roles, true))) {
                return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may reject student password reset requests.']], 403);
            }
        } elseif ($request['account_type'] === 'personnel') {
            if (! ($accountType === 'hr_admin' && in_array('hr_staff', $roles, true))) {
                return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only HR administrators may reject personnel password reset requests.']], 403);
            }
        } else {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Unrecognized target account type.']], 403);
        }

        $db->table('password_reset_requests')->where('id', $requestId)->update([
            'status'       => 'rejected',
            'processed_by' => $actor['profile']['id'],
            'processed_at' => date('Y-m-d H:i:s'),
            'updated_at'   => date('Y-m-d H:i:s'),
        ]);

        return $this->respond([
            'data' => [
                'message'    => 'Password reset request rejected.',
                'request_id' => $requestId,
            ],
        ], 200);
    }
}
