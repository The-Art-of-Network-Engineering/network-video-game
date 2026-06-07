import { describe, it, expect } from 'vitest';
import { createSession } from '../../src/game/session.js';

/** A fixed free-text challenge whose canonical answer is "192.168.1.0". */
function networkChallenge() {
  return {
    id: 'c1',
    conceptId: 'network-broadcast',
    tierId: 'tier-1',
    prompt: 'Network address of 192.168.1.45/24?',
    entryMode: 'free-text',
    answer: { kind: 'address', canonical: '192.168.1.0' },
    acceptedFormats: ['192.168.1.0'],
    explanation: { steps: ['clear host bits'], result: '192.168.1.0' },
  };
}

/** Build a session with an injectable clock and challenge provider. */
function makeTestSession() {
  let t = 1000;
  const clock = () => t;
  const advanceClock = (ms) => {
    t += ms;
  };
  const session = createSession({ nextChallenge: networkChallenge, now: clock });
  return { session, advanceClock };
}

describe('createSession', () => {
  it('exposes the first challenge after start', () => {
    const { session } = makeTestSession();
    session.start();
    expect(session.current.id).toBe('c1');
  });

  it('records a correct attempt and captures elapsed time passively', () => {
    const { session, advanceClock } = makeTestSession();
    session.start();
    advanceClock(1500);
    const result = session.submit('192.168.1.0');
    expect(result.status).toBe('correct');
    expect(session.stats.totalAttempts).toBe(1);
    expect(session.stats.correctCount).toBe(1);
    expect(session.stats.accuracy).toBe(1);
    expect(session.lastAttempt.elapsedMs).toBe(1500);
  });

  it('records an incorrect attempt and returns the explanation', () => {
    const { session } = makeTestSession();
    session.start();
    const result = session.submit('192.168.1.255');
    expect(result.status).toBe('incorrect');
    expect(result.explanation.result).toBe('192.168.1.0');
    expect(session.stats.totalAttempts).toBe(1);
    expect(session.stats.correctCount).toBe(0);
  });

  it('treats malformed input as a no-op (no attempt recorded)', () => {
    const { session } = makeTestSession();
    session.start();
    const result = session.submit('not-an-ip');
    expect(result.status).toBe('invalid');
    expect(session.stats.totalAttempts).toBe(0);
    expect(session.stats.correctCount).toBe(0);
  });

  it('accepts equivalent formats (leading zeros) as correct', () => {
    const { session } = makeTestSession();
    session.start();
    expect(session.submit('192.168.001.000').status).toBe('correct');
  });

  it('advances to the next challenge and resets the timer', () => {
    const { session, advanceClock } = makeTestSession();
    session.start();
    advanceClock(500);
    session.submit('192.168.1.0');
    session.advance();
    advanceClock(700);
    session.submit('192.168.1.0');
    expect(session.lastAttempt.elapsedMs).toBe(700);
    expect(session.stats.totalAttempts).toBe(2);
  });
});
