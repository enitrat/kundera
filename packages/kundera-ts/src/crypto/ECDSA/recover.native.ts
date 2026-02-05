import type { Felt252Type } from '../../primitives/Felt252/types.js';

type NativeLib = {
  recover: (messageHash: Felt252Type, r: Felt252Type, s: Felt252Type, v: Felt252Type) => Felt252Type;
};

let nativeLib: NativeLib | null = null;

/**
 * Ensure native library is loaded.
 * Must be called before using recoverSync.
 */
export async function ensureLoaded(): Promise<NativeLib> {
  if (!nativeLib) {
    const native = await import('../../native/index.js');
    nativeLib = {
      recover: native.recover,
    };
  }
  return nativeLib;
}

/**
 * Recover public key from signature (async, loads native if needed)
 */
export async function recover(
  messageHash: Felt252Type,
  r: Felt252Type,
  s: Felt252Type,
  v: Felt252Type
): Promise<Felt252Type> {
  const lib = await ensureLoaded();
  return lib.recover(messageHash, r, s, v);
}

/**
 * Recover public key (sync, requires ensureLoaded() first)
 * @throws Error if native library not loaded
 */
export function recoverSync(
  messageHash: Felt252Type,
  r: Felt252Type,
  s: Felt252Type,
  v: Felt252Type
): Felt252Type {
  if (!nativeLib) {
    throw new Error('Native library not loaded - call ensureLoaded() first');
  }
  return nativeLib.recover(messageHash, r, s, v);
}

/**
 * Check if native library is loaded
 */
export function isLoaded(): boolean {
  return nativeLib !== null;
}
