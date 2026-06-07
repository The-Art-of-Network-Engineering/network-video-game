/**
 * Public surface of the subnet engine — the single canonical source for all
 * subnet math, generation, and grading (Constitution Principle I). Pure; no DOM,
 * no game state, no I/O.
 * @module engine
 */
export { EngineError } from './errors.js';
export { parseAddress, formatAddress, prefixToMask, maskToPrefix, equivalent } from './address.js';
export {
  subnetInfo,
  usableHosts,
  totalAddresses,
  prefixForHosts,
  vlsmAllocate,
  supernet,
} from './subnet.js';
// Generation & grading are added in the US1 phase:
// export { generateChallenge, makeDistractors, grade, explain } from './generate.js';
