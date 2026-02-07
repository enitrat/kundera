/**
 * WalletProvider Tests
 *
 * Tests typed provider wrapping a wallet transport.
 */

import { describe, expect, it, vi } from "vitest";
import { WalletProvider } from "./WalletProvider.js";
import { walletTransport } from "../transport/wallet.js";
import type { StarknetWindowObject } from "./wallet/types.js";

/** Create a mock SWO. */
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

describe("WalletProvider", () => {
	it("request() returns typed result for wallet_requestAccounts", async () => {
		const swo = mockSwo(() => Promise.resolve(["0xabc", "0xdef"]));
		const provider = new WalletProvider({
			transport: walletTransport(swo),
			swo,
		});

		const accounts = await provider.request({
			method: "wallet_requestAccounts",
			params: [],
		});

		expect(accounts).toEqual(["0xabc", "0xdef"]);
	});

	it("request() returns typed result for wallet_requestChainId", async () => {
		const swo = mockSwo(() => Promise.resolve("SN_MAIN"));
		const provider = new WalletProvider({
			transport: walletTransport(swo),
			swo,
		});

		const chainId = await provider.request({
			method: "wallet_requestChainId",
		});

		expect(chainId).toBe("SN_MAIN");
	});

	it("request() returns typed result for wallet_addInvokeTransaction", async () => {
		const swo = mockSwo(() => Promise.resolve({ transaction_hash: "0xtx123" }));
		const provider = new WalletProvider({
			transport: walletTransport(swo),
			swo,
		});

		const result = await provider.request({
			method: "wallet_addInvokeTransaction",
			params: [{ calls: [{ contract_address: "0x1", entry_point: "transfer", calldata: ["0x2"] }] }],
		});

		expect(result).toEqual({ transaction_hash: "0xtx123" });
	});

	it("request() throws on SWO error", async () => {
		const swo = mockSwo(() => Promise.reject(new Error("User rejected")));
		const provider = new WalletProvider({
			transport: walletTransport(swo),
			swo,
		});

		await expect(
			provider.request({ method: "wallet_requestAccounts", params: [] }),
		).rejects.toMatchObject({ message: "User rejected" });
	});

	it("on() delegates to SWO", () => {
		const swo = mockSwo();
		const provider = new WalletProvider({
			transport: walletTransport(swo),
			swo,
		});

		const handler = vi.fn();
		provider.on("accountsChanged", handler);

		expect(swo.on).toHaveBeenCalledWith("accountsChanged", handler);
	});

	it("removeListener() delegates to SWO", () => {
		const swo = mockSwo();
		const provider = new WalletProvider({
			transport: walletTransport(swo),
			swo,
		});

		const handler = vi.fn();
		provider.removeListener("networkChanged", handler);

		expect(swo.off).toHaveBeenCalledWith("networkChanged", handler);
	});

	it("on() returns this for chaining", () => {
		const swo = mockSwo();
		const provider = new WalletProvider({
			transport: walletTransport(swo),
			swo,
		});

		const result = provider.on("accountsChanged", vi.fn());
		expect(result).toBe(provider);
	});
});
