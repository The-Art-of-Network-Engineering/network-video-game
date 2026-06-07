# Contract: Persistence (`src/game/storage.js`)

Persists the **Progress Record** to browser `localStorage`. Local-only, no account (FR-008).
The game layer depends on this; the engine never touches it.

## Storage key

```
subnetgame:v1:progress      // single JSON document
```

## Functions

| Function | Signature | Behavior |
|----------|-----------|----------|
| `loadProgress` | `() → ProgressRecord` | Read + parse + validate. On missing/corrupt/older schema: return a fresh default (entry tier unlocked) and overwrite. Never throws to the caller. |
| `saveProgress` | `(record: ProgressRecord) → void` | Serialize + write. Swallows quota/availability errors after surfacing a non-blocking UI notice (game remains playable in-memory). |
| `resetProgress` | `() → ProgressRecord` | Clear the key and return a fresh default. |

## ProgressRecord shape (see data-model.md)

```
{ schemaVersion: 1, unlockedTierIds: string[], currentTierId: string,
  currentStreak: integer, stats: Stats, mistakeCounts: Record<string,integer> }
```

## Guarantees

1. **Resilience**: corrupt JSON or unknown `schemaVersion` never crashes the game; it falls back to
   defaults (FR-008 + edge case: mid-challenge exit must not corrupt stats).
2. **Atomic-ish writes**: a single `setItem` per save; partial state is never written.
3. **Forward migration**: `schemaVersion` gates future migrations; v1 reads only version 1.
4. **No PII**: only learning progress is stored; no identity/account data.
5. **Availability fallback**: if `localStorage` is unavailable (private mode), the game runs with an
   in-memory record and informs the learner progress won't persist.
