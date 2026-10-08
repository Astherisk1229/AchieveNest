<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class PersonnelProfileController extends Controller
{
    use ResponseTrait;

    protected AuthorizationService $authz;

    public function __construct(?AuthorizationService $authz = null)
    {
        $this->authz = $authz ?? new AuthorizationService();
    }

    public function options(): mixed
    {
        return $this->respond(null, 204);
    }

    protected function resolveActor(): ?array
    {
        return $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    /**
     * GET /api/v1/personnel/profile
     * Returns the normalized profile DTO for the authenticated personnel.
     */
    public function show(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond([
                'error' => [
                    'code'    => 'UNAUTHORIZED',
                    'message' => 'Valid authenticated personnel session required.',
                ],
            ], 401);
        }

        $profile = $actor['profile'] ?? [];
        $profileId = $profile['id'] ?? '';
        $db = db_connect();

        try {
            // user_profiles is a legacy table that newer databases no longer have; the
            // authenticated profile row already carries the same fields.
            $userProfile = $db->tableExists('user_profiles')
                ? ($db->table('user_profiles')->where('id', $profileId)->get()->getRowArray() ?? [])
                : [];
            $canonicalProfile = $db->table('profiles')->where('id', $profileId)->get()->getRowArray() ?? $profile;

            $own = $db->table('personnel_profiles')->where('profile_id', $profileId)->get()->getRowArray() ?? [];

            $service = null;
            try {
                $service = (new \App\Services\EmploymentServiceDurationService($db))->calculateQualifyingService($profileId);
            } catch (\Throwable $e) {
                log_message('error', 'Length of service unavailable for {id}: {msg}', ['id' => $profileId, 'msg' => $e->getMessage()]);
            }

            $data = [
                'id'              => $profileId,
                'employee_id'     => $profile['employee_id'] ?? $userProfile['employee_id'] ?? $profile['institutional_id'] ?? '',
                'full_name'       => $userProfile['full_name'] ?? $profile['full_name'] ?? '',
                // Institutional email is canonical on profiles and shared with HR and sign-in.
                'email'           => $canonicalProfile['email'] ?? $canonicalProfile['institutional_email'] ?? $profile['email'] ?? '',
                'avatar_url'      => $userProfile['avatar_url'] ?? $profile['avatar_url'] ?? null,
                'designation'     => $userProfile['designation'] ?? $profile['designation'] ?? null,
                'academic_rank'   => $own['current_rank_title'] ?? $own['rank_level'] ?? $userProfile['academic_rank'] ?? $profile['academic_rank'] ?? null,
                'current_rank_title' => $own['current_rank_title'] ?? $own['rank_level'] ?? $userProfile['academic_rank'] ?? $profile['academic_rank'] ?? null,
                'position_title'  => $own['position_title'] ?? $userProfile['designation'] ?? $profile['designation'] ?? null,
                // Server-derived qualifying length of service (full-time only, HR service history), as of today.
                'tenure_years'    => $service['completed_years'] ?? 0,
                'years_of_service' => $service['completed_years'] ?? null,
                'length_of_service' => $service,
                'college_id'      => $userProfile['college_id'] ?? $profile['college_id'] ?? null,
                'department_id'   => $userProfile['department_id'] ?? $profile['department_id'] ?? null,
                // One shared canonical contact number for HR and Personnel.
                'phone'           => $own['contact_number'] ?? null,
                'location'        => $own['location'] ?? $userProfile['location'] ?? $profile['location'] ?? null,
                'about_me'        => $own['about_me'] ?? $userProfile['about_me'] ?? $profile['about_me'] ?? null,
                'specialization'  => $own['specialization'] ?? null,
            ];

            return $this->respond([
                'data' => $data,
            ]);
        } catch (Throwable $e) {
            log_message('error', '[PersonnelProfileController::show] ' . $e->getMessage());
            return $this->respond([
                'error' => [
                    'code'    => 'SERVER_ERROR',
                    'message' => 'Your profile could not be loaded. Please try again.',
                ],
            ], 500);
        }
    }

    /**
     * PUT /api/v1/personnel/profile
     * Self-service edit of Personnel-owned profile details.
     * Name, ID, designation, institutional email and campus location remain outside this editor.
     */
    public function update(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated personnel session required.']], 401);
        }
        $profile = $actor['profile'] ?? [];
        if (($profile['account_type'] ?? '') !== 'personnel') {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only personnel can edit this profile.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $limits = ['contact_number' => 40, 'about_me' => 2000, 'specialization' => 160];
        $updates = [];
        foreach ($limits as $field => $max) {
            if (! array_key_exists($field, $json)) {
                continue;
            }
            $value = trim((string) $json[$field]);
            if (mb_strlen($value) > $max) {
                return $this->respond(['error' => ['code' => 'FIELD_TOO_LONG', 'message' => "{$field} must be at most {$max} characters."]], 422);
            }
            if ($field === 'contact_number' && $value !== '' && ! preg_match('/^[0-9+()\-.\s]{5,40}$/', $value)) {
                return $this->respond(['error' => ['code' => 'INVALID_CONTACT_NUMBER', 'message' => 'Contact number may contain digits, spaces and + ( ) - . only.']], 422);
            }
            $updates[$field] = $value === '' ? null : $value;
        }

        if ($updates === []) {
            return $this->respond(['error' => ['code' => 'NO_EDITABLE_FIELDS', 'message' => 'Send at least one of contact_number, about_me, or specialization.']], 422);
        }

        $db = db_connect();
        $transactionStarted = false;
        try {
            $profileId = (string) ($profile['id'] ?? '');
            $db->transBegin();
            $transactionStarted = true;
            if ($updates !== []) {
                $updates['updated_at'] = date('Y-m-d H:i:s');
                $db->table('personnel_profiles')->where('profile_id', $profileId)->update($updates);
                if ($db->affectedRows() === 0 && $db->table('personnel_profiles')->where('profile_id', $profileId)->countAllResults() === 0) {
                    $db->transRollback();
                    return $this->respond(['error' => ['code' => 'PERSONNEL_PROFILE_NOT_FOUND', 'message' => 'Personnel profile record missing.']], 404);
                }
            }
            if ($db->transStatus() === false) {
                $db->transRollback();
                return $this->respond(['error' => ['code' => 'PROFILE_SAVE_FAILED', 'message' => 'Your profile could not be saved. Please try again.']], 500);
            }
            $db->transCommit();
            $transactionStarted = false;
        } catch (Throwable $e) {
            if ($transactionStarted) {
                $db->transRollback();
            }
            log_message('error', '[PersonnelProfileController::update] ' . $e->getMessage());
            return $this->respond(['error' => ['code' => 'SERVER_ERROR', 'message' => 'Your profile could not be saved. Please try again.']], 500);
        }

        return $this->show();
    }

    /**
     * POST /api/v1/personnel/profile/photo
     * Uploads or updates profile photo using validated storage path and updates avatar_url.
     */
    public function uploadPhoto(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond([
                'error' => [
                    'code'    => 'UNAUTHORIZED',
                    'message' => 'Valid authenticated personnel session required.',
                ],
            ], 401);
        }

        $profile = $actor['profile'] ?? [];
        $profileId = $profile['id'] ?? '';
        if (empty($profileId)) {
            return $this->respond([
                'error' => [
                    'code'    => 'INVALID_PROFILE',
                    'message' => 'Missing profile identifier.',
                ],
            ], 400);
        }

        $file = $this->request->getFile('photo');
        $base64Image = null;

        // Check if image is provided via multipart/form-data or JSON base64
        if ($file === null || ! $file->isValid()) {
            $json = $this->request->getJSON(true) ?? [];
            $base64Image = $json['photo_base64'] ?? $json['image'] ?? null;
        }

        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        $maxSizeBytes = 5 * 1024 * 1024; // 5 MB

        $targetDir = FCPATH . 'uploads/profile-photos/personnel/' . $profileId . '/';
        if (! is_dir($targetDir)) {
            @mkdir($targetDir, 0777, true);
        }

        $publicUrl = null;

        try {
            if ($file !== null && $file->isValid()) {
                // 1. Validate file size
                if ($file->getSize() > $maxSizeBytes) {
                    return $this->respond([
                        'error' => [
                            'code'    => 'FILE_TOO_LARGE',
                            'message' => 'Photo size exceeds maximum allowed limit of 5 MB.',
                        ],
                    ], 422);
                }

                // 2. Validate MIME
                $mimeType = $file->getMimeType();
                if (! in_array($mimeType, $allowedMimes, true)) {
                    return $this->respond([
                        'error' => [
                            'code'    => 'INVALID_MIME_TYPE',
                            'message' => 'Only JPEG, PNG, and WebP images are permitted.',
                        ],
                    ], 422);
                }

                // 3. Generate versioned safe filename
                $ext = $file->getExtension();
                if (! in_array(strtolower($ext), ['jpg', 'jpeg', 'png', 'webp'], true)) {
                    $ext = 'jpg';
                }
                $filename = 'avatar_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
                $file->move($targetDir, $filename);

                $publicUrl = base_url('uploads/profile-photos/personnel/' . $profileId . '/' . $filename);
            } elseif ($base64Image !== null && is_string($base64Image)) {
                // Base64 handling
                if (preg_match('/^data:image\/(jpeg|png|webp);base64,(.+)$/', $base64Image, $matches)) {
                    $imageType = $matches[1];
                    $imageData = base64_decode($matches[2]);
                } else {
                    $imageType = 'jpg';
                    $imageData = base64_decode($base64Image);
                }

                if (strlen($imageData) > $maxSizeBytes) {
                    return $this->respond([
                        'error' => [
                            'code'    => 'FILE_TOO_LARGE',
                            'message' => 'Photo size exceeds maximum allowed limit of 5 MB.',
                        ],
                    ], 422);
                }

                $filename = 'avatar_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . ($imageType === 'jpeg' ? 'jpg' : $imageType);
                file_put_contents($targetDir . $filename, $imageData);

                $publicUrl = base_url('uploads/profile-photos/personnel/' . $profileId . '/' . $filename);
            } else {
                return $this->respond([
                    'error' => [
                        'code'    => 'NO_IMAGE_PROVIDED',
                        'message' => 'Please provide a valid image file or photo data.',
                    ],
                ], 422);
            }

            // Update user_profiles table with new avatar_url
            $db = db_connect();
            if ($db->tableExists('user_profiles')) {
                $db->table('user_profiles')
                    ->where('id', $profileId)
                    ->update(['avatar_url' => $publicUrl, 'updated_at' => date('Y-m-d H:i:s')]);
            }

            return $this->respond([
                'data' => [
                    'message'    => 'Profile photo updated successfully.',
                    'avatar_url' => $publicUrl,
                ],
            ]);
        } catch (Throwable $e) {
            return $this->respond([
                'error' => [
                    'code'    => 'UPLOAD_FAILED',
                    'message' => 'Failed to process profile photo: ' . $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * DELETE /api/v1/personnel/profile/photo
     * Clears profile photo from profile.
     */
    public function deletePhoto(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond([
                'error' => [
                    'code'    => 'UNAUTHORIZED',
                    'message' => 'Valid authenticated personnel session required.',
                ],
            ], 401);
        }

        $profile = $actor['profile'] ?? [];
        $profileId = $profile['id'] ?? '';

        try {
            $db = db_connect();
            if ($db->tableExists('user_profiles')) {
                $db->table('user_profiles')
                    ->where('id', $profileId)
                    ->update(['avatar_url' => null, 'updated_at' => date('Y-m-d H:i:s')]);
            }

            return $this->respond([
                'data' => [
                    'message'    => 'Profile photo removed successfully.',
                    'avatar_url' => null,
                ],
            ]);
        } catch (Throwable $e) {
            return $this->respond([
                'error' => [
                    'code'    => 'DELETE_FAILED',
                    'message' => 'Failed to remove profile photo: ' . $e->getMessage(),
                ],
            ], 500);
        }
    }
}
