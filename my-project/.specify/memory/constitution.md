<!--
SYNC IMPACT REPORT
==================
Version change: (uninitialized template) → 1.0.0
Bump rationale: Initial ratification — first concrete population of the constitution
  from the project-root source draft. Establishes the five core principles plus the
  Technology/Architecture and Development Workflow sections.

Modified principles (placeholder → ratified name):
  - [PRINCIPLE_1_NAME]  → I. Correctness Before Everything (NON-NEGOTIABLE)
  - [PRINCIPLE_2_NAME]  → II. Code Quality
  - [PRINCIPLE_3_NAME]  → III. Testing Standards
  - [PRINCIPLE_4_NAME]  → IV. User Experience Consistency
  - [PRINCIPLE_5_NAME]  → V. Performance and Responsiveness

Added sections:
  - Technology and Architecture Constraints (was [SECTION_2_NAME])
  - Development Workflow & Quality Gates (was [SECTION_3_NAME])
  - Governance (fully populated)

Removed sections: none

Templates requiring updates:
  - .specify/templates/plan-template.md      ✅ aligned (Constitution Check gate +
                                                Complexity Tracking already present;
                                                no change required)
  - .specify/templates/spec-template.md      ✅ aligned (no change required)
  - .specify/templates/tasks-template.md     ✅ aligned (test-first + setup/lint tasks
                                                already representable; no change required)
  - .claude/skills/speckit-*                 ✅ no outdated references requiring change

Follow-up TODOs (deferred placeholders):
  - TODO(PROJECT_NAME): The game has no ratified name. Source draft uses a working
    title and instructs replacing it before ratification. Replace "Subnetting Game
    (working title)" throughout before publishing externally.
  - TODO(TECH_STACK): Target platform, language, framework, and supported devices are
    undecided. Must be defined before running /speckit-specify.
-->

# Subnetting Game (working title) Constitution

> Working title. Replace "Subnetting Game (working title)" with the actual game name
> before public ratification.

**Purpose:** An interactive video game that teaches IP subnetting through play. The game
exists to make learners faster and more confident at subnetting while never presenting
anything incorrect.

## Core Principles

### I. Correctness Before Everything (NON-NEGOTIABLE)

Every networking fact the game presents, generates, or grades MUST be verifiably correct.

- All subnet math (network and broadcast addresses, usable host counts, mask conversion,
  VLSM, supernetting) MUST be produced by a single canonical calculation engine. No answer,
  hint, or wrong-answer option may be hand-authored in a way that can drift from that engine.
- Host-count logic MUST handle the standard rule (usable = 2^h minus 2) AND the documented
  edge cases: /31 point-to-point links (RFC 3021, two usable addresses, no network or
  broadcast) and /32 host routes (one address).
- Terminology and address ranges MUST align with the governing RFCs: RFC 4632 (CIDR),
  RFC 1918 (private space), RFC 3021 (/31). If IPv6 is added later, it MUST align with
  RFC 4291.
- Every generated practice problem MUST be solvable, MUST have a defined correct answer
  (single value, or an explicitly enumerated set), and MUST be validated by the engine at
  generation time. Unverified problems never ship to a learner.
- Wrong-answer options MUST model realistic misconceptions (off-by-one host counts, wrong
  mask octet, confusing network address with broadcast), not random noise, so that mistakes
  are diagnostic.

**Rationale:** This is an educational product about a domain where the math is exact. A
defect here does not merely degrade the experience, it actively teaches falsehoods.
Correctness is therefore the principle every other principle serves, and it is the one
principle that can never be traded for speed, scope, or polish.

### II. Code Quality

- The subnet calculation engine MUST be a pure, isolated module with no knowledge of UI,
  game state, or rendering. Game and presentation layers depend on the engine; the engine
  depends on nothing game-specific.
- No magic numbers. Mask boundaries, host formulas, and address constants live in named,
  documented functions or constants.
- Code MUST pass automated linting and formatting in CI before merge. Static typing is
  required for the engine and for game-state logic.
- Functions that compute or grade subnetting answers MUST be small, single-purpose, and
  individually testable.
- Readability wins over cleverness. A future contributor, or a curious learner reading the
  source, should be able to follow the math.

**Rationale:** A clean, isolated engine is what makes Principle I enforceable. If the math
is scattered across UI code, it cannot be verified, tested, or trusted.

### III. Testing Standards

- The subnet engine MUST be built test-first and MUST reach near-exhaustive coverage. Where
  the input space is small and enumerable (for example all /0 to /32 masks), tests SHOULD
  enumerate it. Where it is large, property-based tests MUST assert invariants: the mask is
  always a contiguous run of ones; network address is less than or equal to every host,
  which is less than or equal to broadcast; usable count follows the rule plus its
  documented exceptions.
- Edge cases MUST have explicit, named tests: /0, /31, /32, classful boundaries, VLSM
  splits, adjacent and overlapping subnets, and malformed input.
- Every bug fix MUST add a regression test that fails before the fix and passes after.
- Pedagogical logic (difficulty progression, hint selection, distractor generation) MUST be
  tested both for correctness and for the guarantee that it can never emit an invalid
  problem.
- A minimum coverage threshold is enforced in CI: 100% for the engine, and a defined floor
  (recommend at least 80%) overall. Merges that drop below the threshold are blocked.

**Rationale:** Exact math demands exact verification. Testing is how Correctness moves from
an aspiration to a guarantee.

### IV. User Experience Consistency

- Notation is consistent on every screen. The chosen convention (for example, always
  showing CIDR alongside dotted-decimal, always labeling "usable hosts" versus "total
  addresses") is defined once and never varies.
- Language is plain first, precise second. The everyday phrasing leads, the formal term is
  introduced alongside it, and the game never uses two different words for the same concept.
- Feedback is immediate, consistent, and instructive. A wrong answer always explains why it
  is wrong and shows the correct reasoning, in the same place and format every time.
- Accessibility is required, not optional. Any information carried by color (such as right
  versus wrong) MUST also be carried by text, icon, or shape. The interface MUST be keyboard
  navigable and meet WCAG AA contrast.
- Difficulty progresses predictably. A learner is never asked to apply a concept the game
  has not yet taught.

**Rationale:** Inconsistent notation or surprise jargon adds cognitive load that competes
with the actual learning. Consistency lets the learner spend their attention on subnetting,
not on decoding the interface.

### V. Performance and Responsiveness

- Answer submission MUST feel instant: feedback rendered in under 100 milliseconds.
- Interactive frame rate MUST hold 60 fps on mid-range hardware. No animation or computation
  blocks the main thread.
- The engine MUST solve any single problem in well under one millisecond. This is trivial
  math, so anything slower signals a defect.
- Initial load MUST be fast, and the game MUST remain playable on modest or older hardware,
  since reaching classrooms and self-directed learners is a goal.
- Performance budgets (load time, bundle size, frame time) are defined and checked in CI.
  Regressions are treated as bugs.

**Rationale:** Learning depends on a tight feedback loop. Lag between answering and seeing
the result breaks the loop and the engagement that makes a game work as a teaching tool.

## Technology and Architecture Constraints

The codebase MUST maintain a hard boundary between three layers:

1. **Subnet engine** — pure logic, no game or UI knowledge.
2. **Game and progression layer** — state, difficulty, scoring, problem selection.
3. **Presentation layer** — rendering and input.

Dependencies point inward toward the engine and never outward. The engine MUST be usable and
testable with no game or rendering code loaded.

- Target platform, language, framework, and supported devices: TODO(TECH_STACK) — define
  before running /speckit-specify.

## Development Workflow & Quality Gates

These gates operationalize the principles above and MUST be enforced in CI:

- **Lint & format gate**: Linting and formatting pass before merge (Principle II).
- **Type gate**: Static typing enforced for the engine and game-state logic (Principle II).
- **Coverage gate**: 100% for the engine; defined overall floor (recommend ≥80%). Merges
  below threshold are blocked (Principle III).
- **Test-first**: Engine and pedagogical logic are built test-first; every bug fix ships
  with a regression test (Principle III).
- **Performance budget gate**: Load time, bundle size, and frame time budgets are checked;
  regressions are treated as bugs (Principle V).
- **Problem-validity gate**: No generated problem reaches a learner without engine
  validation at generation time (Principle I).
- **Constitution Check**: Every `/speckit-plan` MUST confirm the plan honors each principle
  (see Governance).

## Governance

- This constitution supersedes ad-hoc preferences. When a specification, plan, or
  implementation choice conflicts with a principle, the principle wins unless the
  constitution is formally amended first.
- **Constitution Check gate**: every `/speckit-plan` MUST confirm the plan honors each
  principle. Any violation MUST be listed and justified in the plan's Complexity Tracking
  section, or the plan MUST be revised.
- **Implementation hand-off**: because `/speckit-implement` does not currently load this
  file on its own, the relevant principles (especially I through III) MUST be restated in the
  plan and tasks so they actually reach the code-generation step.
- **Amendments** follow semantic versioning. MAJOR for removing or redefining a principle,
  MINOR for adding a principle or materially expanding one, PATCH for clarifications and
  wording. Every amendment records the date and the rationale, and dependent templates (plan,
  spec, tasks) are re-synced.
- **Supremacy of Correctness**: Correctness (Principle I) is never subordinate to any other
  principle. If honoring another principle would require shipping incorrect content, the
  other principle yields.

**Version**: 1.0.0 | **Ratified**: 2026-06-07 | **Last Amended**: 2026-06-07
