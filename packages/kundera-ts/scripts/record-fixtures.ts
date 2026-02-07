/**
 * Record RPC Fixtures
 *
 * Hits a real Starknet mainnet RPC endpoint and saves raw JSON-RPC responses
 * as fixture files for integration testing.
 *
 * Usage:
 *   npx tsx scripts/record-fixtures.ts
 *   npx tsx scripts/record-fixtures.ts --rpc-url https://your-node.com/rpc/v0_8
 *
 * Fixtures are saved to fixtures/rpc/<method>.json
 * Block/tx hashes are hardcoded — mainnet is immutable, so re-running is idempotent.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(__dirname, "..", "fixtures", "rpc");

const DEFAULT_RPC_URL =
	"https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/demo";

// --- Pinned mainnet data (immutable) ---
// Block 800000 — 14 txs, mix of INVOKE_V3
const BLOCK_NUMBER = 800000;
const BLOCK_HASH =
	"0x17614e0ede412d9cd2c3025810fc2655e333a0d11a11c4f04c64eb6bf89cd40";

// INVOKE_V3 tx from block 800000
const INVOKE_TX_HASH =
	"0x44400b45a0d6aa7b74c466a6f39bdb5f6b542e1adf608bb8ea6700d1ffae9f3";

// ETH ERC-20 contract on mainnet
const ETH_CONTRACT =
	"0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

// --- RPC helper ---
async function rpcCall(
	url: string,
	method: string,
	params?: unknown[],
): Promise<unknown> {
	const body = {
		jsonrpc: "2.0",
		id: 1,
		method,
		...(params !== undefined ? { params } : {}),
	};
	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
	return res.json();
}

// --- Fixture definitions ---
interface FixtureDef {
	method: string;
	params?: unknown[];
	/** filename override (default: method name without starknet_ prefix) */
	filename?: string;
}

const fixtures: FixtureDef[] = [
	// Smoke tests (no params or simple params)
	{ method: "starknet_blockNumber" },
	{ method: "starknet_blockHashAndNumber" },
	{ method: "starknet_chainId" },
	{ method: "starknet_specVersion" },
	{ method: "starknet_syncing" },

	// Block methods — all use same block for consistency
	{
		method: "starknet_getBlockWithTxHashes",
		params: [{ block_hash: BLOCK_HASH }],
	},
	{
		method: "starknet_getBlockWithTxs",
		params: [{ block_hash: BLOCK_HASH }],
	},
	{
		method: "starknet_getBlockWithReceipts",
		params: [{ block_hash: BLOCK_HASH }],
	},
	{
		method: "starknet_getBlockTransactionCount",
		params: [{ block_hash: BLOCK_HASH }],
	},

	// Transaction methods
	{
		method: "starknet_getTransactionByHash",
		params: [INVOKE_TX_HASH],
		filename: "getTransactionByHash_invoke",
	},
	{ method: "starknet_getTransactionReceipt", params: [INVOKE_TX_HASH] },
	{ method: "starknet_getTransactionStatus", params: [INVOKE_TX_HASH] },

	// State
	{
		method: "starknet_getStateUpdate",
		params: [{ block_hash: BLOCK_HASH }],
	},

	// Events — filter by our pinned block
	{
		method: "starknet_getEvents",
		params: [
			{
				from_block: { block_number: BLOCK_NUMBER },
				to_block: { block_number: BLOCK_NUMBER },
				chunk_size: 10,
			},
		],
	},

	// Fee estimation — replay the first INVOKE_V3 from our block at that block
	{
		method: "starknet_estimateFee",
		params: [
			[
				{
					type: "INVOKE",
					version: "0x3",
					sender_address:
						"0xbd15f2ccc720ec710b6065a8c48bab4ccdcff1887d819ee587d998e40cafcd",
					calldata: [
						"0x1",
						ETH_CONTRACT,
						// selector for 'balanceOf'
						"0x02e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e",
						"0x1",
						"0xbd15f2ccc720ec710b6065a8c48bab4ccdcff1887d819ee587d998e40cafcd",
					],
					nonce: "0xec",
					signature: [],
					resource_bounds: {
						l1_gas: { max_amount: "0x100", max_price_per_unit: "0x100000000" },
						l2_gas: { max_amount: "0x0", max_price_per_unit: "0x0" },
						l1_data_gas: { max_amount: "0x0", max_price_per_unit: "0x0" },
					},
					tip: "0x0",
					paymaster_data: [],
					account_deployment_data: [],
					nonce_data_availability_mode: "L1",
					fee_data_availability_mode: "L1",
				},
			],
			["SKIP_VALIDATE"],
			{ block_number: BLOCK_NUMBER },
		],
	},

	// Trace
	{ method: "starknet_traceTransaction", params: [INVOKE_TX_HASH] },
	{
		method: "starknet_traceBlockTransactions",
		params: [{ block_hash: BLOCK_HASH }],
	},

	// Class
	{
		method: "starknet_getClassAt",
		params: [{ block_number: BLOCK_NUMBER }, ETH_CONTRACT],
	},

	// Storage + nonce
	{
		method: "starknet_getStorageAt",
		params: [ETH_CONTRACT, "0x0", { block_number: BLOCK_NUMBER }],
	},
	{
		method: "starknet_getNonce",
		params: [
			{ block_number: BLOCK_NUMBER },
			"0xbd15f2ccc720ec710b6065a8c48bab4ccdcff1887d819ee587d998e40cafcd",
		],
	},
];

// --- Main ---
async function main() {
	const rpcUrl = process.argv.includes("--rpc-url")
		? process.argv[process.argv.indexOf("--rpc-url") + 1]!
		: DEFAULT_RPC_URL;

	mkdirSync(FIXTURE_DIR, { recursive: true });

	console.log(`Recording fixtures from ${rpcUrl}`);
	console.log(`Output: ${FIXTURE_DIR}\n`);

	let success = 0;
	let failed = 0;

	for (const fixture of fixtures) {
		const filename =
			fixture.filename ?? fixture.method.replace("starknet_", "");
		const filepath = join(FIXTURE_DIR, `${filename}.json`);

		try {
			const response = await rpcCall(rpcUrl, fixture.method, fixture.params);
			writeFileSync(filepath, JSON.stringify(response, null, 2) + "\n");
			console.log(`  ✓ ${filename}`);
			success++;
		} catch (err) {
			console.error(
				`  ✗ ${filename}: ${err instanceof Error ? err.message : err}`,
			);
			failed++;
		}
	}

	console.log(`\nDone: ${success} recorded, ${failed} failed`);
	if (failed > 0) process.exit(1);
}

main();
