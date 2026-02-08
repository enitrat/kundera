/**
 * Shared runtime type guards for domain primitive Schema.declare validators.
 *
 * These are used by the "to" side of transformOrFail schemas to structurally
 * validate decoded domain objects. They are NOT the primary validation layer —
 * that role belongs to the kundera-ts fromRpc() converters.
 *
 * @internal
 */

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Checks for branded 32-byte Uint8Array (Felt252, ContractAddress, ClassHash are all this at runtime). */
export const isFelt252 = (value: unknown): value is Uint8Array =>
  value instanceof Uint8Array && value.length === 32;

export const isArrayOf = <T>(
  value: unknown,
  guard: (item: unknown) => boolean,
): value is readonly T[] => Array.isArray(value) && value.every(guard);

export const hasStringType = (value: unknown): value is { readonly type: string } =>
  isObject(value) && typeof value.type === "string";
