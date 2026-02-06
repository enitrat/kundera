/**
 * WebSocket Transport
 *
 * JSON-RPC transport over WebSocket with reconnection and subscription support.
 *
 * @module transport/websocket
 */

import {
	type EventTransport,
	type TransportEvents,
	type JsonRpcRequest,
	type JsonRpcResponse,
	type TransportRequestOptions,
	JsonRpcErrorCode,
	createErrorResponse,
} from "./types.js";
import type { WsNotificationPayload } from "../jsonrpc/types.js";

// ============ WebSocket Transport Options ============

/**
 * WebSocket transport configuration
 */
export interface WebSocketTransportOptions {
	/** WebSocket protocols */
	protocols?: string | string[];
	/** Auto-reconnect on disconnect (default: true) */
	reconnect?: boolean;
	/** Reconnect delay in ms (default: 1000) */
	reconnectDelay?: number;
	/** Max reconnect attempts, 0 = infinite (default: 0) */
	maxReconnectAttempts?: number;
	/** Keep-alive interval in ms, 0 = disabled (default: 30000) */
	keepAlive?: number;
	/** Request timeout in ms (default: 30000) */
	timeout?: number;
}

// ============ Internal Types ============

interface PendingRequest {
	resolve: (response: JsonRpcResponse) => void;
	reject: (error: Error) => void;
	timeoutId: ReturnType<typeof setTimeout>;
}

type EventListener<E extends keyof TransportEvents> = (
	...args: TransportEvents[E]
) => void;

// ============ WebSocket Transport Implementation ============

/**
 * Create a WebSocket transport for JSON-RPC communication
 *
 * Features:
 * - Automatic reconnection with configurable backoff
 * - Keep-alive ping
 * - Subscription message handling
 * - Event emitter for connect/disconnect/error/message
 *
 * @example
 * ```ts
 * const transport = webSocketTransport('wss://starknet.example.com', {
 *   reconnect: true,
 *   keepAlive: 30000
 * });
 *
 * await transport.connect();
 *
 * transport.on('message', (data) => {
 *   console.log('Subscription message:', data);
 * });
 * ```
 */
export function webSocketTransport(
	url: string,
	options: WebSocketTransportOptions = {},
): WebSocketTransport {
	const {
		protocols,
		reconnect = true,
		reconnectDelay = 1000,
		maxReconnectAttempts = 0,
		keepAlive = 30000,
		timeout = 30000,
	} = options;

	let ws: WebSocket | null = null;
	let isConnected = false;
	let reconnectAttempts = 0;
	let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	let keepAliveInterval: ReturnType<typeof setInterval> | null = null;
	let requestIdCounter = 0;
	let shouldReconnect = reconnect;

	const pendingRequests = new Map<number | string, PendingRequest>();
	const subscriptions = new Map<
		string,
		Set<(data: WsNotificationPayload) => void>
	>();
	const eventListeners: Map<
		keyof TransportEvents,
		Set<EventListener<keyof TransportEvents>>
	> = new Map();

	/**
	 * Emit event to listeners
	 */
	function emit<E extends keyof TransportEvents>(
		event: E,
		...args: TransportEvents[E]
	): void {
		const listeners = eventListeners.get(event);
		if (listeners) {
			for (const listener of listeners) {
				(listener as EventListener<E>)(...args);
			}
		}
	}

	/**
	 * Start keep-alive ping
	 */
	function startKeepAlive(): void {
		if (keepAlive <= 0) return;
		keepAliveInterval = setInterval(() => {
			if (ws?.readyState === WebSocket.OPEN) {
				// Send a lightweight request as ping
				ws.send(
					JSON.stringify({
						jsonrpc: "2.0",
						id: `ping-${Date.now()}`,
						method: "starknet_chainId",
						params: [],
					}),
				);
			}
		}, keepAlive);
	}

	/**
	 * Stop keep-alive ping
	 */
	function stopKeepAlive(): void {
		if (keepAliveInterval) {
			clearInterval(keepAliveInterval);
			keepAliveInterval = null;
		}
	}

	/**
	 * Handle incoming WebSocket message
	 */
	function handleMessage(data: string): void {
		let message: unknown;
		try {
			message = JSON.parse(data);
		} catch {
			emit("error", new Error("Failed to parse WebSocket message"));
			return;
		}

		// Handle subscription notifications
		if (
			typeof message === "object" &&
			message !== null &&
			"method" in message &&
			(message as { method: string }).method.startsWith("starknet_subscription")
		) {
			const params = (message as { params?: unknown }).params as
				| { subscription_id?: string; subscription?: string; result?: unknown }
				| undefined;
			const subscriptionId = params?.subscription_id ?? params?.subscription;
			if (subscriptionId && subscriptions.has(subscriptionId)) {
				const callbacks = subscriptions.get(subscriptionId)!;
				for (const callback of callbacks) {
					callback(params?.result as WsNotificationPayload);
				}
			}
			emit("message", message);
			return;
		}

		// Handle RPC responses
		const response = message as JsonRpcResponse;
		if ("id" in response && response.id !== null) {
			const pending = pendingRequests.get(response.id);
			if (pending) {
				clearTimeout(pending.timeoutId);
				pendingRequests.delete(response.id);
				pending.resolve(response);
			}
		}
	}

	/**
	 * Attempt reconnection
	 */
	function scheduleReconnect(): void {
		if (!shouldReconnect) return;
		if (maxReconnectAttempts > 0 && reconnectAttempts >= maxReconnectAttempts) {
			emit("error", new Error("Max reconnection attempts reached"));
			return;
		}

		reconnectAttempts++;
		const delay = reconnectDelay * Math.pow(1.5, reconnectAttempts - 1);

		reconnectTimeout = setTimeout(() => {
			transport.connect().catch((error) => {
				emit("error", error as Error);
				scheduleReconnect();
			});
		}, delay);
	}

	/**
	 * Resubscribe after reconnection
	 */
	async function resubscribe(): Promise<void> {
		// Subscriptions are keyed by subscription_id from server
		// After reconnect, we need to re-establish them
		// The callbacks are preserved, but we need new subscription_ids
		// This is handled by the provider layer which tracks subscription params
	}

	const transport: WebSocketTransport = {
		type: "websocket",

		get connected(): boolean {
			return isConnected;
		},

		async connect(): Promise<void> {
			if (typeof globalThis.WebSocket === "undefined") {
				throw new Error(
					"WebSocket is not available. For Node.js, install ws and assign to globalThis.WebSocket",
				);
			}

			return new Promise((resolve, reject) => {
				ws = new WebSocket(url, protocols);

				ws.onopen = () => {
					isConnected = true;
					reconnectAttempts = 0;
					if (reconnectTimeout) {
						clearTimeout(reconnectTimeout);
						reconnectTimeout = null;
					}
					startKeepAlive();
					emit("connect");
					resubscribe().catch(() => {});
					resolve();
				};

				ws.onmessage = (event) => {
					handleMessage(event.data as string);
				};

				ws.onerror = () => {
					const error = new Error("WebSocket error");
					if (!isConnected) {
						reject(error);
					}
					emit("error", error);
				};

				ws.onclose = () => {
					const wasConnected = isConnected;
					isConnected = false;
					stopKeepAlive();

					// Reject all pending requests
					for (const [id, pending] of pendingRequests) {
						clearTimeout(pending.timeoutId);
						pending.resolve(
							createErrorResponse(
								id,
								JsonRpcErrorCode.InternalError,
								"WebSocket closed",
							),
						);
					}
					pendingRequests.clear();

					if (wasConnected) {
						emit("disconnect");
						scheduleReconnect();
					}
				};
			});
		},

		close(): void {
			shouldReconnect = false;
			if (reconnectTimeout) {
				clearTimeout(reconnectTimeout);
				reconnectTimeout = null;
			}
			stopKeepAlive();
			if (ws) {
				ws.close();
				ws = null;
			}
			isConnected = false;
		},

		async request<T>(
			request: JsonRpcRequest,
			options?: TransportRequestOptions,
		): Promise<JsonRpcResponse<T>> {
			if (!isConnected || !ws) {
				return createErrorResponse(
					request.id ?? null,
					JsonRpcErrorCode.InternalError,
					"WebSocket not connected",
				) as JsonRpcResponse<T>;
			}

			const requestWithId: JsonRpcRequest = {
				...request,
				id: request.id ?? ++requestIdCounter,
			};

			return new Promise((resolve) => {
				const requestTimeout = options?.timeout ?? timeout;
				const timeoutId = setTimeout(() => {
					pendingRequests.delete(requestWithId.id!);
					resolve(
						createErrorResponse(
							requestWithId.id ?? null,
							JsonRpcErrorCode.InternalError,
							`Request timeout after ${requestTimeout}ms`,
						) as JsonRpcResponse<T>,
					);
				}, requestTimeout);

				pendingRequests.set(requestWithId.id!, {
					resolve: resolve as (response: JsonRpcResponse) => void,
					reject: () => {},
					timeoutId,
				});

				ws!.send(JSON.stringify(requestWithId));
			});
		},

		async requestBatch<T>(
			requests: JsonRpcRequest[],
			options?: TransportRequestOptions,
		): Promise<JsonRpcResponse<T>[]> {
			if (requests.length === 0) return [];

			if (!isConnected || !ws) {
				return requests.map(
					(req) =>
						createErrorResponse(
							req.id ?? null,
							JsonRpcErrorCode.InternalError,
							"WebSocket not connected",
						) as JsonRpcResponse<T>,
				);
			}

			// WebSocket doesn't have native batch support
			// Send requests individually and collect responses
			const promises = requests.map((req) => this.request<T>(req, options));
			return Promise.all(promises);
		},

		subscribe(
			subscriptionId: string,
			callback: (data: WsNotificationPayload) => void,
		): void {
			if (!subscriptions.has(subscriptionId)) {
				subscriptions.set(subscriptionId, new Set());
			}
			subscriptions.get(subscriptionId)!.add(callback);
		},

		unsubscribe(
			subscriptionId: string,
			callback?: (data: WsNotificationPayload) => void,
		): void {
			if (callback) {
				subscriptions.get(subscriptionId)?.delete(callback);
			} else {
				subscriptions.delete(subscriptionId);
			}
		},

		on<E extends keyof TransportEvents>(
			event: E,
			listener: (...args: TransportEvents[E]) => void,
		): WebSocketTransport {
			if (!eventListeners.has(event)) {
				eventListeners.set(event, new Set());
			}
			eventListeners
				.get(event)!
				.add(listener as EventListener<keyof TransportEvents>);
			return transport;
		},

		off<E extends keyof TransportEvents>(
			event: E,
			listener: (...args: TransportEvents[E]) => void,
		): WebSocketTransport {
			eventListeners
				.get(event)
				?.delete(listener as EventListener<keyof TransportEvents>);
			return transport;
		},
	};

	return transport;
}

/**
 * WebSocket transport with additional connection methods
 */
export interface WebSocketTransport extends EventTransport {
	/** Whether the transport is currently connected */
	readonly connected: boolean;

	/** Connect to the WebSocket server */
	connect(): Promise<void>;

	/** Close the connection */
	close(): void;

	/**
	 * Register a subscription callback
	 * Called when subscription notification is received
	 */
	subscribe(
		subscriptionId: string,
		callback: (data: WsNotificationPayload) => void,
	): void;

	/**
	 * Unregister a subscription callback
	 */
	unsubscribe(
		subscriptionId: string,
		callback?: (data: WsNotificationPayload) => void,
	): void;
}
