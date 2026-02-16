import { describe, expect, it } from "@effect/vitest";
import type {
	BlockWithTxHashes,
	NewHead,
	ReorgData,
} from "@kundera-sn/kundera-ts/jsonrpc";
import { Effect, Layer, Stream } from "effect";
import { beforeEach, vi } from "vitest";

import { RpcError } from "../../errors.js";
import { BlockStreamLive, BlockStreamService } from "../BlockStreamService.js";
import { ProviderService } from "../ProviderService.js";

const ZERO_PRICE = {
	price_in_fri: "0x0",
	price_in_wei: "0x0",
} as const;

const makeHeaderBlock = (
	blockNumber: number,
	blockHash: string,
	parentHash: string,
	transactions: readonly string[] = [],
): BlockWithTxHashes => ({
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
}

interface MockWebSocketProviderState {
	readonly newHeadsSubscriptions: unknown[];
	connectCalls: number;
	disconnectCalls: number;
}

interface MockWebSocketState {
	scenarios: MockWebSocketScenario[];
	instances: MockWebSocketProviderState[];
}

const BLOCK_WS_STATE_KEY = "__kunderaBlockWsMockState__";

vi.mock("@kundera-sn/kundera-ts/provider", async () => {
	const state: MockWebSocketState = { scenarios: [], instances: [] };
	(
		globalThis as typeof globalThis & {
			__kunderaBlockWsMockState__?: MockWebSocketState;
		}
	).__kunderaBlockWsMockState__ = state;

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
			readonly [BLOCK_WS_STATE_KEY]?: MockWebSocketState;
		}
	)[BLOCK_WS_STATE_KEY];

	if (!state) {
		throw new Error("Block websocket mock state was not initialized");
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

describe("BlockStreamService websocket", () => {
	beforeEach(() => {
		resetWebSocketMock();
	});

	it.effect("streams new heads via websocket and fetches missing block range", () => {
		queueWebSocketScenario({
			newHeads: [makeHead(10, "0x10", "0x09"), makeHead(11, "0x11", "0x10")],
		});

		const blocks = new Map<number, BlockWithTxHashes>([
			[10, makeHeaderBlock(10, "0x10", "0x09", ["0xaaa"])],
			[11, makeHeaderBlock(11, "0x11", "0x10", ["0xbbb"])],
		]);

		const providerLayer = Layer.succeed(ProviderService, {
			request: <T>(method: string, params?: readonly unknown[]) => {
				if (method === "starknet_getBlockWithTxHashes") {
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
			const events = yield* Effect.flatMap(BlockStreamService, (stream) =>
				stream
					.watch({
						fromBlock: 10,
						streamMode: "websocket",
						websocket: { url: "wss://test.example" },
					})
					.pipe(Stream.runCollect),
			);
			const collected = Array.from(events);
			const emittedNumbers = collected.flatMap((event) =>
				event.type === "blocks"
					? event.blocks.map((block) => block.block_number)
					: [],
			);

			expect(emittedNumbers).toEqual([10, 11]);
			const ws = latestWebSocketInstance();
			expect(ws?.connectCalls).toBe(1);
			expect(ws?.disconnectCalls).toBe(1);
			expect(ws?.newHeadsSubscriptions[0]).toEqual({
				block_id: { block_number: 10 },
			});
		}).pipe(Effect.provide(BlockStreamLive), Effect.provide(providerLayer));
	});

	it.effect("emits websocket reorg events", () => {
		queueWebSocketScenario({
			newHeads: [
				makeHead(10, "0x10", "0x09"),
				{
					starting_block_hash: "0x10",
					starting_block_number: 10,
					ending_block_hash: "0x11",
					ending_block_number: 11,
				},
			],
		});

		const blocks = new Map<number, BlockWithTxHashes>([
			[10, makeHeaderBlock(10, "0x10", "0x09", ["0xaaa"])],
		]);

		const providerLayer = Layer.succeed(ProviderService, {
			request: <T>(method: string, params?: readonly unknown[]) => {
				if (method === "starknet_getBlockWithTxHashes") {
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
			const events = yield* Effect.flatMap(BlockStreamService, (stream) =>
				stream
					.watch({
						fromBlock: 10,
						streamMode: "websocket",
						websocket: { url: "wss://test.example" },
					})
					.pipe(Stream.runCollect),
			);
			const collected = Array.from(events);
			expect(collected).toHaveLength(2);
			expect(collected[1]?.type).toBe("reorg");
			if (collected[1]?.type !== "reorg") {
				return;
			}

			expect(collected[1].removed.map((block) => block.block_number)).toEqual([
				10,
			]);
			expect(collected[1].added).toHaveLength(0);
			expect(collected[1].commonAncestor).toBeNull();
			expect(collected[1].metadata.chainHead).toBe(11);
		}).pipe(Effect.provide(BlockStreamLive), Effect.provide(providerLayer));
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
			const error = yield* Effect.flip(
				Effect.flatMap(BlockStreamService, (stream) =>
					stream.watch({ streamMode: "websocket" }).pipe(Stream.runCollect),
				),
			);

			expect(error._tag).toBe("BlockStreamError");
			expect(error.message).toContain("websocket.url is required");
		}).pipe(Effect.provide(BlockStreamLive), Effect.provide(providerLayer));
	});
});
