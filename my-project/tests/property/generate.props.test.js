import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateChallenge, grade } from '../../src/engine/index.js';
import { EngineError } from '../../src/engine/errors.js';
import { makeRng } from '../../src/engine/rng.js';

const US1_CONCEPTS = ['binary-decimal', 'mask-cidr', 'network-broadcast'];
const ENTRY_MODES = /** @type {const} */ (['mc', 'free-text']);

describe('generation guarantees (property-based)', () => {
  it('#4 every generated challenge grades its own canonical answer as correct', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...US1_CONCEPTS),
        fc.constantFrom(...ENTRY_MODES),
        fc.integer({ min: 0, max: 2 ** 31 }),
        (conceptId, entryMode, seed) => {
          const ch = generateChallenge(conceptId, 'tier-1', entryMode, makeRng(seed));
          const answer =
            entryMode === 'mc' ? ch.options.find((o) => o.isCorrect).label : ch.answer.canonical;
          expect(grade(ch, answer).correct).toBe(true);
        }
      )
    );
  });

  it('#4 mc challenges have exactly one correct option', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...US1_CONCEPTS),
        fc.integer({ min: 0, max: 2 ** 31 }),
        (conceptId, seed) => {
          const ch = generateChallenge(conceptId, 'tier-1', 'mc', makeRng(seed));
          const correct = ch.options.filter((o) => o.isCorrect);
          expect(correct).toHaveLength(1);
          expect(ch.options.length).toBeGreaterThanOrEqual(3);
        }
      )
    );
  });

  it('#5 all mc distractors grade as incorrect and are distinct', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...US1_CONCEPTS),
        fc.integer({ min: 0, max: 2 ** 31 }),
        (conceptId, seed) => {
          const ch = generateChallenge(conceptId, 'tier-1', 'mc', makeRng(seed));
          const labels = ch.options.map((o) => o.label);
          expect(new Set(labels).size).toBe(labels.length); // distinct
          for (const opt of ch.options) {
            if (!opt.isCorrect) expect(grade(ch, opt.label).correct).toBe(false);
          }
        }
      )
    );
  });

  it('rejects an unknown concept', () => {
    expect(() => generateChallenge('not-a-concept', 'tier-1', 'mc', makeRng(1))).toThrow(
      EngineError
    );
  });

  it('#6 determinism: same seed yields an identical challenge', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...US1_CONCEPTS),
        fc.constantFrom(...ENTRY_MODES),
        fc.integer({ min: 0, max: 2 ** 31 }),
        (conceptId, entryMode, seed) => {
          const a = generateChallenge(conceptId, 'tier-1', entryMode, makeRng(seed));
          const b = generateChallenge(conceptId, 'tier-1', entryMode, makeRng(seed));
          expect(a).toEqual(b);
        }
      )
    );
  });
});
