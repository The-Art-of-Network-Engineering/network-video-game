# Feature Specification: Subnetting Learning Game (v1)

**Feature Branch**: `001-subnetting-game`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "A video game that teaches IP subnetting through play. Make learners faster and more confident at subnetting while never presenting anything incorrect."

> **Core concept (stated, not guessed):** v1 is a single-player, tiered challenge game. The learner solves subnetting problems generated and graded by an authoritative calculation source, receives immediate feedback that explains the correct reasoning, and unlocks harder tiers by demonstrating mastery. A light motivation layer (progress, streaks, tier unlocks) sits on top. If a different framing is wanted (narrative adventure, head-to-head competition, sandbox builder), the spec regenerates; the requirements below are written around this loop.

## Clarifications

### Session 2026-06-07

- Q: What defines "mastery" to unlock the next tier (FR-006)? → A: A streak of consecutive correct answers within the tier (default: 5 in a row, tunable).
- Q: How does the game teach a concept before testing it (FR-014, beginner audience)? → A: Each new concept opens with a brief, skippable lesson; challenges then reinforce it.
- Q: Is there time pressure on challenges, or is speed only measured (FR-007)? → A: Speed is measured passively for stats/efficacy; no countdown or time limit in v1.
- Q: When does answer entry switch from multiple choice to free-text (FR-017)? → A: Per concept — MC introduces a concept, then it switches to free-text before that concept's tier counts as mastered.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Solve a challenge and get instant, explained feedback (Priority: P1)

As someone learning subnetting, I want to solve a subnetting problem and immediately see whether I was right — and, when wrong, exactly how the correct answer is derived — so that I learn from every attempt without a textbook or instructor.

**Why this priority**: This is the core learning loop. On its own it delivers a usable practice tool (an MVP): a learner can answer engine-verified problems and learn from explained feedback even before tiers or progress tracking exist.

**Independent Test**: Present a single generated challenge, submit a correct answer (confirmed correct, advances), then submit a wrong answer to a fresh challenge (marked wrong, correct answer + step-by-step derivation shown). Verify a `/24` mask entered as `255.255.255.0` is accepted, and that a `/31` problem uses special-case logic.

**Acceptance Scenarios**:

1. **Given** a challenge is presented, **When** the learner reads it, **Then** the prompt states the scenario, exactly what is asked, and the expected answer format unambiguously.
2. **Given** a challenge is on screen, **When** the learner submits a correct answer, **Then** the game confirms correct, records the result, and advances with no perceptible delay.
3. **Given** a challenge is on screen, **When** the learner submits an incorrect answer, **Then** the game indicates it is incorrect and shows the correct answer with a step-by-step derivation.
4. **Given** a challenge involves a special prefix such as /31 or /32, **When** the learner answers and receives feedback, **Then** grading and explanation use the correct special-case logic rather than the generic host formula.
5. **Given** the learner submits an equivalent alternate format (a mask as `/24` versus `255.255.255.0`, or an octet with leading zeros), **When** the answer is graded, **Then** it is accepted as correct.

---

### User Story 2 - Progress through difficulty tiers gated by mastery (Priority: P2)

As a learner, I want challenges arranged into ordered difficulty tiers that unlock as I demonstrate mastery, so that I am never asked to apply a concept the game has not yet taught and I can feel my skill growing.

**Why this priority**: Tiered progression converts isolated practice into a structured learning path and drives motivation. It depends on the P1 loop existing but is independently testable.

**Independent Test**: Start at tier 1, answer enough challenges correctly to meet the mastery threshold, and confirm the next tier unlocks; confirm a locked tier cannot be entered early; reach the top tier and confirm a meaningful next step is offered.

**Acceptance Scenarios**:

1. **Given** a learner begins at the first tier, **When** they answer enough challenges correctly to meet that tier's mastery threshold, **Then** the next tier unlocks.
2. **Given** a tier is not yet unlocked, **When** the learner attempts to enter it, **Then** access is gated and the unlock requirement is communicated through more than color alone.
3. **Given** a learner reaches the final core tier, **When** they complete it, **Then** the game communicates this and offers a meaningful next step (replay, mixed-review mode, or similar).

---

### User Story 3 - Track progress and resume across sessions (Priority: P3)

As a returning learner, I want my accuracy, speed, and unlocked tiers tracked and restored when I reopen the game, so that I can practice over multiple sittings and see measurable improvement.

**Why this priority**: Persistence and stats sustain a multi-session learning habit and enable efficacy measurement, but the game teaches effectively in a single session without them.

**Independent Test**: Answer several challenges, close the game, reopen it, and confirm prior progress, stats, and unlocked tiers are restored on the same device.

**Acceptance Scenarios**:

1. **Given** a learner has answered challenges, **When** they view their progress, **Then** the game reports accuracy and speed back to them.
2. **Given** a learner closes and reopens the game on the same device, **When** it loads, **Then** prior progress and unlocked tiers are restored.
3. **Given** a learner exits mid-challenge, **When** they return, **Then** in-progress state is handled without corrupting recorded statistics.

---

### Edge Cases

- Learner submits malformed input (non-numeric, an octet above 255, a prefix outside 0 to 32, wrong delimiter): the game rejects it gracefully and states the expected format. By default a malformed entry is a no-op (not a failed attempt) — see Assumptions.
- Learner submits an empty answer: treated the same as malformed (no-op, format reminder).
- Learner exits in the middle of a challenge: in-progress state is handled without corrupting recorded stats.
- Learner reaches the top tier: the game communicates this and offers a meaningful next step.
- Two valid representations of the same answer are entered across attempts; both resolve consistently.
- A challenge that could be read two ways is never generated; every challenge has exactly one correct answer or an explicitly enumerated accepted set.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST generate every challenge and grade every answer using a single authoritative subnetting calculation source, so that no challenge is ever shown with an incorrect or unverifiable answer.
- **FR-002**: Each challenge MUST state, unambiguously, what is being asked and the expected answer format.
- **FR-003**: The game MUST grade answers as correct or incorrect and MUST treat equivalent valid representations of the same value as correct (CIDR prefix versus dotted-decimal mask, leading zeros, and similar).
- **FR-004**: On an incorrect answer, the game MUST present the correct answer together with a step-by-step explanation of how it is derived.
- **FR-005**: The game MUST return feedback on each submission quickly enough to preserve flow (target stated in Success Criteria).
- **FR-006**: The game MUST organize challenges into ordered difficulty tiers and MUST gate access to later tiers on demonstrated mastery of earlier ones. Mastery is defined as a streak of consecutive correct answers within the tier (default: 5 in a row, tunable); an incorrect answer resets the current streak.
- **FR-007**: The game MUST track the learner's accuracy and speed and MUST report progress back to the learner. Speed is measured passively (time-to-answer recorded for statistics and efficacy); v1 imposes no countdown or per-challenge time limit. Timed modes are deferred (see Assumptions).
- **FR-008**: The game MUST persist progress and unlocked tiers across sessions on the same device, with no account required in v1 (local-only — see Assumptions).
- **FR-009**: The game MUST correctly handle special prefixes, including /31 point-to-point links and /32 host routes, in both grading and explanations.
- **FR-010**: The game MUST reject malformed or out-of-range input gracefully and tell the learner the expected format.
- **FR-011**: The game MUST convey every piece of status information (correct, incorrect, progress, locked or unlocked) through more than color alone.
- **FR-012**: The game MUST be fully operable using a keyboard.
- **FR-013**: Every challenge MUST have exactly one correct answer or an explicitly defined set of accepted answers.
- **FR-014**: The game MUST be self-contained for learning: a motivated beginner MUST be able to progress using only the explanations the game provides, without outside reference material.
- **FR-015**: The game MUST cover the following IPv4 subnetting concepts in v1: binary-to-decimal conversion, subnet mask and CIDR notation, identifying network and broadcast addresses, computing usable host counts and ranges, basic VLSM, and route summarization (supernetting). IPv6 is deferred to a later release.
- **FR-016**: The game MUST target complete beginners with no prior networking knowledge: the difficulty floor MUST start from first principles, the tone MUST be plain-first (everyday phrasing leads, the formal term follows), and no concept may be required before the game has taught it.
- **FR-017**: The game MUST use a mixed answer-entry model scaffolded per concept: when a concept is first introduced its challenges MUST use multiple choice to build confidence, and the same concept MUST switch to free-text entry before its tier can be counted as mastered. Where multiple choice is used, wrong options MUST represent realistic misconceptions (off-by-one host counts, wrong mask octet, network-versus-broadcast confusion) per the constitution, never random noise.
- **FR-018**: The game MUST make hints available on request; in v1 hints are unlimited and do not reduce the learner's recorded score (see Assumptions).
- **FR-019**: The game SHOULD record repeated mistakes of the same kind to inform future targeted practice; adaptive remediation itself is deferred beyond v1 (see Assumptions).
- **FR-020**: The game MUST introduce each new concept with a brief lesson before any challenge requires it, so that a complete beginner is never tested on an untaught concept. The lesson MUST be skippable for learners who already know the material, and MUST be available for review afterward.

### Key Entities

- **Learner**: the person playing. Holds current tier, unlocked tiers, accuracy and speed statistics, and mistake history.
- **Concept (Skill)**: a discrete subnetting skill such as "find the network address" or "design a VLSM scheme." Concepts organize tiers and drive any targeted practice.
- **Challenge**: a single subnetting task. Holds the given scenario, the concept(s) it tests, its difficulty tier, the canonical correct answer(s), the set of accepted equivalent formats, and its explanation.
- **Difficulty Tier**: an ordered grouping of challenges that gates progression.
- **Attempt**: a single submission against a challenge. Holds the submitted value, correctness, and time taken; feeds statistics and mistake detection.
- **Lesson**: a brief, skippable introduction to a concept, shown before the first challenge that requires it and available for later review.
- **Explanation**: the step-by-step derivation associated with a challenge or concept, shown on an incorrect answer and available for review.
- **Progress Record**: the learner's unlocked tiers and accumulated statistics, persisted locally across sessions on the same device.

## Success Criteria *(mandatory)*

- **SC-001 (Correctness, load-bearing)**: 100 percent of challenges presented to learners have answers that match an independent correct calculation. Zero incorrect-answer defects reach a learner.
- **SC-002 (Onboarding)**: A first-time learner can understand how to play and answer their first challenge within 2 minutes of opening the game, using only what the game provides.
- **SC-003 (Efficacy)**: On a fixed assessment set taken before and after a defined practice period, median accuracy rises by at least 25 percentage points OR median time-to-correct-answer drops by at least one third.
- **SC-004 (Beginner reach)**: A learner with no prior subnetting knowledge can complete the first tier and correctly answer its foundational challenges (such as identifying the network and broadcast addresses of a /24) without external help.
- **SC-005 (Responsiveness)**: Feedback appears within 100 milliseconds of submission in at least 95 percent of submissions.
- **SC-006 (Completion / engagement)**: At least 50 percent of learners who start tier 1 reach the final core tier (target revisited once audience is confirmed).
- **SC-007 (Accessibility)**: The game is fully completable using keyboard only, and every correct-or-incorrect signal is distinguishable without relying on color, verified against WCAG AA contrast.
- **SC-008 (Reach on modest hardware)**: The game becomes interactive within 5 seconds and remains responsive on a representative low-end device, so classrooms and self-learners on older machines are not excluded.

## Assumptions

- v1 is single-player and self-paced. No multiplayer, social, or leaderboard features.
- **Audience (resolved, FR-016)**: complete beginners with no prior networking knowledge; difficulty starts from first principles with a plain-first tone.
- **Topic scope (resolved, FR-015)**: IPv4 only in v1 — binary↔decimal, mask/CIDR notation, network & broadcast addresses, usable host counts & ranges, basic VLSM, and route summarization (supernetting). IPv6 deferred.
- **Answer entry (resolved, FR-017)**: mixed and scaffolded per concept — multiple choice introduces a concept, then free-text before that concept's tier is mastered; MC distractors model realistic misconceptions.
- The core loop is solving engine-verified subnetting challenges with immediate explained feedback, arranged as a difficulty ladder.
- The motivation layer is light (points, streaks, tier unlocks) rather than a heavy narrative, and is easy to revisit later.
- **Persistence (default for FR-008)**: progress is saved locally on the learner's device and restored across sessions; no account or login is required in v1. An account-based or cross-device model is out of scope for v1.
- **Malformed input (default)**: a malformed or empty entry is a no-op with a format reminder; it does not count as a failed attempt against the learner's stats.
- **Wrong-answer flow (default)**: an incorrect submission reveals the correct answer with its derivation and then advances; v1 does not require an unlimited retry-before-reveal mode.
- **Hints (default for FR-018)**: hints are available on request, unlimited, and not penalized in v1.
- **Adaptive remediation (default for FR-019)**: v1 records mistake patterns but does not yet adapt the challenge stream; adaptive practice is a later release.
- **Timed modes (FR-007)**: v1 measures speed passively with no time pressure; opt-in timed/challenge modes are deferred to a later release.
- Content is in English for v1; localization is out of scope for v1.
- The learner uses a personal device with a screen and keyboard. Touch support is desirable but keyboard entry is the primary input assumption.
- No instructor or administrator content-authoring in v1.

## Dependencies

- A single authoritative subnetting calculation capability that serves as the source of truth for generating and grading all challenges. This is the engine defined in the project constitution (Principles I and II) and is the only hard dependency for v1; it is internal to the project.
- A local storage mechanism for persisting learner progress across sessions (per FR-008).

## Out of Scope (v1)

- Multiplayer, head-to-head play, social features, and leaderboards.
- Instructor dashboards, classroom management, and learner-or-instructor content authoring.
- IPv6 content (deferred to a later release per FR-015).
- Simulation of, or claims of alignment with, any specific certification exam.
- Account systems, login, and cross-device sync.
- Localization beyond English.
