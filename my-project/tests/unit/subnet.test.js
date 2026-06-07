import { describe, it, expect } from 'vitest';
import {
  subnetInfo,
  usableHosts,
  vlsmAllocate,
  supernet,
  prefixForHosts,
} from '../../src/engine/index.js';
import { EngineError } from '../../src/engine/errors.js';

describe('usableHosts', () => {
  it('uses 2^h - 2 for normal prefixes', () => {
    expect(usableHosts(24)).toBe(254);
    expect(usableHosts(30)).toBe(2);
    expect(usableHosts(16)).toBe(65534);
    expect(usableHosts(0)).toBe(4294967294);
  });

  it('special-cases /31 as 2 usable (RFC 3021)', () => {
    expect(usableHosts(31)).toBe(2);
  });

  it('special-cases /32 as 1 usable (host route)', () => {
    expect(usableHosts(32)).toBe(1);
  });

  it('rejects invalid prefixes', () => {
    expect(() => usableHosts(33)).toThrow(EngineError);
    expect(() => usableHosts(-1)).toThrow(EngineError);
  });
});

describe('subnetInfo for a /24', () => {
  const info = subnetInfo('192.168.1.45', 24);
  it('computes network and broadcast', () => {
    expect(info.network).toBe('192.168.1.0');
    expect(info.broadcast).toBe('192.168.1.255');
  });
  it('computes first/last host and counts', () => {
    expect(info.firstHost).toBe('192.168.1.1');
    expect(info.lastHost).toBe('192.168.1.254');
    expect(info.usableHosts).toBe(254);
    expect(info.totalAddresses).toBe(256);
  });
  it('reports prefix and mask', () => {
    expect(info.prefix).toBe(24);
    expect(info.mask).toBe('255.255.255.0');
  });
});

describe('subnetInfo edge cases', () => {
  it('/30 has 2 usable hosts', () => {
    const i = subnetInfo('10.0.0.1', 30);
    expect(i.network).toBe('10.0.0.0');
    expect(i.broadcast).toBe('10.0.0.3');
    expect(i.firstHost).toBe('10.0.0.1');
    expect(i.lastHost).toBe('10.0.0.2');
    expect(i.usableHosts).toBe(2);
  });

  it('/31 has no network/broadcast and 2 usable (RFC 3021)', () => {
    const i = subnetInfo('10.0.0.0', 31);
    expect(i.broadcast).toBeNull();
    expect(i.usableHosts).toBe(2);
    expect(i.firstHost).toBe('10.0.0.0');
    expect(i.lastHost).toBe('10.0.0.1');
    expect(i.totalAddresses).toBe(2);
  });

  it('/32 is a single host route', () => {
    const i = subnetInfo('10.0.0.7', 32);
    expect(i.network).toBe('10.0.0.7');
    expect(i.broadcast).toBeNull();
    expect(i.usableHosts).toBe(1);
    expect(i.firstHost).toBe('10.0.0.7');
    expect(i.lastHost).toBe('10.0.0.7');
    expect(i.totalAddresses).toBe(1);
  });

  it('/0 covers the whole space', () => {
    const i = subnetInfo('8.8.8.8', 0);
    expect(i.network).toBe('0.0.0.0');
    expect(i.broadcast).toBe('255.255.255.255');
    expect(i.usableHosts).toBe(4294967294);
  });

  it('classful boundary /8', () => {
    const i = subnetInfo('10.20.30.40', 8);
    expect(i.network).toBe('10.0.0.0');
    expect(i.broadcast).toBe('10.255.255.255');
  });

  it('rejects malformed input', () => {
    expect(() => subnetInfo('999.0.0.0', 24)).toThrow(EngineError);
    expect(() => subnetInfo('10.0.0.0', 40)).toThrow(EngineError);
  });
});

describe('prefixForHosts', () => {
  it('picks the smallest block that fits a host requirement', () => {
    expect(prefixForHosts(1)).toBe(32); // /32 -> 1 usable (host route)
    expect(prefixForHosts(2)).toBe(31); // /31 -> 2 usable (RFC 3021)
    expect(prefixForHosts(3)).toBe(29); // /30 -> 2 usable (<3); /29 -> 6
    expect(prefixForHosts(50)).toBe(26); // /26 -> 62 usable
    expect(prefixForHosts(254)).toBe(24);
  });

  it('rejects non-positive requirements', () => {
    expect(() => prefixForHosts(0)).toThrow(EngineError);
    expect(() => prefixForHosts(-5)).toThrow(EngineError);
  });

  it('rejects requirements larger than the whole address space', () => {
    expect(() => prefixForHosts(2 ** 32)).toThrow(EngineError);
  });
});

describe('vlsmAllocate', () => {
  it('allocates smallest-fitting subnets in descending host order', () => {
    const out = vlsmAllocate('192.168.1.0', 24, [50, 25, 10]);
    expect(out).toHaveLength(3);
    // 50 hosts -> /26 (62 usable), 25 -> /27 (30 usable), 10 -> /28 (14 usable)
    expect(out[0].prefix).toBe(26);
    expect(out[0].network).toBe('192.168.1.0');
    expect(out[1].prefix).toBe(27);
    expect(out[1].network).toBe('192.168.1.64');
    expect(out[2].prefix).toBe(28);
    expect(out[2].network).toBe('192.168.1.96');
  });

  it('throws when requests do not fit', () => {
    expect(() => vlsmAllocate('192.168.1.0', 24, [200, 200])).toThrow(EngineError);
  });

  it('rejects non-positive host requests', () => {
    expect(() => vlsmAllocate('192.168.1.0', 24, [0])).toThrow(EngineError);
  });

  it('rejects an empty or non-array request list', () => {
    expect(() => vlsmAllocate('192.168.1.0', 24, [])).toThrow(EngineError);
    // @ts-expect-error exercising the runtime guard
    expect(() => vlsmAllocate('192.168.1.0', 24, null)).toThrow(EngineError);
  });
});

describe('supernet', () => {
  it('aggregates contiguous networks into the smallest covering prefix', () => {
    const agg = supernet([
      { addr: '192.168.0.0', prefix: 24 },
      { addr: '192.168.1.0', prefix: 24 },
    ]);
    expect(agg.addr).toBe('192.168.0.0');
    expect(agg.prefix).toBe(23);
  });

  it('aggregates four /24s into a /22', () => {
    const agg = supernet([
      { addr: '10.0.0.0', prefix: 24 },
      { addr: '10.0.1.0', prefix: 24 },
      { addr: '10.0.2.0', prefix: 24 },
      { addr: '10.0.3.0', prefix: 24 },
    ]);
    expect(agg.addr).toBe('10.0.0.0');
    expect(agg.prefix).toBe(22);
  });

  it('aggregates /31 links (broadcast is null) into a /30', () => {
    const agg = supernet([
      { addr: '10.0.0.0', prefix: 31 },
      { addr: '10.0.0.2', prefix: 31 },
    ]);
    expect(agg.addr).toBe('10.0.0.0');
    expect(agg.prefix).toBe(30);
  });

  it('returns a /32 when given a single host route', () => {
    const agg = supernet([{ addr: '10.0.0.5', prefix: 32 }]);
    expect(agg.addr).toBe('10.0.0.5');
    expect(agg.prefix).toBe(32);
  });

  it('rejects an empty list', () => {
    expect(() => supernet([])).toThrow(EngineError);
  });
});
