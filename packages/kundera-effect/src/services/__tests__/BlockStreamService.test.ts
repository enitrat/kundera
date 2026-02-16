import { describe, expect, it } from "@effect/vitest";
import type { BlockWithTxHashes } from "@kundera-sn/kundera-ts/jsonrpc";
import { Effect, Layer, Stream } from "effect";

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

describe("BlockStreamService", () => {
	it.effect("backfill fetches historical blocks in chunks", () => {
		const blocks = new Map<number, BlockWithTxHashes>([
			[10, makeHeaderBlock(10, "0x10", "0x09", ["0xa"])],
			[11, makeHeaderBlock(11, "0x11", "0x10", ["0xb"])],
			[12, makeHeaderBlock(12, "0x12", "0x11", ["0xc"])],
		]);

		const providerLayer = Layer.succeed(ProviderService, {
			request: <T>(method: string, params?: readonly unknown[]) => {
				if (method !== "starknet_getBlockWithTxHashes") {
					return Effect.fail(
						new RpcError({
							method,
							code: -32601,
							message: "Unexpected method",
						}),
					);
				}

				const blockId = params?.[0] as { block_number: number };
				return Effect.succeed(blocks.get(blockId.block_number) as T);
			},
		});

		return Effect.gen(function* () {
			const events = yield* Effect.flatMap(BlockStreamService, (stream) =>
				stream
					.backfill({
						fromBlock: 10,
						toBlock: 12,
						chunkSize: 2,
					})
					.pipe(Stream.runCollect),
			);
			const collected = Array.from(events);

			expect(collected.length).toBe(2);
			expect(collected[0]?.type).toBe("blocks");
			expect(collected[0]?.blocks.map((block) => block.block_number)).toEqual([
				10, 11,
			]);
			expect(collected[1]?.blocks.map((block) => block.block_number)).toEqual([
				12,
			]);
		}).pipe(Effect.provide(BlockStreamLive), Effect.provide(providerLayer));
	});

	it.effect("watch streams new blocks in ascending order", () => {
		let blockNumberCalls = 0;

		const blocks = new Map<number, BlockWithTxHashes>([
			[10, makeHeaderBlock(10, "0x10", "0x09", ["0xa"])],
			[11, makeHeaderBlock(11, "0x11", "0x10", ["0xb"])],
			[12, makeHeaderBlock(12, "0x12", "0x11", ["0xc"])],
		]);

		const providerLayer = Layer.succeed(ProviderService, {
			request: <T>(method: string, params?: readonly unknown[]) => {
				if (method === "starknet_blockNumber") {
					blockNumberCalls += 1;
					const head = [10, 11, 12][Math.min(blockNumberCalls - 1, 2)] ?? 12;
					return Effect.succeed(head as T);
				}

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
					.watch({ fromBlock: 10, pollInterval: 0 })
					.pipe(Stream.take(3), Stream.runCollect),
			);
			const collected = Array.from(events);
			const blockNumbers = collected.flatMap((event) =>
				event.type === "blocks"
					? event.blocks.map((block) => block.block_number)
					: [],
			);

			expect(blockNumbers).toEqual([10, 11, 12]);
		}).pipe(Effect.provide(BlockStreamLive), Effect.provide(providerLayer));
	});

	it.effect("watch emits reorg events when parent hash diverges", () => {
		let blockNumberCalls = 0;
		let block11Calls = 0;

		const block10 = makeHeaderBlock(10, "0x10", "0x09", ["0xa"]);
		const oldBlock11 = makeHeaderBlock(11, "0x11_old", "0x10", ["0xb"]);
		const newBlock11 = makeHeaderBlock(11, "0x11_new", "0x10", ["0xbb"]);
		const newBlock12 = makeHeaderBlock(12, "0x12_new", "0x11_new", ["0xcc"]);

		const providerLayer = Layer.succeed(ProviderService, {
			request: <T>(method: string, params?: readonly unknown[]) => {
				if (method === "starknet_blockNumber") {
					blockNumberCalls += 1;
					const head = [10, 11, 12][Math.min(blockNumberCalls - 1, 2)] ?? 12;
					return Effect.succeed(head as T);
				}

				if (method === "starknet_getBlockWithTxHashes") {
					const blockId = params?.[0] as { block_number: number };
					if (blockId.block_number === 10) return Effect.succeed(block10 as T);
					if (blockId.block_number === 11) {
						block11Calls += 1;
						return Effect.succeed(
							(block11Calls === 1 ? oldBlock11 : newBlock11) as T,
						);
					}
					if (blockId.block_number === 12)
						return Effect.succeed(newBlock12 as T);
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
					.watch({ fromBlock: 10, pollInterval: 0 })
					.pipe(Stream.take(3), Stream.runCollect),
			);
			const collected = Array.from(events);
			const reorg = collected[2];

			expect(reorg?.type).toBe("reorg");
			if (reorg?.type !== "reorg") {
				return;
			}

			expect(reorg.removed.map((block) => block.block_hash)).toEqual([
				"0x11_old",
			]);
			expect(reorg.added.map((block) => block.block_hash)).toEqual([
				"0x11_new",
				"0x12_new",
			]);
			expect(reorg.commonAncestor?.block_hash).toBe("0x10");
		}).pipe(Effect.provide(BlockStreamLive), Effect.provide(providerLayer));
	});

	it.effect("watch fails when reorg depth exceeds tracked history", () => {
		let blockNumberCalls = 0;
		let block8Calls = 0;

		const block7Old = makeHeaderBlock(7, "0x07_old", "0x06", ["0x7"]);
		const block8Old = makeHeaderBlock(8, "0x08_old", "0x07_old", ["0x8"]);
		const block8New = makeHeaderBlock(8, "0x08_new", "0x07_new", ["0x8b"]);
		const block9New = makeHeaderBlock(9, "0x09_new", "0x08_new", ["0x9"]);

		const providerLayer = Layer.succeed(ProviderService, {
			request: <T>(method: string, params?: readonly unknown[]) => {
				if (method === "starknet_blockNumber") {
					blockNumberCalls += 1;
					const head = [7, 8, 10][Math.min(blockNumberCalls - 1, 2)] ?? 10;
					return Effect.succeed(head as T);
				}

				if (method === "starknet_getBlockWithTxHashes") {
					const blockId = params?.[0] as { block_number: number };
					if (blockId.block_number === 7) return Effect.succeed(block7Old as T);
					if (blockId.block_number === 8) {
						block8Calls += 1;
						return Effect.succeed(
							(block8Calls === 1 ? block8Old : block8New) as T,
						);
					}
					if (blockId.block_number === 9) return Effect.succeed(block9New as T);
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
			const error = yield* Effect.flip(
				Effect.flatMap(BlockStreamService, (stream) =>
					stream
						.watch({
							fromBlock: 7,
							pollInterval: 0,
							maxTrackedBlocks: 2,
						})
						.pipe(Stream.take(3), Stream.runCollect),
				),
			);

			expect(error._tag).toBe("BlockStreamError");
			expect(error.message).toContain("exceeds tracked history");
		}).pipe(Effect.provide(BlockStreamLive), Effect.provide(providerLayer));
	});
});
