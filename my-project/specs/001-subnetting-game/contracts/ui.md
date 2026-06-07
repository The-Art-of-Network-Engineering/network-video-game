# Contract: UI (`src/ui/`)

The UI layer renders screens and captures input. It depends on `game` (and indirectly `engine`);
nothing depends on it. It owns no subnet math and no persistence logic.

## Screens / states

| Screen | Purpose | Key elements |
|--------|---------|--------------|
| Lesson | Brief concept intro before its first challenge (FR-020) | body, "Start practice", "Skip" |
| Challenge | Present a challenge and capture an answer | prompt + expected format; MC options or free-text field |
| Feedback | Confirm correct, or reveal correct answer + derivation (FR-004) | status (text+icon+color), explanation steps, "Next" |
| Progress | Report accuracy/speed and tier map (FR-007) | stats, unlocked/locked tiers (non-color cue) |

## Interaction contract (acceptance-aligned)

| Behavior | Requirement |
|----------|-------------|
| Correct submission → confirm + advance with no perceptible delay | US1 #2, SC-005 (<100 ms) |
| Incorrect submission → mark wrong, show correct answer + step-by-step derivation | US1 #3, FR-004 |
| Equivalent formats accepted (`/24` ≡ `255.255.255.0`, leading zeros) | US1 #5, FR-003 |
| Malformed/empty input → format reminder, **no-op** (not a failed attempt) | Edge cases, FR-010 |
| `/31`, `/32` feedback uses special-case logic | US1 #4, FR-009 |
| Tier unlock on mastery streak; locked tier gated with non-color cue | US2, FR-006/FR-011 |
| Top tier reached → meaningful next step (replay / mixed review) | US2 #3 |
| Resume prior progress on reopen | US3 #2, FR-008 |

## Accessibility contract (Principle IV, FR-010–FR-012)

1. **Keyboard-complete**: every action reachable and operable via keyboard; logical tab order;
   visible focus ring.
2. **Non-color status**: correct/incorrect/locked/unlocked conveyed by text **and** icon/shape, not
   color alone.
3. **WCAG AA**: all text/!UI contrast meets AA.
4. **Announce feedback**: result rendered into an ARIA live region so it is announced.
5. **Consistent notation**: one convention for CIDR/mask/labels, defined once, identical everywhere.

## Performance contract

- Feedback rendered <100 ms after submission in ≥95% of cases (SC-005); no main-thread blocking;
  hold 60 fps during transitions (Principle V).
