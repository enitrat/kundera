import { describe, expect, it } from "@effect/vitest";
import type {
	BlockWithTxs,
	PreConfirmedBlockWithTxs,
	TxnReceiptWithBlockInfo,
	TxnWithHash,
} from "@kundera-sn/kundera-ts/jsonrpc";
import { Effect, Layer, Stream } from "effect";

import { RpcError } from "../../errors.js";
import { ProviderService } from "../ProviderService.js";
import {
	TransactionStreamLive,
	TransactionStreamService,
} from "../TransactionStreamService.js";

const ZERO_PRICE = {
	price_in_fri: "0x0",
	price_in_wei: "0x0",
} as const;

const makeInvokeTransaction = (
	transactionHash: string,
	senderAddress: string,
): TxnWithHash => ({
	type: "INVOKE",
	version: "0x1",
	sender_address: senderAddress,
	calldata: [],
	max_fee: "0x0",
	signature: [],
	nonce: "0x0",
	transaction_hash: transactionHash,
});

const makeTransactionsBlock = (
	blockNumber: number,
	blockHash: string,
	parentHash: string,
	transactions: readonly TxnWithHash[],
): BlockWithTxs => ({
	status: "ACCEPTED_ON_L2",
	block_hash: blockHash,
	parent_hash: parentHash,
	block_number: blockNumber,
	new_root: "0x0",
	timestamp: 1_700_000_000 + blockNumber,
	sequencer_address: "0x1",
	l1_gas_price: ZERO_PRICE,
	l2_gas_price: ZERO_PRICE,
	l1_data_gas_price: ZERO_PRICE,
	l1_da_mode: "CALLDATA",
	starknet_version: "0.13.0",
	event_commitment: "0x0",
	transaction_commitment: "0x0",
	receipt_commitment: "0x0",
	state_diff_commitment: "0x0",
	event_count: 0,
	transaction_count: transactions.length,
	state_diff_length: 0,
	transactions: [...transactions],
});

const makePendingBlock = (
	blockNumber: number,
	blockHash: string,
	parentHash: string,
	transactions: readonly TxnWithHash[],
): PreConfirmedBlockWithTxs => ({
	block_hash: blockHash,
	parent_hash: parentHash,
	block_number: blockNumber,
	new_root: "0x0",
	timestamp: 1_700_000_000 + blockNumber,
	sequencer_address: "0x1",
	l1_gas_price: ZERO_PRICE,
	l1_data_gas_price: ZERO_PRICE,
	l1_da_mode: "CALLDATA",
	starknet_version: "0.13.0",
	transactions: [...transactions],
});

const makeReceipt = (
	transactionHash: string,
	blockNumber?: number,
): TxnReceiptWithBlockInfo => ({
	type: "INVOKE",
	transaction_hash: transactionHash,
	actual_fee: { amount: "0x0", unit: "FRI" },
	finality_status: "ACCEPTED_ON_L2",
	messages_sent: [],
	events: [],
	execution_resources: { steps: 1 },
	execution_status: "SUCCEEDED",
	block_hash:
		blockNumber === undefined ? undefined : `0x${blockNumber.toString(16)}`,
	block_number: blockNumber,
});

describe("TransactionStreamService", () => {
	it.effect(
		"watchPending polls pending block and de-duplicates tx hashes",
		() => {
			let pendingCalls = 0;

			const txA = makeInvokeTransaction("0xaaa", "0x111");
			const txB = makeInvokeTransaction("0xbbb", "0x222");

			const pendingOne = makePendingBlock(100, "0x100", "0x099", [txA]);
			const pendingTwo = makePendingBlock(101, "0x101", "0x100", [txA, txB]);

			const providerLayer = Layer.succeed(ProviderService, {
				request: <T>(method: string, params?: readonly unknown[]) => {
					if (
						method === "starknet_getBlockWithTxs" &&
						params?.[0] === "pending"
					) {
						pendingCalls += 1;
						return Effect.succeed(
							(pendingCalls === 1 ? pendingOne : pendingTwo) as T,
						);
					}

					return Effect.fail(
						new RpcError({
							method,
							code: -32601,
							message: "Unexpected method",
						}),
					);
				},
			});

			return Effect.gen(function* () {
				const events = yield* Effect.flatMap(
					TransactionStreamService,
					(stream) =>
						stream
							.watchPending({ pollInterval: 0 })
							.pipe(Stream.take(2), Stream.runCollect),
				);
				const hashes = Array.from(events).map(
					(event) => event.transaction.transaction_hash,
				);

				expect(hashes).toEqual(["0xaaa", "0xbbb"]);
			}).pipe(
				Effect.provide(TransactionStreamLive),
				Effect.provide(providerLayer),
			);
		},
	);

	it.effect("watchConfirmed respects confirmation threshold", () => {
		let blockNumberCalls = 0;

		const tx = makeInvokeTransaction("0xaaa", "0x111");
		const block10 = makeTransactionsBlock(10, "0x10", "0x09", [tx]);

		const providerLayer = Layer.succeed(ProviderService, {
			request: <T>(method: string, params?: readonly unknown[]) => {
				if (method === "starknet_blockNumber") {
					blockNumberCalls += 1;
					const head = [10, 11][Math.min(blockNumberCalls - 1, 1)] ?? 11;
					return Effect.succeed(head as T);
				}

				if (method === "starknet_getBlockWithTxs") {
					const blockId = params?.[0] as { block_number: number };
					if (blockId.block_number === 10) {
						return Effect.succeed(block10 as T);
					}
				}

				return Effect.fail(
					new RpcError({
						method,
						code: -32601,
						message: "Unexpected method",
					}),
				);
			},
		});

		return Effect.gen(function* () {
			const events = yield* Effect.flatMap(TransactionStreamService, (stream) =>
				stream
					.watchConfirmed({
						fromBlock: 10,
						confirmations: 2,
						pollInterval: 0,
					})
					.pipe(Stream.take(1), Stream.runCollect),
			);
			const confirmed = Array.from(events)[0];

			expect(confirmed?.type).toBe("confirmed");
			expect(confirmed?.transaction.transaction_hash).toBe("0xaaa");
			expect(confirmed?.confirmations).toBe(2);
		}).pipe(
			Effect.provide(TransactionStreamLive),
			Effect.provide(providerLayer),
		);
	});

	it.effect(
		"track emits pending then confirmed for a mined transaction",
		() => {
			let receiptCalls = 0;

			const tx = makeInvokeTransaction("0xbeef", "0x123");
			const receipt = makeReceipt("0xbeef", 20);

			const providerLayer = Layer.succeed(ProviderService, {
				request: <T>(method: string) => {
					if (method === "starknet_getTransactionReceipt") {
						receiptCalls += 1;
						if (receiptCalls === 1) {
							return Effect.fail(
								new RpcError({
									method,
									code: 25,
									message: "Transaction hash not found",
								}),
							);
						}
						return Effect.succeed(receipt as T);
					}

					if (method === "starknet_getTransactionStatus") {
						return Effect.succeed({ finality_status: "RECEIVED" } as T);
					}

					if (method === "starknet_blockNumber") {
						return Effect.succeed(20 as T);
					}

					if (method === "starknet_getTransactionByHash") {
						return Effect.succeed(tx as T);
					}

					return Effect.fail(
						new RpcError({
							method,
							code: -32601,
							message: "Unexpected method",
						}),
					);
				},
			});

			return Effect.gen(function* () {
				const events = yield* Effect.flatMap(
					TransactionStreamService,
					(stream) =>
						stream
							.track("0xbeef", { pollInterval: 0, confirmations: 1 })
							.pipe(Stream.take(2), Stream.runCollect),
				);
				const collected = Array.from(events);

				expect(collected[0]?.type).toBe("pending");
				expect(collected[1]?.type).toBe("confirmed");
				if (collected[1]?.type === "confirmed") {
					expect(collected[1].receipt.transaction_hash).toBe("0xbeef");
				}
			}).pipe(
				Effect.provide(TransactionStreamLive),
				Effect.provide(providerLayer),
			);
		},
	);

	it.effect("track emits dropped when maxPendingPolls is reached", () => {
		const providerLayer = Layer.succeed(ProviderService, {
			request: <T>(method: string) => {
				if (method === "starknet_getTransactionReceipt") {
					return Effect.fail(
						new RpcError({
							method,
							code: 25,
							message: "Transaction hash not found",
						}),
					);
				}

				if (method === "starknet_getTransactionStatus") {
					return Effect.succeed({ finality_status: "RECEIVED" } as T);
				}

				return Effect.fail(
					new RpcError({
						method,
						code: -32601,
						message: "Unexpected method",
					}),
				);
			},
		});

		return Effect.gen(function* () {
			const events = yield* Effect.flatMap(TransactionStreamService, (stream) =>
				stream
					.track("0xbeef", { pollInterval: 0, maxPendingPolls: 2 })
					.pipe(Stream.take(2), Stream.runCollect),
			);
			const collected = Array.from(events);

			expect(collected[0]?.type).toBe("pending");
			expect(collected[1]?.type).toBe("dropped");
			if (collected[1]?.type === "dropped") {
				expect(collected[1].reason).toContain("2 polls");
			}
		}).pipe(
			Effect.provide(TransactionStreamLive),
			Effect.provide(providerLayer),
		);
	});
});
