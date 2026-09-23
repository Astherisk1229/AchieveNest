# Placement Evidence Resolver Contract

Backend Method: `PersonnelClassificationService::resolveLegacyPlacement(array $row): array`

```php
[
    'valid'                  => bool,
    'status'                 => 'supported' | 'ambiguous' | 'conflicting',
    'unresolved'             => bool,
    'personnel_group'        => 'non_teaching_faculty' | null,
    'organizational_side'    => 'academic' | 'non_academic' | null,
    'code'                   => string | null,
    'label'                  => string,
    'college_id'             => ?string,
    'administrative_unit_id' => ?string,
    'reason_code'            => string,
    'message'                => ?string,
]
```
