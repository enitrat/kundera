import type { Felt252Type } from '../primitives/Felt252/types.js';
import type { ContractAddressType } from '../primitives/ContractAddress/types.js';
import type { ClassHashType } from '../primitives/ClassHash/types.js';
import type { Uint8Type } from '../primitives/Uint8/types.js';
import type { Uint16Type } from '../primitives/Uint16/types.js';
import type { Uint32Type } from '../primitives/Uint32/types.js';
import type { Uint64Type } from '../primitives/Uint64/types.js';
import type { Uint128Type } from '../primitives/Uint128/types.js';
import type { Uint256Type } from '../primitives/Uint256/types.js';
import type { Int8Type } from '../primitives/Int8/types.js';
import type { Int16Type } from '../primitives/Int16/types.js';
import type { Int32Type } from '../primitives/Int32/types.js';
import type { Int64Type } from '../primitives/Int64/types.js';
import type { Int128Type } from '../primitives/Int128/types.js';

declare module 'abi-wan-kanabi' {
  export interface Config {
    FeltType: Felt252Type;
    AddressType: ContractAddressType;
    ClassHashType: ClassHashType;
    BigIntType: bigint;

    // Unsigned integer types
    U8Type: Uint8Type;
    U16Type: Uint16Type;
    U32Type: Uint32Type;
    U64Type: Uint64Type;
    U128Type: Uint128Type;
    U256Type: Uint256Type;

    // Signed integer types
    I8Type: Int8Type;
    I16Type: Int16Type;
    I32Type: Int32Type;
    I64Type: Int64Type;
    I128Type: Int128Type;
  }
}

export {};
