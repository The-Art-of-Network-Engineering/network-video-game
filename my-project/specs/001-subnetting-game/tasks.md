---
description: "Task list for Subnetting Learning Game (v1)"
---

# Tasks: Subnetting Learning Game (v1)

**Input**: Design documents from `/specs/001-subnetting-game/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: REQUIRED. The project constitution (Principle III) mandates test-first development,
100% engine coverage, and property-based invariants. Test tasks are therefore included and, for the
engine, MUST be written and fail before implementation.

**Organization**: Tasks are grouped by user story. The pure engine is foundational (every story
depends on it per FR-001 / Constitution Principle I).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3 (user-story phases only)
- All paths are repo-relative.

## Path Conventions

Single-project static web app. Runtime code under `src/{engine,game,ui}`, content under
`src/game/content.js`, app shell at repo root (`index.html`, `styles/`), tests under
`tests/{unit,property,ui}`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, tooling, and quality gates (no app logic yet)

- [X] T001 Create the project directory structure per plan.md: `src/engine/`, `src/game/`, `src/ui/`, `styles/`, `tests/unit/`, `tests/property/`, `tests/ui/`
- [X] T002 Create `package.json` with dev-only devDependencies (typescript, eslint, prettier, vitest, @vitest/coverage-v8, fast-check, jsdom) and scripts: `test`, `coverage`, `typecheck`, `lint`, `format`; declare zero runtime dependencies
- [X] T003 [P] Create `tsconfig.json` enabling `checkJs`, `noEmit`, strict type options for JSDoc static typing across `src/`
- [X] T004 [P] Create `.eslintrc` + `.prettierrc` including `no-restricted-imports`/import-boundary rules forbidding `src/engine` from importing `src/game` or `src/ui`, and `src/game` from importing `src/ui`
- [X] T005 [P] Create `vitest.config.js` with V8 coverage and per-path thresholds: 100% for `src/engine/**`, ≥80% overall; jsdom environment for `tests/ui/**`
- [X] T006 [P] Create static app shell `index.html` (loads `src/ui/app.js` via `<script type="module">`) and `styles/main.css` skeleton (placeholders; WCAG AA tokens)
- [X] T007 [P] Create CI workflow `.github/workflows/ci.yml` running `typecheck`, `lint`, `test`, and `coverage` (gates block merge per Constitution Dev Workflow)

**Checkpoint**: `npm install`, `npm run typecheck`, and `npm run lint` succeed on the empty skeleton.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pure, canonical subnet engine — the single source of truth for all math
(FR-001, Constitution Principle I). **No user story can begin until this is complete.**

**⚠️ Test-first (Principle III): write the tests in T008–T010 and confirm they FAIL before T011–T016.**

- [X] T008 [P] Write engine unit tests for address/mask in `tests/unit/address.test.js`: `parseAddress`, `formatAddress`, `prefixToMask`, `maskToPrefix` (incl. rejecting non-contiguous masks), `equivalent` (`/24`≡`255.255.255.0`, leading zeros) — per `contracts/engine.md`
- [X] T009 [P] Write engine unit tests for subnet computation in `tests/unit/subnet.test.js`: `subnetInfo`, `usableHosts`, named edge cases /0, /30, **/31 (RFC 3021, 2 usable)**, **/32 (1 usable)**, classful boundaries, `vlsmAllocate`, `supernet`
- [X] T010 [P] Write property-based tests in `tests/property/engine.props.test.js` (fast-check) asserting contracts/engine.md guarantees #1–#3 and #6–#7: contiguous mask, `network ≤ firstHost ≤ lastHost ≤ broadcast`, usable-count rule with /31,/32 exceptions across all p∈[0,32], determinism, and that invalid input always throws `EngineError`
- [X] T011 Implement `src/engine/address.js`: 32-bit integer parse/format, `prefixToMask`, `maskToPrefix`, `equivalent`, with typed JSDoc and named constants (no magic numbers)
- [X] T012 Implement `EngineError` and shared engine constants in `src/engine/errors.js`
- [X] T013 Implement `src/engine/special-cases.js`: `/31` and `/32` host logic (RFC 3021 / host routes)
- [X] T014 Implement `src/engine/subnet.js`: `subnetInfo`, `usableHosts` (uses special-cases), `vlsmAllocate`, `supernet`
- [X] T015 Implement `src/engine/index.js` exposing the public engine surface from `contracts/engine.md` (math functions only at this stage)
- [X] T016 Run `npm run coverage` and confirm `src/engine` math reaches 100%; add any missing edge-case tests until green

**Checkpoint**: Engine math is implemented, typed, and at 100% coverage. Stories can now begin.

---

## Phase 3: User Story 1 - Solve a challenge and get instant, explained feedback (Priority: P1) 🎯 MVP

**Goal**: A learner sees a brief lesson, solves an engine-generated challenge (MC to introduce,
free-text to master), and gets immediate confirmation or a revealed answer with a step-by-step
derivation. Equivalent formats accepted; /31,/32 special-cased; malformed input is a no-op.

**Independent Test**: Per quickstart US1 — correct→advance <100ms; wrong→reveal+derivation;
`255.255.255.0`≡`/24` accepted; /31 & /32 use special-case logic; malformed → format reminder, no-op.

### Tests for User Story 1 (write first, ensure they fail) ⚠️

- [X] T017 [P] [US1] Write generation/grading property tests in `tests/property/generate.props.test.js`: every `generateChallenge` output grades its canonical answer correct, exactly one correct MC option, and all distractors grade incorrect & distinct (contracts/engine.md #4, #5)
- [X] T018 [P] [US1] Write unit tests for `grade`/`explain` in `tests/unit/grade.test.js`: equivalent-format acceptance, malformed → `EngineError`, explanation steps present and correct for /31,/32
- [X] T019 [P] [US1] Write session unit tests in `tests/unit/session.test.js`: malformed submission is a no-op (no attempt recorded), correct/incorrect update in-memory attempt flow and `elapsedMs` captured passively
- [X] T020 [P] [US1] Write jsdom UI tests in `tests/ui/challenge.test.js`: lesson renders before first challenge; correct→confirm+advance; wrong→reveal answer + derivation; malformed→format reminder; keyboard-only submission works

### Implementation for User Story 1

- [X] T021 [US1] Implement `src/engine/generate.js`: `generateChallenge(conceptId, tierId, entryMode, rng)` producing engine-validated challenges (FR-013) and `makeDistractors` modeling named misconceptions (off-by-one host, wrong octet, network↔broadcast swap)
- [X] T022 [US1] Implement `grade` and `explain` in the engine and export `generate`, `grade`, `explain` from `src/engine/index.js` (completes contracts/engine.md surface)
- [X] T023 [P] [US1] Implement initial content in `src/game/content.js`: lessons + challenge generators for the first concepts (`binary-decimal`, `mask-cidr`, `network-broadcast`) with per-concept entry-mode scaffolding (MC→free-text) per FR-017
- [X] T024 [US1] Implement `src/game/session.js`: current-challenge flow, submit→grade, malformed no-op handling, passive `elapsedMs`, in-memory attempt/stats (no persistence yet)
- [X] T025 [P] [US1] Implement `src/ui/render.js`: lesson, challenge (MC + free-text), and feedback screens with consistent notation, ARIA live region, and text+icon (non-color) status
- [X] T026 [P] [US1] Implement `src/ui/input.js`: keyboard handling and answer capture for MC and free-text entry
- [X] T027 [US1] Implement `src/ui/app.js`: bootstrap that wires `ui → game → engine` and drives the lesson→challenge→feedback loop; mount from `index.html`
- [X] T028 [US1] Style the US1 screens in `styles/main.css` (focus rings, status icons/shapes, WCAG AA contrast)
- [X] T029 [US1] Run US1 quickstart steps + `npm test`; confirm all US1 tests green and feedback renders <100ms

**Checkpoint**: MVP complete — a learner can practice and learn from explained feedback end-to-end.

---

## Phase 4: User Story 2 - Progress through difficulty tiers gated by mastery (Priority: P2)

**Goal**: Challenges are organized into ordered tiers; a streak of consecutive correct answers
(default 5; reset on wrong) unlocks the next tier; locked tiers are gated with a non-color cue;
reaching the top tier offers a meaningful next step.

**Independent Test**: Per quickstart US2 — streak reaches threshold→unlock; one wrong→streak resets;
locked tier gated with non-color cue; top tier→replay/mixed-review offered.

### Tests for User Story 2 (write first, ensure they fail) ⚠️

- [ ] T030 [P] [US2] Write progression unit tests in `tests/unit/progression.test.js`: streak increments on correct, resets on incorrect, unlocks next tier at `masteryStreak`, entry tier always unlocked, new tier resets streak
- [ ] T031 [P] [US2] Write jsdom UI tests in `tests/ui/tiers.test.js`: tier map renders; locked tier shows non-color lock cue and cannot be entered; top-tier completion offers a next step

### Implementation for User Story 2

- [ ] T032 [P] [US2] Extend `src/game/content.js` with the full ordered tier definitions and remaining concepts (`host-count-range`, `vlsm`, `supernetting`), each mapped to a tier and `masteryStreak`
- [ ] T033 [US2] Implement `src/game/progression.js`: streak tracking, mastery detection, tier unlock/selection state transitions (data-model.md)
- [ ] T034 [US2] Integrate progression into `src/game/session.js`: advance streak on grade, trigger unlocks, surface "top tier reached"
- [ ] T035 [P] [US2] Implement tier map + lock UI in `src/ui/render.js` (non-color lock cue) and wire navigation in `src/ui/app.js`
- [ ] T036 [US2] Run US2 quickstart steps + `npm test`; confirm unlock/lock/top-tier behavior

**Checkpoint**: US1 and US2 both work independently; learners progress through a gated tier ladder.

---

## Phase 5: User Story 3 - Track progress and resume across sessions (Priority: P3)

**Goal**: Accuracy and speed are reported; the Progress Record persists to localStorage and is
restored on reopen (same device, no account); mid-challenge exit does not corrupt stats.

**Independent Test**: Per quickstart US3 — progress screen shows accuracy/speed; close+reopen
restores progress and unlocked tiers; mid-challenge exit leaves stats intact.

### Tests for User Story 3 (write first, ensure they fail) ⚠️

- [ ] T037 [P] [US3] Write storage unit tests in `tests/unit/storage.test.js`: `loadProgress` defaults on missing/corrupt JSON and unknown `schemaVersion`; `saveProgress` round-trip; `resetProgress`; unavailable-localStorage fallback (contracts/persistence.md)
- [ ] T038 [P] [US3] Write resume integration tests in `tests/ui/resume.test.js`: answer some challenges, reload, confirm restored tier/streak/stats; mid-challenge exit does not corrupt recorded stats
- [ ] T039 [P] [US3] Write stats unit tests in `tests/unit/stats.test.js`: accuracy derivation, median elapsed, totals exclude malformed no-ops

### Implementation for User Story 3

- [ ] T040 [US3] Implement `src/game/storage.js`: versioned `localStorage` Progress Record with `loadProgress`/`saveProgress`/`resetProgress` and resilient fallbacks (contracts/persistence.md)
- [ ] T041 [US3] Implement stats aggregation (accuracy, median speed, mistakeCounts) in `src/game/session.js` and persist via storage after each graded attempt
- [ ] T042 [US3] Wire resume-on-load into `src/ui/app.js` (hydrate from `loadProgress`, restore current tier/streak)
- [ ] T043 [P] [US3] Implement the Progress screen in `src/ui/render.js` reporting accuracy and passive speed
- [ ] T044 [US3] Run US3 quickstart steps + `npm test`; confirm persistence, resume, and no-corruption behavior

**Checkpoint**: All three user stories function independently and together.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Constitution gates across the whole feature

- [ ] T045 [P] Accessibility pass: verify full keyboard operability, visible focus, ARIA live feedback, and non-color status across all screens; fix gaps in `src/ui/render.js`/`styles/main.css` (FR-010–FR-012, SC-007)
- [ ] T046 [P] WCAG AA contrast audit of `styles/main.css`; adjust tokens to pass
- [ ] T047 [P] Performance budget check: confirm feedback <100ms (p95), 60fps transitions, engine <1ms, total shipped JS < 150KB with zero runtime deps; add a bundle-size check to CI
- [ ] T048 Verify coverage gates in CI: 100% `src/engine`, ≥80% overall; fail the build otherwise
- [ ] T049 [P] Confirm ESLint import-boundary rules pass (engine ⊄ game/ui; game ⊄ ui) and add the check to CI
- [ ] T050 [P] Add `README.md` run instructions and validate the full `quickstart.md` end-to-end (DoD checklist)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories** (engine is the canonical source).
- **User Stories (Phases 3–5)**: All depend on Foundational. US2 builds on US1's loop; US3 builds on US1/US2 state but is independently testable.
- **Polish (Phase 6)**: Depends on the desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational. Delivers the MVP.
- **US2 (P2)**: Depends on Foundational; integrates with US1's session loop.
- **US3 (P3)**: Depends on Foundational; persists state produced by US1/US2.

### Within Each Phase

- Engine tests (T008–T010, T017–T019) MUST be written and fail before their implementation tasks.
- Models/content before services; services before UI; UI before integration/wiring.

---

## Parallel Execution Examples

```bash
# Phase 1 setup config files (different files):
T003 tsconfig.json   T004 eslint/prettier   T005 vitest.config.js   T006 index.html/css   T007 CI

# Phase 2 engine tests (write together, then implement):
T008 address.test.js   T009 subnet.test.js   T010 engine.props.test.js

# Phase 3 US1 tests (different files):
T017 generate.props   T018 grade.test   T019 session.test   T020 challenge.ui.test
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational engine (test-first, 100%) → 3. Phase 3 US1 →
4. **STOP & VALIDATE** US1 via quickstart → ship/demo the MVP.

### Incremental Delivery

- Foundation + US1 = MVP (practice loop with explained feedback)
- + US2 = gated tier progression
- + US3 = persistence & resume
- + Phase 6 = accessibility, performance, and CI gates verified
