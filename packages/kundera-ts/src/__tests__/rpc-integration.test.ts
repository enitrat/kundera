/**
 * RPC Integration Tests (Recorded Fixtures)
 *
 * Tests the full pipeline: HttpProvider → Rpc.*Request() → HTTP (MSW) → response → fromRpc() → domain types
 * All fixtures are real mainnet responses recorded from Alchemy v0.10 (block 800000).
 * Every assertion uses exact values from the fixture data — no "toBeGreaterThan(0)" hand-waving.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Rpc } from "../jsonrpc/index.js";
import type {
	BlockWithReceipts,
	BlockWithTxHashes,
	BlockWithTxs,
	StateUpdate,
} from "../jsonrpc/types.js";
import { HttpProvider } from "../provider/HttpProvider.js";
import { mswServer } from "./setup-msw.js";

// Block primitives
import {
	blockWithReceiptsFromRpc,
	blockWithReceiptsToRpc,
	blockWithTxHashesFromRpc,
	blockWithTxHashesToRpc,
	blockWithTxsFromRpc,
	blockWithTxsToRpc,
} from "../primitives/Block/index.js";
import {
	blockHeaderFromRpc,
	blockHeaderToRpc,
	blockHeaderWithCommitmentsFromRpc,
	blockHeaderWithCommitmentsToRpc,
} from "../primitives/BlockHeader/index.js";

// Transaction primitives
import {
	transactionFromRpc,
	transactionToRpc,
} from "../primitives/Transaction/index.js";

// Receipt primitives
import {
	receiptWithBlockInfoFromRpc,
	receiptWithBlockInfoToRpc,
} from "../primitives/Receipt/index.js";

// Event primitives
import {
	emittedEventFromRpc,
	emittedEventToRpc,
} from "../primitives/Event/index.js";

// StateUpdate primitives
import {
	stateUpdateFromRpc,
	stateUpdateToRpc,
} from "../primitives/StateUpdate/index.js";

// FeeEstimate primitives
import {
	feeEstimateFromRpc,
	feeEstimateToRpc,
} from "../primitives/FeeEstimate/index.js";

// Trace primitives
import {
	transactionTraceFromRpc,
	transactionTraceToRpc,
} from "../primitives/Trace/index.js";

// --- Exact fixture values (block 800000, mainnet) ---
const BLOCK_HASH =
	"0x17614e0ede412d9cd2c3025810fc2655e333a0d11a11c4f04c64eb6bf89cd40";
const PARENT_HASH =
	"0x3b84748bdbf61d4172a8c1bb1d6676e156c8ccc8c22aa31319e1ed8f6f4ac69";
const NEW_ROOT =
	"0xcc0f0615c102a0e8cd4c74a7eba9db4d64cb03b4a1c34db2d1447d61258491";
const SEQUENCER_ADDRESS =
	"0x1176a1bd84444c89232ec27754698e5d2e7e1a7f1539f12027f28b23ec9f3d8";
const BLOCK_NUMBER = 800000;
const TIMESTAMP = 1728897868;
const STARKNET_VERSION = "0.13.2.1";
const TX_COUNT = 14;

const EVENT_COMMITMENT =
	"0x8b9cea69959ae77f7b2e97100609cdf8963680c01585f3abc9bafcd95fba2c";
const TRANSACTION_COMMITMENT =
	"0x4fa11dbb80890e4d0100b45ff91d28cbb177f59fe191aaa7037dce3a297df";
const RECEIPT_COMMITMENT =
	"0x13b1c61bb5bae59dd2fac2c5a5eb99cc3f0a1565c0327c1635445c916d2f6e2";
const STATE_DIFF_COMMITMENT =
	"0x5e09d524e3db4ad3bd7466d287d2a9e010582984efdd93e40dd83bd2cb835ae";

const INVOKE_TX_HASH =
	"0x44400b45a0d6aa7b74c466a6f39bdb5f6b542e1adf608bb8ea6700d1ffae9f3";
const INVOKE_SENDER =
	"0xbd15f2ccc720ec710b6065a8c48bab4ccdcff1887d819ee587d998e40cafcd";
const INVOKE_NONCE = "0xeb";

let provider: HttpProvider;

beforeAll(() => {
	mswServer.listen({ onUnhandledRequest: "error" });
	provider = new HttpProvider("http://localhost:9545/rpc/v0_10");
});

afterAll(() => {
	mswServer.close();
});

describe("RPC integration (recorded fixtures)", () => {
	// --- Smoke: scalar returns ---

	it("blockNumber returns exact fixture value", async () => {
		const result = await provider.request(Rpc.BlockNumberRequest());
		expect(result).toBe(6519198);
	});

	it("blockHashAndNumber returns exact fixture values", async () => {
		const result = await provider.request(Rpc.BlockHashAndNumberRequest());
		expect(result.block_hash).toBe(
			"0x332d2b1de37a1c79b18c2d3f8c8b33695d2d94d58d7f8ad50d379cc9d748307",
		);
		expect(result.block_number).toBe(6519198);
	});

	it("chainId returns SN_MAIN", async () => {
		const result = await provider.request(Rpc.ChainIdRequest());
		expect(result).toBe("0x534e5f4d41494e");
	});

	it("specVersion returns 0.10.0", async () => {
		const result = await provider.request(Rpc.SpecVersionRequest());
		expect(result).toBe("0.10.0");
	});

	// --- BlockHeader ---

	it("getBlockWithTxHashes → blockHeader fields match fixture exactly", async () => {
		const wire = await provider.request(
			Rpc.GetBlockWithTxHashesRequest({ block_hash: BLOCK_HASH }),
		);
		const w = wire as BlockWithTxHashes;

		// Base header via blockHeaderFromRpc
		const header = blockHeaderFromRpc(w);
		expect(header.block_hash.toBigInt()).toBe(BigInt(BLOCK_HASH));
		expect(header.parent_hash.toBigInt()).toBe(BigInt(PARENT_HASH));
		expect(header.block_number).toBe(BLOCK_NUMBER);
		expect(header.new_root.toBigInt()).toBe(BigInt(NEW_ROOT));
		expect(header.timestamp).toBe(TIMESTAMP);
		expect(header.sequencer_address.toBigInt()).toBe(BigInt(SEQUENCER_ADDRESS));
		expect(header.l1_da_mode).toBe("BLOB");
		expect(header.starknet_version).toBe(STARKNET_VERSION);
		expect(header.l1_gas_price.price_in_fri.toBigInt()).toBe(
			BigInt("0x3f4ff003e511"),
		);
		expect(header.l1_gas_price.price_in_wei.toBigInt()).toBe(
			BigInt("0x2d5576c55"),
		);
		expect(header.l1_data_gas_price.price_in_fri.toBigInt()).toBe(
			BigInt("0x1658"),
		);
		expect(header.l2_gas_price.price_in_fri.toBigInt()).toBe(BigInt("0x1"));

		// Round-trip
		const back = blockHeaderToRpc(header);
		expect(back.block_number).toBe(BLOCK_NUMBER);
		expect(back.timestamp).toBe(TIMESTAMP);
		expect(back.l1_da_mode).toBe("BLOB");
		expect(back.starknet_version).toBe(STARKNET_VERSION);
		expect(BigInt(back.block_hash)).toBe(BigInt(BLOCK_HASH));
		expect(BigInt(back.parent_hash)).toBe(BigInt(PARENT_HASH));
	});

	it("getBlockWithTxHashes → commitment fields are required and match fixture", async () => {
		const wire = await provider.request(
			Rpc.GetBlockWithTxHashesRequest({ block_hash: BLOCK_HASH }),
		);
		const w = wire as BlockWithTxHashes;

		const header = blockHeaderWithCommitmentsFromRpc(w);
		expect(header.event_commitment.toBigInt()).toBe(BigInt(EVENT_COMMITMENT));
		expect(header.transaction_commitment.toBigInt()).toBe(
			BigInt(TRANSACTION_COMMITMENT),
		);
		expect(header.receipt_commitment.toBigInt()).toBe(
			BigInt(RECEIPT_COMMITMENT),
		);
		expect(header.state_diff_commitment.toBigInt()).toBe(
			BigInt(STATE_DIFF_COMMITMENT),
		);
		expect(header.event_count).toBe(180);
		expect(header.transaction_count).toBe(TX_COUNT);
		expect(header.state_diff_length).toBe(171);

		// Round-trip
		const back = blockHeaderWithCommitmentsToRpc(header);
		expect(BigInt(back.event_commitment)).toBe(BigInt(EVENT_COMMITMENT));
		expect(BigInt(back.transaction_commitment)).toBe(
			BigInt(TRANSACTION_COMMITMENT),
		);
		expect(back.event_count).toBe(180);
		expect(back.transaction_count).toBe(TX_COUNT);
		expect(back.state_diff_length).toBe(171);
	});

	// --- Block with transactions ---

	it("getBlockWithTxHashes → block-level fields + tx hashes", async () => {
		const wire = await provider.request(
			Rpc.GetBlockWithTxHashesRequest({ block_hash: BLOCK_HASH }),
		);
		const block = blockWithTxHashesFromRpc(wire as BlockWithTxHashes);

		expect(block.block_number).toBe(BLOCK_NUMBER);
		expect(block.status).toBe("ACCEPTED_ON_L1");
		expect(block.transactions).toHaveLength(TX_COUNT);
		expect(block.transactions[0]?.toBigInt()).toBe(BigInt(INVOKE_TX_HASH));

		// Round-trip
		const back = blockWithTxHashesToRpc(block);
		expect(back.block_number).toBe(BLOCK_NUMBER);
		expect(back.status).toBe("ACCEPTED_ON_L1");
		expect(back.transactions).toHaveLength(TX_COUNT);
		const firstTxHash = back.transactions[0];
		expect(firstTxHash).toBeDefined();
		if (!firstTxHash) throw new Error("Expected first tx hash");
		expect(BigInt(firstTxHash)).toBe(BigInt(INVOKE_TX_HASH));
	});

	it("getBlockWithTxs → full transaction objects", async () => {
		const wire = await provider.request(
			Rpc.GetBlockWithTxsRequest({ block_hash: BLOCK_HASH }),
		);
		const block = blockWithTxsFromRpc(wire as BlockWithTxs);

		expect(block.block_number).toBe(BLOCK_NUMBER);
		expect(block.transactions).toHaveLength(TX_COUNT);

		const firstTx = block.transactions[0];
		expect(firstTx).toBeDefined();
		if (!firstTx) throw new Error("Expected first tx");
		expect(firstTx.type).toBe("INVOKE");
		expect(firstTx.transaction_hash.toBigInt()).toBe(BigInt(INVOKE_TX_HASH));
		if (firstTx.type === "INVOKE" && "sender_address" in firstTx) {
			expect(firstTx.sender_address.toBigInt()).toBe(BigInt(INVOKE_SENDER));
		}

		// Round-trip
		const back = blockWithTxsToRpc(block);
		expect(back.transactions).toHaveLength(TX_COUNT);
		expect(back.transactions[0]?.type).toBe("INVOKE");
		expect(BigInt(back.transactions[0]?.transaction_hash)).toBe(
			BigInt(INVOKE_TX_HASH),
		);
	});

	it("getBlockWithReceipts → receipt + event parsing", async () => {
		const wire = await provider.request(
			Rpc.GetBlockWithReceiptsRequest({ block_hash: BLOCK_HASH }),
		);
		const block = blockWithReceiptsFromRpc(wire as BlockWithReceipts);

		expect(block.block_number).toBe(BLOCK_NUMBER);
		expect(block.transactions).toHaveLength(TX_COUNT);

		const first = block.transactions[0];
		expect(first).toBeDefined();
		if (!first) throw new Error("Expected first block receipt");
		// In blockWithReceipts, type and transaction_hash are on receipt, not transaction
		expect(first.receipt.type).toBe("INVOKE");
		expect(first.receipt.execution_status).toBe("SUCCEEDED");
		expect(first.receipt.transaction_hash.toBigInt()).toBe(
			BigInt(INVOKE_TX_HASH),
		);
		expect(first.transaction.type).toBe("INVOKE");

		// Round-trip
		const back = blockWithReceiptsToRpc(block);
		expect(back.transactions).toHaveLength(TX_COUNT);
		expect(back.transactions[0]?.receipt.type).toBe("INVOKE");
	});

	// --- Transaction ---

	it("getTransactionByHash → exact INVOKE_V3 fields", async () => {
		const wire = await provider.request(
			Rpc.GetTransactionByHashRequest(INVOKE_TX_HASH),
		);
		const tx = transactionFromRpc(wire);

		expect(tx.type).toBe("INVOKE");
		expect(tx.transaction_hash.toBigInt()).toBe(BigInt(INVOKE_TX_HASH));
		if (tx.type === "INVOKE" && "sender_address" in tx) {
			expect(tx.sender_address.toBigInt()).toBe(BigInt(INVOKE_SENDER));
			expect(tx.version).toBe("0x3");
			expect(tx.nonce.toBigInt()).toBe(BigInt(INVOKE_NONCE));
			expect(tx.calldata).toHaveLength(36);
		}

		// Round-trip
		const back = transactionToRpc(tx);
		expect(back.type).toBe("INVOKE");
		expect(BigInt(back.transaction_hash)).toBe(BigInt(INVOKE_TX_HASH));
	});

	// --- Receipt ---

	it("getTransactionReceipt → exact receipt fields", async () => {
		const wire = await provider.request(
			Rpc.GetTransactionReceiptRequest(INVOKE_TX_HASH),
		);
		const receipt = receiptWithBlockInfoFromRpc(wire);

		expect(receipt.type).toBe("INVOKE");
		expect(receipt.execution_status).toBe("SUCCEEDED");
		expect(receipt.finality_status).toBe("ACCEPTED_ON_L1");
		expect(receipt.block_number).toBe(BLOCK_NUMBER);
		expect(receipt.block_hash?.toBigInt()).toBe(BigInt(BLOCK_HASH));
		expect(receipt.transaction_hash.toBigInt()).toBe(BigInt(INVOKE_TX_HASH));
		expect(receipt.actual_fee.amount.toBigInt()).toBe(
			BigInt("0x31b5c3733b8a59"),
		);
		expect(receipt.actual_fee.unit).toBe("FRI");
		expect(receipt.events).toHaveLength(9);

		// Round-trip
		const back = receiptWithBlockInfoToRpc(receipt);
		expect(back.block_number).toBe(BLOCK_NUMBER);
		expect(back.type).toBe("INVOKE");
		expect(BigInt(back.transaction_hash)).toBe(BigInt(INVOKE_TX_HASH));
	});

	// --- Events ---

	it("getEvents → exact emitted event fields", async () => {
		const wire = await provider.request(
			Rpc.GetEventsRequest({
				from_block: { block_number: BLOCK_NUMBER },
				to_block: { block_number: BLOCK_NUMBER },
				chunk_size: 10,
			}),
		);

		expect(wire.events).toHaveLength(10);
		expect(wire.continuation_token).toBe("800000-10");

		const firstWireEvent = wire.events[0];
		expect(firstWireEvent).toBeDefined();
		if (!firstWireEvent) throw new Error("Expected first wire event");
		const event = emittedEventFromRpc(firstWireEvent);
		expect(event.block_number).toBe(BLOCK_NUMBER);
		expect(event.block_hash.toBigInt()).toBe(BigInt(BLOCK_HASH));
		expect(event.transaction_hash.toBigInt()).toBe(BigInt(INVOKE_TX_HASH));
		expect(event.from_address.toBigInt()).toBe(
			BigInt(
				"0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
			),
		);
		expect(event.keys).toHaveLength(1);
		expect(event.keys[0]?.toBigInt()).toBe(
			BigInt(
				"0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9",
			),
		);
		expect(event.data).toHaveLength(4);
		expect(event.data[0]?.toBigInt()).toBe(BigInt(INVOKE_SENDER));

		// Round-trip
		const back = emittedEventToRpc(event);
		expect(back.block_number).toBe(BLOCK_NUMBER);
		expect(BigInt(back.block_hash)).toBe(BigInt(BLOCK_HASH));
		expect(BigInt(back.transaction_hash)).toBe(BigInt(INVOKE_TX_HASH));
	});

	// --- StateUpdate ---

	it("getStateUpdate → exact state diff structure", async () => {
		const wire = await provider.request(
			Rpc.GetStateUpdateRequest({ block_hash: BLOCK_HASH }),
		);
		const update = stateUpdateFromRpc(wire as StateUpdate);

		expect(update.block_hash.toBigInt()).toBe(BigInt(BLOCK_HASH));
		expect(update.new_root.toBigInt()).toBe(BigInt(NEW_ROOT));
		expect(update.old_root.toBigInt()).toBe(
			BigInt(
				"0x4b53f7d22f8a479c2bf3cba0f7f232dbe1bcaf590d00bc4a17a331305b28b39",
			),
		);
		expect(update.state_diff.storage_diffs).toHaveLength(20);
		expect(update.state_diff.nonces).toHaveLength(12);
		expect(update.state_diff.deployed_contracts).toHaveLength(1);
		expect(update.state_diff.declared_classes).toHaveLength(0);

		// Round-trip
		const back = stateUpdateToRpc(update);
		expect(BigInt(back.block_hash)).toBe(BigInt(BLOCK_HASH));
		expect(BigInt(back.new_root)).toBe(BigInt(NEW_ROOT));
		expect(back.state_diff.storage_diffs).toHaveLength(20);
	});

	// --- FeeEstimate ---

	it("estimateFee → exact v0.10 field names and values", async () => {
		const wire = await provider.request(
			Rpc.EstimateFeeRequest(
				[
					{
						type: "INVOKE",
						sender_address: INVOKE_SENDER,
						calldata: [],
						version: "0x3",
						signature: [],
						nonce: "0x0",
						tip: "0x0",
						paymaster_data: [],
						account_deployment_data: [],
						nonce_data_availability_mode: "L1",
						fee_data_availability_mode: "L1",
						resource_bounds: {
							l1_gas: {
								max_amount: "0x0",
								max_price_per_unit: "0x0",
							},
							l2_gas: {
								max_amount: "0x0",
								max_price_per_unit: "0x0",
							},
						},
					},
				],
				["SKIP_VALIDATE"],
				{ block_number: BLOCK_NUMBER },
			),
		);

		const feeArr = wire as unknown[];
		expect(feeArr).toHaveLength(1);

		const fee = feeEstimateFromRpc(
			feeArr[0] as import("../jsonrpc/types.js").FeeEstimate,
		);
		expect(fee.l1_gas_consumed.toBigInt()).toBe(BigInt("0x0"));
		expect(fee.l1_gas_price.toBigInt()).toBe(BigInt("0x3f4ff003e511"));
		expect(fee.l2_gas_consumed.toBigInt()).toBe(BigInt("0xac440"));
		expect(fee.l2_gas_price.toBigInt()).toBe(BigInt("0x1"));
		expect(fee.l1_data_gas_consumed.toBigInt()).toBe(BigInt("0x80"));
		expect(fee.l1_data_gas_price.toBigInt()).toBe(BigInt("0x1658"));
		expect(fee.overall_fee.toBigInt()).toBe(BigInt("0x15f040"));
		expect(fee.unit).toBe("FRI");

		// Round-trip
		const back = feeEstimateToRpc(fee);
		expect(BigInt(back.l1_gas_consumed)).toBe(BigInt("0x0"));
		expect(BigInt(back.l1_gas_price)).toBe(BigInt("0x3f4ff003e511"));
		expect(BigInt(back.l2_gas_consumed)).toBe(BigInt("0xac440"));
		expect(BigInt(back.l1_data_gas_consumed)).toBe(BigInt("0x80"));
		expect(back.overall_fee).toBeTruthy();
		expect(back.unit).toBe("FRI");
	});

	// --- Trace ---

	it("traceTransaction → exact INVOKE trace structure", async () => {
		const wire = await provider.request(
			Rpc.TraceTransactionRequest(INVOKE_TX_HASH),
		);
		const trace = transactionTraceFromRpc(wire);

		expect(trace.type).toBe("INVOKE");
		if (trace.type === "INVOKE") {
			expect(trace.execute_invocation).toBeDefined();
			const exec = trace.execute_invocation;
			if ("contract_address" in exec) {
				expect(exec.contract_address.toBigInt()).toBe(BigInt(INVOKE_SENDER));
				expect(exec.entry_point_selector.toBigInt()).toBe(
					BigInt(
						"0x15d40a3d6ca2ac30f4031e42be28da9b056fef9bb7357ac5e85627ee876e5ad",
					),
				);
			}
			expect(trace.fee_transfer_invocation).toBeDefined();
			expect(trace.validate_invocation).toBeDefined();
		}

		// Round-trip
		const back = transactionTraceToRpc(trace);
		expect(back.type).toBe("INVOKE");
	});
});
