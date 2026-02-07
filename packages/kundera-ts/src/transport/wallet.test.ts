/**
 * Wallet Transport Tests
 *
 * Tests the SWO → JSON-RPC 2.0 Transport adapter.
 */

import { describe, expect, it, vi } from "vitest";
import { walletTransport } from "./wallet.js";
import { isJsonRpcError } from "./types.js";
import type { StarknetWindowObject } from "../provider/wallet/types.js";

/** Create a mock SWO with a configurable request handler. */
function mockSwo(
	requestImpl: (args: { type: string; params?: unknown }) => Promise<unknown> = () =>
		Promise.resolve(null),
): StarknetWindowObject {
	return {
		id: "mock",
		name: "Mock Wallet",
		version: "1.0.0",
		icon: "",
		request: vi.fn(requestImpl),
		on: vi.fn(),
		off: vi.fn(),
	};
}

describe("walletTransport", () => {
	it("has type 'custom'", () => {
		const transport = walletTransport(mockSwo());
		expect(transport.type).toBe("custom");
	});

	it("translates method → type in SWO request", async () => {
		const swo = mockSwo(() => Promise.resolve(["0x123"]));
		const transport = walletTransport(swo);

		await transport.request({
			jsonrpc: "2.0",
			id: 1,
			method: "wallet_requestAccounts",
			params: [],
		});

		expect(swo.request).toHaveBeenCalledWith({
			type: "wallet_requestAccounts",
			params: undefined,
		});
	});

	it("flattens single-element params array", async () => {
		const swo = mockSwo(() => Promise.resolve({ transaction_hash: "0xabc" }));
		const transport = walletTransport(swo);

		const invokeParams = { calls: [{ contract_address: "0x1", entry_point: "transfer", calldata: [] }] };
		await transport.request({
			jsonrpc: "2.0",
			id: 1,
			method: "wallet_addInvokeTransaction",
			params: [invokeParams],
		});

		expect(swo.request).toHaveBeenCalledWith({
			type: "wallet_addInvokeTransaction",
			params: invokeParams,
		});
	});

	it("passes undefined params for empty array", async () => {
		const swo = mockSwo(() => Promise.resolve("SN_MAIN"));
		const transport = walletTransport(swo);

		await transport.request({
			jsonrpc: "2.0",
			id: 1,
			method: "wallet_requestChainId",
			params: [],
		});

		expect(swo.request).toHaveBeenCalledWith({
			type: "wallet_requestChainId",
			params: undefined,
		});
	});

	it("wraps successful result in JSON-RPC envelope", async () => {
		const transport = walletTransport(mockSwo(() => Promise.resolve(["0xabc"])));

		const response = await transport.request({
			jsonrpc: "2.0",
			id: 42,
			method: "wallet_requestAccounts",
			params: [],
		});

		expect(isJsonRpcError(response)).toBe(false);
		expect(response.jsonrpc).toBe("2.0");
		expect(response.id).toBe(42);
		expect((response as { result: string[] }).result).toEqual(["0xabc"]);
	});

	it("wraps SWO error in JSON-RPC error response", async () => {
		const transport = walletTransport(
			mockSwo(() => Promise.reject(new Error("User rejected"))),
		);

		const response = await transport.request({
			jsonrpc: "2.0",
			id: 1,
			method: "wallet_addInvokeTransaction",
			params: [{ calls: [] }],
		});

		expect(isJsonRpcError(response)).toBe(true);
		if (isJsonRpcError(response)) {
			expect(response.error.message).toBe("User rejected");
			expect(response.id).toBe(1);
		}
	});

	it("handles non-Error throws", async () => {
		const transport = walletTransport(
			mockSwo(() => Promise.reject("string error")),
		);

		const response = await transport.request({
			jsonrpc: "2.0",
			id: 1,
			method: "wallet_requestAccounts",
			params: [],
		});

		expect(isJsonRpcError(response)).toBe(true);
		if (isJsonRpcError(response)) {
			expect(response.error.message).toBe("Wallet request failed");
		}
	});

	it("uses null id when request has no id", async () => {
		const transport = walletTransport(mockSwo(() => Promise.resolve("ok")));

		const response = await transport.request({
			jsonrpc: "2.0",
			method: "wallet_requestChainId",
		});

		expect(response.id).toBeNull();
	});

	describe("requestBatch", () => {
		it("executes requests sequentially (wallets don't support batch)", async () => {
			const callOrder: string[] = [];
			const swo = mockSwo(async (args) => {
				callOrder.push(args.type);
				return args.type === "wallet_requestChainId" ? "SN_MAIN" : ["0x1"];
			});

			const transport = walletTransport(swo);

			const responses = await transport.requestBatch([
				{ jsonrpc: "2.0", id: 1, method: "wallet_requestAccounts", params: [] },
				{ jsonrpc: "2.0", id: 2, method: "wallet_requestChainId", params: [] },
			]);

			expect(responses).toHaveLength(2);
			expect((responses[0] as { result: string[] }).result).toEqual(["0x1"]);
			expect((responses[1] as { result: string }).result).toBe("SN_MAIN");
			expect(callOrder).toEqual(["wallet_requestAccounts", "wallet_requestChainId"]);
		});
	});
});
