import { describe, expect, it } from "@effect/vitest";
import type {
	BlockWithTxs,
	NewHead,
	PendingTransaction,
	PreConfirmedBlockWithTxs,
	ReorgData,
	TxnWithHash,
} from "@kundera-sn/kundera-ts/jsonrpc";
import { Effect, Layer, Stream } from "effect";
import { beforeEach, vi } from "vitest";

import { RpcError } from "../../errors.js";
import {
	TransactionStreamLive,
	TransactionStreamService,
} from "../TransactionStreamService.js";
import { ProviderService } from "../ProviderService.js";

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

const makeHead = (
	blockNumber: number,
	blockHash: string,
	parentHash: string,
): NewHead => ({
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
});

interface MockWebSocketScenario {
	readonly newHeads?: readonly (NewHead | ReorgData)[];
	readonly pendingTransactions?: readonly (PendingTransaction | ReorgData)[];
}

interface MockWebSocketProviderState {
	readonly newHeadsSubscriptions: unknown[];
	readonly pendingSubscriptions: unknown[];
	connectCalls: number;
	disconnectCalls: number;
}

interface MockWebSocketState {
	scenarios: MockWebSocketScenario[];
	instances: MockWebSocketProviderState[];
}

const TX_WS_STATE_KEY = "__kunderaTransactionWsMockState__";

vi.mock("@kundera-sn/kundera-ts/provider", async () => {
	const state: MockWebSocketState = { scenarios: [], instances: [] };
	(
		globalThis as typeof globalThis & {
			__kunderaTransactionWsMockState__?: MockWebSocketState;
		}
	).__kunderaTransactionWsMockState__ = state;

	const toAsyncIterable = <T>(items: readonly T[]): AsyncIterable<T> =>
		(async function* () {
			for (const item of items) {
				yield item;
			}
		})();

	const actual = await vi.importActual<
		typeof import("@kundera-sn/kundera-ts/provider")
	>("@kundera-sn/kundera-ts/provider");
	return {
		...actual,
		WebSocketProvider: class implements MockWebSocketProviderState {
			private readonly scenario: MockWebSocketScenario;
			readonly newHeadsSubscriptions: unknown[] = [];
			readonly pendingSubscriptions: unknown[] = [];
			connectCalls = 0;
			disconnectCalls = 0;

			constructor(_options: unknown) {
				this.scenario = state.scenarios.shift() ?? {};
				state.instances.push(this);
			}

			readonly events = {
				newHeads: (params?: unknown): AsyncIterable<NewHead | ReorgData> => {
					this.newHeadsSubscriptions.push(params);
					return toAsyncIterable(this.scenario.newHeads ?? []);
				},
				pendingTransactions: (
					params?: unknown,
				): AsyncIterable<PendingTransaction | ReorgData> => {
					this.pendingSubscriptions.push(params);
					return toAsyncIterable(this.scenario.pendingTransactions ?? []);
				},
			};

			async connect(): Promise<void> {
				this.connectCalls += 1;
			}

			disconnect(): void {
				this.disconnectCalls += 1;
			}
		},
	};
});

const getMockState = (): MockWebSocketState => {
	const state = (
		globalThis as typeof globalThis & {
			readonly [TX_WS_STATE_KEY]?: MockWebSocketState;
		}
	)[TX_WS_STATE_KEY];

	if (!state) {
		throw new Error("Transaction websocket mock state was not initialized");
	}
	return state;
};

const resetWebSocketMock = (): void => {
	const state = getMockState();
	state.scenarios = [];
	state.instances = [];
};

const queueWebSocketScenario = (scenario: MockWebSocketScenario): void => {
	getMockState().scenarios.push(scenario);
};

const latestWebSocketInstance = (): MockWebSocketProviderState | undefined => {
	const state = getMockState();
	return state.instances[state.instances.length - 1];
};

describe("TransactionStreamService websocket", () => {
	beforeEach(() => {
		resetWebSocketMock();
	});

	it.effect("watchPending streams websocket transactions with dedupe and filters", () => {
		queueWebSocketScenario({
			pendingTransactions: [
				{ transaction_hash: "0xaaa" },
				{ transaction_hash: "0xaaa" },
				{ transaction_hash: "0xbbb" },
			],
		});

		const transactions = new Map<string, TxnWithHash>([
			["0xaaa", makeInvokeTransaction("0xaaa", "0x111")],
			["0xbbb", makeInvokeTransaction("0xbbb", "0x222")],
		]);

		const providerLayer = Layer.succeed(ProviderService, {
			request: <T>(method: string, params?: readonly unknown[]) => {
				if (method === "starknet_getTransactionByHash") {
					const hash = params?.[0] as string;
					return Effect.succeed(transactions.get(hash) as T);
				}

				if (
					method === "starknet_getBlockWithTxs" &&
					params?.[0] === "pending"
				) {
					return Effect.succeed(
						makePendingBlock(100, "0x100", "0x99", []) as T,
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
			const events = yield* Effect.flatMap(TransactionStreamService, (stream) =>
				stream
					.watchPending({
						streamMode: "websocket",
						websocket: { url: "wss://test.example" },
						filter: { senderAddress: "0x111", types: ["INVOKE"] },
					})
					.pipe(Stream.runCollect),
			);
			const hashes = Array.from(events).map(
				(event) => event.transaction.transaction_hash,
			);

			expect(hashes).toEqual(["0xaaa"]);
			const ws = latestWebSocketInstance();
			expect(ws?.connectCalls).toBe(1);
			expect(ws?.disconnectCalls).toBe(1);
			expect(ws?.pendingSubscriptions[0]).toEqual({
				sender_address: ["0x111"],
			});
		}).pipe(
			Effect.provide(TransactionStreamLive),
			Effect.provide(providerLayer),
		);
	});

	it.effect("watchConfirmed streams websocket heads with confirmation threshold", () => {
		queueWebSocketScenario({
			newHeads: [makeHead(11, "0x11", "0x10"), makeHead(12, "0x12", "0x11")],
		});

		const txA = makeInvokeTransaction("0xaaa", "0x111");
		const txB = makeInvokeTransaction("0xbbb", "0x222");
		const blocks = new Map<number, BlockWithTxs>([
			[10, makeTransactionsBlock(10, "0x10", "0x09", [txA])],
			[11, makeTransactionsBlock(11, "0x11", "0x10", [txB])],
		]);

		const providerLayer = Layer.succeed(ProviderService, {
			request: <T>(method: string, params?: readonly unknown[]) => {
				if (method === "starknet_getBlockWithTxs") {
					const blockId = params?.[0] as { block_number: number };
					return Effect.succeed(blocks.get(blockId.block_number) as T);
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
						streamMode: "websocket",
						websocket: { url: "wss://test.example" },
						fromBlock: 10,
						confirmations: 2,
					})
					.pipe(Stream.runCollect),
			);
			const collected = Array.from(events);
			expect(
				collected.map((event) => event.transaction.transaction_hash),
			).toEqual(["0xaaa", "0xbbb"]);
			expect(collected.map((event) => event.confirmations)).toEqual([2, 2]);

			const ws = latestWebSocketInstance();
			expect(ws?.newHeadsSubscriptions[0]).toEqual({
				block_id: { block_number: 10 },
			});
		}).pipe(
			Effect.provide(TransactionStreamLive),
			Effect.provide(providerLayer),
		);
	});

	it.effect("watchConfirmed resets cursor and seen state on websocket reorg", () => {
		queueWebSocketScenario({
			newHeads: [
				makeHead(11, "0x11_old", "0x10_old"),
				{
					starting_block_hash: "0x10_old",
					starting_block_number: 10,
					ending_block_hash: "0x11_new",
					ending_block_number: 11,
				},
				makeHead(12, "0x12_new", "0x11_new"),
			],
		});

		const txOld = makeInvokeTransaction("0xold", "0x111");
		const txNew = makeInvokeTransaction("0xnew", "0x111");
		const tx11 = makeInvokeTransaction("0x11", "0x111");
		let block10Calls = 0;

		const providerLayer = Layer.succeed(ProviderService, {
			request: <T>(method: string, params?: readonly unknown[]) => {
				if (method !== "starknet_getBlockWithTxs") {
					return Effect.fail(
						new RpcError({
							method,
							code: -32601,
							message: "Unexpected method",
						}),
					);
				}

				const blockId = params?.[0] as { block_number: number };
				if (blockId.block_number === 10) {
					block10Calls += 1;
					return Effect.succeed(
						makeTransactionsBlock(
							10,
							block10Calls === 1 ? "0x10_old" : "0x10_new",
							"0x09",
							[block10Calls === 1 ? txOld : txNew],
						) as T,
					);
				}

				if (blockId.block_number === 11) {
					return Effect.succeed(
						makeTransactionsBlock(11, "0x11_new", "0x10_new", [tx11]) as T,
					);
				}

				return Effect.fail(
					new RpcError({
						method,
						code: -32601,
						message: "Unexpected block number",
					}),
				);
			},
		});

		return Effect.gen(function* () {
			const events = yield* Effect.flatMap(TransactionStreamService, (stream) =>
				stream
					.watchConfirmed({
						streamMode: "websocket",
						websocket: { url: "wss://test.example" },
						fromBlock: 10,
						confirmations: 2,
					})
					.pipe(Stream.runCollect),
			);
			const hashes = Array.from(events).map(
				(event) => event.transaction.transaction_hash,
			);
			expect(hashes).toEqual(["0xold", "0xnew", "0x11"]);
		}).pipe(
			Effect.provide(TransactionStreamLive),
			Effect.provide(providerLayer),
		);
	});

	it.effect("fails when websocket url is missing in websocket mode", () => {
		const providerLayer = Layer.succeed(ProviderService, {
			request: <T>(method: string) =>
				Effect.fail(
					new RpcError({
						method,
						code: -32601,
						message: "Unexpected method",
					}),
				) as Effect.Effect<T, RpcError>,
		});

		return Effect.gen(function* () {
			const pendingError = yield* Effect.flip(
				Effect.flatMap(TransactionStreamService, (stream) =>
					stream
						.watchPending({ streamMode: "websocket" })
						.pipe(Stream.runCollect),
				),
			);
			expect(pendingError._tag).toBe("TransactionStreamError");
			expect(pendingError.message).toContain("websocket.url is required");

			const confirmedError = yield* Effect.flip(
				Effect.flatMap(TransactionStreamService, (stream) =>
					stream
						.watchConfirmed({ streamMode: "websocket" })
						.pipe(Stream.runCollect),
				),
			);
			expect(confirmedError._tag).toBe("TransactionStreamError");
			expect(confirmedError.message).toContain("websocket.url is required");
		}).pipe(
			Effect.provide(TransactionStreamLive),
			Effect.provide(providerLayer),
		);
	});
});
