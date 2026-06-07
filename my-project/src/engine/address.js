/**
 * Pure IPv4 address and mask helpers. All math is on unsigned 32-bit integers;
 * dotted-decimal and CIDR are presentation/parse concerns at the boundary.
 * @module engine/address
 */
import { EngineError, ADDRESS_BITS, MAX_UINT32, MAX_OCTET, OCTET_COUNT } from './errors.js';

/**
 * Parse a dotted-decimal IPv4 string into an unsigned 32-bit integer.
 * Leading zeros are treated as decimal (not octal). Throws on anything invalid.
 * @param {string} s
 * @returns {number} uint32
 */
export function parseAddress(s) {
  if (typeof s !== 'string') throw new EngineError('Address must be a string');
  const parts = s.split('.');
  if (parts.length !== OCTET_COUNT) {
    throw new EngineError(`Address must have ${OCTET_COUNT} octets: "${s}"`);
  }
  let value = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) throw new EngineError(`Octet is not a number: "${part}"`);
    const octet = Number(part);
    if (octet > MAX_OCTET) throw new EngineError(`Octet out of range (0-${MAX_OCTET}): ${octet}`);
    value = (value << 8) | octet;
  }
  return value >>> 0;
}

/**
 * Format an unsigned 32-bit integer as a dotted-decimal IPv4 string.
 * @param {number} n uint32
 * @returns {string}
 */
export function formatAddress(n) {
  if (!Number.isInteger(n) || n < 0 || n > MAX_UINT32) {
    throw new EngineError(`Address value out of range: ${n}`);
  }
  return [
    (n >>> 24) & MAX_OCTET,
    (n >>> 16) & MAX_OCTET,
    (n >>> 8) & MAX_OCTET,
    n & MAX_OCTET,
  ].join('.');
}

/**
 * Validate that a prefix length is an integer in [0, 32].
 * @param {number} prefix
 * @returns {number} the same prefix
 */
export function assertPrefix(prefix) {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > ADDRESS_BITS) {
    throw new EngineError(`Prefix must be an integer in [0, ${ADDRESS_BITS}]: ${prefix}`);
  }
  return prefix;
}

/**
 * Build the uint32 netmask for a prefix length.
 * @param {number} prefix
 * @returns {number} uint32 mask
 */
export function prefixToMaskInt(prefix) {
  assertPrefix(prefix);
  if (prefix === 0) return 0;
  return (MAX_UINT32 << (ADDRESS_BITS - prefix)) >>> 0;
}

/**
 * Convert a prefix length to a dotted-decimal mask.
 * @param {number} prefix
 * @returns {string}
 */
export function prefixToMask(prefix) {
  return formatAddress(prefixToMaskInt(prefix));
}

/**
 * Convert a dotted-decimal mask to a prefix length. Rejects non-contiguous masks.
 * @param {string} mask
 * @returns {number} prefix in [0, 32]
 */
export function maskToPrefix(mask) {
  const value = parseAddress(mask);
  // A valid mask is a run of 1s followed by a run of 0s. Its bitwise NOT + 1
  // (two's complement of the host portion) must be a power of two, or zero.
  const inverted = ~value >>> 0;
  if (((inverted + 1) & inverted) !== 0) {
    throw new EngineError(`Mask is not contiguous: "${mask}"`);
  }
  let prefix = 0;
  let v = value;
  while (v & 0x80000000) {
    prefix += 1;
    v = (v << 1) >>> 0;
  }
  return prefix;
}

/**
 * @typedef {'address'|'mask'|'count'|'range'} AnswerKind
 */

/**
 * True if two string representations denote the same value of the given kind.
 * Never throws — returns false on anything it cannot interpret.
 * @param {string} a
 * @param {string} b
 * @param {AnswerKind} kind
 * @returns {boolean}
 */
export function equivalent(a, b, kind) {
  try {
    switch (kind) {
      case 'address':
        return parseAddress(normalizeAddressText(a)) === parseAddress(normalizeAddressText(b));
      case 'mask':
        return normalizeMaskToPrefix(a) === normalizeMaskToPrefix(b);
      case 'count':
        return normalizeCount(a) === normalizeCount(b);
      case 'range':
        return normalizeRange(a) === normalizeRange(b);
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Normalize a mask written as a CIDR prefix ("/24" or "24") or a dotted mask
 * into a numeric prefix for comparison.
 * @param {string} text
 * @returns {number}
 */
function normalizeMaskToPrefix(text) {
  const trimmed = text.trim();
  const cidr = trimmed.replace(/^\//, '');
  if (/^\d+$/.test(cidr)) return assertPrefix(Number(cidr));
  return maskToPrefix(trimmed);
}

/** @param {string} text */
function normalizeAddressText(text) {
  return text.trim();
}

/** @param {string} text */
function normalizeCount(text) {
  const n = Number(text.trim());
  if (!Number.isInteger(n)) throw new EngineError(`Not an integer count: "${text}"`);
  return n;
}

/** @param {string} text Range like "10.0.0.1 - 10.0.0.254" */
function normalizeRange(text) {
  const [lo, hi] = text.split('-').map((s) => parseAddress(s.trim()));
  return `${lo}-${hi}`;
}
