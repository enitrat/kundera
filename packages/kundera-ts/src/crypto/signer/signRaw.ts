/**
 * Sign Raw
 *
 * Sign a raw message hash with a private key.
 */

import { Felt252, type Felt252Input } from '../../primitives/index.js';
import { sign as signPrimitive, type Signature } from '../ecdsa.js';

/**
 * Sign a raw message hash with a private key.
 */
export function signRaw(privateKey: Felt252Input, hash: Felt252Input): Signature {
  return signPrimitive(Felt252(privateKey), Felt252(hash));
}
