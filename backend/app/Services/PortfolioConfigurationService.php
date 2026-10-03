<?php

namespace App\Services;

use Config\Database;
use RuntimeException;

class PortfolioConfigurationService
{
    protected EvaluationScaleResolver $resolver;

    public function __construct(?EvaluationScaleResolver $resolver = null)
    {
        $this->resolver = $resolver ?? new EvaluationScaleResolver();
    }

    /**
     * Builds full workspace configuration for a personnel member in an evaluation cycle.
     *
     * @param string $personnelProfileId
     * @param string $evaluationCycleId
     * @return array
     */
    public function getWorkspaceConfiguration(string $personnelProfileId, string $evaluationCycleId = '2025-2026'): array
    {
        $resolved = $this->resolver->resolveForPersonnel($personnelProfileId, $evaluationCycleId);
        $version = $resolved['version'];
        $scale   = $resolved['scale'];

        $db = Database::connect();

        // Fetch areas for this scale version
        $areas = $db->table('evaluation_scale_areas')
            ->where('scale_version_id', $version['id'])
            ->orderBy('display_order', 'ASC')
            ->get()
            ->getResultArray();

        $configuredAreas = [];
        foreach ($areas as $area) {
            // Fetch categories for this area
            $categories = $db->table('evaluation_scale_categories')
                ->where('scale_area_id', $area['id'])
                ->orderBy('display_order', 'ASC')
                ->get()
                ->getResultArray();

            $categoriesWithSubs = [];
            foreach ($categories as $cat) {
                // Fetch subcategories
                $subs = $db->table('evaluation_scale_subcategories')
                    ->where('scale_category_id', $cat['id'])
                    ->orderBy('display_order', 'ASC')
                    ->get()
                    ->getResultArray();

                // Build subcategories array with proof hints
                $formattedSubs = array_map(function ($s) use ($cat, $area) {
                    return [
                        'id' => $s['id'],
                        'subcategory_code' => $s['subcategory_code'],
                        'name' => $s['name'],
                        'description' => $s['description'],
                        'default_points' => (float)$s['default_points'],
                        'display_order' => (int)$s['display_order'],
                        'source_ref' => $s['source_ref'],
                        'proof_requirement_hint' => $this->getProofRequirementHint($area['area_code'], $cat['name'], $s['name']),
                    ];
                }, $subs);

                $categoriesWithSubs[] = [
                    'id' => $cat['id'],
                    'category_code' => $cat['category_code'],
                    'name' => $cat['name'],
                    'description' => $cat['description'],
                    'display_order' => (int)$cat['display_order'],
                    'max_points' => (float)$cat['max_points'],
                    'source_ref' => $cat['source_ref'],
                    'subcategories' => $formattedSubs,
                ];
            }

            $configuredAreas[] = [
                'id' => $area['id'],
                'area_code' => $area['area_code'],
                'name' => $area['name'],
                'description' => $area['description'],
                'display_order' => (int)$area['display_order'],
                'max_points' => (float)$area['max_points'],
                'entry_policy' => $area['entry_policy'],
                'is_personnel_entry_allowed' => ($area['entry_policy'] === 'personnel_entry_allowed'),
                'source_ref' => $area['source_ref'],
                'categories' => $categoriesWithSubs,
            ];
        }

        return [
            'evaluation_cycle_id' => $evaluationCycleId,
            'personnel_profile_id' => $personnelProfileId,
            'scale' => [
                'id' => $scale['id'],
                'scale_code' => $scale['scale_code'],
                'title' => $scale['title'],
                'description' => $scale['description'],
                'total_max_points' => (float)$scale['total_points'],
                'passing_score' => (float)$scale['passing_score'],
            ],
            'version' => [
                'id' => $version['id'],
                'version_number' => $version['version_number'],
                'status' => $version['status'],
                'source_document_ref' => $version['source_document_ref'],
                'approved_at' => $version['approved_at'],
            ],
            'areas' => $configuredAreas,
        ];
    }

    /**
     * Retrieves specific area configuration and schema for a scale version and area code.
     *
     * @param string $scaleVersionId
     * @param string $areaCode
     * @return array
     */
    public function getAreaConfiguration(string $scaleVersionId, string $areaCode): array
    {
        $db = Database::connect();

        $area = $db->table('evaluation_scale_areas')
            ->where('scale_version_id', $scaleVersionId)
            ->where('area_code', strtoupper(trim($areaCode)))
            ->get()
            ->getRowArray();

        if (!$area) {
            throw new RuntimeException("Area [{$areaCode}] not found for scale version [{$scaleVersionId}].", 404);
        }

        $categories = $db->table('evaluation_scale_categories')
            ->where('scale_area_id', $area['id'])
            ->orderBy('display_order', 'ASC')
            ->get()
            ->getResultArray();

        $categoriesWithSubs = [];
        foreach ($categories as $cat) {
            $subs = $db->table('evaluation_scale_subcategories')
                ->where('scale_category_id', $cat['id'])
                ->orderBy('display_order', 'ASC')
                ->get()
                ->getResultArray();

            $categoriesWithSubs[] = [
                'id' => $cat['id'],
                'category_code' => $cat['category_code'],
                'name' => $cat['name'],
                'description' => $cat['description'],
                'max_points' => (float)$cat['max_points'],
                'subcategories' => array_map(function ($s) {
                    return [
                        'id' => $s['id'],
                        'subcategory_code' => $s['subcategory_code'],
                        'name' => $s['name'],
                        'default_points' => (float)$s['default_points'],
                    ];
                }, $subs),
            ];
        }

        return [
            'area' => [
                'id' => $area['id'],
                'area_code' => $area['area_code'],
                'name' => $area['name'],
                'description' => $area['description'],
                'max_points' => (float)$area['max_points'],
                'entry_policy' => $area['entry_policy'],
                'is_personnel_entry_allowed' => ($area['entry_policy'] === 'personnel_entry_allowed'),
            ],
            'categories' => $categoriesWithSubs,
        ];
    }

    /**
     * Returns proof document requirement string based on category/subcategory.
     */
    protected function getProofRequirementHint(string $areaCode, string $catName, string $subName): string
    {
        $text = strtolower("{$catName} {$subName}");

        if (str_contains($text, 'degree') || str_contains($text, 'ph.d.') || str_contains($text, 'ma degree')) {
            return 'Official Diploma / Transcript of Records (TOR)';
        }
        if (str_contains($text, 'unit')) {
            return 'Official Transcript of Records (TOR) / Units Certification';
        }
        if (str_contains($text, 'membership') || str_contains($text, 'member')) {
            return 'Official Certificate of Membership / PRC ID';
        }
        if (str_contains($text, 'officer') || str_contains($text, 'board')) {
            return 'Appointment Letter / Certificate of Incumbency';
        }
        if (str_contains($text, 'seminar') || str_contains($text, 'training')) {
            return 'Certificate of Attendance / Participation';
        }
        if (str_contains($text, 'speaker') || str_contains($text, 'lecturer') || str_contains($text, 'resource') || str_contains($text, 'judge')) {
            return 'Invitation Letter & Certificate of Appreciation';
        }
        if (str_contains($text, 'publication') || str_contains($text, 'book') || str_contains($text, 'article') || str_contains($text, 'paper')) {
            return 'Published Journal Copy / DOI / ISBN Page';
        }
        if (str_contains($text, 'research')) {
            return 'Final Research Approval / URCO Certificate / Contract';
        }
        if (str_contains($text, 'award') || str_contains($text, 'recognition')) {
            return 'Award Plaque Photo / Official Certificate of Award';
        }
        if (str_contains($text, 'material') || str_contains($text, 'module') || str_contains($text, 'workbook')) {
            return 'Bound Material Copy / Dean Approval Sign-off';
        }
        if (str_contains($text, 'moderator') || str_contains($text, 'coach') || str_contains($text, 'committee')) {
            return 'Official Designation Letter / Special Order';
        }
        if (str_contains($text, 'church') || str_contains($text, 'community') || str_contains($text, 'civic') || str_contains($text, 'project')) {
            return 'Certificate of Service / Appreciation from Parish/LGU/NGO';
        }
        if (str_contains($text, 'service credit') || str_contains($text, 'years of service')) {
            return 'HR Certificate of Employment / Service Record';
        }

        return 'Official Verification Document / Certificate';
    }
}
