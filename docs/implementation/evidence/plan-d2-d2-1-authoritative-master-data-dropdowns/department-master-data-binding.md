# Department Master-Data Source Binding — Plan D2 Phase D2-1

## Persisted Master-Data Source
The Department dropdown is backed by `GET /api/v1/administrative-units` with the seeded institutional offices:
1. `Records Section` (`REC`, UUID: `10000000-0000-0000-0000-000000000010`)
2. `Library` (`LIB`, UUID: `10000000-0000-0000-0000-000000000011`)
3. `Business Office` (`BUS`, UUID: `10000000-0000-0000-0000-000000000012`)
4. `Human Resource Management Office` (`HRD`, UUID: `10000000-0000-0000-0000-000000000013`)
5. `ICT Services Center` (`ICT`, UUID: `10000000-0000-0000-0000-000000000014`)
6. `Guidance and Counseling Office` (`GCO`, UUID: `10000000-0000-0000-0000-000000000015`)
7. `Campus Security Office` (`CSO`, UUID: `10000000-0000-0000-0000-000000000016`)
8. `Physical Facilities Management` (`PFM`, UUID: `10000000-0000-0000-0000-000000000017`)

## Invariants
- Zero unconfirmed/guessed office records were fabricated.
- Selected stable UUID (`administrative_unit_id`) is saved upon submission.
