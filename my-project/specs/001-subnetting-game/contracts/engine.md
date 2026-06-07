# Contract: Subnet Engine (`src/engine/index.js`)

The engine is the **single canonical source** for all subnet math, challenge generation, and
grading (Constitution Principle I). It is **pure**: no DOM, no game state, no I/O. Every function is
deterministic given its inputs (generation takes an explicit RNG/seed for testability).

All functions throw a typed `EngineError` on invalid input rather than returning a wrong result.

## Types (JSDoc typedefs)

```
IPv4      : string  // "192.168.1.0"
Prefix    : integer // 0..32
Mask      : string  // "255.255.255.0"
SubnetInfo: { network: IPv4, broadcast: IPv4|null, firstHost: IPv4|null,
              lastHost: IPv4|null, usableHosts: integer, totalAddresses: integer,
              prefix: Prefix, mask: Mask }
```

## Address / mask functions

| Function | Signature | Behavior |
|----------|-----------|----------|
| `parseAddress` | `(s: string) → uint32` | Parse dotted-decimal; reject octets >255, wrong arity, leading-zero ambiguity per rules. |
| `formatAddress` | `(n: uint32) → IPv4` | Canonical dotted-decimal. |
| `prefixToMask` | `(p: Prefix) → Mask` | e.g. `24 → "255.255.255.0"`. |
| `maskToPrefix` | `(m: Mask) → Prefix` | Reject non-contiguous masks (throws). |
| `equivalent` | `(a: string, b: string, kind) → boolean` | True if two representations denote the same value (`/24` ≡ `255.255.255.0`, leading zeros). |

## Subnet computation

| Function | Signature | Behavior |
|----------|-----------|----------|
| `subnetInfo` | `(addr: IPv4, prefix: Prefix) → SubnetInfo` | Full computation. Special cases below. |
| `usableHosts` | `(prefix: Prefix) → integer` | `2^(32−p) − 2` for p≤30; **/31 → 2**; **/32 → 1**. |
| `vlsmAllocate` | `(base: IPv4, prefix: Prefix, hostReqs: integer[]) → SubnetInfo[]` | Allocate smallest-fitting subnets; throws if they don't fit. |
| `supernet` | `(networks: {addr:IPv4,prefix:Prefix}[]) → {addr:IPv4,prefix:Prefix}` | Smallest aggregate covering inputs. |

### Special-case invariants (RFC 3021 / host routes)
- `/31`: `usableHosts = 2`, `network = null`-conceptually both addresses usable; `broadcast = null`,
  `firstHost`/`lastHost` = the two addresses.
- `/32`: `usableHosts = 1`, `broadcast = null`, single address is host.

## Generation & grading (used by the game layer)

| Function | Signature | Behavior |
|----------|-----------|----------|
| `generateChallenge` | `(conceptId, tierId, entryMode, rng) → Challenge` | Produce an **engine-validated** challenge. MUST throw/discard if not exactly one correct answer (FR-013). |
| `makeDistractors` | `(answer: AnswerSpec, count, rng) → Option[]` | Misconception-modeled wrong options (off-by-one host, wrong octet, network↔broadcast swap); each verified wrong & distinct. |
| `grade` | `(challenge, submitted: string) → { correct: boolean, normalized: string }` | Accept equivalent formats; malformed → `EngineError` (caller treats as no-op). |
| `explain` | `(challenge) → Explanation` | Step-by-step derivation of the canonical answer. |

## Contract guarantees (testable; map to property tests)

1. **Contiguous mask**: any `Mask` accepted by `maskToPrefix` is a contiguous run of 1s.
2. **Ordering**: `network ≤ firstHost ≤ lastHost ≤ broadcast` (when defined).
3. **Usable-count rule**: matches `2^h − 2` with documented /31, /32 exceptions, for all p∈[0,32].
4. **Generation validity**: every `generateChallenge` output passes `grade(challenge, answer.canonical).correct === true` and has exactly one correct MC option.
5. **Distractor correctness**: every distractor grades as incorrect and is distinct.
6. **Determinism**: same seed ⇒ identical challenge.
7. **No silent wrong answers**: invalid input always throws `EngineError`, never returns a value.

## Non-goals
- No rendering, no persistence, no randomness without an injected RNG, no IPv6 (deferred).
