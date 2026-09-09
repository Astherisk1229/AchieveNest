# Storage Key Generation

## Key Architecture
- **Format**: `personnel/{ownerUuid}/{accomplishmentId}/{fileUuid}.{extension}`
- **Components**:
  - `domain`: Literal string `personnel`.
  - `ownerUuid`: Server-derived UUID of the Personnel profile.
  - `accomplishmentId`: Server-verified UUID of the target accomplishment.
  - `fileUuid`: Cryptographically random UUID v4 generated on the server (`random_int` / `genUuid`).
  - `extension`: Normalized extension (`pdf`, `jpg`, `jpeg`, `png`).

## Collision & Guessing Resistance
Because every stored object uses a newly generated random UUID v4, uploading two documents with the identical filename produces two distinct, non-colliding storage keys.
