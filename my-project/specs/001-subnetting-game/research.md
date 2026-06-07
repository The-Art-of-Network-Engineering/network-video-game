# Phase 0 Research: Subnetting Learning Game (v1)

All Technical Context unknowns are resolved below. The user directed a "basic HTML/CSS/JavaScript
game in the browser"; the open sub-decisions concern how to satisfy the constitution (static
typing, testing, performance) without abandoning that simplicity.

## 1. Static typing without a build step (Constitution Principle II)

- **Decision**: Write plain ES-module JavaScript with **typed JSDoc**, and enforce types with the
  **TypeScript compiler in `checkJs` mode** (`tsc --noEmit`) in CI. No transpilation of app code.
- **Rationale**: The constitution *requires* static typing for the engine and game-state logic.
  JSDoc + `checkJs` delivers full static type checking while the files the browser loads remain
  literal `.js` — honoring "basic HTML/CSS/JavaScript ... in the browser" with zero build/bundler.
- **Alternatives considered**:
  - *TypeScript with a bundler (Vite/esbuild)*: stronger ergonomics, but adds a transpile/build step
    and a toolchain the user explicitly wanted to keep basic.
  - *Plain JS, no types*: violates Principle II. Rejected.

## 2. No framework / no bundler runtime (user directive + Principle V)

- **Decision**: Vanilla DOM with native ES modules loaded via `<script type="module">`. Zero runtime
  dependencies. Served as static files.
- **Rationale**: The app is small (a few screens, trivial math). A framework adds bundle weight and
  obscures the source the constitution wants readable. Zero deps makes the <150 KB JS budget,
  <100 ms feedback, and fast load on modest hardware trivially attainable.
- **Alternatives considered**: React/Vue/Svelte — unnecessary weight and build complexity for v1.

## 3. Testing stack (Principle III)

- **Decision**: **Vitest** as the runner (V8 coverage with per-path thresholds), **`fast-check`**
  for property-based engine tests, **jsdom** for UI interaction tests.
- **Rationale**: Vitest enforces the 100% engine / ≥80% overall coverage gates declaratively and
  runs pure-engine tests in Node with no DOM. `fast-check` is the standard for the invariants the
  constitution mandates (contiguous mask; network ≤ host ≤ broadcast; usable-count rule + /31,/32).
  jsdom keeps UI tests fast and headless for CI.
- **Alternatives considered**:
  - *node:test + c8*: zero extra runner dep, but more wiring for coverage thresholds and jsdom.
  - *Playwright E2E*: valuable later for full keyboard/accessibility runs; deferred — quickstart
    plus jsdom cover v1 acceptance. Noted as a future addition.

## 4. Persistence model (FR-008)

- **Decision**: `localStorage`, single JSON Progress Record under a versioned key
  (e.g., `subnetgame:v1:progress`), no account.
- **Rationale**: Matches the resolved spec default (local-only, cross-session, same device, no
  login). Synchronous, simple, universally supported, offline. A `schemaVersion` field allows
  forward migration.
- **Alternatives considered**: IndexedDB (overkill for one small record); account/cloud sync
  (explicitly out of scope for v1).

## 5. Correctness foundations (Principle I — load-bearing)

- **Decision**: All address/mask math operates on 32-bit unsigned integers (via `>>> 0`) inside the
  engine; dotted-decimal and CIDR are only presentation/parse concerns at the engine boundary.
  Special cases: `/31` → 2 usable, no network/broadcast (RFC 3021); `/32` → 1 address. Usable hosts
  = `2^h − 2` for `h ≥ 2`.
- **Rationale**: Integer math is exact and fast (<1 ms), avoids string-parsing drift, and makes the
  invariants property-testable. RFC alignment: RFC 4632 (CIDR), RFC 1918 (private space),
  RFC 3021 (/31). IPv6 (RFC 4291) deferred.
- **Alternatives considered**: String/octet-array math — slower and error-prone; rejected.

## 6. Distractor generation (FR-017, Principle I)

- **Decision**: The engine generates multiple-choice distractors as *engine-computed* values that
  model named misconceptions: off-by-one host count (`±2` / forgetting the −2), wrong mask octet,
  network↔broadcast swap, and adjacent-prefix errors. Distractors are validated to be wrong and
  distinct from the correct answer before use.
- **Rationale**: Keeps distractors diagnostic (not random noise) and impossible to drift from the
  engine, satisfying Principles I and IV.

## 7. Concept → tier → content mapping (FR-006, FR-015, FR-020)

- **Decision**: A declarative `content.js` config maps each concept to a tier, a brief lesson, and a
  challenge generator (engine call + parameters). Ordering: binary↔decimal → mask/CIDR → network &
  broadcast → host counts/ranges → VLSM → supernetting. Mastery = streak (default 5) of correct
  answers in the tier; an incorrect answer resets the streak.
- **Rationale**: Declarative content keeps progression data-driven and testable, and guarantees a
  lesson precedes the first challenge of each concept (no untaught concept tested).

## 8. Accessibility & responsiveness (Principle IV, FR-010–FR-012)

- **Decision**: Semantic HTML, full keyboard operation, visible focus, ARIA live region for
  feedback; status conveyed by text + icon/shape in addition to color; verify WCAG AA contrast.
  Keep work off the main thread (math is trivial; no heavy loops).
- **Rationale**: Directly satisfies the accessibility and responsiveness constitution gates.

## Resolved Unknowns Summary

| Unknown | Resolution |
|---------|------------|
| Language/typing | ES2022 JS + JSDoc, `tsc --checkJs` (no build) |
| Framework/bundler | None — vanilla DOM, native ES modules |
| Test stack | Vitest + fast-check + jsdom; 100% engine / ≥80% overall |
| Persistence | `localStorage`, versioned JSON, no account |
| Engine math model | 32-bit integer ops; /31, /32 special-cased |
| Distractors | Engine-generated misconception models |
| Content/progression | Declarative concept→tier map; streak mastery |

No NEEDS CLARIFICATION items remain.
