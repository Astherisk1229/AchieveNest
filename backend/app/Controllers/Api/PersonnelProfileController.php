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
            $userProfile = $db->table('user_profiles')
                ->where('id', $profileId)
                ->get()
                ->getRowArray();

            $data = [
                'id'              => $profileId,
                'employee_id'     => $profile['employee_id'] ?? $userProfile['employee_id'] ?? $profile['institutional_id'] ?? '',
                'full_name'       => $userProfile['full_name'] ?? $profile['full_name'] ?? '',
                'email'           => $userProfile['email'] ?? $profile['email'] ?? '',
                'avatar_url'      => $userProfile['avatar_url'] ?? $profile['avatar_url'] ?? null,
                'designation'     => $userProfile['designation'] ?? $profile['designation'] ?? null,
                'academic_rank'   => $userProfile['academic_rank'] ?? $profile['academic_rank'] ?? null,
                'tenure_years'    => (int) ($userProfile['tenure_years'] ?? $profile['tenure_years'] ?? 0),
                'college_id'      => $userProfile['college_id'] ?? $profile['college_id'] ?? null,
                'department_id'   => $userProfile['department_id'] ?? $profile['department_id'] ?? null,
                'phone'           => $userProfile['phone'] ?? $profile['phone'] ?? null,
                'location'        => $userProfile['location'] ?? $profile['location'] ?? null,
                'about_me'        => $userProfile['about_me'] ?? $profile['about_me'] ?? null,
            ];

            return $this->respond([
                'data' => $data,
            ]);
        } catch (Throwable $e) {
            return $this->respond([
                'error' => [
                    'code'    => 'SERVER_ERROR',
                    'message' => 'Failed to load personnel profile: ' . $e->getMessage(),
                ],
            ], 500);
        }
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
