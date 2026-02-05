import type { Felt252Type } from '../../primitives/Felt252/types.js';
import type { PoseidonHash } from './types.js';

let nativeLib: typeof import('../../native/index.js') | null = null;

async function ensureLoaded(): Promise<typeof import('../../native/index.js')> {
  if (!nativeLib) {
    const loader = await import('../../native/index.js');
    if (!loader.isNativeAvailable()) {
      throw new Error('Native library not available');
    }
    nativeLib = loader;
  }
  return nativeLib;
}

export async function hash(a: Felt252Type, b: Felt252Type): Promise<PoseidonHash> {
  const lib = await ensureLoaded();
  return lib.poseidonHash(a, b);
}

export async function hashMany(values: Felt252Type[]): Promise<PoseidonHash> {
  const lib = await ensureLoaded();
  return lib.poseidonHashMany(values);
}

export function hashSync(a: Felt252Type, b: Felt252Type): PoseidonHash {
  if (!nativeLib) throw new Error('Native library not loaded - call ensureLoaded() first');
  return nativeLib.poseidonHash(a, b);
}

export function hashManySync(values: Felt252Type[]): PoseidonHash {
  if (!nativeLib) throw new Error('Native library not loaded - call ensureLoaded() first');
  return nativeLib.poseidonHashMany(values);
}

export { ensureLoaded };
