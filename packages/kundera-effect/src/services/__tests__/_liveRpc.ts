import { Effect } from "effect";

import {
	type RequestOptions,
	type TransportErrorContext,
	type TransportRequestContext,
	type TransportResponseContext,
	withInterceptors,
} from "../TransportService.js";

export const DEFAULT_STREAM_RPC_URL =
	"https://api.cartridge.gg/x/starknet/sepolia";

export const LIVE_STREAM_RPC_URL =
	process.env.KUNDERA_EFFECT_STREAM_RPC_URL ?? DEFAULT_STREAM_RPC_URL;

export const RUN_LIVE_STREAM_TESTS =
	process.env.KUNDERA_EFFECT_RUN_LIVE_STREAM_TESTS === "1";

export const ENABLE_LIVE_STREAM_RPC_LOGS =
	process.env.KUNDERA_EFFECT_STREAM_RPC_LOGS === "1";

export const LIVE_STREAM_REQUEST_OPTIONS: RequestOptions = {
	timeoutMs: 10_000,
	retries: 1,
	retryDelayMs: 250,
};

const LOG_PREVIEW_MAX_CHARS = Number.isFinite(
	Number(process.env.KUNDERA_EFFECT_STREAM_RPC_LOG_PREVIEW_CHARS),
)
	? Math.max(
			Number(process.env.KUNDERA_EFFECT_STREAM_RPC_LOG_PREVIEW_CHARS),
			40,
		)
	: 260;

const truncate = (value: string): string =>
	value.length <= LOG_PREVIEW_MAX_CHARS
		? value
		: `${value.slice(0, LOG_PREVIEW_MAX_CHARS)}\n...truncated...`;

const toPrettyJson = (value: unknown): string => {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
};

const logHeader = (label: "REQUEST" | "RESPONSE" | "ERROR", method: string) =>
	`[LiveRPC][${new Date().toISOString()}][${label}] ${method}`;

const printPrettyField = (label: string, value: unknown): void => {
	console.log(`  ${label}:`);
	const rendered = truncate(toPrettyJson(value));
	for (const line of rendered.split("\n")) {
		console.log(`    ${line}`);
	}
};

const logRequest = (context: TransportRequestContext): void => {
	console.log(logHeader("REQUEST", context.request.method));
	console.log(`  endpoint: ${LIVE_STREAM_RPC_URL}`);
	printPrettyField("params", context.request.params ?? []);
};

const logResponse = <T>(context: TransportResponseContext<T>): void => {
	const { method } = context.request;
	console.log(
		`${logHeader("RESPONSE", method)} (${Math.round(context.durationMs)}ms)`,
	);
	if ("error" in context.response) {
		printPrettyField("error", context.response.error);
		return;
	}
	printPrettyField("result", context.response.result);
};

const logError = (context: TransportErrorContext): void => {
	console.log(
		`${logHeader("ERROR", context.request.method)} (${Math.round(context.durationMs)}ms)`,
	);
	console.log(`  endpoint: ${LIVE_STREAM_RPC_URL}`);
	printPrettyField("error", {
		tag:
			"_tag" in context.error && typeof context.error._tag === "string"
				? context.error._tag
				: undefined,
		message: context.error.message,
		code:
			"code" in context.error && typeof context.error.code === "number"
				? context.error.code
				: undefined,
		operation:
			"operation" in context.error &&
			typeof context.error.operation === "string"
				? context.error.operation
				: undefined,
		cause:
			"cause" in context.error
				? context.error.cause
				: undefined,
	});
};

export const withLiveRpcLogs = <A, E, R>(
	effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, E, R> => {
	if (!ENABLE_LIVE_STREAM_RPC_LOGS) {
		return effect;
	}

	return withInterceptors({
		onRequest: (context) =>
			Effect.sync(() => {
				logRequest(context);
				return context;
			}),
		onResponse: (context) =>
			Effect.sync(() => {
				logResponse(context);
				return context;
			}),
		onError: (context) =>
			Effect.sync(() => {
				logError(context);
			}),
	})(effect);
};
