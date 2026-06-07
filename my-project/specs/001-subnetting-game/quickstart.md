# Quickstart & Validation: Subnetting Learning Game (v1)

A run/validation guide proving the feature works end-to-end. Implementation details live in
`tasks.md`; this file describes how to run, test, and verify against the spec.

## Prerequisites

- Node.js 20+ (tooling/tests only — the shipped app needs no Node).
- A modern browser (Chrome, Firefox, Safari, or Edge).

## Setup

```bash
npm install        # installs dev-only tooling (TypeScript, ESLint, Prettier, Vitest, fast-check, jsdom)
```

## Run the game

The app is static files with no build step. Serve the repo root and open it:

```bash
npx serve .        # or: python3 -m http.server
# then open the printed URL and load index.html
```

## Quality gates (must pass — Constitution)

```bash
npm run typecheck  # tsc --checkJs --noEmit  (static typing, Principle II)
npm run lint       # ESLint + Prettier check; import-boundary rules (engine ⊄ game/ui)
npm test           # Vitest: unit + property tests
npm run coverage   # enforce 100% on src/engine, ≥80% overall (Principle III)
```

Expected: typecheck clean, lint clean, all tests green, coverage thresholds met.

## Acceptance validation (maps to spec)

Run these to confirm each user story. Engine/property assertions are automated; UI checks are
listed for manual or jsdom verification.

### US1 — Solve & get instant explained feedback (P1, MVP)
1. Load the game; the first concept shows a **lesson**, then a **multiple-choice** challenge.
2. Submit the **correct** option → confirmed correct, advances immediately (<100 ms). *(SC-005)*
3. On a later free-text challenge, submit a **wrong** answer → marked incorrect, correct answer +
   **step-by-step derivation** shown. *(FR-004)*
4. Enter a `/24` answer as `255.255.255.0` (and with leading zeros) → **accepted**. *(FR-003)*
5. Answer a `/31` and a `/32` challenge → feedback uses **special-case** logic (2 and 1 usable).
   *(FR-009 — automated in engine property tests: guarantees #3, #4 in `contracts/engine.md`)*
6. Enter malformed input (octet 300, prefix 33, letters) → **format reminder, no-op** (stats
   unchanged). *(FR-010)*

### US2 — Tiered progression (P2)
1. Answer correctly until the **mastery streak** (default 5) is reached → next tier **unlocks**.
2. One wrong answer mid-streak → streak resets to 0. *(FR-006)*
3. Attempt a locked tier → gated, with a **non-color** lock cue. *(FR-011)*
4. Reach the final core tier → game offers a **meaningful next step** (replay / mixed review).

### US3 — Progress & resume (P3)
1. Answer several challenges, view **Progress** → accuracy and speed reported. *(FR-007)*
2. Close and reopen the game (same browser) → prior progress + unlocked tiers **restored**.
   *(FR-008)*
3. Exit mid-challenge, reopen → recorded stats are **not corrupted**. *(edge case)*

### Accessibility (Principle IV)
- Complete a full challenge using **keyboard only**.
- Confirm correct/incorrect/locked states are distinguishable **without color** (text + icon).
- Spot-check **WCAG AA** contrast on primary screens.

## Definition of Done (v1)

- [ ] All quality gates pass (typecheck, lint, tests, coverage thresholds).
- [ ] US1–US3 acceptance steps verified.
- [ ] Engine property guarantees (contracts/engine.md #1–#7) all hold.
- [ ] Zero runtime dependencies; total shipped JS < 150 KB.
- [ ] Keyboard-complete and WCAG AA verified.
