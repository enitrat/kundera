import type { Felt252Type } from "@kundera-sn/kundera-ts";
import {
	type BlockWithTxs,
	type NewHead,
	type PendingTransaction,
	type PreConfirmedBlockWithTxs,
	type ReorgData,
	Rpc,
	type TransactionStatus,
	type TxnReceiptWithBlockInfo,
	type TxnWithHash,
} from "@kundera-sn/kundera-ts/jsonrpc";
import {
	WebSocketProvider,
	type WebSocketProviderOptions,
} from "@kundera-sn/kundera-ts/provider";
import { Context, Effect, Either, Layer, Ref, Stream } from "effect";
import * as Duration from "effect/Duration";

import {
	type RpcError,
	TransactionStreamError,
	type TransportError,
} from "../errors.js";
import { ProviderService } from "./ProviderService.js";
import type { RequestOptions } from "./TransportService.js";

export interface TransactionStreamFilter {
	readonly senderAddress?: string | readonly string[];
	readonly types?: readonly TxnWithHash["type"][];
}

export interface PendingTransactionEvent {
	readonly type: "pending";
	readonly transaction: TxnWithHash;
}

export interface ConfirmedTransactionEvent {
	readonly type: "confirmed";
	readonly transaction: TxnWithHash;
	readonly blockNumber: number;
	readonly blockHash: string;
	readonly confirmations: number;
}

export interface TrackedPendingTransactionEvent {
	readonly type: "pending";
	readonly transactionHash: string;
	readonly pollCount: number;
	readonly status?: TransactionStatus;
}

export interface TrackedConfirmedTransactionEvent {
	readonly type: "confirmed";
	readonly transactionHash: string;
	readonly receipt: TxnReceiptWithBlockInfo;
	readonly confirmations: number;
	readonly transaction?: TxnWithHash;
}

export interface DroppedTransactionEvent {
	readonly type: "dropped";
	readonly transactionHash: string;
	readonly reason: string;
}

export type TransactionTrackEvent =
	| TrackedPendingTransactionEvent
	| TrackedConfirmedTransactionEvent
	| DroppedTransactionEvent;

export interface TransactionStreamReadOptions {
	readonly requestOptions?: RequestOptions;
}

export interface TransactionStreamWebSocketOptions {
	readonly url: string;
	readonly providerOptions?: Omit<WebSocketProviderOptions, "url">;
}

export interface WatchPendingTransactionsOptions
	extends TransactionStreamReadOptions {
	readonly filter?: TransactionStreamFilter;
	readonly streamMode?: "polling" | "websocket";
	readonly websocket?: TransactionStreamWebSocketOptions;
	readonly pollInterval?: Duration.DurationInput;
	readonly maxSeenTransactions?: number;
}

export interface WatchConfirmedTransactionsOptions
	extends TransactionStreamReadOptions {
	readonly filter?: TransactionStreamFilter;
	readonly confirmations?: number;
	readonly fromBlock?: number;
	readonly streamMode?: "polling" | "websocket";
	readonly websocket?: TransactionStreamWebSocketOptions;
	readonly pollInterval?: Duration.DurationInput;
	readonly maxSeenTransactions?: number;
}

export interface TrackTransactionOptions extends TransactionStreamReadOptions {
	readonly confirmations?: number;
	readonly pollInterval?: Duration.DurationInput;
	readonly maxPendingPolls?: number;
}

export interface TransactionStreamServiceShape {
	readonly watchPending: (
		options?: WatchPendingTransactionsOptions,
	) => Stream.Stream<PendingTransactionEvent, TransactionStreamError>;

	readonly watchConfirmed: (
		options?: WatchConfirmedTransactionsOptions,
	) => Stream.Stream<ConfirmedTransactionEvent, TransactionStreamError>;

	readonly track: (
		txHash: Felt252Type | string,
		options?: TrackTransactionOptions,
	) => Stream.Stream<TransactionTrackEvent, TransactionStreamError>;
}

export class TransactionStreamService extends Context.Tag(
	"@kundera/TransactionStreamService",
)<TransactionStreamService, TransactionStreamServiceShape>() {}

interface SeenState {
	readonly order: readonly string[];
	readonly set: ReadonlySet<string>;
}

const emptySeenState = (): SeenState => ({
	order: [],
	set: new Set<string>(),
});

const BLOCK_NOT_FOUND_CODE: RpcError["code"] = 24;
const INVALID_TRANSACTION_HASH_CODE: RpcError["code"] = 25;
const TRANSACTION_HASH_NOT_FOUND_CODE: RpcError["code"] = 29;

const RECEIPT_NOT_READY_CODES = new Set<number>([
	BLOCK_NOT_FOUND_CODE,
	INVALID_TRANSACTION_HASH_CODE,
	TRANSACTION_HASH_NOT_FOUND_CODE,
]);

const errorMessageOf = (error: TransportError | RpcError): string =>
	"message" in error && typeof error.message === "string"
		? error.message
		: "Provider request failed";

const rpcErrorCodeOf = (error: RpcError): number | undefined =>
	"code" in error && typeof error.code === "number" ? error.code : undefined;

const isRpcError = (error: TransportError | RpcError): error is RpcError =>
	"_tag" in error && error._tag === "RpcError";

const isPendingReceiptError = (error: RpcError): boolean => {
	const code = rpcErrorCodeOf(error);
	if (code !== undefined && RECEIPT_NOT_READY_CODES.has(code)) {
		return true;
	}

	const message = errorMessageOf(error).toLowerCase();
	return (
		message.includes("not found") ||
		message.includes("not received") ||
		message.includes("pending")
	);
};

const isTransactionLookupMiss = (error: RpcError): boolean => {
	const code = rpcErrorCodeOf(error);
	if (
		code === BLOCK_NOT_FOUND_CODE ||
		code === INVALID_TRANSACTION_HASH_CODE ||
		code === TRANSACTION_HASH_NOT_FOUND_CODE
	) {
		return true;
	}

	const message = errorMessageOf(error).toLowerCase();
	return (
		message.includes("not found") ||
		message.includes("unknown transaction")
	);
};

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

const toTransactionHash = (hash: Felt252Type | string): string =>
	typeof hash === "string" ? hash : hash.toHex();

const senderAddressOf = (transaction: TxnWithHash): string | undefined => {
	if (
		"sender_address" in transaction &&
		typeof transaction.sender_address === "string"
	) {
		return transaction.sender_address;
	}
	return undefined;
};

const matchesFilter = (
	transaction: TxnWithHash,
	filter?: TransactionStreamFilter,
): boolean => {
	if (!filter) {
		return true;
	}

	if (
		filter.types &&
		filter.types.length > 0 &&
		!filter.types.includes(transaction.type)
	) {
		return false;
	}

	if (filter.senderAddress !== undefined) {
		const sender = senderAddressOf(transaction);
		if (!sender) {
			return false;
		}

		const accepted = Array.isArray(filter.senderAddress)
			? filter.senderAddress
			: [filter.senderAddress];
		if (!accepted.includes(sender)) {
			return false;
		}
	}

	return true;
};

const toTransactionStreamError = (
	operation: string,
	message: string,
	options?: {
		readonly cause?: unknown;
		readonly context?: Record<string, unknown>;
	},
): TransactionStreamError =>
	new TransactionStreamError({
		operation,
		message,
		cause: options?.cause,
		context: options?.context,
	});

const mapRequestError =
	(operation: string, context?: Record<string, unknown>) =>
	(cause: TransportError | RpcError): TransactionStreamError =>
		toTransactionStreamError(operation, errorMessageOf(cause), {
			cause,
			context,
		});

const isReorgData = (
	payload: PendingTransaction | NewHead | ReorgData,
): payload is ReorgData =>
	"starting_block_number" in payload && "ending_block_number" in payload;

const dedupeById = <T>(
	items: readonly T[],
	toId: (item: T) => string,
	maxSeenItems: number,
	seenRef: Ref.Ref<SeenState>,
): Effect.Effect<readonly T[]> =>
	Ref.modify(seenRef, (state) => {
		const nextOrder = [...state.order];
		const nextSet = new Set(state.set);
		const fresh: T[] = [];

		for (const item of items) {
			const id = toId(item);
			if (nextSet.has(id)) {
				continue;
			}

			fresh.push(item);
			nextOrder.push(id);
			nextSet.add(id);
		}

		while (nextOrder.length > maxSeenItems) {
			const removed = nextOrder.shift();
			if (removed) {
				nextSet.delete(removed);
			}
		}

		return [
			fresh,
			{
				order: nextOrder,
				set: nextSet,
			},
		] as const;
	});

export const TransactionStreamLive: Layer.Layer<
	TransactionStreamService,
	never,
	ProviderService
> = Layer.effect(
	TransactionStreamService,
	Effect.gen(function* () {
		const provider = yield* ProviderService;

		const getBlockNumber = (
			requestOptions?: RequestOptions,
		): Effect.Effect<number, TransportError | RpcError> => {
			const { method, params } = Rpc.BlockNumberRequest();
			return provider.request<number>(method, params, requestOptions);
		};

		const getPendingBlock = (
			requestOptions?: RequestOptions,
		): Effect.Effect<PreConfirmedBlockWithTxs, TransportError | RpcError> => {
			const { method, params } = Rpc.GetBlockWithTxsRequest("pending");
			return provider.request<PreConfirmedBlockWithTxs>(
				method,
				params,
				requestOptions,
			);
		};

		const getBlockByNumber = (
			blockNumber: number,
			requestOptions?: RequestOptions,
		): Effect.Effect<
			BlockWithTxs | PreConfirmedBlockWithTxs,
			TransportError | RpcError
		> => {
			const { method, params } = Rpc.GetBlockWithTxsRequest({
				block_number: blockNumber,
			});
			return provider.request<BlockWithTxs | PreConfirmedBlockWithTxs>(
				method,
				params,
				requestOptions,
			);
		};

		const getTransactionReceipt = (
			transactionHash: string,
			requestOptions?: RequestOptions,
		): Effect.Effect<TxnReceiptWithBlockInfo, TransportError | RpcError> => {
			const { method, params } = Rpc.GetTransactionReceiptRequest(transactionHash);
			return provider.request<TxnReceiptWithBlockInfo>(
				method,
				params,
				requestOptions,
			);
		};

		const getTransactionStatus = (
			transactionHash: string,
			requestOptions?: RequestOptions,
		): Effect.Effect<TransactionStatus, TransportError | RpcError> => {
			const { method, params } = Rpc.GetTransactionStatusRequest(transactionHash);
			return provider.request<TransactionStatus>(method, params, requestOptions);
		};

		const getTransactionByHash = (
			transactionHash: string,
			requestOptions?: RequestOptions,
		): Effect.Effect<TxnWithHash, TransportError | RpcError> => {
			const { method, params } = Rpc.GetTransactionByHashRequest(transactionHash);
			return provider.request<TxnWithHash>(method, params, requestOptions);
		};

		const createWebSocketProviderStream = (
			operation: "watchPending" | "watchConfirmed",
			websocket: TransactionStreamWebSocketOptions,
		): Stream.Stream<WebSocketProvider, TransactionStreamError> =>
			Stream.acquireRelease(
				Effect.tryPromise({
					try: async () => {
						const nextProvider = new WebSocketProvider({
							url: websocket.url,
							...(websocket.providerOptions ?? {}),
						});
						await nextProvider.connect();
						return nextProvider;
					},
					catch: (cause) =>
						toTransactionStreamError(
							operation,
							"Failed to connect websocket provider",
							{
								cause,
								context: { url: websocket.url },
							},
						),
				}),
				(nextProvider) =>
					Effect.sync(() => {
						nextProvider.disconnect();
					}).pipe(Effect.orDie),
			);

		const watchPending: TransactionStreamServiceShape["watchPending"] = (
			options,
		) =>
			Stream.unwrap(
				Effect.gen(function* () {
					const streamMode = options?.streamMode ?? "polling";
					const maxSeenTransactions = Math.max(
						options?.maxSeenTransactions ?? 20_000,
						1,
					);
					const seenRef = yield* Ref.make<SeenState>(emptySeenState());

					if (streamMode === "websocket") {
						const websocket = options?.websocket;
						if (!websocket?.url) {
							return Stream.fail(
								toTransactionStreamError(
									"watchPending",
									"websocket.url is required when streamMode is websocket",
								),
							);
						}

						const senderAddress =
							options?.filter?.senderAddress === undefined
								? undefined
								: Array.isArray(options.filter.senderAddress)
									? [...options.filter.senderAddress]
									: [options.filter.senderAddress];
						const subscriptionParams =
							senderAddress && senderAddress.length > 0
								? ({ sender_address: senderAddress } as const)
								: undefined;

						return createWebSocketProviderStream(
							"watchPending",
							websocket,
						).pipe(
							Stream.flatMap((wsProvider) =>
								Stream.fromAsyncIterable(
									wsProvider.events.pendingTransactions(subscriptionParams),
									(cause) =>
										toTransactionStreamError(
											"watchPending",
											"WebSocket pendingTransactions stream failed",
											{
												cause,
												context: { url: websocket.url },
											},
										),
								),
							),
							Stream.mapEffect((notification) =>
								Effect.gen(function* () {
									if (isReorgData(notification)) {
										yield* Ref.set(seenRef, emptySeenState());
										return [] as const;
									}

									if (typeof notification.transaction_hash !== "string") {
										return [] as const;
									}

									const fresh = yield* dedupeById(
										[notification],
										(candidate) => candidate.transaction_hash,
										maxSeenTransactions,
										seenRef,
									);
									const candidate = fresh[0];
									if (!candidate) {
										return [] as const;
									}

									const transactionResult = yield* getTransactionByHash(
										candidate.transaction_hash,
										options?.requestOptions,
									).pipe(Effect.either);

									if (Either.isLeft(transactionResult)) {
										const failure = transactionResult.left;
										if (
											isRpcError(failure) &&
											isTransactionLookupMiss(failure)
										) {
											return [] as const;
										}

										return yield* Effect.fail(
											toTransactionStreamError(
												"watchPending",
												errorMessageOf(failure),
												{
													cause: failure,
													context: {
														operation: "getTransactionByHash",
														transactionHash: candidate.transaction_hash,
													},
												},
											),
										);
									}

									const transaction = transactionResult.right;
									if (!matchesFilter(transaction, options?.filter)) {
										return [] as const;
									}

									return [
										{
											type: "pending",
											transaction,
										} satisfies PendingTransactionEvent,
									] as const;
								}),
							),
							Stream.flatMap((events) => Stream.fromIterable(events)),
						);
					}

					const pollInterval = Duration.decode(options?.pollInterval ?? "3 seconds");
					const firstPollRef = yield* Ref.make(true);
					const poll = Effect.gen(function* () {
						const firstPoll = yield* Ref.get(firstPollRef);
						if (firstPoll) {
							yield* Ref.set(firstPollRef, false);
						} else {
							yield* Effect.sleep(pollInterval);
						}

						const block = yield* getPendingBlock(options?.requestOptions).pipe(
							Effect.mapError(
								mapRequestError("watchPending", {
									operation: "getPendingBlock",
								}),
							),
						);

						const candidates = block.transactions.filter((transaction) =>
							matchesFilter(transaction, options?.filter),
						);
						const freshTransactions = yield* dedupeById(
							candidates,
							(transaction) => transaction.transaction_hash,
							maxSeenTransactions,
							seenRef,
						);

						return freshTransactions.map((transaction) => ({
							type: "pending",
							transaction,
						})) as readonly PendingTransactionEvent[];
					});

					return Stream.repeatEffect(poll).pipe(
						Stream.flatMap((events) => Stream.fromIterable(events)),
					);
				}),
			);

		const watchConfirmed: TransactionStreamServiceShape["watchConfirmed"] = (
			options,
		) =>
			Stream.unwrap(
				Effect.gen(function* () {
					const streamMode = options?.streamMode ?? "polling";
					const confirmations = Math.max(options?.confirmations ?? 1, 1);
					const maxSeenTransactions = Math.max(
						options?.maxSeenTransactions ?? 20_000,
						1,
					);

					if (
						options?.fromBlock !== undefined &&
						!isNonNegativeInteger(options.fromBlock)
					) {
						return Stream.fail(
							toTransactionStreamError(
								"watchConfirmed",
								"fromBlock must be a non-negative integer",
								{
									context: { fromBlock: options.fromBlock },
								},
							),
						);
					}

					const cursorRef = yield* Ref.make<number | undefined>(
						options?.fromBlock,
					);
					const seenRef = yield* Ref.make<SeenState>(emptySeenState());

					const collectConfirmedEventsForRange = (
						startBlock: number,
						confirmedHead: number,
						chainHead: number,
					): Effect.Effect<
						readonly ConfirmedTransactionEvent[],
						TransactionStreamError
					> =>
						Effect.gen(function* () {
							const candidates: {
								readonly transaction: TxnWithHash;
								readonly blockNumber: number;
								readonly blockHash: string;
								readonly confirmations: number;
							}[] = [];

							for (const blockNumber of range(startBlock, confirmedHead)) {
								const block = yield* getBlockByNumber(
									blockNumber,
									options?.requestOptions,
								).pipe(
									Effect.mapError(
										mapRequestError("watchConfirmed", {
											operation: "getBlockByNumber",
											blockNumber,
										}),
									),
								);

								for (const transaction of block.transactions) {
									if (!matchesFilter(transaction, options?.filter)) {
										continue;
									}

									candidates.push({
										transaction,
										blockNumber: block.block_number,
										blockHash: block.block_hash,
										confirmations: Math.max(chainHead - block.block_number + 1, 0),
									});
								}
							}

							const freshCandidates = yield* dedupeById(
								candidates,
								(candidate) => candidate.transaction.transaction_hash,
								maxSeenTransactions,
								seenRef,
							);

							return freshCandidates.map((candidate) => ({
								type: "confirmed",
								transaction: candidate.transaction,
								blockNumber: candidate.blockNumber,
								blockHash: candidate.blockHash,
								confirmations: candidate.confirmations,
							})) as readonly ConfirmedTransactionEvent[];
						});

					if (streamMode === "websocket") {
						const websocket = options?.websocket;
						if (!websocket?.url) {
							return Stream.fail(
								toTransactionStreamError(
									"watchConfirmed",
									"websocket.url is required when streamMode is websocket",
								),
							);
						}

						const subscriptionParams =
							options?.fromBlock !== undefined
								? ({ block_id: { block_number: options.fromBlock } } as const)
								: undefined;

						return createWebSocketProviderStream(
							"watchConfirmed",
							websocket,
						).pipe(
							Stream.flatMap((wsProvider) =>
								Stream.fromAsyncIterable(
									wsProvider.events.newHeads(subscriptionParams),
									(cause) =>
										toTransactionStreamError(
											"watchConfirmed",
											"WebSocket newHeads stream failed",
											{
												cause,
												context: { url: websocket.url },
											},
										),
								),
							),
							Stream.mapEffect((notification) =>
								Effect.gen(function* () {
									if (isReorgData(notification)) {
										const resetCursor =
											options?.fromBlock !== undefined
												? Math.max(
														options.fromBlock,
														notification.starting_block_number,
													)
												: notification.starting_block_number;
										yield* Ref.set(cursorRef, resetCursor);
										yield* Ref.set(seenRef, emptySeenState());
										return [] as const;
									}

									const chainHead = notification.block_number;
									const confirmedHead = chainHead - confirmations + 1;
									if (confirmedHead < 0) {
										return [] as const;
									}

									const currentCursor = yield* Ref.get(cursorRef);
									const startBlock =
										currentCursor ?? options?.fromBlock ?? confirmedHead;
									if (currentCursor === undefined) {
										yield* Ref.set(cursorRef, startBlock);
									}

									if (startBlock > confirmedHead) {
										return [] as const;
									}

									const events = yield* collectConfirmedEventsForRange(
										startBlock,
										confirmedHead,
										chainHead,
									);
									yield* Ref.set(cursorRef, confirmedHead + 1);

									return events;
								}),
							),
							Stream.flatMap((events) => Stream.fromIterable(events)),
						);
					}

					const pollInterval = Duration.decode(options?.pollInterval ?? "3 seconds");
					const firstPollRef = yield* Ref.make(true);
					const poll = Effect.gen(function* () {
						const firstPoll = yield* Ref.get(firstPollRef);
						if (firstPoll) {
							yield* Ref.set(firstPollRef, false);
						} else {
							yield* Effect.sleep(pollInterval);
						}

						const chainHead = yield* getBlockNumber(options?.requestOptions).pipe(
							Effect.mapError(
								mapRequestError("watchConfirmed", {
									operation: "getBlockNumber",
								}),
							),
						);

						const confirmedHead = chainHead - confirmations + 1;
						if (confirmedHead < 0) {
							return [] as const;
						}

						const currentCursor = yield* Ref.get(cursorRef);
						const startBlock = currentCursor ?? confirmedHead;
						if (currentCursor === undefined) {
							yield* Ref.set(cursorRef, startBlock);
						}

						if (startBlock > confirmedHead) {
							return [] as const;
						}

						const events = yield* collectConfirmedEventsForRange(
							startBlock,
							confirmedHead,
							chainHead,
						);
						yield* Ref.set(cursorRef, confirmedHead + 1);

						return events;
					});

					return Stream.repeatEffect(poll).pipe(
						Stream.flatMap((events) => Stream.fromIterable(events)),
					);
				}),
			);

		const track: TransactionStreamServiceShape["track"] = (txHash, options) =>
			Stream.unwrap(
				Effect.gen(function* () {
					const transactionHash = toTransactionHash(txHash);
					const confirmations = Math.max(options?.confirmations ?? 1, 1);
					const pollInterval = Duration.decode(options?.pollInterval ?? "3 seconds");
					const maxPendingPolls = options?.maxPendingPolls;

					if (
						maxPendingPolls !== undefined &&
						!isPositiveInteger(maxPendingPolls)
					) {
						return Stream.fail(
							toTransactionStreamError(
								"track",
								"maxPendingPolls must be a positive integer",
								{
									context: { maxPendingPolls },
								},
							),
						);
					}

					const firstPollRef = yield* Ref.make(true);
					const pollCountRef = yield* Ref.make(0);

					const pendingOrDropped = (
						pollCount: number,
						status?: TransactionStatus,
					): {
						readonly events: readonly TransactionTrackEvent[];
						readonly done: boolean;
					} => {
						if (maxPendingPolls !== undefined && pollCount >= maxPendingPolls) {
							return {
								events: [
									{
										type: "dropped",
										transactionHash,
										reason: `Transaction not confirmed after ${maxPendingPolls} polls`,
									},
								],
								done: true,
							};
						}

						return {
							events: [
								{
									type: "pending",
									transactionHash,
									pollCount,
									status,
								},
							],
							done: false,
						};
					};

					const poll = Effect.gen(function* () {
						const firstPoll = yield* Ref.get(firstPollRef);
						if (firstPoll) {
							yield* Ref.set(firstPollRef, false);
						} else {
							yield* Effect.sleep(pollInterval);
						}

						const pollCount = yield* Ref.updateAndGet(
							pollCountRef,
							(count) => count + 1,
						);
						const receiptResult = yield* getTransactionReceipt(
							transactionHash,
							options?.requestOptions,
						).pipe(Effect.either);

						if (Either.isRight(receiptResult)) {
							const receipt = receiptResult.right;
							const blockNumber = receipt.block_number;

							if (typeof blockNumber !== "number") {
								return pendingOrDropped(pollCount, {
									finality_status: receipt.finality_status,
									execution_status: receipt.execution_status,
									failure_reason: receipt.revert_reason,
								});
							}

							const chainHead = yield* getBlockNumber(options?.requestOptions).pipe(
								Effect.mapError(
									mapRequestError("track", {
										operation: "getBlockNumber",
										transactionHash,
									}),
								),
							);
							const observedConfirmations = Math.max(chainHead - blockNumber + 1, 0);

							if (observedConfirmations < confirmations) {
								return pendingOrDropped(pollCount, {
									finality_status: receipt.finality_status,
									execution_status: receipt.execution_status,
									failure_reason: receipt.revert_reason,
								});
							}

							const transactionResult = yield* getTransactionByHash(
								transactionHash,
								options?.requestOptions,
							).pipe(Effect.either);

							return {
								events: [
									{
										type: "confirmed",
										transactionHash,
										receipt,
										confirmations: observedConfirmations,
										transaction: Either.isRight(transactionResult)
											? transactionResult.right
											: undefined,
									},
								],
								done: true,
							} as const;
						}

						const failure = receiptResult.left;
						if (isRpcError(failure) && isPendingReceiptError(failure)) {
							const statusResult = yield* getTransactionStatus(
								transactionHash,
								options?.requestOptions,
							).pipe(Effect.either);

							return pendingOrDropped(
								pollCount,
								Either.isRight(statusResult) ? statusResult.right : undefined,
							);
						}

						return yield* Effect.fail(
							toTransactionStreamError("track", errorMessageOf(failure), {
								cause: failure,
								context: { transactionHash },
							}),
						);
					});

					return Stream.repeatEffect(poll).pipe(
						Stream.takeUntil((state) => state.done),
						Stream.flatMap((state) => Stream.fromIterable(state.events)),
					);
				}),
			);

		return {
			watchPending,
			watchConfirmed,
			track,
		} satisfies TransactionStreamServiceShape;
	}),
);
