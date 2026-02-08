import * as Schema from "effect/Schema";
import {
  stateDiffFromRpc,
  stateDiffToRpc,
  stateUpdateFromRpc,
  stateUpdateToRpc,
  type StateDiffType,
  type StateUpdateType,
} from "@kundera-sn/kundera-ts";
import { isArrayOf, isFelt252, isObject } from "./_predicates.js";
import { rpcTransform } from "./_rpcSchema.js";

type RpcStateDiff = Parameters<typeof stateDiffFromRpc>[0];
type RpcStateUpdate = Parameters<typeof stateUpdateFromRpc>[0];

const isStateDiff = (value: unknown): value is StateDiffType =>
  isObject(value) &&
  isArrayOf(
    value.storage_diffs,
    (entry) =>
      isObject(entry) &&
      isFelt252(entry.address) &&
      isArrayOf(
        entry.storage_entries,
        (storageEntry) =>
          isObject(storageEntry) &&
          isFelt252(storageEntry.key) &&
          isFelt252(storageEntry.value),
      ),
  ) &&
  isArrayOf(
    value.declared_classes,
    (entry) =>
      isObject(entry) &&
      isFelt252(entry.class_hash) &&
      isFelt252(entry.compiled_class_hash),
  ) &&
  isArrayOf(
    value.deployed_contracts,
    (entry) =>
      isObject(entry) &&
      isFelt252(entry.address) &&
      isFelt252(entry.class_hash),
  ) &&
  isArrayOf(
    value.replaced_classes,
    (entry) =>
      isObject(entry) &&
      isFelt252(entry.contract_address) &&
      isFelt252(entry.class_hash),
  ) &&
  isArrayOf(
    value.nonces,
    (entry) =>
      isObject(entry) &&
      isFelt252(entry.contract_address) &&
      isFelt252(entry.nonce),
  );

const StateDiffTypeSchema = Schema.declare<StateDiffType>(isStateDiff, {
  identifier: "StateDiff",
});

const StateUpdateTypeSchema = Schema.declare<StateUpdateType>(
  (value): value is StateUpdateType =>
    isObject(value) &&
    isFelt252(value.block_hash) &&
    isFelt252(value.old_root) &&
    isFelt252(value.new_root) &&
    isStateDiff(value.state_diff),
  { identifier: "StateUpdate" },
);

export const StateDiffRpc: Schema.Schema<StateDiffType, RpcStateDiff> = rpcTransform(
  StateDiffTypeSchema,
  stateDiffFromRpc,
  stateDiffToRpc,
  {
    identifier: "Kundera.StateDiff.Rpc",
    title: "Starknet State Diff",
    description: "State diff decoded from Starknet RPC wire data.",
    errorMessage: "Invalid Starknet state-diff RPC value",
  },
);

export const Rpc: Schema.Schema<StateUpdateType, RpcStateUpdate> = rpcTransform(
  StateUpdateTypeSchema,
  stateUpdateFromRpc,
  stateUpdateToRpc,
  {
    identifier: "Kundera.StateUpdate.Rpc",
    title: "Starknet State Update",
    description: "State update decoded from Starknet RPC wire data.",
    errorMessage: "Invalid Starknet state-update RPC value",
  },
);
