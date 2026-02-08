import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import * as Schema from "effect/Schema";

import * as Primitives from "../index.js";

const baseHeader = {
  block_hash: "0x03fa",
  parent_hash: "0x03fb",
  block_number: 123,
  new_root: "0x0abc",
  timestamp: 1_700_000_000,
  sequencer_address: "0x01",
  l1_gas_price: { price_in_fri: "0x0a", price_in_wei: "0x0b" },
  l2_gas_price: { price_in_fri: "0x0c", price_in_wei: "0x0d" },
  l1_data_gas_price: { price_in_fri: "0x0e", price_in_wei: "0x0f" },
  l1_da_mode: "BLOB" as const,
  starknet_version: "0.13.0",
};

describe("primitives schema", () => {
  it.effect("decodes a contract address from hex", () =>
    Effect.gen(function* () {
      const value = yield* Schema.decodeUnknown(Primitives.ContractAddress.Hex)(
        "0x123",
      );

      expect(value.toHex()).toMatch(/^0x[0-9a-f]+$/);
    }),
  );

  it.effect("fails invalid contract address with parse error", () =>
    Effect.gen(function* () {
      const parseError = yield* Schema.decodeUnknown(
        Primitives.ContractAddress.Hex,
      )("not-a-hex-address").pipe(Effect.flip);

      const message = Primitives.formatParseErrorTree(parseError);
      expect(message.length).toBeGreaterThan(0);
    }),
  );

  it.effect("decodes a felt from helper", () =>
    Effect.gen(function* () {
      const felt = yield* Primitives.decodeFelt252("0xabc");
      expect(felt.toHex()).toMatch(/^0x[0-9a-f]+$/);
    }),
  );

  it.effect("decodes and re-encodes block header RPC", () =>
    Effect.gen(function* () {
      const decoded = yield* Schema.decodeUnknown(Primitives.BlockHeader.Rpc)(baseHeader);
      const encoded = Schema.encodeSync(Primitives.BlockHeader.Rpc)(decoded);

      expect(decoded.block_number).toBe(123);
      expect(decoded.block_hash.toHex()).toMatch(/^0x[0-9a-f]+$/);
      expect(encoded.block_number).toBe(123);
      expect(encoded.block_hash).toMatch(/^0x[0-9a-f]+$/);
    }),
  );

  it.effect("decodes transaction and transaction-with-hash RPC", () =>
    Effect.gen(function* () {
      const txRpc = {
        type: "INVOKE" as const,
        version: "0x1" as const,
        sender_address: "0x01",
        calldata: ["0x10"],
        max_fee: "0xff",
        signature: ["0xaa"],
        nonce: "0x05",
      };
      const txWithHashRpc = { ...txRpc, transaction_hash: "0xdead" };

      const tx = yield* Schema.decodeUnknown(Primitives.Transaction.Rpc)(txRpc);
      const txWithHash = yield* Schema.decodeUnknown(Primitives.Transaction.WithHashRpc)(
        txWithHashRpc,
      );

      expect(tx.type).toBe("INVOKE");
      expect(txWithHash.type).toBe("INVOKE");
      expect(txWithHash.transaction_hash.toHex()).toMatch(/^0x[0-9a-f]+$/);
    }),
  );

  it.effect("decodes receipt/event/state update/fee estimate/trace helpers", () =>
    Effect.gen(function* () {
      const receiptRpc = {
        type: "INVOKE" as const,
        transaction_hash: "0xdead",
        actual_fee: { amount: "0x100", unit: "WEI" as const },
        finality_status: "ACCEPTED_ON_L2" as const,
        messages_sent: [],
        events: [{ from_address: "0x01", keys: ["0x02"], data: ["0x03"] }],
        execution_resources: { steps: 100 },
        execution_status: "SUCCEEDED" as const,
      };

      const emittedEventRpc = {
        from_address: "0x01",
        keys: ["0x02"],
        data: ["0x03"],
        block_hash: "0x0b0",
        block_number: 99,
        transaction_hash: "0x0a0",
      };

      const stateUpdateRpc = {
        block_hash: "0xb1",
        old_root: "0xa1",
        new_root: "0xa2",
        state_diff: {
          storage_diffs: [
            { address: "0x01", storage_entries: [{ key: "0x10", value: "0x20" }] },
          ],
          declared_classes: [{ class_hash: "0xc1", compiled_class_hash: "0xc2" }],
          deployed_contracts: [{ address: "0x02", class_hash: "0xd1" }],
          replaced_classes: [{ contract_address: "0x03", class_hash: "0xe1" }],
          nonces: [{ contract_address: "0x04", nonce: "0x05" }],
        },
      };

      const feeEstimateRpc = {
        l1_gas_consumed: "0x100",
        l1_gas_price: "0x200",
        l2_gas_consumed: "0x300",
        l2_gas_price: "0x400",
        l1_data_gas_consumed: "0x500",
        l1_data_gas_price: "0x600",
        overall_fee: "0x700",
        unit: "FRI" as const,
      };

      const traceRpc = {
        type: "INVOKE" as const,
        execute_invocation: {
          contract_address: "0x01",
          entry_point_selector: "0x02",
          calldata: ["0x03"],
          caller_address: "0x04",
          class_hash: "0x05",
          entry_point_type: "EXTERNAL" as const,
          call_type: "CALL" as const,
          result: ["0x06"],
          calls: [],
          events: [{ order: 0, keys: ["0x07"], data: ["0x08"] }],
          messages: [],
          execution_resources: { l1_gas: 10, l2_gas: 20 },
        },
        execution_resources: { steps: 100 },
      };

      const receipt = yield* Primitives.decodeReceipt(receiptRpc);
      const event = yield* Primitives.decodeEmittedEvent(emittedEventRpc);
      const state = yield* Primitives.decodeStateUpdate(stateUpdateRpc);
      const fee = yield* Primitives.decodeFeeEstimate(feeEstimateRpc);
      const trace = yield* Primitives.decodeTransactionTrace(traceRpc);

      expect(receipt.transaction_hash.toHex()).toMatch(/^0x[0-9a-f]+$/);
      expect(event.block_number).toBe(99);
      expect(state.state_diff.storage_diffs.length).toBe(1);
      expect(fee.unit).toBe("FRI");
      expect(trace.type).toBe("INVOKE");
    }),
  );

  it.effect("sync decode helpers work for domain schemas", () =>
    Effect.gen(function* () {
      const blockWithHashesRpc = {
        ...baseHeader,
        event_commitment: "0x0e1",
        transaction_commitment: "0x0a1",
        receipt_commitment: "0x0b1",
        state_diff_commitment: "0x0c1",
        event_count: 10,
        transaction_count: 5,
        state_diff_length: 20,
        status: "ACCEPTED_ON_L2" as const,
        transactions: ["0xaa", "0xbb"],
      };

      const decoded = Primitives.decodeBlockWithTxHashesSync(blockWithHashesRpc);
      expect(decoded.transactions.length).toBe(2);
      expect(decoded.transactions[0]?.toHex()).toMatch(/^0x[0-9a-f]+$/);
    }),
  );

  it.effect("domain schema surfaces parse errors on invalid RPC payload", () =>
    Effect.gen(function* () {
      const parseError = yield* Schema.decodeUnknown(
        Primitives.BlockHeader.Rpc,
      )({
        ...baseHeader,
        block_hash: "not-hex",
      }).pipe(Effect.flip);

      const message = Primitives.formatParseErrorTree(parseError);
      expect(message).toContain("Invalid");
    }),
  );
});
