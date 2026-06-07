# Feature Specification: Subnetting Learning Game (v1)

**Feature Branch**: `001-subnetting-game`
**Created**: 2026-06-07
**Status**: Draft
**Input**: User description: "A video game that teaches IP subnetting through play. Make learners faster and more confident at subnetting while never presenting anything incorrect."

> **Core concept assumption (stated, not guessed):** v1 is a single-player, tiered challenge game. The learner solves subnetting problems generated and graded by an authoritative calculation source, receives immediate feedback that explains the correct reasoning, and unlocks harder tiers by demonstrating mastery. A light motivation layer (progress, streaks, tier unlocks) sits on top. This is the highest-leverage concept for teaching the actual skill and keeps content correctness central. If you want a different framing (narrative adventure, head-to-head competition, sandbox builder, and so on), say so and the spec regenerates; the requirements below are written around the loop above.

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story

As someone learning subnetting, I want to practice solving subnetting problems in a game that gives me instant, explained feedback and gradually raises the difficulty, so that I build speed, accuracy, and confidence without needing a textbook or an instructor in the room.

### Acceptance Scenarios

1. **Given** a learner begins at the first difficulty tier, **When** a challenge is presented, **Then** the prompt states the scenario and the exact answer or answers required in unambiguous terms, including the expected format.
2. **Given** a challenge is on screen, **When** the learner submits a correct answer, **Then** the game confirms it is correct, records the result, and advances to the next challenge with no perceptible delay.
3. **Given** a challenge is on screen, **When** the learner submits an incorrect answer, **Then** the game indicates it is incorrect and shows the correct answer with a step-by-step derivation of how it is reached.
4. **Given** a learner answers enough challenges correctly to meet a tier's mastery threshold, **When** that threshold is reached, **Then** the next tier unlocks.
5. **Given** a challenge involves a special prefix such as /31 or /32, **When** the learner answers and receives feedback, **Then** the grading and the explanation use the correct special-case logic rather than the generic host formula.
6. **Given** a learner submits a correct value written in an equivalent alternate format (for example a mask as `/24` versus `255.255.255.0`, or an octet with leading zeros), **When** the answer is graded, **Then** it is accepted as correct.
7. **Given** a learner returns after closing the game, **When** they reopen it, **Then** their prior progress and unlocked tiers are restored. [NEEDS CLARIFICATION: is progress persisted across sessions in v1, and if so is it local-only or tied to an account?]

### Edge Cases

- Learner submits malformed input (non-numeric, an octet above 255, a prefix outside 0 to 32, wrong delimiter): the game rejects it gracefully and states the expected format. [NEEDS CLARIFICATION: does a malformed entry count as a failed attempt or as a no-op?]
- Learner submits an empty answer.
- Learner exits in the middle of a challenge: in-progress state is handled without corrupting recorded stats.
- Learner reaches the end of available content / the top tier: the game communicates this and offers a meaningful next step (replay, mixed-review mode, or similar).
- Two valid representations of the same answer are entered across attempts; both resolve consistently.
- A challenge that could be read two ways is never generated; every challenge has exactly one correct answer or an explicitly enumerated accepted set.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST generate every challenge and grade every answer using a single authoritative subnetting calculation source, so that no challenge is ever shown with an incorrect or unverifiable answer.
- **FR-002**: Each challenge MUST state, unambiguously, what is being asked and the expected answer format.
- **FR-003**: The game MUST grade learner answers as correct or incorrect and MUST treat equivalent valid representations of the same value as correct (CIDR prefix versus dotted-decimal mask, leading zeros, and similar).
- **FR-004**: On an incorrect answer, the game MUST present the correct answer together with a step-by-step explanation of how it is derived.
- **FR-005**: The game MUST return feedback on each submission quickly enough to preserve flow (target stated in Success Criteria).
- **FR-006**: The game MUST organize challenges into ordered difficulty tiers and MUST gate access to later tiers on demonstrated mastery of earlier ones.
- **FR-007**: The game MUST track the learner's accuracy and speed and MUST report progress back to the learner.
- **FR-008**: The game MUST correctly handle special prefixes, including /31 point-to-point links and /32 host routes, in both grading and explanations.
- **FR-009**: The game MUST reject malformed or out-of-range input gracefully and tell the learner the expected format.
- **FR-010**: The game MUST convey every piece of status information (correct, incorrect, progress, locked or unlocked) through more than color alone.
- **FR-011**: The game MUST be fully operable using a keyboard.
- **FR-012**: Every challenge MUST have exactly one correct answer or an explicitly defined set of accepted answers.
- **FR-013**: The game MUST be self-contained for learning: a motivated beginner MUST be able to progress using only the explanations the game provides, without outside reference material.
- **FR-014**: The game MUST cover the following subnetting concepts in v1: [NEEDS CLARIFICATION: confirm scope. Candidate set: binary-to-decimal conversion, subnet mask and CIDR notation, identifying network and broadcast addresses, computing usable host counts and ranges, and basic VLSM. Is IPv6 included or deferred? Is binary conversion in or out?]
- **FR-015**: The game's target audience MUST be defined so difficulty floor and tone can be set. [NEEDS CLARIFICATION: complete beginners, certification candidates such as CCNA, or classroom learners of a specific level?]
- **FR-016**: The game MUST define how the learner enters answers. [NEEDS CLARIFICATION: free-text entry, multiple choice, or a mix; if multiple choice is used, wrong options MUST represent realistic misconceptions per the constitution.]
- **FR-017**: The game SHOULD detect repeated mistakes of the same kind and surface targeted practice or a focused explanation for that concept. [NEEDS CLARIFICATION: is adaptive remediation in v1 or a later release?]
- **FR-018**: The game MUST define its hint behavior. [NEEDS CLARIFICATION: are hints available, and are they unlimited, limited, or scored against the learner?]

### Key Entities

- **Learner**: the person playing. Holds current tier, unlocked tiers, accuracy and speed statistics, and mistake history. No assumption about identity or accounts beyond what persistence (FR-007) requires.
- **Concept (Skill)**: a discrete subnetting skill such as "find the network address" or "design a VLSM scheme." Concepts organize tiers and drive any targeted remediation.
- **Challenge**: a single subnetting task. Holds the given scenario, the concept(s) it tests, its difficulty tier, the canonical correct answer(s), the set of accepted equivalent formats, and its explanation.
- **Difficulty Tier**: an ordered grouping of challenges that gates progression.
- **Attempt**: a single submission against a challenge. Holds the submitted value, correctness, and time taken; feeds statistics and mistake detection.
- **Explanation**: the step-by-step derivation associated with a challenge or concept, shown on an incorrect answer and available for review.
- **Progress Record**: the learner's unlocked tiers and accumulated statistics, scoped to a session or persisted across sessions per the clarification on FR-007.

---

## Success Criteria *(mandatory)*

- **SC-001 (Correctness, load-bearing)**: 100 percent of challenges presented to learners have answers that match an independent correct calculation. Zero incorrect-answer defects reach a learner.
- **SC-002 (Onboarding)**: A first-time learner can understand how to play and answer their first challenge within 2 minutes of opening the game, using only what the game itself provides.
- **SC-003 (Efficacy)**: On a fixed assessment set taken before and after a defined practice period, a learner's accuracy improves measurably. [Target tunable, for example: median accuracy on the assessment set rises by at least 25 percentage points, or median time-to-correct-answer drops by at least one third.]
- **SC-004 (Beginner reach)**: A learner with no prior subnetting knowledge can complete the first tier and correctly answer its foundational challenges (such as identifying the network and broadcast addresses of a /24) without external help.
- **SC-005 (Responsiveness)**: Feedback appears within 100 milliseconds of submission in at least 95 percent of submissions.
- **SC-006 (Completion / engagement)**: At least [target] percent of learners who start tier 1 reach the final core tier. [NEEDS CLARIFICATION: set a realistic target once audience is defined.]
- **SC-007 (Accessibility)**: The game is fully completable using keyboard only, and every correct-or-incorrect signal is distinguishable without relying on color, verified against WCAG AA contrast.
- **SC-008 (Reach on modest hardware)**: The game becomes interactive within [target] seconds and remains responsive on a representative low-end device, so classrooms and self-learners on older machines are not excluded.

---

## Assumptions

- v1 is single-player and self-paced. No multiplayer, social, or leaderboard features.
- The core loop is solving engine-verified subnetting challenges with immediate explained feedback, arranged as a difficulty ladder (see core concept assumption at top).
- The motivation layer is light (points, streaks, tier unlocks) rather than a heavy narrative, and is easy to revisit later.
- Content is in English for v1. [NEEDS CLARIFICATION: any localization in scope?]
- The learner uses a personal device with a screen and keyboard. Touch support is desirable but keyboard entry is the primary input assumption.
- No instructor or administrator content-authoring in v1 (see Out of Scope).

## Dependencies

- A single authoritative subnetting calculation capability that serves as the source of truth for generating and grading all challenges. This is the engine defined in the project constitution (Principle I and II) and is the only hard dependency for v1; it is internal to the project.
- If progress is persisted across sessions (pending FR-007 clarification), a means of storing learner progress is required.

## Out of Scope (v1)

- Multiplayer, head-to-head play, social features, and leaderboards.
- Instructor dashboards, classroom management, and learner-or-instructor content authoring.
- IPv6 content, unless the FR-014 clarification pulls it in.
- Simulation of, or claims of alignment with, any specific certification exam.
- Any account system beyond the minimum that a chosen persistence model requires.

---

## Review & Acceptance Checklist

- [ ] No implementation details (no languages, frameworks, or APIs named)
- [ ] Focused on learner value and outcomes
- [ ] All mandatory sections completed
- [ ] Requirements are testable and unambiguous, except where explicitly marked
- [ ] Success criteria are measurable and technology-agnostic
- [ ] All genuine ambiguities marked with [NEEDS CLARIFICATION]
- [ ] Scope is bounded
- [ ] Consistent with the project constitution, especially Correctness, accessibility, and immediate explained feedback

---

## Open Questions to Resolve (feed these into /speckit.clarify)

1. **Audience** (FR-015): beginners, certification candidates, or a specific classroom level? Sets the difficulty floor and tone.
2. **Topic scope** (FR-014): which concepts ship in v1, and is IPv6 in or out?
3. **Persistence** (FR-007): does progress save across sessions, and local-only or account-based?
4. **Answer entry** (FR-016): free text, multiple choice, or a mix.
5. **Hints** (FR-018) and **retry-versus-reveal on wrong answers** (Acceptance Scenario 3 / edge cases).
6. **Adaptive remediation** (FR-017): v1 or later.