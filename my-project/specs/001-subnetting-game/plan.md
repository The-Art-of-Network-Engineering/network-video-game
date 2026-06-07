# Implementation Plan: Subnetting Learning Game (v1)

**Branch**: `001-subnetting-game` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-subnetting-game/spec.md`

## Summary

A single-player, browser-based game that teaches IPv4 subnetting to complete beginners through a
tiered challenge loop: a brief skippable lesson introduces each concept, the learner then solves
problems (multiple choice to introduce a concept, free-text to master it), and every problem is
generated and graded by a single authoritative subnet engine. Wrong answers reveal a step-by-step
derivation; a streak of correct answers unlocks the next tier; progress persists locally.

**Technical approach**: A zero-runtime-dependency static web app built with plain HTML, CSS, and
ES-module JavaScript that runs directly in the browser (no framework, no bundler). The code is
organized into three inward-pointing layers mandated by the constitution — a pure **engine**
(subnet math), a **game** layer (state, tiers, progression, persistence), and a **ui** layer (DOM
rendering and input). Static typing is satisfied without a transpile step by writing typed JSDoc
and type-checking with the TypeScript compiler in `checkJs` mode. Tests use Vitest with `fast-check`
for property-based engine tests; coverage gates enforce 100% on the engine.

## Technical Context

**Language/Version**: JavaScript (ES2022, native ES modules), type-checked with TypeScript 5.x in
`checkJs` mode via JSDoc annotations. Node.js 20+ for tooling/tests only (not shipped).

**Primary Dependencies**: **Zero runtime dependencies** (no framework, no bundler — `.js` files are
served and loaded directly). Dev-only: TypeScript (type-check), ESLint + Prettier (lint/format),
Vitest (test runner + V8 coverage), `fast-check` (property-based tests), jsdom (UI test env).

**Storage**: Browser `localStorage` for the Progress Record (local-only, no account, per FR-008).

**Testing**: Vitest. Engine: unit + property-based (`fast-check`), 100% coverage gate. Game layer:
unit tests for progression/persistence. UI: jsdom interaction tests. Overall coverage floor ≥80%.

**Target Platform**: Modern evergreen browsers (Chrome, Firefox, Safari, Edge), desktop and tablet;
keyboard-first. Runs offline from static files (any static host or `file://`-capable server).

**Project Type**: Single-project, client-side-only static web application.

**Performance Goals**: Feedback rendered <100 ms in ≥95% of submissions (SC-005); 60 fps interaction,
no main-thread blocking; engine solves any single problem <1 ms; interactive <5 s on a low-end
device (SC-008).

**Constraints**: No backend; fully offline-capable. WCAG AA contrast; fully keyboard operable; no
status conveyed by color alone. Asset budget: total shipped JS < 150 KB uncompressed, zero runtime
deps. English only (v1).

**Scale/Scope**: Single-player. v1 concept set: binary↔decimal, mask/CIDR, network & broadcast,
usable host counts & ranges, basic VLSM, route summarization (supernetting). Ordered difficulty
tiers; lesson + challenge content per concept.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Correctness Before Everything (NON-NEGOTIABLE)** — ✅ PASS
- Single canonical `engine/` module is the sole source for all subnet math, generation, grading,
  and distractor creation. No answer/hint/distractor is hand-authored outside the engine.
- Engine handles `/31` (RFC 3021) and `/32` special cases; terminology/ranges follow RFC 4632,
  RFC 1918, RFC 3021. IPv6 (RFC 4291) deferred per spec.
- Every generated challenge is validated by the engine at generation time (FR-001, FR-013).

**II. Code Quality** — ✅ PASS
- Engine is pure and isolated (no UI/state/render imports); dependencies point inward
  (`ui → game → engine`). Named constants/functions, no magic numbers. Static typing via
  JSDoc + `tsc --checkJs` for engine and game-state. Lint/format enforced in CI.

**III. Testing Standards** — ✅ PASS
- Engine built test-first; 100% coverage gate. Property-based invariants (contiguous mask;
  network ≤ host ≤ broadcast; usable-count rule + /31,/32 exceptions). Named edge-case tests
  (/0, /31, /32, classful boundaries, VLSM, adjacent/overlapping, malformed). Regression test per
  bug. Pedagogical logic tested to never emit an invalid problem. Overall floor ≥80%.

**IV. User Experience Consistency** — ✅ PASS
- One notation convention defined once; plain-first language; immediate, consistent, instructive
  feedback. Accessibility required: keyboard-operable, WCAG AA, non-color signals (FR-010–FR-012).
- Difficulty progresses predictably; a lesson precedes every concept (FR-020) so no untaught
  concept is tested.

**V. Performance and Responsiveness** — ✅ PASS
- <100 ms feedback, 60 fps, engine <1 ms, fast load on modest hardware. Perf/asset budgets checked
  in CI. Trivial math + zero runtime deps make these readily achievable.

**Architecture boundary** — ✅ PASS: hard `engine` / `game` / `ui` separation, dependencies inward.

**Result**: No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-subnetting-game/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (engine + persistence + UI contracts)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
index.html               # App shell; loads ES modules, no bundler
styles/
└── main.css             # Styles; WCAG AA, non-color status cues

src/
├── engine/              # PURE subnet math — zero deps, no DOM/state imports
│   ├── address.js       #   parse/format IPv4 addresses & masks (CIDR ↔ dotted)
│   ├── subnet.js        #   network/broadcast/host-count/range, VLSM, supernet
│   ├── special-cases.js #   /31 (RFC 3021), /32 logic
│   ├── generate.js      #   generate engine-validated challenges + distractors
│   └── index.js         #   public engine surface (see contracts/engine.md)
├── game/                # State, tiers, progression, persistence (typed)
│   ├── progression.js   #   streak-based mastery, tier unlock
│   ├── session.js       #   current challenge/attempt flow, stats
│   ├── content.js       #   concept → tier → lesson/challenge config
│   └── storage.js       #   localStorage Progress Record (see contracts/persistence.md)
└── ui/                  # DOM rendering + input only
    ├── render.js        #   screens: lesson, challenge, feedback, progress
    ├── input.js         #   keyboard handling, answer entry (MC + free-text)
    └── app.js           #   wires ui → game → engine; entry point

tests/
├── unit/                # engine + game unit tests
├── property/            # fast-check property tests (engine invariants)
└── ui/                  # jsdom interaction tests

package.json             # dev tooling + scripts (test, typecheck, lint, format)
tsconfig.json            # checkJs config for JSDoc static typing
```

**Structure Decision**: Single-project, client-side static web app. The three top-level `src/`
subtrees (`engine`, `game`, `ui`) enforce the constitution's layered architecture physically;
ESLint import rules forbid `engine` from importing `game`/`ui` and `game` from importing `ui`.

## Complexity Tracking

> No constitution violations. No entries required.
