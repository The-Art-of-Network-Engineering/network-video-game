import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  subnetInfo,
  usableHosts,
  formatAddress,
  parseAddress,
  prefixToMask,
  maskToPrefix,
} from '../../src/engine/index.js';
import { EngineError } from '../../src/engine/errors.js';

const anyUint32 = fc.integer({ min: 0, max: 0xffffffff });
const anyPrefix = fc.integer({ min: 0, max: 32 });

describe('engine invariants (property-based)', () => {
  it('#1 every mask from a prefix is a contiguous run of ones', () => {
    fc.assert(
      fc.property(anyPrefix, (p) => {
        const mask = prefixToMask(p);
        // round-trips back to the same prefix (only contiguous masks survive)
        expect(maskToPrefix(mask)).toBe(p);
      })
    );
  });

  it('#2 ordering: network <= firstHost <= lastHost <= broadcast (when defined)', () => {
    fc.assert(
      fc.property(anyUint32, anyPrefix, (addr, prefix) => {
        const info = subnetInfo(formatAddress(addr), prefix);
        const net = parseAddress(info.network);
        const first = info.firstHost === null ? net : parseAddress(info.firstHost);
        const last = info.lastHost === null ? net : parseAddress(info.lastHost);
        const bcast = info.broadcast === null ? last : parseAddress(info.broadcast);
        expect(net <= first).toBe(true);
        expect(first <= last).toBe(true);
        expect(last <= bcast).toBe(true);
      })
    );
  });

  it('#3 usable-count rule holds for all prefixes incl. /31, /32 exceptions', () => {
    fc.assert(
      fc.property(anyPrefix, (p) => {
        const expected = p === 32 ? 1 : p === 31 ? 2 : Math.pow(2, 32 - p) - 2;
        expect(usableHosts(p)).toBe(expected);
      })
    );
  });

  it('#6 determinism: subnetInfo is a pure function of its inputs', () => {
    fc.assert(
      fc.property(anyUint32, anyPrefix, (addr, prefix) => {
        const a = subnetInfo(formatAddress(addr), prefix);
        const b = subnetInfo(formatAddress(addr), prefix);
        expect(a).toEqual(b);
      })
    );
  });

  it('#7 invalid input always throws EngineError, never returns a value', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.integer({ min: 33, max: 200 }), fc.integer({ min: -200, max: -1 })),
        (badPrefix) => {
          expect(() => subnetInfo('10.0.0.0', badPrefix)).toThrow(EngineError);
          expect(() => usableHosts(badPrefix)).toThrow(EngineError);
        }
      )
    );
  });

  it('network address has all host bits cleared', () => {
    fc.assert(
      fc.property(anyUint32, anyPrefix, (addr, prefix) => {
        const info = subnetInfo(formatAddress(addr), prefix);
        const net = parseAddress(info.network);
        const hostBits = 32 - prefix;
        if (hostBits === 0) {
          expect(net).toBe(addr >>> 0);
        } else if (hostBits < 32) {
          const mask = (0xffffffff << hostBits) >>> 0;
          expect((net & mask) >>> 0).toBe(net);
        }
        // hostBits === 32 (/0) => network is 0
        if (hostBits === 32) expect(net).toBe(0);
      })
    );
  });
});
