import type {
  ClassHashType,
  ContractAddressType,
  Felt252Type,
  StorageKeyType,
} from "@kundera-sn/kundera-ts";

/**
 * Dual-input types for consumer APIs that accept both branded primitives
 * and raw hex strings. Use these as parameter types in public-facing
 * functions so callers don't need to Schema-decode before every call.
 */
export type ContractAddressInput = ContractAddressType | string;
export type StorageKeyInput = StorageKeyType | string;
export type Felt252Input = Felt252Type | string;
export type ClassHashInput = ClassHashType | string;
