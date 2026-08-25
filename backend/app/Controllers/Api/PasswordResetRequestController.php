<?php

namespace App\Controllers\Api;

use App\Services\AuthenticatedActorService;
use App\Services\SupabaseAdminAuthService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class PasswordResetRequestController extends Controller
{
    use ResponseTrait;

    protected AuthenticatedActorService $actorService;
    protected SupabaseAdminAuthService $adminAuthService;

    public function __construct(
        ?AuthenticatedActorService $actorService = null,
        ?SupabaseAdminAuthService $adminAuthService = null
    ) {
        $this->actorService = $actorService ?? new AuthenticatedActorService();
        $this->adminAuthService = $adminAuthService ?? new SupabaseAdminAuthService();
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
     * Generates a cryptographically secure temporary password.
     */
    protected function generateTemporaryPassword(): string
    {
        $prefix = 'Ndmu#';
        $random = bin2hex(random_bytes(4)); // 8 hex characters
        return $prefix . $random;
    }

    /**
     * POST /api/v1/password-reset-requests
     * Public endpoint to submit an institutional password reset request.
     */
    public function submit()
    {
        $json = $this->request->getJSON(true) ?? [];
        $rawEmail = (string) ($json['institutional_email'] ?? '');
        $cleanEmail = strtolower(trim($rawEmail));

        if ($cleanEmail === '' || ! str_ends_with($cleanEmail, '@ndmu.edu.ph')) {
            return $this->respond([
                'error' => [
                    'code' => 'INVALID_INSTITUTIONAL_EMAIL',
                    'message' => 'Please provide a valid @ndmu.edu.ph institutional email address.',
                ],
            ], 422);
        }

        $genericSuccessMessage = 'If an eligible account exists, your password reset request has been submitted to the appropriate administrative office.';

        $db = db_connect();
        $profile = $db->table('profiles')
            ->where('institutional_email', $cleanEmail)
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
        // Only student and personnel can request password resets via this workflow
        if (! in_array($accountType, ['student', 'personnel'], true)) {
            return $this->respond([
                'data' => [
                    'message' => $genericSuccessMessage,
                ],
            ], 200);
        }

        $assignedOffice = ($accountType === 'student') ? 'osad' : 'hr';

        // Check for existing pending request to prevent duplicates
        $existingPending = $db->table('password_reset_requests')
            ->where('user_id', $profile['id'])
            ->where('status', 'pending')
            ->get()
            ->getRowArray();

        if ($existingPending !== null) {
            return $this->respond([
                'data' => [
                    'message' => $genericSuccessMessage,
                ],
            ], 200);
        }

        $requestId = null;
        $db->transStart();

        $db->table('password_reset_requests')->insert([
            'user_id'             => $profile['id'],
            'institutional_email' => $profile['institutional_email'],
            'account_type'        => $accountType,
            'assigned_office'     => $assignedOffice,
            'status'              => 'pending',
            'requested_at'        => date('Y-m-d H:i:s'),
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);

        $createdReq = $db->table('password_reset_requests')
            ->where('user_id', $profile['id'])
            ->where('status', 'pending')
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getRowArray();

        $requestId = $createdReq['id'] ?? null;

        $db->table('password_reset_events')->insert([
            'request_id'     => $requestId,
            'actor_user_id'  => null,
            'target_user_id' => $profile['id'],
            'action'         => 'password_reset_request_submitted',
            'metadata'       => json_encode([
                'assigned_office' => $assignedOffice,
                'account_type'    => $accountType,
                'ip_address'      => $this->request->getIPAddress(),
            ]),
            'occurred_at'    => date('Y-m-d H:i:s'),
        ]);

        $db->transComplete();

        return $this->respond([
            'data' => [
                'message' => $genericSuccessMessage,
            ],
        ], 200);
    }

    /**
     * GET /api/v1/password-reset-requests
     * Lists password reset requests scoped strictly to the authenticated admin's office.
     */
    public function list()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $accountType = $actor['profile']['account_type'] ?? '';
        $roles = $actor['roles'] ?? [];

        $assignedOffice = null;
        if ($accountType === 'osad_admin' && in_array('osad_staff', $roles, true)) {
            $assignedOffice = 'osad';
        } elseif ($accountType === 'hr_admin' && in_array('hr_staff', $roles, true)) {
            $assignedOffice = 'hr';
        }

        if ($assignedOffice === null) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only dedicated OSAD or HR administrators may view password reset requests.']], 403);
        }

        $statusFilter = strtolower(trim((string) $this->request->getGet('status')));

        $db = db_connect();
        $builder = $db->table('password_reset_requests prr')
            ->select('prr.*, p.institutional_id, p.full_name, p.department_id, p.degree_program_id, p.designation, p.status as profile_status, handler.full_name as handler_name')
            ->join('profiles p', 'p.id = prr.user_id', 'inner')
            ->join('profiles handler', 'handler.id = prr.handled_by', 'left')
            ->where('prr.assigned_office', $assignedOffice);

        if ($statusFilter !== '' && in_array($statusFilter, ['pending', 'completed', 'rejected'], true)) {
            $builder->where('prr.status', $statusFilter);
        }

        $requests = $builder->orderBy('prr.requested_at', 'DESC')->get()->getResultArray();

        return $this->respond([
            'data' => [
                'office' => $assignedOffice,
                'requests' => $requests,
                'count' => count($requests),
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
            ->select('prr.*, p.full_name, p.status as profile_status')
            ->join('profiles p', 'p.id = prr.user_id', 'inner')
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
        if ($request['assigned_office'] === 'osad') {
            if (! ($accountType === 'osad_admin' && in_array('osad_staff', $roles, true))) {
                return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may process student password reset requests.']], 403);
            }
        } elseif ($request['assigned_office'] === 'hr') {
            if (! ($accountType === 'hr_admin' && in_array('hr_staff', $roles, true))) {
                return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only HR administrators may process personnel password reset requests.']], 403);
            }
        } else {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Unrecognized assigned office.']], 403);
        }

        $temporaryPassword = $this->generateTemporaryPassword();

        try {
            $this->adminAuthService->updateUserPassword($request['user_id'], $temporaryPassword);
        } catch (Throwable $e) {
            return $this->respond([
                'error' => [
                    'code' => 'AUTH_UPDATE_FAILED',
                    'message' => 'Failed to update user password in authentication provider: ' . $e->getMessage(),
                ],
            ], 500);
        }

        $db->transStart();

        $db->table('profiles')->where('id', $request['user_id'])->update([
            'must_change_password' => true,
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        $db->table('password_reset_requests')->where('id', $requestId)->update([
            'status'       => 'completed',
            'completed_at' => date('Y-m-d H:i:s'),
            'handled_by'   => $actor['profile']['id'],
            'updated_at'   => date('Y-m-d H:i:s'),
        ]);

        $db->table('password_reset_events')->insert([
            'request_id'     => $requestId,
            'actor_user_id'  => $actor['profile']['id'],
            'target_user_id' => $request['user_id'],
            'action'         => 'temporary_password_reset_executed',
            'metadata'       => json_encode([
                'assigned_office' => $request['assigned_office'],
                'handled_by'      => $actor['profile']['id'],
            ]),
            'occurred_at'    => date('Y-m-d H:i:s'),
        ]);

        $db->transComplete();

        return $this->respond([
            'data' => [
                'message'            => 'Password reset executed successfully.',
                'request_id'         => $requestId,
                'temporary_password' => $temporaryPassword,
                'institutional_email'=> $request['institutional_email'],
                'full_name'          => $request['full_name'],
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
        $request = $db->table('password_reset_requests')->where('id', $requestId)->get()->getRowArray();

        if ($request === null) {
            return $this->respond(['error' => ['code' => 'REQUEST_NOT_FOUND', 'message' => 'Password reset request not found.']], 404);
        }

        if ($request['status'] !== 'pending') {
            return $this->respond(['error' => ['code' => 'REQUEST_ALREADY_PROCESSED', 'message' => 'This password reset request has already been processed.']], 422);
        }

        // Office authority validation
        if ($request['assigned_office'] === 'osad') {
            if (! ($accountType === 'osad_admin' && in_array('osad_staff', $roles, true))) {
                return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may process student password reset requests.']], 403);
            }
        } elseif ($request['assigned_office'] === 'hr') {
            if (! ($accountType === 'hr_admin' && in_array('hr_staff', $roles, true))) {
                return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only HR administrators may process personnel password reset requests.']], 403);
            }
        } else {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Unrecognized assigned office.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $reason = trim((string) ($json['reason'] ?? 'Rejected by administrator'));

        $db->transStart();

        $db->table('password_reset_requests')->where('id', $requestId)->update([
            'status'           => 'rejected',
            'completed_at'     => date('Y-m-d H:i:s'),
            'handled_by'       => $actor['profile']['id'],
            'rejection_reason' => $reason,
            'updated_at'       => date('Y-m-d H:i:s'),
        ]);

        $db->table('password_reset_events')->insert([
            'request_id'     => $requestId,
            'actor_user_id'  => $actor['profile']['id'],
            'target_user_id' => $request['user_id'],
            'action'         => 'password_reset_request_rejected',
            'metadata'       => json_encode([
                'assigned_office'  => $request['assigned_office'],
                'rejection_reason' => $reason,
            ]),
            'occurred_at'    => date('Y-m-d H:i:s'),
        ]);

        $db->transComplete();

        return $this->respond([
            'data' => [
                'message'    => 'Password reset request has been rejected.',
                'request_id' => $requestId,
            ],
        ], 200);
    }
}
