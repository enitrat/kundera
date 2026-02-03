# @kundera-sn/kundera-effect Type Errors Report

**Generated**: 2026-02-02
**Status**: ❌ BLOCKING - Package cannot build
**Affected Release**: v0.0.2

## Executive Summary

The `@kundera-sn/kundera-effect` package has **121+ type errors** preventing compilation. The errors stem from missing exports in the main `@kundera-sn/kundera-ts` package that `@kundera-sn/kundera-effect` depends on.

**Root Cause**: `@kundera-sn/kundera-effect` was developed against a different/incomplete version of the main package API. Many types and functions it expects are either:
1. Not implemented in `@kundera-sn/kundera-ts`
2. Implemented but not exported
3. Named differently

## Error Breakdown by Module

### 1. ABI Module (`@kundera-sn/kundera-ts/abi`)

#### ✅ FOUND - Correctly exported in @kundera-sn/kundera-ts
The following ARE exported from `src/abi/index.ts`:
- `CompiledSierra`
- `CompiledSierraCasm`
- `SierraEntryPoint`
- `SierraEntryPoints`
- `CasmEntryPoint`
- `CasmEntryPoints`
- `AbiArtifact`
- `classHashFromSierra`
- `compiledClassHashFromCasm`
- `extractAbi`

#### ⚠️ ISSUE
Despite being exported, TypeScript cannot find them. This suggests:
- Build issue (types not generated)
- Export path issue in package.json
- Module resolution issue

### 2. Crypto Module (`@kundera-sn/kundera-ts/crypto`)

#### ❌ MISSING - Expected but not found (40+ exports)

**Transaction Hashing Functions:**
- `hashTipAndResourceBounds`
- `encodeDAModes`
- `hashCalldata`
- `computeInvokeV3Hash`
- `computeDeclareV3Hash`
- `computeDeployAccountV3Hash`
- `computeContractAddress`
- `computeSelector`

**Signing Functions:**
- `signRaw`
- `signTypedData`
- `hashTypedData`
- `signatureToArray`

**Constants:**
- `TRANSACTION_VERSION`
- `DEFAULT_RESOURCE_BOUNDS`
- `TRANSACTION_HASH_PREFIX`
- `EXECUTE_SELECTOR`

**Transaction Types (V3):**
- `ResourceBounds`
- `ResourceBoundsMapping`
- `DataAvailabilityMode`
- `V3TransactionCommon`
- `InvokeTransactionV3`
- `SignedInvokeTransactionV3`
- `DeclareTransactionV3`
- `SignedDeclareTransactionV3`
- `DeployAccountTransactionV3`
- `SignedDeployAccountTransactionV3`

**Transaction Payload Types:**
- `Call`
- `UniversalDetails`
- `DeclarePayload`
- `DeployAccountPayload`
- `ExecuteResult`
- `DeclareResult`
- `DeployAccountResult`

**Typed Data Types:**
- `TypedDataDomain`
- `TypedDataType`
- `TypedData`
- `SignatureArray`

**Status**: Main `@kundera-sn/kundera-ts/crypto` only exports basic hash/sign functions (Pedersen, Poseidon, ECDSA). Transaction-related crypto is NOT implemented.

### 3. RPC Module (`@kundera-sn/kundera-ts/jsonrpc`)

#### ❌ MISSING - Expected but not found (50+ exports)

**Block Types:**
- `BlockStatus`
- `BlockHeaderWithCommitments`
- `BlockWithTxHashes`
- `PreConfirmedBlockWithTxHashes`
- `BlockWithTxs`
- `PreConfirmedBlockWithTxs`
- `BlockWithReceipts`
- `PreConfirmedBlockWithReceipts`
- `BlockTransactionTrace`

**State Types:**
- `StateUpdate`
- `PreConfirmedStateUpdate`
- `StorageProof`
- `ContractStorageDiffItem`
- `DeployedContractItem`
- `DeclaredClassItem`
- `ReplacedClassItem`
- `NonceUpdateItem`

**Transaction Types:**
- `SimulationFlag`
- `FeeEstimate` (declared but not exported)
- `MessageFeeEstimate`
- `TransactionTrace`
- `SimulatedTransaction`
- `BroadcastedTxn` (declared but not exported)
- `BroadcastedInvokeTxn`
- `BroadcastedDeclareTxn`
- `BroadcastedDeployAccountTxn`

**Transaction Results:**
- `AddInvokeTransactionResult`
- `AddDeclareTransactionResult`
- `AddDeployAccountTransactionResult`

**Events:**
- `EventsResponse`
- `EmittedEvent` (declared but not exported)
- `EventsFilter`
- `BlockHashAndNumber`

**WebSocket Types:**
- `NewHead`
- `PendingTransaction`
- `TransactionStatusUpdate` (should be `TransactionStatus`)
- `WsTransactionReceipt`
- `ReorgData`
- `WsNotificationPayload`
- `EventsSubscriptionParams`
- `NewHeadsSubscriptionParams`
- `PendingTransactionsSubscriptionParams`
- `TransactionReceiptsSubscriptionParams`

**Messages:**
- `MsgFromL1`
- `MessagesStatusResponse`
- `MessageStatus`

**Sync:**
- `SyncingStatus`

**Finality:**
- `TxnFinalityStatusWithoutL1`
- `ReceiptFinalityStatus`

**RPC Errors:**
- `StarknetRpcErrorCode`

**Status**: Main RPC module exists but many types are declared internally and not exported.

### 4. Transport Module (`@kundera-sn/kundera-ts/transport`)

#### ❌ COMPLETELY MISSING

**Error**: `Cannot find module '@kundera-sn/kundera-ts/transport'`

The transport module doesn't exist or isn't properly exported in the main package's `package.json` exports.

### 5. Primitives Module (`@kundera-sn/kundera-ts`)

#### ❌ MISSING

**EthAddress Related:**
- `EthAddress` (exists as `Address` but wrong name)
- `EthAddressType`
- `MAX_ETH_ADDRESS`

**Status**: EthAddress functionality exists but with different naming.

### 6. Native/WASM Modules

#### ❌ MISSING

**Constants:**
- `MAX_ADDRESS`
- `MAX_ETH_ADDRESS`

**Types:**
- `EthAddress` (should be `Address`)
- `EthAddressType`

## Additional Issues

### Signature Mismatches

Even for functions that exist, signatures have changed:

**@kundera-sn/kundera-effect expects:**
```typescript
encodeCalldata(abi, functionName, args): Result<Felt252[], AbiError>
```

**@kundera-sn/kundera-ts provides:**
```typescript
encodeCalldata(abi, functionName, args, resultType?): Result<...>
```

Extra parameter `resultType` breaks compatibility.

### Declaration vs Export Issues

Some types are **declared** in @kundera-sn/kundera-ts but not **exported**:
- `FeeEstimate` (line 197)
- `EmittedEvent` (line 203)
- `TxnWithHash` (line 205)
- `TxnReceiptWithBlockInfo` (line 206)
- `BroadcastedTxn` (line 209)

## Impact Assessment

### Build Status
- ❌ Type check: **FAILS** (121 errors)
- ❌ Tests: **CANNOT RUN** (won't compile)
- ❌ npm publish: **WILL FAIL**

### Affected Modules in @kundera-sn/kundera-effect
- ❌ `src/abi/index.ts` - 10+ errors
- ❌ `src/crypto/index.ts` - 40+ errors
- ❌ `src/jsonrpc/index.ts` - 50+ errors
- ❌ `src/transport/index.ts` - 2 errors (module not found)
- ❌ `src/primitives/*/index.ts` - 10+ errors
- ❌ `src/native/index.ts` - 5+ errors
- ❌ `src/wasm/index.ts` - 5+ errors
- ❌ `src/serde/index.ts` - 3 errors

### Release Status
- **v0.0.1**: ❌ Failed (expected - had wrong package name)
- **v0.0.2**: ⏳ Running but **WILL FAIL** with these errors

## Recommendations

### Option 1: Fix Main Package (Complete the API)
**Effort**: HIGH
**Impact**: HIGH

1. Implement missing crypto functions (transaction hashing, signing)
2. Export all RPC types properly
3. Implement transport module
4. Fix EthAddress naming inconsistency
5. Add missing constants

**Pros**: @kundera-sn/kundera-ts becomes feature-complete
**Cons**: Significant development work required

### Option 2: Fix Effect Package (Reduce Dependencies)
**Effort**: MEDIUM
**Impact**: MEDIUM

1. Remove imports of unimplemented features
2. Update function signatures to match actual API
3. Mark incomplete features as TODO
4. Add stub implementations

**Pros**: Can release sooner
**Cons**: Reduced functionality, technical debt

### Option 3: Stub Missing Exports (Quick Fix)
**Effort**: LOW
**Impact**: LOW

1. Add stub exports to main package for missing types
2. Throw "not implemented" errors at runtime
3. Document what's incomplete

**Pros**: Builds and publishes
**Cons**: Runtime failures, poor user experience

### Option 4: Version Alignment Strategy
**Effort**: LOW
**Impact**: MEDIUM

1. Accept that @kundera-sn/kundera-effect is for a future version
2. Keep it in the repo but don't publish yet
3. Focus on completing @kundera-sn/kundera-ts first
4. Publish @kundera-sn/kundera-effect when main package is ready

**Pros**: No rushed/incomplete releases
**Cons**: Effect integration delayed

## Recommended Action Plan

**Short Term (Immediate)**:
1. ❌ Cancel/delete v0.0.2 release (will fail anyway)
2. 📝 Document that @kundera-sn/kundera-effect is WIP
3. ✅ Focus on @kundera-sn/kundera-ts stability

**Medium Term (1-2 weeks)**:
1. Complete missing crypto functions in @kundera-sn/kundera-ts
2. Export all RPC types properly
3. Implement transport module
4. Fix naming inconsistencies

**Long Term**:
1. Sync @kundera-sn/kundera-effect with completed API
2. Add integration tests between packages
3. Release both when stable

## Questions for Maintainer

1. **Is transaction crypto planned?** (V3 hashing, typed data signing)
2. **Is transport module implemented?** (Can't find the code)
3. **What's the EthAddress status?** (Address vs EthAddress naming)
4. **Should we publish incomplete Effect package?** (With stubs/warnings)

## Files to Review

**Main Package (`@kundera-sn/kundera-ts`):**
- `/src/crypto/index.ts` - Missing ~40 exports
- `/src/jsonrpc/index.ts` - Missing ~50 exports
- `/src/transport/index.ts` - Module missing or not exported
- `/src/primitives/index.ts` - EthAddress naming issue

**Effect Package (`@kundera-sn/kundera-effect`):**
- `/packages/kundera-effect/src/crypto/index.ts` - Update to match actual API
- `/packages/kundera-effect/src/jsonrpc/index.ts` - Update to match actual API
- `/packages/kundera-effect/src/transport/index.ts` - Depends on missing module

---

**Generated by**: Type check analysis
**Command**: `cd packages/kundera-effect && bun run typecheck`
**Total Errors**: 121+
**Blocking**: YES ❌
