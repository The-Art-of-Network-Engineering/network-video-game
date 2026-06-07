# Phase 1 Data Model: Subnetting Learning Game (v1)

Entities derive from the spec's Key Entities and clarifications. All types are described abstractly;
the implementation expresses them as typed JSDoc `@typedef`s. Only the **Progress Record** is
persisted (localStorage); everything else is in-memory or static content.

## Concept (Skill)

A discrete subnetting skill. Static content, defined in `game/content.js`.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Stable slug, e.g. `network-broadcast`, `vlsm`, `supernetting` |
| `name` | string | Plain-first display name |
| `tierId` | string | Tier this concept belongs to |
| `lessonId` | string | The lesson shown before the first challenge of this concept |
| `order` | integer | Sequence within its tier |

**v1 concepts (ordered)**: `binary-decimal`, `mask-cidr`, `network-broadcast`, `host-count-range`,
`vlsm`, `supernetting`. (IPv6 deferred.)

## Difficulty Tier

Ordered grouping that gates progression.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | e.g. `tier-1` |
| `order` | integer | Ascending; tier 1 is the entry tier |
| `conceptIds` | string[] | Concepts taught in this tier, in order |
| `masteryStreak` | integer | Consecutive-correct streak to unlock next tier (default 5) |

**Rule**: Tier `n+1` is locked until tier `n` mastery is reached. Entry tier is always unlocked.

## Lesson

Brief, skippable concept introduction (FR-020). Static content.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Matches `Concept.lessonId` |
| `conceptId` | string | Owning concept |
| `body` | string (markup) | Short explainer; plain-first |
| `skippable` | boolean | Always `true` in v1; reviewable later |

## Challenge

A single subnetting task, **generated and validated by the engine** (FR-001, FR-013). Transient.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Generated per instance |
| `conceptId` | string | Concept under test |
| `tierId` | string | Source tier |
| `prompt` | string | Unambiguous question incl. expected format (FR-002) |
| `entryMode` | enum `mc` \| `free-text` | Per-concept scaffolding (FR-017) |
| `answer` | AnswerSpec | Canonical correct answer (see below) |
| `acceptedFormats` | string[] | Equivalent accepted representations (FR-003) |
| `options` | Option[]? | Present only when `entryMode = mc` |
| `explanation` | Explanation | Step-by-step derivation (FR-004) |

**Invariant**: exactly one correct answer OR an explicitly enumerated accepted set; engine asserts
this at generation time. When `entryMode = mc`, exactly one option is correct and the rest are
engine-generated misconception distractors.

### AnswerSpec
| Field | Type | Notes |
|-------|------|-------|
| `kind` | enum `address` \| `mask` \| `count` \| `range` | Drives equivalence rules |
| `canonical` | string | Normalized correct value |

### Option (MC only)
| Field | Type | Notes |
|-------|------|-------|
| `label` | string | Displayed choice |
| `isCorrect` | boolean | Exactly one true |
| `misconception` | string? | Tag for the modeled error (diagnostics) |

## Explanation

Step-by-step derivation, shown on a wrong answer and reviewable (FR-004).

| Field | Type | Notes |
|-------|------|-------|
| `steps` | string[] | Ordered derivation lines |
| `result` | string | The correct value restated |

## Attempt

A single submission. Feeds stats and mistake detection; not individually persisted (aggregated).

| Field | Type | Notes |
|-------|------|-------|
| `challengeId` | string | |
| `conceptId` | string | |
| `submitted` | string | Raw learner input |
| `correct` | boolean | Engine grade; malformed input is a no-op, not an attempt |
| `elapsedMs` | integer | Passive speed measurement (FR-007), no limit |
| `misconceptionTag` | string? | If incorrect and recognizable |

## Progress Record (PERSISTED)

The only persisted entity — `localStorage` key `subnetgame:v1:progress`.

| Field | Type | Notes |
|-------|------|-------|
| `schemaVersion` | integer | For forward migration (currently `1`) |
| `unlockedTierIds` | string[] | Always includes the entry tier |
| `currentTierId` | string | Where the learner resumes |
| `currentStreak` | integer | Consecutive correct in current tier (resets on wrong) |
| `stats` | Stats | Aggregate accuracy/speed |
| `mistakeCounts` | map<string,integer> | misconceptionTag → count (informs future remediation) |

### Stats
| Field | Type | Notes |
|-------|------|-------|
| `totalAttempts` | integer | Excludes malformed no-ops |
| `correctCount` | integer | |
| `accuracy` | float | Derived: `correctCount / totalAttempts` |
| `medianElapsedMs` | integer | Passive speed metric |

## State Transitions

**Tier progression**
```
locked --(previous tier streak == masteryStreak)--> unlocked
unlocked --(learner selects)--> current
```

**Streak (within current tier)**
```
streak = 0
  on correct  → streak += 1
  on incorrect→ streak = 0          (answer revealed + explanation, then advance)
  on malformed→ no change           (no-op, format reminder)
streak == masteryStreak → unlock next tier; reset streak for the new tier
```

**Per-concept entry mode**
```
concept newly introduced → entryMode = mc
concept progressing toward mastery → entryMode = free-text   (before its tier counts as mastered)
```

## Validation Rules (from requirements)

- IPv4 addresses: 4 octets 0–255; prefix 0–32; reject out-of-range/malformed with a format message
  (FR-010) — malformed is a no-op, not a failed attempt.
- Equivalent representations accepted: `/24` ≡ `255.255.255.0`; leading zeros normalized (FR-003).
- `/31` and `/32` use special-case host logic in both grading and explanation (FR-009).
- Every challenge engine-validated before display (FR-001, FR-013).
