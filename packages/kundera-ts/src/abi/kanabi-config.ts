import type { Felt252Type } from '../primitives/Felt252/types.js';
import type { ContractAddressType } from '../primitives/ContractAddress/types.js';
import type { ClassHashType } from '../primitives/ClassHash/types.js';

declare module 'abi-wan-kanabi' {
  export interface Config {
    FeltType: Felt252Type;
    AddressType: ContractAddressType;
    ClassHashType: ClassHashType;
    BigIntType: bigint;
    U256Type: bigint;
  }
}

export {};
