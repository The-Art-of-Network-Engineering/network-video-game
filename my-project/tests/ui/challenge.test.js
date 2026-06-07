// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { mountApp } from '../../src/ui/app.js';
import { createGame } from '../../src/game/game.js';
import { makeRng } from '../../src/engine/rng.js';

/** @returns {HTMLElement} */
function appRoot() {
  return /** @type {HTMLElement} */ (document.getElementById('app'));
}

/** Submit `text` through whichever entry mode the current challenge uses. */
function submitAnswer(root, game, text) {
  if (game.currentChallenge.entryMode === 'mc') {
    const option = [...root.querySelectorAll('.option')].find((b) => b.textContent.trim() === text);
    option.click();
  } else {
    const input = /** @type {HTMLInputElement} */ (root.querySelector('.answer-input'));
    input.value = text;
    root.querySelector('[data-action="submit"]').click();
  }
}

/** The correct answer text for the current challenge. */
function correctAnswer(game) {
  const ch = game.currentChallenge;
  return ch.entryMode === 'mc' ? ch.options.find((o) => o.isCorrect).label : ch.answer.canonical;
}

/** A validly-formatted but incorrect answer for the current challenge's kind. */
function wrongAnswer(game) {
  const ch = game.currentChallenge;
  const canonical = ch.answer.canonical;
  switch (ch.answer.kind) {
    case 'count':
      return String(Number(canonical) + 1);
    case 'mask':
      return canonical === '255.255.255.255' ? '0.0.0.0' : '255.255.255.255';
    default: // address
      return canonical === '0.0.0.0' ? '255.255.255.255' : '0.0.0.0';
  }
}

let game;

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div><div id="aria-live" role="status"></div>';
  game = createGame({ rng: makeRng(42) });
  mountApp(appRoot(), { game });
});

describe('US1 UI flow', () => {
  it('shows a lesson before the first challenge', () => {
    const root = appRoot();
    expect(root.querySelector('.screen--lesson')).not.toBeNull();
    expect(root.querySelector('[data-action="start-practice"]')).not.toBeNull();
    expect(root.querySelector('.screen--challenge')).toBeNull();
  });

  it('moves from the lesson to a challenge on start-practice', () => {
    const root = appRoot();
    root.querySelector('[data-action="start-practice"]').click();
    expect(root.querySelector('.screen--challenge')).not.toBeNull();
    expect(root.querySelector('.prompt')).not.toBeNull();
  });

  it('confirms a correct answer and lets the learner advance', () => {
    const root = appRoot();
    root.querySelector('[data-action="start-practice"]').click();
    submitAnswer(root, game, correctAnswer(game));
    const fb = root.querySelector('.feedback');
    expect(fb).not.toBeNull();
    expect(fb.classList.contains('feedback--correct')).toBe(true);
    expect(root.querySelector('[data-action="next"]')).not.toBeNull();
  });

  it('reveals the correct answer and a derivation on a wrong answer', () => {
    const root = appRoot();
    root.querySelector('[data-action="start-practice"]').click();
    // Advance to a free-text challenge so we can type a deliberately wrong value.
    while (game.currentChallenge.entryMode !== 'free-text') {
      submitAnswer(root, game, correctAnswer(game));
      root.querySelector('[data-action="next"]').click();
    }
    const expectedCorrect = correctAnswer(game);
    submitAnswer(root, game, wrongAnswer(game));
    const fb = root.querySelector('.feedback');
    expect(fb.classList.contains('feedback--incorrect')).toBe(true);
    const derivation = root.querySelector('.derivation');
    expect(derivation).not.toBeNull();
    expect(derivation.textContent).toContain(expectedCorrect);
  });

  it('rejects malformed input with a format reminder and no advance', () => {
    const root = appRoot();
    root.querySelector('[data-action="start-practice"]').click();
    while (game.currentChallenge.entryMode !== 'free-text') {
      submitAnswer(root, game, correctAnswer(game));
      root.querySelector('[data-action="next"]').click();
    }
    submitAnswer(root, game, 'definitely-not-valid');
    expect(root.querySelector('.input-error')).not.toBeNull();
    // Still on the challenge screen, no feedback shown.
    expect(root.querySelector('.feedback')).toBeNull();
    expect(root.querySelector('.screen--challenge')).not.toBeNull();
  });

  it('announces feedback into the ARIA live region', () => {
    const root = appRoot();
    root.querySelector('[data-action="start-practice"]').click();
    submitAnswer(root, game, correctAnswer(game));
    expect(document.getElementById('aria-live').textContent.toLowerCase()).toContain('correct');
  });
});
