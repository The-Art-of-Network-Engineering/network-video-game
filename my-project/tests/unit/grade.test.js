import { describe, it, expect } from 'vitest';
import { grade, explain } from '../../src/engine/index.js';
import { EngineError } from '../../src/engine/errors.js';

/** Build a minimal free-text challenge for grading tests. */
function freeText(kind, canonical, extra = {}) {
  return {
    id: 'test',
    conceptId: 'test',
    tierId: 'tier-1',
    prompt: 'test',
    entryMode: 'free-text',
    answer: { kind, canonical },
    acceptedFormats: [canonical],
    explanation: { steps: ['step'], result: canonical },
    ...extra,
  };
}

describe('grade (free-text)', () => {
  it('accepts the exact canonical answer', () => {
    expect(grade(freeText('address', '192.168.1.0'), '192.168.1.0').correct).toBe(true);
  });

  it('accepts equivalent mask representations (/24 == 255.255.255.0)', () => {
    const ch = freeText('mask', '255.255.255.0');
    expect(grade(ch, '/24').correct).toBe(true);
    expect(grade(ch, '24').correct).toBe(true);
    expect(grade(ch, '255.255.255.0').correct).toBe(true);
  });

  it('accepts addresses with leading zeros', () => {
    expect(grade(freeText('address', '10.0.0.1'), '010.000.000.001').correct).toBe(true);
  });

  it('marks a valid-but-wrong answer incorrect', () => {
    expect(grade(freeText('address', '192.168.1.0'), '192.168.1.255').correct).toBe(false);
  });

  it('throws EngineError on malformed input (caller treats as no-op)', () => {
    expect(() => grade(freeText('address', '192.168.1.0'), 'not-an-ip')).toThrow(EngineError);
    expect(() => grade(freeText('count', '254'), 'abc')).toThrow(EngineError);
    expect(() => grade(freeText('address', '10.0.0.0'), '')).toThrow(EngineError);
  });

  it('returns the normalized form alongside correctness', () => {
    const res = grade(freeText('count', '254'), '254');
    expect(res).toEqual({ correct: true, normalized: '254' });
  });
});

describe('grade (multiple choice)', () => {
  const mc = {
    id: 't',
    conceptId: 'c',
    tierId: 'tier-1',
    prompt: 'pick',
    entryMode: 'mc',
    answer: { kind: 'count', canonical: '254' },
    acceptedFormats: ['254'],
    explanation: { steps: ['s'], result: '254' },
    options: [
      { label: '254', isCorrect: true },
      { label: '256', isCorrect: false, misconception: 'forgot-minus-2' },
      { label: '255', isCorrect: false, misconception: 'off-by-one' },
    ],
  };

  it('grades the correct option as correct', () => {
    expect(grade(mc, '254').correct).toBe(true);
  });
  it('grades a wrong option as incorrect', () => {
    expect(grade(mc, '256').correct).toBe(false);
  });
  it('throws EngineError for an option not on the list', () => {
    expect(() => grade(mc, '999')).toThrow(EngineError);
  });

  it('throws EngineError for an mc challenge with no options', () => {
    const broken = { ...mc, options: undefined };
    expect(() => grade(broken, '254')).toThrow(EngineError);
  });
});

describe('explain', () => {
  it('returns the challenge explanation with steps and result', () => {
    const ch = freeText('address', '192.168.1.0');
    const ex = explain(ch);
    expect(ex.result).toBe('192.168.1.0');
    expect(Array.isArray(ex.steps)).toBe(true);
    expect(ex.steps.length).toBeGreaterThan(0);
  });
});
