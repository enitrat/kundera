import type { RequestOptions } from "../TransportService.js";

export const DEFAULT_STREAM_RPC_URL =
	"https://api.cartridge.gg/x/starknet/sepolia";

export const LIVE_STREAM_RPC_URL =
	process.env.KUNDERA_EFFECT_STREAM_RPC_URL ?? DEFAULT_STREAM_RPC_URL;

export const RUN_LIVE_STREAM_TESTS =
	process.env.KUNDERA_EFFECT_RUN_LIVE_STREAM_TESTS === "1";

export const LIVE_STREAM_REQUEST_OPTIONS: RequestOptions = {
	timeoutMs: 10_000,
	retries: 1,
	retryDelayMs: 250,
};
