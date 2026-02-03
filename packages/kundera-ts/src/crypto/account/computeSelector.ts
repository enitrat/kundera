/**
 * Compute Selector
 *
 * Entry point selector computation from function name.
 */

import { Felt252, type Felt252Type } from '../../primitives/index.js';
import { snKeccak } from '../hash.js';
import { KNOWN_SELECTORS } from './constants.js';

/**
 * Compute entry point selector from function name
 * selector = starknet_keccak(name) mod 2^250
 *
 * For P0, uses precomputed values for known selectors.
 * Custom selectors require snKeccak implementation (P1).
 *
 * @param name - Function name (e.g., "transfer", "__execute__")
 * @returns Selector as Felt252
 * @throws Error if selector not in KNOWN_SELECTORS and snKeccak not implemented
 */
export function computeSelector(name: string): Felt252Type {
  const known = KNOWN_SELECTORS[name];
  if (known) {
    return Felt252(known);
  }

  // Try snKeccak - will throw if not implemented
  try {
    const encoder = new TextEncoder();
    const nameBytes = encoder.encode(name);
    return snKeccak(nameBytes);
  } catch (e) {
    throw new Error(
      `Unknown selector for "${name}". ` +
        `Either add to KNOWN_SELECTORS or implement snKeccak. ` +
        `Original error: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

/**
 * Standard selectors (precomputed)
 */
export const EXECUTE_SELECTOR = Felt252(KNOWN_SELECTORS['__execute__']!);
