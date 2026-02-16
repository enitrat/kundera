import {
	type BlockWithReceipts,
	type BlockWithTxHashes,
	type BlockWithTxs,
	type PreConfirmedBlockWithReceipts,
	type PreConfirmedBlockWithTxHashes,
	type PreConfirmedBlockWithTxs,
	Rpc,
} from "@kundera-sn/kundera-ts/jsonrpc";
import { Context, Effect, Layer, Ref, Stream } from "effect";
import * as Duration from "effect/Duration";

import {
	BlockStreamError,
	type RpcError,
	type TransportError,
} from "../errors.js";
import { ProviderService } from "./ProviderService.js";
import type { RequestOptions } from "./TransportService.js";

export type BlockStreamInclude = "header" | "transactions" | "receipts";

type HeaderStreamBlock = BlockWithTxHashes | PreConfirmedBlockWithTxHashes;
type TransactionsStreamBlock = BlockWithTxs | PreConfirmedBlockWithTxs;
type ReceiptsStreamBlock = BlockWithReceipts | PreConfirmedBlockWithReceipts;
type AnyStreamBlock =
	| HeaderStreamBlock
	| TransactionsStreamBlock
	| ReceiptsStreamBlock;

export type StreamBlock<TInclude extends BlockStreamInclude = "header"> =
	TInclude extends "transactions"
		? TransactionsStreamBlock
		: TInclude extends "receipts"
			? ReceiptsStreamBlock
			: HeaderStreamBlock;

export interface BlockStreamMetadata {
	readonly chainHead: number;
}

export interface LightBlock {
	readonly block_hash: string;
	readonly block_number: number;
	readonly parent_hash: string;
}

export interface BlocksEvent<TInclude extends BlockStreamInclude = "header"> {
	readonly type: "blocks";
	readonly blocks: readonly StreamBlock<TInclude>[];
	readonly metadata: BlockStreamMetadata;
}

export interface ReorgEvent<TInclude extends BlockStreamInclude = "header"> {
	readonly type: "reorg";
	readonly removed: readonly LightBlock[];
	readonly added: readonly StreamBlock<TInclude>[];
	readonly commonAncestor: LightBlock | null;
	readonly metadata: BlockStreamMetadata;
}

export type BlockStreamEvent<TInclude extends BlockStreamInclude = "header"> =
	| BlocksEvent<TInclude>
	| ReorgEvent<TInclude>;

export interface BlockStreamReadOptions {
	readonly requestOptions?: RequestOptions;
}

export interface BackfillBlocksOptions<
	TInclude extends BlockStreamInclude = "header",
> extends BlockStreamReadOptions {
	readonly fromBlock: number;
	readonly toBlock: number;
	readonly include?: TInclude;
	readonly chunkSize?: number;
}

export interface WatchBlocksOptions<
	TInclude extends BlockStreamInclude = "header",
> extends BlockStreamReadOptions {
	readonly fromBlock?: number;
	readonly include?: TInclude;
	readonly pollInterval?: Duration.DurationInput;
	readonly maxTrackedBlocks?: number;
}

export interface BlockStreamServiceShape {
	readonly backfill: <TInclude extends BlockStreamInclude = "header">(
		options: BackfillBlocksOptions<TInclude>,
	) => Stream.Stream<BlocksEvent<TInclude>, BlockStreamError>;

	readonly watch: <TInclude extends BlockStreamInclude = "header">(
		options?: WatchBlocksOptions<TInclude>,
	) => Stream.Stream<BlockStreamEvent<TInclude>, BlockStreamError>;
}

export class BlockStreamService extends Context.Tag(
	"@kundera/BlockStreamService",
)<BlockStreamService, BlockStreamServiceShape>() {}

const isNonNegativeInteger = (value: number): boolean =>
	Number.isInteger(value) && value >= 0;

const isPositiveInteger = (value: number): boolean =>
	Number.isInteger(value) && value > 0;

const range = (from: number, to: number): readonly number[] => {
	const values: number[] = [];
	for (let current = from; current <= to; current += 1) {
		values.push(current);
	}
	return values;
};

const toLightBlock = (block: AnyStreamBlock): LightBlock => ({
	block_hash: block.block_hash,
	block_number: block.block_number,
	parent_hash: block.parent_hash,
});

const trimTracked = (
	tracked: readonly LightBlock[],
	maxTrackedBlocks: number,
): readonly LightBlock[] =>
	tracked.length > maxTrackedBlocks
		? tracked.slice(tracked.length - maxTrackedBlocks)
		: tracked;

const toBlockStreamError = (
	operation: string,
	message: string,
	options?: {
		readonly cause?: unknown;
		readonly context?: Record<string, unknown>;
	},
): BlockStreamError =>
	new BlockStreamError({
		operation,
		message,
		cause: options?.cause,
		context: options?.context,
	});

const errorMessageOf = (error: TransportError | RpcError): string =>
	"message" in error && typeof error.message === "string"
		? error.message
		: "Provider request failed";

const mapRequestError =
	(operation: string, context?: Record<string, unknown>) =>
	(cause: TransportError | RpcError): BlockStreamError =>
		toBlockStreamError(operation, errorMessageOf(cause), {
			cause,
			context,
		});

export const BlockStreamLive: Layer.Layer<
	BlockStreamService,
	never,
	ProviderService
> = Layer.effect(
	BlockStreamService,
	Effect.gen(function* () {
		const provider = yield* ProviderService;

		const getBlockNumber = (
			requestOptions?: RequestOptions,
		): Effect.Effect<number, TransportError | RpcError> => {
			const { method, params } = Rpc.BlockNumberRequest();
			return provider.request<number>(method, params, requestOptions);
		};

		const getBlockByNumber = <TInclude extends BlockStreamInclude>(
			blockNumber: number,
			include: TInclude,
			requestOptions?: RequestOptions,
		): Effect.Effect<StreamBlock<TInclude>, TransportError | RpcError> => {
			const blockId = { block_number: blockNumber } as const;

			if (include === "transactions") {
				const { method, params } = Rpc.GetBlockWithTxsRequest(blockId);
				return provider.request<TransactionsStreamBlock>(
					method,
					params,
					requestOptions,
				) as Effect.Effect<StreamBlock<TInclude>, TransportError | RpcError>;
			}

			if (include === "receipts") {
				const { method, params } = Rpc.GetBlockWithReceiptsRequest(blockId);
				return provider.request<ReceiptsStreamBlock>(
					method,
					params,
					requestOptions,
				) as Effect.Effect<StreamBlock<TInclude>, TransportError | RpcError>;
			}

			const { method, params } = Rpc.GetBlockWithTxHashesRequest(blockId);
			return provider.request<HeaderStreamBlock>(
				method,
				params,
				requestOptions,
			) as Effect.Effect<StreamBlock<TInclude>, TransportError | RpcError>;
		};

		const resolveReorg = <TInclude extends BlockStreamInclude>(
			block: StreamBlock<TInclude>,
			tracked: readonly LightBlock[],
			chainHead: number,
			include: TInclude,
			maxTrackedBlocks: number,
			requestOptions?: RequestOptions,
		): Effect.Effect<
			{
				readonly event: ReorgEvent<TInclude>;
				readonly nextTracked: readonly LightBlock[];
			},
			BlockStreamError
		> =>
			Effect.gen(function* () {
				const trackedByHash = new Map(
					tracked.map((candidate) => [candidate.block_hash, candidate]),
				);
				const addedBlocks: StreamBlock<TInclude>[] = [block];

				let parentHash = block.parent_hash;
				let cursor = block.block_number - 1;

				while (!trackedByHash.has(parentHash)) {
					if (cursor < 0) {
						return yield* Effect.fail(
							toBlockStreamError(
								"watch",
								"Unable to resolve reorg because no common ancestor could be found",
								{
									context: {
										chainHead,
										blockNumber: block.block_number,
										maxTrackedBlocks,
									},
								},
							),
						);
					}

					if (addedBlocks.length >= maxTrackedBlocks) {
						return yield* Effect.fail(
							toBlockStreamError(
								"watch",
								`Unrecoverable reorg: depth ${addedBlocks.length} exceeds tracked history of ${maxTrackedBlocks} blocks`,
								{
									context: {
										chainHead,
										blockNumber: block.block_number,
										maxTrackedBlocks,
									},
								},
							),
						);
					}

					const previousBlock = yield* getBlockByNumber(
						cursor,
						include,
						requestOptions,
					).pipe(
						Effect.mapError(
							mapRequestError("watch", {
								operation: "resolveReorg",
								blockNumber: cursor,
								include,
							}),
						),
					);
					addedBlocks.push(previousBlock);
					parentHash = previousBlock.parent_hash;
					cursor = previousBlock.block_number - 1;
				}

				const commonAncestor = trackedByHash.get(parentHash);
				if (!commonAncestor) {
					return yield* Effect.fail(
						toBlockStreamError(
							"watch",
							"Reorg ancestor lookup failed unexpectedly",
							{
								context: {
									chainHead,
									parentHash,
								},
							},
						),
					);
				}

				const added = [...addedBlocks].reverse();
				const removed = tracked
					.filter(
						(candidate) => candidate.block_number > commonAncestor.block_number,
					)
					.slice()
					.reverse();
				const retained = tracked.filter(
					(candidate) => candidate.block_number <= commonAncestor.block_number,
				);

				const nextTracked = trimTracked(
					[...retained, ...added.map((candidate) => toLightBlock(candidate))],
					maxTrackedBlocks,
				);

				return {
					event: {
						type: "reorg",
						removed,
						added,
						commonAncestor,
						metadata: { chainHead },
					},
					nextTracked,
				} as const;
			});

		const backfill: BlockStreamServiceShape["backfill"] = <
			TInclude extends BlockStreamInclude = "header",
		>(
			options: BackfillBlocksOptions<TInclude>,
		): Stream.Stream<BlocksEvent<TInclude>, BlockStreamError> => {
			const include = options.include ?? ("header" as TInclude);
			const chunkSize = options.chunkSize ?? 25;

			if (!isNonNegativeInteger(options.fromBlock)) {
				return Stream.fail(
					toBlockStreamError(
						"backfill",
						"fromBlock must be a non-negative integer",
						{
							context: { fromBlock: options.fromBlock },
						},
					),
				);
			}

			if (!isNonNegativeInteger(options.toBlock)) {
				return Stream.fail(
					toBlockStreamError(
						"backfill",
						"toBlock must be a non-negative integer",
						{
							context: { toBlock: options.toBlock },
						},
					),
				);
			}

			if (options.toBlock < options.fromBlock) {
				return Stream.fail(
					toBlockStreamError(
						"backfill",
						"toBlock must be greater than or equal to fromBlock",
						{
							context: {
								fromBlock: options.fromBlock,
								toBlock: options.toBlock,
							},
						},
					),
				);
			}

			if (!isPositiveInteger(chunkSize)) {
				return Stream.fail(
					toBlockStreamError(
						"backfill",
						"chunkSize must be a positive integer",
						{
							context: { chunkSize },
						},
					),
				);
			}

			const chunkStarts: number[] = [];
			for (
				let start = options.fromBlock;
				start <= options.toBlock;
				start += chunkSize
			) {
				chunkStarts.push(start);
			}

			return Stream.fromIterable(chunkStarts).pipe(
				Stream.mapEffect((startBlock) =>
					Effect.gen(function* () {
						const endBlock = Math.min(
							startBlock + chunkSize - 1,
							options.toBlock,
						);
						const blocks = yield* Effect.forEach(
							range(startBlock, endBlock),
							(blockNumber) =>
								getBlockByNumber(
									blockNumber,
									include,
									options.requestOptions,
								).pipe(
									Effect.mapError(
										mapRequestError("backfill", {
											blockNumber,
											include,
										}),
									),
								),
						);

						return {
							type: "blocks",
							blocks,
							metadata: { chainHead: endBlock },
						} satisfies BlocksEvent<TInclude>;
					}),
				),
			);
		};

		const watch: BlockStreamServiceShape["watch"] = <
			TInclude extends BlockStreamInclude = "header",
		>(
			options?: WatchBlocksOptions<TInclude>,
		): Stream.Stream<BlockStreamEvent<TInclude>, BlockStreamError> =>
			Stream.unwrap(
				Effect.gen(function* () {
					const include = options?.include ?? ("header" as TInclude);
					const pollInterval = Duration.decode(
						options?.pollInterval ?? "3 seconds",
					);
					const maxTrackedBlocks = Math.max(options?.maxTrackedBlocks ?? 64, 2);

					if (
						options?.fromBlock !== undefined &&
						!isNonNegativeInteger(options.fromBlock)
					) {
						return Stream.fail(
							toBlockStreamError(
								"watch",
								"fromBlock must be a non-negative integer",
								{
									context: { fromBlock: options.fromBlock },
								},
							),
						);
					}

					const firstPollRef = yield* Ref.make(true);
					const cursorRef = yield* Ref.make<number | undefined>(
						options?.fromBlock,
					);
					const trackedRef = yield* Ref.make<readonly LightBlock[]>([]);

					const poll = Effect.gen(function* () {
						const firstPoll = yield* Ref.get(firstPollRef);
						if (firstPoll) {
							yield* Ref.set(firstPollRef, false);
						} else {
							yield* Effect.sleep(pollInterval);
						}

						const chainHead = yield* getBlockNumber(
							options?.requestOptions,
						).pipe(
							Effect.mapError(
								mapRequestError("watch", {
									operation: "getBlockNumber",
								}),
							),
						);

						const currentCursor = yield* Ref.get(cursorRef);
						const startBlock = currentCursor ?? chainHead;

						if (currentCursor === undefined) {
							yield* Ref.set(cursorRef, startBlock);
						}

						if (startBlock > chainHead) {
							return [] as const;
						}

						const blockNumbers = range(startBlock, chainHead);
						const events: BlockStreamEvent<TInclude>[] = [];
						let tracked = yield* Ref.get(trackedRef);

						for (const blockNumber of blockNumbers) {
							const block = yield* getBlockByNumber(
								blockNumber,
								include,
								options?.requestOptions,
							).pipe(
								Effect.mapError(
									mapRequestError("watch", {
										operation: "getBlockByNumber",
										blockNumber,
										include,
									}),
								),
							);

							const trackedHead = tracked[tracked.length - 1];
							if (
								!trackedHead ||
								trackedHead.block_hash === block.parent_hash
							) {
								tracked = trimTracked(
									[...tracked, toLightBlock(block)],
									maxTrackedBlocks,
								);
								events.push({
									type: "blocks",
									blocks: [block],
									metadata: { chainHead },
								});
								continue;
							}

							const resolvedReorg = yield* resolveReorg(
								block,
								tracked,
								chainHead,
								include,
								maxTrackedBlocks,
								options?.requestOptions,
							);
							tracked = resolvedReorg.nextTracked;
							events.push(resolvedReorg.event);
						}

						yield* Ref.set(trackedRef, tracked);
						yield* Ref.set(cursorRef, chainHead + 1);

						return events;
					});

					return Stream.repeatEffect(poll).pipe(
						Stream.flatMap((events) => Stream.fromIterable(events)),
					);
				}),
			);

		return {
			backfill,
			watch,
		} satisfies BlockStreamServiceShape;
	}),
);
