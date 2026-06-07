import { describe, it, expect } from 'vitest';
import {
  parseAddress,
  formatAddress,
  prefixToMask,
  maskToPrefix,
  equivalent,
} from '../../src/engine/index.js';
import { EngineError } from '../../src/engine/errors.js';

describe('parseAddress', () => {
  it('parses a dotted-decimal address to a uint32', () => {
    expect(parseAddress('0.0.0.0')).toBe(0);
    expect(parseAddress('255.255.255.255')).toBe(0xffffffff);
    expect(parseAddress('192.168.1.1')).toBe(((192 << 24) | (168 << 16) | (1 << 8) | 1) >>> 0);
  });

  it('rejects octets above 255', () => {
    expect(() => parseAddress('256.0.0.1')).toThrow(EngineError);
    expect(() => parseAddress('1.2.3.300')).toThrow(EngineError);
  });

  it('rejects wrong arity', () => {
    expect(() => parseAddress('1.2.3')).toThrow(EngineError);
    expect(() => parseAddress('1.2.3.4.5')).toThrow(EngineError);
  });

  it('rejects non-numeric and empty', () => {
    expect(() => parseAddress('a.b.c.d')).toThrow(EngineError);
    expect(() => parseAddress('')).toThrow(EngineError);
    expect(() => parseAddress('1.2.3.-1')).toThrow(EngineError);
  });

  it('rejects non-string input', () => {
    // @ts-expect-error exercising the runtime type guard
    expect(() => parseAddress(0xc0a80101)).toThrow(EngineError);
  });

  it('accepts leading zeros as decimal (not octal)', () => {
    expect(parseAddress('010.001.001.001')).toBe(parseAddress('10.1.1.1'));
  });
});

describe('formatAddress', () => {
  it('formats a uint32 back to dotted-decimal', () => {
    expect(formatAddress(0)).toBe('0.0.0.0');
    expect(formatAddress(0xffffffff)).toBe('255.255.255.255');
    expect(formatAddress(parseAddress('192.168.1.1'))).toBe('192.168.1.1');
  });

  it('round-trips with parseAddress', () => {
    for (const a of ['10.0.0.0', '172.16.5.4', '8.8.8.8']) {
      expect(formatAddress(parseAddress(a))).toBe(a);
    }
  });

  it('rejects out-of-range integers', () => {
    expect(() => formatAddress(-1)).toThrow(EngineError);
    expect(() => formatAddress(0x1_0000_0000)).toThrow(EngineError);
  });
});

describe('prefixToMask', () => {
  it('maps common prefixes', () => {
    expect(prefixToMask(0)).toBe('0.0.0.0');
    expect(prefixToMask(8)).toBe('255.0.0.0');
    expect(prefixToMask(24)).toBe('255.255.255.0');
    expect(prefixToMask(30)).toBe('255.255.255.252');
    expect(prefixToMask(31)).toBe('255.255.255.254');
    expect(prefixToMask(32)).toBe('255.255.255.255');
  });

  it('rejects out-of-range prefixes', () => {
    expect(() => prefixToMask(-1)).toThrow(EngineError);
    expect(() => prefixToMask(33)).toThrow(EngineError);
    expect(() => prefixToMask(1.5)).toThrow(EngineError);
  });
});

describe('maskToPrefix', () => {
  it('maps masks back to prefixes', () => {
    expect(maskToPrefix('0.0.0.0')).toBe(0);
    expect(maskToPrefix('255.255.255.0')).toBe(24);
    expect(maskToPrefix('255.255.255.255')).toBe(32);
  });

  it('rejects non-contiguous masks', () => {
    expect(() => maskToPrefix('255.0.255.0')).toThrow(EngineError);
    expect(() => maskToPrefix('255.255.0.255')).toThrow(EngineError);
    expect(() => maskToPrefix('0.255.0.0')).toThrow(EngineError);
  });
});

describe('equivalent', () => {
  it('treats /24 and dotted mask as the same mask value', () => {
    expect(equivalent('/24', '255.255.255.0', 'mask')).toBe(true);
    expect(equivalent('24', '255.255.255.0', 'mask')).toBe(true);
    expect(equivalent('/25', '255.255.255.0', 'mask')).toBe(false);
  });

  it('normalizes leading zeros for addresses', () => {
    expect(equivalent('010.0.0.1', '10.0.0.1', 'address')).toBe(true);
  });

  it('compares host counts numerically', () => {
    expect(equivalent('254', '254', 'count')).toBe(true);
    expect(equivalent('254', '255', 'count')).toBe(false);
  });

  it('rejects a non-integer count comparison', () => {
    expect(equivalent('1.5', '1', 'count')).toBe(false);
  });

  it('compares address ranges', () => {
    expect(equivalent('10.0.0.1 - 10.0.0.254', '10.0.0.1-10.0.0.254', 'range')).toBe(true);
    expect(equivalent('10.0.0.1-10.0.0.254', '10.0.0.1-10.0.0.100', 'range')).toBe(false);
  });

  it('returns false for malformed comparisons rather than throwing', () => {
    expect(equivalent('not-a-mask', '255.255.255.0', 'mask')).toBe(false);
  });

  it('returns false for an unknown answer kind', () => {
    // @ts-expect-error exercising the defensive default branch
    expect(equivalent('a', 'b', 'bogus')).toBe(false);
  });
});
